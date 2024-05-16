import mongoose, { Schema, model } from "mongoose";

// Define schema for unseen messages count
const unseenMessagesCountSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please provide a user id"],
  },
  businessId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please provide a business id"],
  },
  unseenMessagesCount: [
    {
      count: {
        type: Number,
        default: 0,
      },
      targetId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
    },
  ],
});

const UserUnseenMessageCount = model(
  "UserUnseenMessageCount",
  unseenMessagesCountSchema
);
export { UserUnseenMessageCount };
