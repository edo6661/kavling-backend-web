import {
  PrismaClient,
  Role,
  UnitStatus,
  PaymentMethod,
  PenjualanStatus,
} from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function main() {
  const perumahan = await prisma.perumahan.upsert({
    where: { nama: "Puri Safana Cikeas" },
    update: {},
    create: {
      nama: "Puri Safana Cikeas",
      logo: "logo-safana.png",
      alamat: "Cikeas, Bogor",
    },
  });

  const rawData = fs.readFileSync("cleaned_data.json", "utf-8");
  const data = JSON.parse(rawData);

  console.log(`Memulai migrasi ${data.length} data...`);

  for (const item of data) {
    try {
      await prisma.$transaction(async (tx) => {
        const agent = await tx.agent.upsert({
          where: {
            nik: `AGENT-${item.agent.nama.toUpperCase().replace(/\s+/g, "")}`,
          },
          update: {},
          create: {
            nik: `AGENT-${item.agent.nama.toUpperCase().replace(/\s+/g, "")}`,
            nama: item.agent.nama,
            noHp: "0",
          },
        });

        const customer = await tx.customer.create({
          data: {
            nama: item.customer.nama,
            alamatKtp: item.customer.alamatKtp,
            alamatTinggal: item.customer.alamatTinggal,
            noHp: item.customer.noHp,
            nikKtp: `TEMP-${Math.random().toString(36).substr(2, 9)}`,
            pekerjaan: item.customer.pekerjaan,
            bank: item.customer.bank,
          },
        });

        const kavling = await tx.kavling.create({
          data: {
            perumahanId: perumahan.id,
            blok: item.kavling.blok,
            nomorUnit: item.kavling.nomorUnit,
            namaTipe: item.kavling.namaTipe,
            luasTanah: item.kavling.luasTanah,
            luasBangunan: item.kavling.luasBangunan,
            hargaDasar: item.kavling.hargaDasar,
            status: UnitStatus.TERJUAL,
          },
        });

        const penjualan = await tx.penjualan.create({
          data: {
            noTransaksi: item.penjualan.noTransaksi,
            tanggal: new Date(item.penjualan.tanggal),
            customerId: customer.id,
            kavlingId: kavling.id,
            agentId: agent.id,
            caraPembayaran: item.penjualan.caraPembayaran as PaymentMethod,
            hargaJual: item.penjualan.hargaJual,
            bookingFee: item.penjualan.bookingFee,
            status: PenjualanStatus.PROSES,
          },
        });

        await tx.detailKavlingPajak.create({
          data: {
            penjualanId: penjualan.id,
            lantai: item.detailPajak.lantai,
            tanggalAkadPpjb: item.detailPajak.tanggalAkadPpjb
              ? new Date(item.detailPajak.tanggalAkadPpjb)
              : null,
            akadPpjb: item.detailPajak.akadPpjb,
            lebihTanah: item.detailPajak.lebihTanah,
            biayaStrategis: item.detailPajak.biayaStrategis,
            nrNilaiPenyerahan: item.detailPajak.nrNilaiPenyerahan,
            pjNilaiPenyerahan: item.detailPajak.pjNilaiPenyerahan,
            ajbNjopTotal: item.detailPajak.ajbNjopTotal,
          },
        });

        if (item.feeAgent.closingNominal > 0) {
          await tx.feeAgent.create({
            data: {
              agentId: agent.id,
              penjualanId: penjualan.id,
              closingNominal: item.feeAgent.closingNominal,
              closingTanggal: item.feeAgent.closingTanggal
                ? new Date(item.feeAgent.closingTanggal)
                : null,
            },
          });
        }
      });
    } catch (error) {
      console.error(`Gagal memproses baris: ${item.customer.nama}`, error);
    }
  }

  console.log("Migrasi selesai!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
