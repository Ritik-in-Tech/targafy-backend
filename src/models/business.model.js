import { Schema, model } from "mongoose";
// import { Target } from "../models/target.model.js";

const commonStringConstraints = {
  type: String,
  trim: true,
  default: "",
};

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
  parameters: {
    type: [String],
    default: [],
  },
  targets: [
    {
      type: Schema.Types.ObjectId,
      ref: "Target",
    },
  ],
});

// Pre-save middleware to process the 'parameters' field
businessSchema.pre("save", function (next) {
  if (this.parameters && typeof this.parameters === "string") {
    // Split the string by spaces, trim each part, and filter out empty strings
    this.parameters = this.parameters
      .split(" ")
      .map((param) => param.trim())
      .filter(Boolean);
  }
  next();
});

const Business = model("Business", businessSchema);

export { Business };
