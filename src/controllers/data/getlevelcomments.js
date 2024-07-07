import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { Target } from "../../models/target.model.js";
import { DataAdd } from "../../models/dataadd.model.js";
import moment from "moment-timezone";
moment.tz.setDefault("Asia/Kolkata");

const getLevelComments = asyncHandler(async (req, res) => {
  try {
    const { userId, businessId, paramName, monthValue } = req.params;
    if (!userId || !businessId || !paramName || !monthValue) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessId, userId, paramName, and monthValue in params"
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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const businessuser = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!businessuser) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Provided user is not associated with the business"
          )
        );
    }

    // Check if the allSubordinates field exists and is an array
    if (!Array.isArray(businessuser.allSubordinates)) {
      console.log(
        "allSubordinates field is not an array or does not exist:",
        businessuser.allSubordinates
      );
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "No subordinates found for the provided user"
          )
        );
    }

    // Check the structure of allSubordinates and map the IDs properly
    console.log(
      "allSubordinates before mapping:",
      businessuser.allSubordinates
    );
    const allSubordinates = businessuser.allSubordinates
      .map((sub) => {
        if (sub && sub._id) {
          return sub._id.toString();
        } else if (sub) {
          return sub.toString();
        }
        return undefined;
      })
      .filter(Boolean); // Filter out undefined values

    console.log("allSubordinates after mapping:", allSubordinates);
    let userIds = [...allSubordinates];
    if (userIds.length === 0) {
      userIds = [userId];
    }
    console.log("Combined userIds:", userIds);

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
        const todaysComment = item.comment;
        const addedBy = userComment.addedBy;

        if (!commentsMap.has(date)) {
          commentsMap.set(date, []);
        }

        commentsMap.get(date).push({ todaysComment, addedBy, date });
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

export { getLevelComments };
