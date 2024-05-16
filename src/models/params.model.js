import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";

const commonStringConstraints = {
  type: String,
  trim: true,
  default: "",
};

const commonNumberConstraints = {
  type: Number,
  default: 0,
};

const paramsSchema = new Schema({
  name: commonStringConstraints,
  businessId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  charts: [commonStringConstraints],
  type: {
    type: String,
    enum: ["TypeA", "TypeB"],
  },
  region: {
    type: Object,
  },
  typeAParameter: {
    first: {
      type: Schema.Types.ObjectId,
      required: function () {
        return this.type === "TypeB";
      },
    },
    second: {
      type: Schema.Types.ObjectId,
      required: function () {
        return this.type === "TypeB";
      },
    },
  },
  stats: {
    CMA: commonNumberConstraints,
    PMA: commonNumberConstraints,
    P3MA: commonNumberConstraints,
    P3MB: commonNumberConstraints,
    P6MB: commonNumberConstraints,
  },
  currenttarget: {
    type: String,
    default: null,
  },
  targetAssignDate: {
    type: Date,
  },
  targetEndDate: {
    type: Date,
  },
  targetassignhistory: [
    {
      target: {
        type: String,
      },
      completedTarget: {
        type: String,
      },
      targetAssignDate: {
        type: Date,
      },
      targetEndDate: {
        type: Date,
      },
    },
  ],
  isHidden: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    value: {
      type: Boolean,
    },
    deletedDate: {
      type: Date,
    },
  },
  duration: {
    type: String,
    enum: ["1stTo31st", "upto30days", "30days"],
    default: "1stTo31st",
  },
  description: commonStringConstraints,
  createdAt: {
    type: Date,
    default: getCurrentIndianTime(),
  },
});

const Params = model("Params", paramsSchema);
export { Params };
