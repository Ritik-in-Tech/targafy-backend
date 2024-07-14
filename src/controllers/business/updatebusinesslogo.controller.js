import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { User } from "../../models/user.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const updateBusinessLogo = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid Token please log in again"));
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, "User not found"));
    }
    const businessId = req?.params?.businessId;

    if (!req.body || !req.body.logo) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide a logo URL"));
    }

    const logoUrl = req?.body?.logo;

    // Validating the logoURL
    if (!/\.(jpg|jpeg|png)$/i.test(logoUrl)) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "logoUrl must end with .jpg, .jpeg, or .png")
        );
    }

    // Check if the business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    const businessuser = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!businessuser || businessuser.role === "User") {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Admin or Mini Admin role required"));
    }

    // Update the business logo
    const updatedBusinessLogo = await Business.updateOne(
      { _id: businessId },
      {
        $set: {
          logo: logoUrl,
        },
      }
    );

    // if (updatedBusinessLogo.modifiedCount === 0) {
    //   return res
    //     .status(400)
    //     .json(
    //       new ApiResponse(400, {}, "Some error occurred while updating logo")
    //     );
    // }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { logo: logoUrl }, "Logo updated successfully")
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          { message: error?.message },
          "Internal Server Error"
        )
      );
  }
});

export { updateBusinessLogo };
