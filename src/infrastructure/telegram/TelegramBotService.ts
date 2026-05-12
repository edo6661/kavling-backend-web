import type { Context } from "telegraf";
import { Telegraf } from "telegraf";
import { env } from "../../config/env.js";
import type { PrismaClient } from "@prisma/client";
import type { UploadBuktiTagihanUseCase } from "../../application/usecases/tagihan/UploadBuktiTagihanUseCase.js";
import type { UploadCustomerDocumentUseCase } from "../../application/usecases/customer/UploadCustomerDocumentUseCase.js";
import type { UploadKavlingDocumentUseCase } from "../../application/usecases/kavling/UploadKavlingDocumentUseCase.js";
import type { UploadProgressDocumentUseCase } from "../../application/usecases/progressPenjualan/ProgressPenjualanUseCases.js";
import type { UploadBuktiPenjualanUseCase } from "../../application/usecases/penjualan/UploadBuktiPenjualanUseCase.js";
import type { UploadBuktiFeeUseCase } from "../../application/usecases/feeAgent/FeeAgentUseCases.js";

import dns from "node:dns";
import axios from "axios";

dns.setDefaultResultOrder("ipv4first");

interface TelegramResponse {
  ok: boolean;
  result?: { username: string };
}

export class TelegramBotService {
  private bot: Telegraf;

  constructor(
    private readonly db: PrismaClient,
    private readonly uploadBuktiTagihanUseCase: UploadBuktiTagihanUseCase,
    private readonly uploadCustomerDocUseCase: UploadCustomerDocumentUseCase,
    private readonly uploadKavlingDocUseCase: UploadKavlingDocumentUseCase,
    private readonly uploadProgressDocUseCase: UploadProgressDocumentUseCase,
    private readonly uploadPenjualanDocUseCase: UploadBuktiPenjualanUseCase,
    private readonly uploadFeeDocUseCase: UploadBuktiFeeUseCase,
  ) {
    this.bot = new Telegraf(env.TELEGRAM_BOT_TOKEN || "");
    this.setupBot();
  }

  private setupBot() {
    this.bot.on("document", (ctx) => {
      const caption =
        ctx.message && "caption" in ctx.message
          ? ctx.message.caption
          : undefined;

      this.handleUpload(ctx, ctx.message.document.file_id, caption).catch(
        (err: unknown) => {
          console.error("Gagal memproses dokumen:", err);
        },
      );
    });

    this.bot.on("photo", (ctx) => {
      const photos = ctx.message.photo;
      const highestResPhoto = photos[photos.length - 1];
      const caption =
        ctx.message && "caption" in ctx.message
          ? ctx.message.caption
          : undefined;

      if (highestResPhoto) {
        this.handleUpload(ctx, highestResPhoto.file_id, caption).catch(
          (err: unknown) => {
            console.error("Gagal memproses foto:", err);
          },
        );
      }
    });
  }

  private async handleUpload(ctx: Context, fileId: string, caption?: string) {
    try {
      if (!caption) {
        await ctx.reply(
          "⚠️ Mohon sertakan *Prefix* pada caption.\n\nContoh:\n- `tagihan INV-001`\n- `ktp budi gunawan`\n- `kavling_pbg AA-14`\n- `progress_bast AA 14`",
          { parse_mode: "Markdown" },
        );
        return;
      }

      const match = /^([a-zA-Z0-9_]+)[ _]+(.+)$/.exec(caption.trim());
      if (!match?.[1] || !match[2]) {
        await ctx.reply(
          "❌ Format caption tidak dikenali. Gunakan format `<prefix> <nama/blok-unit>`.",
          { parse_mode: "Markdown" },
        );
        return;
      }

      const prefix = match[1].toLowerCase();
      const identifier = match[2].trim();

      const processingMsg = await ctx.reply(
        `⏳ Mencari data untuk *${identifier}* dan memproses dokumen...`,
        { parse_mode: "Markdown" },
      );

      const fileLink = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get<ArrayBuffer>(fileLink.href, {
        responseType: "arraybuffer",
        timeout: 30000,
      });

      const fileBuffer = Buffer.from(response.data);

      const resolveMessage = await this.processDocument(
        prefix,
        identifier,
        fileBuffer,
      );

      if (ctx.chat) {
        await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
      }

      await ctx.reply(`✅ *BERHASIL!*\n${resolveMessage}`, {
        parse_mode: "Markdown",
      });
    } catch (error: unknown) {
      console.error("Telegram Bot Error:", error);

      let errorMsg = "❌ Terjadi kesalahan pada server saat memproses file.";

      if (axios.isAxiosError(error)) {
        errorMsg = `❌ *GAGAL DOWNLOAD:*\nKoneksi ke Telegram lambat. Silakan coba kirim ulang.`;
      } else if (error instanceof Error) {
        errorMsg = `❌ *GAGAL:*\n${error.message}`;
      }

      await ctx
        .reply(errorMsg, { parse_mode: "Markdown" })
        .catch((err: unknown) => {
          console.error("Gagal mengirim pesan error ke telegram", err);
        });
    }
  }

