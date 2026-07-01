import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { IProgressPenjualanRepository } from "./IProgressPenjualanRepo.js";
import type {
  CreateProgressPenjualanDTO,
  UpdateProgressPenjualanDTO,
  ProgressPenjualanResponseDTO,
  UpdateProgressSertifikatTambahanDTO,
} from "../dtos/ProgressPenjualanDTO.js";
import { ProgressPenjualanMapper } from "../../infrastructure/mapper/ProgressPenjualanMapper.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { AppError } from "../errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import { syncNotarisPembayaranForPenjualan } from "../notaris/notarisPembayaranSync.js";
import {
  calcPajakAllSlots,
  type NilaiAjbSlot,
} from "../progressPenjualan/progressPenjualanSertifikatUtils.js";

const progressInclude = {
  penjualan: { include: { detailKavlingPajak: true } },
  sertifikatTambahan: { orderBy: { urutan: "asc" as const } },
};

export class ProgressPenjualanRepository implements IProgressPenjualanRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(
    data: CreateProgressPenjualanDTO,
  ): Promise<ProgressPenjualanResponseDTO> {
    const existing = await this.findByPenjualanId(data.penjualanId);
    if (existing) {
      throw new ConflictError(
        "Progress Penjualan untuk transaksi ini sudah ada.",
      );
    }

    const result = await this.db.progressPenjualan.create({
      data: { penjualanId: data.penjualanId },
      include: progressInclude,
    });

    return ProgressPenjualanMapper.toDomain(result);
  }

  async findByPenjualanId(
    penjualanId: number,
  ): Promise<ProgressPenjualanResponseDTO | null> {
    const result = await this.db.progressPenjualan.findUnique({
      where: { penjualanId },
      include: progressInclude,
    });
    if (!result) return null;
    return ProgressPenjualanMapper.toDomain(result);
  }

  async getJumlahSertifikatTanah(penjualanId: number): Promise<number> {
    const penjualan = await this.db.penjualan.findUnique({
      where: { id: penjualanId },
      select: { kavling: { select: { jumlahSertifikatTanah: true } } },
    });
    if (!penjualan) {
      throw new NotFoundError("Penjualan tidak ditemukan.");
    }
    return penjualan.kavling.jumlahSertifikatTanah ?? 1;
  }

  private async assertValidSertifikatUrutan(
    penjualanId: number,
    urutan: number,
    requireTambahan = false,
  ): Promise<void> {
    const jumlah = await this.getJumlahSertifikatTanah(penjualanId);
    if (urutan < 1 || urutan > jumlah) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Urutan sertifikat ${urutan} tidak valid. Kavling ini memiliki ${jumlah} sertifikat tanah.`,
      );
    }
    if (requireTambahan && urutan < 2) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Urutan sertifikat tambahan harus dimulai dari 2.",
      );
    }
  }

  private async finalizeUpdate(
    penjualanId: number,
    data: UpdateProgressPenjualanDTO,
  ): Promise<ProgressPenjualanResponseDTO> {
    const updatedResult = await this.db.progressPenjualan.findUnique({
      where: { penjualanId },
      include: progressInclude,
    });
    await syncNotarisPembayaranForPenjualan(this.db, penjualanId);
    return ProgressPenjualanMapper.toDomain(updatedResult as any);
  }

  private async recalculateAllPajakFromNilaiAjb(
    penjualanId: number,
    db: PrismaClient | Prisma.TransactionClient = this.db,
  ): Promise<void> {
    const jumlah = await this.getJumlahSertifikatTanah(penjualanId);
    const progress = await db.progressPenjualan.findUnique({
      where: { penjualanId },
      include: { sertifikatTambahan: true },
    });
    if (!progress) return;

    const slots: NilaiAjbSlot[] = [];
    for (let urutan = 1; urutan <= jumlah; urutan++) {
      if (urutan === 1) {
        slots.push({
          urutan,
          nilaiAjb: progress.nilaiAjb ? Number(progress.nilaiAjb) : 0,
        });
        continue;
      }
      const row = progress.sertifikatTambahan.find((item) => item.urutan === urutan);
      slots.push({
        urutan,
        nilaiAjb: row?.nilaiAjb ? Number(row.nilaiAjb) : 0,
      });
    }

    const pajakMap = calcPajakAllSlots(slots);
    const utama = slots[0];
    const utamaPajak = pajakMap.get(1)!;

    await db.progressPenjualan.update({
      where: { penjualanId },
      data: {
        biayaPph: utama.nilaiAjb > 0 ? utamaPajak.biayaPph : null,
        biayaBphtb: utama.nilaiAjb > 0 ? utamaPajak.biayaBphtb : null,
      },
    });

    for (let urutan = 2; urutan <= jumlah; urutan++) {
      const existingRow = progress.sertifikatTambahan.find(
        (item) => item.urutan === urutan,
      );
      if (!existingRow) continue;

      const slot = slots.find((item) => item.urutan === urutan)!;
      const pajak = pajakMap.get(urutan)!;
      await db.progressPenjualanSertifikatTambahan.update({
        where: { penjualanId_urutan: { penjualanId, urutan } },
        data: {
          biayaPph: slot.nilaiAjb > 0 ? pajak.biayaPph : null,
          biayaBphtb: slot.nilaiAjb > 0 ? pajak.biayaBphtb : null,
        },
      });
    }
  }

  async update(
    penjualanId: number,
    data: UpdateProgressPenjualanDTO,
  ): Promise<ProgressPenjualanResponseDTO> {
    const existing = await this.findByPenjualanId(penjualanId);
    if (!existing) {
      throw new NotFoundError("Progress Penjualan tidak ditemukan.");
    }

    const urutan = data.sertifikatUrutan ?? 1;
    if (urutan >= 2) {
      const { sertifikatUrutan: _, ...tambahanData } = data;
      return await this.updateSertifikatTambahan(
        penjualanId,
        urutan,
        tambahanData,
      );
    }

    const updateData: Prisma.ProgressPenjualanUpdateInput = {};

    if (data.berkasCustomerValid !== undefined)
      updateData.berkasCustomerValid = data.berkasCustomerValid;
    if (data.fileSp3k !== undefined) updateData.fileSp3k = data.fileSp3k ?? null;
    if (data.fileSuratPernyataanAkadKredit !== undefined)
      updateData.fileSuratPernyataanAkadKredit =
        data.fileSuratPernyataanAkadKredit ?? null;
    if (data.fileSalinanAjb !== undefined)
      updateData.fileSalinanAjb = data.fileSalinanAjb ?? null;
    if (data.filePpjb !== undefined) updateData.filePpjb = data.filePpjb ?? null;

    if (data.nilaiAjb !== undefined) {
      updateData.nilaiAjb = data.nilaiAjb ?? null;
    }

    if (data.fileAjb !== undefined) updateData.fileAjb = data.fileAjb ?? null;
    if (data.nomorAjb !== undefined)
      updateData.nomorAjb = data.nomorAjb ?? null;
    if (data.tanggalAjb !== undefined)
      updateData.tanggalAjb = data.tanggalAjb
        ? new Date(data.tanggalAjb)
        : null;
    if (data.fileBast !== undefined) updateData.fileBast = data.fileBast ?? null;
    if (data.checklistBast !== undefined) {
      updateData.checklistBast =
        data.checklistBast === null
          ? Prisma.DbNull
          : (data.checklistBast as Prisma.InputJsonValue);
    }

    if (data.nilaiAjb !== undefined) {
      await this.db.$transaction(async (tx) => {
        await tx.progressPenjualan.update({
          where: { penjualanId },
          data: updateData,
        });
        await this.recalculateAllPajakFromNilaiAjb(penjualanId, tx);
      });
    } else {
      await this.db.progressPenjualan.update({
        where: { penjualanId },
        data: updateData,
      });
    }

    if (data.notarisId !== undefined || data.biayaNotaris !== undefined) {
      const pajakUpdateData: Prisma.DetailKavlingPajakUncheckedUpdateInput = {};

      if (data.notarisId !== undefined)
        pajakUpdateData.notarisId = data.notarisId;
      if (data.biayaNotaris !== undefined)
        pajakUpdateData.biayaNotaris = data.biayaNotaris;

      await this.db.detailKavlingPajak.upsert({
        where: { penjualanId },
        create: {
          penjualanId,
          notarisId: data.notarisId ?? null,
          biayaNotaris: data.biayaNotaris ?? null,
        },
        update: pajakUpdateData,
      });
    }

    return await this.finalizeUpdate(penjualanId, data);
  }

  async updateSertifikatTambahan(
    penjualanId: number,
    urutan: number,
    data: UpdateProgressSertifikatTambahanDTO,
  ): Promise<ProgressPenjualanResponseDTO> {
    await this.assertValidSertifikatUrutan(penjualanId, urutan, true);

    const existing = await this.findByPenjualanId(penjualanId);
    if (!existing) {
      throw new NotFoundError("Progress Penjualan tidak ditemukan.");
    }

    const updateData: Prisma.ProgressPenjualanSertifikatTambahanUncheckedUpdateInput =
      {};

    if (data.filePpjb !== undefined) updateData.filePpjb = data.filePpjb ?? null;
    if (data.fileAjb !== undefined) updateData.fileAjb = data.fileAjb ?? null;
    if (data.nomorAjb !== undefined)
      updateData.nomorAjb = data.nomorAjb ?? null;
    if (data.tanggalAjb !== undefined) {
      updateData.tanggalAjb = data.tanggalAjb
        ? new Date(data.tanggalAjb)
        : null;
    }

    if (data.nilaiAjb !== undefined) {
      updateData.nilaiAjb = data.nilaiAjb ?? null;
    }

    if (data.nilaiAjb !== undefined) {
      await this.db.$transaction(async (tx) => {
        await tx.progressPenjualanSertifikatTambahan.upsert({
          where: { penjualanId_urutan: { penjualanId, urutan } },
          create: {
            penjualanId,
            urutan,
            ...updateData,
          },
          update: updateData,
        });
        await this.recalculateAllPajakFromNilaiAjb(penjualanId, tx);
      });
    } else {
      await this.db.progressPenjualanSertifikatTambahan.upsert({
        where: { penjualanId_urutan: { penjualanId, urutan } },
        create: {
          penjualanId,
          urutan,
          ...updateData,
        },
        update: updateData,
      });
    }

    return await this.finalizeUpdate(penjualanId, {});
  }

  async findSertifikatTambahanFileUrl(
    penjualanId: number,
    urutan: number,
    docType: "filePpjb" | "fileAjb",
  ): Promise<string | null> {
    const row = await this.db.progressPenjualanSertifikatTambahan.findUnique({
      where: { penjualanId_urutan: { penjualanId, urutan } },
      select: { [docType]: true },
    });
    return row?.[docType] ?? null;
  }

  async uploadSertifikatTambahanDocument(
    penjualanId: number,
    urutan: number,
    docType: "filePpjb" | "fileAjb",
    fileUrl: string,
  ): Promise<ProgressPenjualanResponseDTO> {
    await this.assertValidSertifikatUrutan(penjualanId, urutan, true);

    const existing = await this.findByPenjualanId(penjualanId);
    if (!existing) {
      throw new NotFoundError("Progress Penjualan tidak ditemukan.");
    }

    await this.db.progressPenjualanSertifikatTambahan.upsert({
      where: { penjualanId_urutan: { penjualanId, urutan } },
      create: { penjualanId, urutan, [docType]: fileUrl },
      update: { [docType]: fileUrl },
    });

    return await this.finalizeUpdate(penjualanId, {});
  }
}
