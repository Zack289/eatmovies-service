import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes";
import mediaRoutes from "./routes/mediaRoutes";
import interactionRoutes from "./routes/interactionRoutes";
import userRoutes from "./routes/userRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import adminRoutes from "./routes/adminRoutes";
import { notFound, errorHandler } from "./middleware/errorHandler";

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost on any port during development
      if (!origin || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        callback(null, true);
      } else {
        callback(null, process.env.CLIENT_URL || "http://localhost:5173");
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(mongoSanitize());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "eatMovies API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