  // Tipe kembalian yang pasti (bukan string | undefined) untuk menghindari error Prisma
  private parseKavling(
    text: string,
  ): { blok: string; nomorUnit: string } | null {
    const match = /^([a-zA-Z0-9]+)[-\s/]+([a-zA-Z0-9]+)$/.exec(text);
    if (match?.[1] && match[2]) {
      return { blok: match[1], nomorUnit: match[2] };
    }
    return null;
  }

  private async processDocument(
    prefix: string,
    identifier: string,
    fileBuffer: Buffer,
  ): Promise<string> {
    switch (prefix) {
      case "tagihan":
        await this.uploadBuktiTagihanUseCase.execute(identifier, fileBuffer);
        return `Bukti tagihan *${identifier}* berhasil diunggah.`;

      case "ktp":
      case "kk":
      case "npwp": {
        const customer = await this.db.customer.findFirst({
          where: { nama: { contains: identifier } },
        });

        if (!customer) {
          throw new Error(
            `Customer dengan nama '${identifier}' tidak ditemukan.`,
          );
        }

        const docType =
          prefix === "ktp"
            ? "fileKtp"
            : prefix === "kk"
              ? "fileKk"
              : "fileNpwp";

        await this.uploadCustomerDocUseCase.execute(
          customer.id,
          fileBuffer,
          docType,
        );
        return `Dokumen ${prefix.toUpperCase()} untuk *${customer.nama}* berhasil diunggah.`;
      }

      case "pbg":
      case "sertifikat":
      case "kavling_pbg":
      case "kavling_sertifikat": {
        const parsedKavling = this.parseKavling(identifier);
        if (!parsedKavling) {
          throw new Error(`Format kavling salah. Gunakan contoh: AA-14`);
        }

        const kavling = await this.db.kavling.findFirst({
          where: {
            blok: parsedKavling.blok,
            nomorUnit: parsedKavling.nomorUnit,
          },
        });

        if (!kavling) {
          throw new Error(
            `Kavling Blok ${parsedKavling.blok}-${parsedKavling.nomorUnit} tidak ditemukan.`,
          );
        }

        const docType = prefix.includes("sertifikat")
          ? "fileSertifikatTanah"
          : "filePbg";

        await this.uploadKavlingDocUseCase.execute(
          kavling.id,
          fileBuffer,
          docType,
        );
        return `Dokumen untuk Kavling *${kavling.blok}-${kavling.nomorUnit}* berhasil diunggah.`;
      }

      case "progress_bast":
      case "progress_ajb":
      case "progress_ppjb":
      case "fee_booking":
      case "fee_closing":
      case "fee_marketing": {
        const parsedData = this.parseKavling(identifier);
        if (!parsedData) {
          throw new Error(`Format kavling salah. Gunakan contoh: AA-14`);
        }

        const penjualan = await this.db.penjualan.findFirst({
          where: {
            kavling: { blok: parsedData.blok, nomorUnit: parsedData.nomorUnit },
            status: { not: "BATAL" },
          },
        });

        if (!penjualan) {
          throw new Error(
            `Transaksi aktif untuk Kavling Blok ${parsedData.blok}-${parsedData.nomorUnit} tidak ditemukan.`,
          );
        }

        if (prefix.startsWith("progress")) {
          const docType =
            prefix === "progress_bast"
              ? "fileBast"
              : prefix === "progress_ajb"
                ? "fileAjb"
                : "filePpjb";

          await this.uploadProgressDocUseCase.execute(
            penjualan.id,
            fileBuffer,
            docType,
          );
          return `Dokumen Progress untuk transaksi *${penjualan.noTransaksi}* berhasil diunggah.`;
        } else {
          const docType =
            prefix === "fee_booking"
              ? "bookingBukti"
              : prefix === "fee_closing"
                ? "closingBukti"
                : "marketingBukti";

          await this.uploadFeeDocUseCase.execute(
            penjualan.id,
            fileBuffer,
            docType,
          );
          return `Dokumen Fee untuk transaksi *${penjualan.noTransaksi}* berhasil diunggah.`;
        }
      }

      default:
        throw new Error(`Prefix '${prefix}' tidak didukung oleh sistem.`);
    }
  }

  public async launch() {
    if (!env.TELEGRAM_BOT_TOKEN) return;
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`,
        { signal: AbortSignal.timeout(10000) },
      );

      const data = (await response.json()) as TelegramResponse;
      if (data.ok) {
        console.log(
          `✅ Ping sukses! Terhubung sebagai Bot: @${data.result?.username}`,
        );

        this.bot.launch().catch((err: unknown) => {
          console.error(
            "Gagal meluncurkan Telegram Bot:",
            err instanceof Error ? err.message : err,
          );
        });
      }
    } catch (error: unknown) {
      console.error(
        "GAGAL MENGHUBUNGI SERVER TELEGRAM!",
        error instanceof Error ? error.message : error,
      );
    }
  }

  public stop(signal: string) {
    if (env.TELEGRAM_BOT_TOKEN) {
      this.bot.stop(signal);
    }
  }
}
