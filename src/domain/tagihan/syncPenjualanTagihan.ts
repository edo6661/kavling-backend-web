import type { Prisma } from "@prisma/client";
import { ConflictError } from "../errors/ConflictError.js";
import { effectiveTagihanTujuan } from "./tagihanTujuan.js";
import { isTagihanNominalLocked } from "./tagihanNominalLock.js";

export async function syncDpTagihanForPenjualan(
  tx: Prisma.TransactionClient,
  args: {
    penjualanId: number;
    noTransaksi: string;
    customerId: number;
    tanggal: Date;
    dp: number;
  },
): Promise<void> {
  if (args.dp <= 0) return;

  const dpTagihans = await tx.tagihan.findMany({
    where: { penjualanId: args.penjualanId },
  });
  const existingDp = dpTagihans.find((t) => effectiveTagihanTujuan(t) === "DP");

  if (!existingDp) {
    const dpDueDate = new Date(args.tanggal);
    dpDueDate.setDate(dpDueDate.getDate() + 14);
    await tx.tagihan.create({
      data: {
        noTagihan: `INV-DP-${args.noTransaksi}`,
        customerId: args.customerId,
        penjualanId: args.penjualanId,
        pembayaran: "Down Payment (DP)",
        tujuan: "DP",
        nominal: args.dp,
        jatuhTempo: dpDueDate,
        status: "BELUM_BAYAR",
      },
    });
    return;
  }

  if (
    Number(existingDp.nominal) !== args.dp &&
    !isTagihanNominalLocked(existingDp.status)
  ) {
    await tx.tagihan.update({
      where: { id: existingDp.id },
      data: { nominal: args.dp, tujuan: "DP" },
    });
  }
}

export async function syncCicilanTagihanForPenjualan(
  tx: Prisma.TransactionClient,
  args: {
    penjualanId: number;
    noTransaksi: string;
    tanggal: Date;
    customerId: number;
    hargaJual: number;
    bookingFee: number;
    termin: number;
    dp: number;
  },
): Promise<void> {
  if (args.termin <= 0) return;

  const sisaPembayaran = Math.max(
    0,
    args.hargaJual - args.dp - args.bookingFee,
  );
  const cicilanPerBulan = sisaPembayaran / args.termin;

  const existingCicilans = await tx.tagihan.findMany({
    where: {
      penjualanId: args.penjualanId,
      OR: [
        { noTagihan: { startsWith: `INV-CCL-${args.noTransaksi}-` } },
        { pembayaran: { startsWith: "Cicilan Ke-" } },
      ],
    },
  });

  const parseCicilanIndex = (pembayaran: string): number => {
    const m = /^Cicilan Ke-(\d+)$/.exec(pembayaran.trim());
    return m ? parseInt(m[1]!, 10) : 0;
  };

  const byIndex = new Map<number, (typeof existingCicilans)[number]>();
  for (const c of existingCicilans) {
    const idx = parseCicilanIndex(c.pembayaran);
    if (idx > 0) byIndex.set(idx, c);
  }

  const baseDate = new Date(args.tanggal);

  for (let i = 1; i <= args.termin; i++) {
    const jatuhTempoCicilan = new Date(baseDate);
    jatuhTempoCicilan.setMonth(jatuhTempoCicilan.getMonth() + i);

    const existing = byIndex.get(i);
    if (!existing) {
      if (sisaPembayaran <= 0) continue;
      await tx.tagihan.create({
        data: {
          noTagihan: `INV-CCL-${args.noTransaksi}-${i}`,
          customerId: args.customerId,
          penjualanId: args.penjualanId,
          pembayaran: `Cicilan Ke-${i}`,
          tujuan: "HARGA_JUAL",
          nominal: cicilanPerBulan,
          jatuhTempo: jatuhTempoCicilan,
          status: "BELUM_BAYAR",
        },
      });
    } else {
      const patch: { nominal?: number; jatuhTempo?: Date } = {};
      if (
        Number(existing.nominal) !== cicilanPerBulan &&
        !isTagihanNominalLocked(existing.status)
      ) {
        patch.nominal = cicilanPerBulan;
      }
      if (
        existing.status === "BELUM_BAYAR" &&
        existing.jatuhTempo.getTime() !== jatuhTempoCicilan.getTime()
      ) {
        patch.jatuhTempo = jatuhTempoCicilan;
      }
      if (Object.keys(patch).length > 0) {
        await tx.tagihan.update({
          where: { id: existing.id },
          data: patch,
        });
      }
    }
  }

  for (const [idx, cicilan] of byIndex) {
    if (idx <= args.termin) continue;
    if (cicilan.status === "BELUM_BAYAR") {
      await tx.tagihan.delete({ where: { id: cicilan.id } });
    } else {
      throw new ConflictError(
        `Tidak dapat memperpendek termin: cicilan ke-${idx} sudah lunas atau menunggu konfirmasi.`,
      );
    }
  }
}
