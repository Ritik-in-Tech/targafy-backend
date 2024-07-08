import { User } from "../models/user.model.js";
import mongoose from "mongoose";

export async function totalSessionCount(
  businessId,
  previousDayStart,
  previousDayEnd
) {
  try {
    const totalSessionResult = await User.aggregate([
      {
        $match: {
          "businesses.businessId": new mongoose.Types.ObjectId(businessId),
        },
      },
      {
        $unwind: "$lastSeenHistory",
      },
      {
        $unwind: "$lastSeenHistory.lastSeen",
      },
      {
        $match: {
          "lastSeenHistory.lastSeen": {
            $gte: new Date(previousDayStart),
            $lt: new Date(previousDayEnd),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
        },
      },
    ]);

    const totalSession =
      totalSessionResult.length > 0 ? totalSessionResult[0].totalSessions : 0;

    return totalSession;
  } catch (error) {
    console.log(error);
    return `Total session count has an error: ${error}`;
  }
}
