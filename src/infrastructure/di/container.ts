import { UserRepository } from "../../domain/repositories/userRepo.js";
import { UnitRepository } from "../../domain/repositories/unitRepo.js";
import { BankRekeningPtRepository } from "../../domain/repositories/bankRekeningPtRepo.js";
import { CustomerRepository } from "../../domain/repositories/customerRepo.js";

import { RegisterUserUseCase } from "../../application/usecases/auth/RegisterUserUseCase.js";
import { LoginUserUseCase } from "../../application/usecases/auth/LoginUserUseCase.js";
import { GetProfileUseCase } from "../../application/usecases/auth/GetProfileUseCase.js";
import { AuthController } from "../../presentation/controllers/authController.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import type { PrismaClient } from "@prisma/client/extension";
import { GetAllUsersUseCase } from "../../application/usecases/user/GetAllUsersUseCase.js";
import { UserController } from "../../presentation/controllers/userController.js";
import { UpdateUserUseCase } from "../../application/usecases/user/UpdateUserUseCase.js";
import { GetUsersPaginatedUseCase } from "../../application/usecases/user/GetUsersPaginatedUseCase.js";
import { GoogleVisionService } from "../external/GoogleVisionService.js";
import { ExtractKtpDataUseCase } from "../../application/usecases/ocr/ExtractKtpDataUseCase.js";
import { UploadCustomerDocumentUseCase } from "../../application/usecases/customer/UploadCustomerDocumentUseCase.js";
import { OcrController } from "../../presentation/controllers/ocrController.js";

import { CreateUnitUseCase } from "../../application/usecases/unit/CreateUnitUseCase.js";
import { UpdateUnitUseCase } from "../../application/usecases/unit/UpdateUnitUseCase.js";
import { GetUnitByIdUseCase } from "../../application/usecases/unit/GetUnitByIdUseCase.js";
import { GetUnitsPaginatedUseCase } from "../../application/usecases/unit/GetUnitsPaginatedUseCase.js";
import { DeleteUnitUseCase } from "../../application/usecases/unit/DeleteUnitUseCase.js";
import { UnitController } from "../../presentation/controllers/unitController.js";
import { ExportUnitsUseCase } from "../../application/usecases/unit/ExportUnitsUseCase.js";
import {
  CreateBankRekeningPtUseCase,
  UpdateBankRekeningPtUseCase,
  GetBankRekeningPtByIdUseCase,
  GetBankRekeningPtPaginatedUseCase,
  DeleteBankRekeningPtUseCase,
} from "../../application/usecases/bankRekeningPt/BankRekeningPtUseCases.js";
import { BankRekeningPtController } from "../../presentation/controllers/bankRekeningPtController.js";

import { CreateCustomerUseCase } from "../../application/usecases/customer/CreateCustomerUseCase.js";
import { UpdateCustomerUseCase } from "../../application/usecases/customer/UpdateCustomerUseCase.js";
import { GetCustomerByIdUseCase } from "../../application/usecases/customer/GetCustomerByIdUseCase.js";
import { GetCustomersPaginatedUseCase } from "../../application/usecases/customer/GetCustomersPaginatedUseCase.js";
import { DeleteCustomerUseCase } from "../../application/usecases/customer/DeleteCustomerUseCase.js";
import { CustomerController } from "../../presentation/controllers/customerController.js";

import { SprRepository } from "../../domain/repositories/sprRepo.js";
import { CreateSprUseCase } from "../../application/usecases/spr/CreateSprUseCase.js";
import { UploadSprSignatureUseCase } from "../../application/usecases/spr/UploadSprSignatureUseCase.js";
import { UpdateSprUseCase } from "../../application/usecases/spr/UpdateSprUseCase.js";
import { GetSprByIdUseCase } from "../../application/usecases/spr/GetSprByIdUseCase.js";
import { GetSprsPaginatedUseCase } from "../../application/usecases/spr/GetSprsPaginatedUseCase.js";
import { DeleteSprUseCase } from "../../application/usecases/spr/DeleteSprUseCase.js";
import { SprController } from "../../presentation/controllers/SprController.1.js";

