import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  IPenjualanRepository,
  PenjualanPaginatedItem,
  PenjualanWithCompleteRelations,
  PenjualanWithRelations,
} from "./IPenjualanRepo.js";
import { penjualanKavlingWithSpkInclude } from "./IPenjualanRepo.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import type {
  CreatePenjualanDTO,
  PenjualanFilterDTO,
} from "../dtos/PenjualanDTO.js";
import type { OffsetPaginatedData } from "../../types/response.js";
import { syncBankKprPembayaranForPenjualan } from "../kpr/bankKprPembayaranSync.js";
import {
  effectiveTagihanTujuan,
  isCicilanHargaJualTagihan,
} from "../tagihan/tagihanTujuan.js";
import { ProgressPenjualanMapper } from "../../infrastructure/mapper/ProgressPenjualanMapper.js";
import {
  formatCustomerNikForDisplay,
  resolveCustomerNik,
} from "../customer/customerNik.js";

type ProgressProyekSummary = NonNullable<
  PenjualanPaginatedItem["progressProyek"]
>;

type KavlingWithSpkRelation = {
  spkItem?: {
    spk: {
      mandorId: number;
      mandor: { id: number; username: string };
    };
  } | null;
};

const penjualanCompleteInclude = {
  customer: true,
  kavling: { include: penjualanKavlingWithSpkInclude },
  rekeningTujuan: true,
  tagihan: true,
  agent: true,
  progressProyek: {
    include: { mandor: { select: { id: true, username: true } } },
  },
} as const;

type PenjualanListRow = Prisma.PenjualanGetPayload<{
  include: {
    customer: true;
    progressPenjualan: {
      include: {
        sertifikatTambahan: { orderBy: { urutan: "asc" } };
      };
    };
    kavling: {
      include: typeof penjualanKavlingWithSpkInclude;
    };
    agent: true;
    tagihan: true;
    pengajuanBatal: { where: { status: "PENDING" } };
    riwayatGantiKavling: {
      include: {
        kavlingLama: { include: { perumahan: true } };
        kavlingBaru: { include: { perumahan: true } };
      };
      orderBy: { createdAt: "desc" };
    };
    riwayatSpr: { orderBy: { createdAt: "desc" } };
    progressProyek: {
      include: { mandor: { select: { id: true; username: true } } };
    };
  };
}>;

const resolveProgressProyekSummary = (
  item: PenjualanListRow,
): ProgressProyekSummary | null => {
  if (item.progressProyek) {
    return {
      persentase: Number(item.progressProyek.persentase),
      mandorId: item.progressProyek.mandorId,
      mandor: item.progressProyek.mandor,
    };
  }

  const spk = (item.kavling as KavlingWithSpkRelation).spkItem?.spk;
  if (!spk) return null;

  return {
    persentase: 0,
    mandorId: spk.mandorId,
    mandor: spk.mandor,
  };
};

export class PenjualanRepository implements IPenjualanRepository {
  constructor(private readonly db: PrismaClient) {}

  async update(
    id: number,
    data: Partial<Prisma.PenjualanUpdateInput>,
  ): Promise<PenjualanWithCompleteRelations> {
    const result = await this.db.penjualan.update({
      where: { id },
      data,
      include: penjualanCompleteInclude as Prisma.PenjualanInclude,
    });
    return result as unknown as PenjualanWithCompleteRelations;
  }

