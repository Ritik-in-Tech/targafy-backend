import { Group } from "../../models/group.model.js";
import { Business } from "../../models/business.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Params } from "../../models/params.model.js";
import mongoose from "mongoose";

// Create a new group
const createGroup = asyncHandler(async (req, res) => {
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

    if (businessusers.role !== "Admin") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Only admin has access to create group")
        );
    }

    const { groupName, logo, usersIds, parameterAssigned } = req.body;

    if (
      !groupName ||
      !logo ||
      !Array.isArray(usersIds) ||
      usersIds.length === 0 ||
      !parameterAssigned
    ) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all the fields"));
    }

    const param = await Params.findOne({ name: parameterAssigned, businessId });
    if (!param) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "The provided groupName does not exist in the params table"
          )
        );
    }

    const existingGroup = await Group.findOne({
      groupName: groupName,
      businessId: businessId,
      parameterAssigned: parameterAssigned,
    });

    if (existingGroup) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Already there is a group with the same name and in the same business with the same paramter assigned"
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
      groupName,
      logo,
      businessId: business._id,
      userAdded,
      parameterAssigned,
    });

    await group.save({ session });

    business.groups.push({
      name: groupName,
      groupId: group._id,
      parameterAssigned: parameterAssigned,
    });
    await business.save({ session });

    param.subOrdinateGroups.push({
      groupName: groupName,
      groupId: group._id,
    });

    await param.save({ session });

    const groupData = {
      groupName: groupName,
      groupId: group._id,
      parameterAssigned: parameterAssigned,
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

// create subgroup
const createSubGroup = asyncHandler(async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    if (!loggedInUserId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }

    const parentGroupId = req.params.parentGroupId;
    if (!parentGroupId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide parent group Id in req.params"
          )
        );
    }

    const parentGroup = await Group.findById(parentGroupId);
    if (!parentGroup) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Parent group does not exist"));
    }

    const businessId = parentGroup.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business ID not found"));
    }

    const businessuser = await Businessusers.findOne({
      userId: loggedInUserId,
      businessId: businessId,
    });
    if (businessuser.role === "User") {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "You do not have permission to do this!")
        );
    }

    const { subgroupName, logo, usersIds } = req.body;
    if (
      !subgroupName ||
      !usersIds ||
      !Array.isArray(usersIds) ||
      usersIds.length === 0
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all the fields"));
    }

    const existingSubGroups = await Group.findOne({
      groupName: subgroupName,
      businessId: businessId,
      parentGroupId: parentGroupId,
    });

    if (existingSubGroups) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "There is already subgroup name with the same name in the business"
          )
        );
    }
    // Validate if users exist in the parent group
    const parentGroupUserIds = parentGroup.userAdded.map((user) =>
      user.userId.toString()
    );
    for (const userId of usersIds) {
      if (!parentGroupUserIds.includes(userId)) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `User with id ${userId} does not exist in the parent group`
            )
          );
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const subGroup = new Group({
        groupName: subgroupName,
        logo,
        parameterAssigned: parentGroup.parameterAssigned,
        businessId: businessId,
        parentGroupId: parentGroupId,
        userAdded: usersIds.map((userId) => ({
          userId: new mongoose.Types.ObjectId(userId), // Use 'new' keyword
          name: parentGroup.userAdded.find(
            (user) => user.userId.toString() === userId
          ).name,
        })),
      });

      await subGroup.save({ session });

      parentGroup.subordinateGroups.push({
        subordinategroupName: subgroupName,
        subordinateGroupId: subGroup._id,
      });
      await parentGroup.save({ session });

      for (const userId of usersIds) {
        await Businessusers.findOneAndUpdate(
          { userId: userId, businessId },
          {
            $push: {
              groupsJoined: {
                groupName: subgroupName,
                groupId: subGroup._id,
                parameterAssigned: parentGroup.parameterAssigned,
              },
            },
          },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return res
        .status(201)
        .json(
          new ApiResponse(201, { subGroup }, "Subgroup created successfully")
        );
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { createGroup, createSubGroup };
