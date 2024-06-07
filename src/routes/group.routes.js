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
import { getGroupDataLevel } from "../controllers/group/getdata.group.controller.js";
import { getAllGroups } from "../controllers/group/getallgroups.controller.js";
import { getGroupUsers } from "../controllers/group/getgroupusers.controller.js";
import {
  level1GroupName,
  sublevelGroupName,
} from "../controllers/group/getsubgroups.controller.js";
import { getAboveGroupUsers } from "../controllers/group/getabovegroupusers.controller.js";
import { getSubGroupDetails } from "../controllers/group/getsubgroupdetails.controller.js";

router.use(verifyJWT);

router.route("/create/:businessId").post(createGroup); // done

router.route("/create-subgroups/:parentGroupId").post(createSubGroup); //done

router
  .route("/get-level-data/:businessId/:parentGroupId")
  .get(getGroupDataLevel);

router.route("/get-all-groups/:businessId").get(getAllGroups);

router.route("/get-user-group/:groupId/:businessId").get(getGroupUsers);

router
  .route("/get-above-group-users/:businessId/:parentGroupId")
  .get(getAboveGroupUsers);

router.route("/get-level1-group-names/:businessId").get(level1GroupName);

router
  .route("/get-sublevel-group-name/:businessId/:aboveLevelGroupName")
  .get(sublevelGroupName);

router
  .route("/get-subgroup-details/:businessId/:parentId")
  .get(getSubGroupDetails);

router.route("/delete/:businessId/:groupId").delete(deleteGroup); // done

router.route("/update/name/:businessId/:groupId").patch(updateGroupName); // done

router.route("/add/users/:businessId/:groupId").put(addUsersInGroup); // done

router.route("/remove/users/:businessId/:groupId").put(removeUsersFromGroup); // done

router.route("/get/:businessId").get(getUserAddedGroups); // done

export default router;
