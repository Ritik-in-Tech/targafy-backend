import mongoose from "mongoose";
const { startSession } = mongoose;
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Requests } from "../../models/requests.model.js";
import { Acceptedrequests } from "../../models/acceptedRequests.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { emitNewNotificationAndAddBusinessEvent } from "../../sockets/notification_socket.js";
import { getCurrentIndianTime } from "../../utils/helpers/time.helper.js";
import { Params } from "../../models/params.model.js";

const acceptUserJoinRequest = asyncHandler(async (req, res) => {
  const { role, userId, parentId, paramIds } = req.body;
  const businessId = req.params.businessId;
  const acceptedByName = req.user.name;

  if (!acceptedByName) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Token expired. Please log in again."));
  }

  try {
    // Input validation
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business Id is not found in params"));
    }
    if (!role || !userId || !parentId || !paramIds) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Fill role, userId, parentId and paramIds in req.body!"
          )
        );
    }

    if (!Array.isArray(paramIds)) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Department Ids must be in array format")
        );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Step 1: Check if the user to add already exists in the business

      const userToAdd = await Businessusers.findOne({
        businessId: businessId,
        userId: userId,
      });

      if (userToAdd) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(401)
          .json(
            new ApiResponse(401, {}, "The user already exists in the business")
          );
      }

      const user = await User.findById(userId);

      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "The user to add no longer exists!"));
      }

      const userContactNumber = user.contactNumber;
      const userName = user.name;

      if (!userContactNumber || !userName) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Incomplete user information!"));
      }

      const business = await Business.findOne({ _id: businessId });

      if (!business || !business.name) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "The business does not exist!"));
      }

      const parentUser = await Businessusers.findOne({
        businessId: businessId,
        userId: parentId,
      });

      if (!parentUser) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(401)
          .json(
            new ApiResponse(
              401,
              {},
              "Parent is not associated with the same business as the user you want to add"
            )
          );
      }

      const validParamId = [];
      const uniqueDepartmentIds = new Set();

      for (const paramId of paramIds) {
        console.log("The paramIds Ids are:", paramId);
        const param = await Params.findById(paramId);
        if (!param) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(401)
            .json(new ApiResponse(401, {}, "Param does not exist"));
        }

        const userAlreadyAssigned = param.usersAssigned.some(
          (user) => user.userId.toString() === userId.toString()
        );

        if (userAlreadyAssigned) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(400)
            .json(
              new ApiResponse(400, {}, "User is already assigned to this param")
            );
        }

        param.usersAssigned.push({ name: user.name, userId: userId });
        await param.save({ session });

        validParamId.push(paramId);

        for (const deptId of param.departmentId) {
          uniqueDepartmentIds.add(deptId.toString());
        }
      }

      const departmentId = Array.from(uniqueDepartmentIds);
      console.log(departmentId);

      const newUser = {
        role,
        userId,
        businessId,
        parentId: parentId,
        departmentId: departmentId,
        paramId: validParamId,
        name: userName,
        contactNumber: userContactNumber,
        userType: "Insider",
        subordinates: [],
        allSubordinates: [],
      };

      await Businessusers.create([newUser], { session });

      const updateQuery =
        parentUser.role === "Admin"
          ? {
              businessId: businessId,
              role: "Admin",
            }
          : {
              businessId: businessId,
              userId: parentId,
            };

      await Businessusers.updateMany(
        updateQuery,
        {
          $push: { subordinates: userId, allSubordinates: userId },
        },
        { session }
      );

      await Businessusers.updateMany(
        {
          businessId: businessId,
          allSubordinates: parentId,
        },
        { $addToSet: { allSubordinates: userId } },
        { session }
      );

      const newBusiness = {
        name: business.name,
        userType: "Insider",
        businessId: businessId,
      };

      const acceptedRequest = {
        businessId: businessId,
        userId: userId,
        name: userName,
        contactNumber: userContactNumber,
        acceptedBy: {
          name: acceptedByName,
          id: req.user._id,
        },
      };

      await User.updateOne(
        { _id: userId },
        {
          $push: { businesses: newBusiness },
        },
        { session }
      );

      await Requests.deleteOne(
        { businessId: businessId, userId: userId },
        { session }
      );

      await Acceptedrequests.create([acceptedRequest], { session });

      const emitData = {
        content: `Congratulations, ${user.name} have been added to ${business.name} successfully 🥳🥳`,
        notificationCategory: "business",
        createdDate: getCurrentIndianTime(),
        businessName: business.name,
        businessId: businessId,
      };

      emitNewNotificationAndAddBusinessEvent(
        userId,
        businessId,
        emitData,
        newBusiness
      );

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      const newBusinessUser = await Businessusers.findOne({
        businessId: businessId,
        userId: userId,
      });

      if (newBusinessUser) {
        newBusinessUser.notificationViewCounter += 1;
        await newBusinessUser.save();
      }

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "User added successfully!!"));
    } catch (error) {
      console.error("Error:", error);
      await session.abortTransaction();
      session.endSession();
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "Internal Server Error"));
    }
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { acceptUserJoinRequest };
