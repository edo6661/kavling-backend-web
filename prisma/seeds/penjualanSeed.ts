import { PrismaClient, PaymentMethod, PenjualanStatus } from "@prisma/client";
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
    console.log(`C${i} (KSO)         : ${rawKso}`);
    let rekeningTujuanId: number | null = null;
    if (rawKso !== undefined) {
      const ksoStr = String(rawKso).trim().toLowerCase();
      if (ksoStr.includes("gajah")) {
        rekeningTujuanId = 1;
      } else if (ksoStr.includes("mahligai")) {
        rekeningTujuanId = 2;
      }
    }
    console.log(`  → rekeningTujuanId : ${rekeningTujuanId}`);
    const rawBank = getCell("D");
    console.log(`D${i} (Bank/Bayar)   : ${rawBank}`);
    let caraPembayaran: PaymentMethod | null = null;
    let bankField: string | null = null;
    if (rawBank !== undefined) {
      const bankStr = String(rawBank).trim().toUpperCase();
      if (bankStr === "CASH TAHAP" || bankStr === "CASH KERAS") {
        caraPembayaran =
          bankStr === "CASH TAHAP"
            ? PaymentMethod.CASH_BERTAHAP
            : PaymentMethod.CASH_KERAS;
      } else {
        caraPembayaran = PaymentMethod.KPR;
        bankField = String(rawBank).trim();
      }
    }
    console.log(`  → caraPembayaran   : ${caraPembayaran}`);
    console.log(`  → bank             : ${bankField}`);
    const blokRaw = String(rawBlok).trim();
    const dashIdx = blokRaw.lastIndexOf("-");
    const blok = dashIdx !== -1 ? blokRaw.substring(0, dashIdx) : blokRaw;
    const nomorUnit = dashIdx !== -1 ? blokRaw.substring(dashIdx + 1) : "";
    console.log(`E${i} (Blok Unit)    : ${blokRaw}`);
    console.log(`  → blok             : ${blok}`);
    console.log(`  → nomorUnit        : ${nomorUnit}`);
    const rawCustomerNama = getCell("F");
    console.log(`F${i} (Customer)     : ${rawCustomerNama}`);
    const rawAgentNama = getCell("G");
    console.log(`G${i} (Agent)        : ${rawAgentNama}`);
    const rawTipe = getCell("H");
    console.log(`H${i} (LB/LT)       : ${rawTipe}`);
    let lb = 0;
    let lt = 0;
    if (rawTipe !== undefined) {
      const parts = String(rawTipe).split("/");
      lb = parseInt(parts[0]) || 0;
      lt = parseInt(parts[1]) || 0;
    }
    const namaTipe = getTipe(lb);
    console.log(`  → lb: ${lb}, lt: ${lt}, namaTipe: ${namaTipe}`);
    const rawHargaJual = getCell("I");
    console.log(`I${i} (Harga Jual)  : ${rawHargaJual}`);
    const hargaJual = rawHargaJual !== undefined ? Number(rawHargaJual) : null;
    const rawDiskon = getCell("J");
    console.log(`J${i} (Diskon)      : ${rawDiskon}`);
    const diskonPenjualan = rawDiskon !== undefined ? Number(rawDiskon) : null;
    const rawPpn = getCell("N");
    console.log(`N${i} (nrPpn)       : ${rawPpn}`);
    const nrPpn = rawPpn !== undefined ? Number(rawPpn) : null;
    const rawBphtb = getCell("O");
    console.log(`O${i} (nrBphtb)     : ${rawBphtb}`);
    const nrBiayaBphtb = rawBphtb !== undefined ? Number(rawBphtb) : null;
    const rawLainLain = getCell("Q");
    console.log(`Q${i} (nrLainLain)  : ${rawLainLain}`);
    const nrLainLain = rawLainLain !== undefined ? Number(rawLainLain) : null;
    const rawNotarisAjb = getCell("R");
    console.log(`R${i} (nrBiayaNotarisAjb): ${rawNotarisAjb}`);
    const nrBiayaNotarisAjb =
      rawNotarisAjb !== undefined ? Number(rawNotarisAjb) : null;
    const rawAkadPpjb = getCell("V");
    console.log(`V${i} (akadPpjb)    : ${rawAkadPpjb}`);
    const akadPpjb =
      rawAkadPpjb !== undefined ? String(rawAkadPpjb).trim() : null;
    const rawTglAkad = getCell("W");
    console.log(`W${i} (tanggalAkad) : ${rawTglAkad}`);
    const tanggalAkadPpjb =
      rawTglAkad !== undefined ? parseExcelDate(Number(rawTglAkad)) : null;
    console.log(`  → tanggalAkadPpjb : ${tanggalAkadPpjb}`);
    const rawPph = getCell("X");
    console.log(`X${i} (nrPph)       : ${rawPph}`);
    const nrPph = rawPph !== undefined ? Number(rawPph) : null;
    const rawBiayaKpr = getCell("Y");
    console.log(`Y${i} (biayaKpr)    : ${rawBiayaKpr}`);
    const biayaKpr = rawBiayaKpr !== undefined ? Number(rawBiayaKpr) : null;
    const rawPlafonAcc = getCell("AB");
    console.log(`AB${i} (plafonAcc)  : ${rawPlafonAcc}`);
    const plafonAcc = rawPlafonAcc !== undefined ? Number(rawPlafonAcc) : null;
    const rawNamaNotaris = getCell("AR");
    console.log(`AR${i} (Notaris)    : ${rawNamaNotaris}`);
    const rawBiayaPpjb = getCell("AS");
    console.log(`AS${i} (biayaPpjb)  : ${rawBiayaPpjb}`);
    const biayaPpjb = rawBiayaPpjb !== undefined ? Number(rawBiayaPpjb) : null;
    const rawBiayaAjb = getCell("AT");
    console.log(`AT${i} (biayaAjb)   : ${rawBiayaAjb}`);
    const biayaAjb = rawBiayaAjb !== undefined ? Number(rawBiayaAjb) : null;
    console.log(`\n[Baris ${i}] MAPPED SUMMARY`);
    console.log(`  Blok/Unit          : ${blok} / ${nomorUnit}`);
    console.log(`  Nama Tipe          : ${namaTipe} (${lb}/${lt})`);
    console.log(`  Customer           : ${rawCustomerNama}`);
    console.log(`  Agent              : ${rawAgentNama}`);
    console.log(`  Cara Pembayaran    : ${caraPembayaran}`);
    console.log(`  Bank               : ${bankField}`);
    console.log(`  rekeningTujuanId   : ${rekeningTujuanId}`);
    console.log(`  Harga Jual         : ${formatRp(hargaJual)}`);
    console.log(`  Diskon             : ${formatRp(diskonPenjualan)}`);
    console.log(`  nrPpn              : ${formatRp(nrPpn)}`);
    console.log(`  nrBiayaBphtb       : ${formatRp(nrBiayaBphtb)}`);
    console.log(`  nrLainLain         : ${formatRp(nrLainLain)}`);
    console.log(`  nrBiayaNotarisAjb  : ${formatRp(nrBiayaNotarisAjb)}`);
    console.log(`  akadPpjb           : ${akadPpjb}`);
    console.log(`  tanggalAkadPpjb    : ${tanggalAkadPpjb}`);
    console.log(`  nrPph              : ${formatRp(nrPph)}`);
    console.log(`  biayaKpr           : ${formatRp(biayaKpr)}`);
    console.log(`  plafonAcc          : ${formatRp(plafonAcc)}`);
    console.log(`  Notaris            : ${rawNamaNotaris}`);
    console.log(`  biayaPpjb          : ${formatRp(biayaPpjb)}`);
    console.log(`  biayaAjb           : ${formatRp(biayaAjb)}`);
    try {
      console.log(
        `\n[Baris ${i}] 🔍 Mencari kavling: blok=${blok}, nomorUnit=${nomorUnit}`,
      );
      let kavling = await prisma.kavling.findFirst({
        where: {
          perumahanId: 1,
          blok: blok,
          nomorUnit: nomorUnit,
        },
      });
      if (!kavling) {
        console.log(`  ⚠️  Kavling tidak ditemukan. Membuat baru...`);
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
            status: "TERJUAL",
          },
        });
        console.log(`  ✅ Kavling baru dibuat: ID ${kavling.id}`);
      } else {
        console.log(
          `  ✅ Kavling ditemukan: ID ${kavling.id}, hargaDasar=${formatRp(Number(kavling.hargaDasar))}`,
        );
      }
      const namaCustomer = rawCustomerNama
        ? String(rawCustomerNama).trim()
        : null;
      if (!namaCustomer) {
        console.log(`  ❌ Nama customer kosong — baris dilewati.`);
        skipCount++;
        continue;
      }
      console.log(`\n[Baris ${i}] 🔍 Mencari customer: ${namaCustomer}`);
      let customer = await prisma.customer.findFirst({
        where: { nama: namaCustomer },
      });
      if (!customer) {
        console.log(`  ⚠️  Customer tidak ditemukan. Membuat baru...`);
        customer = await prisma.customer.create({
          data: {
            nikKtp: `IMP-${i}-${Date.now() % 100000}`,
            nama: namaCustomer,
            noHp: "-",
            alamatKtp: "-",
          },
        });
        console.log(`  ✅ Customer baru dibuat: ID ${customer.id}`);
      } else {
        console.log(`  ✅ Customer ditemukan: ID ${customer.id}`);
      }
      const namaAgent = rawAgentNama ? String(rawAgentNama).trim() : null;
      let agent = null;
      if (namaAgent) {
        console.log(`\n[Baris ${i}] 🔍 Mencari agent: ${namaAgent}`);
        agent = await prisma.agent.findFirst({
          where: { nama: namaAgent },
        });
        if (!agent) {
          console.log(`  ⚠️  Agent tidak ditemukan. Membuat baru...`);
          agent = await prisma.agent.create({
            data: {
              nik: `IMP-${i}-${Date.now() % 100000}`,
              nama: namaAgent,
              noHp: "-",
              status: "AKTIF",
            },
          });
          console.log(`  ✅ Agent baru dibuat: ID ${agent.id}`);
        } else {
          console.log(`  ✅ Agent ditemukan: ID ${agent.id}`);
        }
      }
      const namaNotaris = rawNamaNotaris ? String(rawNamaNotaris).trim() : null;
      let notaris = null;
      if (namaNotaris) {
        console.log(`\n[Baris ${i}] 🔍 Mencari notaris: ${namaNotaris}`);
        notaris = await prisma.notaris.findFirst({
          where: { nama: namaNotaris },
        });
        if (!notaris) {
          console.log(`  ⚠️  Notaris tidak ditemukan. Membuat baru...`);
          notaris = await prisma.notaris.create({
            data: {
              nama: namaNotaris,
              biayaPpjb: biayaPpjb,
              biayaAjb: biayaAjb,
            },
          });
          console.log(`  ✅ Notaris baru dibuat: ID ${notaris.id}`);
        } else {
          console.log(`  ✅ Notaris ditemukan: ID ${notaris.id}`);
          if (!notaris.biayaPpjb || !notaris.biayaAjb) {
            await prisma.notaris.update({
              where: { id: notaris.id },
              data: {
                biayaPpjb: notaris.biayaPpjb ?? biayaPpjb,
                biayaAjb: notaris.biayaAjb ?? biayaAjb,
              },
            });
            console.log(
              `  🔄 Notaris diupdate biaya: ppjb=${formatRp(biayaPpjb)}, ajb=${formatRp(biayaAjb)}`,
            );
          }
        }
      }
      const noTransaksi = `IMPORT-${blok}-${nomorUnit}-${i}`;
      console.log(`\n[Baris ${i}] 📝 noTransaksi: ${noTransaksi}`);
      const existingPenjualan = await prisma.penjualan.findFirst({
        where: { kavlingId: kavling.id },
      });
      let penjualan;
      if (existingPenjualan) {
        console.log(
          `  ⚠️  Penjualan sudah ada untuk kavling ini (ID: ${existingPenjualan.id}). Update data...`,
        );
        penjualan = await prisma.penjualan.update({
          where: { id: existingPenjualan.id },
          data: {
            customerId: customer.id,
            agentId: agent?.id ?? null,
            rekeningTujuanId: rekeningTujuanId,
            caraPembayaran: caraPembayaran,
            bank: bankField,
            hargaDasar: Number(kavling.hargaDasar),
            hargaJual: hargaJual,
            diskonPenjualan: diskonPenjualan,
            plafonAcc: plafonAcc,
            biayaKpr: biayaKpr,
            status: PenjualanStatus.LUNAS,
          },
        });
        console.log(`  ✅ Penjualan diupdate: ID ${penjualan.id}`);
      } else {
        penjualan = await prisma.penjualan.create({
          data: {
            noTransaksi: noTransaksi,
            tanggal: tanggalAkadPpjb ?? new Date(),
            customerId: customer.id,
            kavlingId: kavling.id,
            agentId: agent?.id ?? null,
            rekeningTujuanId: rekeningTujuanId,
            caraPembayaran: caraPembayaran,
            bank: bankField,
            hargaDasar: Number(kavling.hargaDasar),
            hargaJual: hargaJual,
            diskonPenjualan: diskonPenjualan,
            plafonAcc: plafonAcc,
            biayaKpr: biayaKpr,
            status: PenjualanStatus.LUNAS,
          },
        });
        console.log(`  ✅ Penjualan baru dibuat: ID ${penjualan.id}`);
      }
      console.log(`\n[Baris ${i}] 📋 Upsert DetailKavlingPajak...`);
      const detailData = {
        notarisId: notaris?.id ?? null,
        akadPpjb: akadPpjb,
        tanggalAkadPpjb: tanggalAkadPpjb,
        nrPpn: nrPpn,
        nrBiayaBphtb: nrBiayaBphtb,
        nrLainLain: nrLainLain,
        nrBiayaNotarisAjb: nrBiayaNotarisAjb,
        nrPph: nrPph,
      };
      await prisma.detailKavlingPajak.upsert({
        where: { penjualanId: penjualan.id },
        create: { penjualanId: penjualan.id, ...detailData },
        update: detailData,
      });
      console.log(`  ✅ DetailKavlingPajak upserted.`);
      await prisma.kavling.update({
        where: { id: kavling.id },
        data: { status: "TERJUAL" },
      });
      console.log(`  ✅ Status kavling diupdate → TERJUAL`);
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
