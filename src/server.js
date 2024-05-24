import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import YAML from "yaml";
import sdk from "api";
const sdkInstance = sdk("@msg91api/v5.0#6n91xmlhu4pcnz");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = fs.readFileSync(
  path.resolve(__dirname, "../swagger.yaml"),
  "utf8"
);
const swaggerDocument = YAML.parse(file);

import { initializeNotificationSocket } from "./sockets/notification_socket.js";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:8000",
      "http://localhost:5000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const notificationNamespace = initializeNotificationSocket(io);

// Middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Global middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(bodyParser.json()); // Parse incoming JSON data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET || "your-secret-key",
    resave: true,
    saveUninitialized: true,
  })
);

import businessRoutes from "./routes/business.routes.js";
import authRoutes from "./routes/authentication.routes.js";
import groupRoutes from "./routes/group.routes.js";
import paramsRoutes from "./routes/params.routes.js";
import targetRoutes from "./routes/target.routes.js";
import userRoutes from "./routes/user.routes.js";
import ApiError from "./utils/ApiError.js";
import uploadRouter from "./routes/upload.document.js";

app.use("/api/v1/business", businessRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/group", groupRoutes);
app.use("/api/v1/params", paramsRoutes);
app.use("/api/v1/target", targetRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1", uploadRouter);
app.get("*", (req, res) => {
  res.json({
    message: "welcome to Targafy API. To see all api's please visit this url: ",
  });
});
export { server };
