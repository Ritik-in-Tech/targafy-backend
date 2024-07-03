import { Router } from "express";
const router = Router();
import { createTarget } from "../controllers/target/createtarget.controller.js";
import { getAllTargets } from "../controllers/target/getalltargets.controller.js";
import { getTargetValues } from "../controllers/target/gettargetvalues.controller.js";
import { addUserToTarget } from "../controllers/target/addusertotarget.controller.js";
import { getTargetById } from "../controllers/target/gettargetbyid.controller.js";
import { updateUserTarget } from "../controllers/target/updatetarget.controller.js";
import { deleteTarget } from "../controllers/target/deletetarget.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

// router to verify that jwt token is still valid
router.use(verifyJWT);
// router to create target
router.route("/add-target/:businessId").post(createTarget);

// router to get parameters and target values
router.route("/get-target-values/:businessId").get(getTargetValues);

// add user to existing target
router
  .route("/add-user-to-target/:businessId/:paramName")
  .post(addUserToTarget);

// router to get all targets for specific business
router.route("/all/:id").get(getAllTargets);

router
  .route("/update-user-target/:businessId/:paramName")
  .put(updateUserTarget);

// router to get the target by id , update and delete the target
router.route("/:bid/:tid").get(getTargetById).delete(deleteTarget);

export default router;
