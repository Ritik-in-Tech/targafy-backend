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

const acceptUserJoinRequest = asyncHandler(async (req, res) => {
  const { role, userId } = req.body;
  const businessId = req.params.businessId;
  // console.log(businessId);
  const parentId = req.user._id;
  console.log(parentId);
  const acceptedByName = req.user.name;
  console.log(acceptedByName);

  try {
    // Input validation
    if (!parentId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Token expired you have to Log in again")
        );
    }
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business Id is not found in params"));
    }
    if (!role || !userId || !acceptedByName) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Fill role, userId, and acceptedByName in req.body!!"
          )
        );
    }

    // console.log(role);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Step 1: Find the parent user
      const parentUser = await Businessusers.findOne({
        businessId: businessId,
        userId: parentId,
      });

      if (!parentUser) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Parent user not found"));
      }

      // Step 2: Check if the user to add already exists in the business
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
            new ApiResponse(401, {}, "The user already exists in the business!")
          );
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

      const userContactNumber = user?.contactNumber;
      const userName = user?.name;

      if (!userContactNumber || !userName) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(new ApiResponse(400, {}, "Incomplete user information!"));
      }

      const business = await Business.findOne({ _id: businessId });

      if (!business || !business?.name) {
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
        name: userName,
        contactNumber: userContactNumber,
        userType: "Insider",
        subordinates: [],
        allSubordinates: [],
        groupsJoined: [],
        activityViewCounter: 0,
      };

      const newBusiness = {
        name: business?.name,
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

      await Businessusers.create(newUser);

      // Step 4: Update parent user and business entities
      const updateQuery =
        parentUser.role == "Admin"
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

      await Acceptedrequests.create(acceptedRequest);

      //   const emitData = {
      //     content: `Congratulation, you are added in ${business.name} successfully🥳🥳`,
      //     notificationCategory: "business",
      //     createdDate: getCurrentUTCTime(),
      //     businessName: business.name,
      //     businessId: businessId,
      //   };

      //   emitNewNotificationAndAddBusinessEvent(
      //     userId,
      //     businessId,
      //     emitData,
      //     newBusiness
      //   );

      await session.commitTransaction();
      session.endSession();

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
