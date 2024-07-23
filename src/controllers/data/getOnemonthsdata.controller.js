import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { User } from "../../models/user.model.js";
import { Target } from "../../models/target.model.js";
import moment from "moment-timezone";
import { DataAdd } from "../../models/dataadd.model.js";

const getOneMonthsDataUser = asyncHandler(async (req, res) => {
  try {
    const { userId, paramName, businessId } = req.params;

    if (!userId || !paramName || !businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide targetId and userId in params"
          )
        );
    }

    const loggedInUserId = req.user._id;
    if (!loggedInUserId) {
      return res.status(400).json(new ApiResponse(400, {}, "Token Invalid"));
    }

    const loggedInUser = await User.findById(loggedInUserId);
    if (!loggedInUser) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Admin or Mini Admin not found"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business does not exist"));
    }

    const businessusers = await Businessusers.findOne({
      businessId: businessId,
      userId: loggedInUserId,
    });

    if (!businessusers) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "logged in user is not associated with the business"
          )
        );
    }

    // if (businessusers.role === "User") {
    //   return res
    //     .status(400)
    //     .json(
    //       new ApiResponse(
    //         400,
    //         {},
    //         "Only admin and miniAdmin is allowed to do this"
    //       )
    //     );
    // }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }

    const businessUser = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!businessUser) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "User is not associated with the provided business Id"
          )
        );
    }

    // Calculate the previous three months
    const now = moment();
    console.log(now);
    const lastOneMonths = [
      now.clone().subtract(0, "months").format("M"),
      now.clone().subtract(1, "months").format("M"),
      // now.clone().subtract(2, "months").format("M"),
      // now.clone().subtract(3, "months").format("M"),
    ];

    console.log(lastOneMonths);

    // Query the target table for the previous three months
    const targets = await Target.find({
      businessId: businessId,
      userId: userId,
      paramName: paramName,
      monthIndex: { $in: lastOneMonths },
    });

    const dataIds = await DataAdd.find(
      {
        businessId: businessId,
        parameterName: paramName,
        userId: userId,
      },
      { _id: 1 }
    );

    const dataIdValues = dataIds.map((doc) => doc._id);

    const userData = user.data.filter(
      (dataItem) =>
        dataItem.name === paramName &&
        dataIdValues.includes(dataItem.dataId) &&
        moment(dataItem.createdDate).isBetween(
          now.clone().subtract(1, "months").startOf("month"),
          now.endOf("month")
        )
    );

    // Structure the response data
    const result = lastOneMonths.map((month) => {
      const target = targets.find((t) => t.monthIndex === month);
      const targetValue = target ? target.targetValue : "";
      const targetDone =
        userData.find(
          (dataItem) => moment(dataItem.createdDate).format("M") === month
        )?.targetDone || "";

      return {
        month,
        targetValue,
        targetDone,
      };
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, "Data retrieved successfully"));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        new ApiResponse(500, {}, "An error occurred while retrieving the data")
      );
  }
});

const getThreeMonthsDataUser = asyncHandler(async (req, res) => {
  try {
    const { userId, paramName, businessId } = req.params;

    if (!userId || !paramName || !businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide targetId and userId in params"
          )
        );
    }

    const loggedInUserId = req.user._id;
    if (!loggedInUserId) {
      return res.status(400).json(new ApiResponse(400, {}, "Token Invalid"));
    }

    const loggedInUser = await User.findById(loggedInUserId);
    if (!loggedInUser) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Admin or Mini Admin not found"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business does not exist"));
    }

    const businessusers = await Businessusers.findOne({
      businessId: businessId,
      userId: loggedInUserId,
    });

    if (!businessusers) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "logged in user is not associated with the business"
          )
        );
    }

    // if (businessusers.role === "User") {
    //   return res
    //     .status(400)
    //     .json(
    //       new ApiResponse(
    //         400,
    //         {},
    //         "Only admin and miniAdmin is allowed to do this"
    //       )
    //     );
    // }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }

    const businessUser = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!businessUser) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "User is not associated with the provided business Id"
          )
        );
    }

    // Calculate the previous three months
    const now = moment();
    console.log(now);
    const lastThreeMonths = [
      now.clone().subtract(0, "months").format("M"),
      now.clone().subtract(1, "months").format("M"),
      now.clone().subtract(2, "months").format("M"),
      // now.clone().subtract(3, "months").format("M"),
    ];

    console.log(lastThreeMonths);

    // Query the target table for the previous three months
    const targets = await Target.find({
      businessId: businessId,
      userId: userId,
      paramName: paramName,
      monthIndex: { $in: lastThreeMonths },
    });

    const dataIds = await DataAdd.find(
      {
        businessId: businessId,
        parameterName: paramName,
        userId: userId,
      },
      { _id: 1 }
    );

    const dataIdValues = dataIds.map((doc) => doc._id);

    const userData = user.data.filter(
      (dataItem) =>
        dataItem.name === paramName &&
        dataIdValues.includes(dataItem.dataId) &&
        moment(dataItem.createdDate).isBetween(
          now.clone().subtract(1, "months").startOf("month"),
          now.endOf("month")
        )
    );
    // Structure the response data
    const result = lastThreeMonths.map((month) => {
      const target = targets.find((t) => t.monthIndex === month);
      const targetValue = target ? target.targetValue : "";
      const targetDone =
        userData.find(
          (dataItem) => moment(dataItem.createdDate).format("M") === month
        )?.targetDone || "";

      return {
        month,
        targetValue,
        targetDone,
      };
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, "Data retrieved successfully"));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        new ApiResponse(500, {}, "An error occurred while retrieving the data")
      );
  }
});

export { getOneMonthsDataUser, getThreeMonthsDataUser };
