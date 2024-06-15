import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  addData,
  getDailyTargetValue,
  getParamData,
  getParamDataSpecificUser,
  getPreviousData,
  getTargetToAddData,
} from "../controllers/data.controller.js";
const router = Router();

router.use(verifyJWT);

router.route("/add-data/:businessId/:parameterName").post(addData);

// router to get user specific data
router
  .route("/get-user-data/:businessId/:userId/:paramName")
  .get(getParamDataSpecificUser);

router
  .route("/get-daily-target/:businessId/:targetName")
  .get(getDailyTargetValue);

// router to get param data for a business
router.route("/get-param-data/:businessId/:paramName").get(getParamData);

// router to get previus data of user
router.route("/get-previous-data/:businessId/:paramName").get(getPreviousData);

// router to get the target names for the specifc user
router.route("/get-target-users/:businessId").get(getTargetToAddData);
export default router;
