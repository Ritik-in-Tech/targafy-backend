import mongoose, { model } from "mongoose";
const { Schema } = mongoose;
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";

const businessChatsSchema = new Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    chats: [
      {
        sender: {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          name: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 255,
          },
        },
        isAttachment: {
          type: Boolean,
          default: false,
        },
        attachments: {
          url: {
            type: String,
            required: function () {
              return this.isAttachment;
            },
          },
          name: {
            type: String,
            required: function () {
              return this.isAttachment;
            },
          },
          type: {
            type: String,
            required: function () {
              return this.isAttachment;
            },
          },
        },
        content: {
          type: String,
          trim: true,
          maxlength: 2000,
          validate: {
            validator: function () {
              // Require content if isAttachment is false
              return !this.isAttachment || !!this.content;
            },
            message: "Content is required if isAttachment is false",
          },
        },
        messageType: {
          type: String,
          required: true,
          trim: true,
          minlength: 1,
          maxlength: 255,
        },
        createdAt: {
          type: Date,
          default: getCurrentIndianTime(),
          index: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Targetchats = model("Targetchats", businessChatsSchema);
export { Targetchats };
