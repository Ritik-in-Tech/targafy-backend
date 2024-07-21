import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import YAML from "yaml";
import http from "http";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

// const sdkInstance = sdk("@msg91api/v5.0#6n91xmlhu4pcnz");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sslKeyPath = process.env.SSL_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH;

const projectRoot = path.resolve(__dirname, "..");
const fullSslKeyPath = path.join(projectRoot, sslKeyPath);
const fullSslCertPath = path.join(projectRoot, sslCertPath);

let privateKey, certificate;
try {
  privateKey = fs.readFileSync(fullSslKeyPath, "utf8");
  console.log(privateKey);
  certificate = fs.readFileSync(fullSslCertPath, "utf8");
  console.log(certificate);
} catch (error) {
  console.error("Error reading SSL files:", error);
  throw error;
}

const options = {
  key: privateKey,
  cert: certificate,
};

const file = fs.readFileSync(
  path.resolve(__dirname, "../swagger.yaml"),
  "utf8"
);
const swaggerDocument = YAML.parse(file);

import { initializeNotificationSocket } from "./sockets/notification_socket.js";
import { initializeActivitySocket } from "./sockets/business_socket.js";
import "./utils/helpers/aggregrate.cron.js";

const app = express();

// Middleware setup
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Global middlewares
app.use(cors({ origin: "*", methods: ["GET", "POST"], credentials: true }));
app.use(bodyParser.json());
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

// Routes
import businessRoutes from "./routes/business.routes.js";
import authRoutes from "./routes/authentication.routes.js";
import paramsRoutes from "./routes/params.routes.js";
import targetRoutes from "./routes/target.routes.js";
import userRoutes from "./routes/user.routes.js";
import uploadRouter from "./routes/upload.document.js";
import uploadfileRouter from "./routes/uploadfile.routes.js";
import addDataRouter from "./routes/data.routes.js";
import activityRouter from "./routes/activities.routes.js";
import adminRouter from "./routes/admin.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { connectDB } from "./db/index.js";
import {
  aggregateDailyStats,
  aggregateTestDailyStats,
} from "./utils/aggregate_daily.stats.js";
import {
  aggregateOverallDailyStats,
  aggregateTestOverallDailyStats,
} from "./utils/aggregate_overall.stats.js";

app.use("/api/v1/business", businessRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/params", paramsRoutes);
app.use("/api/v1/target", targetRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1", uploadRouter);
app.use("/api/v1", uploadfileRouter);
app.use("/api/v1/data", addDataRouter);
app.use("/api/v1/activity", activityRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/notification", notificationRoutes);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { customSiteTitle: "Targafy API Docs" })
);

app.get("*", (req, res) => {
  res.json({
    message: "welcome to Targafy API. To see all api's please visit this url: ",
  });
});

const HTTP_PORT = process.env.HTTP_PORT || 80;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
const startServer = async () => {
  try {
    await connectDB();

    const httpServer = http.createServer(app);

    const httpsServer = https.createServer(options, app);

    const ioHttp = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    const ioHttps = new Server(httpsServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    initializeNotificationSocket(ioHttp);
    initializeActivitySocket(ioHttp);
    // initializeNotificationSocket(ioHttps);
    // const targetDate = new Date("2024-06-30");
    // // const result = await aggregateTestDailyStats(targetDate);
    // const result = await aggregateTestOverallDailyStats(targetDate);
    // console.log(result);

    httpServer.listen(HTTP_PORT, () => {
      console.log(`HTTP Server running on http://localhost:${HTTP_PORT}`);
    });

    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`HTTPS Server running on https://localhost:${HTTPS_PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
