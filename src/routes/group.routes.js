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
import { getSubGroupDataLevel } from "../controllers/group/getsubgroupdata.controller.js";
import {
  getAllGroups,
  getGroupDetails,
  getGroupId,
} from "../controllers/group/getallgroups.controller.js";
import { getGroupUsers } from "../controllers/group/getgroupusers.controller.js";
import {
  level1GroupName,
  level2GroupName,
  sublevelGroupName,
} from "../controllers/group/getsubgroups.controller.js";
import { getAboveGroupUsers } from "../controllers/group/getabovegroupusers.controller.js";
import { getSubGroupDetails } from "../controllers/group/getsubgroupdetails.controller.js";
import { getMainGroupData } from "../controllers/group/getmaingroup.data.controller.js";
import { updateGroupLogo } from "../controllers/group/updategrouplogo.controller.js";

router.use(verifyJWT);

router.route("/create/:businessId").post(createGroup); // done

router.route("/create-subgroups/:parentGroupId").post(createSubGroup); //done

router.route("/get-group-details/:groupId").get(getGroupDetails); // done

router.route("/get-level-data/:groupId").post(getSubGroupDataLevel); // done

router.route("/get-main-group-data/:businessId/:paramId").get(getMainGroupData); // done

router.route("/get-groupId/:businessId/:groupName").get(getGroupId); // done

router.route("/get-all-groups/:businessId").get(getAllGroups); // done

router.route("/get-user-group/:groupId/:businessId").get(getGroupUsers); // done

router
  .route("/get-above-group-users/:businessId/:parentGroupId")
  .get(getAboveGroupUsers); // done

router.route("/get-level1-group-names/:businessId").get(level1GroupName); // done

router.route("/get-level2-group-names/:groupId").get(level2GroupName); // done

router
  .route("/get-sublevel-group-name/:aboveLevelGroupId")
  .get(sublevelGroupName); // done

router.route("/get-subgroup-details/:parentId").get(getSubGroupDetails); // done

router.route("/delete/:businessId/:groupId").delete(deleteGroup); // done

router.route("/update/name/:businessId/:groupId").patch(updateGroupName); // done

router.route("/add/users/:businessId/:groupId").put(addUsersInGroup); // done

router.route("/remove/users/:businessId/:groupId").put(removeUsersFromGroup); // done

router.route("/get/:businessId").get(getUserAddedGroups); // done

router.route("/update-logo/:groupId/:businessId").post(updateGroupLogo); // done

export default router;
