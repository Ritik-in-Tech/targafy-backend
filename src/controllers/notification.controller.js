import https from "https";
import { User } from "../../src/models/user.model.js";
import admin from "firebase-admin";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the service key path from the environment variable
const serviceKeyPath = process.env.SERVICE_KEY;

if (!serviceKeyPath) {
  throw new Error("SERVICE_KEY is not set in the environment");
}

const projectRoot = path.resolve(__dirname, "../..");
const fullServiceKeyPath = path.join(projectRoot, serviceKeyPath);

// console.log(fullServiceKeyPath);

// Read and parse the service account file
let serviceAccount;
try {
  const serviceAccountFile = fs.readFileSync(fullServiceKeyPath, "utf8");
  serviceAccount = JSON.parse(serviceAccountFile);
} catch (error) {
  console.error("Error reading service account file:", error);
  throw error;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export async function sendNotificationNew(userId, body) {
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
