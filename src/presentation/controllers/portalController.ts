import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { GetCustomerTrackRecordUseCase } from "../../application/usecases/portal/GetCustomerTrackRecordUseCase.js";

export class PortalController {
  constructor(
    private readonly getCustomerTrackRecordUseCase: GetCustomerTrackRecordUseCase,
  ) {}

  getTrackRecord = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      sendResponse(res, StatusCodes.UNAUTHORIZED, "User tidak terautentikasi");
      return;
    }

    const result = await this.getCustomerTrackRecordUseCase.execute(userId);
    sendResponse(res, StatusCodes.OK, "Track record berhasil diambil", result);
  };
}
