import { PrismaClient } from "@prisma/client";
import * as xlsx from "xlsx";
import * as path from "path";
import * as fs from "fs";

export async function updateRekeningKavlingTest(prisma: PrismaClient) {
  // Mengarah ke file Excel
  const excelPath = path.resolve(process.cwd(), "Data_List_Kavling.xls");
  
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ File Excel tidak ditemukan di rute: ${excelPath}`);
    return;
  }

  console.log("🔍 Membaca file Excel...");
  // Membaca file biner menggunakan library xlsx
  const fileBuffer = fs.readFileSync(excelPath);
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0]; // Otomatis ambil sheet pertama
  const worksheet = workbook.Sheets[sheetName];

  try {
    await prisma.$transaction(async (tx) => {
      console.log("🔍 Mencari ID Rekening PT...");
      
      const bmsRekening = await tx.bankRekeningPt.findFirst({
        where: { atasNama: { contains: "Mahligai" } }
      });
      const sgmpRekening = await tx.bankRekeningPt.findFirst({
        where: { atasNama: { contains: "Gajah" } }
      });

      console.log(`🏦 BMS (Mahligai) ID: ${bmsRekening?.id || 'TIDAK DITEMUKAN'}`);
      console.log(`🏦 SGMP (Gajah) ID: ${sgmpRekening?.id || 'TIDAK DITEMUKAN'}\n`);

      console.log("⏳ Memulai proses log update kavling...\n");

      // Menghitung jumlah baris data yang ada di sheet
      const range = xlsx.utils.decode_range(worksheet["!ref"] || "A1:L1000");
      const maxRow = range.e.r + 1;

      // Loop dimulai dari baris ke-2 untuk melewati header
      for (let i = 2; i <= maxRow; i++) {
        // Kolom C berisi data KSO
        const rawKso = worksheet[`C${i}`]?.v;
        const kso = rawKso ? String(rawKso).trim().toUpperCase() : "";

        // Jika bukan BMS / SGMP, lewati
        if (kso !== "BMS" && kso !== "SGMP") {
          continue;
        }

        const rawBlokPrefix = worksheet[`F${i}`]?.v;
        const rawBlokSuffix = worksheet[`G${i}`]?.v;
        const rawUnit = worksheet[`H${i}`]?.v;

        // Helper untuk membersihkan ekstensi float (misal: 14.0 jadi 14)
        const parseNumStr = (val: any) => {
          if (val === undefined || val === null) return "";
          return String(val).replace(/\.0$/, "").trim();
        };

        const blokPrefix = rawBlokPrefix ? String(rawBlokPrefix).trim() : "";
        const blokSuffix = parseNumStr(rawBlokSuffix);
        const blok = `${blokPrefix}${blokSuffix}`;
        const nomorUnit = parseNumStr(rawUnit);

        if (!blok || !nomorUnit) continue;

        let rekeningId = null;
        if (kso === "BMS") rekeningId = bmsRekening?.id;
        else if (kso === "SGMP") rekeningId = sgmpRekening?.id;

        if (rekeningId) {
          const updated = await tx.kavling.updateMany({
            where: {
              blok: blok,
              nomorUnit: nomorUnit
            },
            data: {
              rekeningTujuanId: rekeningId
            }
          });

          if (updated.count > 0) {
            console.log(`✅ [BERHASIL] Blok: ${blok.padEnd(5)} | Unit: ${nomorUnit.padEnd(3)} | KSO: ${kso.padEnd(4)} -> Rekening ID: ${rekeningId} (Data di-update: ${updated.count})`);
          } else {
            console.log(`⚠️ [TIDAK KETEMU DB] Blok: ${blok.padEnd(5)} | Unit: ${nomorUnit.padEnd(3)} | KSO: ${kso}`);
          }
        }
      }

    });

  } catch (error: any) {
    if (error.message === "ROLLBACK_ON_PURPOSE") {
      console.log("✅ Rollback berhasil dieksekusi. Tidak ada data kavling yang benar-benar berubah di MySQL.");
    } else {
      console.error("❌ Terjadi error tak terduga saat script berjalan:", error);
    }
  }
}