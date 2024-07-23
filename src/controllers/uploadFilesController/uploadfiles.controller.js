import aws from "aws-sdk";

import ApiError from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import catchAsync from "../../utils/catchAsync.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const uploadDocument = asyncHandler(async (req, res) => {
  try {
    if (!req || !req.files || !req.files.file || req.files.file.length < 1) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "File is not provided"));
    }

    const file = req.files.file[0];
    if (!file) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "File is not specified"));
    }
    if (!req.body || !req.body.folder) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Folder is not specified"));
    }

    // File size check
    const fileType = file.mimetype.split("/")[0];
    const fileSizeInKb = file.size / 1024;
    if (fileType === "image" && fileSizeInKb > 120) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Image should be less than 120Kb"));
    } else if (fileType !== "image" && fileSizeInKb > 1024) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "File size should not exceed 1 MB"));
    }

    const folder = req.body.folder;
    const allowedFolders = ["chats", "businessprofile", "userprofile"];
    if (!allowedFolders.includes(folder)) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            `Invalid folder value. Allowed values are "chats", "businessprofile", and "userprofile" `
          )
        );
    }

    let uploadFolder = "chats";
    if (folder === "businessprofile") {
      uploadFolder = "business-profiles";
    } else if (folder === "userprofile") {
      uploadFolder = "user-profiles";
    }

    const params = {
      Bucket: `targafy/${uploadFolder}`,
      Key: `${Date.now()}-${Math.random().toString(36).substring(7)}-${
        file.originalname
      }`,
      Body: file.buffer,
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.error("Error while uploading file to S3:", err);
        return res
          .status(400)
          .json(new ApiResponse(400, { err }, "Failed to upload file to s3"));
      } else {
        const fileUrl = data.Location;
        console.log(`File uploaded successfully at ${fileUrl}`);
        return res
          .status(200)
          .json(
            new ApiResponse(200, { fileUrl }, "File uploaded successfully!")
          );
      }
    });
  } catch (error) {
    console.error("Error while uploading document:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export default uploadDocument;
