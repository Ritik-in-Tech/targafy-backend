import { Business } from "../../models/business.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const updateBusinessLogo = asyncHandler(async (req, res, next) => {
  try {
    const businessId = req?.params?.businessId;

    if (!req.body || !req.body.logo) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide a logo URL"));
    }

    const logoUrl = req?.body?.logo;

    const business = await Business.updateOne(
      { _id: businessId },
      {
        $set: {
          logo: logoUrl,
        },
      }
    );
    if (business.modifiedCount === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Some error occurred! while updating logo")
        );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { logo: logoUrl }, "Logo updated successfully")
      );
  } catch (error) {
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
