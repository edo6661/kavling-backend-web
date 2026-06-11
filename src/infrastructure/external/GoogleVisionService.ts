import {
  GoogleGenerativeAI,
  SchemaType,
  type Schema,
} from "@google/generative-ai";
import { normalizeKasbonNamaSupplier } from "../../domain/spk/kasbonNamaSupplier.js";
import { normalizeNopd } from "../utils/pbbPdfUtils.js";
import { AppError } from "../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export interface KasbonBonBarisExtract {
  keterangan: string;
  nominal: number;
}

export interface KasbonBonExtractResult {
  namaSupplier: string | null;
  /** ISO YYYY-MM-DD */
  tanggal: string | null;
  items: KasbonBonBarisExtract[];
}

const normalizeBonMimeType = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return mimeType;
  return "image/jpeg";
};

/** Parse tanggal bon (dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd) ke ISO date. */
const parseBonTanggalToIso = (raw: string | null | undefined): string | null => {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (isoMatch) return s;

  const dmySpace = /^(\d{1,2})[\/\-.](\d{1,2})\s+(\d{2,4})$/.exec(s);
  const dmy = dmySpace ?? /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/.exec(s);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0] ?? null;
  }
  return null;
};

const KASBON_BON_EXAMPLES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "assets",
  "ocr-examples",
  "kasbon",
);

const loadKasbonBonExampleParts = (): Array<
  { text: string } | { inlineData: { data: string; mimeType: string } }
> => {
  const examples: Array<{ file: string; hint: string }> = [
    {
      file: "tulisan_tangan_1.jpeg",
      hint: `Contoh nota tulisan tangan (MITRA BANGUNAN): kolom Banyaknya | Nama Barang | Harga Satuan | Jumlah.
Ambil nama toko dari header cetak, tanggal tulisan kanan atas, tiap baris: keterangan = Nama Barang, nominal = angka di kolom Jumlah (bukan Banyaknya/Harga Satuan).
Abaikan baris total "Jumlah Rp." di footer.`,
    },
    {
      file: "tulisan_tangan_2.jpeg",
      hint: `Contoh kedua (TB. PILAR PERKASA): format kolom sama. Harga Satuan sering kosong — nominal tetap dari kolom Jumlah per barang.`,
    },
    {
      file: "tulisan_tangan_rekening_di_tabel.jpeg",
      hint: `Contoh bon tanpa nama toko; di kolom Nama Barang ada info transfer BCA + nomor rekening + a/n + nama pemilik — BUKAN barang, jangan masukkan items.
Barang valid: "Dn Plok" Jumlah 370000, "terpal 4x6" Jumlah 200000. Abaikan baris bank meski tertulis di tabel.`,
    },
    {
      file: "tulisan_tangan_rekening_di_tabel.png",
      hint: `Sama: baris rekening di tabel bukan barang; hanya baris dengan nominal di kolom Jumlah.`,
    },
  ];

  const parts: Array<
    { text: string } | { inlineData: { data: string; mimeType: string } }
  > = [{ text: "REFERENSI FORMAT BON (bukan gambar yang diekstrak):" }];

  for (const ex of examples) {
    const path = join(KASBON_BON_EXAMPLES_DIR, ex.file);
    if (!existsSync(path)) continue;
    parts.push({ text: ex.hint });
    parts.push({
      inlineData: {
        data: readFileSync(path).toString("base64"),
        mimeType: ex.file.toLowerCase().endsWith(".png")
          ? "image/png"
          : "image/jpeg",
      },
    });
  }

  return parts;
};

const BANK_NAME_PATTERN =
  /^(?:BCA|BRI|BNI|MANDIRI|CIMB|BSI|BTN|PERMATA|DANAMON|PANIN|MEGA|BUKOPIN|JAGO|SEABANK|OCBC|HSBC|MAYBANK)(?:\s+BANK|\s+SYARIAH)?\.?$/i;

