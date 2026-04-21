import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { GetAuditLogsPaginatedUseCase } from "../../application/usecases/auditLog/GetAuditLogsPaginatedUseCase.js";
import { cursorPaginationQuerySchema } from "../../validations/paginationSchema.js";
import type { AuditLogFilterDTO } from "../../domain/dtos/AuditLogDTO.js";

export class AuditLogController {
  constructor(
    private readonly getPaginatedUseCase: GetAuditLogsPaginatedUseCase,
  ) {}

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { limit, cursor, ...filters } = cursorPaginationQuerySchema.parse(
      req.query,
    );
    const parsedCursor = cursor ? Number(cursor) : undefined;

    const result = await this.getPaginatedUseCase.execute(
      limit,
      parsedCursor,
      filters as AuditLogFilterDTO,
    );

    sendResponse(
      res,
      StatusCodes.OK,
      "Data audit log berhasil diambil",
      result,
    );
  };
}
