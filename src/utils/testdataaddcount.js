import { DataAdd } from "../models/dataadd.model.js";
import mongoose from "mongoose";
export async function getTestDataAddCount(
  businessId,
  previousDayStart,
  previousDayEnd
) {
  try {
    const dataAddCount = await DataAdd.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
        },
      },
      {
        $addFields: {
          matchingDates: {
            $filter: {
              input: "$data",
              as: "dataItem",
              cond: {
                $and: [
                  { $gte: ["$$dataItem.createdDate", previousDayStart] },
                  { $lt: ["$$dataItem.createdDate", previousDayEnd] },
                ],
              },
            },
          },
        },
      },
      {
        $match: {
          "matchingDates.0": { $exists: true },
        },
      },
      {
        $count: "count",
      },
    ]);

    const dataAdd = dataAddCount.length > 0 ? dataAddCount[0].count : 0;
    return dataAdd;
  } catch (error) {
    console.error("Error in getDataAddCount:", error);
    return 0;
  }
}

// // Example usage with hardcoded values:
// (async () => {
//   const businessId = "668638149103073a3380eeef";
//   const previousDayStart = new Date("2024-07-07T00:00:00Z");
//   const previousDayEnd = new Date("2024-07-07T23:59:59Z");

//   const count = await getDataAddCount(
//     businessId,
//     previousDayStart,
//     previousDayEnd
//   );
//   console.log(`DataAdd count: ${count}`);
// })();
