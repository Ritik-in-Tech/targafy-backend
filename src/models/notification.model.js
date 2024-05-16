import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";

const notificationSchema = new Schema({
  // This is userId is used to identify that the notification belong to which user
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  notificationCategory: {
    type: String, // business , user
    required: true,
  },
  createdDate: {
    type: Date,
    default: getCurrentIndianTime(),
  },

  // i dont think it is useful if not necessary in future remove this
  businessName: {
    type: String,
  },
  businessId: {
    type: Schema.Types.ObjectId,
  },
});

const Notifications = model("Notifications", notificationSchema);
export { Notifications };
