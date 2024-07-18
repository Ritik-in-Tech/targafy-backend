import { Business } from "../../models/business.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Params } from "../../models/params.model.js";
import { Target } from "../../models/target.model.js";
import { DataAdd } from "../../models/dataadd.model.js";
import mongoose from "mongoose";
import { User } from "../../models/user.model.js";
import { Activites } from "../../models/activities.model.js";
import moment from "moment-timezone";
import { Businessusers } from "../../models/businessUsers.model.js";
import { getParentIdsList } from "../../utils/helpers/getparentIds.js";
import {
  activityNotificationEvent,
  emitNewNotificationEvent,
} from "../../sockets/notification_socket.js";
import { getCurrentIndianTime } from "../../utils/helpers/time.helper.js";
moment.tz.setDefault("Asia/Kolkata");

const AddData = asyncHandler(async (req, res) => {
  try {
    const { todaysdata, comment } = req.body;
    const parameterName = req.params.parameterName;
    const businessId = req.params.businessId;

    if (!todaysdata || !comment) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please add today's data and comment in req.body"
          )
        );
    }

    if (!parameterName || !businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Provide parameter name and business id in params"
          )
        );
    }

    const userId = req.user._id;
    if (!userId) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Token expired please log in again"));
    }

    const user = await User.findById(userId);
    if (!user || !user.name) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "User not found or name of user not exist")
        );
    }

    // console.log(user);

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            {},
            "Business not found, please check businessId again"
          )
        );
    }

    const paramDetails = await Params.findOne({
      name: parameterName,
      businessId,
    });
    if (!paramDetails) {
      return res.status(404).json(new ApiResponse(404, {}, "Param not found"));
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    // console.log(typeof currentMonth);
    // console.log(currentYear);

    let ongoingMonth = currentMonth + 1;
    ongoingMonth = ongoingMonth.toString();

    const target = await Target.findOne({
      paramName: parameterName,
      businessId,
      userId: userId,
      monthIndex: ongoingMonth,
    });
    if (!target) {
      return res.status(404).json(new ApiResponse(404, {}, "Target not found"));
    }

    // const indianTimeFormatted = moment()
    //   .tz("Asia/Kolkata")
    //   .format("YYYY-MM-DD HH:mm:ss");

    let dataAdd = await DataAdd.findOne({
      parameterName,
      userId,
      businessId,
      $expr: {
        $and: [
          { $eq: [{ $month: "$createdDate" }, currentMonth + 1] },
          { $eq: [{ $year: "$createdDate" }, currentYear] },
        ],
      },
    });

    // console.log(dataAdd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dataAdd) {
      const todayEntry = dataAdd.data.find((entry) => {
        const entryDate = new Date(entry.createdDate);
        return (
          entryDate.getFullYear() === today.getFullYear() &&
          entryDate.getMonth() === today.getMonth() &&
          entryDate.getDate() === today.getDate()
        );
      });

      if (todayEntry) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              "You have already added the data for today"
            )
          );
      } else {
        dataAdd.data.push({
          todaysdata,
          comment,
          createdDate: currentDate,
        });
      }

      const activity = new Activites({
        userId: userId,
        businessId,
        content: `${user.name} ${
          todayEntry ? "updated" : "added"
        } the data for ${parameterName} in ${business.name}`,
        activityCategory: "Data Add",
        createdDate: currentDate,
      });

      await activity.save();
      await dataAdd.save();
    } else {
      dataAdd = new DataAdd({
        parameterName,
        data: [{ todaysdata, comment, createdDate: currentDate }],
        userId,
        addedBy: user.name,
        monthIndex: currentMonth + 1,
        businessId,
        createdDate: currentDate,
      });
      const activity = new Activites({
        userId: userId,
        businessId,
        content: `${user.name} added the data for ${parameterName} in ${business.name}`,
        activityCategory: "Data Add",
        createdDate: currentDate,
      });

      await activity.save();
      await dataAdd.save();
    }

    const notificationIds = [];
    const businessAdminAndMiniAdmin = await Businessusers.find(
      { businessId, role: { $in: ["Admin", "MiniAdmin"] } },
      { name: 1, userId: 1 }
    );

    notificationIds.push(
      ...businessAdminAndMiniAdmin.map((user) => user.userId)
    );

    const parentIds = await getParentIdsList(userId, businessId);

    if (parentIds.length !== 0) {
      notificationIds.push(...parentIds);
    }

    // console.log(notificationIds);

    const emitData = {
      content: `${user.name} added the data for the target ${target.paramName} in the Business ${business.name}`,
      notificationCategory: "DataAdd",
      createdDate: getCurrentIndianTime(),
      businessName: business.name,
      businessId: business._id,
    };

    for (const userId of notificationIds) {
      // console.log(userId);
      await activityNotificationEvent(userId, emitData);
    }

    await dataAdd.save();

    console.log(dataAdd._id);
    console.log("Hello");
    console.log(dataAdd.createdDate);

    console.log(dataAdd.createdDate.getMonth());
    console.log(currentMonth);

    // const targetValue = parseFloat(target.targetValue);
    const todaysDataValue = parseFloat(todaysdata);

    // Find the data entry for the parameterName
    let userDataEntry = user.data.find(
      (entry) =>
        entry.name === parameterName &&
        entry.dataId.equals(dataAdd._id) &&
        entry.createdDate.getMonth() + 1 === currentMonth + 1 &&
        entry.createdDate.getFullYear() === currentYear
    );

    if (userDataEntry) {
      userDataEntry.targetDone += todaysDataValue;
    } else {
      console.log("Hello");
      user.data.push({
        name: parameterName,
        dataId: dataAdd._id,
        targetDone: todaysDataValue,
        createdDate: currentDate,
      });
    }

    user.data.sort((a, b) => b.createdDate - a.createdDate);

    await user.save();

    return res
      .status(201)
      .json(new ApiResponse(201, { dataAdd }, "Data added successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { AddData };
