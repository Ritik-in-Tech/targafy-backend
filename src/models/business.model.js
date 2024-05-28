import { Schema, model } from "mongoose";
// import { Target } from "../models/target.model.js";

const commonStringConstraints = {
  type: String,
  trim: true,
  default: "",
};

// const paramSchema = new Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   type: {
//     type: String,
//     required: true,
//     enum: ["TypeA", "TypeB"], // Assuming these are the only valid types
//   },
//   stats: {
//     type: String, // Adjust this according to the actual structure of stats
//     // required: true,
//   },
// });
const businessSchema = new Schema({
  businessCode: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (value) {
        return /^[0-9A-Z]{6}$/.test(value);
      },
      message: (props) =>
        `${props.value} is not a valid six-digit alphanumeric code!`,
    },
  },
  name: commonStringConstraints,
  logo: {
    type: String,
  },
  industryType: commonStringConstraints,
  city: commonStringConstraints,
  country: commonStringConstraints,
  // email: {
  //   type: String,
  //   required: true,
  //   unique: true,
  //   validate: {
  //     validator: function (value) {
  //       // Simple regex for email validation
  //       return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  //     },
  //     message: (props) => `${props.value} is not a valid email address!`,
  //   },
  // },
  // params: {
  //   type: [paramSchema],
  //   default: [],
  // },
  targets: [
    {
      type: Schema.Types.ObjectId,
      ref: "Target",
    },
  ],
});

const Business = model("Business", businessSchema);

export { Business };
