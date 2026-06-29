import type { ISpkRepository } from "../../../domain/repositories/ISpkRepo.js";
import type { SpkPembayaranRepository } from "../../../domain/repositories/spkPembayaranRepo.js";
import type {
  AddBuktiSpkPembayaranDTO,
  BayarSpkPembayaranDTO,
  CreateSpkPembayaranDTO,
  RemoveBuktiSpkPembayaranDTO,
  SetBsiCmsDilaporkanDTO,
  SpkPembayaranFilterDTO,
  SpkPembayaranKasbonBarisInput,
  UpdateSpkKasbonDTO,
  UpdateSpkUpahDTO,
} from "../../../domain/dtos/SpkPembayaranDTO.js";
import type { SpkPembayaranEntity } from "../../../domain/entities/SpkPembayaran.js";
import type { OffsetPaginatedData } from "../../../types/response.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { AppError } from "../../../domain/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import {
  canRequestKasbon,
  canRequestSpkPembayaran,
  getKasbonTargetTermin,
  getTerminPaymentStatus,
  toSpkPembayaranCalcRows,
  validatePengurangTerminNominal,
  type SpkPengurangTerminRow,
} from "../../../domain/spk/spkPembayaranCalc.js";
import { resolveSpkTerminScheme } from "../../../domain/spk/spkTerminScheme.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { NotificationService } from "../../../infrastructure/notifications/NotificationService.js";
import {
  buildSpkDibayarNotification,
  buildSpkDisetujuiNotification,
  buildSpkPengajuanBaruNotification,
} from "../../notifications/spkNotificationHelpers.js";
import { Role, SpkPembayaranStatus } from "@prisma/client";
import type { SpkEntity } from "../../../domain/entities/Spk.js";

const withOptionalMandorRekeningId = (mandorRekeningId?: number) =>
  mandorRekeningId !== undefined ? { mandorRekeningId } : {};

const assertSpkApproved = (spk: SpkEntity) => {
  if (spk.statusApproval !== "APPROVED") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "SPK belum disetujui. Pengajuan pembayaran tidak dapat dilakukan.",
    );
  }
};

async function notifySpkPengajuanBaru(
  notificationService: NotificationService | undefined,
  spk: SpkEntity,
  pembayaran: SpkPembayaranEntity,
): Promise<void> {
  if (!notificationService) return;
  try {
    await notificationService.notifyRoles(
      [Role.PENGAWAS, Role.ADMIN, Role.SUPERADMIN],
      buildSpkPengajuanBaruNotification(spk, pembayaran),
    );
  } catch (error) {
    console.error("Gagal mengirim notifikasi pengajuan SPK:", error);
  }
}

async function notifySpkDisetujui(
  notificationService: NotificationService | undefined,
  spk: SpkEntity,
  pembayaran: SpkPembayaranEntity,
): Promise<void> {
  if (!notificationService) return;
  try {
    await notificationService.notifyRoles(
      [Role.FINANCE, Role.ADMIN, Role.SUPERADMIN],
      buildSpkDisetujuiNotification(spk, pembayaran),
    );
  } catch (error) {
    console.error("Gagal mengirim notifikasi persetujuan SPK:", error);
  }
}

async function notifySpkDibayar(
  notificationService: NotificationService | undefined,
  spk: SpkEntity,
  pembayaran: SpkPembayaranEntity,
): Promise<void> {
  if (!notificationService) return;
  try {
    await notificationService.notifyUser(
      spk.mandorId,
      buildSpkDibayarNotification(spk, pembayaran),
    );
  } catch (error) {
    console.error("Gagal mengirim notifikasi pembayaran SPK:", error);
  }
}

const toPengurangRows = (list: SpkPembayaranEntity[]): SpkPengurangTerminRow[] =>
  list
    .filter((p) => p.status !== SpkPembayaranStatus.DRAFT)
    .map((p) => {
      const row: SpkPengurangTerminRow = {
        jenis: p.jenis,
        nominal: p.nominal,
        mengurangiTermin: p.mengurangiTermin ?? null,
      };
      row.id = p.id;
      return row;
    });

