import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { TypeBParams } from "../../models/typeBparams.model.js";

export const deleteTypeBParams = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { businessId, typeBParamId } = req.params;
    if (!businessId || !typeBParamId) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Please provide businessID and paramId in params"
          )
        );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const businessuser = await Businessusers.findOne({
      businessId: businessId,
      userId: userId,
    });

    if (!businessuser || businessuser.role === "User") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Either logged in user is not associated with the business or it's role is user"
          )
        );
    }

    const checkTypeBParam = await TypeBParams.findById(typeBParamId);
    if (!checkTypeBParam) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Provided typeBParam does not exist"));
    }

    // Delete the TypeBParam
    const deletedTypeBParam = await TypeBParams.findByIdAndDelete(typeBParamId);

    if (!deletedTypeBParam) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Failed to delete TypeBParam"));
    }

    // Return success response
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "TypeBParam deleted successfully"));
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error in deleteTypeBParams:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});
