import { Router } from "express";
const router = Router();
import {
  createTarget,
  getAllTargets,
  getTargetById,
  updateTarget,
  deleteTarget,
} from "../controllers/target.controller.js";

// router to create target
router.route("/add/:id").post(createTarget);

// router to get all targets for specific business
router.route("/all/:id").get(getAllTargets);

// router to get the target by id , update and delete the target
router
  .route("/:bid/:tid")
  .get(getTargetById)
  .put(updateTarget)
  .delete(deleteTarget);

export default router;