async function loadPenguranganForMutation(
  pembayaranRepo: SpkPembayaranRepository,
  spkRepo: ISpkRepository,
  recordId: number,
): Promise<{ record: SpkPembayaranEntity; spk: SpkEntity }> {
  const record = await pembayaranRepo.findById(recordId);
  if (!record) throw new NotFoundError("Pengajuan tidak ditemukan.");

  const spk = await spkRepo.findById(record.spkId);
  if (!spk) throw new NotFoundError("SPK tidak ditemukan");
  assertSpkApproved(spk);

  return { record, spk };
}

function assertMandorCanEditPengurangan(
  record: SpkPembayaranEntity,
  spk: SpkEntity,
  userId: number,
): void {
  if (spk.mandorId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Mandor hanya dapat mengubah pengajuan untuk SPK yang ditugaskan kepadanya.",
    );
  }
  if (
    record.status === SpkPembayaranStatus.SUDAH_DIBAYAR ||
    record.status === SpkPembayaranStatus.DRAFT
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Hanya pengajuan yang masih menunggu persetujuan atau pembayaran yang dapat diubah.",
    );
  }
}

function assertMandorCanDeletePengurangan(
  record: SpkPembayaranEntity,
  spk: SpkEntity,
  userId: number,
): void {
  if (spk.mandorId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Mandor hanya dapat menghapus pengajuan untuk SPK yang ditugaskan kepadanya.",
    );
  }
  if (record.status === SpkPembayaranStatus.DRAFT && record.diajukanOlehId !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Mandor hanya dapat menghapus draft miliknya sendiri.",
    );
  }
  if (
    record.status !== SpkPembayaranStatus.MENUNGGU_PEMBAYARAN &&
    record.status !== SpkPembayaranStatus.MENUNGGU_PERSETUJUAN &&
    record.status !== SpkPembayaranStatus.DRAFT
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Hanya pengajuan yang masih menunggu persetujuan, pembayaran, atau draft yang dapat dihapus.",
    );
  }
}

export class CreateSpkPembayaranRequestUseCase {
  constructor(
    private readonly spkRepo: ISpkRepository,
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly notificationService?: NotificationService,
  ) {}

  async execute(
    data: CreateSpkPembayaranDTO,
    userId: number,
    userRole: string,
  ): Promise<SpkPembayaranEntity> {
    const spk = await this.spkRepo.findById(data.spkId);
    if (!spk) throw new NotFoundError("SPK tidak ditemukan");
    assertSpkApproved(spk);

    if (userRole === Role.MANDOR && spk.mandorId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Mandor hanya dapat mengajukan pembayaran untuk SPK yang ditugaskan kepadanya.",
      );
    }

    const existing = await this.pembayaranRepo.findBySpkId(data.spkId);
    const nilaiKontrak = Number(spk.nilaiKontrak);
    const terminScheme = resolveSpkTerminScheme(spk);
    const statusRows = existing.map((p) => ({
      id: p.id,
      jenis: p.jenis,
      status: p.status,
      nominal: p.nominal,
      mengurangiTermin: p.mengurangiTermin,
    }));
    const pengurangRows = toPengurangRows(existing);
    const terminStatus = getTerminPaymentStatus(
      toSpkPembayaranCalcRows(statusRows),
      terminScheme,
    );

