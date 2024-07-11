import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";

const commonStringConstraints = {
  type: String,
  trim: true,
  default: "",
};

const commonStringConstraintsRequired = {
  ...commonStringConstraints,
  required: true,
};

const commonNumberConstraints = {
  type: Number,
  default: 0,
};

const commonDateConstraints = {
  type: Date,
  default: getCurrentIndianTime(),
};

const targetSchema = new Schema({
  targetValue: commonStringConstraints,
  paramName: commonStringConstraints,
  comment: commonStringConstraints,
  businessId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  assignedto: commonStringConstraints,
  assignedBy: commonStringConstraints,
  monthIndex: commonStringConstraints,
  updatedBy: commonStringConstraints,
  createdDate: commonDateConstraints,
});

const Target = model("Target", targetSchema);
export { Target };
