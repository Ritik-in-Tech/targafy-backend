import { Router } from "express";
const router = Router();
import {
  createParam,
  getAllParams,
  getParamById,
  updateParam,
  deleteParam,
  getAssignedParams,
  getAssignUsers,
} from "../controllers/params.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
// middlewares which verifies is request from the authorized user
router.use(verifyJWT);

// router to add paramerters
router.route("/add/:businessId").post(createParam);

// router to get all parameters
router.route("/all/:businessId").get(getAllParams);

// router to get params and assigned users for that params in a particular business
router.route("/get/assigned-parameter/:businessId").get(getAssignedParams);

// router to get assign users for the specific parameter and business id
router.route("/get-assign-user/:paramName/:businessId").get(getAssignUsers);

router
  .route("/:bid/:pid")
  .get(getParamById)
  .put(updateParam)
  .delete(deleteParam);

export default router;
