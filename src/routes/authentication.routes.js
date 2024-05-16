import { Router } from "express";
const router = Router();
import {
  verifyloginOTP,
  loginWithOTP,
} from "../controllers/authentication.controller.js";

// user register
router.route("/login").post(loginWithOTP);

// login
router.route("/verifyotp").post(verifyloginOTP);

export default router;
