import { Router } from "express";
import { getDailyStatisticsForAdmin } from "../controllers/admin/daily_stats.controller.js";
import { getMonthlyStatisticsForAdmin } from "../controllers/admin/monthly_stats.controller.js";
import { getDailyOverAllStatisticsAdmin } from "../controllers/admin/getdaily_overallstats.js";
import { verifyJWTAdmin } from "../middleware/auth.middleware.js";
import { getBusinessList } from "../controllers/business/getbusinesslist.controller.js";
import { getCombinedStats } from "../controllers/admin/getcombinedstats.js";
import { getCombinedMonthlyStats } from "../controllers/admin/getcombinedmonthly.stats.js";
import { getCombinedOverAllStatisticsAdmin } from "../controllers/admin/getcombinedoverallstats.js";
import { getSessionStats } from "../controllers/admin/getsession_stats.controller.js";
// import { getDailyStatisticsForAdmin } from "../controllers/admin/admin_app.statistics.controller.js";

const router = Router();

// router.use(verifyJWTAdmin);

router.route("/businesslist").get(getBusinessList);
router.route("/daily-stats/:businessId/:date").get(getDailyStatisticsForAdmin);
router
  .route("/monthly-stats/:businessId/:month/:year")
  .get(getMonthlyStatisticsForAdmin);

router
  .route("/get-daily-overallStats/:date")
  .get(getDailyOverAllStatisticsAdmin);

router.route("/get-combined-stats/:businessId/:date").get(getCombinedStats);

router
  .route("/get-combined-monthly-stats/:businessId/:date")
  .get(getCombinedMonthlyStats);

router
  .route("/get-combined-overallstats/:date")
  .get(getCombinedOverAllStatisticsAdmin);

router.route("/get-session-stats/:businessId/:date").get(getSessionStats);

export default router;
