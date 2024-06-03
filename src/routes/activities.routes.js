import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getAllActivityBusiness } from "../controllers/activities.controller.js";
const router = Router();

// router to verify that jwt token is still valid
router.use(verifyJWT);

// router to get activity
router.route("/get-activity/:businessId").get(getAllActivityBusiness);

export default router;
