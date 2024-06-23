import { Group } from "../../models/group.model.js";
import { Business } from "../../models/business.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Params } from "../../models/params.model.js";
import mongoose from "mongoose";
import { Office } from "../../models/office.model.js";

// Create a new group
const createHeadOffice = asyncHandler(async (req, res) => {
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

    const { headOfficeName, logo, usersIds } = req.body;

    if (!headOfficeName || !Array.isArray(usersIds) || usersIds.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all the fields"));
    }

    // const param = await Params.findOne({ name: parameterAssigned, businessId });
    // if (!param) {
    //   await session.abortTransaction();
    //   session.endSession();
    //   return res
    //     .status(400)
    //     .json(
    //       new ApiResponse(
    //         400,
    //         {},
    //         "The provided groupName does not exist in the params table"
    //       )
    //     );
    // }

    const existingHeadOffice = await Group.findOne({
      officeName: headOfficeName,
      businessId: businessId,
    });

    if (existingHeadOffice) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Already there is a Head Office with the same name and in the same business"
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
      officeName: headOfficeName,
      logo: logo || "",
      businessId: business._id,
      userAdded,
    });

    await group.save({ session });

    business.groups.push({
      name: headOfficeName,
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
      groupName: headOfficeName,
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

// create subgroup
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

export { createHeadOffice, createSubOffices };