    if (data.jenis === "KASBON") {
      const kasbonCheck = canRequestKasbon(statusRows, nilaiKontrak, terminScheme);
      if (!kasbonCheck.allowed) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          kasbonCheck.reason ?? "Tidak dapat mengajukan kasbon.",
        );
      }
      if (!data.kasbonBaris?.length && (
        !data.keterangan?.trim() ||
        !data.nominal ||
        data.nominal <= 0 ||
        !data.tanggalPo
      )) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Keterangan, nominal, dan tanggal PO kasbon wajib diisi.",
        );
      }

      const additionalNominal = data.kasbonBaris?.length
        ? data.kasbonBaris.reduce((sum, b) => sum + b.nominal, 0)
        : (data.nominal ?? 0);
      const capCheck = validatePengurangTerminNominal(
        nilaiKontrak,
        pengurangRows,
        kasbonCheck.targetTermin,
        additionalNominal,
        undefined,
        terminStatus,
        terminScheme,
        spk.progress,
      );
      if (!capCheck.allowed) {
        throw new AppError(StatusCodes.BAD_REQUEST, capCheck.reason);
      }
    } else if (data.jenis === "UPAH") {
      const upahCheck = canRequestKasbon(statusRows, nilaiKontrak, terminScheme);
      if (!upahCheck.allowed) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          upahCheck.reason ?? "Tidak dapat mengajukan upah.",
        );
      }
      if (!data.baris.length) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Minimal satu baris tukang wajib diisi.",
        );
      }
      if (!data.nominal || data.nominal <= 0) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Total upah tukang wajib dan harus lebih dari 0.",
        );
      }
      if (data.tanggalDari > data.tanggalSampai) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Tanggal dari tidak boleh setelah tanggal sampai.",
        );
      }

      const additionalNominal = data.nominal;
      const capCheck = validatePengurangTerminNominal(
        nilaiKontrak,
        pengurangRows,
        upahCheck.targetTermin,
        additionalNominal,
        undefined,
        terminStatus,
        terminScheme,
        spk.progress,
      );
      if (!capCheck.allowed) {
        throw new AppError(StatusCodes.BAD_REQUEST, capCheck.reason);
      }
    } else {
      const check = canRequestSpkPembayaran(
        data.jenis,
        { nilaiKontrak, progress: spk.progress },
        statusRows,
        terminScheme,
      );

      if (!check.allowed) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          check.reason ?? "Tidak dapat mengajukan pembayaran.",
        );
      }
    }

    try {
      const created = await this.pembayaranRepo.createRequestWithSync(
        data.jenis === "KASBON"
          ? {
              spkId: data.spkId,
              jenis: "KASBON",
              diajukanOlehId: userId,
              ...withOptionalMandorRekeningId(data.mandorRekeningId),
              ...(data.kasbonBaris?.length
                ? { kasbonBaris: data.kasbonBaris }
                : {
                    keterangan: data.keterangan ?? "",
                    nominal: data.nominal ?? 0,
                    tanggalPo: data.tanggalPo ?? new Date(),
                  }),
            }
          : data.jenis === "UPAH"
            ? {
                spkId: data.spkId,
                jenis: "UPAH",
                tanggalDari: data.tanggalDari,
                tanggalSampai: data.tanggalSampai,
                baris: data.baris,
                nominal: data.nominal,
                diajukanOlehId: userId,
                ...withOptionalMandorRekeningId(data.mandorRekeningId),
              }
            : {
                spkId: data.spkId,
                jenis: data.jenis,
                diajukanOlehId: userId,
                ...withOptionalMandorRekeningId(data.mandorRekeningId),
              },
      );
      await notifySpkPengajuanBaru(this.notificationService, spk, created);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "PEMBAYARAN_JENIS_EXISTS") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Pengajuan termin ini sudah ada.",
        );
      }
      if (msg === "KASBON_NOT_ALLOWED" || msg === "UPAH_NOT_ALLOWED") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Kasbon/upah tidak dapat diajukan pada tahap pembayaran ini.",
        );
      }
      if (
        msg === "UPAH_BARIS_EMPTY" ||
        msg === "UPAH_BARIS_INVALID" ||
        msg === "UPAH_NOMINAL_INVALID"
      ) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Data tukang upah tidak valid.",
        );
      }
      if (
        msg === "KASBON_BARIS_EMPTY" ||
        msg === "KASBON_BARIS_INVALID" ||
        msg === "KASBON_NOMINAL_INVALID"
      ) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Data kasbon tidak valid.",
        );
      }
      if (msg === "MANDOR_REKENING_REQUIRED") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Pilih rekening tujuan transfer mandor.",
        );
      }
      if (msg === "MANDOR_REKENING_INVALID") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Rekening tujuan transfer tidak valid.",
        );
      }
      throw err;
    }
  }
}

export class GetSpkPembayaranBySpkUseCase {
  constructor(private readonly pembayaranRepo: SpkPembayaranRepository) {}

