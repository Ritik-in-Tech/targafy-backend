import { Router } from "express";
import { getDailyStatisticsForAdmin } from "../controllers/admin/admin_app.statistics.controller.js";

const router = Router();

router.route("/stats/:businessId/:date").get(getDailyStatisticsForAdmin);

export default router;
