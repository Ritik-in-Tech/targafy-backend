import cron from "node-cron";
import { aggregateDailyStats } from "../aggregate_daily.stats.js";
import { aggregateOverallDailyStats } from "../aggregate_overall.stats.js";

const task = cron.schedule("5 0 * * *", async () => {
  console.log("Running daily statistics aggregation...");
  console.log(Date.now());

  const dailyUpdated = await aggregateDailyStats();

  if (dailyUpdated) {
    console.log(
      "Daily statistics aggregated. Now running overall statistics aggregation..."
    );

    const overallUpdated = await aggregateOverallDailyStats();

    if (overallUpdated) {
      console.log("Overall statistics aggregated. Stopping cron job.");
      task.stop();
    }
  }
});

task.start();
