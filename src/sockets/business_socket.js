import { Businessusers } from "../models/businessUsers.model.js";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";

let issueNsp;

export function initializeActivitySocket(io) {
  try {
    console.log("***** Io Business Activity started *****");

    issueNsp = io.of("/business/activity");

    issueNsp.on("connection", (socket) => {
      console.log("User Connected: ", socket.id);

      socket.on("business-user-joined", async (username) => {
        if (!isValidUsernameFormat(username)) {
          console.log(
            "Invalid username format. Expected format: businessId_userId"
          );
          socket.emit(
            "error",
            "Invalid username format. Expected format: businessId_userId"
          );
          return;
        }

        socket.username = username;
        console.log(`User connected In Activity Socket: ${username}`);

        socket.join(username);
      });

      socket.on("disconnect", async () => {
        console.log("User Disconnected", socket.id);

        const username = socket.username;

        if (!username || !isValidUsernameFormat(username)) {
          console.log("Invalid username format on disconnect");
          return;
        }

        const ids = splitMongoId(username);
        console.log("These are business and user ids : ", ids);

        if (ids.businessId && ids.userId) {
          if (isMongoId(ids.businessId) && isMongoId(ids.userId)) {
            const user = await Businessusers.findOne({
              businessId: ids.businessId,
              userId: ids.userId,
            });

            if (user) {
              await Businessusers.updateOne(
                { businessId: ids.businessId, userId: ids.userId },
                {
                  $set: {
                    lastSeen: getCurrentIndianTime(),
                  },
                }
              );
            } else {
              console.log("User not found in the database.");
            }
          } else {
            console.log(
              "At least one of the IDs is not a valid MongoDB ObjectID."
            );
          }
        }

        console.log("User Disconnected username : ", username);
        if (username) {
          const rooms = Object.keys(socket.rooms);
          rooms.forEach((room) => {
            socket.leave(room);
            console.log(`User left room ${room}`);
          });
          console.log(`User left all rooms`);
          delete socket.username;
        }
      });
    });

    return issueNsp;
  } catch (error) {
    console.error("Error initializing activity socket:", error);
    throw error;
  }
}

function isValidUsernameFormat(username) {
  if (typeof username !== "string" || username.split("_").length !== 2) {
    return false;
  }
  const [businessId, userId] = username.split("_");
  return businessId && userId && isMongoId(businessId) && isMongoId(userId);
}
