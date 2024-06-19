import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";
// import { trim } from "lodash";
import { commonStringConstraints } from "../utils/helpers/schema.helper.js";

const userRatingSchema = new Schema({
  // In business rating belongs to which user
  userId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please provide a user id"],
  },

  // Rating belong to which business
  businessId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please provide a business id"],
  },

  rating: {
    type: Number,
    constraints: {
      required: true,
      maximum_value: 5,
    },
  },
  message: {
    type: String,
    required: true,
  },
  givenTo: commonStringConstraints,
  givenBy: {
    name: {
      type: String,
      // trim: true,
      default: "Unknown",
    },
    id: {
      type: Schema.Types.ObjectId,
    },
  },
  createdDate: {
    type: Date,
    default: getCurrentIndianTime(),
  },
});

const Usersratings = model("Usersratings", userRatingSchema);
export { Usersratings };
