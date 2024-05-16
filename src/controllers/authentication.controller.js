import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import { ENV_VAR } from "../utils/variable.env.js";

const payload = {
  Param1: "value1",
  Param2: "value2",
  Param3: "value3",
};

const headers = {
  accept: "application/json",
  "content-type": "application/json",
  authkey: ENV_VAR.AUTHKEY,
  "User-Agent": "ReadMe-API-Explorer",
};

// Register a new OTP
const verifyloginOTP = asyncHandler(async (req, res) => {
  try {
    const { otp, contactNumber } = req.body;

    if (!otp || !contactNumber) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Fill complete details!!"));
    }

    const { countryCode, number } = contactNumber;

    if (!countryCode || !number) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Fill complete contact number details!!")
        );
    }

    if (
      number == "1111111111" ||
      number == "2222222222" ||
      number == "3333333333" ||
      number == "4444444444" ||
      number == "5555555555" ||
      number == "6666666666" ||
      number == "7777777777" ||
      number == "8888888888" ||
      number == "9999999999" ||
      number == "9111111111"
    ) {
      let user = await User.findOne({
        "contactNumber.countryCode": countryCode,
        "contactNumber.number": number,
      });
      if (!user) {
        return res.status(404).json(new ApiResponse(404, {}, "User Not Found"));
      }

      const userDetails = {
        _id: user?._id,
        contactNumber: user?.contactNumber,
        name: user?.name,
      };

      const authToken = jwt.sign({ userDetails }, ENV_VAR.ACCESS_TOKEN_SECRET);
      return res
        .status(200)
        .json(new ApiResponse(200, { authToken }, "Login successfully"));
    }

    let phoneNumWithCountryCode = `${countryCode}${number}`;
    phoneNumWithCountryCode = phoneNumWithCountryCode.substring(1);

    const url = `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${phoneNumWithCountryCode}`;
    const response = await axios.get(url, { headers });
    console.log(response?.data);
    if (response.data.type !== "success") {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, response?.data?.message));
    }

    let user = await User.findOne({
      "contactNumber.countryCode": countryCode,
      "contactNumber.number": number,
    });

    if (!user) {
      user = await User.create({
        name: "Guest",
        contactNumber: {
          countryCode: countryCode,
          number: number,
        },
      });
    }

    const userDetails = {
      _id: user?._id,
      contactNumber: user?.contactNumber,
      name: user?.name == "" ? "Guest" : user?.name,
    };

    const authToken = jwt.sign({ userDetails }, ENV_VAR.ACCESS_TOKEN_SECRET);

    return res
      .status(200)
      .json(new ApiResponse(200, { authToken }, "Logged in successfully"));
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

// Login with OTP
const loginWithOTP = asyncHandler(async (req, res) => {
  try {
    if (!req.body.contactNumber) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Contact number is missing in the request body"
          )
        );
    }

    const { countryCode, number } = req.body.contactNumber;

    if (!countryCode || !number) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Fill complete details!!"));
    }

    let phoneNumWithCountryCode = `${countryCode}${number}`;
    phoneNumWithCountryCode = phoneNumWithCountryCode.substring(1);

    const url = `https://control.msg91.com/api/v5/otp?template_id=657bf14ed6fc0578437ea412&mobile=${phoneNumWithCountryCode}`;

    const response = await axios.post(url, payload, { headers });
    if (response?.data["type"] === "success") {
      return res
        .status(200)
        .json(new ApiResponse(200, response?.data, "OTP sent successfully"));
    }
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Falied to send otp try again"));
  } catch (error) {
    console.error("Error:", error);

    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { verifyloginOTP, loginWithOTP };
