import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";
import moment from "moment-timezone";

function convertToIST(date) {
  return moment(date).tz("Asia/Kolkata").toDate();
}

const activitySchema = new Schema(
  {
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
      default: Date.now,
      get: convertToIST,
      set: convertToIST,
    },
  },
  {
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

activitySchema.pre("save", function (next) {
  if (this.createdDate) {
    this.createdDate = convertToIST(this.createdDate);
  }
  next();
});

const Activites = model("Activites", activitySchema);
export { Activites };
