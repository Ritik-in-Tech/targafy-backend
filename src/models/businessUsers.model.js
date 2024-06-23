import { Schema, model } from "mongoose";
import {
  contactNumberSchema,
  commonStringConstraints,
} from "../utils/helpers/schema.helper.js";
import { AvailableUserRolesEnum } from "../utils/constants.js";
import { getCurrentUTCTime } from "../utils/helpers/time.helper.js";

const officeJoined = new Schema(
  {
    officeName: commonStringConstraints,
    officeId: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    _id: false,
  }
);
const businessUsersSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please provide a user id"],
  },

  businessId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please provide a business id"],
  },

  name: commonStringConstraints,

  contactNumber: contactNumberSchema,

  userType: {
    type: String,
    enum: ["Insider", "Outsider"],
    required: true,
  },

  role: {
    type: String,
    trim: true,
    enum: {
      values: AvailableUserRolesEnum, // Define your roles enum separately
      message: "Please provide a valid role",
    },
    required: function () {
      return this.userType === "Insider";
    },
  },

  parentId: {
    type: Schema.Types.ObjectId,
    default: function () {
      if (this.role != "Admin") {
        return null;
      }
    },
  },

  subordinates: {
    type: [Schema.Types.ObjectId],
    required: function () {
      return this.userType !== "Outsider"; // Only required if userType is not "outsider"
    },
  },

  allSubordinates: {
    type: [Schema.Types.ObjectId],
    required: function () {
      return this.userType !== "Outsider"; // Only required if userType is not "outsider"
    },
  },

  officeJoined: {
    type: [officeJoined],
    default: [],
  },

  activityViewCounter: {
    type: Number,
    default: 0,
    required: function () {
      return this.userType !== "Outsider"; // Only required if userType is not "outsider"
    },
  },
  lastSeen: {
    type: Date,
    default: getCurrentUTCTime(),
    required: function () {
      return this.userType !== "Outsider"; // Only required if userType is not "outsider"
    },
  },
  totalRating: {
    type: Number,
    required: true,
    default: 0,
    required: function () {
      return this.userType !== "Outsider"; // Only required if userType is not "outsider"
    },
  },
  totalRatingsCount: {
    type: Number,
    required: true,
    default: 0,
    required: function () {
      return this.userType !== "Outsider"; // Only required if userType is not "outsider"
    },
  },
});

const Businessusers = model("Businessusers", businessUsersSchema);
export { Businessusers };
