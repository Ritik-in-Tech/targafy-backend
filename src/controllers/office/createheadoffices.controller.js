import { Group } from "../../models/group.model.js";
import { Business } from "../../models/business.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import mongoose from "mongoose";

// Create a new group
export const createHeadGroups = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const loggedInUserId = req.user._id;
    if (!loggedInUserId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }

    const loggedInUserDetails = await User.findById(loggedInUserId).session(
      session
    );
    if (!loggedInUserDetails) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(new ApiResponse(400, {}, "User not exist"));
    }

    const businessId = req.params.businessId;
    if (!businessId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business id is not provided"));
    }

    const business = await Business.findById(businessId).session(session);
    if (!business) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not exist"));
    }

    const businessusers = await Businessusers.findOne({
      businessId: businessId,
      userId: loggedInUserId,
    }).session(session);

    if (!businessusers) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Logged in user is not associated with the provided business"
          )
        );
    }

    if (businessusers.role === "User") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Only admin and mini Admin has access to create group"
          )
        );
    }

    const { headGroupName, logo, usersIds } = req.body;

    if (!headGroupName || !Array.isArray(usersIds) || usersIds.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all the fields"));
    }

    const existingHeadGroup = await Group.findOne({
      groupName: headGroupName,
      businessId: businessId,
    });

    if (existingHeadGroup) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Already there is a Head Group with the same name and in the same business"
          )
        );
    }

    // Validate usernames and map to userIds
    const validUserIds = [];
    const userAdded = [];
    for (const userId of usersIds) {
      const user = await User.findOne({ _id: userId }).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, `User with id ${userId} does not exist`)
          );
      }
      const businessUser = await Businessusers.findOne({
        userId: user._id,
        businessId,
      }).session(session);
      if (!businessUser) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `User with id ${userId} is not associated with this business`
            )
          );
      }
      validUserIds.push(user._id);
      userAdded.push({ userId: user._id, name: user.name });
    }
    // console.log(validUserIds);

    if (validUserIds.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Not any selected user exists in this business"
          )
        );
    }

    const group = new Group({
      groupName: headGroupName,
      logo: logo || "",
      businessId: business._id,
      userAdded,
    });

    await group.save({ session });

    business.groups.push({
      name: headGroupName,
      groupId: group._id,
      // parameterAssigned: parameterAssigned,
    });
    await business.save({ session });

    // param.subOrdinateGroups.push({
    //   groupName: groupName,
    //   groupId: group._id,
    // });

    // await param.save({ session });

    const groupData = {
      groupName: headGroupName,
      groupId: group._id,
      // parameterAssigned: parameterAssigned,
    };

    // Update businessusers documents for each user in userAdded array
    for (const { userId } of userAdded) {
      const businessUser = await Businessusers.findOneAndUpdate(
        { userId, businessId },
        { $push: { groupsJoined: groupData } },
        { new: true, session }
      );

      if (!businessUser) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `User with id ${userId} is not associated with this business`
            )
          );
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(201, { group }, "Group created successfully"));
  } catch (error) {
    console.error("Error:", error);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});
