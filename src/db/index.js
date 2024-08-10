import mongoose from "mongoose";

export let dbInstance = undefined;
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `mongodb+srv://nitin:${process.env.MONGODB_PASS}@cluster0.f6ar9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    );
    dbInstance = connectionInstance;
    console.log(
      `\n☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}\n`
    );
  } catch (error) {
    console.log("MongoDB connection error: ", error);
    process.exit(1);
  }
};

export { connectDB };
