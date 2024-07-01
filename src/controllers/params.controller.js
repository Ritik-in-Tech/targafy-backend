import { Params } from "../models/params.model.js";
import { Business } from "../models/business.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Businessusers } from "../models/businessUsers.model.js";
import mongoose from "mongoose";

// Create a new param
const createParam = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, charts, duration, description, userIds } = req.body;

    // Validate required fields
    if (!name || !charts || !duration || !description || !userIds) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all required fields"));
    }
    const userId = req.user._id;

    // Validate duration field
    const validDurations = ["1stTo31st", "upto30days", "30days"];
    if (!validDurations.includes(duration)) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid duration value"));
    }

    const businessId = req.params.businessId;
    const business = await Business.findById(businessId).session(session);

    // Validate business existence
    if (!business) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide a valid businessId"));
    }
    const businessUsers = await Businessusers.findOne({
      userId: userId,
      businessId: businessId,
    }).session(session);

    if (businessUsers.role !== "Admin") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Only Admin can assign the targets for the params"
          )
        );
    }

    // Check if the param name already exists for the business
    const existingParam = business.params.find((param) => param.name === name);
    if (existingParam) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Param name already exists for this business"
          )
        );
    }

    // Validate usernames and map to userIds
    const validUserIds = [];
    const usersAssigned = [];
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
      // if (businessUser.role === "Admin") {
      //   await session.abortTransaction();
      //   session.endSession();
      //   return res
      //     .status(400)
      //     .json(
      //       new ApiResponse(
      //         400,
      //         {},
      //         "Admin can't assign itself as a parameters user"
      //       )
      //     );
      // }
      validUserIds.push(user._id);
      usersAssigned.push({ userId: user._id, name: user.name });
    }

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

    // Create a new Params document
    const param = new Params({
      name,
      businessId: business._id,
      charts,
      duration,
      description,
      usersAssigned,
    });

    // Save the Params document to the database
    await param.save({ session });

    // const group = new Group({
    //   groupName: name,
    //   // logo,
    //   businessId: business._id,
    //   userAdded: usersAssigned,
    // });

    // await group.save({ session });

    // business.groups.push({ name: name, groupId: group._id });
    // await business.save({ session });

    // const groupData = { groupName: name, groupId: group._id };

    // // Update businessusers documents for each user in userAdded array
    // for (const { userId } of usersAssigned) {
    //   const businessUser = await Businessusers.findOneAndUpdate(
    //     { userId, businessId },
    //     { $push: { groupsJoined: groupData } },
    //     { new: true, session }
    //   );

    //   if (!businessUser) {
    //     await session.abortTransaction();
    //     session.endSession();
    //     return res
    //       .status(400)
    //       .json(
    //         new ApiResponse(
    //           400,
    //           {},
    //           `User with id ${userId} is not associated with this business`
    //         )
    //       );
    //   }
    // }

    // Add the parameter name and id to the business.params array
    business.params.push({ name, paramId: param._id });

    // Save the updated Business document
    await business.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(201, { param }, "Param created successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal Server Error"));
  }
});

// Get all params
const getAllParams = asyncHandler(async (req, res) => {
  try {
    const id = req.params.businessId;
    const business = await Business.findOne({ _id: id });
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const params = business.params;
    return res
      .status(200)
      .json(new ApiResponse(200, { params }, "Param fetched successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// get params and the number of assigned users to specifc business
const getAssignedParams = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const business = await Business.findById(businessId);

    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    // Retrieve the Params documents associated with the business
    const paramsDetails = await Params.find({ businessId: business._id });

    // Construct the response
    const response = paramsDetails.map((param) => ({
      id: param._id,
      name: param.name,
      assignedUsersCount: param.usersAssigned.length,
      usersAssigned: param.usersAssigned.map((user) => ({
        name: user.name,
        userId: user.userId,
      })),
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          response,
          "Assigned parameters retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// get user assigned to specific params of a business
const getAssignUsers = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            response,
            "Token is not valid! Please log in again"
          )
        );
    }

    const paramName = req.params.paramName;
    const businessId = req.params.businessId;

    if (!paramName || !businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            response,
            "Please provide paramName and businessId in req params"
          )
        );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            response,
            "business with the given Id does not exist"
          )
        );
    }

    // console.log(userId);
    // console.log(businessId);
    const businessusers = await Businessusers.findOne({
      userId: userId,
      businessId: businessId,
    });

    if (!businessusers) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Provided business Id and userID are not in the business"
          )
        );
    }
    // console.log(businessusers);
    console.log(businessusers.role);
    if (businessusers.role !== "Admin" && businessusers.role !== "MiniAdmin") {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {},
            "Only Admin and MiniAdmin can allow to access this operation"
          )
        );
    }

    const paramDetails = await Params.findOne({
      name: paramName,
      businessId: businessId,
    });

    if (!paramDetails) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Provided param name and business Id not exist simultaneously"
          )
        );
    }

    // Extract the list of assigned users
    const assignedUsers = paramDetails.usersAssigned.map((user) => ({
      name: user.name,
      userId: user.userId,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          assignedUsers,
          "Users assigned fetched successfully"
        )
      );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          {},
          "An error occurred while fetching the assigned users"
        )
      );
  }
});

// Get param by ID
const getParamById = asyncHandler(async (req, res) => {
  try {
    const { bid, pid } = req.params;
    const business = await Business.findOne({ _id: bid });
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const param = business.params.find((param) => param._id == pid);
    if (!param) {
      return res.status(404).json(new ApiResponse(404, {}, "Param not found"));
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, { param }, "Param by id fetched successfully")
      );
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Update param by ID
const updateParam = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    const { bid, pid } = req.params;
    const updateFields = req.body;
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const param = business.params.find((param) => param._id == pid);
    if (!param) {
      return res.status(404).json(new ApiResponse(404, {}, "param not found"));
    }
    Object.keys(updateFields).forEach((key) => {
      if (param[key] !== undefined) {
        param[key] = updateFields[key];
      }
    });
    await business.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { param }, "Param updated successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Delete param by ID
const deleteParam = asyncHandler(async (req, res) => {
  const id = req.params.id;
  try {
    const { bid, pid } = req.params;
    const business = await Business.findById(bid);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }
    const paramIndex = business.params.indexOf(pid);
    business.params.splice(paramIndex, 1);
    await business.save();
    if (!deletedParam) {
      return res.status(404).json(new ApiResponse(404, {}, "Param not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Param deleted successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

const getParamId = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Business Id is not provided in the params")
        );
    }
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token! Please log in again"));
    }
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business not exist for the provided business Id"
          )
        );
    }
    const paramDetails = await Params.find({ businessId: businessId });
    if (paramDetails.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            {},
            "No params found for the provided business Id"
          )
        );
    }
    // console.log(paramDetails);

    const formattedParams = paramDetails.map((param) => ({
      _id: param._id,
      name: param.name,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { params: formattedParams },
          "Params fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export {
  createParam,
  getAllParams,
  getParamById,
  updateParam,
  deleteParam,
  getAssignedParams,
  getAssignUsers,
  getParamId,
};
