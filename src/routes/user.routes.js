import { Router } from "express";
const router = Router();

import { verifyJWT } from "../middleware/auth.middleware.js";
import { getUser } from "../controllers/user/getUser.controller.js";
import { getUserNotification } from "../controllers/user/getUserNotification.controller.js";
import { updateUserName } from "../controllers/user/updateUserName.controller.js";
import { updateUserAvtar } from "../controllers/user/updateUserAvtar.controller.js";
import { getUserAvatar } from "../controllers/user/getUserAvatar.controller.js";
import { setFCMToken } from "../controllers/user.controller.js";
import { addLastSeenHistory } from "../controllers/user/addlastseenhistory.js";

router.use(verifyJWT);

router.route("/").get(getUser);

router.route("/notifications").get(getUserNotification);

router.route("/update/name/:newName").patch(updateUserName);

router.route("/update/fcmToken").patch(setFCMToken);

router.route("/update/user-avatar").post(updateUserAvtar);

// router.route("/reset/notificationCounter").patch(resetNotificationCounter);

router.route("/request/user-avatar").get(getUserAvatar);

router.route("/add-lastseenhistory").post(addLastSeenHistory);

export default router;
