import { Business } from "../../models/business.model.js";
import { Office } from "../../models/office.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getOfficeInBusiness = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business ID is required"));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business not found"));
    }

    const offices = await Office.find({ businessId: businessId }, "officeName");

    const formattedOffices = offices.map((office) => ({
      officeId: office._id,
      name: office.officeName,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(200, formattedOffices, "Offices retrieved successfully")
      );
  } catch (error) {
    console.error("Error in getOfficeInBusiness:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal Server Error"));
  }
});

export { getOfficeInBusiness };
