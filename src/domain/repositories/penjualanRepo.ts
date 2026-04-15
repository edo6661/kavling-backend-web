import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  IPenjualanRepository,
  PenjualanWithCompleteRelations,
} from "./IPenjualanRepo.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import type {
  CreatePenjualanDTO,
  PenjualanFilterDTO,
} from "../dtos/PenjualanDTO.js";
import type { CursorPaginatedData } from "../../types/response.js";

export class PenjualanRepository implements IPenjualanRepository {
  constructor(private readonly db: PrismaClient) {}
  async update(
    id: number,
    data: Partial<Prisma.PenjualanUpdateInput>,
  ): Promise<PenjualanWithCompleteRelations> {
    return await this.db.penjualan.update({
      where: { id },
      data,
      include: {
        customer: true,
        kavling: { include: { perumahan: true, rekeningTujuan: true } },

        rekeningTujuan: true,
        tagihan: true,
        agent: true,
      },
    });
  }

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

      const yearMonth = `${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, "0")}`;
      const prefix = `TRX-${yearMonth}-`;

      const lastPenjualan = await tx.penjualan.findFirst({
        where: {
          noTransaksi: { startsWith: prefix },
        },
        orderBy: {
          noTransaksi: "desc",
        },
      });

      let nextSequence = 1;
      if (lastPenjualan) {
        const lastSequence = parseInt(
          lastPenjualan.noTransaksi.split("-")[2] ?? "0",
          10,
        );
        nextSequence = lastSequence + 1;
      }

      const noTransaksi = `${prefix}${String(nextSequence).padStart(3, "0")}`;

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

      if (agent) {
        await tx.feeAgent.create({
          data: {
            agentId: agent.id,
            penjualanId: penjualan.id,
          },
        });
      }

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
        kavling: { include: { perumahan: true, rekeningTujuan: true } },
        agent: true,
        tagihan: true,
      },
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    const mappedItems = items.map((item) => {
      const bfTagihan = item.tagihan?.find((t) =>
        t.pembayaran.toLowerCase().includes("booking"),
      );
      const dpTagihan = item.tagihan?.find(
        (t) =>
          t.pembayaran.toLowerCase().includes("dp") ||
          t.pembayaran.toLowerCase().includes("down"),
      );

      const daftarCicilan =
        item.tagihan?.filter(
          (t) =>
            !t.pembayaran.toLowerCase().includes("booking") &&
            !t.pembayaran.toLowerCase().includes("dp") &&
            !t.pembayaran.toLowerCase().includes("down"),
        ) || [];

      const cicilanTerbayar = daftarCicilan.filter(
        (t) => t.status === "LUNAS",
      ).length;
      const totalCicilan = daftarCicilan.length;
      const progressCicilan =
        totalCicilan > 0
          ? `${cicilanTerbayar} / ${totalCicilan} Kali`
          : "Belum Ada Cicilan";
      let currentStatus = item.status;
      if (item.status === "BOOKED" && bfTagihan?.status === "LUNAS") {
        currentStatus = "PROSES";
      }

      return {
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
        status: currentStatus,
        agent: item.agent?.nama ?? "",
        alasanBatal: item.alasanBatal ?? null,
        fileBuktiBooking: item.fileBuktiBooking ?? bfTagihan?.fileBukti ?? "",
        fileBuktiDp: item.fileBuktiDp ?? dpTagihan?.fileBukti ?? "",
        fileSpr: item.fileSpr ?? null,
        ttdData: item.ttdData ?? null,
        progressCicilan,
        rekeningTujuanId: item.kavling.rekeningTujuanId ?? null,
        rekeningTujuan: item.kavling.rekeningTujuan
          ? {
              namaBank: item.kavling.rekeningTujuan.namaBank,
              noRekening: item.kavling.rekeningTujuan.noRekening,
              atasNama: item.kavling.rekeningTujuan.atasNama,
            }
          : null,
      };
    });

    return {
      items: mappedItems,
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
      },
    };
  }
  async findById(id: number) {
    return await this.db.penjualan.findUnique({
      where: { id },
      include: {
        customer: true,
        kavling: { include: { perumahan: true, rekeningTujuan: true } },
        rekeningTujuan: true,
        tagihan: { orderBy: { jatuhTempo: "asc" } },
        agent: true,
      },
    });
  }
}
