import { Server as SocketIOServer } from "socket.io";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../../config/env.js";
import type { JwtUserPayload } from "../../domain/dtos/UserDTO.js";
import type { NotificationEntity } from "../../domain/entities/Notification.js";
import { logger } from "../../utils/logger.js";

export interface AdminNotificationPayload {
  type: "UPLOAD_BUKTI" | "GANTI_KAVLING";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface MandorNotificationPayload {
  type: "SPK_PEMBAYARAN_DIBAYAR";
  title: string;
  message: string;
  data?: {
    spkId?: number;
    noSpk?: string;
    jenis?: string;
    nominal?: number;
    buktiPembayaran?: string | null;
    tanggalPembayaran?: string | null;
  };
}

export class SocketService {
  private io: SocketIOServer | null = null;

  public initialize(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: env.CORS_ORIGINS,
        credentials: true,
      },
    });

    this.io.engine.on("connection_error", (err: Error) => {
      logger.warn({ err: err.message }, "Socket engine connection error");
    });

    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (typeof token !== "string" || !token.trim()) {
          return next(new Error("Unauthorized: token tidak ditemukan"));
        }
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
        socket.data.user = decoded;
        next();
      } catch (err) {
        const message =
          err instanceof jwt.TokenExpiredError
            ? "Unauthorized: token expired"
            : "Unauthorized: token tidak valid";
        logger.debug({ socketId: socket.id, err: message }, "Socket auth rejected");
        next(new Error(message));
      }
    });

    this.io.on("connection", (socket) => {
      const user = socket.data.user;
      if (!user?.userId) {
        logger.warn({ socketId: socket.id }, "Socket connected tanpa userId, disconnect");
        socket.disconnect(true);
        return;
      }

      void this.joinUserRooms(socket, user);

      socket.on("error", (err: Error) => {
        logger.error(
          { socketId: socket.id, userId: user.userId, err: err.message },
          "Socket runtime error",
        );
      });

      socket.on("disconnect", (reason) => {
        logger.debug(
          { socketId: socket.id, userId: user.userId, reason },
          "Socket disconnected",
        );
      });
    });
  }

  private async joinUserRooms(
    socket: import("socket.io").Socket,
    user: JwtUserPayload,
  ): Promise<void> {
    try {
      await socket.join(`user-room-${user.userId}`);

      if (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
        await socket.join("admin-room");
      }

      if (user.role === Role.MANDOR) {
        await socket.join(`mandor-room-${user.userId}`);
      }

      logger.debug(
        { socketId: socket.id, userId: user.userId, role: user.role },
        "Socket joined rooms",
      );
    } catch (error) {
      logger.error(
        { socketId: socket.id, userId: user.userId, error },
        "Socket gagal join room",
      );
      socket.disconnect(true);
    }
  }

  public notifyUser(userId: number, event: string, data: NotificationEntity) {
    if (this.io) {
      this.io.to(`user-room-${userId}`).emit(event, data);
    } else {
      logger.warn({ userId, event }, "Socket emit gagal: server belum diinisialisasi");
    }
  }

  /** @deprecated Gunakan notifyUser via NotificationService */
  public notifyAdmin(event: string, data: AdminNotificationPayload) {
    if (this.io) {
      this.io.to("admin-room").emit(event, data);
    } else {
      logger.warn({ event }, "Socket admin emit gagal: server belum diinisialisasi");
    }
  }

  /** @deprecated Gunakan notifyUser via NotificationService */
  public notifyMandor(
    mandorUserId: number,
    event: string,
    data: MandorNotificationPayload,
  ) {
    if (this.io) {
      this.io.to(`mandor-room-${mandorUserId}`).emit(event, data);
    } else {
      logger.warn({ mandorUserId, event }, "Socket mandor emit gagal: server belum diinisialisasi");
    }
  }
}
