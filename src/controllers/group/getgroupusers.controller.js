import { Businessusers } from "../../models/businessUsers.model.js";
import { Group } from "../../models/group.model.js";
import { User } from "../../models/user.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getGroupUsers = asyncHandler(async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const businessId = req.params.businessId;
    if (!groupId || !businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Group Id or businessId is not provided in req.params"
          )
        );
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "There is not any group for the provided group Id"
          )
        );
    }

    const userIds = group.userAdded.map((user) => user.userId);
    const users = await User.find({ _id: { $in: userIds } });
    const businessusers = await Businessusers.find({
      businessId: businessId,
      userId: { $in: userIds },
    });
    // console.log(businessusers);

    if (users.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "No users found for this group"));
    }

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      avatar: user.avatar || "",
    }));

    const formattedBusinessUsers = businessusers.map((user) => ({
      name: user.name,
      contactNumber: user.contactNumber,
      role: user.role,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { users: formattedUsers, businessusers: formattedBusinessUsers },
          "Users fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export { getGroupUsers };
