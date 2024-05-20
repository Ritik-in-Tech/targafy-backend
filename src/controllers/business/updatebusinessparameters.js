import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const updateBusinessParameters = asyncHandler(async (req, res) => {
  try {
    const { parameters } = req.body;
    const businessId = req.params.businessId;

    if (!businessId) {
      return res
        .status(400)
        .json({ status: 400, message: "Business ID is required" });
    }

    if (typeof parameters !== "string") {
      return res.status(400).json({
        status: 400,
        message: "Parameters must be a comma-separated string",
      });
    }

    // Convert the comma-separated string to an array and trim whitespace
    const parametersArray = parameters.split(",").map((param) => param.trim());

    // Update the parameters field
    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { parameters: parametersArray },
      { new: true }
    );

    if (!updatedBusiness) {
      return res
        .status(404)
        .json({ status: 404, message: "Business not found" });
    }

    res.json({
      status: 200,
      data: updatedBusiness,
      message: "Parameters updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Server Error" });
  }
});

export { updateBusinessParameters };
