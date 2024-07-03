import { GoogleAuth } from "google-auth-library";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_ACCOUNT_FILE = path.join(__dirname, "../service_key.json");

const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

export const getAccessToken = async () => {
  try {
    const serviceAccount = JSON.parse(
      fs.readFileSync(SERVICE_ACCOUNT_FILE, "utf8")
    );

    // Create a new GoogleAuth instance
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: SCOPES,
    });

    // Get the access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    console.log(`Access Token: ${accessToken.token}`);
    return accessToken.token;
  } catch (error) {
    console.error("Error getting access token:", error);
  }
};