  async execute(spkId: number): Promise<SpkPembayaranEntity[]> {
    return await this.pembayaranRepo.findBySpkId(spkId);
  }
}

export class GetSpkKasbonDraftUseCase {
  constructor(
    private readonly spkRepo: ISpkRepository,
    private readonly pembayaranRepo: SpkPembayaranRepository,
  ) {}

  async execute(spkId: number, userId: number, userRole: string): Promise<SpkPembayaranEntity | null> {
    const spk = await this.spkRepo.findById(spkId);
    if (!spk) throw new NotFoundError("SPK tidak ditemukan");

    if (userRole === Role.MANDOR && spk.mandorId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Mandor hanya dapat melihat draft kasbon untuk SPK yang ditugaskan kepadanya.",
      );
    }

    return await this.pembayaranRepo.findKasbonDraft(spkId, userId);
  }
}

export class SaveSpkKasbonDraftUseCase {
  constructor(
    private readonly spkRepo: ISpkRepository,
    private readonly pembayaranRepo: SpkPembayaranRepository,
  ) {}

  async execute(
    spkId: number,
    kasbonBaris: SpkPembayaranKasbonBarisInput[],
    userId: number,
    userRole: string,
  ): Promise<SpkPembayaranEntity> {
    const spk = await this.spkRepo.findById(spkId);
    if (!spk) throw new NotFoundError("SPK tidak ditemukan");
    assertSpkApproved(spk);

    if (userRole === Role.MANDOR && spk.mandorId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Mandor hanya dapat menyimpan draft kasbon untuk SPK yang ditugaskan kepadanya.",
      );
    }

    try {
      return await this.pembayaranRepo.upsertKasbonDraft(spkId, userId, kasbonBaris);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "SPK_NOT_FOUND") throw new NotFoundError("SPK tidak ditemukan");
      if (msg === "KASBON_NOT_ALLOWED") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Kasbon/upah tidak dapat disimpan: kedua termin sudah dibayar.",
        );
      }
      if (msg === "KASBON_BARIS_EMPTY" || msg === "KASBON_BARIS_INVALID") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Data kasbon tidak valid.");
      }
      if (msg === "KASBON_NOMINAL_INVALID") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Total kasbon tidak valid.");
      }
      throw err;
    }
  }
}

export class SubmitSpkKasbonDraftUseCase {
  constructor(
    private readonly spkRepo: ISpkRepository,
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly notificationService?: NotificationService,
  ) {}

  async execute(
    spkId: number,
    userId: number,
    userRole: string,
    options: {
      mandorRekeningId?: number;
      dokumenInvoice: string;
      dokumenMaterial: string;
    },
  ): Promise<SpkPembayaranEntity> {
    const spk = await this.spkRepo.findById(spkId);
    if (!spk) throw new NotFoundError("SPK tidak ditemukan");
    assertSpkApproved(spk);

    if (userRole === Role.MANDOR && spk.mandorId !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Mandor hanya dapat mengajukan draft kasbon untuk SPK yang ditugaskan kepadanya.",
      );
    }

    try {
      const submitted = await this.pembayaranRepo.submitKasbonDraft(
        spkId,
        userId,
        options.mandorRekeningId,
        {
          dokumenInvoice: options.dokumenInvoice,
          dokumenMaterial: options.dokumenMaterial,
        },
        spk.progress,
      );
      await notifySpkPengajuanBaru(this.notificationService, spk, submitted);
      return submitted;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "SPK_NOT_FOUND") throw new NotFoundError("SPK tidak ditemukan");
      if (msg === "KASBON_DRAFT_NOT_FOUND") {
        throw new NotFoundError("Draft kasbon tidak ditemukan. Simpan draft dulu.");
      }
      if (msg === "KASBON_NOT_ALLOWED") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Kasbon/upah tidak dapat diajukan: kedua termin sudah dibayar.",
        );
      }
      if (msg === "KASBON_BARIS_EMPTY" || msg === "KASBON_BARIS_INVALID") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Data kasbon tidak valid.");
      }
      if (msg === "KASBON_NOMINAL_INVALID") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Total kasbon tidak valid.");
      }
      if (msg === "KASBON_OVER_CAP") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Total kasbon & upah melebihi plafon termin.",
        );
      }
      if (msg === "KASBON_DOKUMEN_REQUIRED") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Dokumen invoice dan material wajib diunggah.",
        );
      }
      if (msg === "MANDOR_REKENING_REQUIRED") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Pilih rekening tujuan transfer mandor.",
        );
      }
      if (msg === "MANDOR_REKENING_INVALID") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Rekening tujuan transfer tidak valid.",
        );
      }
      throw err;
    }
  }
}

