import { Business } from "../../models/business.model.js";
import { Office } from "../../models/office.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getAllHeadOffices = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;

    // Check if businessId is provided
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide businessId in params"));
    }

    // Check if the business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business does not exist"));
    }

    // Fetch groups that belong to the business and do not have a parentGroupId
    const offices = await Office.find(
      { businessId: businessId, parentOfficeId: { $exists: false } },
      { officeName: 1, userAdded: 1, _id: 1 }
    );

    // Check if any groups were found
    if (offices.length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { office: [] },
            "No head office exist for this business"
          )
        );
    }

    // Format the groups as needed
    const formattedOffices = offices.map((office) => ({
      _id: office._id,
      headOfficeName: office.officeName,
      userAddedLength: office.userAdded.length,
    }));

    // Send the response
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { headOffice: formattedOffices },
          "Head office fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export { getAllHeadOffices };
