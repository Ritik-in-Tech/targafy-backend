// index.js

// previous configuration
// import express from "express";
// import dotenv from "dotenv";
// import { server } from "./server.js";
// import { connectDB } from "./db/index.js";

// dotenv.config({ path: "../.env" });

// const majorNodeVersion = +process.env.NODE_VERSION?.split(".")[0] || 0;

// const PORT = process.env.PORT || 4000;

// const startServer = () => {
//   server.listen(PORT, () => {
//     console.log("⚙️  Server is running on port: " + PORT);
//   });
// };

// if (majorNodeVersion >= 14) {
//   try {
//     await connectDB();
//     startServer();
//   } catch (err) {
//     console.log("Mongo db connect error: ", err);
//   }
// } else {
//   connectDB()
//     .then(() => {
//       startServer();
//     })
//     .catch((err) => {
//       console.log("Mongo db connect error : ", err);
//     });
// }

// new configuration

import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import app from "./server.js"; // Import the app instance
import { connectDB } from "./db/index.js";

dotenv.config();

const majorNodeVersion = +process.env.NODE_VERSION?.split(".")[0] || 0;
// const PORT = process.env.PORT || 4000;

// Get the current directory name from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use __dirname and path.join to construct absolute paths
const sslKeyPath = path.join(__dirname, "../localhost.key");
const sslCertPath = path.join(__dirname, "../localhost.crt");

// // Debugging paths to ensure they are correct
// console.log("SSL Cert Path: ", sslCertPath);
// console.log("SSL Key Path: ", sslKeyPath);

// Read the SSL certificate and key files
const privateKey = fs.readFileSync(sslKeyPath, "utf8");
const certificate = fs.readFileSync(sslCertPath, "utf8");

const options = {
  key: privateKey,
  cert: certificate,
};

// Create HTTP server
http.createServer(app).listen(process.env.HTTP_PORT || 80, () => {
  console.log(`HTTP Server is running on port ${process.env.HTTP_PORT || 80}`);
});

// Create HTTPS server
https.createServer(options, app).listen(process.env.HTTPS_PORT || 443, () => {
  console.log(
    `HTTPS Server is running on port ${process.env.HTTPS_PORT || 443}`
  );
});

// Connect to the database and start the server
async function initializeServer() {
  if (majorNodeVersion >= 14) {
    try {
      await connectDB();
      console.log("Database connected successfully");
      // No need to call startServer, as servers are already started above.
    } catch (err) {
      console.log("MongoDB connection error: ", err);
    }
  } else {
    connectDB()
      .then(() => {
        console.log("Database connected successfully");
        // No need to call startServer, as servers are already started above.
      })
      .catch((err) => {
        console.log("MongoDB connection error: ", err);
      });
  }
}

// Call the initializeServer function to start the app
initializeServer();

const businessId = "668638149103073a3380eeef";
const previousDayStart = new Date("2024-07-06T00:00:00Z");
const previousDayEnd = new Date("2024-07-07T23:59:59Z");

// import { aggregateOverallDailyStats } from "./utils/aggregate_overall.stats.js";
// const ans = aggregateOverallDailyStats();
// console.log(ans);
// import { getTestDataAddCount } from "./utils/testdataaddcount.js";
// const ans = await getTestDataAddCount(
//   businessId,
//   previousDayStart,
//   previousDayEnd
// );
// console.log("Data Add count", ans);
// import { testAggregateOverallStats } from "./utils/testaggregateoverallstats.js";
// const ans = await testAggregateOverallStats(previousDayStart);
// console.log(ans);

// import { aggregateDailyStats } from "./utils/aggregate_daily.stats.js";
// const ans = await aggregateDailyStats();
// console.log(ans);

// import { testAggregateDailyStats } from "./utils/testaggregatedailystats.js";
// const ans = await testAggregateDailyStats(previousDayStart);
// console.log(ans);

// import { totalSessionCount } from "./utils/totalsessioncount.js";
// const ans = await totalSessionCount(
//   businessId,
//   previousDayStart,
//   previousDayEnd
// );
// console.log(ans);