  async createWithTransaction(
    data: CreatePenjualanDTO,
  ): Promise<PenjualanWithRelations> {
    return await this.db.$transaction(async (tx) => {
      const nikKtp = resolveCustomerNik(data.noIdentitas);

      let customer = await tx.customer.findUnique({
        where: { nikKtp },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            nikKtp,
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

          nilaiPengajuanKpr =
            data.nilaiPengajuanKpr ??
            plafonKredit - (dpDibayar > 0 ? dpDibayar : 0);

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
          bankKprNamaRekening: data.bankKprNamaRekening ?? null,
          bankKprAtasNamaRekening: data.bankKprAtasNamaRekening ?? null,
          bankKprNoRekening: data.bankKprNoRekening ?? null,
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

      const kavlingProgress = await tx.progressProyek.findUnique({
        where: { kavlingId: kavling.id },
      });
      if (kavlingProgress) {
        const penjualanProgress = await tx.progressProyek.findUnique({
          where: { penjualanId: penjualan.id },
        });
        if (!penjualanProgress || penjualanProgress.id === kavlingProgress.id) {
          await tx.progressProyek.update({
            where: { id: kavlingProgress.id },
            data: { penjualanId: penjualan.id, kavlingId: null },
          });
        }
      }

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
            tujuan: "BOOKING_FEE",
            nominal: bookingFee,
            jatuhTempo: new Date(data.tanggal),
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

      if (data.caraPembayaran === "KPR") {
        await syncBankKprPembayaranForPenjualan(tx, penjualan.id);
      }

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
        { kavling: { blok: { contains: filters.search } } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status as any;
    }

    if (filters?.excludeStatus) {
      where.status = { not: filters.excludeStatus as any };
    }

    if (filters?.agentId) {
      where.agentId = filters.agentId;
    }

    if (filters?.mandorUserId) {
      const mandorUserId = filters.mandorUserId;
      const mandorScope: Prisma.PenjualanWhereInput = {
        OR: [
          { progressProyek: { mandorId: mandorUserId } },
          {
            kavling: {
              spkItem: { spk: { mandorId: mandorUserId } },
            } as Prisma.KavlingWhereInput,
          },
        ],
      };
      where.AND = [...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []), mandorScope];
    }

    if (filters?.caraPembayaran) {
      where.caraPembayaran = filters.caraPembayaran;
    }

    const listInclude = {
      customer: true,
      progressPenjualan: {
        include: {
          sertifikatTambahan: { orderBy: { urutan: "asc" as const } },
        },
      },
      kavling: { include: penjualanKavlingWithSpkInclude },
      agent: true,
      tagihan: true,
      pengajuanBatal: { where: { status: "PENDING" as const } },
      riwayatGantiKavling: {
        include: {
          kavlingLama: { include: { perumahan: true } },
          kavlingBaru: { include: { perumahan: true } },
        },
        orderBy: { createdAt: "desc" as const },
      },
      riwayatSpr: { orderBy: { createdAt: "desc" as const } },
      progressProyek: {
        include: { mandor: { select: { id: true, username: true } } },
      },
    };

    const sortField = filters?.orderBy?.field;
    const sortByKavling =
      sortField === "nomorUnit" || sortField === "blokNomorUnit";

    let orderByClause: Prisma.PenjualanOrderByWithRelationInput[] = [
      { createdAt: "desc" },
    ];

    if (filters?.orderBy && !sortByKavling) {
      const { field, direction } = filters.orderBy;
      if (field === "nama") {
        orderByClause = [{ customer: { nama: direction } }];
      } else {
        orderByClause = [{ [field]: direction }, { id: "desc" }];
      }
    }

    const skip = (page - 1) * limit;

    const parseNomorUnit = (val: string) => {
      const n = Number.parseInt(String(val).trim(), 10);
      return Number.isFinite(n) ? n : 0;
    };

    let items: PenjualanListRow[];
    let totalItems: number;

    if (sortByKavling) {
      const direction = filters!.orderBy!.direction;

      const matching = await this.db.penjualan.findMany({
        where,
        select: {
          id: true,
          kavling: { select: { blok: true, nomorUnit: true } },
        },
      });

      matching.sort((a, b) => {
        if (sortField === "blokNomorUnit") {
          const blokCmp = a.kavling.blok.localeCompare(b.kavling.blok, "id", {
            numeric: true,
            sensitivity: "base",
          });
          if (blokCmp !== 0) {
            return direction === "asc" ? blokCmp : -blokCmp;
          }
        }
        const diff =
          parseNomorUnit(a.kavling.nomorUnit) -
          parseNomorUnit(b.kavling.nomorUnit);
        return direction === "asc" ? diff : -diff;
      });

      totalItems = matching.length;
      const pageIds = matching.slice(skip, skip + limit).map((r) => r.id);

      if (pageIds.length === 0) {
        items = [];
      } else {
        const unsorted = await this.db.penjualan.findMany({
          where: { id: { in: pageIds } },
          include: listInclude,
        });
        const orderMap = new Map(pageIds.map((id, i) => [id, i]));
        items = [...unsorted].sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
        );
      }
    } else {
      [items, totalItems] = await Promise.all([
        this.db.penjualan.findMany({
          take: limit,
          skip,
          where,
          orderBy: orderByClause,
          include: listInclude,
        }),
        this.db.penjualan.count({ where }),
      ]);
    }

    const summaryData = await this.db.penjualan.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const totalPages = Math.ceil(totalItems / limit) || 1;

    const summary = summaryData.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mappedItems: PenjualanPaginatedItem[] = items.map((item) => {
      const bfTagihan = item.tagihan?.find(
        (t) => effectiveTagihanTujuan(t) === "BOOKING_FEE",
      );
      const dpTagihan =
        item.tagihan?.find(
          (t) =>
            effectiveTagihanTujuan(t) === "DP" &&
            t.status === "BELUM_BAYAR",
        ) ??
        item.tagihan?.find((t) => effectiveTagihanTujuan(t) === "DP");
      const daftarCicilan =
        item.tagihan?.filter((t) => isCicilanHargaJualTagihan(t)) || [];
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
        noIdentitas: formatCustomerNikForDisplay(item.customer.nikKtp),
        perusahaan: item.customer.perusahaan ?? "",
        alamatKoresponden: item.customer.alamatKoresponden ?? "",
        perumahan: item.kavling.perumahan.nama,
        termin: item.termin ?? null,
        keteranganAngsuran: item.keteranganAngsuran ?? null,
        blok: item.kavling.blok,
        tipe: item.kavling.namaTipe ?? "",
        luasBangunan: Number(item.kavling.luasBangunan),
        luasTanah: Number(item.kavling.luasTanah),
        nomorUnit: item.kavling.nomorUnit,
        kavlingId: item.kavling.id,
        jumlahSertifikatTanah: item.kavling.jumlahSertifikatTanah ?? 1,
        sertifikatTanahTambahan: item.kavling.sertifikatTanahTambahan?.map(
          (row: {
            urutan: number;
            filePbg: string | null;
            fileSertifikatTanah: string | null;
            fileNopPbb: string | null;
            nopd: string | null;
          }) => ({
            urutan: row.urutan,
            filePbg: row.filePbg,
            fileSertifikatTanah: row.fileSertifikatTanah,
            fileNopPbb: row.fileNopPbb,
            nopd: row.nopd,
          }),
        ),
        filePbg: item.kavling.filePbg,
        fileSertifikatTanah: item.kavling.fileSertifikatTanah,
        fileNopPbb: item.kavling.fileNopPbb,
        nopd: item.kavling.nopd,

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
        bankKprNamaRekening: item.bankKprNamaRekening ?? "",
        bankKprAtasNamaRekening: item.bankKprAtasNamaRekening ?? "",
        bankKprNoRekening: item.bankKprNoRekening ?? "",
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
        progressPenjualan: item.progressPenjualan
          ? ProgressPenjualanMapper.toDomain(item.progressPenjualan)
          : null,
        progressProyek: resolveProgressProyekSummary(item),
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
        progressProyek: {
          include: { mandor: { select: { id: true, username: true } } },
        },
        customer: true,
        kavling: { include: penjualanKavlingWithSpkInclude },
        rekeningTujuan: true,
        tagihan: { orderBy: { jatuhTempo: "asc" } },
        agent: true,
      },
    });
  }
}
