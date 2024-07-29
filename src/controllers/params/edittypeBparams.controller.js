import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { TypeBParams } from "../../models/typeBparams.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const editTypeBParams = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token please log in again"));
    }

    const { businessId, typeBParamId } = req.params;
    if (!businessId || !typeBParamId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "BusinessId or TypeBParamId is missing")
        );
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }

    const checkExistingTypeBParam = await TypeBParams.findById(typeBParamId);

    if (!checkExistingTypeBParam) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "TypeB Param not found"));
    }

    const businessusers = await Businessusers.findOne({
      userId: userId,
      businessId: businessId,
    });

    if (!businessusers || businessusers.role !== "Admin") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Either businessUser not exist or it's role is not Admin in this business"
          )
        );
    }

    const { newparamName1, newparamName2, newbenchMarks } = req.body;

    if (newbenchMarks && !Array.isArray(newbenchMarks)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "BenchMarks should be in array"));
    }

    const updateFields = {};

    if (newparamName1) updateFields.paramName1 = newparamName1;
    if (newparamName2) updateFields.paramName2 = newparamName2;

    if (newbenchMarks) {
      const benchMarkArray = newbenchMarks.map((benchmark) => ({
        value: benchmark,
      }));
      updateFields.benchMark = benchMarkArray;
    }

    const updatedTypeBParam = await TypeBParams.findByIdAndUpdate(
      typeBParamId,
      updateFields,
      { new: true }
    );

    if (!updatedTypeBParam) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Failed to update TypeB Param"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { updateFields },
          "TypeB Param updated successfully"
        )
      );
  } catch (error) {
    console.error("Error in editTypeBParams:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal server error"));
  }
});
