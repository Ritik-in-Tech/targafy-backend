import mongoose from "mongoose";
const { startSession } = mongoose;

import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Requests } from "../../models/requests.model.js";
import { Acceptedrequests } from "../../models/acceptedRequests.model.js";

// Response and Error handling
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { emitNewNotificationAndAddBusinessEvent } from "../../sockets/notification_socket.js";
import {
  getCurrentIndianTime,
  getCurrentUTCTime,
} from "../../utils/helpers/time.helper.js";
import { Office } from "../../models/office.model.js";
import { Department } from "../../models/department.model.js";

const acceptUserJoinRequest = asyncHandler(async (req, res) => {
  const { role, userId, parentId, departmentId } = req.body;
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
    if (!role || !userId || !parentId || !departmentId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Fill role, userId, parentId and departmentId  in req.body!"
          )
        );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Step 1: Find the parent user
      const parentUser = await Businessusers.findOne({
        businessId: businessId,
        userId: parentId,
        departmentId: departmentId,
      });

      if (!parentUser) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "Parent user not found with this business id and department Id"
            )
          );
      }

      // Step 2: Check if the user to add already exists in the business

      const userToAdd = await Businessusers.findOne({
        businessId: businessId,
        userId: userId,
        // departmentId: departmentId,
      });

      if (userToAdd) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(401)
          .json(
            new ApiResponse(
              401,
              {},
              "The user already exists in the business and as an user is associated with any of the only departments"
            )
          );
      }

      const department = await Department.findById(departmentId);
      if (!department) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(401)
          .json(new ApiResponse(401, {}, "Department does not exist"));
      }

      // Step 3: Create new user and business entities
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

      const newUser = {
        role,
        userId,
        businessId,
        parentId,
        departmentId: departmentId,
        name: userName,
        contactNumber: userContactNumber,
        userType: "Insider",
        subordinates: [],
        allSubordinates: [],
      };

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

      await Businessusers.create([newUser], { session });

      // Step 4: Update parent user and business entities
      const updateQuery =
        parentUser.role === "Admin"
          ? { businessId: businessId, role: "Admin" }
          : { businessId: businessId, userId: parentId };

      await Businessusers.updateMany(
        updateQuery,
        {
          $push: { subordinates: userId, allSubordinates: userId },
        },
        { session }
      );

      await Businessusers.updateMany(
        { businessId: businessId, allSubordinates: parentId },
        { $addToSet: { allSubordinates: userId } },
        { session }
      );

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

      // parentUser.notificationViewCounter += 1;
      // await parentUser.save();

      const emitData = {
        content: `Congratulations, ${user.name} have been added to ${business.name} successfully! in the ${department.name} department 🥳🥳`,
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
        departmentId: departmentId,
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
