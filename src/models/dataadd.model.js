import { Schema, model } from "mongoose";
import moment from "moment-timezone"; // Use moment-timezone to handle timezones

// Common string constraints
const commonStringConstraints = {
  type: String,
  trim: true,
  default: "",
};

// Helper function to convert UTC to IST
function convertToIST(date) {
  return moment(date).tz("Asia/Kolkata").toDate();
}

// Simple data schema
const simpleData = new Schema(
  {
    todaysdata: commonStringConstraints,
    comment: commonStringConstraints,
    createdDate: {
      type: Date,
      default: Date.now,
      get: convertToIST, // Automatically convert to IST on retrieval
      set: convertToIST, // Automatically convert to IST on setting
    },
  },
  {
    _id: false,
    toJSON: { getters: true }, // Ensure the getter is applied when converting to JSON
    toObject: { getters: true }, // Ensure the getter is applied when converting to Object
  }
);

// Data add schema
const dataAddSchema = new Schema(
  {
    parameterName: commonStringConstraints,
    data: [simpleData],
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    businessId: { type: Schema.Types.ObjectId, required: true },
    createdDate: {
      type: Date,
      default: Date.now,
      get: convertToIST, // Automatically convert to IST on retrieval
      set: convertToIST, // Automatically convert to IST on setting
    },
  },
  {
    toJSON: { getters: true }, // Ensure the getter is applied when converting to JSON
    toObject: { getters: true }, // Ensure the getter is applied when converting to Object
  }
);

// Pre-save hook to convert createdDate to IST before saving
dataAddSchema.pre("save", function (next) {
  if (this.createdDate) {
    this.createdDate = convertToIST(this.createdDate);
  }
  if (this.data) {
    this.data.forEach((item) => {
      if (item.createdDate) {
        item.createdDate = convertToIST(item.createdDate);
      }
    });
  }
  next();
});

const DataAdd = model("DataAdd", dataAddSchema);
export { DataAdd };
