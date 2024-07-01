import https from "https";
import { User } from "../../src/models/user.model.js";
import admin from "firebase-admin";
import { fileURLToPath } from "url";
import path from "path";

export async function sendNotification(userId, body) {
  try {
    // console.log("This is userID " , userId , " this is body : " , body);
    if (!userId || !body) {
      console.log("Provide complete information!!");
      return;
    }

    const userInfo = await User.findOne({ _id: userId });
    // console.log(userInfo);

    if (!userInfo.fcmToken) {
      console.log("User have not fcm token!!");
      return;
    }

    let token = userInfo.fcmToken;

    // console.log("Hiii");

    let serverKey = process.env.FCM_API_KEY;
    // console.log(serverKey);

    const data = JSON.stringify({
      to: token,
      notification: {
        title: "Targafy",
        body: body,
      },
      data: {},
    });

    const options = {
      hostname: "fcm.googleapis.com",
      path: "/fcm/send",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${serverKey}`, // Changed from Bearer to key=
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
    console.error(e.toString());
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
