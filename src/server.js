import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
// import { createServer } from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import YAML from "yaml";
import sdk from "api";
import http from "http";
import https from "https";

// const sdkInstance = sdk("@msg91api/v5.0#6n91xmlhu4pcnz");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sslKeyPath = path.join(__dirname, "../localhost.key");
const sslCertPath = path.join(__dirname, "../localhost.crt");

const privateKey = fs.readFileSync(sslKeyPath, "utf8");
const certificate = fs.readFileSync(sslCertPath, "utf8");

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
import { aggregateDailyStats } from "./utils/aggregate_daily.stats.js";
import { aggregateOverallDailyStats } from "./utils/aggregate_overall.stats.js";

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

    // const result = await aggregateOverallDailyStats();
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
