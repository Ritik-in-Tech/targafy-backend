import cron from "node-cron";
import { aggregateDailyStats } from "../aggregate_daily.stats.js";
import { aggregateOverallDailyStats } from "../aggregate_overall.stats.js";

const task = cron.schedule("5 0 * * *", async () => {
  console.log("Running statistics aggregation...");
  console.log(Date.now());

  const allUpdated = await aggregateDailyStats();

  if (allUpdated) {
    console.log("All business IDs aggregated. Stopping cron job.");
    task.stop();
  }
});

task.start();

const OverallStats = cron.schedule("10 0 * * *", async () => {
  console.log("Running Overall statistics aggregation...");
  console.log(Date.now());

  const allUpdated = await aggregateOverallDailyStats();

  if (allUpdated) {
    console.log("Stopping cron job.");
    OverallStats.stop();
  }
});

// Start the task
OverallStats.start();
