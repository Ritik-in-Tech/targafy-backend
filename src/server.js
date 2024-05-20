import express, { json, urlencoded } from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
const app = express();
import businessRoutes from "./routes/business.routes.js";
import authRoutes from "./routes/authentication.routes.js";
import groupRoutes from "./routes/group.routes.js";
import paramsRoutes from "./routes/params.routes.js";
import targetRoutes from "./routes/target.routes.js";
import userRoutes from "./routes/user.routes.js";
import { connectDB } from "./db/index.js";

app.use(json({ limit: "16kb" }));
app.use(urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use("/api/v1/business", businessRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/group", groupRoutes);
app.use("/api/v1/params", paramsRoutes);
app.use("/api/v1/target", targetRoutes);
app.use("/api/v1/user", userRoutes);

const port = process.env.PORT || 3000;
connectDB()
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`Targafy API server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

app.get("/", (req, res) => {
  res.json({ message: "welcome to Targafy API" });
});

export default app;
