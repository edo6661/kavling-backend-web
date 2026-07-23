import { Prisma, Role, SpkJenis, SpkTerminScheme, ApprovalStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { ISpkRepository } from "./ISpkRepo.js";
import type { CreateSpkDTO, SpkFilterDTO, UpdateSpkDTO } from "../dtos/SpkDTO.js";
import type { SpkEntity } from "../entities/Spk.js";
import type { CursorPaginatedData, OffsetPaginatedData } from "../../types/response.js";
import type { SpkListSummary } from "../dtos/SpkDTO.js";
import { SpkMapper } from "../../infrastructure/mapper/SpkMapper.js";
import { ProgressProyekMapper } from "../../infrastructure/mapper/ProgressProyekMapper.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { AppError } from "../errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import {
  defaultTerminSchemeForJenis,
  validateTerminSchemeForJenis,
  type SpkTerminSchemeKey,
} from "../spk/spkTerminScheme.js";
import { findBlockedKavlingTransferSource } from "../spk/spkKavlingTransfer.js";

export class SpkRepository implements ISpkRepository {
  constructor(private readonly db: PrismaClient) {}

  private async withComputedProgress(entity: SpkEntity): Promise<SpkEntity> {
    const override = entity.progressOverride;
    if (override != null) {
      return {
        ...entity,
        progress: Math.min(100, Math.max(0, override)),
        progressIsOverride: true,
      };
    }

    if (entity.jenis === SpkJenis.INFRASTRUKTUR) {
      const progressRow = await this.db.progressProyek.findUnique({
        where: { spkId: entity.id },
        include: ProgressProyekMapper.include,
      });

      if (progressRow) {
        const itemCount =
          entity.pekerjaanInfraItems.length > 0
            ? entity.pekerjaanInfraItems.length
            : await this.db.spkPekerjaanInfra.count({
                where: { spkId: entity.id },
              });
        const mapped = ProgressProyekMapper.toDomain(progressRow, {
          pekerjaanItemCount: itemCount,
          isInfra: true,
        });
        return {
          ...entity,
          progress: mapped.persentase,
          progressIsOverride: mapped.persentaseIsOverride,
        };
      }
    }

    return {
      ...entity,
      progress: 0,
      progressIsOverride: false,
    };
  }

  async findKavlingIdsAssignedToOtherSpk(
    kavlingIds: number[],
    excludeSpkId?: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number[]> {
    if (kavlingIds.length === 0) return [];

    const db = tx ?? this.db;
    const rows = await db.spkPenjualan.findMany({
      where: {
        kavlingId: { in: kavlingIds },
        spk: { statusApproval: { not: ApprovalStatus.REJECTED } },
        ...(excludeSpkId ? { spkId: { not: excludeSpkId } } : {}),
      },
      select: { kavlingId: true },
    });

    return rows.map((r) => r.kavlingId);
  }

  private async validateKavlingIds(
    tx: Prisma.TransactionClient,
    kavlingIds: number[],
    excludeSpkId?: number,
    options?: { allowTransferFromOtherSpk?: boolean },
  ) {
    if (kavlingIds.length === 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Minimal satu kavling harus dipilih.",
      );
    }

    const uniqueIds = [...new Set(kavlingIds)];
    if (uniqueIds.length !== kavlingIds.length) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Terdapat kavling duplikat dalam daftar.",
      );
    }

    const kavlingList = await tx.kavling.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (kavlingList.length !== uniqueIds.length) {
      throw new NotFoundError("Salah satu kavling tidak ditemukan.");
    }

    const assignedElsewhere = await this.findKavlingIdsAssignedToOtherSpk(
      uniqueIds,
      excludeSpkId,
      tx,
    );
    if (assignedElsewhere.length > 0) {
      if (options?.allowTransferFromOtherSpk && excludeSpkId) {
        await this.transferKavlingsFromOtherSpks(tx, assignedElsewhere, excludeSpkId);
        return;
      }
      throw new ConflictError(
        "Salah satu kavling sudah terdaftar di SPK lain.",
      );
    }
  }

  private async transferKavlingsFromOtherSpks(
    tx: Prisma.TransactionClient,
    kavlingIds: number[],
    targetSpkId: number,
  ) {
    if (kavlingIds.length === 0) return;

    const assignments = await tx.spkPenjualan.findMany({
      where: {
        kavlingId: { in: kavlingIds },
        spkId: { not: targetSpkId },
        spk: { statusApproval: { not: ApprovalStatus.REJECTED } },
      },
      select: {
        kavlingId: true,
        spkId: true,
        spk: { select: { noSpk: true } },
      },
    });

    if (assignments.length === 0) return;

    const bySourceSpk = new Map<number, typeof assignments>();
    for (const assignment of assignments) {
      const list = bySourceSpk.get(assignment.spkId) ?? [];
      list.push(assignment);
      bySourceSpk.set(assignment.spkId, list);
    }

    const totalsBySpkId = new Map<number, number>();
    for (const sourceSpkId of bySourceSpk.keys()) {
      totalsBySpkId.set(
        sourceSpkId,
        await tx.spkPenjualan.count({ where: { spkId: sourceSpkId } }),
      );
    }

    const blocked = findBlockedKavlingTransferSource(
      Array.from(bySourceSpk.entries()).map(([spkId, items]) => ({
        spkId,
        noSpk: items[0]!.spk.noSpk,
        transferringKavlingIds: items.map((item) => item.kavlingId),
      })),
      totalsBySpkId,
    );
    if (blocked) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Tidak dapat memindahkan kavling: SPK ${blocked.noSpk} akan kehilangan semua kavling. Lepas kavling dari SPK tujuan terlebih dahulu, atau edit SPK sumber secara terpisah.`,
      );
    }

    const transferredIds = assignments.map((a) => a.kavlingId);
    await tx.spkPenjualan.deleteMany({
      where: {
        kavlingId: { in: transferredIds },
        spkId: { not: targetSpkId },
      },
    });
  }

  private async validateMandor(
    tx: Prisma.TransactionClient,
    mandorId: number,
  ) {
    const mandor = await tx.user.findFirst({
      where: { id: mandorId, role: Role.MANDOR },
    });
    if (!mandor) {
      throw new NotFoundError("Mandor tidak ditemukan.");
    }
  }

  private async syncMandorOnProgressForKavlings(
    tx: Prisma.TransactionClient,
    kavlingIds: number[],
    mandorId: number | null,
  ) {
    for (const kavlingId of kavlingIds) {
      const penjualan = await tx.penjualan.findFirst({
        where: { kavlingId, status: { not: "BATAL" } },
        orderBy: { id: "desc" },
        select: { id: true },
      });

      if (!penjualan) {
        await tx.progressProyek.upsert({
          where: { kavlingId },
          create: { kavlingId, mandorId },
          update: { mandorId },
        });
        continue;
      }

      await tx.progressProyek.upsert({
        where: { penjualanId: penjualan.id },
        create: { penjualanId: penjualan.id, mandorId },
        update: { mandorId },
      });
    }
  }

  private async validateZonaId(
    tx: Prisma.TransactionClient,
    zonaId: number,
  ) {
    const zona = await tx.zona.findUnique({
      where: { id: zonaId },
      select: { id: true },
    });
    if (!zona) {
      throw new NotFoundError("Zona tidak ditemukan.");
    }
  }

  private async validateZonaAvailableForInfraSpk(
    tx: Prisma.TransactionClient,
    zonaId: number,
    mandorId: number,
    excludeSpkId?: number,
  ) {
    await this.validateZonaId(tx, zonaId);

    const taken = await tx.spk.findFirst({
      where: {
        jenis: SpkJenis.INFRASTRUKTUR,
        zonaId,
        mandorId,
        statusApproval: { not: ApprovalStatus.REJECTED },
        ...(excludeSpkId ? { id: { not: excludeSpkId } } : {}),
      },
      select: { noSpk: true },
    });

    if (taken) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Zona ini sudah digunakan oleh SPK ${taken.noSpk} untuk mandor yang sama. Satu zona hanya boleh satu SPK infrastruktur per mandor.`,
      );
    }
  }

  private async validatePekerjaanInfraIds(
    tx: Prisma.TransactionClient,
    pekerjaanInfraIds: number[],
  ) {
    if (pekerjaanInfraIds.length === 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Minimal satu pekerjaan infrastruktur harus dipilih.",
      );
    }

    const uniqueIds = [...new Set(pekerjaanInfraIds)];
    if (uniqueIds.length !== pekerjaanInfraIds.length) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Terdapat pekerjaan infrastruktur duplikat dalam daftar.",
      );
    }

    const items = await tx.pekerjaanInfra.findMany({
      where: { id: { in: uniqueIds }, isActive: true },
      select: { id: true, urutan: true },
    });

    if (items.length !== uniqueIds.length) {
      throw new NotFoundError("Salah satu pekerjaan infrastruktur tidak ditemukan.");
    }
  }

  private buildPekerjaanInfraCreateData(pekerjaanInfraIds: number[]) {
    const uniqueIds = [...new Set(pekerjaanInfraIds)];
    return uniqueIds.map((pekerjaanInfraId, index) => ({
      pekerjaanInfraId,
      urutan: index + 1,
    }));
  }

  private resolveCreateTerminScheme(
    jenis: SpkJenis,
    requested?: SpkTerminSchemeKey,
  ): SpkTerminScheme {
    const scheme = requested ?? defaultTerminSchemeForJenis(jenis);
    try {
      validateTerminSchemeForJenis(jenis, scheme);
    } catch (err) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        err instanceof Error ? err.message : "Skema termin tidak valid.",
      );
    }
    return scheme as SpkTerminScheme;
  }

  private async assertTerminSchemeMutable(
    tx: Prisma.TransactionClient,
    spkId: number,
    existingScheme: SpkTerminSchemeKey,
    nextScheme: SpkTerminSchemeKey,
  ) {
    if (existingScheme === nextScheme) return;

    const pembayaranCount = await tx.spkPembayaran.count({ where: { spkId } });
    if (pembayaranCount > 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Skema termin tidak dapat diubah setelah ada pengajuan pembayaran.",
      );
    }
  }

  async create(data: CreateSpkDTO): Promise<SpkEntity> {
    const jenis = data.jenis ?? SpkJenis.RUMAH;

    return await this.db.$transaction(async (tx) => {
      await this.validateMandor(tx, data.mandorId);

      if (jenis === SpkJenis.RUMAH) {
        const kavlingIds = data.kavlingIds ?? [];
        await this.validateKavlingIds(tx, kavlingIds);

        const result = await tx.spk.create({
          data: {
            noSpk: data.noSpk,
            jenis: SpkJenis.RUMAH,
            terminScheme: this.resolveCreateTerminScheme(SpkJenis.RUMAH, data.terminScheme),
            tanggalSpk: data.tanggalSpk,
            judulPekerjaan: data.judulPekerjaan,
            nilaiKontrak: new Prisma.Decimal(data.nilaiKontrak),
            bankRekeningPtId: data.bankRekeningPtId ?? null,
            nilaiSudahDibayarkan: new Prisma.Decimal(0),
            sisaNilaiKontrak: new Prisma.Decimal(data.nilaiKontrak),
            notesPekerjaan: data.notesPekerjaan ?? null,
            jatuhTempo: data.jatuhTempo ?? null,
            fileSpk: data.fileSpk ?? null,
            fileRab: data.fileRab ?? null,
            mandorId: data.mandorId,
            statusApproval: ApprovalStatus.PENDING,
            diajukanOlehId: data.diajukanOlehId ?? null,
            penjualanItems: {
              create: kavlingIds.map((kavlingId) => ({ kavlingId })),
            },
          },
          include: SpkMapper.include,
        });

        await this.syncMandorOnProgressForKavlings(
          tx,
          kavlingIds,
          data.mandorId,
        );

        return await this.withComputedProgress(SpkMapper.toDomain(result));
      }

      const zonaId = data.zonaId;
      const pekerjaanInfraIds = data.pekerjaanInfraIds ?? [];
      if (!zonaId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Zona wajib dipilih.");
      }

      await this.validateZonaAvailableForInfraSpk(tx, zonaId, data.mandorId);
      await this.validatePekerjaanInfraIds(tx, pekerjaanInfraIds);

      const result = await tx.spk.create({
        data: {
          noSpk: data.noSpk,
          jenis: SpkJenis.INFRASTRUKTUR,
          terminScheme: this.resolveCreateTerminScheme(
            SpkJenis.INFRASTRUKTUR,
            data.terminScheme,
          ),
          tanggalSpk: data.tanggalSpk,
          judulPekerjaan: data.judulPekerjaan,
          nilaiKontrak: new Prisma.Decimal(data.nilaiKontrak),
          bankRekeningPtId: data.bankRekeningPtId ?? null,
          zonaId,
          nilaiSudahDibayarkan: new Prisma.Decimal(0),
          sisaNilaiKontrak: new Prisma.Decimal(data.nilaiKontrak),
          notesPekerjaan: data.notesPekerjaan ?? null,
          jatuhTempo: data.jatuhTempo ?? null,
          fileSpk: data.fileSpk ?? null,
          fileRab: data.fileRab ?? null,
          mandorId: data.mandorId,
          statusApproval: ApprovalStatus.PENDING,
          diajukanOlehId: data.diajukanOlehId ?? null,
          pekerjaanInfraItems: {
            create: this.buildPekerjaanInfraCreateData(pekerjaanInfraIds),
          },
        },
        include: SpkMapper.include,
      });

      await tx.progressProyek.create({
        data: {
          spkId: result.id,
          mandorId: data.mandorId,
          persentase: 0,
        },
      });

      return await this.withComputedProgress(SpkMapper.toDomain(result));
    });
  }

  async findById(id: number): Promise<SpkEntity | null> {
    const result = await this.db.spk.findUnique({
      where: { id },
      include: SpkMapper.include,
    });
    if (!result) return null;
    return await this.withComputedProgress(SpkMapper.toDomain(result));
  }

  async update(id: number, data: UpdateSpkDTO): Promise<SpkEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("SPK tidak ditemukan");

    return await this.db.$transaction(async (tx) => {
      const mandorId = data.mandorId ?? existing.mandorId;
      if (data.mandorId !== undefined) {
        await this.validateMandor(tx, mandorId);
      }

      if (data.terminScheme !== undefined) {
        validateTerminSchemeForJenis(existing.jenis, data.terminScheme);
        await this.assertTerminSchemeMutable(
          tx,
          id,
          existing.terminScheme,
          data.terminScheme,
        );
      }

      if (existing.jenis === SpkJenis.RUMAH) {
        if (data.zonaId !== undefined || data.pekerjaanInfraIds !== undefined) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "SPK rumah tidak dapat diubah menjadi infrastruktur.",
          );
        }

        let kavlingIds = existing.kavlingItems.map((p) => p.kavlingId);
        if (data.kavlingIds !== undefined) {
          await this.validateKavlingIds(tx, data.kavlingIds, id, {
            allowTransferFromOtherSpk: true,
          });
          kavlingIds = data.kavlingIds;

          const removedIds = existing.kavlingItems
            .map((p) => p.kavlingId)
            .filter((kid) => !kavlingIds.includes(kid));

          if (removedIds.length > 0) {
            await this.syncMandorOnProgressForKavlings(tx, removedIds, null);
          }

          await tx.spkPenjualan.deleteMany({ where: { spkId: id } });
          await tx.spkPenjualan.createMany({
            data: kavlingIds.map((kavlingId) => ({ spkId: id, kavlingId })),
          });
        }

        const updateData: Prisma.SpkUpdateInput = {};
        if (data.noSpk !== undefined) updateData.noSpk = data.noSpk;
        if (data.tanggalSpk !== undefined) updateData.tanggalSpk = data.tanggalSpk;
        if (data.judulPekerjaan !== undefined) {
          updateData.judulPekerjaan = data.judulPekerjaan;
        }
        if (data.nilaiKontrak !== undefined) {
          updateData.nilaiKontrak = new Prisma.Decimal(data.nilaiKontrak);
          if (data.sisaNilaiKontrak === undefined) {
            const paid =
              data.nilaiSudahDibayarkan !== undefined
                ? Number(data.nilaiSudahDibayarkan ?? 0)
                : Number(existing.nilaiSudahDibayarkan ?? 0);
            updateData.sisaNilaiKontrak = new Prisma.Decimal(
              Math.max(0, data.nilaiKontrak - paid),
            );
          }
        }
        if (data.bankRekeningPtId !== undefined) {
          updateData.bankRekeningPt =
            data.bankRekeningPtId == null
              ? { disconnect: true }
              : { connect: { id: data.bankRekeningPtId } };
        }
        if (data.nilaiSudahDibayarkan !== undefined) {
          updateData.nilaiSudahDibayarkan =
            data.nilaiSudahDibayarkan == null
              ? null
              : new Prisma.Decimal(data.nilaiSudahDibayarkan);
        }
        if (data.sisaNilaiKontrak !== undefined) {
          updateData.sisaNilaiKontrak =
            data.sisaNilaiKontrak == null
              ? null
              : new Prisma.Decimal(data.sisaNilaiKontrak);
        }
        if (data.progressOverride !== undefined) {
          updateData.progressOverride =
            data.progressOverride == null
              ? null
              : new Prisma.Decimal(data.progressOverride);
        }
        if (data.notesPekerjaan !== undefined) {
          updateData.notesPekerjaan = data.notesPekerjaan;
        }
        if (data.jatuhTempo !== undefined) updateData.jatuhTempo = data.jatuhTempo;
        if (data.fileSpk !== undefined) updateData.fileSpk = data.fileSpk;
        if (data.fileRab !== undefined) updateData.fileRab = data.fileRab;
        if (data.mandorId !== undefined) {
          updateData.mandor = { connect: { id: mandorId } };
        }
        if (data.terminScheme !== undefined) {
          updateData.terminScheme = data.terminScheme;
        }

        const result = await tx.spk.update({
          where: { id },
          data: updateData,
          include: SpkMapper.include,
        });

        await this.syncMandorOnProgressForKavlings(tx, kavlingIds, mandorId);

        return await this.withComputedProgress(SpkMapper.toDomain(result));
      }

      if (data.kavlingIds !== undefined) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "SPK infrastruktur tidak memiliki kavling.",
        );
      }

      const finalZonaId = data.zonaId ?? existing.zonaId;
      if (
        finalZonaId &&
        (data.zonaId !== undefined || data.mandorId !== undefined)
      ) {
        await this.validateZonaAvailableForInfraSpk(
          tx,
          finalZonaId,
          mandorId,
          id,
        );
      }

      if (data.pekerjaanInfraIds !== undefined) {
        await this.validatePekerjaanInfraIds(tx, data.pekerjaanInfraIds);
        await tx.spkPekerjaanInfra.deleteMany({ where: { spkId: id } });
        await tx.spkPekerjaanInfra.createMany({
          data: this.buildPekerjaanInfraCreateData(data.pekerjaanInfraIds).map(
            (item) => ({ spkId: id, ...item }),
          ),
        });
      }

      const updateData: Prisma.SpkUpdateInput = {};
      if (data.noSpk !== undefined) updateData.noSpk = data.noSpk;
      if (data.tanggalSpk !== undefined) updateData.tanggalSpk = data.tanggalSpk;
      if (data.judulPekerjaan !== undefined) {
        updateData.judulPekerjaan = data.judulPekerjaan;
      }
      if (data.nilaiKontrak !== undefined) {
        updateData.nilaiKontrak = new Prisma.Decimal(data.nilaiKontrak);
        if (data.sisaNilaiKontrak === undefined) {
          const paid =
            data.nilaiSudahDibayarkan !== undefined
              ? Number(data.nilaiSudahDibayarkan ?? 0)
              : Number(existing.nilaiSudahDibayarkan ?? 0);
          updateData.sisaNilaiKontrak = new Prisma.Decimal(
            Math.max(0, data.nilaiKontrak - paid),
          );
        }
      }
      if (data.bankRekeningPtId !== undefined) {
        updateData.bankRekeningPt =
          data.bankRekeningPtId == null
            ? { disconnect: true }
            : { connect: { id: data.bankRekeningPtId } };
      }
      if (data.zonaId !== undefined && data.zonaId !== null) {
        updateData.zona = { connect: { id: data.zonaId } };
      }
      if (data.nilaiSudahDibayarkan !== undefined) {
        updateData.nilaiSudahDibayarkan =
          data.nilaiSudahDibayarkan == null
            ? null
            : new Prisma.Decimal(data.nilaiSudahDibayarkan);
      }
      if (data.sisaNilaiKontrak !== undefined) {
        updateData.sisaNilaiKontrak =
          data.sisaNilaiKontrak == null
            ? null
            : new Prisma.Decimal(data.sisaNilaiKontrak);
      }
      if (data.progressOverride !== undefined) {
        updateData.progressOverride =
          data.progressOverride == null
            ? null
            : new Prisma.Decimal(data.progressOverride);
      }
      if (data.notesPekerjaan !== undefined) {
        updateData.notesPekerjaan = data.notesPekerjaan;
      }
      if (data.jatuhTempo !== undefined) updateData.jatuhTempo = data.jatuhTempo;
      if (data.fileSpk !== undefined) updateData.fileSpk = data.fileSpk;
      if (data.fileRab !== undefined) updateData.fileRab = data.fileRab;
      if (data.mandorId !== undefined) {
        updateData.mandor = { connect: { id: mandorId } };
      }
      if (data.terminScheme !== undefined) {
        updateData.terminScheme = data.terminScheme;
      }

      const result = await tx.spk.update({
        where: { id },
        data: updateData,
        include: SpkMapper.include,
      });

      await tx.progressProyek.upsert({
        where: { spkId: id },
        create: { spkId: id, mandorId },
        update: { mandorId },
      });

      return await this.withComputedProgress(SpkMapper.toDomain(result));
    });
  }

  private buildWhere(filters?: SpkFilterDTO): Prisma.SpkWhereInput {
    const where: Prisma.SpkWhereInput = {};

    if (filters?.mandorId) {
      where.mandorId = filters.mandorId;
    }

    if (filters?.jenis) {
      where.jenis = filters.jenis;
    }

    if (filters?.statusApproval) {
      where.statusApproval = filters.statusApproval;
    }

    const search = filters?.search?.trim();
    if (search) {
      where.OR = [
        { noSpk: { contains: search } },
        { judulPekerjaan: { contains: search } },
        { mandor: { username: { contains: search } } },
        {
          penjualanItems: {
            some: {
              kavling: {
                OR: [
                  { blok: { contains: search } },
                  { nomorUnit: { contains: search } },
                ],
              },
            },
          },
        },
        {
          zona: {
            OR: [
              { nama: { contains: search } },
              { hgb: { contains: search } },
              { deskripsi: { contains: search } },
            ],
          },
        },
        {
          pekerjaanInfraItems: {
            some: {
              pekerjaanInfra: { nama: { contains: search } },
            },
          },
        },
      ];
    }

    return where;
  }

  private resolveOrderBy(
    orderBy?: SpkFilterDTO["orderBy"],
  ): Prisma.SpkOrderByWithRelationInput[] {
    if (orderBy === "mandor:asc") {
      return [{ mandor: { username: "asc" } }, { id: "desc" }];
    }
    if (orderBy === "mandor:desc") {
      return [{ mandor: { username: "desc" } }, { id: "desc" }];
    }
    return [{ id: "desc" }];
  }

  private async buildListSummary(
    where: Prisma.SpkWhereInput,
  ): Promise<SpkListSummary> {
    const [totalSpk, aggregates, totalKavling, progressSelesai] =
      await Promise.all([
        this.db.spk.count({ where }),
        this.db.spk.aggregate({
          where,
          _sum: {
            nilaiKontrak: true,
            nilaiSudahDibayarkan: true,
            sisaNilaiKontrak: true,
          },
        }),
        this.db.spkPenjualan.count({ where: { spk: where } }),
        this.db.spk.count({
          where: {
            AND: [where, { progressOverride: { gte: 100 } }],
          },
        }),
      ]);

    return {
      totalSpk,
      totalKavling,
      totalNilaiKontrak: Number(aggregates._sum.nilaiKontrak ?? 0),
      totalSudahDibayar: Number(aggregates._sum.nilaiSudahDibayarkan ?? 0),
      totalSisaNilai: Number(aggregates._sum.sisaNilaiKontrak ?? 0),
      progressSelesai,
    };
  }

  async findWithOffsetPagination(
    page: number,
    limit: number,
    filters?: SpkFilterDTO,
  ): Promise<OffsetPaginatedData<SpkEntity>> {
    const where = this.buildWhere(filters);
    const skip = (page - 1) * limit;

    const [totalItems, rows, summary] = await Promise.all([
      this.db.spk.count({ where }),
      this.db.spk.findMany({
        where,
        skip,
        take: limit,
        orderBy: this.resolveOrderBy(filters?.orderBy),
        include: SpkMapper.include,
      }),
      this.buildListSummary(where),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: await Promise.all(
        rows.map((item) => this.withComputedProgress(SpkMapper.toDomain(item))),
      ),
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

  async findWithCursorPagination(
    limit: number,
    cursor?: number,
    filters?: SpkFilterDTO,
  ): Promise<CursorPaginatedData<SpkEntity>> {
    const where = this.buildWhere(filters);

    const items = await this.db.spk.findMany({
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: [{ id: "desc" }],
      include: SpkMapper.include,
    });

    let hasNextPage = false;
    if (items.length > limit) {
      hasNextPage = true;
      items.pop();
    }

    return {
      items: await Promise.all(
        items.map((item) => this.withComputedProgress(SpkMapper.toDomain(item))),
      ),
      meta: {
        nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
        hasNextPage,
      },
    };
  }

  async delete(id: number): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("SPK tidak ditemukan");

    await this.db.$transaction(async (tx) => {
      if (existing.jenis === SpkJenis.RUMAH) {
        const kavlingIds = existing.kavlingItems.map((p) => p.kavlingId);
        if (kavlingIds.length > 0) {
          await this.syncMandorOnProgressForKavlings(tx, kavlingIds, null);
        }
      }
      await tx.spk.delete({ where: { id } });
    });
  }

  private async releaseSpkAssignments(
    tx: Prisma.TransactionClient,
    existing: SpkEntity,
  ) {
    if (existing.jenis === SpkJenis.RUMAH) {
      const kavlingIds = existing.kavlingItems.map((p) => p.kavlingId);
      if (kavlingIds.length > 0) {
        await this.syncMandorOnProgressForKavlings(tx, kavlingIds, null);
        await tx.spkPenjualan.deleteMany({ where: { spkId: existing.id } });
      }
    }
  }

  async approve(id: number, disetujuiOlehId: number): Promise<SpkEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("SPK tidak ditemukan");
    if (existing.statusApproval !== ApprovalStatus.PENDING) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "SPK tidak dalam status menunggu persetujuan.",
      );
    }

    const result = await this.db.spk.update({
      where: { id },
      data: {
        statusApproval: ApprovalStatus.APPROVED,
        disetujuiOlehId,
        tanggalDisetujui: new Date(),
        catatanPenolakan: null,
      },
      include: SpkMapper.include,
    });

    return await this.withComputedProgress(SpkMapper.toDomain(result));
  }

  async reject(
    id: number,
    disetujuiOlehId: number,
    catatanPenolakan?: string,
  ): Promise<SpkEntity> {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError("SPK tidak ditemukan");
    if (existing.statusApproval !== ApprovalStatus.PENDING) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "SPK tidak dalam status menunggu persetujuan.",
      );
    }

    return await this.db.$transaction(async (tx) => {
      await this.releaseSpkAssignments(tx, existing);

      const result = await tx.spk.update({
        where: { id },
        data: {
          statusApproval: ApprovalStatus.REJECTED,
          disetujuiOlehId,
          tanggalDisetujui: new Date(),
          catatanPenolakan: catatanPenolakan?.trim() || null,
        },
        include: SpkMapper.include,
      });

      return await this.withComputedProgress(SpkMapper.toDomain(result));
    });
  }
}
