import { Schema, model } from "mongoose";
// import { Target } from "../models/target.model.js";

const commonStringConstraints = {
  type: String,
  trim: true,
  default: "",
};

const paramSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    paramId: {
      type: Schema.Types.ObjectId,
    },
  },
  { _id: false }
);
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
  params: {
    type: [paramSchema],
    default: [],
  },
  targets: [
    {
      type: Schema.Types.ObjectId,
      ref: "Target",
    },
  ],
});

const Business = model("Business", businessSchema);

export { Business };
