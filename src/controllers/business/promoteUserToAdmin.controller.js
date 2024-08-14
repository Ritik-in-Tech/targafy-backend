import mongoose from "mongoose";
const { startSession } = mongoose;
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Businessusers } from "../../models/businessUsers.model.js";

export const promoteUserToAdmin = asyncHandler(async (req, res, next) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const userIdToPromote = req?.params?.userIdToPromote;
    const { businessId } = req.params;
    const userId = req?.user?._id;
    if (!userId) {
      return res.status(401).json(new ApiResponse(401, {}, "Invalid Token"));
    }

    if (!userIdToPromote || !businessId) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            {},
            "Provide userIdToPromote and businessId in params"
          )
        );
    }

    const user = await Businessusers.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      userId: userId,
      userType: "Insider",
    });

    if (!user || !user.role) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "User not found or user not associated with business!"
          )
        );
    }

    if (user.role !== "Admin") {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Only admins can perform this task"));
    }

    const userToPromote = await Businessusers.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      userId: userIdToPromote,
      userType: "Insider",
    });

    if (!userToPromote) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User to promote not found"));
    }

    if (userToPromote.role === "Admin") {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User is already an admin"));
    }

    if (userToPromote.role === user.role) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Self role change not allowed"));
    }

    const subordinates = userToPromote.subordinates || [];

    // Find the dummy admin
    const dummyAdmin = await Businessusers.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      role: "DummyAdmin",
      userType: "Insider",
    });

    if (!dummyAdmin) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "DummyAdmin not found"));
    }

    // Update parent ID of the subordinates to the dummy admin
    await Businessusers.updateMany(
      {
        businessId: new mongoose.Types.ObjectId(businessId),
        userId: { $in: subordinates },
      },
      {
        $set: {
          parentId: dummyAdmin.userId,
        },
      },
      { session }
    );

    // Update dummy admin's subordinates and allSubordinates with the promoted user's subordinates
    await Businessusers.updateOne(
      {
        businessId: new mongoose.Types.ObjectId(businessId),
        userId: dummyAdmin.userId,
      },
      {
        $addToSet: {
          subordinates: { $each: subordinates },
        },
      },
      { session }
    );

    // Remove the promoted user from subordinates and allSubordinates lists
    await Businessusers.updateMany(
      {
        businessId: new mongoose.Types.ObjectId(businessId),
      },
      {
        $pull: {
          subordinates: userIdToPromote,
          allSubordinates: userIdToPromote,
        },
      },
      { session }
    );

    // Fetch the subordinates and allSubordinates from any existing admin
    const existingAdmin = await Businessusers.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      role: "Admin",
    });

    // Promote the user and update subordinates/allSubordinates fields
    await Businessusers.updateOne(
      {
        businessId: new mongoose.Types.ObjectId(businessId),
        userId: userIdToPromote,
        userType: "Insider",
      },
      {
        $set: {
          role: "Admin",
          parentId: null,
          subordinates: existingAdmin.subordinates,
          allSubordinates: existingAdmin.allSubordinates.filter(
            (id) => !id.equals(userIdToPromote)
          ),
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "User role updated to Admin successfully")
      );
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});

export const demoteAdminToUser = asyncHandler(async (req, res, next) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const { businessId, adminIdToDemote } = req.params;
    const userId = req?.user?._id;
    if (!userId) {
      return res.status(401).json(new ApiResponse(401, {}, "Invalid Token"));
    }

    // console.log(userId);

    if (!adminIdToDemote || !businessId) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            {},
            "Provide adminIdToDemote and businessId in params"
          )
        );
    }

    const admin = await Businessusers.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      userId: userId,
      userType: "Insider",
    });

    // console.log(admin);

    if (!admin || admin.role !== "Admin") {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Only admins can perform this task"));
    }

    const adminToDemote = await Businessusers.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      userId: adminIdToDemote,
      role: "Admin",
      userType: "Insider",
    });

    if (!adminToDemote) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Admin to demote not found"));
    }

    if (adminToDemote.role === admin.role) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Self role change not allowed"));
    }

    // Find the dummy admin who will be the new parent
    const dummyAdmin = await Businessusers.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      role: "DummyAdmin",
      userType: "Insider",
    });

    if (!dummyAdmin) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "DummyAdmin not found"));
    }

    // Update subordinates and allSubordinates of the admin to be demoted
    await Businessusers.updateOne(
      {
        businessId: new mongoose.Types.ObjectId(businessId),
        userId: adminIdToDemote,
        role: "Admin",
      },
      {
        $set: {
          role: "User",
          parentId: dummyAdmin.userId,
          subordinates: [],
          allSubordinates: [],
        },
      },
      { session }
    );

    // Update all admins' allSubordinates by adding the demoted user
    await Businessusers.updateMany(
      {
        businessId: new mongoose.Types.ObjectId(businessId),
        role: "Admin",
      },
      {
        $addToSet: {
          allSubordinates: adminIdToDemote,
        },
      },
      { session }
    );

    // Update dummy admin's subordinates and allSubordinates with the demoted user
    await Businessusers.updateOne(
      {
        businessId: new mongoose.Types.ObjectId(businessId),
        userId: dummyAdmin.userId,
      },
      {
        $addToSet: {
          subordinates: adminIdToDemote,
          allSubordinates: adminIdToDemote,
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Admin role demoted to User successfully")
      );
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});