export class GetSpkPembayaranPaginatedUseCase {
  constructor(private readonly pembayaranRepo: SpkPembayaranRepository) {}

  async execute(
    page: number,
    limit: number,
    filters?: SpkPembayaranFilterDTO,
  ): Promise<OffsetPaginatedData<SpkPembayaranEntity>> {
    return await this.pembayaranRepo.findPaginated(page, limit, filters);
  }
}

export class BayarSpkPembayaranUseCase {
  constructor(
    private readonly spkRepo: ISpkRepository,
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly cloudinary: CloudinaryService,
    private readonly notificationService?: NotificationService,
  ) {}

  async execute(
    id: number,
    dibayarOlehId: number,
    fileBuffers: Buffer[],
    tanggalPembayaran?: Date,
  ): Promise<SpkPembayaranEntity> {
    if (!fileBuffers.length || fileBuffers.some((buffer) => !buffer?.length)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Bukti pembayaran wajib diunggah");
    }

    const existing = await this.pembayaranRepo.findById(id);
    if (!existing) throw new NotFoundError("Pengajuan pembayaran SPK tidak ditemukan");

    if (existing.status === SpkPembayaranStatus.DRAFT) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Pengajuan masih draft dan belum diajukan oleh mandor.",
      );
    }
    if (existing.status === SpkPembayaranStatus.SUDAH_DIBAYAR) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Pembayaran ini sudah diproses.");
    }
    if (existing.status !== SpkPembayaranStatus.MENUNGGU_PEMBAYARAN) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        existing.status === SpkPembayaranStatus.MENUNGGU_PERSETUJUAN
          ? "Pengajuan masih menunggu persetujuan pengawas."
          : "Status pembayaran tidak valid untuk diproses.",
      );
    }

    const spk = await this.spkRepo.findById(existing.spkId);
    if (!spk) throw new NotFoundError("SPK tidak ditemukan");

    const buktiPembayaranList = await Promise.all(
      fileBuffers.map((fileBuffer) =>
        this.cloudinary.uploadFile(fileBuffer, "bumantara/spk-pembayaran"),
      ),
    );

    const payDto: BayarSpkPembayaranDTO = {
      id,
      dibayarOlehId,
      buktiPembayaran: buktiPembayaranList[0]!,
      buktiPembayaranList,
    };
    if (tanggalPembayaran) payDto.tanggalPembayaran = tanggalPembayaran;

    try {
      const paid = await this.pembayaranRepo.markAsPaidWithSync(payDto);
      await notifySpkDibayar(this.notificationService, spk, paid);
      return paid;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "IS_DRAFT") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Pengajuan masih draft dan belum diajukan oleh mandor.",
        );
      }
      if (msg === "ALREADY_PAID") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Pembayaran ini sudah diproses.");
      }
      throw err;
    }
  }
}

export class UpdateSpkKasbonUseCase {
  constructor(
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly spkRepo: ISpkRepository,
  ) {}

  async execute(
    data: UpdateSpkKasbonDTO,
    userId: number,
    userRole: string,
  ): Promise<SpkPembayaranEntity> {
    const { record, spk } = await loadPenguranganForMutation(
      this.pembayaranRepo,
      this.spkRepo,
      data.id,
    );

    if (userRole === Role.MANDOR) {
      assertMandorCanEditPengurangan(record, spk, userId);
    }

    const all = await this.pembayaranRepo.findBySpkId(record.spkId);
    const mengurangiTermin =
      record.mengurangiTermin ??
      getKasbonTargetTermin(
        toSpkPembayaranCalcRows(
          all.map((p) => ({
            jenis: p.jenis,
            status: p.status,
            nominal: p.nominal,
            mengurangiTermin: p.mengurangiTermin,
            keterangan: p.keterangan,
          })),
        ),
        { terminScheme: resolveSpkTerminScheme(spk) },
      );

    if (!mengurangiTermin) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Data kasbon tidak valid.");
    }

