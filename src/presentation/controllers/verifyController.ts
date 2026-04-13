import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { VerifyDocumentUseCase } from "../../application/usecases/verify/VerifyDocumentUseCase.js";
import { z } from "zod";
import type { TypedRequest } from "../../types/request.js";
export const verifySchema = {
  params: z.object({
    id: z.string().min(1, "ID Dokumen wajib diisi"),
  }),
};

export class VerifyController {
  constructor(private readonly verifyDocumentUseCase: VerifyDocumentUseCase) {}

  verify = async (
    req: TypedRequest<any, any, typeof verifySchema.params>,
    res: Response,
  ): Promise<void> => {
    const documentNumber = req.params.id;

    const result = await this.verifyDocumentUseCase.execute(documentNumber);

    sendResponse(
      res,
      StatusCodes.OK,
      "Data dokumen berhasil diverifikasi",
      result,
    );
  };
}
