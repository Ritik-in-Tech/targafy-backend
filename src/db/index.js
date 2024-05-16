import mongoose from "mongoose";
import { ENV_VAR } from "../utils/variable.env.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(ENV_VAR.MONGO_URI);
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

export { connectDB };
