import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";
import {
  contactNumberSchema,
  commonStringConstraints,
} from "../utils/helpers/schema.helper.js";
import moment from "moment-timezone";

function convertToIST(date) {
  return moment(date).tz("Asia/Kolkata").toDate();
}

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

const dataSchema = new Schema(
  {
    name: commonStringConstraints,
    dataId: {
      type: Schema.Types.ObjectId,
    },
    targetDone: {
      type: Number,
    },
    createdDate: {
      type: Date,
      default: Date.now,
      get: convertToIST,
      set: convertToIST,
    },
  },
  {
    _id: false,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const lastSeenHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Users",
    },
    lastSeen: {
      type: [Date],
      default: [],
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
  lastSeenHistory: [lastSeenHistorySchema],
  email: {
    type: String,
    trim: true,
    default: "",
    match: [/\S+@\S+\.\S+/, "Please provide a valid email address"],
  },
  fcmToken: {
    type: String,
  },
  data: [dataSchema],
});

const User = model("Users", userSchema);
export { User };
