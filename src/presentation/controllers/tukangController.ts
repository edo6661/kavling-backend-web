import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TukangRepository } from "../../domain/repositories/tukangRepo.js";
import type { UploadTukangKtpUseCase } from "../../application/usecases/tukang/UploadTukangKtpUseCase.js";
import type { ExportTukangsUseCase } from "../../application/usecases/tukang/ExportTukangsUseCase.js";
import { getTukangListSchema } from "../../validations/tukangSchema.js";
import type { TypedRequest } from "../../types/request.js";
import type { upsertTukangSchema } from "../../validations/tukangSchema.js";
import { AppError } from "../../domain/errors/AppError.js";

export class TukangController {
  constructor(
    private readonly tukangRepo: TukangRepository,
    private readonly uploadKtpUseCase: UploadTukangKtpUseCase,
    private readonly exportTukangsUseCase: ExportTukangsUseCase,
  ) {}

  private listContext(req: Request) {
    return {
      userId: req.user!.userId,
      role: req.user!.role,
    };
  }

  getList = async (req: Request, res: Response): Promise<void> => {
    const { search } = getTukangListSchema.query.parse(req.query);
    const result = await this.tukangRepo.findAll(
      search ? { search } : undefined,
      this.listContext(req),
    );
    sendResponse(res, StatusCodes.OK, "Daftar tukang berhasil diambil", result);
  };

  exportExcel = async (req: Request, res: Response): Promise<void> => {
    const { search } = getTukangListSchema.query.parse(req.query);
    const excelBuffer = await this.exportTukangsUseCase.execute(
      search ? { search } : undefined,
      this.listContext(req),
    );
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Data_Tukang_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(excelBuffer);
  };

  upsert = async (
    req: TypedRequest<typeof upsertTukangSchema.body>,
    res: Response,
  ): Promise<void> => {
    try {
      const result = await this.tukangRepo.upsertForUser(
        req.body,
        this.listContext(req),
      );
      sendResponse(res, StatusCodes.OK, "Data tukang berhasil disimpan", result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "TUKANG_NIK_OTHER_MANDOR") {
        throw new AppError(
          StatusCodes.CONFLICT,
          "NIK tukang sudah terdaftar untuk mandor lain.",
        );
      }
      if (msg === "TUKANG_NOT_FOUND") {
        throw new AppError(StatusCodes.NOT_FOUND, "Tukang tidak ditemukan");
      }
      if (msg === "TUKANG_NIK_DUPLICATE") {
        throw new AppError(StatusCodes.CONFLICT, "NIK tukang sudah terdaftar.");
      }
      if (msg === "NIK_INVALID") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "NIK harus tepat 16 digit angka",
        );
      }
      if (msg === "TUKANG_JUMLAH_ANAK_REQUIRED") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Jumlah anak wajib diisi jika sudah menikah.",
        );
      }
      if (msg === "TUKANG_JUMLAH_ANAK_INVALID") {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Jumlah anak harus antara 0 sampai 3.",
        );
      }
      throw err;
    }
  };

  uploadKtp = async (req: Request, res: Response): Promise<void> => {
    const nik = req.params.nik as string;
    if (!req.file?.buffer) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File foto KTP wajib diunggah");
    }

    try {
      const result = await this.uploadKtpUseCase.execute(
        nik,
        req.file.buffer,
        this.listContext(req),
      );
      sendResponse(res, StatusCodes.OK, "Foto KTP berhasil diunggah", result);
    } catch (err) {
      if (err instanceof AppError) throw err;
      const msg = err instanceof Error ? err.message : "";
      if (msg === "TUKANG_NIK_OTHER_MANDOR") {
        throw new AppError(
          StatusCodes.CONFLICT,
          "NIK tukang sudah terdaftar untuk mandor lain.",
        );
      }
      throw err;
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "ID tukang tidak valid");
    }
    try {
      await this.tukangRepo.deleteForUser(id, this.listContext(req));
      sendResponse(res, StatusCodes.OK, "Tukang berhasil dihapus");
    } catch (err) {
      if (err instanceof AppError) throw err;
      const msg = err instanceof Error ? err.message : "";
      if (msg === "TUKANG_NIK_OTHER_MANDOR") {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "Anda tidak berhak menghapus tukang milik mandor lain.",
        );
      }
      throw err;
    }
  };
}
