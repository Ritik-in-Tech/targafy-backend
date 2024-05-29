import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { addData } from "../controllers/dataadd.controller.js";
const router = Router();

router.use(verifyJWT);

router.route("/add-data/:businessId/:parameterName").post(addData);

export default router;
