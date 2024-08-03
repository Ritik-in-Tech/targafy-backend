import { Router } from "express";
const router = Router();
import {
  buisnessRole,
  checkIsUserBusiness,
  createBusiness,
  deleteBusiness,
} from "../controllers/business.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { updateBusinessLogo } from "../controllers/business/updatebusinesslogo.controller.js";
import { acceptUserJoinRequest } from "../controllers/business/acceptjoinbusinessrequest.controller.js";
import { declineUserJoinRequest } from "../controllers/business/diclinejoinbusinessrequest.controller.js";
import { joinBusiness } from "../controllers/business/joinbusiness.controller.js";
import { updateBusinessDetails } from "../controllers/business/updatebusinessdetails.controller.js";
import { removeUserFromBusiness } from "../controllers/business/removeuserfrombusiness.controller.js";
import { getUserProfileInBusiness } from "../controllers/business/getuserprofileInbusiness.controller.js";
import {
  getAllsubOrdinatesBusinessUsers,
  getBusinessUsers,
} from "../controllers/business/getbusinessusers.controller.js";
import { fetchBusinessDetailsAndParams } from "../controllers/business/fetchBusinessDetailsAndParams.controller.js";
import {
  demoteUser,
  promoteUser,
} from "../controllers/business/promoteUserInBusiness.controller.js";
import { promoteToAdmin } from "../controllers/business/promoteUserToAdmin.controller.js";
import getBusinessRequests from "../controllers/business/getBusinessRequests.controller.js";
import { getBusinessAcceptedRequests } from "../controllers/business/getBusinessAcceptedRequests.controller.js";
import { getBusinessDeclinedRequests } from "../controllers/business/getBusinessDeclinedRequests.controller.js";
import getPendingRequestCount from "../controllers/business/getPendingRequestCount.controller.js";
import { getBusinessLogo } from "../controllers/business/getBusinessLogo.controller.js";
import { rateUserInBusiness } from "../controllers/business/rateUserInBusiness.controller.js";
import { updateBusinessParameters } from "../controllers/business/updatebusinessparameters.js";
import { getBusinessUserDetails } from "../controllers/business/getBusinessDetails.js";
import {
  getSubUserHierarchyData,
  getSubUserHierarchyDataNew,
  getUserHierarchyData,
} from "../controllers/business/getuserhierarchy.controller.js";
import { changeManager } from "../controllers/business/changemanager.controller.js";
import { getBusinessUserRatings } from "../controllers/business/getbusinessuserratings.controller.js";
import { checkBusinessApproved } from "../controllers/business/checkbusinessapproved.controller.js";

router.use(verifyJWT);

// create business
router.route("/create").post(createBusiness);

// delete business
router.route("/delete/:businessId").patch(deleteBusiness); //done

// update business Logo
router.route("/update/logo/:businessId").put(updateBusinessLogo); // done

// add user to business
router.route("/send/request/:businessCode").post(joinBusiness); // done

// remove user to business
router
  .route("/remove/user/:businessId/:userToRemoveId")
  .delete(removeUserFromBusiness); // done

// update business details
router.route("/update/:businessId").patch(updateBusinessDetails); // done

// get all users from particular business
router.route("/get/all/users/:businessId").get(getBusinessUsers); // done  // this I have also to check

router
  .route("/get-all-subordinate-businessusers/:businessId/:departmentId")
  .get(getAllsubOrdinatesBusinessUsers); // done

// get user profile in particular business
router.route("/user/:businessId/:userId").get(getUserProfileInBusiness); // done

// you can admin or miniadmin can promote user to miniadmin or viceversa
router.route("/promotion/:businessId/:departmentId").patch(promoteUser); // done

// router to demote user from mini admin to user
router.route("/demote/:businessId/:departmentId").patch(demoteUser);

// only admin can promote user or mini admin to admin
router
  .route("/promote/admin/:businessId/:userIdToPromote/:departmentId")
  .patch(promoteToAdmin); // done

// router to change user manager
router
  .route("/change-manager/:businessId/:userId/:departmentId")
  .patch(changeManager);

// rate business user
router.route("/rate/user/:businessId/:userId").post(rateUserInBusiness); // done

// router to return the business role
router.route("/get-user-role/:businessId/:departmentId").get(buisnessRole);

// fetchBusiness Details
router.route("/get-business-details").get(getBusinessUserDetails);

//check userHaveBusiness
router.route("/checkBusiness").get(checkIsUserBusiness);

// update business parameters
router.route("/update-parameters/:businessId").patch(updateBusinessParameters);

// router to get the user Hierarchy
router.route("/get-user-hierarchy/:businessId").get(getUserHierarchyData);

// accept, request or get all accepted request
router
  .route("/accept/request/:businessId")
  .post(acceptUserJoinRequest)
  .get(getBusinessAcceptedRequests); // done

// decline request or get decline request
router
  .route("/decline/request/:businessId")
  .post(declineUserJoinRequest)
  .get(getBusinessDeclinedRequests); // done

// get all business and its data and users
router.route("/get/:businessId").get(fetchBusinessDetailsAndParams); // done

// get all join business request
router.route("/get/request/:businessId").get(getBusinessRequests); // done

// get all pending join request
router.route("/requests/count/:businessId").get(getPendingRequestCount); // done

// get business logo
router.route("/requests/user-business-logo/:businessId").get(getBusinessLogo); // done

// get Business user ratings
router
  .route("/get-business-user-rating/:businessId")
  .get(getBusinessUserRatings);

router.route("/check-approvalBusiness").get(checkBusinessApproved);

router
  .route("/get-sub-hierarchy/:businessId/:departmentId")
  .get(getSubUserHierarchyData);

router
  .route("/get-sub-hierarchy-new/:businessId/:departmentId")
  .get(getSubUserHierarchyDataNew);

export default router;
