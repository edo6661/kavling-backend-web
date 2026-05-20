import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  IPenjualanRepository,
  PenjualanPaginatedItem,
  PenjualanWithCompleteRelations,
  PenjualanWithRelations,
} from "./IPenjualanRepo.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import type {
  CreatePenjualanDTO,
  PenjualanFilterDTO,
} from "../dtos/PenjualanDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";

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
        progressProyek: true,
      },
    });
  }

  async createWithTransaction(
    data: CreatePenjualanDTO,
  ): Promise<PenjualanWithRelations> {
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
            hargaDasar: data.hargaDasar,
          },
        });
      } else {
        const existingKavling = await tx.kavling.findFirst({
          where: {
            perumahanId: perumahan.id,
            blok: data.blok,
            nomorUnit: data.nomorUnit,
          },
        });

        if (existingKavling) {
          throw new ConflictError(
            `Kavling Blok ${data.blok} Nomor ${data.nomorUnit} sudah terdaftar. Silakan pilih dari kavling yang tersedia.`,
          );
        }

        kavling = await tx.kavling.create({
          data: {
            perumahanId: perumahan.id,
            blok: data.blok,
            nomorUnit: data.nomorUnit,
            namaTipe: data.tipe,
            luasBangunan: data.luasBangunan,
            luasTanah: data.luasTanah,
            hargaDasar: data.hargaDasar,
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

      const hargaDasar = Number(data.hargaDasar);
      const diskon = Number(data.diskonPenjualan ?? 0);
      const bookingFee = Number(data.bookingFee ?? 0);

      let plafonAwal: number | null = null;
      let biayaKpr = 0;
      let plafonKredit = 0;
      let nilaiPengajuanKpr = 0;
      let dp = 0;
      let dpTidakDibayar = 0;
      const dpDibayar = data.dpDibayar ? Number(data.dpDibayar) : 0;
      let hargaJual: number | null = null;

      if (data.caraPembayaran) {
        plafonAwal = hargaDasar - diskon - bookingFee;

        if (
          data.caraPembayaran === "CASH_KERAS" ||
          data.caraPembayaran === "CASH_BERTAHAP"
        ) {
          hargaJual = hargaDasar - diskon;
          if (data.caraPembayaran === "CASH_BERTAHAP") {
            dp = data.dp ? Number(data.dp) : 0;
          }
        } else if (data.caraPembayaran === "KPR") {
          biayaKpr = data.biayaKpr ?? Math.round(plafonAwal * 0.06);
          plafonKredit = data.plafonKredit ?? plafonAwal + biayaKpr;

          nilaiPengajuanKpr = data.nilaiPengajuanKpr ?? plafonKredit;

          const baseHargaJual = plafonKredit / 0.9;
          hargaJual = data.hargaJual ?? baseHargaJual + diskon;

          dpTidakDibayar =
            data.dpTidakDibayar ??
            Math.round((hargaJual - diskon) * 0.1 - bookingFee);

          // Logika Penentu DP untuk Tagihan/SPR
          dp = dpDibayar > 0 ? dpDibayar : dpTidakDibayar;
        }
      }
      const penjualan = await tx.penjualan.create({
        data: {
          noTransaksi,
          tanggal: new Date(data.tanggal),
          customerId: customer.id,
          kavlingId: kavling.id,
          agentId: agent.id,

          caraPembayaran: (data.caraPembayaran || null) as any,
          hargaDasar: hargaDasar,
          plafonAwal: (plafonAwal ?? undefined) as any,
          hargaJual: (hargaJual ?? undefined) as any,

          biayaKpr: biayaKpr > 0 ? biayaKpr : null,
          plafonKredit: plafonKredit > 0 ? plafonKredit : null,
          nilaiPengajuanKpr: nilaiPengajuanKpr > 0 ? nilaiPengajuanKpr : null,
          dp: dp > 0 ? dp : null,
          dpTidakDibayar: dpTidakDibayar > 0 ? dpTidakDibayar : null,
          dpDibayar: dpDibayar > 0 ? dpDibayar : null,

          diskonPenjualan: diskon > 0 ? diskon : null,
          bookingFee: bookingFee > 0 ? bookingFee : null,
          hargaPromosi: data.hargaPromosi ?? null,
          bank: data.bank ?? null,
          status: "BOOKED",
          createdBy: data.createdBy ?? "Admin",
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

      if (bookingFee > 0) {
        await tx.tagihan.create({
          data: {
            noTagihan: `INV-BF-${noTransaksi}`,
            customerId: customer.id,
            penjualanId: penjualan.id,
            pembayaran: "Booking Fee",
            nominal: bookingFee,
            jatuhTempo: new Date(data.tanggal),
            status: "BELUM_BAYAR",
          },
        });
      }

      if (dp > 0) {
        const dpDueDate = new Date(data.tanggal);
        dpDueDate.setDate(dpDueDate.getDate() + 14);

        await tx.tagihan.create({
          data: {
            noTagihan: `INV-DP-${noTransaksi}`,
            customerId: customer.id,
            penjualanId: penjualan.id,
            pembayaran: "Down Payment (DP)",
            nominal: dp,
            jatuhTempo: dpDueDate,
            status: "BELUM_BAYAR",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          entityName: "Penjualan",
          entityId: noTransaksi,
          action: "CREATE",
          changes: {
            after: penjualan,
            input_raw: data,
          } as unknown as Prisma.InputJsonValue,
          userId: data.userId ?? null,
        },
      });

      return penjualan as PenjualanWithRelations;
    });
  }

  async findWithOffsetPagination(
    page: number,
    limit: number,
    filters?: PenjualanFilterDTO & { status?: string },
  ): Promise<OffsetPaginatedData<PenjualanPaginatedItem>> {
    const where: Prisma.PenjualanWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { noTransaksi: { contains: filters.search } },
        { customer: { nama: { contains: filters.search } } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status as any;
    }

    let orderByClause: Prisma.PenjualanOrderByWithRelationInput[] = [
      { createdAt: "desc" },
    ];

    if (filters?.orderBy) {
      const { field, direction } = filters.orderBy;
      if (field === "nama") {
        orderByClause = [{ customer: { nama: direction } }];
      } else {
        orderByClause = [{ [field]: direction }, { id: "desc" }];
      }
    }

    const skip = (page - 1) * limit;

    const [items, totalItems, summaryData] = await Promise.all([
      this.db.penjualan.findMany({
        take: limit,
        skip,
        where,
        orderBy: orderByClause,
        include: {
          customer: true,
          progressPenjualan: true,
          kavling: { include: { perumahan: true, rekeningTujuan: true } },
          agent: true,
          tagihan: true,
          pengajuanBatal: { where: { status: "PENDING" } },
          riwayatGantiKavling: {
            include: {
              kavlingLama: { include: { perumahan: true } },
              kavlingBaru: { include: { perumahan: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          riwayatSpr: { orderBy: { createdAt: "desc" } },
          progressProyek: true,
        },
      }),
      this.db.penjualan.count({ where }),
      this.db.penjualan.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    const summary = summaryData.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mappedItems: PenjualanPaginatedItem[] = items.map((item) => {
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
            !t.pembayaran.toLowerCase().includes("down") &&
            !t.pembayaran.toLowerCase().includes("uang muka"),
        ) || [];
      const cicilanTerbayar = daftarCicilan.filter(
        (t) => t.status === "LUNAS",
      ).length;
      const totalCicilan = daftarCicilan.length;
      const progressCicilan =
        totalCicilan > 0 ? `${cicilanTerbayar} / ${totalCicilan} Kali` : "-";

      let currentStatus = item.status;
      if (item.status === "BOOKED" && bfTagihan?.status === "LUNAS") {
        currentStatus = "PROSES";
      }
      const isPendingBatal =
        item.pengajuanBatal && item.pengajuanBatal.length > 0;

      return {
        id: item.noTransaksi,
        dbId: item.id,
        noTransaksi: item.noTransaksi,
        tanggal: item.tanggal.toISOString(),
        nama: item.customer.nama,
        alamat: item.customer.alamatKtp,
        noTelepon: item.customer.noHp,
        noIdentitas: item.customer.nikKtp,
        perusahaan: item.customer.perusahaan ?? "",
        alamatKoresponden: item.customer.alamatKoresponden ?? "",
        perumahan: item.kavling.perumahan.nama,
        termin: item.termin ?? null,
        keteranganAngsuran: item.keteranganAngsuran ?? null,
        blok: item.kavling.blok,
        tipe: item.kavling.namaTipe,
        luasBangunan: Number(item.kavling.luasBangunan),
        luasTanah: Number(item.kavling.luasTanah),
        nomorUnit: item.kavling.nomorUnit,
        kavlingId: item.kavling.id,
        filePbg: item.kavling.filePbg,
        fileSertifikatTanah: item.kavling.fileSertifikatTanah,
        fileNopPbb: item.kavling.fileNopPbb,

        plafonAwal: item.plafonAwal ? Number(item.plafonAwal) : null,
        plafonAcc: item.plafonAcc ? Number(item.plafonAcc) : null,
        plafonKredit: item.plafonKredit ? Number(item.plafonKredit) : null,
        dpTidakDibayar: item.dpTidakDibayar
          ? Number(item.dpTidakDibayar)
          : null,
        dpDibayar: item.dpDibayar ? Number(item.dpDibayar) : null,
        hargaJual: item.hargaJual ? Number(item.hargaJual) : null,
        caraPembayaran: item.caraPembayaran
          ? item.caraPembayaran.replace(/_/g, " ")
          : null,

        hargaDasar: Number(item.hargaDasar),
        biayaKpr: Number(item.biayaKpr ?? 0),
        dp: Number(item.dp ?? 0),
        diskonPenjualan: Number(item.diskonPenjualan ?? 0),
        hargaPromosi: Number(item.hargaPromosi ?? 0),
        bank: item.bank ?? "",
        nilaiPengajuanKpr: Number(item.nilaiPengajuanKpr ?? 0),
        bookingFee: Number(item.bookingFee ?? 0),
        status: currentStatus,
        agent: item.agent?.nama ?? "",
        alasanBatal: item.alasanBatal ?? null,
        fileBuktiBooking: item.fileBuktiBooking ?? bfTagihan?.fileBukti ?? "",
        fileBuktiDp: item.fileBuktiDp ?? dpTagihan?.fileBukti ?? "",
        fileSpr: item.fileSpr ?? null,
        ttdData: item.ttdData ?? null,
        tambahanKpr: item.tambahanKpr ?? null,
        progressCicilan,
        rekeningTujuanId: item.kavling.rekeningTujuanId ?? null,
        rekeningTujuan: item.kavling.rekeningTujuan
          ? {
              namaBank: item.kavling.rekeningTujuan.namaBank,
              noRekening: item.kavling.rekeningTujuan.noRekening,
              atasNama: item.kavling.rekeningTujuan.atasNama,
            }
          : null,
        riwayatGantiKavling: item.riwayatGantiKavling || [],
        tagihan: item.tagihan || [],
        riwayatSpr: item.riwayatSpr || [],
        progressPenjualan: item.progressPenjualan ?? null,
        progressProyek: item.progressProyek
          ? {
              persentase: Number(item.progressProyek.persentase),
              pelaksana: item.progressProyek.pelaksana,
            }
          : null,
        createdBy: item.createdBy ?? "Admin",
        isPendingBatal,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    return {
      items: mappedItems,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        summary,
      },
    };
  }

  async findById(id: number) {
    return await this.db.penjualan.findUnique({
      where: { id },
      include: {
        progressPenjualan: true,
        progressProyek: true,
        customer: true,
        kavling: { include: { perumahan: true, rekeningTujuan: true } },
        rekeningTujuan: true,
        tagihan: { orderBy: { jatuhTempo: "asc" } },
        agent: true,
      },
    });
  }
}
