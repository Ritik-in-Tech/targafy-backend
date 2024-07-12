import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { User } from "../../models/user.model.js";

export async function getParentIdsList(userId, businessId) {
  const parentIds = [];
  let currentUserId = userId;

  while (currentUserId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        break;
      }

      const business = await Business.findById(businessId);
      if (!business) {
        break;
      }

      const userData = await Businessusers.findOne({
        businessId: businessId,
        userId: userId,
      });

      if (!userData || !userData.parentId) {
        break;
      }

      parentIds.push(userData.parentId.$oid);
      currentUserId = userData.parentId.$oid;
    } catch (error) {
      console.log("Error fetching user data:", error);
      break;
    }
  }

  return parentIds;
}
