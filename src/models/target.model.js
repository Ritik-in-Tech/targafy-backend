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
  title: commonStringConstraintsRequired,
  details: commonStringConstraints,
  createdBy: {
    name: commonStringConstraintsRequired,
    id: {
      type: Schema.Types.ObjectId,
    },
  },
  assignedTo: {
    name: commonStringConstraintsRequired,
    id: {
      type: Schema.Types.ObjectId,
    },
  },
  dailyFinishedTarget: [
    {
      finishedDate: {
        type: Date,
        default: getCurrentIndianTime(),
      },
      target: {
        type: Number,
        default: 0,
      },
      comment: {
        type: String,
      },
    },
  ],
  createdDate: commonDateConstraints,
  deliveryDate: {
    type: Date,
    default: null,
  },
  nextFollowUpDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    default: "Pending",
    trim: true,
  },
});

const Target = model("Target", targetSchema);
export { Target };
