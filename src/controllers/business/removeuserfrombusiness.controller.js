import mongoose from "mongoose";
const { startSession } = mongoose;
import { User } from "../../models/user.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Acceptedrequests } from "../../models/acceptedRequests.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Params } from "../../models/params.model.js";
import { Target } from "../../models/target.model.js";
import { DataAdd } from "../../models/dataadd.model.js";

const removeUserFromBusiness = asyncHandler(async (req, res, next) => {
  const userToRemoveId = req.params?.userToRemoveId;
  const businessId = req.params?.businessId;
  const userId = req.user._id;
  if (!userId) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Invalid token please log in again"));
  }

  if (!userToRemoveId || !businessId) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Provide userToRemoveId and businessId"));
  }

  const session = await startSession();
  session.startTransaction();

  try {
    const checkEligibility = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!checkEligibility) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Logged in user not associated with the business"
          )
        );
    }

    if (checkEligibility.role !== "Admin") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Only Admin can remove the user from the business"
          )
        );
    }

    const user = await Businessusers.findOne({
      businessId: businessId,
      userId: userToRemoveId,
    });

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(500)
        .json(new ApiResponse(500, {}, "User not found in the business"));
    }

    const parent = await Businessusers.findOne({
      businessId: businessId,
      userId: user?.parentId,
    });

    if (!parent) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "User manager not found in the business")
        );
    }

    const subordinates = user?.subordinates || [];

    // Update parent user of the user's subordinates
    await Businessusers.updateMany(
      { businessId: businessId, userId: { $in: subordinates } },
      {
        $set: {
          parentId: user.parentId,
        },
      },
      { session }
    );

    // Remove user from the business and update related data
    await Businessusers.updateMany(
      { businessId: businessId },
      {
        $pull: {
          subordinates: userToRemoveId,
          allSubordinates: userToRemoveId,
        },
      },
      { session }
    );

    // Add subordinates in users parent subordinates array
    await Businessusers.updateOne(
      { businessId: businessId, userId: user.parentId },
      {
        $addToSet: {
          subordinates: { $each: subordinates },
        },
      },
      { session }
    );

    // Remove the user from any parameters they are assigned to
    await Params.updateMany(
      { businessId: businessId },
      {
        $pull: {
          usersAssigned: { userId: userToRemoveId },
        },
      },
      { session }
    );

    await Target.deleteMany(
      {
        businessId: businessId,
        userId: userToRemoveId,
      },
      { session }
    );

    // Remove user data from AddData table

    const dataAddIds = await DataAdd.find(
      {
        businessId: businessId,
        userId: userToRemoveId,
      },
      { session }
    )
      .select("_id")
      .lean(); // Using lean() to get a plain JavaScript object

    const dataIdsToRemove = dataAddIds.map((data) => data._id);

    await DataAdd.deleteMany(
      { businessId: businessId, userId: userToRemoveId },
      { session }
    );

    await User.updateMany(
      { _id: userToRemoveId },
      {
        $pull: {
          data: { dataId: { $in: dataIdsToRemove } },
          businesses: { businessId: businessId },
        },
      },
      { session }
    );

    // Delete the user from the business
    await Businessusers.deleteOne(
      { businessId: businessId, userId: userToRemoveId },
      { session }
    );

    await Acceptedrequests.deleteOne(
      { businessId: businessId, userId: userToRemoveId },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "User removed from business successfully")
      );
  } catch (error) {
    console.error("Error while removing user :", error);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal Server Error"));
  }
});

export { removeUserFromBusiness };