    let additionalNominal = 0;
    if ("kasbonBaris" in data) {
      if (!data.kasbonBaris.length) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Minimal satu baris kasbon wajib diisi.",
        );
      }
      additionalNominal = data.kasbonBaris.reduce((sum, b) => sum + b.nominal, 0);
    } else if (!data.keterangan.trim() || data.nominal <= 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Keterangan dan nominal kasbon wajib diisi.",
      );
    } else {
      additionalNominal = data.nominal;
    }

    const terminStatusKasbon = getTerminPaymentStatus(
      toSpkPembayaranCalcRows(
        all.map((p) => ({
          id: p.id,
          jenis: p.jenis,
          status: p.status,
          nominal: p.nominal,
          mengurangiTermin: p.mengurangiTermin,
        })),
      ),
      resolveSpkTerminScheme(spk),
    );
    const capCheck = validatePengurangTerminNominal(
      Number(spk.nilaiKontrak),
      toPengurangRows(all),
      mengurangiTermin,
      additionalNominal,
      data.id,
      terminStatusKasbon,
      resolveSpkTerminScheme(spk),
      spk.progress,
    );
    if (!capCheck.allowed) {
      throw new AppError(StatusCodes.BAD_REQUEST, capCheck.reason);
    }

    try {
      return await this.pembayaranRepo.updateKasbon(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "SPK_PEMBAYARAN_NOT_FOUND") {
        throw new NotFoundError("Kasbon tidak ditemukan.");
      }
      if (msg === "NOT_KASBON") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Hanya data kasbon yang dapat diubah.");
      }
      if (msg === "ALREADY_PAID") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Kasbon yang sudah dibayar tidak dapat diubah.",
        );
      }
      if (msg === "HAS_BUKTI") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Kasbon yang sudah memiliki bukti pembayaran tidak dapat diubah.",
        );
      }
      if (msg === "LEGACY_KASBON_EDIT") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Kasbon lama tidak dapat diubah ke format batch.",
        );
      }
      if (msg === "BATCH_KASBON_EDIT") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Gunakan form edit batch untuk kasbon multi-item.",
        );
      }
      if (
        msg === "KASBON_BARIS_EMPTY" ||
        msg === "KASBON_BARIS_INVALID" ||
        msg === "KASBON_NOMINAL_INVALID"
      ) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Data kasbon tidak valid.");
      }
      throw err;
    }
  }
}

export class UpdateSpkUpahUseCase {
  constructor(
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly spkRepo: ISpkRepository,
  ) {}

