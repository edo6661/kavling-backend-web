import { UserRepository } from "../../domain/repositories/userRepo.js";
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

import {
  CreateAgentUseCase,
  UpdateAgentUseCase,
  GetAgentByIdUseCase,
  GetAgentsPaginatedUseCase,
  DeleteAgentUseCase,
} from "../../application/usecases/agent/AgentUseCases.js";

import { GoogleVisionService } from "../external/GoogleVisionService.js";
import { ExtractKtpDataUseCase } from "../../application/usecases/ocr/ExtractKtpDataUseCase.js";
import { OcrController } from "../../presentation/controllers/ocrController.js";

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
import { UploadCustomerDocumentUseCase } from "../../application/usecases/customer/UploadCustomerDocumentUseCase.js";
import { GenerateCustomerAccountUseCase } from "../../application/usecases/customer/GenerateCustomerAccountUseCase.js";
import { ExportCustomersUseCase } from "../../application/usecases/customer/ExportCustomersUseCase.js";
import { ExportCustomersPdfUseCase } from "../../application/usecases/customer/ExportCustomersPdfUseCase.js";
import { CustomerController } from "../../presentation/controllers/customerController.js";
import { PerumahanRepository } from "../../domain/repositories/perumahanRepo.js";
import {
  CreatePerumahanUseCase,
  UpdatePerumahanUseCase,
  GetPerumahanByIdUseCase,
  GetPerumahanPaginatedUseCase,
  DeletePerumahanUseCase,
} from "../../application/usecases/perumahan/PerumahanUseCases.js";
import { PerumahanController } from "../../presentation/controllers/perumahanController.js";
import { GetDashboardSummaryUseCase } from "../../application/usecases/dashboard/GetDashboardSummaryUseCase.js";
import { DashboardController } from "../../presentation/controllers/dashboardController.js";
import { CloudinaryService } from "../external/CloudinaryService.js";

import { AgentRepository } from "../../domain/repositories/agentRepo.js";
import { AgentController } from "../../presentation/controllers/agentController.js";

import { NotarisRepository } from "../../domain/repositories/notarisRepo.js";
import {
  CreateNotarisUseCase,
  UpdateNotarisUseCase,
  GetNotarisByIdUseCase,
  GetNotarisPaginatedUseCase,
  DeleteNotarisUseCase,
} from "../../application/usecases/notaris/NotarisUseCases.js";
import { NotarisController } from "../../presentation/controllers/notarisController.js";

import { KavlingRepository } from "../../domain/repositories/kavlingRepo.js";
import {
  CreateKavlingUseCase,
  UpdateKavlingUseCase,
  GetKavlingByIdUseCase,
  GetKavlingsPaginatedUseCase,
  DeleteKavlingUseCase,
} from "../../application/usecases/kavling/KavlingUseCases.js";
import { KavlingController } from "../../presentation/controllers/kavlingController.js";

import { DetailKavlingPajakRepository } from "../../domain/repositories/detailKavlingPajakRepo.js";
import {
  GetCustomerKavlingsPaginatedUseCase,
  UpdateCustomerKavlingUseCase,
} from "../../application/usecases/customerKavling/CustomerKavlingUseCases.js";
import { CustomerKavlingController } from "../../presentation/controllers/customerKavlingController.js";

import { TagihanRepository } from "../../domain/repositories/tagihanRepo.js";
import {
  CreateTagihanUseCase,
  UpdateTagihanUseCase,
  GetTagihanByIdUseCase,
  GetTagihansPaginatedUseCase,
  DeleteTagihanUseCase,
} from "../../application/usecases/tagihan/TagihanUseCases.js";
import { UploadBuktiTagihanUseCase } from "../../application/usecases/tagihan/UploadBuktiTagihanUseCase.js";
import { TagihanController } from "../../presentation/controllers/tagihanController.js";

