import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";
import { Requests } from "../../models/requests.model.js";
import { Declinedrequests } from "../../models/declinedRequests.model.js";
import { Acceptedrequests } from "../../models/acceptedRequests.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// need to improved
const joinBusiness = asyncHandler(async (req, res, next) => {
  const businessCode = req?.params?.businessCode;
  const userId = req?.user?._id;
  try {
    if (!businessCode || businessCode.length != 6) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Enter a valid business code!!"));
    }

    if (!userId) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid Token!"));
    }

    const [user, businessData] = await Promise.all([
      User.findById(userId),
      Business.findOne({ businessCode }).populate("_id"),
    ]);
    // console.log(user);
    // console.log(businessData);

    if (!user) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User does not exist!!"));
    }

    if (!businessData || !businessData?._id) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business does not exist!!"));
    }

    const businessId = businessData?._id;
    console.log(businessId);
    console.log(userId);

    const existingUser = await Businessusers.findOne({
      businessId,
      userId,
    });
    if (existingUser) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User already exist in business!!"));
    }

    const existingRequest = await Requests.findOne({ businessId, userId });
    if (existingRequest) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "User already sent a request to join this business!!"
          )
        );
    }

    const existingDeclinedRequest = await Declinedrequests.findOne({
      businessId,
      userId,
    });
    if (existingDeclinedRequest) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "Your request has already been declined!!")
        );
    }

    const existingAcceptedRequest = await Acceptedrequests.findOne({
      businessId,
      userId,
    });
    if (existingAcceptedRequest) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "User already present in business!!"));
    }

    const requestedUser = {
      businessId: businessData._id,
      name: user?.name,
      contactNumber: user?.contactNumber,
      userId,
    };

    await Requests.create(requestedUser);

    // const emitData = {
    //   content: `New Join Request: ${user.name} is eager to join your business. Act now!`,
    //   notificationCategory: "business",
    //   createdDate: getCurrentUTCTime(),
    //   businessName: businessData.name,
    //   businessId: businessData._id,
    // };

    // const businessAdmins = await Business.find(
    //   { businessId, role: "Admin" },
    //   { name: 1, userId: 1 }
    // );

    // await Promise.all(
    //   businessAdmins.map(async (admin) => {
    //     await emitNewNotificationEvent(admin.userId, emitData);
    //   })
    // );

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Request sent successfully"));
  } catch (error) {
    console.error("Error : ", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export { joinBusiness };
