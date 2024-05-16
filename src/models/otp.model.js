import { model, Schema } from "mongoose";

const otpSchema = new Schema({
  otp: {
    type: Number,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  count: {
    type: Number,
    default: 0,
    max: [5, "count must be less than or equal to 5"],
  },
  requestTime: {
    type: Date,
    default: Date.now,
  },
  expirationTime: {
    type: Date,
    required: true,
  },
});

const Otp = model("Otp", otpSchema);
export { Otp };
