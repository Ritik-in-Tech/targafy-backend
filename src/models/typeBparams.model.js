import { Schema, model } from "mongoose";
import { commonStringConstraints } from "../utils/helpers/schema.helper.js";

const typeBParamSchema = new Schema({
  paramName1: commonStringConstraints,
  paramName2: commonStringConstraints,
  businessId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
});

const TypeBParams = model("TypeBParams", typeBParamSchema);
export { TypeBParams };
