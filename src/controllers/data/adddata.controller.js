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
import {
  convertToIST,
  getCurrentIndianTime,
} from "../../utils/helpers/time.helper.js";
import { formatDateNew } from "../../utils/helpers.js";
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
    const formattedDate = formatDateNew(currentDate);
    // console.log(currentDate);
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
        content: `Achievements done -> ${user.name} (${formattedDate} ${parameterName}): ${todaysdata}`,
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
        content: `Achievements done -> ${user.name} (${formattedDate} ${parameterName}): ${todaysdata}`,
        activityCategory: "Data Add",
        createdDate: currentDate,
      });

      await activity.save();
      await dataAdd.save();
    }

    const uniqueNotificationIds = new Set();

    const businessAdminAndMiniAdmin = await Businessusers.find(
      { businessId, role: { $in: ["Admin", "MiniAdmin"] } },
      { name: 1, userId: 1 }
    );

    // Add admin and mini-admin IDs to the Set
    businessAdminAndMiniAdmin.forEach((user) =>
      uniqueNotificationIds.add(user.userId)
    );

    const parentIds = await getParentIdsList(userId, businessId);

    // Add parent IDs to the Set
    parentIds.forEach((id) => uniqueNotificationIds.add(id));

    // Convert the Set back to an array if needed
    const notificationIds = Array.from(uniqueNotificationIds);

    // console.log(notificationIds);

    const emitData = {
      content: `Achievements done -> ${user.name} (${formattedDate} ${parameterName}): ${todaysdata}`,
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

const AddDataTest = asyncHandler(async (req, res) => {
  try {
    const { userData, date } = req.body;
    const businessId = req.params.businessId;

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

    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "BusinessId not provided in params"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    if (!userData || !Array.isArray(userData) || !date) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all required fields"));
    }

    for (const { paramName, todaysdata, comment } of userData) {
      const paramDetails = await Params.findOne({
        name: paramName,
        businessId,
      });
      if (!paramDetails) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, "Param not found"));
      }

      const [year, month, day] = date.split("-").map(Number);

      // Get current UTC time
      const now = new Date();
      const formattedDate = formatDateNew(now);
      const currentHours = now.getUTCHours();
      const currentMinutes = now.getUTCMinutes();
      const currentSeconds = now.getUTCSeconds();
      const currentMilliseconds = now.getUTCMilliseconds();

      // Create new Date object with provided date and current UTC time
      const currentDate = new Date(
        Date.UTC(
          year,
          month - 1,
          day,
          currentHours,
          currentMinutes,
          currentSeconds,
          currentMilliseconds
        )
      );

      // console.log(currentDate.toISOString());
      // console.log(currentDate);

      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      console.log(currentMonth);
      console.log(currentYear);

      const istdate = convertToIST(currentDate);
      console.log(istdate);
      // // // console.log(typeof currentMonth);
      // // // console.log(currentYear);

      let ongoingMonth = currentMonth + 1;
      ongoingMonth = ongoingMonth.toString();

      const target = await Target.findOne({
        paramName: paramName,
        businessId,
        userId: userId,
        monthIndex: ongoingMonth,
      });
      if (!target) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, `Target not found for ${paramName}`));
      }

      // const indianTimeFormatted = moment()
      //   .tz("Asia/Kolkata")
      //   .format("YYYY-MM-DD HH:mm:ss");

      let dataAdd = await DataAdd.findOne({
        parameterName: paramName,
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
      const today = new Date(date);
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
                `You have already added the data for today in ${paramName}`
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
          content: `Achievements done -> ${user.name} (${formattedDate} ${paramName}): ${todaysdata}`,
          activityCategory: "Data Add",
          createdDate: currentDate,
        });

        await activity.save();
        await dataAdd.save();
      } else {
        dataAdd = new DataAdd({
          parameterName: paramName,
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
          content: `Achievements done -> ${user.name} (${formattedDate} ${paramName}): ${todaysdata}`,
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
        content: `Achievements done -> ${user.name} (${formattedDate} ${paramName}): ${todaysdata}`,
        notificationCategory: "DataAdd",
        createdDate: istdate,
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
          entry.name === paramName &&
          entry.dataId.equals(dataAdd._id) &&
          entry.createdDate.getMonth() + 1 === currentMonth + 1 &&
          entry.createdDate.getFullYear() === currentYear
      );

      if (userDataEntry) {
        userDataEntry.targetDone += todaysDataValue;
      } else {
        console.log("Hello");
        user.data.push({
          name: paramName,
          dataId: dataAdd._id,
          targetDone: todaysDataValue,
          createdDate: currentDate,
        });
      }

      user.data.sort((a, b) => b.createdDate - a.createdDate);

      await user.save();
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, {}, `Data added successfully for the ${date}`)
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, `Internal server error: ${error}`));
  }
});

export { AddData, AddDataTest };
