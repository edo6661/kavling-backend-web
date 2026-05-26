import app from "./app";
import { env } from "./config/env";
import { prisma } from "./infrastructure/database/prisma";
import { logger } from "./utils/logger";
import { container } from "./infrastructure/di/container";
import { createServer } from "http";
const PORT = env.PORT;

const httpServer = createServer(app);
container.socketService.initialize(httpServer);
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  container.telegramBotService.launch().catch((err: unknown) => {
    console.error("❌ Terjadi kesalahan saat meluncurkan Telegram Bot:", err);
  });
});
const shutdown = (signal: string) => {
  console.log(`\n${signal} received. Closing resources...`);
  container.telegramBotService.stop(signal);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("HTTP server and Database connection closed.");
    process.exit(0);
  });
};
process.on("uncaughtException", (err) => {
  logger.fatal(err, "Uncaught Exception terdeteksi. Mematikan server...");
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  logger.fatal({ reason }, "Unhandled Rejection");
  await prisma.$disconnect();
  server.close(() => process.exit(1));
});
process.on("SIGUSR2", () => shutdown("SIGUSR2"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
