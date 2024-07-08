import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ENV_VAR } from "../utils/variable.env.js";
import dotenv from "dotenv";
dotenv.config();

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Unauthorized request"));
    }

    const decodedToken = jwt.verify(token, ENV_VAR.ACCESS_TOKEN_SECRET);

    if (
      !decodedToken ||
      !decodedToken?.userDetails ||
      !decodedToken?.userDetails?._id ||
      !decodedToken?.userDetails?.name ||
      !decodedToken?.userDetails?.contactNumber
    ) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "The token is invalid!"));
    }

    req.user = decodedToken?.userDetails;
    req.userDetails = decodedToken?.userDetails;
    next();
  } catch (error) {
    // console.log(error);
    return res
      .status(401)
      .json(new ApiResponse(401, {}, "Invalid access token"));
  }
});

const verifyJWTAdmin = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "Unauthorized request"));
    }

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET_ADMIN
    );

    console.log(process.env.ACCESS_TOKEN_SECRET_ADMIN);

    if (
      !decodedToken ||
      !decodedToken?.userDetails ||
      !decodedToken?.userDetails?._id ||
      !decodedToken?.userDetails?.name ||
      !decodedToken?.userDetails?.contactNumber
    ) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, "The token is invalid!"));
    }

    req.user = decodedToken?.userDetails;
    req.userDetails = decodedToken?.userDetails;
    next();
  } catch (error) {
    // console.log(error);
    return res
      .status(401)
      .json(new ApiResponse(401, {}, "Invalid access token"));
  }
});

export { verifyJWT, verifyJWTAdmin };