import { SprPaymentRepository } from "../../domain/repositories/sprPaymentRepo.js";
import {
  CreateSprPaymentUseCase,
  UpdateSprPaymentUseCase,
  GetSprPaymentByIdUseCase,
  GetSprPaymentsPaginatedUseCase,
  DeleteSprPaymentUseCase,
  UploadBuktiTransferUseCase,
} from "../../application/usecases/sprPayment/SprPaymentUseCases.js";
import { SprPaymentController } from "../../presentation/controllers/sprPaymentController.js";
import { CloudinaryService } from "../external/CloudinaryService.js";

import { MasterDataProgressRepository } from "../../domain/repositories/masterDataProgressRepo.js";
import {
  CreateMasterDataProgressUseCase,
  UpdateMasterDataProgressUseCase,
  GetMasterDataProgressByIdUseCase,
  GetMasterDataProgressBySprIdUseCase,
  GetMasterDataProgressPaginatedUseCase,
} from "../../application/usecases/masterDataProgress/MasterDataProgressUseCases.js";
import { MasterDataProgressController } from "../../presentation/controllers/masterDataProgressController.js";

import { DashboardRepository } from "../../domain/repositories/dashboardRepo.js";
import { GetDashboardSummaryUseCase } from "../../application/usecases/dashboard/GetDashboardSummaryUseCase.js";
import { DashboardController } from "../../presentation/controllers/dashboardController.js";

import { GetCustomerTrackRecordUseCase } from "../../application/usecases/portal/GetCustomerTrackRecordUseCase.js";
import { PortalController } from "../../presentation/controllers/portalController.js";
import { UploadMasterDataProgressDocumentUseCase } from "../../application/usecases/masterDataProgress/UploadMasterDataProgressDocumentUseCase.js";
import { VerifySprPaymentUseCase } from "../../application/usecases/sprPayment/VerifySprPaymentUseCase.js";
import { GenerateSprPdfUseCase } from "../../application/usecases/spr/GenerateSprPdfUseCase.js";
import { ExportMasterDataUseCase } from "../../application/usecases/masterDataProgress/ExportMasterDataUseCase.js";
import { GenerateCustomerAccountUseCase } from "../../application/usecases/customer/GenerateCustomerAccountUseCase.js";
import { CancelSprUseCase } from "../../application/usecases/spr/CancelSprUseCase.js";
import { ExportUnitsPdfUseCase } from "../../application/usecases/unit/ExportUnitsPdfUseCase.js";
import { ExportCustomersUseCase } from "../../application/usecases/customer/ExportCustomersUseCase.js";
import { ExportCustomersPdfUseCase } from "../../application/usecases/customer/ExportCustomersPdfUseCase.js";
import { ExportSprUseCase } from "../../application/usecases/spr/ExportSprUseCase.js";
import { ExportSprPdfUseCase } from "../../application/usecases/spr/ExportSprPdfUseCase.js";
import { GenerateKwitansiPdfUseCase } from "../../application/usecases/sprPayment/GenerateKwitansiPdfUseCase.js";
import { ExportMasterDataPdfUseCase } from "../../application/usecases/masterDataProgress/ExportMasterDataPdfUseCase.js";
import { ExportFinanceReportUseCase } from "../../application/usecases/sprPayment/ExportFinanceReportUseCase.js";
import { CreateFastEntrySprUseCase } from "../../application/usecases/spr/CreateFastEntrySprUseCase.js";

