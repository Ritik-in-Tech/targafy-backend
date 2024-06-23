import { Business } from "../../models/business.model.js";
import { Group } from "../../models/group.model.js";
import { Office } from "../../models/office.model.js";
import { Params } from "../../models/params.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getParamId = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Business Id is not provided in the params")
        );
    }
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid token! Please log in again"));
    }
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Business not exist for the provided business Id"
          )
        );
    }
    const paramDetails = await Params.find({ businessId: businessId });
    if (paramDetails.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            {},
            "No params found for the provided business Id"
          )
        );
    }
    // console.log(paramDetails);

    const formattedParams = paramDetails.map((param) => ({
      _id: param._id,
      name: param.name,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { level1: formattedParams },
          "Params fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

const headOfficeName = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    const headOffice = await Office.find(
      { businessId: businessId, parentOfficeId: { $exists: false } },
      { officeName: 1, _id: 1 } // Only fetch officeName and _id fields
    );

    if (!headOffice || headOffice.length === 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "head office not found for the provided business details"
          )
        );
    }

    const headOfficeDetails = headOffice.map((office) => ({
      _id: office._id,
      officeName: office.officeName,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { headOffice: headOfficeDetails },
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

const sublevelOfficeName = asyncHandler(async (req, res) => {
  try {
    const aboveLevelOfficeId = req.params.aboveLevelOfficeId;
    const officeExistence = await Office.findById(aboveLevelOfficeId);
    if (!officeExistence) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "Office does not exist for the provided details"
          )
        );
    }

    if (officeExistence.subordinateOffice.length === 0) {
      const formattedUsers = officeExistence.userAdded.map((user) => ({
        name: user.name,
        userId: user.userId,
      }));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { users: formattedUsers },
            "Users fetched successfully!"
          )
        );
    }
    const formattedOffices = officeExistence.subordinateOffice.map(
      (office) => ({
        _id: office.subordinateOfficeId,
        officeName: office.subordinateofficeName,
      })
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { suboffices: formattedOffices },
          "Groups fetched successfully!"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});
export { getParamId, sublevelOfficeName, headOfficeName };
