import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";

const groupSchema = new Schema({
  businessId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please enter business Id, this issue belogs to"],
  },
  groupId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  name: {
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
});

const Group = model("Groups", groupSchema);
export { Group };
