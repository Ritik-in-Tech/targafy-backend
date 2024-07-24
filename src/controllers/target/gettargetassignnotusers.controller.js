import { Businessusers } from "../../models/businessUsers.model.js";
import { Target } from "../../models/target.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getTargetNotAssignUsers = asyncHandler(async (req, res) => {
  try {
    const { businessId, paramName, monthIndex } = req.params;
    if (!businessId || !paramName || !monthIndex) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessId, paramName and monthIndex in params"
          )
        );
    }

    const businessUsers = await Businessusers.find({
      businessId: businessId,
    });

    const userList = businessUsers.map((user) => ({
      userId: user.userId,
      name: user.name,
    }));

    // console.log(userList);

    const targetUsers = await Target.find({
      businessId: businessId,
      monthIndex: monthIndex,
      paramName: paramName,
    });

    const targetUsersList = targetUsers.map((target) => ({
      userId: target.userId,
      name: target.assignedto,
    }));

    // console.log(targetUsersList);
    const usersNotInTarget = userList.filter(
      (user) =>
        !targetUsersList.some(
          (targetUser) =>
            targetUser.userId.toString() === user.userId.toString()
        )
    );

    // console.log("The Target not assigned to the users are :", usersNotInTarget);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { usersNotInTarget },
          "Not assigned users fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});
