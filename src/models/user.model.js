import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";
import {
  contactNumberSchema,
  commonStringConstraints,
} from "../utils/helpers/schema.helper.js";

const businessSchema = new Schema(
  {
    name: commonStringConstraints,
    userType: {
      type: String,
      enum: ["Insider", "Outsider"],
      required: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
    },
  },
  { _id: false }
);

const notificationSchema = new Schema({
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
    default: getCurrentIndianTime(),
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

const userSchema = new Schema({
  name: commonStringConstraints,

  jobTitle: commonStringConstraints,

  avatar: {
    type: String,
  },

  contactNumber: contactNumberSchema,

  businesses: [businessSchema],

  notificationViewCounter: {
    default: 0,
    type: Number,
  },
  email: {
    type: String,
    trim: true,
    default: "",
    match: [/\S+@\S+\.\S+/, "Please provide a valid email address"],
  },
  fcmToken: {
    type: String,
  },
});

const User = model("Users", userSchema);
export { User };
