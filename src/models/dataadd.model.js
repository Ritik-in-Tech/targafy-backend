import { Schema, model } from "mongoose";

import { commonDateConstraints } from "../utils/helpers/schema.helper.js";
const commonStringConstraints = {
  type: String,
  trim: true,
  default: "",
};

const simpleData = new Schema(
  {
    todaysdata: commonStringConstraints,
    comment: commonStringConstraints,
    createdDate: {
      type: Date,
    },
  },
  {
    _id: false,
  }
);

const dataAddSchema = new Schema({
  parameterName: commonStringConstraints,
  data: [simpleData],
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  businessId: { type: Schema.Types.ObjectId, required: true },
  createdDate: commonDateConstraints,
});

const DataAdd = model("DataAdd", dataAddSchema);
export { DataAdd };
