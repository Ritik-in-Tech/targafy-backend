import { Router } from "express";
import multer from "multer";
import uploadDocument from "../../src/controllers/uploadFilesController/uploadfiles.controller.js";
const upload = multer();

const router = Router();
router
  .route("/upload/file")
  .post(upload.fields([{ name: "file" }, { name: "folder" }]), uploadDocument);
export default router;
