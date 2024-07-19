import { Businessusers } from "../models/businessUsers.model.js";
import { isMongoId, splitMongoId } from "../utils/helpers.js";
import { getCurrentIndianTime } from "../utils/helpers/time.helper.js";

let issueNsp;

export function initializeActivitySocket(io) {
  try {
    console.log("***** Io Business Activity started *****");

    const issueNsp = io.of("/business/activity");

    issueNsp.on("connection", (socket) => {
      console.log("User Connected: ", socket.id);

      socket.on("business-user-joined", async (username) => {
        if (typeof username !== "string") {
          console.log("Invalid username format: Username must be a string");
          return;
        }

        const parts = username.split("_");
        if (parts.length !== 2) {
          console.log(
            "Invalid username format: Username must contain exactly one underscore"
          );
          return;
        }

        const [businessId, userId] = parts;
        if (!isMongoId(businessId) || !isMongoId(userId)) {
          console.log(
            "Invalid username format: Both parts must be valid MongoDB ObjectIDs"
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
        if (!username) {
          console.log("No username associated with this socket");
          return;
        }

        const ids = splitMongoId(username);
        console.log(ids);
        console.log("These are business and user ids : ", ids);

        if (ids.businessId && ids.userId) {
          if (isMongoId(ids.businessId) && isMongoId(ids.userId)) {
            const user = await Businessusers.findOne({
              businessId: ids.businessId,
              userId: ids.userId,
            });
            console.log(user);

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
        const rooms = Object.keys(socket.rooms);
        rooms.forEach((room) => {
          socket.leave(room);
          console.log(`User left room ${room}`);
        });
        console.log(`User left all rooms`);
        delete socket.username;
      });
    });

    return issueNsp;
  } catch (error) {
    console.error("Error initializing activity socket:", error);
    throw error;
  }
}
