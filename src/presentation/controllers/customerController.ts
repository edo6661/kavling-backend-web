import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendResponse } from "../../utils/response.js";
import type { TypedRequest } from "../../types/request.js";

import type { CreateCustomerUseCase } from "../../application/usecases/customer/CreateCustomerUseCase.js";
import type { GetCustomerByIdUseCase } from "../../application/usecases/customer/GetCustomerByIdUseCase.js";
import type { GetCustomersPaginatedUseCase } from "../../application/usecases/customer/GetCustomersPaginatedUseCase.js";
import type { DeleteCustomerUseCase } from "../../application/usecases/customer/DeleteCustomerUseCase.js";
import type { UpdateCustomerUseCase } from "../../application/usecases/customer/UpdateCustomerUseCase.js";
import type { UploadCustomerDocumentUseCase } from "../../application/usecases/customer/UploadCustomerDocumentUseCase.js";
import type { GenerateCustomerAccountUseCase } from "../../application/usecases/customer/GenerateCustomerAccountUseCase.js";
import type { generateAccountSchema } from "../../validations/customerSchema.js";
import type {
  createCustomerSchema,
  updateCustomerSchema,
} from "../../validations/customerSchema.js";
import { getCustomersPaginatedSchema } from "../../validations/customerSchema.js";
import type { CustomerFilterDTO } from "../../domain/dtos/CustomerDTO.js";
import type { ExportCustomersUseCase } from "../../application/usecases/customer/ExportCustomersUseCase.js";
import type { ExportCustomersPdfUseCase } from "../../application/usecases/customer/ExportCustomersPdfUseCase.js";
import type { GetCustomerDashboardUseCase } from "../../application/usecases/customer/GetCustomerDashboardUseCase.js";
import { AppError } from "../../domain/errors/AppError.js";
import type { UploadBuktiTagihanUseCase } from "../../application/usecases/tagihan/UploadBuktiTagihanUseCase.js";

export class CustomerController {
  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
    private readonly getCustomersPaginatedUseCase: GetCustomersPaginatedUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
    private readonly uploadDocumentUseCase: UploadCustomerDocumentUseCase,
    private readonly generateAccountUseCase: GenerateCustomerAccountUseCase,
    private readonly exportCustomersUseCase: ExportCustomersUseCase,
    private readonly exportCustomersPdfUseCase: ExportCustomersPdfUseCase,
    private readonly getCustomerDashboardUseCase: GetCustomerDashboardUseCase,
    private readonly uploadBuktiTagihanUseCase: UploadBuktiTagihanUseCase,
  ) {}

  create = async (
    req: TypedRequest<typeof createCustomerSchema.body>,
    res: Response,
  ): Promise<void> => {
    const result = await this.createCustomerUseCase.execute(req.body);
    sendResponse(
      res,
      StatusCodes.CREATED,
      "Customer berhasil ditambahkan",
      result,
    );
  };

  update = async (
    req: TypedRequest<
      typeof updateCustomerSchema.body,
      any,
      typeof updateCustomerSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.updateCustomerUseCase.execute(id, req.body);
    sendResponse(res, StatusCodes.OK, "Customer berhasil diperbarui", result);
  };

  getById = async (
    req: TypedRequest<any, any, typeof updateCustomerSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await this.getCustomerByIdUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Data customer berhasil diambil", result);
  };

  getPaginated = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, ...filters } =
      getCustomersPaginatedSchema.query.parse(req.query);

    const result = await this.getCustomersPaginatedUseCase.execute(
      page,
      limit,
      filters as CustomerFilterDTO,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Daftar customer berhasil diambil",
      result,
    );
  };

  delete = async (
    req: TypedRequest<any, any, typeof updateCustomerSchema.params>,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await this.deleteCustomerUseCase.execute(id);
    sendResponse(res, StatusCodes.OK, "Customer berhasil dihapus");
  };

  uploadDocument = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    const docType = req.params.docType as string;
    const { namaDokumen, pdfPassword } = req.body;

    if (isNaN(id)) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "ID tidak valid");
      return;
    }

    if (!["fileKtp", "fileKk", "fileNpwp", "lainnya"].includes(docType)) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Parameter docType tidak valid",
      );
      return;
    }

    if (!req.file?.buffer) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File dokumen wajib diunggah");
      return;
    }

    const result = await this.uploadDocumentUseCase.execute(
      id,
      req.file.buffer,
      docType as "fileKtp" | "fileKk" | "fileNpwp" | "lainnya",
      namaDokumen,
      pdfPassword,
    );

    sendResponse(res, StatusCodes.OK, "Dokumen berhasil diunggah", result);
  };
  generateAccount = async (
    req: TypedRequest<
      typeof generateAccountSchema.body,
      any,
      typeof generateAccountSchema.params
    >,
    res: Response,
  ): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { password } = req.body;

    const result = await this.generateAccountUseCase.execute(id, password);

    sendResponse(
      res,
      StatusCodes.CREATED,
      "Akun portal customer berhasil di-generate",
      result,
    );
  };
  exportExcel = async (_req: Request, res: Response): Promise<void> => {
    const excelBuffer = await this.exportCustomersUseCase.execute();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Data_Customer_${timestamp}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(excelBuffer);
  };

  exportPdf = async (_req: Request, res: Response): Promise<void> => {
    const pdfBuffer = await this.exportCustomersPdfUseCase.execute();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Data_Customer_${timestamp}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(StatusCodes.OK).send(pdfBuffer);
  };
  getMyDashboard = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId)
      throw new AppError(StatusCodes.UNAUTHORIZED, "User tidak valid");

    const result = await this.getCustomerDashboardUseCase.execute(userId);
    sendResponse(
      res,
      StatusCodes.OK,
      "Data Dashboard Customer berhasil diambil",
      result,
    );
  };

  uploadMyDocument = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId)
      throw new AppError(StatusCodes.UNAUTHORIZED, "User tidak valid");

    const docType = req.params.docType as string;
    const { namaDokumen } = req.body;

    if (!["fileKtp", "fileKk", "fileNpwp", "lainnya"].includes(docType)) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "Parameter docType tidak valid",
      );
      return;
    }

    if (!req.file?.buffer) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "File dokumen wajib diunggah");
      return;
    }

    const dashboardData =
      await this.getCustomerDashboardUseCase.execute(userId);
    const customerId = dashboardData.profil.id;

    const result = await this.uploadDocumentUseCase.execute(
      customerId,
      req.file.buffer,
      docType as "fileKtp" | "fileKk" | "fileNpwp" | "lainnya",
      namaDokumen,
    );

    sendResponse(res, StatusCodes.OK, "Dokumen berhasil diunggah", result);
  };
  uploadMyTagihan = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      sendResponse(res, StatusCodes.BAD_REQUEST, "ID tidak valid");
      return;
    }
    if (!req.file?.buffer) {
      sendResponse(
        res,
        StatusCodes.BAD_REQUEST,
        "File bukti pembayaran wajib diunggah",
      );
      return;
    }
    const result = await this.uploadBuktiTagihanUseCase.execute(
      id,
      req.file.buffer,
      true,
    );
    sendResponse(
      res,
      StatusCodes.OK,
      "Bukti berhasil diunggah dan menunggu verifikasi Admin",
      result,
    );
  };
}
