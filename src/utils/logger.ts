import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  level:
    env.NODE_ENV === "test"
      ? "silent"
      : env.NODE_ENV === "production"
        ? "info"
        : "debug",
  redact: ["req.headers.authorization", "req.headers.cookie"],

  serializers: {
    req: () => undefined,
    res: () => undefined,
  },

  ...(env.NODE_ENV !== "production" &&
    env.NODE_ENV !== "test" && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "req,res,pid,hostname,responseTime",
          translateTime: "SYS:standard",
        },
      },
    }),
});
