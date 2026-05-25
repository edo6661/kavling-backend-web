import {
  GoogleGenerativeAI,
  SchemaType,
  type Schema,
} from "@google/generative-ai";
import { AppError } from "../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { writeFileSync } from "fs";

export class GoogleVisionService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Peringatan: GEMINI_API_KEY belum diset di file .env");
    }
    this.genAI = new GoogleGenerativeAI(apiKey ?? "");
  }

  async extractKtpData(imageBuffer: Buffer): Promise<{
    nik: string | null;
    nama: string | null;
    alamat: string | null;
  }> {
    try {
      const ktpSchema: Schema = {
        type: SchemaType.OBJECT,
        properties: {
          nik: {
            type: SchemaType.STRING,
            description: "16 digit angka NIK. Perbaiki typo umum OCR.",
          },
          nama: {
            type: SchemaType.STRING,
            description: "Nama lengkap tanpa kata 'Nama' atau 'Name'.",
          },
          alamat: {
            type: SchemaType.STRING,
            description:
              "Gabungan Alamat, RT/RW, Kel/Desa, dan Kecamatan menjadi satu string lengkap dan rapi.",
          },
        },
        required: ["nik", "nama", "alamat"],
      };

      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: ktpSchema,
          temperature: 0.0,
        },
      });

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      };

      const prompt = `
    Anda adalah sistem ekstraksi OCR khusus KTP Indonesia yang berpresisi tinggi.
    Tugas Anda mengekstrak informasi dari gambar KTP terlampir ke format JSON.

    ATURAN SANGAT KETAT (DILARANG MELANGGAR):
    1. ANTI-HALUSINASI: BACA HANYA teks yang benar-benar tertulis di gambar. DILARANG KERAS mengarang, memanipulasi, atau menebak nama/data.
    2. JIKA BURAM: Jika bagian NIK atau Nama buram, tertutup jari, terkena pantulan cahaya, atau tidak terbaca dengan yakin 100%, Anda WAJIB mereturn null. Jangan pernah menebak.
    3. NIK harus tepat 16 digit. Jika ada karakter mirip angka (O jadi 0, l/I jadi 1), perbaiki.
    4. NAMA: Ambil nama persis seperti yang tertulis.
  `;

      writeFileSync("debug_ktp.jpg", imageBuffer);
      console.log(
        "Gambar KTP untuk debug telah disimpan sebagai debug_ktp.jpg",
      );

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      interface ExpectedKtpJson {
        nik?: string | null;
        nama?: string | null;
        alamat?: string | null;
      }

      const parsedData = JSON.parse(responseText) as ExpectedKtpJson;

      return {
        nik: parsedData.nik ?? null,
        nama: parsedData.nama ?? null,
        alamat: parsedData.alamat ?? null,
      };
    } catch (error) {
      console.error("Gemini Multimodal Extraction Error:", error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Gagal memproses gambar KTP.",
      );
    }
  }

  /**
   * OCR PDF scan / gambar — untuk dokumen Kode Billing DJP tanpa text layer.
   * Mengembalikan kode billing (10–20 digit) atau null jika tidak terbaca.
   */
  async extractKodeBillingFromScannedPdf(
    pdfBuffer: Buffer,
  ): Promise<string | null> {
    try {
      const billingSchema: Schema = {
        type: SchemaType.OBJECT,
        properties: {
          kodeBilling: {
            type: SchemaType.STRING,
            description:
              "Kode Billing DJP: 10–20 digit angka saja (biasanya 15 digit). Ambil dari baris KODE BILLING di dokumen.",
          },
        },
        required: ["kodeBilling"],
      };

      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: billingSchema,
          temperature: 0.0,
        },
      });

      const pdfPart = {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      };

      const prompt = `
Anda mengekstrak Kode Billing PPh dari dokumen DJP (Kementerian Keuangan / Direktorat Jenderal Pajak).

TUGAS: Temukan "KODE BILLING" pada dokumen dan ambil angka kode billing-nya.

ATURAN KETAT:
1. Hanya angka yang benar-benar terlihat di dokumen. Dilarang mengarang.
2. Kode billing biasanya 15 digit (contoh: 041924081839773 atau 042079769810908).
3. Prioritas: baris "KODE BILLING :" di bagian bawah (instruksi pembayaran), lalu angka besar di bawah judul "KODE BILLING" / "K O D E B I L L I N G".
4. Jangan ambil NPWP (16 digit), NOP (18 digit), atau nominal uang.
5. Jika tidak terbaca dengan yakin, set kodeBilling ke null.
6. Output hanya digit 0-9 tanpa spasi atau titik.
`;

      const result = await model.generateContent([prompt, pdfPart]);
      const responseText = result.response.text();

      interface ExpectedBillingJson {
        kodeBilling?: string | null;
      }

      const parsed = JSON.parse(responseText) as ExpectedBillingJson;
      const raw = parsed.kodeBilling?.replace(/\D/g, "") ?? "";
      if (raw.length >= 10 && raw.length <= 20) return raw;
      return null;
    } catch (error) {
      console.error("Gemini Kode Billing PDF OCR Error:", error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Gagal memproses PDF scan Kode Billing.",
      );
    }
  }
}
