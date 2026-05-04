import { PenjualanStatus, PrismaClient, UnitStatus } from "@prisma/client";
import * as xlsx from "xlsx";
import path from "path";
import fs from "fs";
const KAVLING_DATA: Record<string, { lb: number; lt: number[] }> = {
  Asvara: {
    lb: 48,
    lt: [
      60, 61, 62, 64, 67, 68, 72, 76, 79, 80, 81, 96, 100, 120, 123, 127, 132,
      134, 135,
    ],
  },
  Adara: {
    lb: 52,
    lt: [60, 61, 65, 70, 75, 82, 85, 87, 114, 120, 121, 133, 148],
  },
  Aruna: { lb: 73, lt: [60, 62, 63, 67, 71, 91, 109, 154] },
  Ansara: { lb: 36, lt: [60, 103, 120, 122, 132, 143] },
};
const KAVLING_REKENING_MAP: Record<string, number> = {
  "AA1-1": 2,
  "AA1-3": 2,
  "AA1-6": 2,
  "AA1-8": 2,
  "AA1-10": 2,
  "AA1-12": 2,
  "AA2-1": 2,
  "AA2-3": 2,
  "AA3-1": 2,
  "AA3-3": 2,
  "AA3-5": 2,
  "AA3-6": 2,
  "AA3-7": 2,
  "AA5-1": 2,
  "AA5-3": 2,
  "AA5-6": 2,
  "AA5-8": 2,
  "AA5-11": 2,
  "AA5-20": 2,
  "AA5-22": 2,
  "AA6-1": 2,
  "AA6-2": 2,
  "AA6-3": 2,
  "AA6-5": 2,
  "AA6-6": 2,
  "AA6-7": 2,
  "AA6-8": 2,
  "AA6-9": 2,
  "AA6-10": 2,
  "AA7-1": 2,
  "AA7-2": 2,
  "AA8-1": 2,
  "AA8-3": 2,
  "AA8-6": 2,
  "AA8-8": 1,
  "AA8-10": 1,
  "AA8-12": 1,
  "AA8-15": 2,
  "AA8-18": 2,
  "AA9-1": 1,
  "AA9-2": 1,
  "AA9-3": 1,
  "AA9-5": 1,
  "AA9-6": 1,
  "AA9-7": 1,
  "AA9-8": 1,
  "AA9-9": 1,
  "AA14-2": 1,
  "AA14-3": 1,
  "AA14-5": 1,
  "AA14-6": 1,
  "AA14-7": 1,
  "AA14-8": 1,
  "AA14-9": 1,
  "AA14-12": 1,
  "AA14-14": 1,
  "AA14-16": 1,
  "AA14-23": 1,
  "AA14-25": 1,
  "AA14-27": 1,
  "AA14-33": 1,
  "AA15-2": 2,
  "AA15-9": 2,
  "AA17-1": 1,
  "AA17-6": 1,
  "AA17-10": 1,
  "AA17-14": 1,
  "AA17-15": 1,
  "AA17-16": 1,
  "AA17-17": 1,
  "AA17-18": 1,
  "AA17-20": 1,
  "AA17-21": 1,
  "AA17-22": 1,
  "AA17-23": 1,
  "AA17-24": 1,
  "AA17-27": 1,
  "AA17-29": 1,
  "AA17-31": 1,
  "AA17-35": 1,
  "AA18-11": 1,
  "AA19-7": 1,
  "AA19-8": 1,
  "AA21-3": 2,
  "AA21-8": 2,
  "AA22-3": 2,
  "AA22-6": 2,
  "AA22-12": 1,
  "AA23-10": 1,
  "AA23-12": 1,
  "AA23-15": 1,
  "AA24-1": 1,
  "AA24-2": 1,
  "AA24-5": 1,
  "AA24-9": 1,
  "AA26-3": 2,
  "AA26-5": 2,
  "AA26-7": 2,
  "AA27-1": 2,
  "AA27-3": 2,
  "AA28-6": 1,
  "AA28-9": 1,
  "AA28-10": 1,
  "AA28-11": 1,
  "AA28-12": 1,
  "AA29-2": 1,
  "AA29-3": 1,
  "AA29-5": 1,
  "AA29-6": 1,
  "AA29-7": 1,
  "AA29-8": 1,
  "AA29-12": 1,
  "AA29-16": 1,
  "AA29-17": 1,
  "AA29-18": 1,
  "AA29-19": 1,
  "AA29-20": 1,
  "AA29-21": 1,
  "AA29-22": 1,
  "AA29-23": 1,
  "AA29-24": 1,
  "AA29-25": 1,
  "AA29-26": 1,
  "AA30-3": 1,
  "AA30-5": 1,
  "AA30-6": 1,
  "AA30-8": 1,
  "AA31-6": 1,
  "AA32-6": 1,
  "AA32-8": 1,
};
function getTipe(lb: number, lt: number): string {
  for (const [namaTipe, data] of Object.entries(KAVLING_DATA)) {
    if (data.lb === lb && data.lt.includes(lt)) {
      return namaTipe;
    }
  }
  return `${lb}/${lt}`;
}
function parseString(val: any): string | null {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  return str === "" ? null : str;
}
export async function seedPenjualanReal(prisma: PrismaClient) {
  console.log("Memulai proses Bulk Insert dari penjualan.xlsx...");
  const perumahan = await prisma.perumahan.create({
    data: {
      nama: "Puri Safana",
      alamat: "Test Alamat",
      logo: "https://res.cloudinary.com/dbxzxfyw3/image/upload/v1776221608/LOGO_PURI_SAFANA-01_qq4lnw.png",
    },
  });
  await prisma.bankRekeningPt.createMany({
    data: [
      {
        perumahanId: perumahan.id,
        namaBank: "BSI",
        noRekening: "7326575644",
        atasNama: "PT. Bintang Safana Gajah",
      },
      {
        perumahanId: perumahan.id,
        namaBank: "BSI",
        noRekening: "7326573692",
        atasNama: "PT. Bintang Safana Mahligai",
      },
    ],
  });
  const excelPath = path.resolve(process.cwd(), "penjualan.xlsx");
  const fileBuffer = fs.readFileSync(excelPath);
  const workbook = xlsx.read(fileBuffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const dataPenjualan: any[] = xlsx.utils.sheet_to_json(
    workbook.Sheets[sheetName],
    { header: 1 },
  );
  console.log(`Ditemukan ${dataPenjualan.length} baris. Memulai import...\n`);
  for (let index = 4; index < dataPenjualan.length; index++) {
    const row = dataPenjualan[index];
    const namaKonsumenRaw = row[1];
    if (!namaKonsumenRaw || String(namaKonsumenRaw).trim() === "") {
      continue;
    }
    const namaKonsumen = String(namaKonsumenRaw).trim();
    const namaAgent = row[8] ? String(row[8]).trim() : "Tanpa Agen";
    let agent = await prisma.agent.findFirst({ where: { nama: namaAgent } });
    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          nik: `DUMMY-NIK-${index}`,
          kodeSales: `AGT-${index}`,
          nama: namaAgent,
          noHp: "",
        },
      });
    }
    const alamatKtpValid = parseString(row[2]);
    const alamatTinggalValid = parseString(row[3]);
    const noHpValid = parseString(row[4]);
    const emailValid = parseString(row[5]);
    const pekerjaanValid = parseString(row[6]);
    const bankKprValid = parseString(row[7]);
    const statusValid = parseString(row[9]);

    let caraPembayaranEnum: any = null;

    if (statusValid && statusValid !== "-") {
      const statusLower = statusValid.toLowerCase();
      if (
        statusLower.includes("cash tah") ||
        statusLower.includes("bertahap")
      ) {
        caraPembayaranEnum = "CASH_BERTAHAP";
      } else if (statusLower.includes("keras")) {
        caraPembayaranEnum = "CASH_KERAS";
      } else if (statusLower.includes("kpr")) {
        caraPembayaranEnum = "KPR";
      }
    }

    if (!caraPembayaranEnum && bankKprValid && bankKprValid !== "-") {
      const bankKprLower = bankKprValid.toLowerCase();
      if (bankKprLower.includes("bertahap")) {
        caraPembayaranEnum = "CASH_BERTAHAP";
      } else if (bankKprLower.includes("keras")) {
        caraPembayaranEnum = "CASH_KERAS";
      } else {
        // Jika diisi nama Bank (BSI, BRI, BTN, dll) maka asumsikan KPR
        caraPembayaranEnum = "KPR";
      }
    }
    const rawBlok = row[11];
    let rawUnit = row[12];
    if (rawUnit instanceof Date) {
      rawUnit = `${rawUnit.getDate()}-${rawUnit.getMonth() + 1}`;
    }
    let finalBlok = rawBlok ? String(rawBlok).trim() : "-";
    let finalUnit = rawUnit ? String(rawUnit).trim() : "-";
    if (finalUnit.includes("-")) {
      const parts = finalUnit.split("-");
      finalBlok = finalBlok + parts[0].trim();
      finalUnit = parts[1].trim();
    } else if (finalUnit.includes("/")) {
      const parts = finalUnit.split("/");
      finalBlok = finalBlok + parts[0].trim();
      finalUnit = parts[1].trim();
    }
    finalUnit = finalUnit.substring(0, 10);
    const lt = Number(row[14]) || 0;
    const lb = Number(row[15]) || 0;
    const namaTipeValid = getTipe(lb, lt);
    const bookingFee = Number(row[17]) || 0;
    const hargaJual = Number(row[26]) || 0;
    const lookupKey = `${finalBlok}-${finalUnit}`;
    const rekeningTujuanIdValid = KAVLING_REKENING_MAP[lookupKey] || 1;
    const formatRp = (num: number) =>
      `Rp ${Number(num || 0).toLocaleString("id-ID")}`;

    console.log(
      `\n========================================================================`,
    );
    console.log(`[BARIS ${index + 1}] PREVIEW FULL DATA INSERT`);
    console.log(
      `========================================================================`,
    );

    console.log(`[1. DATA CUSTOMER & AGENT]`);
    console.log(`Nama Konsumen  : ${namaKonsumen}`);
    console.log(`No HP          : ${noHpValid ?? "NULL"}`);
    console.log(`Email          : ${emailValid ?? "NULL"}`);
    console.log(`Alamat KTP     : ${alamatKtpValid ?? "NULL"}`);
    console.log(`Alamat Tinggal : ${alamatTinggalValid ?? "NULL"}`);
    console.log(`Pekerjaan      : ${pekerjaanValid ?? "NULL"}`);
    console.log(`Bank KPR       : ${bankKprValid ?? "NULL"}`);
    console.log(`Agent          : ${namaAgent}`);
    console.log(
      `------------------------------------------------------------------------`,
    );

    console.log(`[2. DATA KAVLING & PENJUALAN]`);
    console.log(`Blok / Unit    : ${finalBlok} / ${finalUnit}`);
    console.log(`Tipe Kavling   : ${namaTipeValid} (LB: ${lb}, LT: ${lt})`);
    console.log(
      `Cara Bayar     : ${caraPembayaranEnum ?? "NULL (Akan diset NULL di DB)"}`,
    );
    console.log(`Rekening Tujuan: ID ${rekeningTujuanIdValid}`);
    console.log(`Harga Jual     : ${formatRp(hargaJual)}`);
    console.log(`Booking Fee    : ${formatRp(bookingFee)}`);
    console.log(`Diskon Penjualan: ${formatRp(Number(row[32]) || 0)}`);
    console.log(
      `------------------------------------------------------------------------`,
    );

    console.log(`[3. DETAIL PAJAK - NILAI RUMAH (Subsidi & Bonus)]`);
    console.log(`Diskon Cash (nr)      : ${formatRp(Number(row[32]) || 0)}`);
    console.log(`BPHTB (nr)            : ${formatRp(Number(row[36]) || 0)}`);
    console.log(`Nilai Penyerahan (nr) : ${formatRp(Number(row[39]) || 0)}`);
    console.log(`PPN (nr)              : ${formatRp(Number(row[40]) || 0)}`);
    console.log(`PPh (nr)              : ${formatRp(Number(row[42]) || 0)}`);
    console.log(
      `------------------------------------------------------------------------`,
    );

    console.log(`[4. DETAIL PAJAK - PAJAK (Subsidi & Bonus)]`);
    console.log(`Biaya KPR (pj)        : ${formatRp(Number(row[43]) || 0)}`);
    console.log(`Biaya Asuransi (pj)   : ${formatRp(Number(row[44]) || 0)}`);
    console.log(`Diskon Angsuran (pj)  : ${formatRp(Number(row[45]) || 0)}`);
    console.log(`Biaya BBN (pj)        : ${formatRp(Number(row[46]) || 0)}`);
    console.log(`Biaya AJB (pj)        : ${formatRp(Number(row[47]) || 0)}`);
    console.log(`Biaya Appraisal (pj)  : ${formatRp(Number(row[48]) || 0)}`);
    console.log(`BPHTB (pj)            : ${formatRp(Number(row[49]) || 0)}`);
    console.log(`Lain-lain (pj)        : ${formatRp(Number(row[50]) || 0)}`);
    console.log(`Nilai Penyerahan (pj) : ${formatRp(Number(row[52]) || 0)}`);
    console.log(`PPN (pj)              : ${formatRp(Number(row[53]) || 0)}`);
    console.log(`BPHTB Pajak (pj)      : ${formatRp(Number(row[54]) || 0)}`);
    console.log(`PPh (pj)              : ${formatRp(Number(row[55]) || 0)}`);
    console.log(`Total BPHTB+PPh (pj)  : ${formatRp(Number(row[56]) || 0)}`);
    console.log(
      `------------------------------------------------------------------------`,
    );

    console.log(`[5. DETAIL PAJAK - KEPERLUAN AJB (NJOP)]`);
    console.log(`NJOP Tanah/m2 (ajb)   : ${formatRp(Number(row[57]) || 0)}`);
    console.log(`NJOP Tanah (ajb)      : ${formatRp(Number(row[58]) || 0)}`);
    console.log(`NJOP Bangunan/m2 (ajb): ${formatRp(Number(row[59]) || 0)}`);
    console.log(`NJOP Bangunan (ajb)   : ${formatRp(Number(row[60]) || 0)}`);
    console.log(`NJOP Total (ajb)      : ${formatRp(Number(row[61]) || 0)}`);
    console.log(`PPN (ajb)             : ${formatRp(Number(row[62]) || 0)}`);
    console.log(`BPHTB (ajb)           : ${formatRp(Number(row[63]) || 0)}`);
    console.log(`PPh (ajb)             : ${formatRp(Number(row[64]) || 0)}`);
    console.log(`Total BPHTB+PPh (ajb) : ${formatRp(Number(row[65]) || 0)}`);
    console.log(`Selisih Pajak PBB (ajb): ${formatRp(Number(row[66]) || 0)}`);
    console.log(`Uping (ajb)           : ${formatRp(Number(row[67]) || 0)}`);
    console.log(
      `========================================================================\n`,
    );
    const customer = await prisma.customer.create({
      data: {
        nama: namaKonsumen,
        nikKtp: `DUMMY-${index}123456`,
        noHp: noHpValid ?? "",
        alamatKtp: alamatKtpValid ?? "",
        alamatTinggal: alamatTinggalValid,
        email: emailValid,
        pekerjaan: pekerjaanValid,
        bank: bankKprValid,
      },
    });
    const kavling = await prisma.kavling.upsert({
      where: {
        perumahanId_blok_nomorUnit: {
          perumahanId: perumahan.id,
          blok: finalBlok,
          nomorUnit: finalUnit,
        },
      },
      update: {
        status: UnitStatus.TERJUAL,
        hargaDasar: hargaJual,
      },
      create: {
        perumahanId: perumahan.id,
        blok: finalBlok,
        nomorUnit: finalUnit,
        luasBangunan: lb,
        luasTanah: lt,
        namaTipe: namaTipeValid,
        hargaDasar: hargaJual,
        rekeningTujuanId: rekeningTujuanIdValid,
        status: UnitStatus.TERJUAL,
      },
    });
    const penjualan = await prisma.penjualan.create({
      data: {
        noTransaksi: `TRX-SAFANA-${1000 + index}`,
        tanggal: row[18] instanceof Date ? row[18] : new Date(),
        customerId: customer.id,
        kavlingId: kavling.id,
        agentId: agent.id,
        caraPembayaran: caraPembayaranEnum as any,
        hargaJual: hargaJual,
        diskonPenjualan: Number(row[32]) || 0,
        bookingFee: bookingFee,
        rekeningTujuanId: rekeningTujuanIdValid,
        status: PenjualanStatus.PROSES,
        hargaDasar: hargaJual,
      },
    });
    await prisma.detailKavlingPajak.create({
      data: {
        penjualanId: penjualan.id,
        nrDiskonCash: Number(row[32]) || 0,
        nrBiayaBphtb: Number(row[36]) || 0,
        nrBphtb: Number(row[41]) || 0,
        nrNilaiPenyerahan: Number(row[39]) || 0,
        nrPpn: Number(row[40]) || 0,
        nrPph: Number(row[42]) || 0,
        pjBiayaKpr: Number(row[43]) || 0,
        pjBiayaAsuransi: Number(row[44]) || 0,
        pjDiskonAngsuran: Number(row[45]) || 0,
        pjBiayaBbn: Number(row[46]) || 0,
        pjBiayaAjb: Number(row[47]) || 0,
        pjBiayaAppraisal: Number(row[48]) || 0,
        pjBphtb: Number(row[49]) || 0,
        pjLainLain: Number(row[50]) || 0,
        pjNilaiPenyerahan: Number(row[52]) || 0,
        pjPpn: Number(row[53]) || 0,
        pjBphtbPajak: Number(row[54]) || 0,
        pjPph: Number(row[55]) || 0,
        pjTotalBphtbPph: Number(row[56]) || 0,
        ajbNjopTanahPerMeter: Number(row[57]) || 0,
        ajbNjopTanah: Number(row[58]) || 0,
        ajbNjopBangunanPerMeter: Number(row[59]) || 0,
        ajbNjopBangunan: Number(row[60]) || 0,
        ajbNjopTotal: Number(row[61]) || 0,
        ajbPpn: Number(row[62]) || 0,
        ajbBphtb: Number(row[63]) || 0,
        ajbPph: Number(row[64]) || 0,
        ajbTotalBphtbPph: Number(row[65]) || 0,
        ajbSelisihPajakPbb: Number(row[66]) || 0,
        ajbUping: Number(row[67]) || 0,
      },
    });
  }
  console.log(
    "✅ BOOM! Semua data beserta Detail Pajaknya berhasil di-seed masuk ke database!",
  );
}
