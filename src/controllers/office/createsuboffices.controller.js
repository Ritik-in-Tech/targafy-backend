import { Business } from "../../models/business.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import mongoose from "mongoose";
import { Office } from "../../models/office.model.js";
import { Group } from "../../models/group.model.js";

const createSubOffices = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const businessId = req.params.businessId;
    const { officesArray } = req.body;

    // Validate request body
    if (
      !officesArray ||
      !Array.isArray(officesArray) ||
      officesArray.length === 0
    ) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "officesArray must be a non-empty array")
        );
    }

    const isValidOfficesArray = officesArray.every(
      (office) =>
        Array.isArray(office) &&
        office.length === 2 &&
        typeof office[0] === "string" &&
        office[0].trim() !== "" &&
        typeof office[1] === "string"
    );

    if (!isValidOfficesArray) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "officesArray must contain pairs of [office, parent office], where office is a non-empty string and parent office is a string"
          )
        );
    }

    // Validate businessId
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide businessId in params"));
    }

    // Fetch the business
    const business = await Business.findById(businessId).session(session);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business does not exist"));
    }

    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User does not exist"));
    }

    const businessusers = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });
    // console.log(businessusers.role);

    if (!businessusers) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Logged in user is not associated with the business"
          )
        );
    }

    if (businessusers.role !== "Admin" && businessusers.role !== "MiniAdmin") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Only admin and miniadmin have access to create offices"
          )
        );
    }

    const createdOffices = [];

    for (const [officeName, parentOfficeName] of officesArray) {
      // Check if the office already exists for this business
      const existingOffice = await Office.findOne({
        businessId: businessId,
        officeName: officeName,
      }).session(session);

      if (existingOffice) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `Office '${officeName}' already exists for this business`
            )
          );
      }

      let parentOfficeId = null;
      let parentOffice;
      if (parentOfficeName) {
        // Find the parent office
        parentOffice = await Office.findOne({
          businessId: businessId,
          officeName: parentOfficeName,
        }).session(session);

        if (!parentOffice) {
          await session.abortTransaction();
          session.endSession();
          return res
            .status(400)
            .json(
              new ApiResponse(
                400,
                {},
                `Parent office '${parentOfficeName}' not found`
              )
            );
        }

        parentOfficeId = parentOffice._id;
      }
      // console.log(parentOfficeId);

      // Create the new office
      const newOffice = new Office({
        officeName: officeName,
        businessId: businessId,
        parentOfficeId: parentOfficeId,
      });
      // console.log(newOffice);

      await newOffice.save({ session });

      if (parentOffice) {
        parentOffice.subordinateOffice.push({
          subordinateofficeName: newOffice.officeName,
          subordinateOfficeId: newOffice._id,
        });
        parentOffice.allsubordinateOffices.push({
          subordinateofficeName: newOffice.officeName,
          subordinateOfficeId: newOffice._id,
        });
        await parentOffice.save({ session });

        // Update all ancestors' allSubordinates
        let currentParent = parentOffice;
        while (currentParent.parentOfficeId) {
          currentParent = await Office.findById(
            currentParent.parentOfficeId
          ).session(session);
          currentParent.allsubordinateOffices.push({
            subordinateofficeName: newOffice.officeName,
            subordinateOfficeId: newOffice._id,
          });
          await currentParent.save({ session });
        }
      }
      createdOffices.push(newOffice);
    }

    // If we've reached this point, all offices were created successfully
    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(
        new ApiResponse(201, { createdOffices }, "Offices created successfully")
      );
  } catch (error) {
    // Abort the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    console.log(error);

    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export const createSubGroups = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const businessId = req.params.businessId;
    const { groupName, logo, userIds, parentGroupId } = req.body;

    // Validate request body
    if (
      !groupName ||
      !userIds ||
      !Array.isArray(userIds) ||
      userIds.length === 0 ||
      !parentGroupId
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Provide all the required fields"));
    }

    // Validate businessId
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide businessId in params"));
    }

    // Fetch the business
    const business = await Business.findById(businessId).session(session);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business does not exist"));
    }

    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User does not exist"));
    }

    const businessusers = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });
    // console.log(businessusers.role);

    if (!businessusers) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Logged in user is not associated with the business"
          )
        );
    }

    if (businessusers.role !== "Admin" && businessusers.role !== "MiniAdmin") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Only admin and miniadmin have access to create offices"
          )
        );
    }

    const parentGroupDetail = await Group.findById(parentGroupId);
    if (!parentGroupDetail) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Parent group not found"));
    }

    const parentGroupName = parentGroupDetail.groupName;

    const existingGroup = await Group.findOne({
      businessId: businessId,
      groupName: groupName,
      parentGroupName: parentGroupName,
    }).session(session);

    if (existingGroup) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            `Group '${groupName}' already exists for this business`
          )
        );
    }

    const validUserIds = [];
    const userAdded = [];
    for (const userId of userIds) {
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

    // Create the new group
    const newGroup = new Group({
      groupName: groupName,
      businessId: businessId,
      parentGroupId: parentGroupId,
      parentGroupName: parentGroupName,
      userAdded: userAdded,
    });
    // console.log(newOffice);

    await newGroup.save({ session });

    if (parentGroupDetail) {
      parentGroupDetail.subordinateGroups.push({
        subordinategroupName: newGroup.groupName,
        subordinateGroupId: newGroup._id,
      });
      parentGroupDetail.allsubordinateGroups.push({
        subordinategroupName: newGroup.groupName,
        subordinateGroupId: newGroup._id,
      });
      await parentGroupDetail.save({ session });

      // Update all ancestors' allSubordinates
      let currentParent = parentGroupDetail;
      while (currentParent.parentGroupId) {
        currentParent = await Group.findById(
          currentParent.parentGroupId
        ).session(session);
        currentParent.allsubordinateGroups.push({
          subordinategroupName: newGroup.groupName,
          subordinateGroupId: newGroup._id,
        });
        await currentParent.save({ session });
      }
    }

    // If we've reached this point, all offices were created successfully
    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(201, { newGroup }, "Group created successfully"));
  } catch (error) {
    // Abort the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    console.log(error);

    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export { createSubOffices };
