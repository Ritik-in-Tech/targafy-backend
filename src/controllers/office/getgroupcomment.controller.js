import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Business } from "../../models/business.model.js";
import { Target } from "../../models/target.model.js";
import { DataAdd } from "../../models/dataadd.model.js";
import moment from "moment-timezone";
import { Group } from "../../models/group.model.js";
moment.tz.setDefault("Asia/Kolkata");

export const getGroupComments = asyncHandler(async (req, res) => {
  try {
    const { groupId, businessId, paramName, monthValue } = req.params;
    if (!groupId || !businessId || !paramName || !monthValue) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessId, groupId, paramName, and monthValue in params"
          )
        );
    }
    const year = moment().year();
    const month = parseInt(monthValue, 10);

    if (isNaN(month) || month < 1 || month > 12) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Invalid month value provided. Must be between 1 and 12"
          )
        );
    }

    const startDate = moment.tz(
      `${year}-${month.toString().padStart(2, "0")}-01`,
      "Asia/Kolkata"
    );
    const endDate = startDate.clone().endOf("month");
    console.log("Start Date:", startDate.format("YYYY-MM-DD"));
    console.log("End Date:", endDate.format("YYYY-MM-DD"));

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const groupDetail = await Group.findById(groupId);
    if (!groupDetail) {
      return res.status(400).json(new ApiResponse(400, {}, "Group not found"));
    }

    if (groupDetail.businessId.toString() !== business._id.toString()) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Group not in the provided businessId"));
    }
    let userIds = [];

    if (
      groupDetail.allsubordinateGroups &&
      groupDetail.allsubordinateGroups.length > 0
    ) {
      const subGroupIds = groupDetail.allsubordinateGroups.map(
        (group) => group.subordinateGroupId
      );
      const subGroups = await Group.find({ _id: { $in: subGroupIds } });

      subGroups.forEach((subGroup) => {
        if (subGroup.userAdded) {
          userIds = userIds.concat(
            subGroup.userAdded.map((user) => user.userId.toString())
          );
        }
      });
    }
    if (userIds.length === 0 && groupDetail.userAdded) {
      userIds = groupDetail.userAdded.map((user) => user.userId.toString());
    }
    userIds = [...new Set(userIds)];

    console.log(userIds);

    const target = await Target.findOne({
      paramName: paramName,
      businessId: businessId,
      monthIndex: monthValue,
    });
    if (!target) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Target is not set for this business and parameter"
          )
        );
    }
    const userList = await DataAdd.find(
      {
        businessId: businessId,
        parameterName: paramName,
        userId: { $in: userIds },
        createdDate: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate(),
        },
      },
      "data createdDate addedBy"
    );
    // console.log(userList);

    if (!userList || userList.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "No comment found for the provided criteria")
        );
    }
    const commentsMap = new Map();

    userList.forEach((userComment) => {
      userComment.data.forEach((item) => {
        const date = moment(item.createdDate)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD");
        const time = moment(item.createdDate)
          .tz("Asia/Kolkata")
          .format("HH:mm:ss");
        const todaysComment = item.comment;
        const addedBy = userComment.addedBy;

        if (!commentsMap.has(date)) {
          commentsMap.set(date, []);
        }

        commentsMap.get(date).push({ todaysComment, addedBy, date, time });
      });
    });
    const commentsArray = Array.from(commentsMap, ([date, comments]) => ({
      date,
      comments,
    }));

    // Sort the array by date
    commentsArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Return the response
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { comments: commentsArray },
          "Comments retrieved successfully"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});
