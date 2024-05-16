import { Router } from "express";
const router = Router();
import { createTarget, getAllTargets, getTargetById, updateTarget, deleteTarget } from "../controllers/target.controller.js";

router.route("/add/:id").post(createTarget);

router.route("/all/:id").get(getAllTargets);

router
  .route("/:bid/:tid")
  .get(getTargetById)
  .put(updateTarget)
  .delete(deleteTarget);

export default router;