export const createContainer = (dbClient: PrismaClient) => {
  const googleVisionService = new GoogleVisionService();
  const cloudinaryService = new CloudinaryService();

  const sprPaymentRepo = new SprPaymentRepository(dbClient);
  const userRepo = new UserRepository(dbClient);
  const unitRepo = new UnitRepository(dbClient);
  const bankRekeningPtRepo = new BankRekeningPtRepository(dbClient);
  const customerRepo = new CustomerRepository(dbClient);
  const sprRepo = new SprRepository(dbClient);
  const masterDataProgressRepo = new MasterDataProgressRepository(dbClient);
  const dashboardRepo = new DashboardRepository(dbClient);

  const extractKtpDataUseCase = new ExtractKtpDataUseCase(googleVisionService);

  const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase(
    dashboardRepo,
  );
  const exportMasterDataPdfUseCase = new ExportMasterDataPdfUseCase(dbClient);
  const createMasterDataProgressUseCase = new CreateMasterDataProgressUseCase(
    masterDataProgressRepo,
  );
  const updateMasterDataProgressUseCase = new UpdateMasterDataProgressUseCase(
    masterDataProgressRepo,
  );
  const getMasterDataProgressByIdUseCase = new GetMasterDataProgressByIdUseCase(
    masterDataProgressRepo,
  );
  const getMasterDataProgressBySprIdUseCase =
    new GetMasterDataProgressBySprIdUseCase(masterDataProgressRepo);
  const getMasterDataProgressPaginatedUseCase =
    new GetMasterDataProgressPaginatedUseCase(masterDataProgressRepo);

  const verifySprPaymentUseCase = new VerifySprPaymentUseCase(
    sprPaymentRepo,
    sprRepo,
    masterDataProgressRepo,
  );
  const exportFinanceReportUseCase = new ExportFinanceReportUseCase(dbClient);
  const generateKwitansiPdfUseCase = new GenerateKwitansiPdfUseCase(dbClient);
  const createSprPaymentUseCase = new CreateSprPaymentUseCase(sprPaymentRepo);
  const updateSprPaymentUseCase = new UpdateSprPaymentUseCase(sprPaymentRepo);
  const getSprPaymentByIdUseCase = new GetSprPaymentByIdUseCase(sprPaymentRepo);
  const getSprPaymentsPaginatedUseCase = new GetSprPaymentsPaginatedUseCase(
    sprPaymentRepo,
  );
  const deleteSprPaymentUseCase = new DeleteSprPaymentUseCase(sprPaymentRepo);
  const uploadBuktiTransferUseCase = new UploadBuktiTransferUseCase(
    sprPaymentRepo,
    cloudinaryService,
    sprRepo,
    masterDataProgressRepo,
  );
  const exportSprUseCase = new ExportSprUseCase(dbClient);
  const exportSprPdfUseCase = new ExportSprPdfUseCase(dbClient);
  const createSprUseCase = new CreateSprUseCase(sprRepo);
  const createFastEntrySprUseCase = new CreateFastEntrySprUseCase(
    sprRepo,
    cloudinaryService,
  );
  const updateSprUseCase = new UpdateSprUseCase(sprRepo);
  const getSprByIdUseCase = new GetSprByIdUseCase(sprRepo);
  const getSprsPaginatedUseCase = new GetSprsPaginatedUseCase(sprRepo);
  const deleteSprUseCase = new DeleteSprUseCase(sprRepo);
  const cancelSprUseCase = new CancelSprUseCase(sprRepo);
  const uploadSprSignatureUseCase = new UploadSprSignatureUseCase(
    sprRepo,
    cloudinaryService,
  );

  const registerUseCase = new RegisterUserUseCase(userRepo);
  const loginUseCase = new LoginUserUseCase(userRepo);
  const getProfileUseCase = new GetProfileUseCase(userRepo);

  const getAllUsersUseCase = new GetAllUsersUseCase(userRepo);
  const updateUserUseCase = new UpdateUserUseCase(userRepo);
  const getUsersPaginatedUseCase = new GetUsersPaginatedUseCase(userRepo);

  const exportUnitsUseCase = new ExportUnitsUseCase(dbClient);
  const exportUnitsPdfUseCase = new ExportUnitsPdfUseCase(dbClient);
  const createUnitUseCase = new CreateUnitUseCase(unitRepo);
  const updateUnitUseCase = new UpdateUnitUseCase(unitRepo);
  const getUnitByIdUseCase = new GetUnitByIdUseCase(unitRepo);
  const getUnitsPaginatedUseCase = new GetUnitsPaginatedUseCase(unitRepo);
  const deleteUnitUseCase = new DeleteUnitUseCase(unitRepo);

  const createBankUseCase = new CreateBankRekeningPtUseCase(bankRekeningPtRepo);
  const updateBankUseCase = new UpdateBankRekeningPtUseCase(bankRekeningPtRepo);
  const getBankByIdUseCase = new GetBankRekeningPtByIdUseCase(
    bankRekeningPtRepo,
  );
  const getBanksPaginatedUseCase = new GetBankRekeningPtPaginatedUseCase(
    bankRekeningPtRepo,
  );
  const deleteBankUseCase = new DeleteBankRekeningPtUseCase(bankRekeningPtRepo);

  const uploadMasterDataProgressDocumentUseCase =
    new UploadMasterDataProgressDocumentUseCase(
      masterDataProgressRepo,
      cloudinaryService,
    );
  const exportMasterDataUseCase = new ExportMasterDataUseCase(dbClient);

  const generateSprPdfUseCase = new GenerateSprPdfUseCase(
    sprRepo,
    customerRepo,
    unitRepo,
    bankRekeningPtRepo,
  );

  const exportCustomersUseCase = new ExportCustomersUseCase(dbClient);
  const exportCustomersPdfUseCase = new ExportCustomersPdfUseCase(dbClient);
  const createCustomerUseCase = new CreateCustomerUseCase(customerRepo);
  const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepo);
  const uploadCustomerDocumentUseCase = new UploadCustomerDocumentUseCase(
    customerRepo,
    cloudinaryService,
  );
  const getCustomerByIdUseCase = new GetCustomerByIdUseCase(customerRepo);
  const getCustomersPaginatedUseCase = new GetCustomersPaginatedUseCase(
    customerRepo,
  );
  const deleteCustomerUseCase = new DeleteCustomerUseCase(customerRepo);
  const generateCustomerAccountUseCase = new GenerateCustomerAccountUseCase(
    customerRepo,
    userRepo,
  );
  const getCustomerTrackRecordUseCase = new GetCustomerTrackRecordUseCase(
    customerRepo,
    sprRepo,
  );

  const portalController = new PortalController(getCustomerTrackRecordUseCase);

  const ocrController = new OcrController(extractKtpDataUseCase);
  const authController = new AuthController(
    registerUseCase,
    loginUseCase,
    getProfileUseCase,
  );
  const userController = new UserController(
    getAllUsersUseCase,
    updateUserUseCase,
    getUsersPaginatedUseCase,
  );

  const unitController = new UnitController(
    createUnitUseCase,
    updateUnitUseCase,
    getUnitByIdUseCase,
    getUnitsPaginatedUseCase,
    deleteUnitUseCase,
    exportUnitsUseCase,
    exportUnitsPdfUseCase,
  );

  const bankRekeningPtController = new BankRekeningPtController(
    createBankUseCase,
    updateBankUseCase,
    getBankByIdUseCase,
    getBanksPaginatedUseCase,
    deleteBankUseCase,
  );
  const customerController = new CustomerController(
    createCustomerUseCase,
    updateCustomerUseCase,
    getCustomerByIdUseCase,
    getCustomersPaginatedUseCase,
    deleteCustomerUseCase,
    uploadCustomerDocumentUseCase,
    generateCustomerAccountUseCase,
    exportCustomersUseCase,
    exportCustomersPdfUseCase,
  );

  const sprController = new SprController(
    createSprUseCase,
    createFastEntrySprUseCase,
    updateSprUseCase,
    getSprByIdUseCase,
    getSprsPaginatedUseCase,
    deleteSprUseCase,
    uploadSprSignatureUseCase,
    generateSprPdfUseCase,
    cancelSprUseCase,
    exportSprUseCase,
    exportSprPdfUseCase,
  );
  const sprPaymentController = new SprPaymentController(
    createSprPaymentUseCase,
    updateSprPaymentUseCase,
    getSprPaymentByIdUseCase,
    getSprPaymentsPaginatedUseCase,
    deleteSprPaymentUseCase,
    uploadBuktiTransferUseCase,
    verifySprPaymentUseCase,
    generateKwitansiPdfUseCase,
    exportFinanceReportUseCase,
  );

  const masterDataProgressController = new MasterDataProgressController(
    createMasterDataProgressUseCase,
    updateMasterDataProgressUseCase,
    getMasterDataProgressByIdUseCase,
    getMasterDataProgressBySprIdUseCase,
    getMasterDataProgressPaginatedUseCase,
    uploadMasterDataProgressDocumentUseCase,
    exportMasterDataUseCase,
    exportMasterDataPdfUseCase,
  );

  const dashboardController = new DashboardController(
    getDashboardSummaryUseCase,
  );

  return {
    authController,
    userRepo,
    unitRepo,
    bankRekeningPtRepo,
    customerRepo,
    userController,
    ocrController,
    unitController,
    bankRekeningPtController,
    customerController,
    sprRepo,
    sprController,
    sprPaymentRepo,
    sprPaymentController,
    masterDataProgressRepo,
    masterDataProgressController,
    dashboardController,
    portalController,
  };
};

export const container = createContainer(prisma as any);
