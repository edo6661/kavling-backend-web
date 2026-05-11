import { Server as SocketIOServer } from "socket.io";
import type { Server } from "http";
import { env } from "../../config/env.js";

export interface AdminNotificationPayload {
  type: "UPLOAD_BUKTI" | "GANTI_KAVLING";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export class SocketService {
  private io: SocketIOServer | null = null;

  // Method ini akan dipanggil di server.ts SETELAH httpServer dibuat
  public initialize(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: env.CORS_ORIGINS,
        credentials: true,
      },
    });

    this.io.on("connection", (socket) => {
      socket.on("join-admin", async () => {
        try {
          await socket.join("admin-room");
        } catch (error) {
          console.error(`Socket ${socket.id} gagal masuk admin-room:`, error);
        }
      });
    });
  }

  public notifyAdmin(event: string, data: AdminNotificationPayload) {
    if (this.io) {
      this.io.to("admin-room").emit(event, data);
    } else {
      console.warn(
        "SocketService: Ingin mengirim notif tapi socket server belum diinisialisasi.",
      );
    }
  }
}
