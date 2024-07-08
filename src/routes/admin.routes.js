import { Router } from "express";
import { getDailyStatisticsForAdmin } from "../controllers/admin/daily_stats.controller.js";
import { getMonthlyStatisticsForAdmin } from "../controllers/admin/monthly_stats.controller.js";
import { getDailyOverAllStatisticsAdmin } from "../controllers/admin/getdaily_overallstats.js";
import { verifyJWTAdmin } from "../middleware/auth.middleware.js";
// import { getDailyStatisticsForAdmin } from "../controllers/admin/admin_app.statistics.controller.js";

const router = Router();

router.use(verifyJWTAdmin);

router.route("/daily-stats/:businessId/:date").get(getDailyStatisticsForAdmin);
router
  .route("/monthly-stats/:businessId/:month/:year")
  .get(getMonthlyStatisticsForAdmin);

router
  .route("/get-daily-overallStats/:date")
  .get(getDailyOverAllStatisticsAdmin);

export default router;
