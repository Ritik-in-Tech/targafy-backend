import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  getDailyTargetValue,
  getPreviousData,
  getTargetToAddData,
} from "../controllers/data.controller.js";

import { AddData } from "../controllers/data/adddata.controller.js";
import { GetParamDataSpecificUser } from "../controllers/data/getdataspecificuser.controller.js";
import { GetParamData } from "../controllers/data/getparamdata.controller.js";
import { AddTestDataForMonth } from "../controllers/data/addtestdatamonth.controller.js";
const router = Router();

router.use(verifyJWT);

router.route("/add-data/:businessId/:parameterName").post(AddData);

// router to get user specific data
router
  .route("/get-user-data/:businessId/:userId/:paramName")
  .get(GetParamDataSpecificUser);

router
  .route("/get-daily-target/:businessId/:targetName")
  .get(getDailyTargetValue);

// router to get param data for a business
router.route("/get-param-data/:businessId/:paramName").get(GetParamData);

// router to get previus data of user
router.route("/get-previous-data/:businessId/:paramName").get(getPreviousData);

// router to get the target names for the specifc user
router.route("/get-target-users/:businessId").get(getTargetToAddData);

router
  .route("/add-test-data/:businessId/:parameterName")
  .post(AddTestDataForMonth);

// router.route("/add-")
export default router;
