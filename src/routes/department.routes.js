import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { createDepartment } from "../controllers/department/create.controller.js";
import { getDepartment } from "../controllers/department/get.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/create/:businessId").post(createDepartment);

router.route("/get/:businessId").get(getDepartment);

export default router;
