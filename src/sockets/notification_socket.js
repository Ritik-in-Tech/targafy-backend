import { User } from "../../src/models/user.model.js";
import NotificationModel from "../../src/models/notification.model.js";

import {
  sendNotification,
  sendNotificationNew,
} from "../controllers/notification.controller.js";

let io;
let connectedSocket;

export function initializeNotificationSocket(io) {
  try {
    console.log("***** Io Notifcation started *****");

    io.on("connection", (socket) => {
      connectedSocket = socket;
      console.log("User Connected: ", socket.id);

      socket.on("user-joined", (username) => {
        socket.username = username;
        console.log(`User connected on home page: ${username}`);
        socket.join(username);
      });

      socket.on("message", (message) => {
        console.log(`Received message: ${message}`);
        // You can also broadcast this message to all connected clients if needed
        io.emit("notification", message);
      });

      socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
        const rooms = Object.keys(socket.rooms);
        rooms.forEach((room) => {
          socket.leave(room);
          console.log(`User left room ${room}`);
        });
      });
    });
    return io;
  } catch (error) {
    console.error("Error initializing activity socket:", error);
    throw error;
  }
}

// it's used when particular socket to send notification or data
export function getSocket() {
  return connectedSocket;
}

// it's used when to broadcast to all the connected clients
export function getIo() {
  return io;
}

export async function emitNewNotificationEvent(userId, eventData) {
  const currentSocket = getSocket();
  if (currentSocket) {
    // console.log("This is event data : "  , eventData);
    if (
      !userId ||
      !eventData ||
      !eventData.content ||
      !eventData.createdDate ||
      !eventData.notificationCategory
    ) {
      return;
    }

    await User.updateOne(
      { _id: userId },
      {
        $inc: {
          notificationViewCounter: 1,
        },
      }
    );

    let data = await NotificationModel.create({ ...eventData, userId });

    // console.log("this is data ", data);

    //  console.log(result);

    // console.log("This is userid where notification is sent : ", userId);

    currentSocket.to(userId).emit("new-notification", eventData);

    await sendNotificationNew(userId, eventData.content);
  } else {
    throw new Error(
      "Socket.io not initialized. Call initializeActivitySocket(server) first."
    );
  }
}

export async function emitNewNotificationAndAddBusinessEvent(
  userId,
  businessId,
  eventData,
  newBusiness
) {
  const currentSocket = getSocket();
  if (currentSocket) {
    console.log("This is event data : ", eventData, userId);
    if (
      !userId ||
      !eventData ||
      !eventData.content ||
      !eventData.createdDate ||
      !eventData.notificationCategory
    ) {
      return;
    }

    // console.log("This mishra.......");

    await User.updateOne(
      { _id: userId },
      {
        $inc: {
          notificationViewCounter: 1,
        },
      }
    );

    let notificationData = await NotificationModel.create({
      ...eventData,
      userId,
    });

    // console.log("This is userid", userId);

    // console.log("This is eventData : ", eventData);
    // console.log("This is newBusiness : ", newBusiness);

    const data = {
      eventData: eventData,
      newBusiness: newBusiness,
    };

    // console.log("This is data }", data);
    currentSocket.to(userId).emit("new-notification-add-business", data);

    sendNotificationNew(userId, eventData.content);
  } else {
    throw new Error(
      "Socket.io not initialized. Call initializeActivitySocket(server) first."
    );
  }
}

export async function joinBusinessNotificationEvent(userId, eventData) {
  const currentSocket = getSocket();
  if (currentSocket) {
    // console.log("This is event data : "  , eventData);
    if (
      !userId ||
      !eventData ||
      !eventData.content ||
      !eventData.createdDate ||
      !eventData.notificationCategory
    ) {
      return;
    }

    await User.updateOne(
      { _id: userId },
      {
        $inc: {
          acceptViewCounter: 1,
        },
      }
    );

    let data = await NotificationModel.create({ ...eventData, userId });

    // console.log("this is data ", data);

    //  console.log(result);

    // console.log("This is userid where notification is sent : ", userId);

    currentSocket.to(userId).emit("join-business-notification", eventData);

    await sendNotificationNew(userId, eventData.content);
  } else {
    throw new Error(
      "Socket.io not initialized. Call initializeActivitySocket(server) first."
    );
  }
}

export async function activityNotificationEvent(userId, eventData) {
  const currentSocket = getSocket();
  if (currentSocket) {
    // console.log("This is event data : "  , eventData);
    if (
      !userId ||
      !eventData ||
      !eventData.content ||
      !eventData.createdDate ||
      !eventData.notificationCategory
    ) {
      return;
    }

    await User.updateOne(
      { _id: userId },
      {
        $inc: {
          activityViewCounter: 1,
        },
      }
    );

    let data = await NotificationModel.create({ ...eventData, userId });

    // console.log("this is data ", data);

    //  console.log(result);

    // console.log("This is userid where notification is sent : ", userId);

    currentSocket.to(userId).emit("activity-notification", eventData);

    await sendNotificationNew(userId, eventData.content);
  } else {
    throw new Error(
      "Socket.io not initialized. Call initializeActivitySocket(server) first."
    );
  }
}
