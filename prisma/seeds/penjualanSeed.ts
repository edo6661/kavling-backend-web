import {
  PrismaClient,
  PaymentMethod,
  PenjualanStatus,
  AgentStatus,
  UnitStatus,
  PaymentStatus,
  TagihanTujuan,
  type Agent,
  type Notaris,
} from "@prisma/client";
import * as xlsx from "xlsx";
import path from "path";
import fs from "fs";
function getTipe(lb: number): string {
  if (lb === 48) return "Asvara";
  if (lb === 52) return "Adara";
  if (lb === 73) return "Aruna";
  if (lb === 36) return "Ansara";
  return `Tipe ${lb}`;
}
function parseExcelDate(serial: number): Date | null {
  if (!serial || isNaN(serial)) return null;
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date;
}
function formatRp(num: number | null | undefined): string {
  if (num == null) return "null";
  return `Rp ${Number(num).toLocaleString("id-ID")}`;
}
export async function seedPenjualan(prisma: PrismaClient) {
  console.log("==========================================================");
  console.log("  MEMULAI SEED PENJUALAN dari Detil_Pembelian_Unit.xls");
  console.log("==========================================================");
  const excelPath = path.resolve(process.cwd(), "Detil_Pembelian_Unit.xls");
  if (!fs.existsSync(excelPath)) {
    console.error(
      "❌ File Detil_Pembelian_Unit.xls tidak ditemukan di root folder!",
    );
    return;
  }
  const fileBuffer = fs.readFileSync(excelPath);
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = "LENGKAP";
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    console.error(`❌ Sheet '${sheetName}' tidak ditemukan!`);
    return;
  }
  const range = xlsx.utils.decode_range(worksheet["!ref"] || "A1:AT1000");
  const maxRow = range.e.r + 1;
  console.log(`\n>>> Sheet ditemukan: '${sheetName}', total baris: ${maxRow}`);
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  for (let i = 3; i <= maxRow; i++) {
    const getCell = (col: string) => {
      const cell = worksheet[`${col}${i}`];
      return cell ? cell.v : undefined;
    };
    const rawBlok = getCell("E");
    if (rawBlok === undefined || String(rawBlok).trim() === "") {
      console.log(`\n[Baris ${i}] ⚠️  Kolom E kosong — baris dilewati.`);
      skipCount++;
      continue;
    }
    console.log(`\n========================================================`);
    console.log(`[BARIS EXCEL ${i}] RAW VALUES`);
    console.log(`========================================================`);
    const rawKso = getCell("C");
    let rekeningTujuanId: number | null = null;
    if (rawKso !== undefined) {
      const ksoStr = String(rawKso).trim().toLowerCase();
      if (ksoStr.includes("gajah")) {
        rekeningTujuanId = 3;
      } else if (ksoStr.includes("mahligai")) {
        rekeningTujuanId = 4;
      }
    }
    const rawBank = getCell("D");
    let caraPembayaran: PaymentMethod | null = null;
    let bankField: string | null = null;
    if (rawBank !== undefined && String(rawBank).trim() !== "") {
      const bankStr = String(rawBank).trim().toUpperCase();
      if (bankStr === "CASH TAHAP") {
        caraPembayaran = PaymentMethod.CASH_BERTAHAP;
      } else if (bankStr === "CASH KERAS") {
        caraPembayaran = PaymentMethod.CASH_KERAS;
      } else {
        caraPembayaran = PaymentMethod.KPR;
        bankField = String(rawBank).trim();
      }
    } else {
      caraPembayaran = PaymentMethod.KPR;
      bankField = null;
    }
    const blokRaw = String(rawBlok).trim();
    const dashIdx = blokRaw.lastIndexOf("-");
    const blok = dashIdx !== -1 ? blokRaw.substring(0, dashIdx) : blokRaw;
    const nomorUnit = dashIdx !== -1 ? blokRaw.substring(dashIdx + 1) : "";
    const rawCustomerNama = getCell("F");
    const rawAgentNama = getCell("G");
    const rawTipe = getCell("H");
    let lb = 0;
    let lt = 0;
    if (rawTipe !== undefined) {
      const parts = String(rawTipe).split("/");
      lb = parseInt(parts[0]) || 0;
      lt = parseInt(parts[1]) || 0;
    }
    const namaTipe = getTipe(lb);
    const rawHargaJual = getCell("I");
    const hargaJual = rawHargaJual !== undefined ? Number(rawHargaJual) : null;
    const rawDiskon = getCell("J");
    const diskonPenjualan = rawDiskon !== undefined ? Number(rawDiskon) : null;
    const rawPpn = getCell("N");
    const nrPpn = rawPpn !== undefined ? Number(rawPpn) : null;
    const rawBphtb = getCell("O");
    const nrBiayaBphtb = rawBphtb !== undefined ? Number(rawBphtb) : null;
    const rawLainLain = getCell("Q");
    const nrLainLain = rawLainLain !== undefined ? Number(rawLainLain) : null;
    const rawNotarisAjb = getCell("R");
    const nrBiayaNotarisAjb =
      rawNotarisAjb !== undefined ? Number(rawNotarisAjb) : null;
    const rawAkadPpjb = getCell("V");
    const akadPpjb =
      rawAkadPpjb !== undefined ? String(rawAkadPpjb).trim() : null;
    const rawTglAkad = getCell("W");
    const tanggalAkadPpjb =
      rawTglAkad !== undefined ? parseExcelDate(Number(rawTglAkad)) : null;
    const rawPph = getCell("X");
    const nrPph = rawPph !== undefined ? Number(rawPph) : null;
    const rawBiayaKpr = getCell("Y");
    const biayaKpr = rawBiayaKpr !== undefined ? Number(rawBiayaKpr) : null;
    const rawPlafonAcc = getCell("AB");
    const plafonAcc = rawPlafonAcc !== undefined ? Number(rawPlafonAcc) : null;
    const rawNamaNotaris = getCell("AR");
    const rawBiayaPpjb = getCell("AS");
    const biayaPpjb = rawBiayaPpjb !== undefined ? Number(rawBiayaPpjb) : null;
    const rawBiayaAjb = getCell("AT");
    const biayaAjb = rawBiayaAjb !== undefined ? Number(rawBiayaAjb) : null;
    try {
      let kavling = await prisma.kavling.findFirst({
        where: { perumahanId: 1, blok: blok, nomorUnit: nomorUnit },
      });
      if (!kavling) {
        kavling = await prisma.kavling.create({
          data: {
            perumahanId: 1,
            blok: blok,
            nomorUnit: nomorUnit,
            namaTipe: namaTipe,
            luasBangunan: lb,
            luasTanah: lt,
            hargaDasar: hargaJual ?? 0,
            rekeningTujuanId: rekeningTujuanId,
            status: UnitStatus.TERJUAL,
          },
        });
      }
      const namaCustomer = rawCustomerNama
        ? String(rawCustomerNama).trim()
        : null;
      if (!namaCustomer) {
        console.log(`  ❌ Nama customer kosong — baris dilewati.`);
        skipCount++;
        continue;
      }
      let customer = await prisma.customer.findFirst({
        where: { nama: namaCustomer },
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            nikKtp: `IMP-${i}-${Date.now() % 100000}`,
            nama: namaCustomer,
            noHp: "-",
            alamatKtp: "-",
          },
        });
      }
      const namaAgent = rawAgentNama ? String(rawAgentNama).trim() : null;
      let agent: Agent | null = null;
      if (namaAgent) {
        agent = await prisma.agent.findFirst({
          where: { nama: namaAgent },
        });
        if (!agent) {
          agent = await prisma.agent.create({
            data: {
              nik: `IMP-${i}-${Date.now() % 100000}`,
              nama: namaAgent,
              noHp: "-",
              status: AgentStatus.AKTIF,
            },
          });
        }
      }
      const namaNotaris = rawNamaNotaris ? String(rawNamaNotaris).trim() : null;
      let notaris: Notaris | null = null;
      if (namaNotaris) {
        notaris = await prisma.notaris.findFirst({
          where: { nama: namaNotaris },
        });
        if (!notaris) {
          notaris = await prisma.notaris.create({
            data: {
              nama: namaNotaris,
              biayaPpjb: biayaPpjb,
              biayaAjb: biayaAjb,
            },
          });
        } else {
          if (!notaris.biayaPpjb || !notaris.biayaAjb) {
            await prisma.notaris.update({
              where: { id: notaris.id },
              data: {
                biayaPpjb: notaris.biayaPpjb ?? biayaPpjb,
                biayaAjb: notaris.biayaAjb ?? biayaAjb,
              },
            });
          }
        }
      }
      const noTransaksi = `TRX-${blok}-${nomorUnit}-${i}`;
      const calcDiskon = diskonPenjualan ?? 0;
      const calcBookingFee = 5000000;
      let calcPlafonAwal: number | null = null;
      let calcBiayaKpr: number | null = biayaKpr;
      let calcPlafonKredit: number | null = null;
      let calcNilaiPengajuanKpr: number | null = null;
      let calcDpTidakDibayar: number | null = null;
      let calcDp: number | null = null;
      calcDpTidakDibayar = Math.round(
        (Number(kavling.hargaDasar) - Number(diskonPenjualan)) * 0.1 -
          Number(calcBookingFee),
      );
      calcDp = calcDpTidakDibayar;

      if (caraPembayaran === PaymentMethod.KPR) {
        calcPlafonAwal =
          Number(kavling.hargaDasar) - calcDiskon - calcBookingFee;
        if (calcBiayaKpr == null || calcBiayaKpr === 0) {
          calcBiayaKpr = Math.round(calcPlafonAwal * 0.06);
        }
        calcPlafonKredit = calcPlafonAwal + calcBiayaKpr;
        calcNilaiPengajuanKpr = calcPlafonKredit;
      }
      const existingPenjualan = await prisma.penjualan.findFirst({
        where: { kavlingId: kavling.id },
      });
      const payloadPenjualan = {
        customerId: customer.id,
        agentId: agent?.id ?? null,
        rekeningTujuanId: rekeningTujuanId,
        caraPembayaran: caraPembayaran,
        bank: bankField,
        hargaDasar: kavling.hargaDasar,
        diskonPenjualan: calcDiskon > 0 ? calcDiskon : null,
        hargaJual: kavling.hargaDasar,
        plafonAwal: calcPlafonAwal,
        biayaKpr: calcBiayaKpr,
        plafonKredit: calcPlafonKredit,
        nilaiPengajuanKpr: calcNilaiPengajuanKpr,
        dpTidakDibayar: calcDpTidakDibayar,
        dp: calcDp,
        plafonAcc: plafonAcc,
        bookingFee: calcBookingFee,
        status: PenjualanStatus.PROSES,
      };
      let penjualan;
      if (existingPenjualan) {
        console.log(
          `  ⚠️  Penjualan sudah ada untuk kavling ini (ID: ${existingPenjualan.id}). Update data...`,
        );
        penjualan = await prisma.penjualan.update({
          where: { id: existingPenjualan.id },
          data: {
            ...payloadPenjualan,
            fileBuktiBooking: "",
          },
        });
      } else {
        penjualan = await prisma.penjualan.create({
          data: {
            noTransaksi: noTransaksi,
            tanggal: tanggalAkadPpjb ?? new Date(),
            kavlingId: kavling.id,
            ...payloadPenjualan,
          },
        });
      }
      const noTagihanBf = `INV-BF-${noTransaksi}`;

      await prisma.tagihan.upsert({
        where: { noTagihan: noTagihanBf },
        update: {
          nominal: calcBookingFee,
          jatuhTempo: tanggalAkadPpjb ?? new Date(),
          tujuan: TagihanTujuan.BOOKING_FEE,
        },
        create: {
          noTagihan: noTagihanBf,
          customerId: customer.id,
          penjualanId: penjualan.id,
          pembayaran: "Booking Fee",
          tujuan: TagihanTujuan.BOOKING_FEE,
          nominal: calcBookingFee,
          jatuhTempo: tanggalAkadPpjb ?? new Date(),
          status: PaymentStatus.BELUM_BAYAR,
        },
      });

      if (
        calcDp &&
        calcDp > 0 &&
        (caraPembayaran === PaymentMethod.KPR ||
          caraPembayaran === PaymentMethod.CASH_BERTAHAP)
      ) {
        const noTagihanDp = `INV-DP-${noTransaksi}`;
        const dpDueDate = new Date(tanggalAkadPpjb ?? new Date());
        dpDueDate.setDate(dpDueDate.getDate() + 14);

        await prisma.tagihan.upsert({
          where: { noTagihan: noTagihanDp },
          update: {
            nominal: calcDp,
            jatuhTempo: dpDueDate,
            tujuan: TagihanTujuan.DP,
          },
          create: {
            noTagihan: noTagihanDp,
            customerId: customer.id,
            penjualanId: penjualan.id,
            pembayaran: "Down Payment (DP)",
            tujuan: TagihanTujuan.DP,
            nominal: calcDp,
            jatuhTempo: dpDueDate,
            status: PaymentStatus.BELUM_BAYAR,
          },
        });
      }
      const detailData = {
        notarisId: notaris?.id ?? null,
        akadPpjb: akadPpjb,
        tanggalAkadPpjb: tanggalAkadPpjb,
        nrPpn: nrPpn,
        nrBiayaBphtb: nrBiayaBphtb,
        nrLainLain: nrLainLain,
        nrBiayaNotarisAjb: biayaAjb,
        nrBiayaNotarisPpjb: biayaPpjb,
        nrPph: nrPph,
      };
      await prisma.detailKavlingPajak.upsert({
        where: { penjualanId: penjualan.id },
        create: { penjualanId: penjualan.id, ...detailData },
        update: detailData,
      });
      await prisma.kavling.update({
        where: { id: kavling.id },
        data: { status: UnitStatus.TERJUAL },
      });
      successCount++;
      console.log(
        `\n✅ [Baris ${i}] SUKSES — ${blok}/${nomorUnit} (${namaCustomer})`,
      );
    } catch (err: any) {
      errorCount++;
      console.error(`\n❌ [Baris ${i}] ERROR: ${err.message}`);
    }
  }
  console.log(`\n==========================================================`);
  console.log(`  SELESAI SEED PENJUALAN`);
  console.log(`  ✅ Sukses : ${successCount}`);
  console.log(`  ⏭️  Skip   : ${skipCount}`);
  console.log(`  ❌ Error  : ${errorCount}`);
  console.log(`==========================================================`);
}
