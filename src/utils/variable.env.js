import dotenv from "dotenv";
// dotenv.config("../../.env");
dotenv.config({ path: ".env" });

const ENV_VAR = {
  MONGO_URI: process.env.MONGODB_URI,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
  AUTHKEY: process.env.AUTHKEY,
};
export { ENV_VAR };
