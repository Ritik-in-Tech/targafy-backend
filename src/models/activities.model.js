import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";

const activitySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please provide a user id"],
  },

  businessId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please provide a business id"],
  },

  content: {
    type: String,
    required: true,
  },
  activityCategory: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    default: getCurrentIndianTime(),
  },
  issueId: {
    type: String,
    required: function () {
      return this.activityCategory == "issue";
    },
  },

  issueTitle: {
    type: String,
    required: function () {
      return this.activityCategory == "issue";
    },
  },

  groupId: {
    type: Schema.Types.ObjectId,
    required: function () {
      return this.activityCategory == "group";
    },
  },

  groupName: {
    type: String,
    required: function () {
      return this.activityCategory == "group";
    },
  },
});

const Activites = model("Activites", activitySchema);
export { Activites };
