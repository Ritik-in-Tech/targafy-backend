import mongoose, { Schema } from "mongoose";

import {} from "../utils/helpers.js";

import { getCurrentUTCTime } from "../utils/helpers/time.helper.js";

const notificationSchema = new Schema({
  // This is userId is used to identify that the notification belong to which user
  userId: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  notificationCategory: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    default: getCurrentUTCTime(),
  },
  businessName: {
    type: String,
    required: function () {
      return this.notificationCategory == "business";
    },
  },
  businessId: {
    type: String,
    required: function () {
      return this.notificationCategory == "business";
    },
  },
});

export default mongoose.model("notifications", notificationSchema);
