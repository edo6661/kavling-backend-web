import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { PerusahaanAgentUseCases } from "../../application/usecases/perusahaanAgent/PerusahaanAgentUseCases.js";

export class PerusahaanAgentController {
  constructor(private readonly useCases: PerusahaanAgentUseCases) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const result = await this.useCases.create(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Perusahaan Agent berhasil ditambahkan",
      result,
    );
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit) || 100;
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    const search = req.query.search as string | undefined;

    const result = await this.useCases.getAll(limit, cursor, search);
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar Perusahaan Agent berhasil diambil",
      result,
    );
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    const result = await this.useCases.update(id, req.body);
    sendResponse(
      res,
      StatusCodes.OK,
      "Perusahaan Agent berhasil diperbarui",
      result,
    );
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    await this.useCases.delete(id);
    sendResponse(res, StatusCodes.OK, "Perusahaan Agent berhasil dihapus");
  };

  uploadAkte = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    if (!req.file?.buffer) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File Akte wajib diunggah");
      return;
    }
    const result = await this.useCases.uploadAkte(id, req.file.buffer);
    sendResponse(
      res,
      StatusCodes.OK,
      "Akte Perusahaan berhasil diunggah",
      result,
    );
  };
}
