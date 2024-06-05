import { Router } from "express";
const router = Router();
import { verifyJWT } from "../middleware/auth.middleware.js";
import { deleteGroup } from "../controllers/group/deleteGroup.controller.js";
import { updateGroupName } from "../controllers/group/updateGroupName.controller.js";
import { getUserAddedGroups } from "../controllers/group/getUserAddedGroups.controller.js";
import { addUsersInGroup } from "../controllers/group/addUsersInGroup.controller.js";
import { removeUsersFromGroup } from "../controllers/group/removeUsersFromGroup.controller.js";
import {
  createGroup,
  createSubGroup,
} from "../controllers/group/createGroup.controller.js";

router.use(verifyJWT);

router.route("/create/:businessId").post(createGroup); // done

router.route("/create-subgroups/:parentGroupId").post(createSubGroup);

router.route("/delete/:businessId/:groupId").delete(deleteGroup); // done

router.route("/update/name/:businessId/:groupId").patch(updateGroupName); // done

router.route("/add/users/:businessId/:groupId").put(addUsersInGroup); // done

router.route("/remove/users/:businessId/:groupId").put(removeUsersFromGroup); // done

router.route("/get/:businessId").get(getUserAddedGroups); // done

export default router;
