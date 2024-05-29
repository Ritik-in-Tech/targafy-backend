import { Router } from "express";
const router = Router();
import {
  createTarget,
  getAllTargets,
  getTargetById,
  updateTarget,
  deleteTarget,
  getTargetValues,
} from "../controllers/target.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

// router to verify that jwt token is still valid
router.use(verifyJWT);
// router to create target
router.route("/add-target/:businessId").post(createTarget);

// router to get parameters and target values
router.route("/get-target-values/:businessId").get(getTargetValues);

// router to get all targets for specific business
router.route("/all/:id").get(getAllTargets);

// router to get the target by id , update and delete the target
router
  .route("/:bid/:tid")
  .get(getTargetById)
  .put(updateTarget)
  .delete(deleteTarget);

export default router;
