import { Schema, model } from "mongoose";
import { commonStringConstraints } from "../utils/helpers/schema.helper.js";

const benchMarkSchema = new Schema(
  {
    value: commonStringConstraints,
  },
  { _id: false }
);

const typeBParamSchema = new Schema({
  paramName1: commonStringConstraints,
  paramName2: commonStringConstraints,
  businessId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  departmentId: {
    type: Schema.Types.ObjectId,
  },
  benchMark: [benchMarkSchema],
});

const TypeBParams = model("TypeBParams", typeBParamSchema);
export { TypeBParams };