import { PenjualanRepository } from "../../domain/repositories/penjualanRepo.js";
import { CreatePenjualanUseCase } from "../../application/usecases/penjualan/CreatePenjualanUseCase.js";
import { GetPenjualanPaginatedUseCase } from "../../application/usecases/penjualan/GetPenjualanPaginatedUseCase.js";
import { PenjualanController } from "../../presentation/controllers/penjualanController.js";
import { FeeAgentRepository } from "../../domain/repositories/feeAgentRepo.js";
import {
  GetFeeAgentsPaginatedUseCase,
  UpdateFeeAgentUseCase,
  UploadBuktiFeeUseCase,
} from "../../application/usecases/feeAgent/FeeAgentUseCases.js";
import { FeeAgentController } from "../../presentation/controllers/feeAgentController.js";
import { GenerateSprPdfUseCase } from "../../application/usecases/penjualan/GenerateSprPdfUseCase.js";
import { CancelPenjualanUseCase } from "../../application/usecases/penjualan/CancelPenjualanUseCase.js";
import { UploadBuktiPenjualanUseCase } from "../../application/usecases/penjualan/UploadBuktiPenjualanUseCase.js";
import { SaveSignatureUseCase } from "../../application/usecases/penjualan/SaveSignatureUseCase.js";
import { VerifyDocumentUseCase } from "../../application/usecases/verify/VerifyDocumentUseCase.js";
import { VerifyController } from "../../presentation/controllers/verifyController.js";
import { UpdatePenjualanUseCase } from "../../application/usecases/penjualan/UpdatePenjualanUseCase.js";
export const createContainer = (dbClient: PrismaClient) => {
  const googleVisionService = new GoogleVisionService();
  const cloudinaryService = new CloudinaryService();

  const userRepo = new UserRepository(dbClient);
  const bankRekeningPtRepo = new BankRekeningPtRepository(dbClient);
  const customerRepo = new CustomerRepository(dbClient);

  const extractKtpDataUseCase = new ExtractKtpDataUseCase(googleVisionService);

  const registerUseCase = new RegisterUserUseCase(userRepo);
  const loginUseCase = new LoginUserUseCase(userRepo);
  const getProfileUseCase = new GetProfileUseCase(userRepo);

  const getAllUsersUseCase = new GetAllUsersUseCase(userRepo);
  const updateUserUseCase = new UpdateUserUseCase(userRepo);
  const getUsersPaginatedUseCase = new GetUsersPaginatedUseCase(userRepo);

  const createBankUseCase = new CreateBankRekeningPtUseCase(bankRekeningPtRepo);
  const updateBankUseCase = new UpdateBankRekeningPtUseCase(bankRekeningPtRepo);
  const getBankByIdUseCase = new GetBankRekeningPtByIdUseCase(
    bankRekeningPtRepo,
  );
  const getBanksPaginatedUseCase = new GetBankRekeningPtPaginatedUseCase(
    bankRekeningPtRepo,
  );
  const deleteBankUseCase = new DeleteBankRekeningPtUseCase(bankRekeningPtRepo);

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

  const perumahanRepo = new PerumahanRepository(dbClient);

  const agentRepo = new AgentRepository(dbClient);

  const createAgentUseCase = new CreateAgentUseCase(agentRepo);
  const updateAgentUseCase = new UpdateAgentUseCase(agentRepo);
  const getAgentByIdUseCase = new GetAgentByIdUseCase(agentRepo);
  const getAgentsPaginatedUseCase = new GetAgentsPaginatedUseCase(agentRepo);
  const deleteAgentUseCase = new DeleteAgentUseCase(agentRepo);

  const agentController = new AgentController(
    createAgentUseCase,
    updateAgentUseCase,
    getAgentByIdUseCase,
    getAgentsPaginatedUseCase,
    deleteAgentUseCase,
  );
  const createPerumahanUseCase = new CreatePerumahanUseCase(perumahanRepo);
  const updatePerumahanUseCase = new UpdatePerumahanUseCase(perumahanRepo);
  const getPerumahanByIdUseCase = new GetPerumahanByIdUseCase(perumahanRepo);
  const getPerumahanPaginatedUseCase = new GetPerumahanPaginatedUseCase(
    perumahanRepo,
  );
  const deletePerumahanUseCase = new DeletePerumahanUseCase(perumahanRepo);

  const perumahanController = new PerumahanController(
    createPerumahanUseCase,
    updatePerumahanUseCase,
    getPerumahanByIdUseCase,
    getPerumahanPaginatedUseCase,
    deletePerumahanUseCase,
  );
  const kavlingRepo = new KavlingRepository(dbClient);
  const createKavlingUseCase = new CreateKavlingUseCase(kavlingRepo);
  const updateKavlingUseCase = new UpdateKavlingUseCase(kavlingRepo);
  const getKavlingByIdUseCase = new GetKavlingByIdUseCase(kavlingRepo);
  const getKavlingsPaginatedUseCase = new GetKavlingsPaginatedUseCase(
    kavlingRepo,
  );
  const deleteKavlingUseCase = new DeleteKavlingUseCase(kavlingRepo);

  const kavlingController = new KavlingController(
    createKavlingUseCase,
    updateKavlingUseCase,
    getKavlingByIdUseCase,
    getKavlingsPaginatedUseCase,
    deleteKavlingUseCase,
  );

  const detailKavlingPajakRepo = new DetailKavlingPajakRepository(dbClient);

  const getCustomerKavlingsPaginatedUseCase =
    new GetCustomerKavlingsPaginatedUseCase(dbClient);
  const updateCustomerKavlingUseCase = new UpdateCustomerKavlingUseCase(
    dbClient,
    kavlingRepo,
    detailKavlingPajakRepo,
  );

  const customerKavlingController = new CustomerKavlingController(
    getCustomerKavlingsPaginatedUseCase,
    updateCustomerKavlingUseCase,
  );

  const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase(dbClient);

  const notarisRepo = new NotarisRepository(dbClient);
  const createNotarisUseCase = new CreateNotarisUseCase(notarisRepo);
  const updateNotarisUseCase = new UpdateNotarisUseCase(notarisRepo);
  const getNotarisByIdUseCase = new GetNotarisByIdUseCase(notarisRepo);
  const getNotarisPaginatedUseCase = new GetNotarisPaginatedUseCase(
    notarisRepo,
  );
  const deleteNotarisUseCase = new DeleteNotarisUseCase(notarisRepo);

  const notarisController = new NotarisController(
    createNotarisUseCase,
    updateNotarisUseCase,
    getNotarisByIdUseCase,
    getNotarisPaginatedUseCase,
    deleteNotarisUseCase,
  );

  const dashboardController = new DashboardController(
    getDashboardSummaryUseCase,
  );

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
  const tagihanRepo = new TagihanRepository(dbClient);
  const createTagihanUseCase = new CreateTagihanUseCase(tagihanRepo);
  const updateTagihanUseCase = new UpdateTagihanUseCase(tagihanRepo);
  const getTagihanByIdUseCase = new GetTagihanByIdUseCase(tagihanRepo);
  const getTagihansPaginatedUseCase = new GetTagihansPaginatedUseCase(
    tagihanRepo,
  );
  const deleteTagihanUseCase = new DeleteTagihanUseCase(tagihanRepo);

  const penjualanRepo = new PenjualanRepository(dbClient);
  const generateSprPdfUseCase = new GenerateSprPdfUseCase(penjualanRepo);
  const createPenjualanUseCase = new CreatePenjualanUseCase(penjualanRepo);
  const updatePenjualanUseCase = new UpdatePenjualanUseCase(dbClient);
  const getPenjualanPaginatedUseCase = new GetPenjualanPaginatedUseCase(
    penjualanRepo,
  );
  const cancelPenjualanUseCase = new CancelPenjualanUseCase(dbClient);
  const uploadBuktiPenjualanUseCase = new UploadBuktiPenjualanUseCase(
    dbClient,
    cloudinaryService,
    generateSprPdfUseCase,
  );
  const saveSignatureUseCase = new SaveSignatureUseCase(
    dbClient,
    cloudinaryService,
    generateSprPdfUseCase,
  );
  const penjualanController = new PenjualanController(
    createPenjualanUseCase,
    getPenjualanPaginatedUseCase,
    cancelPenjualanUseCase,
    uploadBuktiPenjualanUseCase,
    saveSignatureUseCase,
    updatePenjualanUseCase,
  );
  const uploadBuktiTagihanUseCase = new UploadBuktiTagihanUseCase(
    tagihanRepo,
    cloudinaryService,
    penjualanRepo,
    generateSprPdfUseCase,
  );

  const tagihanController = new TagihanController(
    createTagihanUseCase,
    updateTagihanUseCase,
    getTagihanByIdUseCase,
    getTagihansPaginatedUseCase,
    deleteTagihanUseCase,
    uploadBuktiTagihanUseCase,
  );
  const feeAgentRepo = new FeeAgentRepository(dbClient);
  const getFeeAgentsPaginatedUseCase = new GetFeeAgentsPaginatedUseCase(
    feeAgentRepo,
  );
  const updateFeeAgentUseCase = new UpdateFeeAgentUseCase(feeAgentRepo);
  const uploadBuktiFeeUseCase = new UploadBuktiFeeUseCase(
    feeAgentRepo,
    cloudinaryService,
  );

  const feeAgentController = new FeeAgentController(
    getFeeAgentsPaginatedUseCase,
    updateFeeAgentUseCase,
    uploadBuktiFeeUseCase,
  );
  const verifyDocumentUseCase = new VerifyDocumentUseCase(dbClient);
  const verifyController = new VerifyController(verifyDocumentUseCase);
  return {
    authController,
    userRepo,
    bankRekeningPtRepo,
    customerRepo,
    userController,
    ocrController,
    bankRekeningPtController,
    customerController,
    perumahanRepo,
    perumahanController,
    dashboardController,
    agentController,
    notarisController,
    kavlingController,
    customerKavlingController,
    tagihanController,
    penjualanController,
    feeAgentController,
    verifyController,
  };
};

export const container = createContainer(prisma as any);
