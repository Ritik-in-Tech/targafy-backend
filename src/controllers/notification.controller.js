import https from "https";
import { User } from "../../src/models/user.model.js";
import admin from "firebase-admin";
import { fileURLToPath } from "url";
import path from "path";

export async function sendNotification(userId, body) {
  try {
    if (!userId || !body) {
      console.log("Provide complete information!!");
      return;
    }

    const userInfo = await User.findOne({ _id: userId });

    if (!userInfo || !userInfo.fcmToken) {
      console.log("User does not have an FCM token!!");
      return;
    }

    let token = userInfo.fcmToken;
    let accessToken = process.env.FCM_ACCESS_TOKEN;
    // console.log("The token is:", token);
    // console.log("The access token is :", accessToken);

    const data = JSON.stringify({
      message: {
        token: token,
        notification: {
          title: "Targafy",
          body: body,
        },
        data: {}, // Additional data can be added here if needed
      },
    });

    const options = {
      hostname: "fcm.googleapis.com", // Corrected hostname
      path: "/v1/projects/targafy-288b2/messages:send",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // Corrected Authorization header
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        console.log("Status Code:", res.statusCode);
        console.log("Response:", responseData);
      });
    });

    req.on("error", (error) => {
      console.error("Error:", error);
    });

    req.write(data);
    req.end();
  } catch (e) {
    console.error("Exception:", e.toString());
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceKeyPath = path.join(__dirname, "../../service_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceKeyPath),
});

export async function sendNotification1(userId, body) {
  try {
    if (!userId || !body) {
      console.log("Provide complete information!!");
      return;
    }

    const userInfo = await User.findOne({ _id: userId });

    if (!userInfo.fcmToken) {
      console.log("User has no fcm token!!");
      return;
    }

    let token = userInfo.fcmToken;
    console.log(token);
    console.log(body);

    const message = {
      token: token,
      notification: {
        title: "Targafy",
        body: body,
      },
      data: {},
    };

    console.log("Sending notification:", message.notification);
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.log("Error sending message:", error);
  }
}
