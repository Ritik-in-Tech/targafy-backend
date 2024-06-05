import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";
import { commonStringConstraints } from "../utils/helpers/schema.helper.js";

const subordinateGroups = new Schema(
  {
    subordinategroupName: commonStringConstraints,
    subordinateGroupId: {
      type: Schema.Types.ObjectId,
    },
    targetAchieved: {
      type: Number,
    },
  },
  {
    _id: false,
  }
);
const groupSchema = new Schema({
  businessId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please enter business Id, this issue belogs to"],
  },
  groupId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  groupName: {
    type: String,
    trim: true,
    default: "",
    required: true,
  },
  logo: {
    type: String,
    trim: true,
    default: "",
  },
  createdDate: {
    type: Date,
    default: getCurrentIndianTime(),
  },
  usersIds: [
    {
      type: Schema.Types.ObjectId,
    },
  ],
  subordinateGroups: [subordinateGroups],
});

const Group = model("Groups", groupSchema);
export { Group };
