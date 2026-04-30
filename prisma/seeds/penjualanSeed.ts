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

function getTipe(lb: number, lt: number): string {
  for (const [namaTipe, data] of Object.entries(KAVLING_DATA)) {
    if (data.lb === lb && data.lt.includes(lt)) {
      return namaTipe;
    }
  }
  return `${lb}/${lt}`;
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

  const bank = await prisma.bankRekeningPt.create({
    data: {
      perumahanId: perumahan.id,
      namaBank: "BSI",
      noRekening: "7326575644",
      atasNama: "PT. Bintang Safana Gajah",
    },
  });

  const excelPath = path.resolve(process.cwd(), "penjualan.xlsx");
  const fileBuffer = fs.readFileSync(excelPath);
  const workbook = xlsx.read(fileBuffer, { type: "buffer", cellDates: true });

  const sheetName = workbook.SheetNames[0];
  const dataPenjualan: any[] = xlsx.utils.sheet_to_json(
    workbook.Sheets[sheetName],
  );

  console.log(`Ditemukan ${dataPenjualan.length} data. Memulai import...`);

  for (const [index, row] of dataPenjualan.entries()) {
    const namaKonsumenRaw = row["Nama Konsumen"] || row.NamaKonsumen;

    if (
      !namaKonsumenRaw ||
      namaKonsumenRaw === "2" ||
      namaKonsumenRaw === "Nama Konsumen"
    ) {
      console.log(
        `[${index + 1}/${dataPenjualan.length}] ⏩ Skip baris header/kosong...`,
      );
      continue;
    }

    const namaKonsumen = String(namaKonsumenRaw).trim();
    console.log(
      `[${index + 1}/${dataPenjualan.length}] Mengimport data: ${namaKonsumen}`,
    );

    const namaAgent = row.Agent ? String(row.Agent).trim() : "Tanpa Agen";
    let agent = await prisma.agent.findFirst({ where: { nama: namaAgent } });
    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          nik: `DUMMY-NIK-${index}`,
          kodeSales: `AGT-${index}`,
          nama: namaAgent,
          noHp: "-",
        },
      });
    }

    const alamatKtpValid = row["__EMPTY"]
      ? String(row["__EMPTY"]).trim()
      : "Sesuai KTP";
    const alamatTinggalValid = row["__EMPTY_1"]
      ? String(row["__EMPTY_1"]).trim()
      : null;
    const noHpValid =
      row.NoHp || row["No Handphone"] || row["__EMPTY_2"]
        ? String(row.NoHp || row["No Handphone"] || row["__EMPTY_2"]).trim()
        : "-";
    const emailValid =
      row.Email || row["__EMPTY_3"]
        ? String(row.Email || row["__EMPTY_3"]).trim()
        : `user${index}@example.com`;
    const pekerjaanValid = row["__EMPTY_4"]
      ? String(row["__EMPTY_4"]).trim()
      : null;
    const bankKprValid = row["__EMPTY_5"]
      ? String(row["__EMPTY_5"]).trim()
      : null;

    const customer = await prisma.customer.create({
      data: {
        nama: namaKonsumen,
        nikKtp: `DUMMY-${index}123456`,
        noHp: noHpValid,
        alamatKtp: alamatKtpValid,
        alamatTinggal: alamatTinggalValid,
        email: emailValid,
        pekerjaan: pekerjaanValid,
        bank: bankKprValid,
      },
    });

    const rawBlok = row.BLOK !== undefined ? row.BLOK : row.Blok;
    let rawUnit = row.Unit !== undefined ? row.Unit : row.UNIT;

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

    const lb = Number(row.LuasBangunan || row["Luas Bangunan"]) || 0;
    const lt = Number(row.LuasTanah || row["Luas Tanah"]) || 0;
    const namaTipeValid = getTipe(lb, lt);
    const hargaJual = Number(row.HargaJual || row["Harga Jual"]) || 0;
    const bookingFee = Number(row.BookingFee || row["BOOKING FEE"]) || 0;

    const kavling = await prisma.kavling.create({
      data: {
        perumahanId: perumahan.id,
        blok: finalBlok,
        nomorUnit: finalUnit,
        luasBangunan: lb,
        luasTanah: lt,
        namaTipe: namaTipeValid,
        hargaDasar: hargaJual,
        rekeningTujuanId: bank.id,
        status: UnitStatus.TERJUAL,
      },
    });

    const penjualan = await prisma.penjualan.create({
      data: {
        noTransaksi: `TRX-SAFANA-${1000 + index}`,
        tanggal: new Date(),
        customerId: customer.id,
        kavlingId: kavling.id,
        agentId: agent.id,
        caraPembayaran: "KPR",
        hargaJual: hargaJual,
        diskonPenjualan: 0,
        bookingFee: bookingFee,
        rekeningTujuanId: bank.id,
        status: PenjualanStatus.PROSES,
        hargaDasar: hargaJual,
      },
    });

    await prisma.detailKavlingPajak.create({
      data: {
        penjualanId: penjualan.id,
        nrDiskonCash: Number(row["__EMPTY_11"]) || 0,
        nrBphtb: Number(row["__EMPTY_15"]) || 0,
        nrNilaiPenyerahan: Number(row["__EMPTY_18"]) || 0,
        nrPpn: Number(row["__EMPTY_19"]) || 0,
        nrPph: Number(row["__EMPTY_21"]) || 0,

        ajbNjopTanahPerMeter: Number(row[" Keperluan AJB"]) || 0,
        ajbNjopTanah: Number(row["__EMPTY_35"]) || 0,
        ajbNjopBangunanPerMeter: Number(row["__EMPTY_36"]) || 0,
        ajbNjopBangunan: Number(row["__EMPTY_37"]) || 0,
        ajbNjopTotal: Number(row["__EMPTY_38"]) || 0,
        ajbPpn: Number(row["__EMPTY_39"]) || 0,
        ajbBphtb: Number(row["__EMPTY_40"]) || 0,
        ajbPph: Number(row["__EMPTY_41"]) || 0,
        ajbSelisihPajakPbb: Number(row["__EMPTY_43"]) || 0,
      },
    });
  }

  console.log(
    "Semua data beserta Detail Pajaknya berhasil di-seed masuk ke database!",
  );
}
