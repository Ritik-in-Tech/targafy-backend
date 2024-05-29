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

const userSchema = new Schema(
  {
    name: commonStringConstraints,
    userId: {
      type: Schema.Types.ObjectId,
    },
  },
  { _id: false }
);

const targetSchema = new Schema({
  targetValue: commonStringConstraints,
  paramName: commonStringConstraints,
  comment: commonStringConstraints,
  businessId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  usersAssigned: [userSchema],
  createdDate: commonDateConstraints,
});

const Target = model("Target", targetSchema);
export { Target };
