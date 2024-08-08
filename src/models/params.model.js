import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";

const commonStringConstraints = {
  type: String,
  trim: true,
  default: "",
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

// const subOrdinateGroups = new Schema(
//   {
//     groupName: commonStringConstraints,
//     groupId: {
//       type: Schema.Types.ObjectId,
//     },
//   },
//   {
//     _id: false,
//   }
// );

const paramsSchema = new Schema({
  name: commonStringConstraints,
  businessId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  usersAssigned: [userSchema],
  // charts: [commonStringConstraints],
  // duration: {
  //   type: String,
  //   enum: ["1stTo31st", "upto30days", "30days"],
  //   default: "1stTo31st",
  // },
  description: commonStringConstraints,
  // subOrdinateGroups: [subOrdinateGroups],
  createdAt: {
    type: Date,
    default: getCurrentIndianTime(),
  },
});

const Params = model("Params", paramsSchema);
export { Params };
