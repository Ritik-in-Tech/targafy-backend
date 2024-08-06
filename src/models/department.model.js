import { Schema, model } from "mongoose";
import { commonStringConstraints } from "../utils/helpers/schema.helper.js";

const departmentSchema = new Schema({
  businessId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please provide a business id"],
  },
  name: commonStringConstraints,
  paramNames: {
    type: [commonStringConstraints],
  },
  paramId: {
    type: [Schema.Types.ObjectId],
  },
});

const Department = model("Department", departmentSchema);
export { Department };
