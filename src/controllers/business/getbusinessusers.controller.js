import mongoose from "mongoose";
import { Businessusers } from "../../models/businessUsers.model.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/user.model.js";
import { Business } from "../../models/business.model.js";

const getBusinessUsers = asyncHandler(async (req, res, next) => {
  try {
    const businessId = req?.params?.businessId;
    console.log(businessId);
    const businessUsers = await Businessusers.find(
      { businessId: new mongoose.Types.ObjectId(businessId) },
      { name: 1, userId: 1, userType: 1, role: 1, lastSeen: 1 }
    );

    // console.log("business users: ", businessUsers);

    if (businessUsers) {
      let users = businessUsers;

      let newUsers = [];
      for (let i = 0; i < users?.length; i++) {
        newUsers.push({
          name: users[i].name || "",
          userId: users[i].userId || "",
          role: users[i].role || "",
          userType: users[i].userType || "",
          lastSeen: users[i].lastSeen,
          unseenMessagesCount: 0,
        });
      }

      // console.log(`This is the data of new users: ${newUsers}`);

      return res
        .status(200)
        .json(new ApiResponse(200, { users: newUsers }, "All Business users"));
    } else {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Business or users not found"));
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

const getAllsubOrdinatesBusinessUsers = asyncHandler(async (req, res) => {
  try {
    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide businessId"));
    }
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Token expired please log in again!"));
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, "User not found"));
    }
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
    if (!businessuser) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            "logged in user is not associated with the business"
          )
        );
    }
    // console.log(businessuser);
    const role = businessuser.role;
    // console.log(role);
    const businessUsers = await Businessusers.find(
      { businessId: businessId },
      { name: 1, userId: 1, userType: 1, role: 1, lastSeen: 1 }
    );
    // console.log(businessUsers);
    if (businessUsers) {
      let newUsers = [];
      if (role == "Admin") {
        // fetch the user details like
        let users = businessUsers;
        for (let i = 0; i < users?.length; i++) {
          newUsers.push({
            name: users[i].name || "",
            userId: users[i].userId || "",
            role: users[i].role || "",
            userType: users[i].userType || "",
            lastSeen: users[i].lastSeen,
            unseenMessagesCount: 0,
          });
        }
      } else if (role == "MiniAdmin") {
        // fetch the details of all the users except admin one for that business
        let users = businessUsers;
        console.log("hello world");
        for (let i = 0; i < users?.length; i++) {
          if (users[i].role == "MiniAdmin" || users[i].role == "User") {
            newUsers.push({
              name: users[i].name || "",
              userId: users[i].userId || "",
              role: users[i].role || "",
              userType: users[i].userType || "",
              lastSeen: users[i].lastSeen,
              unseenMessagesCount: 0,
            });
          }
        }
      } else {
        let users = businessUsers;
        for (let i = 0; i < users?.length; i++) {
          if (users[i].role == "User") {
            newUsers.push({
              name: users[i].name || "",
              userId: users[i].userId || "",
              role: users[i].role || "",
              userType: users[i].userType || "",
              lastSeen: users[i].lastSeen,
              unseenMessagesCount: 0,
            });
          }
        }
      }
      return res
        .status(200)
        .json(new ApiResponse(200, { users: newUsers }, "All Business users"));
    } else {
      return res
        .status(404)
        .json(
          new ApiResponse(404, { users: newUsers }, "BusinessUsers not found")
        );
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export { getBusinessUsers, getAllsubOrdinatesBusinessUsers };
