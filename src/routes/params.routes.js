import { Router } from "express";
const router = Router();
import {
  // createParam,
  getAllParams,
  getParamById,
  updateParam,
  deleteParam,
  getAssignedParams,
  getAssignUsers,
  getParamId,
} from "../controllers/params.controller.js";
import { addUserToParam } from "../controllers/params/addusertoparam.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createTypeBParams } from "../controllers/params/createtypeBparams.controller.js";
import {
  getTypeBNewParams,
  getTypeBParams,
} from "../controllers/params/gettypeBparams.controller.js";
import { editTypeBParams } from "../controllers/params/edittypeBparams.controller.js";
import { deleteTypeBParams } from "../controllers/params/deletetypeBparams.controller.js";
import { createParam } from "../controllers/params/createparam.controller.js";
// middlewares which verifies is request from the authorized user
router.use(verifyJWT);

// router to add paramerters
// router.route("/add/:businessId/:departmentId").post(createParam);

router.route("/add/:businessId").post(createParam);

// router to get all parameters
router.route("/all/:businessId").get(getAllParams);

// router to get params and assigned users for that params in a particular business
router.route("/get/assigned-parameter/:businessId").get(getAssignedParams);

// router to get assign users for the specific parameter and business id
router.route("/get-assign-user/:paramName").get(getAssignUsers);

//router to add users to the existing params
router.route("/add-user-to-param/:paramId").post(addUserToParam);

router.route("/get-param-id/:businessId").get(getParamId);

router.route("/create-typeBParam/:businessId").post(createTypeBParams);

router.route("/get-typeBParams/:businessId").get(getTypeBParams);

router.route("/get-typeBParams-new/:businessId").get(getTypeBNewParams);

router
  .route("/edit-typeBParams/:businessId/:typeBParamId")
  .put(editTypeBParams);

router
  .route("/delete-typeBParams/:businessId/:typeBParamId")
  .delete(deleteTypeBParams);

router
  .route("/:bid/:pid")
  .get(getParamById)
  .put(updateParam)
  .delete(deleteParam);

export default router;
