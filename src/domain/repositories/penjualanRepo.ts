import type { Prisma, PrismaClient } from "@prisma/client";
import type { IPenjualanRepository } from "./IPenjualanRepo.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import type {
  CreatePenjualanDTO,
  PenjualanFilterDTO,
} from "../dtos/PenjualanDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export class PenjualanRepository implements IPenjualanRepository {
  constructor(private readonly db: PrismaClient) {}

  async createWithTransaction(data: CreatePenjualanDTO) {
    return await this.db.$transaction(async (tx) => {
      let customer = await tx.customer.findUnique({
        where: { nikKtp: data.noIdentitas },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            nikKtp: data.noIdentitas,
            nama: data.nama,
            noHp: data.noTelepon,
            alamatKtp: data.alamat,
            perusahaan: data.perusahaan ?? null,
            alamatKoresponden: data.alamatKoresponden ?? null,
          },
        });
      } else {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            noHp: data.noTelepon,
            alamatKtp: data.alamat,
            perusahaan: data.perusahaan ?? null,
            alamatKoresponden: data.alamatKoresponden ?? null,
          },
        });
      }

      const perumahan = await tx.perumahan.findFirst({
        where: { nama: data.perumahan },
      });

      if (!perumahan) {
        throw new NotFoundError(
          `Perumahan '${data.perumahan}' tidak ditemukan di sistem.`,
        );
      }

      let kavling = await tx.kavling.findFirst({
        where: {
          perumahanId: perumahan.id,
          blok: data.blok,
          nomorUnit: data.nomorUnit,
        },
      });

      if (kavling) {
        if (kavling.status !== "AVAILABLE") {
          throw new ConflictError(
            `Gagal! Kavling Blok ${data.blok} - ${data.nomorUnit} sudah terisi atau berstatus ${kavling.status}.`,
          );
        }

        kavling = await tx.kavling.update({
          where: { id: kavling.id },
          data: {
            status: "BOOKING",
            namaTipe: data.tipe,
            luasBangunan: data.luasBangunan,
            luasTanah: data.luasTanah,
            hargaJual: data.hargaJual,
          },
        });
      } else {
        kavling = await tx.kavling.create({
          data: {
            perumahanId: perumahan.id,
            blok: data.blok,
            nomorUnit: data.nomorUnit,
            namaTipe: data.tipe,
            luasBangunan: data.luasBangunan,
            luasTanah: data.luasTanah,
            hargaJual: data.hargaJual,
            status: "BOOKING",
          },
        });
      }

      let agent = await tx.agent.findFirst({
        where: { nama: data.agent },
      });

      if (!agent) {
        const dummyNik = `MKT-${Date.now().toString().slice(-10)}`;
        agent = await tx.agent.create({
          data: {
            nik: dummyNik,
            nama: data.agent,
            noHp: "-",
            status: "AKTIF",
          },
        });
      }

      const countHariIni = await tx.penjualan.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      });

      const noTransaksi = `TRX-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, "0")}-${String(countHariIni + 1).padStart(3, "0")}`;

      const penjualan = await tx.penjualan.create({
        data: {
          noTransaksi,
          tanggal: new Date(data.tanggal),
          customerId: customer.id,
          kavlingId: kavling.id,
          agentId: agent.id,
          caraPembayaran: data.caraPembayaran,
          hargaJual: data.hargaJual,
          dp: data.dp ?? null,
          diskonPenjualan: data.diskonPenjualan ?? null,
          hargaPromosi: data.hargaPromosi ?? null,
          bank: data.bank ?? null,
          nilaiPengajuanKpr: data.nilaiPengajuanKpr ?? null,
          bookingFee: data.bookingFee ?? null,
          status: "BOOKED",
        },
        include: {
          customer: { select: { id: true, nama: true } },
          kavling: {
            select: {
              id: true,
              blok: true,
              nomorUnit: true,
              perumahan: { select: { nama: true } },
            },
          },
        },
      });

      if (data.bookingFee && data.bookingFee > 0) {
        await tx.tagihan.create({
          data: {
            noTagihan: `INV-BF-${noTransaksi}`,
            customerId: customer.id,
            penjualanId: penjualan.id,
            pembayaran: "Booking Fee",
            nominal: data.bookingFee,
            jatuhTempo: new Date(data.tanggal),
            status: "BELUM_BAYAR",
          },
        });
      }

      if (data.dp && data.dp > 0) {
        const dpDueDate = new Date(data.tanggal);
        dpDueDate.setDate(dpDueDate.getDate() + 14);

        await tx.tagihan.create({
          data: {
            noTagihan: `INV-DP-${noTransaksi}`,
            customerId: customer.id,
            penjualanId: penjualan.id,
            pembayaran: "Down Payment (DP)",
            nominal: data.dp,
            jatuhTempo: dpDueDate,
            status: "BELUM_BAYAR",
          },
        });
      }

      return penjualan;
    });
  }

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: PenjualanFilterDTO,
  ): Promise<CursorPaginatedData<any>> {
    const where: Prisma.PenjualanWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { noTransaksi: { contains: filters.search } },
        { customer: { nama: { contains: filters.search } } },
      ];
    }

    const items = await this.db.penjualan.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        customer: true,
        kavling: { include: { perumahan: true } },
        agent: true,
      },
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    const mappedItems = items.map((item) => ({
      id: item.noTransaksi,
      tanggal: item.tanggal.toISOString(),
      nama: item.customer.nama,
      alamat: item.customer.alamatKtp,
      noTelepon: item.customer.noHp,
      noIdentitas: item.customer.nikKtp,
      perusahaan: item.customer.perusahaan ?? "",
      alamatKoresponden: item.customer.alamatKoresponden ?? "",
      perumahan: item.kavling.perumahan.nama,
      blok: item.kavling.blok,
      tipe: item.kavling.namaTipe,
      luasBangunan: Number(item.kavling.luasBangunan),
      luasTanah: Number(item.kavling.luasTanah),
      nomorUnit: item.kavling.nomorUnit,
      hargaJual: Number(item.hargaJual),
      dp: Number(item.dp ?? 0),
      diskonPenjualan: Number(item.diskonPenjualan ?? 0),
      hargaPromosi: Number(item.hargaPromosi ?? 0),
      bank: item.bank ?? "",
      caraPembayaran: item.caraPembayaran,
      nilaiPengajuanKpr: Number(item.nilaiPengajuanKpr ?? 0),
      bookingFee: Number(item.bookingFee ?? 0),
      status: item.status,
      agent: item.agent?.nama ?? "",
      fileBuktiBooking: item.fileBuktiBooking ?? "",
      fileBuktiDp: item.fileBuktiDp ?? "",
    }));

    return {
      items: mappedItems,
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
      },
    };
  }
}
