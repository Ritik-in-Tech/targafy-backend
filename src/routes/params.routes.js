import { Router } from "express";
const router = Router();
import { createParam, getAllParams, getParamById, updateParam, deleteParam } from "../controllers/params.controller.js";

router.route("/add/:id").post(createParam);

router.route("/all/:id").get(getAllParams);

router
  .route("/:bid/:pid")
  .get(getParamById)
  .put(updateParam)
  .delete(deleteParam);

export default router;
