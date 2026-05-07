import { Telegraf } from "telegraf";
import { env } from "../../config/env.js";
import type { UploadBuktiTagihanUseCase } from "../../application/usecases/tagihan/UploadBuktiTagihanUseCase.js";
import dns from "node:dns";
// 1. Tambahkan import axios
import axios from "axios";

dns.setDefaultResultOrder("ipv4first");

export class TelegramBotService {
  private bot: Telegraf;

  constructor(private readonly uploadBuktiUseCase: UploadBuktiTagihanUseCase) {
    this.bot = new Telegraf(env.TELEGRAM_BOT_TOKEN || "");
    this.setupBot();
  }

  private setupBot() {
    this.bot.on("photo", async (ctx) => {
      try {
        if (!ctx.message || !("photo" in ctx.message)) return;

        const caption =
          "caption" in ctx.message ? ctx.message.caption : undefined;

        if (!caption) {
          await ctx.reply(
            "⚠️ Mohon sertakan *Nomor Invoice* pada caption foto.",
            { parse_mode: "Markdown" },
          );
          return;
        }

        const noTagihan = caption.trim();
        const processingMsg = await ctx.reply(
          `⏳ Sedang memproses bukti pembayaran untuk *${noTagihan}*...`,
          { parse_mode: "Markdown" },
        );

        const photos = ctx.message.photo;
        const highestResPhoto = photos[photos.length - 1];

        if (!highestResPhoto) {
          await ctx.reply("❌ Gagal mendapatkan data foto dari Telegram.", {
            parse_mode: "Markdown",
          });
          return;
        }

        const photoId = highestResPhoto.file_id;
        const fileLink = await ctx.telegram.getFileLink(photoId);

        // 2. MODIFIKASI: Gunakan Axios untuk download (Lebih stabil di Windows)
        // Kita beri timeout 30 detik khusus untuk download file
        const response = await axios.get(fileLink.href, {
          responseType: "arraybuffer",
          timeout: 30000,
        });

        const imageBuffer = Buffer.from(response.data);

        // Eksekusi proses ke Database
        await this.uploadBuktiUseCase.execute(noTagihan, imageBuffer);

        await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
        await ctx.reply(
          `✅ *BERHASIL!*\nBukti pembayaran untuk *${noTagihan}* berhasil diunggah ke sistem dan status tagihan menjadi LUNAS.`,
          { parse_mode: "Markdown" },
        );
      } catch (error: unknown) {
        console.error("Telegram Bot Error:", error);

        let errorMsg =
          "❌ Terjadi kesalahan pada server saat memproses gambar.";

        // Cek jika error berasal dari Axios (Masalah koneksi download)
        if (axios.isAxiosError(error)) {
          errorMsg = `❌ *GAGAL DOWNLOAD:*\nKoneksi ke Telegram lambat atau terputus. Silakan coba kirim ulang foto.`;
        } else if (error instanceof Error) {
          errorMsg = `❌ *GAGAL:*\n${error.message}`;
        }

        await ctx.reply(errorMsg, { parse_mode: "Markdown" });
      }
    });
  }

  public async launch() {
    if (!env.TELEGRAM_BOT_TOKEN) {
      console.warn(
        "⚠️ TELEGRAM_BOT_TOKEN tidak diset, Bot Telegram diabaikan.",
      );
      return;
    }

    console.log("⏳ 1. Menguji koneksi raw ke Telegram API (Ping 10 detik)...");
    try {
      // Untuk PING awal tetap pakai fetch tidak apa-apa karena datanya kecil (JSON)
      const response = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`,
        { signal: AbortSignal.timeout(10000) },
      );

      interface TelegramResponse {
        ok: boolean;
        result?: { username: string };
      }

      const data = (await response.json()) as TelegramResponse;

      if (!data.ok) {
        console.error(
          "❌ Ping gagal! Token salah atau ditolak Telegram:",
          data,
        );
        return;
      }

      console.log(
        `✅ Ping sukses! Terhubung sebagai Bot: @${data.result?.username}`,
      );
      console.log("⏳ 2. Memulai proses sinkronisasi pesan (Polling)...");

      this.bot
        .launch({ dropPendingUpdates: true })
        .then(() => console.log("✅ 🤖 Telegram Bot Bumantara Running..."))
        .catch((err) =>
          console.error("❌ Gagal menjalankan Polling Bot:", err),
        );
    } catch (error: unknown) {
      console.error("\n❌ ======================================");
      console.error("GAGAL MENGHUBUNGI SERVER TELEGRAM!");
      if (error instanceof Error && error.name === "TimeoutError") {
        console.error("Alasan: Koneksi Timeout (Melebihi 10 detik).");
      } else if (error instanceof Error) {
        console.error("Alasan:", error.message);
      }
      console.error("======================================\n");
    }
  }

  public stop(signal: string) {
    if (env.TELEGRAM_BOT_TOKEN) {
      this.bot.stop(signal);
    }
  }
}