  async execute(
    data: UpdateSpkUpahDTO,
    userId: number,
    userRole: string,
  ): Promise<SpkPembayaranEntity> {
    if (!data.baris.length) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Minimal satu baris tukang wajib diisi.",
      );
    }
    if (data.tanggalDari > data.tanggalSampai) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Tanggal dari tidak boleh setelah tanggal sampai.",
      );
    }

    const { record, spk } = await loadPenguranganForMutation(
      this.pembayaranRepo,
      this.spkRepo,
      data.id,
    );

    if (userRole === Role.MANDOR) {
      assertMandorCanEditPengurangan(record, spk, userId);
    }

    const allUpah = await this.pembayaranRepo.findBySpkId(record.spkId);
    const mengurangiTerminUpah =
      record.mengurangiTermin ??
      getKasbonTargetTermin(
        toSpkPembayaranCalcRows(
          allUpah.map((p) => ({
            jenis: p.jenis,
            status: p.status,
            nominal: p.nominal,
            mengurangiTermin: p.mengurangiTermin,
            keterangan: p.keterangan,
          })),
        ),
        { terminScheme: resolveSpkTerminScheme(spk) },
      );

    if (!mengurangiTerminUpah) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Data upah tidak valid.");
    }

    if (!data.nominal || data.nominal <= 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Total upah tukang wajib dan harus lebih dari 0.",
      );
    }

    const terminStatusUpah = getTerminPaymentStatus(
      toSpkPembayaranCalcRows(
        allUpah.map((p) => ({
          id: p.id,
          jenis: p.jenis,
          status: p.status,
          nominal: p.nominal,
          mengurangiTermin: p.mengurangiTermin,
        })),
      ),
      resolveSpkTerminScheme(spk),
    );
    const capCheck = validatePengurangTerminNominal(
      Number(spk.nilaiKontrak),
      toPengurangRows(allUpah),
      mengurangiTerminUpah,
      data.nominal,
      data.id,
      terminStatusUpah,
      resolveSpkTerminScheme(spk),
      spk.progress,
    );
    if (!capCheck.allowed) {
      throw new AppError(StatusCodes.BAD_REQUEST, capCheck.reason);
    }

    try {
      return await this.pembayaranRepo.updateUpah(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "SPK_PEMBAYARAN_NOT_FOUND") {
        throw new NotFoundError("Pengajuan upah tidak ditemukan.");
      }
      if (msg === "NOT_UPAH") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Hanya data upah yang dapat diubah.");
      }
      if (msg === "ALREADY_PAID") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Upah yang sudah dibayar tidak dapat diubah.",
        );
      }
      if (msg === "HAS_BUKTI") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Upah yang sudah memiliki bukti pembayaran tidak dapat diubah.",
        );
      }
      if (
        msg === "UPAH_BARIS_EMPTY" ||
        msg === "UPAH_BARIS_INVALID" ||
        msg === "UPAH_NOMINAL_INVALID"
      ) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Data tukang upah tidak valid.",
        );
      }
      throw err;
    }
  }
}

export class DeleteSpkPenguranganUseCase {
  constructor(
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly spkRepo: ISpkRepository,
  ) {}

  async execute(id: number, userId: number, userRole: string): Promise<void> {
    const { record, spk } = await loadPenguranganForMutation(
      this.pembayaranRepo,
      this.spkRepo,
      id,
    );

    if (userRole === Role.MANDOR) {
      assertMandorCanDeletePengurangan(record, spk, userId);
    }

    try {
      await this.pembayaranRepo.deletePengurangan(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "SPK_PEMBAYARAN_NOT_FOUND") {
        throw new NotFoundError("Pengajuan tidak ditemukan.");
      }
      if (msg === "NOT_DELETABLE") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Hanya kasbon atau upah yang belum dibayar dapat dihapus.",
        );
      }
      if (msg === "ALREADY_PAID") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Pengajuan yang sudah dibayar tidak dapat dihapus.",
        );
      }
      if (msg === "HAS_BUKTI") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Pengajuan yang sudah memiliki bukti tidak dapat dihapus.",
        );
      }
      throw err;
    }
  }
}

export class AddBuktiSpkPembayaranUseCase {
  constructor(
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(id: number, fileBuffers: Buffer[]): Promise<SpkPembayaranEntity> {
    if (!fileBuffers.length || fileBuffers.some((buffer) => !buffer?.length)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File bukti pembayaran wajib diunggah");
    }

    const existing = await this.pembayaranRepo.findById(id);
    if (!existing) throw new NotFoundError("Pengajuan pembayaran SPK tidak ditemukan");
    if (existing.status !== "SUDAH_DIBAYAR") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Bukti tambahan hanya bisa ditambahkan setelah pembayaran diproses.",
      );
    }

    const uploadedUrls = await Promise.all(
      fileBuffers.map((fileBuffer) =>
        this.cloudinary.uploadFile(fileBuffer, "bumantara/spk-pembayaran"),
      ),
    );

    const addDto: AddBuktiSpkPembayaranDTO = {
      id,
      buktiPembayaranList: uploadedUrls,
    };

    return await this.pembayaranRepo.addBuktiPembayaran(addDto);
  }
}

