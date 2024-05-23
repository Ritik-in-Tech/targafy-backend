import express from "express";
import dotenv from "dotenv";
import { server } from "./server.js";
import { connectDB } from "./db/index.js";

dotenv.config({ path: "../.env" });

const majorNodeVersion = +process.env.NODE_VERSION?.split(".")[0] || 0;

const PORT = process.env.PORT || 4000;

const startServer = () => {
  server.listen(PORT, () => {
    console.log("⚙️  Server is running on port: " + PORT);
  });
};

if (majorNodeVersion >= 14) {
  try {
    await connectDB();
    startServer();
  } catch (err) {
    console.log("Mongo db connect error: ", err);
  }
} else {
  connectDB()
    .then(() => {
      startServer();
    })
    .catch((err) => {
      console.log("Mongo db connect error : ", err);
    });
}
