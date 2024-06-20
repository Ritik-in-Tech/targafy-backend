import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  getAllActivityBusiness,
  getSubordinateUserActivity,
} from "../controllers/activities.controller.js";
// import { getAllsubOrdinatesBusinessUsers } from "../controllers/business/getbusinessusers.controller.js";
const router = Router();

// router to verify that jwt token is still valid
router.use(verifyJWT);

// router to get activity
router.route("/get-activity/:businessId").get(getAllActivityBusiness);

router
  .route("/get-all-subordinatesUserActivity/:businessId")
  .get(getSubordinateUserActivity);

export default router;
