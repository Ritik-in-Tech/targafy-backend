import { Group } from "../models/group.model.js";
export async function getUniqueUserIds(groupId) {
  const uniqueUserIds = new Set();

  async function collectUserIds(currentGroupId) {
    const group = await Group.findById(currentGroupId);

    if (!group) return;

    // Add users from the current group
    if (group.userAdded) {
      group.userAdded.forEach((user) => {
        uniqueUserIds.add(user.userId.toString());
      });
    }

    // Recursively collect users from subordinate groups
    if (group.subordinateGroups && group.subordinateGroups.length > 0) {
      for (const subGroup of group.subordinateGroups) {
        await collectUserIds(subGroup.subordinateGroupId);
      }
    }
  }

  await collectUserIds(groupId);
  return Array.from(uniqueUserIds);
}
