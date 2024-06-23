import { Schema, model } from "mongoose";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";
import { commonStringConstraints } from "../utils/helpers/schema.helper.js";

const userAdded = new Schema(
  {
    name: commonStringConstraints,
    userId: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    _id: false,
  }
);

const subordinateOffices = new Schema(
  {
    subordinateofficeName: commonStringConstraints,
    subordinateOfficeId: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    _id: false,
  }
);

const allsubordinateOffices = new Schema(
  {
    subordinateofficeName: commonStringConstraints,
    subordinateOfficeId: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    _id: false,
  }
);

const officeSchema = new Schema({
  businessId: {
    type: Schema.Types.ObjectId,
    required: [true, "Please enter business Id, this office belogs to"],
  },
  officeName: {
    type: String,
    trim: true,
    default: "",
    required: true,
  },
  createdDate: {
    type: Date,
    default: getCurrentIndianTime(),
  },
  userAdded: {
    type: [userAdded],
    default: [],
  },
  subordinateOffice: {
    type: [subordinateOffices],
    default: [],
  },
  allsubordinateOffices: {
    type: [allsubordinateOffices],
    default: [],
  },
  parentOfficeId: {
    type: Schema.Types.ObjectId,
  },
});

const Office = model("Office", officeSchema);
export { Office };
