import { Server as SocketIOServer } from "socket.io";
import type { Server } from "http";
import { env } from "../../config/env.js";

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

      socket.on("join-mandor", async (mandorUserId: number) => {
        const id = Number(mandorUserId);
        if (!Number.isFinite(id) || id <= 0) return;
        try {
          await socket.join(`mandor-room-${id}`);
        } catch (error) {
          console.error(`Socket ${socket.id} gagal masuk mandor-room:`, error);
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

  public notifyMandor(
    mandorUserId: number,
    event: string,
    data: MandorNotificationPayload,
  ) {
    if (this.io) {
      this.io.to(`mandor-room-${mandorUserId}`).emit(event, data);
    } else {
      console.warn(
        "SocketService: Ingin mengirim notif mandor tapi socket server belum diinisialisasi.",
      );
    }
  }
}
