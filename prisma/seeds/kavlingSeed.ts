import { PrismaClient, UnitStatus } from "@prisma/client";
import * as xlsx from "xlsx";
import path from "path";
import fs from "fs";
function getTipe(lb: number, lt: number): string {
  if (lb === 48) return "Asvara";
  if (lb === 52) return "Adara";
  if (lb === 73) return "Aruna";
  if (lb === 36) return "Ansara";
  return `Tipe ${lb}/${lt}`;
}
export async function seedKavling(prisma: PrismaClient) {
  const excelPath = path.resolve(process.cwd(), "Analisa_Harga.xls");
  if (!fs.existsSync(excelPath)) {
    console.error("❌ File Analisa_Harga.xls tidak ditemukan di root folder!");
    return;
  }
  const fileBuffer = fs.readFileSync(excelPath);
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = "Summary T1";
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.error(`❌ Sheet '${sheetName}' tidak ditemukan dalam file excel!`);
    return;
  }
  const kavlingDataToInsert = [];
  const formatRp = (num: number) =>
    `Rp ${Number(num || 0).toLocaleString("id-ID")}`;
  const range = xlsx.utils.decode_range(worksheet["!ref"] || "A1:L1000");
  const maxRow = range.e.r + 1;
  for (let i = 4; i <= maxRow; i++) {
    const rawBank = worksheet[`D${i}`] ? worksheet[`D${i}`].v : undefined;
    const rawBlokPrefix = worksheet[`G${i}`] ? worksheet[`G${i}`].v : undefined;
    const rawBlokSuffix = worksheet[`H${i}`] ? worksheet[`H${i}`].v : undefined;
    const rawUnit = worksheet[`I${i}`] ? worksheet[`I${i}`].v : undefined;
    const rawLb = worksheet[`J${i}`] ? worksheet[`J${i}`].v : undefined;
    const rawLt = worksheet[`K${i}`] ? worksheet[`K${i}`].v : undefined;
    const rawHarga = worksheet[`L${i}`] ? worksheet[`L${i}`].v : undefined;
    if (rawBank === undefined || String(rawBank).trim() === "") {
      continue;
    }
    const bankStr = String(rawBank).trim().toUpperCase();
    let rekeningTujuanId = null;
    if (bankStr === "BMS") {
      rekeningTujuanId = 2;
    } else if (bankStr === "SGMP") {
      rekeningTujuanId = 1;
    }
    const blokPrefix =
      rawBlokPrefix !== undefined && rawBlokPrefix !== null
        ? String(rawBlokPrefix).trim()
        : "";
    const blokSuffix =
      rawBlokSuffix !== undefined && rawBlokSuffix !== null
        ? String(rawBlokSuffix).trim()
        : "";
    const blok = `${blokPrefix}${blokSuffix}`;
    const nomorUnit =
      rawUnit !== undefined && rawUnit !== null ? String(rawUnit).trim() : "";
    const lb = Math.round(Number(rawLb) || 0);
    const lt = Number(rawLt) || 0;
    const hargaDasar = Number(rawHarga) || 0;
    const namaTipe = getTipe(lb, lt);
    if (!blok && !nomorUnit) continue;
    kavlingDataToInsert.push({
      perumahanId: 1,
      blok: blok,
      nomorUnit: nomorUnit,
      namaTipe: namaTipe,
      luasBangunan: lb,
      luasTanah: lt,
      hargaDasar: hargaDasar,
      rekeningTujuanId: rekeningTujuanId,
      status: UnitStatus.AVAILABLE,
    });
  }
  if (kavlingDataToInsert.length > 0) {
    const result = await prisma.kavling.createMany({
      data: kavlingDataToInsert,
      skipDuplicates: true,
    });
    console.log(
      `\n✅ BOOM! Sukses memproses dan insert ${result.count} data kavling baru ke tabel Kavling!`,
    );
  }
}
