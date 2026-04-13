import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import userRoute from "./routes/user.route.js";
import gigRoute from "./routes/gig.route.js";
import jobRoute from "./routes/job.route.js";
import bidRoute from "./routes/bid.route.js";
import orderRoute from "./routes/order.route.js";
import conversationRoute from "./routes/conversation.route.js";
import messageRoute from "./routes/message.route.js";
// import reviewRoute from "./routes/review.route.js";
import authRoute from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const requiredEnv = ["MONGO", "JWT_KEY"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

//middlewares
app.use(
  cors({
    origin: ["http://localhost:3000", "https://codelance-akshat.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//Api routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/gigs", gigRoute);
app.use("/api/jobs", jobRoute);
app.use("/api/bids", bidRoute);
app.use("/api/orders", orderRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
// app.use("/api/reviews", reviewRoute);

app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";

  return res.status(errorStatus).send(errorMessage);
});

const PORT = process.env.PORT || 8800;
const DB_RETRY_MS = 5000;

const connectWithRetry = async () => {
  try {
    await connectDB();
  } catch (_error) {
    console.error(`Retrying MongoDB connection in ${DB_RETRY_MS / 1000}s...`);
    setTimeout(connectWithRetry, DB_RETRY_MS);
  }
};

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  connectWithRetry();
});
