import { env } from "./config/env";
import * as Sentry from "@sentry/node";
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 1.0,
    enableLogs: true,
  });
}
import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import compression from "compression";
import routes from "./presentation/routes";
import {
  notFoundHandler,
  globalErrorHandler,
} from "./middlewares/errorHandler";
import { logger } from "./utils/logger";
import hpp from "hpp";
const app: Application = express();
Sentry.setupExpressErrorHandler(app);

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(
  pinoHttp({
    logger,
    genReqId: () => crypto.randomUUID(),
  }),
);
app.use((req, res, next) => {
  if (req.id) {
    res.setHeader("X-Request-Id", req.id as string);
  }
  next();
});
app.use(compression());
// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});
if (env.NODE_ENV !== "test") {
  app.use("/api", limiter);
}

// Routes
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Absensi API Service is Running 🚀",
    version: "1.0.0",
    server_time: new Date().toISOString(),
  });
});
app.use("/api/v1", routes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