export class RemoveBuktiSpkPembayaranUseCase {
  constructor(
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(id: number, buktiUrl: string): Promise<SpkPembayaranEntity> {
    const sanitizedUrl = buktiUrl.trim();
    if (!sanitizedUrl) {
      throw new AppError(StatusCodes.BAD_REQUEST, "URL bukti pembayaran wajib diisi.");
    }

    const existing = await this.pembayaranRepo.findById(id);
    if (!existing) throw new NotFoundError("Pengajuan pembayaran SPK tidak ditemukan");
    if (existing.status !== "SUDAH_DIBAYAR") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Bukti hanya bisa dihapus setelah pembayaran diproses.",
      );
    }

    try {
      const removeDto: RemoveBuktiSpkPembayaranDTO = {
        id,
        buktiUrl: sanitizedUrl,
      };
      const result = await this.pembayaranRepo.removeBuktiPembayaran(removeDto);
      await this.cloudinary.deleteImageByUrl(sanitizedUrl);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "BUKTI_NOT_FOUND") {
        throw new NotFoundError("Bukti pembayaran tidak ditemukan.");
      }
      if (msg === "MIN_ONE_BUKTI_REQUIRED") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Minimal harus tersisa 1 bukti pembayaran.",
        );
      }
      throw err;
    }
  }
}

export class UploadSpkPengajuanDokumenUseCase {
  constructor(private readonly cloudinary: CloudinaryService) {}

  async execute(fileBuffer: Buffer): Promise<{ dokumenUrl: string }> {
    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Dokumen pengajuan wajib diunggah.");
    }
    const dokumenUrl = await this.cloudinary.uploadFile(
      fileBuffer,
      "bumantara/spk-pengajuan-dokumen",
    );
    return { dokumenUrl };
  }
}

export class UploadKasbonFotoBonUseCase {
  constructor(private readonly cloudinary: CloudinaryService) {}

  async execute(fileBuffer: Buffer): Promise<{ fotoBon: string }> {
    if (!fileBuffer?.length) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Foto bon wajib diunggah.");
    }
    const fotoBon = await this.cloudinary.uploadFile(
      fileBuffer,
      "bumantara/spk-kasbon-bon",
    );
    return { fotoBon };
  }
}

export class SetBsiCmsDilaporkanUseCase {
  constructor(private readonly pembayaranRepo: SpkPembayaranRepository) {}

  async execute(data: SetBsiCmsDilaporkanDTO): Promise<SpkPembayaranEntity[]> {
    if (data.ids.length === 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Pilih minimal satu pembayaran.");
    }

    const uniqueIds = [...new Set(data.ids)];

    try {
      const results = await this.pembayaranRepo.setBsiCmsDilaporkan({
        ids: uniqueIds,
        dilaporkan: data.dilaporkan,
      });

      if (results.length !== uniqueIds.length) {
        throw new NotFoundError("Sebagian pembayaran SPK tidak ditemukan.");
      }

      return results;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "CONTAINS_DRAFT") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Pembayaran draft tidak dapat ditandai di BSI CMS.",
        );
      }
      throw err;
    }
  }
}

export class ApproveSpkPembayaranUseCase {
  constructor(
    private readonly pembayaranRepo: SpkPembayaranRepository,
    private readonly spkRepo: ISpkRepository,
    private readonly notificationService?: NotificationService,
  ) {}

  async execute(id: number, userId: number, userRole: string): Promise<SpkPembayaranEntity> {
    if (userRole !== Role.PENGAWAS && userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Hanya pengawas yang dapat menyetujui pengajuan pembayaran SPK.",
      );
    }

    try {
      const approved = await this.pembayaranRepo.approvePengajuan(id, userId);
      const spk = await this.spkRepo.findById(approved.spkId);
      if (spk) {
        await notifySpkDisetujui(this.notificationService, spk, approved);
      }
      return approved;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "SPK_PEMBAYARAN_NOT_FOUND") {
        throw new NotFoundError("Pengajuan pembayaran SPK tidak ditemukan.");
      }
      if (msg === "NOT_PENDING_APPROVAL") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Pengajuan tidak dalam status menunggu persetujuan.",
        );
      }
      throw err;
    }
  }
}
