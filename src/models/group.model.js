import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";
import { commonStringConstraints } from "../utils/helpers/schema.helper.js";

const userAdded = new Schema(
  {
    name: commonStringConstraints,
    userId: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    _id: false,
  }
);
const subordinateGroups = new Schema(
  {
    subordinategroupName: commonStringConstraints,
    subordinateGroupId: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    _id: false,
  }
);
const groupSchema = new Schema({
  businessId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please enter business Id, this group belogs to"],
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
  userAdded: {
    type: [userAdded],
    default: [],
  },
  subordinateGroups: {
    type: [subordinateGroups],
    default: [],
  },
  parentGroupId: {
    type: Schema.Types.ObjectId,
  },
});

const Group = model("Groups", groupSchema);
export { Group };
