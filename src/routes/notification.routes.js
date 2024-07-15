import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getSubordinateUserNotification } from "../controllers/notifications/getsubordinatenotifications.controller.js";
import {
  getNotificationCounter,
  resetCounter,
} from "../controllers/notifications/getnotificationcounter.controller.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/get-notifications/:businessId")
  .get(getSubordinateUserNotification);

router
  .route("/get-notification-counters/:businessId")
  .get(getNotificationCounter);

router.route("/reset-counter/:businessId").post(resetCounter);
export default router;