/** Baris info rekening/transfer yang sering ditulis di kolom Nama Barang — bukan item belanja. */
const isKasbonRekeningNoiseLine = (keterangan: string): boolean => {
  const k = keterangan.trim();
  if (!k) return true;

  if (/^a\/n\.?$/i.test(k)) return true;
  if (/^a\.?\s*n\.?$/i.test(k)) return true;
  if (/^atas\s+nama/i.test(k)) return true;
  if (/^no\.?\s*rek/i.test(k)) return true;
  if (/^rekening/i.test(k)) return true;
  if (/^rek\.?\s/i.test(k)) return true;
  if (BANK_NAME_PATTERN.test(k.replace(/\s+/g, " "))) return true;

  const digitsOnly = k.replace(/[^\d]/g, "");
  if (digitsOnly.length >= 8 && digitsOnly.length <= 20 && /^\d[\d.\s\-]{6,}\.?$/.test(k)) {
    return true;
  }

  const lettersOnly = k.replace(/[^A-Za-z\s.]/g, "").trim();
  const words = lettersOnly.split(/\s+/).filter(Boolean);
  if (
    words.length >= 2 &&
    words.length <= 5 &&
    !/\d/.test(k) &&
    words.every((w) => /^[A-Za-z]{2,}$/.test(w) && w === w.toUpperCase())
  ) {
    return true;
  }

  return false;
};

