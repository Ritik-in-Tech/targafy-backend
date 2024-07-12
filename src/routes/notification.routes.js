import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getSubordinateUserNotification } from "../controllers/notifications/getsubordinatenotifications.controller.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/get-notifications/:businessId")
  .get(getSubordinateUserNotification);
export default router;
