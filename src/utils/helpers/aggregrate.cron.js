import cron from "node-cron";
import moment from "moment-timezone"; // Import moment-timezone
import { aggregateDailyStats } from "../aggregate_daily.stats.js";
import { aggregateOverallDailyStats } from "../aggregate_overall.stats.js";

const localScheduleTime = "00:05";
const localOverallStatsScheduleTime = "00:10";
const timeZone = "Asia/Kolkata";

const task = cron.schedule("* * * * *", async () => {
  // Get the current time in the specified time zone
  const currentTime = moment.tz(timeZone).format("HH:mm");

  if (currentTime === localScheduleTime) {
    console.log("Running statistics aggregation...");
    console.log(Date.now());

    const allUpdated = await aggregateDailyStats();

    if (allUpdated) {
      console.log("All business IDs aggregated. Stopping cron job.");
      task.stop();
    }
  }
});

task.start();

const OverallStats = cron.schedule("* * * * *", async () => {
  // Get the current time in the specified time zone
  const currentTime = moment.tz(timeZone).format("HH:mm");

  if (currentTime === localOverallStatsScheduleTime) {
    console.log("Running Overall statistics aggregation...");
    console.log(Date.now());

    const allUpdated = await aggregateOverallDailyStats();

    if (allUpdated) {
      console.log("Stopping cron job.");
      OverallStats.stop();
    }
  }
});

// Start the task
OverallStats.start();