const parseNominalRupiah = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value !== "string") return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
};

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

  /**
   * OCR PDF SPPT PBB — ekstrak NOPD (Nomor Objek Pajak Daerah).
   */
  async extractNopdFromPbbPdf(pdfBuffer: Buffer): Promise<string | null> {
    try {
      const nopdSchema: Schema = {
        type: SchemaType.OBJECT,
        properties: {
          nopd: {
            type: SchemaType.STRING,
            description:
              "NOPD (Nomor Objek Pajak Daerah) dari SPPT PBB, format dengan titik dan strip (contoh: 32.03.140.007.037-2439.0).",
          },
        },
        required: ["nopd"],
      };

      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: nopdSchema,
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
Anda mengekstrak NOPD (Nomor Objek Pajak Daerah) dari dokumen SPPT PBB Indonesia.

TUGAS: Temukan teks "NOPD :" atau "NOPD:" pada dokumen. Biasanya ada 2 kemunculan (bagian atas dan bawah) dengan nilai yang sama.

ATURAN KETAT:
1. Hanya nilai yang benar-benar terlihat di dokumen. Dilarang mengarang.
2. Format umum: XX.XX.XXX.XXX.XXX-XXXX.X (contoh: 32.03.140.007.037-2439.0).
3. Prioritas: NOPD di bagian atas (dekat TAHUN), lalu NOPD di bagian bawah (dekat SPPT Tahun/Rp).
4. Jangan ambil NPWPD, NPWP, kode billing, atau nominal uang.
5. Jika tidak terbaca dengan yakin, set nopd ke null.
6. Kembalikan persis seperti format di dokumen (dengan titik dan strip).
`;

      const result = await model.generateContent([prompt, pdfPart]);
      const responseText = result.response.text();

      interface ExpectedNopdJson {
        nopd?: string | null;
      }

      const parsed = JSON.parse(responseText) as ExpectedNopdJson;
      return parsed.nopd ? normalizeNopd(parsed.nopd) : null;
    } catch (error) {
      console.error("Gemini NOPD PBB PDF OCR Error:", error);
      return null;
    }
  }

  /**
   * OCR foto nota/bon belanja material (kasbon) — supplier, tanggal, baris item + nominal baris.
   */
  async extractKasbonBonData(
    imageBuffer: Buffer,
    mimeType = "image/jpeg",
  ): Promise<KasbonBonExtractResult> {
    try {
      const bonSchema: Schema = {
        type: SchemaType.OBJECT,
        properties: {
          namaSupplier: {
            type: SchemaType.STRING,
            description:
              'Nama toko/supplier di header bon. Jika tidak ada nama toko di bon, isi "-". Tanpa alamat.',
          },
          tanggal: {
            type: SchemaType.STRING,
            description:
              "Tanggal bon persis seperti di dokumen (dd/mm/yyyy atau format asli). Null jika tidak terbaca.",
          },
          items: {
            type: SchemaType.ARRAY,
            description: "Baris barang yang dibeli, tanpa subtotal pajak/diskon global.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                keterangan: {
                  type: SchemaType.STRING,
                  description:
                    "Nama/deskripsi barang saja (boleh sertakan satuan di teks, mis. 'Semen 50 sak'). Tanpa qty terpisah.",
                },
                nominal: {
                  type: SchemaType.NUMBER,
                  description:
                    "Nominal uang per baris (rupiah, bilangan bulat). Hanya kolom total baris, bukan harga satuan.",
                },
              },
              required: ["keterangan", "nominal"],
            },
          },
        },
        required: ["namaSupplier", "tanggal", "items"],
      };

      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: bonSchema,
          temperature: 0.0,
        },
      });

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: normalizeBonMimeType(mimeType),
        },
      };

      const prompt = `
Ekstrak data dari FOTO BON BERIKUT (nota tulisan tangan toko bahan bangunan Indonesia).

OUTPUT JSON: namaSupplier, tanggal, items[].

FORMAT BON (sangat umum):
- Header cetak: nama toko (mis. MITRA BANGUNAN, TB. PILAR PERKASA) → namaSupplier
- Jika bon TIDAK mencantumkan nama toko/supplier (hanya Kepada Yth / item / total), namaSupplier = "-"
- Tanggal tulisan di kanan atas (mis. 9/12/25, 26/11/2023) → tanggal
- Tabel kolom: Banyaknya | Nama Barang | Harga Satuan | Jumlah

PER BARIS BARANG (wajib):
- keterangan: isi kolom "Nama Barang" saja (contoh: "Pipa 5/8", "Paku beton 5 m", "kaso 4x6")
- nominal: angka di kolom "Jumlah" (rupiah, integer tanpa titik). Contoh tulisan 390.000 → 390000, 85.000 → 85000

JANGAN masukkan ke items:
- Kolom Banyaknya (65 btg, 2 dus, 1 bh, dll.)
- Kolom Harga Satuan (sering kosong) — kecuali dipakai hanya jika kolom Jumlah kosong (jarang)
- Baris footer "Jumlah Rp." / total keseluruhan bon (itu grand total, bukan satu barang)
- Teks Kepada Yth / alamat customer
- INFO REKENING di tabel (sering 3–5 baris di kolom Nama Barang tanpa nominal di kolom Jumlah):
  * Nama bank: BCA, BRI, BNI, Mandiri, dll.
  * Nomor rekening (8–16 digit angka)
  * "a/n" atau "atas nama"
  * Nama pemilik rekening (huruf kapital, bukan nama barang)
  * Baris yang dicoret / tanpa angka di kolom Jumlah

NOMINAL:
- WAJIB dari kolom Jumlah per baris barang. Tanpa angka Jumlah yang valid → jangan buat item.
- Jangan dari Banyaknya, jangan dari nomor rekening.
- Format Indonesia: titik sebagai pemisah ribuan (390.000 = tiga ratus sembilan puluh ribu).

ATURAN:
1. Anti-halusinasi — hanya yang terbaca jelas.
2. nominal > 0 per baris; skip baris kosong.
3. Urutan barang mengikuti urutan di bon.
`;

      const exampleParts = loadKasbonBonExampleParts();
      const result = await model.generateContent([
        ...exampleParts,
        { text: prompt },
        imagePart,
      ]);
      const responseText = result.response.text();

      interface RawBonJson {
        namaSupplier?: string | null;
        tanggal?: string | null;
        items?: Array<{ keterangan?: string; nominal?: number | string }>;
      }

      const parsed = JSON.parse(responseText) as RawBonJson;
      const items: KasbonBonBarisExtract[] = [];

      for (const row of parsed.items ?? []) {
        const keterangan = row.keterangan?.trim();
        const nominal = parseNominalRupiah(row.nominal);
        if (!keterangan || nominal == null) continue;
        if (isKasbonRekeningNoiseLine(keterangan)) continue;
        items.push({ keterangan, nominal });
      }

      const rawNama = parsed.namaSupplier?.trim();
      const namaSupplier =
        rawNama && rawNama !== "-" ? rawNama : null;

      return {
        namaSupplier,
        tanggal: parseBonTanggalToIso(parsed.tanggal),
        items,
      };
    } catch (error) {
      console.error("Gemini Kasbon Bon OCR Error:", error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Gagal memproses foto bon.",
      );
    }
  }
}
