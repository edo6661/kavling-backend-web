import { ProgressProyekRepository } from "../../domain/repositories/progressProyekRepo.js";
import { SpkRepository } from "../../domain/repositories/spkRepo.js";
import { SpkPembayaranRepository } from "../../domain/repositories/spkPembayaranRepo.js";
import { NotarisPembayaranRepository } from "../../domain/repositories/notarisPembayaranRepo.js";
import { BankKprPembayaranRepository } from "../../domain/repositories/bankKprPembayaranRepo.js";
import {
  AddBuktiSpkPembayaranUseCase,
  BayarSpkPembayaranUseCase,
  CreateSpkPembayaranRequestUseCase,
  GetSpkKasbonDraftUseCase,
  SaveSpkKasbonDraftUseCase,
  SubmitSpkKasbonDraftUseCase,
  GetSpkPembayaranBySpkUseCase,
  GetSpkPembayaranPaginatedUseCase,
  RemoveBuktiSpkPembayaranUseCase,
  SetBsiCmsDilaporkanUseCase,
  UpdateSpkKasbonUseCase,
  UpdateSpkUpahUseCase,
  DeleteSpkPenguranganUseCase,
  UploadKasbonFotoBonUseCase,
  ApproveSpkPembayaranUseCase,
} from "../../application/usecases/spkPembayaran/SpkPembayaranUseCases.js";
import { TukangRepository } from "../../domain/repositories/tukangRepo.js";
import { TukangController } from "../../presentation/controllers/tukangController.js";
import {
  BayarNotarisPembayaranUseCase,
  GetNotarisPembayaranPaginatedUseCase,
  SetNotarisBsiCmsDilaporkanUseCase,
  SyncAllNotarisPembayaranUseCase,
} from "../../application/usecases/notarisPembayaran/NotarisPembayaranUseCases.js";
import {
  BayarBankKprPembayaranUseCase,
  GetBankKprPembayaranPaginatedUseCase,
  SetBankKprBsiCmsDilaporkanUseCase,
  SyncAllBankKprPembayaranUseCase,
} from "../../application/usecases/bankKprPembayaran/BankKprPembayaranUseCases.js";
import { SpkPembayaranController } from "../../presentation/controllers/spkPembayaranController.js";
import { NotarisPembayaranController } from "../../presentation/controllers/notarisPembayaranController.js";
import { BankKprPembayaranController } from "../../presentation/controllers/bankKprPembayaranController.js";
import {
  CreateSpkUseCase,
  UpdateSpkUseCase,
  GetSpkByIdUseCase,
  GetSpkPaginatedUseCase,
  DeleteSpkUseCase,
} from "../../application/usecases/spk/SpkUseCases.js";
import { SpkController } from "../../presentation/controllers/spkController.js";
import {
  CreateTahapanLogByKavlingUseCase,
  CreateTahapanLogUseCase,
  GetProgressProyekByKavlingUseCase,
  GetProgressProyekUseCase,
  GetProgressProyekListPaginatedUseCase,
  ListMandorsUseCase,
  ResetTotalProgressByKavlingUseCase,
  SetTotalProgressByKavlingUseCase,
  UpdateProgressProyekUseCase,
  UploadTahapanPhotoByKavlingUseCase,
  UploadTahapanPhotoUseCase,
} from "../../application/usecases/progressProyek/ProgressProyekUseCases.js";
import { ProgressProyekController } from "../../presentation/controllers/progressProyekController.js";
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
import { CreateUserUseCase } from "../../application/usecases/user/CreateUserUseCase.js";
import { GetUserByIdUseCase } from "../../application/usecases/user/GetUserByIdUseCase.js";
import { DeleteUserUseCase } from "../../application/usecases/user/DeleteUserUseCase.js";

import {
  CreateAgentUseCase,
  UpdateAgentUseCase,
  GetAgentByIdUseCase,
  GetAgentsPaginatedUseCase,
  DeleteAgentUseCase,
  GetAgentProfileUseCase,
} from "../../application/usecases/agent/AgentUseCases.js";

import { GoogleVisionService } from "../external/GoogleVisionService.js";
import { ExtractKtpDataUseCase } from "../../application/usecases/ocr/ExtractKtpDataUseCase.js";
import { ExtractKasbonBonDataUseCase } from "../../application/usecases/ocr/ExtractKasbonBonDataUseCase.js";
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
import { ExportKavlingsUseCase } from "../../application/usecases/kavling/ExportKavlingsUseCase.js";
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
import { RemoveBuktiTagihanUseCase } from "../../application/usecases/tagihan/RemoveBuktiTagihanUseCase.js";
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
import { GantiKavlingUseCase } from "../../application/usecases/penjualan/GantiKavlingUseCase.js";
import { UploadBuktiRefundUseCase } from "../../application/usecases/tagihan/UploadBuktiRefundUseCase.js";
import { ApproveBatalUseCase } from "../../application/usecases/penjualan/ApproveBatalUseCase.js";
import { ApproveGantiKavlingUseCase } from "../../application/usecases/penjualan/ApproveGantiKavlingUseCase.js";
import { GetPengajuanBatalUseCase } from "../../application/usecases/penjualan/GetPengajuanBatalUseCase.js";
import { GetPengajuanGantiKavlingUseCase } from "../../application/usecases/penjualan/GetPengajuanGantiKavlingUseCase.js";
import { AuditLogRepository } from "../../domain/repositories/auditLogRepo.js";
import { GetAuditLogsPaginatedUseCase } from "../../application/usecases/auditLog/GetAuditLogsPaginatedUseCase.js";
import { AuditLogController } from "../../presentation/controllers/auditLogController.js";
import { SaveTagihanSignatureUseCase } from "../../application/usecases/tagihan/SaveTagihanSignatureUseCase.js";
import { RegenerateSprUseCase } from "../../application/usecases/penjualan/RegenerateSprUseCase.js";
import { ProgressPenjualanRepository } from "../../domain/repositories/progressPenjualanRepo.js";
import {
  GetProgressPenjualanUseCase,
  UpdateProgressPenjualanUseCase,
  UploadProgressDocumentUseCase,
} from "../../application/usecases/progressPenjualan/ProgressPenjualanUseCases.js";
import { ProgressPenjualanController } from "../../presentation/controllers/progressPenjualanController.js";
import { UploadKavlingDocumentUseCase } from "../../application/usecases/kavling/UploadKavlingDocumentUseCase.js";
import { UploadKavlingSertifikatTambahanDocumentUseCase } from "../../application/usecases/kavling/UploadKavlingSertifikatTambahanDocumentUseCase.js";
import { TelegramBotService } from "../telegram/TelegramBotService.js";
import { RolePermissionRepository } from "../../domain/repositories/rolePermissionRepo.js";
import {
  UpsertRolePermissionUseCase,
  GetRolePermissionsUseCase,
  DeleteRolePermissionUseCase,
} from "../../application/usecases/rolePermission/RolePermissionUseCases.js";
import { RolePermissionController } from "../../presentation/controllers/rolePermissionController.js";
import { CustomerLoginUseCase } from "../../application/usecases/auth/CustomerLoginUseCase.js";
import { GetCustomerDashboardUseCase } from "../../application/usecases/customer/GetCustomerDashboardUseCase.js";
import { ApproveBuktiTagihanUseCase } from "../../application/usecases/tagihan/ApproveBuktiTagihanUseCase.js";
import { KodeBillingPphRepository } from "../../domain/repositories/kodeBillingPphRepo.js";
import {
  UploadKodeBillingPphUseCase,
  UploadBuktiBayarKodeBillingPphUseCase,
  GetKodeBillingPphPaginatedUseCase,
  GetKodeBillingPphByPenjualanUseCase,
  GetAllKodeBillingPphByPenjualanUseCase,
} from "../../application/usecases/kodeBillingPph/KodeBillingPphUseCases.js";
import { KodeBillingPphController } from "../../presentation/controllers/kodeBillingPphController.js";
import { SuketPphRepository } from "../../domain/repositories/suketPphRepo.js";
import {
  UploadSuketPphUseCase,
  GetSuketPphByPenjualanUseCase,
  GetAllSuketPphByPenjualanUseCase,
} from "../../application/usecases/suketPph/SuketPphUseCases.js";
import { SuketPphController } from "../../presentation/controllers/suketPphController.js";
import { SocketService } from "../websocket/SocketService.js";
import { NotificationRepository } from "../../domain/repositories/notificationRepo.js";
import { NotificationService } from "../notifications/NotificationService.js";
import {
  GetNotificationsUseCase,
  GetUnreadNotificationCountUseCase,
  MarkAllNotificationsAsReadUseCase,
  MarkNotificationAsReadUseCase,
} from "../../application/usecases/notification/NotificationUseCases.js";
import { NotificationController } from "../../presentation/controllers/notificationController.js";
import { UpdateCustomerSelfUseCase } from "../../application/usecases/auth/UpdateCustomerSelfUseCase.js";
import { GenerateAgentAccountUseCase } from "../../application/usecases/agent/GenerateAgentAccountUseCase.js";
import { UploadAgentDocumentUseCase } from "../../application/usecases/agent/UploadAgentDocumentUseCase.js";
import { AgentLoginUseCase } from "../../application/usecases/auth/AgentLoginUseCase.js";
import { RegisterAgentUseCase } from "../../application/usecases/auth/AgentRegisterUseCase.js";
import { PerusahaanAgentRepository } from "../../domain/repositories/perusahaanAgentRepo.js";
import { PerusahaanAgentUseCases } from "../../application/usecases/perusahaanAgent/PerusahaanAgentUseCases.js";
import { PerusahaanAgentController } from "../../presentation/controllers/perusahaanAgentController.js";
import { GenerateSuratPernyataanPdfUseCase } from "../../application/usecases/agent/GenerateSuratPernyataanPdfUseCase.js";
import { EmailService } from "../external/EmailService.js";

export const createContainer = (dbClient: PrismaClient) => {
  const googleVisionService = new GoogleVisionService();
  const cloudinaryService = new CloudinaryService();
  const socketService = new SocketService();
  const emailService = new EmailService();
  const notificationRepo = new NotificationRepository(dbClient);

  const userRepo = new UserRepository(dbClient);
  const notificationService = new NotificationService(
    notificationRepo,
    userRepo,
    socketService,
  );
  const getNotificationsUseCase = new GetNotificationsUseCase(notificationRepo);
  const getUnreadNotificationCountUseCase = new GetUnreadNotificationCountUseCase(
    notificationRepo,
  );
  const markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(
    notificationRepo,
  );
  const markAllNotificationsAsReadUseCase = new MarkAllNotificationsAsReadUseCase(
    notificationRepo,
  );
  const notificationController = new NotificationController(
    getNotificationsUseCase,
    getUnreadNotificationCountUseCase,
    markNotificationAsReadUseCase,
    markAllNotificationsAsReadUseCase,
  );
  const bankRekeningPtRepo = new BankRekeningPtRepository(dbClient);
  const customerRepo = new CustomerRepository(dbClient);
  const updateCustomerSelfUseCase = new UpdateCustomerSelfUseCase(
    userRepo,
    customerRepo,
  );
  const extractKtpDataUseCase = new ExtractKtpDataUseCase(googleVisionService);
  const extractKasbonBonDataUseCase = new ExtractKasbonBonDataUseCase(
    googleVisionService,
  );

  const registerUseCase = new RegisterUserUseCase(userRepo);
  const loginUseCase = new LoginUserUseCase(userRepo, dbClient);
  const getProfileUseCase = new GetProfileUseCase(userRepo, dbClient);
  const customerLoginUseCase = new CustomerLoginUseCase(userRepo, dbClient);

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
  const createCustomerUseCase = new CreateCustomerUseCase(
    customerRepo,
    userRepo,
  );
  const updateCustomerUseCase = new UpdateCustomerUseCase(
    customerRepo,
    cloudinaryService,
  );
  const uploadCustomerDocumentUseCase = new UploadCustomerDocumentUseCase(
    customerRepo,
    cloudinaryService,
  );
  const getCustomerDashboardUseCase = new GetCustomerDashboardUseCase(dbClient);
  const getCustomerByIdUseCase = new GetCustomerByIdUseCase(customerRepo);
  const getCustomersPaginatedUseCase = new GetCustomersPaginatedUseCase(
    customerRepo,
  );
  const deleteCustomerUseCase = new DeleteCustomerUseCase(
    customerRepo,
    cloudinaryService,
  );
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
  const deleteAgentUseCase = new DeleteAgentUseCase(
    agentRepo,
    cloudinaryService,
  );
  const generateAgentAccountUseCase = new GenerateAgentAccountUseCase(
    agentRepo,
    userRepo,
  );
  const uploadAgentDocumentUseCase = new UploadAgentDocumentUseCase(
    agentRepo,
    cloudinaryService,
  );
  const getAgentProfileUseCase = new GetAgentProfileUseCase(agentRepo);
  const agentController = new AgentController(
    createAgentUseCase,
    updateAgentUseCase,
    getAgentByIdUseCase,
    getAgentsPaginatedUseCase,
    deleteAgentUseCase,
    uploadAgentDocumentUseCase,
    generateAgentAccountUseCase,
    getAgentProfileUseCase,
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
  const deleteKavlingUseCase = new DeleteKavlingUseCase(
    kavlingRepo,
    cloudinaryService,
  );

  const uploadKavlingDocumentUseCase = new UploadKavlingDocumentUseCase(
    kavlingRepo,
    cloudinaryService,
  );
  const uploadKavlingSertifikatTambahanDocumentUseCase =
    new UploadKavlingSertifikatTambahanDocumentUseCase(
      kavlingRepo,
      cloudinaryService,
    );
  const exportKavlingsUseCase = new ExportKavlingsUseCase(kavlingRepo);

  const kavlingController = new KavlingController(
    createKavlingUseCase,
    updateKavlingUseCase,
    getKavlingByIdUseCase,
    getKavlingsPaginatedUseCase,
    deleteKavlingUseCase,
    uploadKavlingDocumentUseCase,
    uploadKavlingSertifikatTambahanDocumentUseCase,
    exportKavlingsUseCase,
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

  const ocrController = new OcrController(
    extractKtpDataUseCase,
    extractKasbonBonDataUseCase,
  );
  const agentLoginUseCase = new AgentLoginUseCase(userRepo, dbClient);
  const generateSuratPernyataanPdfUseCase =
    new GenerateSuratPernyataanPdfUseCase();
  const registerAgentUseCase = new RegisterAgentUseCase(
    dbClient,
    cloudinaryService,
    generateSuratPernyataanPdfUseCase,
    emailService,
  );
  const authController = new AuthController(
    registerUseCase,
    loginUseCase,
    getProfileUseCase,
    customerLoginUseCase,
    updateCustomerSelfUseCase,
    agentLoginUseCase,
    registerAgentUseCase,
  );
  const createUserUseCase = new CreateUserUseCase(userRepo);
  const getUserByIdUseCase = new GetUserByIdUseCase(userRepo);
  const deleteUserUseCase = new DeleteUserUseCase(userRepo);
  const userController = new UserController(
    getAllUsersUseCase,
    updateUserUseCase,
    getUsersPaginatedUseCase,
    createUserUseCase,
    getUserByIdUseCase,
    deleteUserUseCase,
  );

  const bankRekeningPtController = new BankRekeningPtController(
    createBankUseCase,
    updateBankUseCase,
    getBankByIdUseCase,
    getBanksPaginatedUseCase,
    deleteBankUseCase,
  );

  const tagihanRepo = new TagihanRepository(dbClient);
  const createTagihanUseCase = new CreateTagihanUseCase(tagihanRepo, dbClient);
  const updateTagihanUseCase = new UpdateTagihanUseCase(tagihanRepo, dbClient);
  const getTagihanByIdUseCase = new GetTagihanByIdUseCase(tagihanRepo);
  const getTagihansPaginatedUseCase = new GetTagihansPaginatedUseCase(
    tagihanRepo,
  );
  const deleteTagihanUseCase = new DeleteTagihanUseCase(
    tagihanRepo,
    cloudinaryService,
  );

  const penjualanRepo = new PenjualanRepository(dbClient);
  const generateSprPdfUseCase = new GenerateSprPdfUseCase(penjualanRepo);
  const createPenjualanUseCase = new CreatePenjualanUseCase(penjualanRepo);
  const updatePenjualanUseCase = new UpdatePenjualanUseCase(
    dbClient,
    cloudinaryService,
    generateSprPdfUseCase,
  );
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
  const gantiKavlingUseCase = new GantiKavlingUseCase(dbClient, notificationService);
  const approveBatalUseCase = new ApproveBatalUseCase(dbClient);
  const approveGantiKavlingUseCase = new ApproveGantiKavlingUseCase(
    dbClient,
    cloudinaryService,
    generateSprPdfUseCase,
  );
  const getPengajuanBatalUseCase = new GetPengajuanBatalUseCase(dbClient);
  const getPengajuanGantiKavlingUseCase = new GetPengajuanGantiKavlingUseCase(
    dbClient,
  );
  const regenerateSprUseCase = new RegenerateSprUseCase(
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
    gantiKavlingUseCase,
    approveBatalUseCase,
    approveGantiKavlingUseCase,
    getPengajuanBatalUseCase,
    getPengajuanGantiKavlingUseCase,
    regenerateSprUseCase,
  );

  const uploadBuktiTagihanUseCase = new UploadBuktiTagihanUseCase(
    tagihanRepo,
    cloudinaryService,
    penjualanRepo,
    generateSprPdfUseCase,
    notificationService,
  );
  const uploadBuktiRefundUseCase = new UploadBuktiRefundUseCase(
    dbClient,
    cloudinaryService,
  );
  const saveTagihanSignatureUseCase = new SaveTagihanSignatureUseCase(
    dbClient,
    cloudinaryService,
  );
  const approveBuktiTagihanUseCase = new ApproveBuktiTagihanUseCase(
    tagihanRepo,
    cloudinaryService,
    penjualanRepo,
    generateSprPdfUseCase,
  );
  const removeBuktiTagihanUseCase = new RemoveBuktiTagihanUseCase(
    tagihanRepo,
    cloudinaryService,
  );

  const tagihanController = new TagihanController(
    createTagihanUseCase,
    updateTagihanUseCase,
    getTagihanByIdUseCase,
    getTagihansPaginatedUseCase,
    deleteTagihanUseCase,
    uploadBuktiTagihanUseCase,
    uploadBuktiRefundUseCase,
    saveTagihanSignatureUseCase,
    approveBuktiTagihanUseCase,
    removeBuktiTagihanUseCase,
  );

  const kodeBillingPphRepo = new KodeBillingPphRepository(dbClient);
  const uploadKodeBillingPphUseCase = new UploadKodeBillingPphUseCase(
    kodeBillingPphRepo,
    dbClient,
    cloudinaryService,
    googleVisionService,
  );
  const uploadBuktiBayarKodeBillingPphUseCase =
    new UploadBuktiBayarKodeBillingPphUseCase(
      kodeBillingPphRepo,
      cloudinaryService,
    );
  const getKodeBillingPphPaginatedUseCase = new GetKodeBillingPphPaginatedUseCase(
    kodeBillingPphRepo,
  );
  const getKodeBillingPphByPenjualanUseCase = new GetKodeBillingPphByPenjualanUseCase(
    kodeBillingPphRepo,
  );
  const getAllKodeBillingPphByPenjualanUseCase =
    new GetAllKodeBillingPphByPenjualanUseCase(kodeBillingPphRepo);
  const kodeBillingPphController = new KodeBillingPphController(
    uploadKodeBillingPphUseCase,
    uploadBuktiBayarKodeBillingPphUseCase,
    getKodeBillingPphPaginatedUseCase,
    getKodeBillingPphByPenjualanUseCase,
    getAllKodeBillingPphByPenjualanUseCase,
  );

  const suketPphRepo = new SuketPphRepository(dbClient);
  const uploadSuketPphUseCase = new UploadSuketPphUseCase(
    suketPphRepo,
    dbClient,
    cloudinaryService,
  );
  const getSuketPphByPenjualanUseCase = new GetSuketPphByPenjualanUseCase(
    suketPphRepo,
  );
  const getAllSuketPphByPenjualanUseCase = new GetAllSuketPphByPenjualanUseCase(
    suketPphRepo,
  );
  const suketPphController = new SuketPphController(
    uploadSuketPphUseCase,
    getSuketPphByPenjualanUseCase,
    getAllSuketPphByPenjualanUseCase,
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
  const auditLogRepo = new AuditLogRepository(dbClient);
  const getAuditLogsPaginatedUseCase = new GetAuditLogsPaginatedUseCase(
    auditLogRepo,
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
    getCustomerDashboardUseCase,
    uploadBuktiTagihanUseCase,
  );
  const auditLogController = new AuditLogController(
    getAuditLogsPaginatedUseCase,
  );
  const progressPenjualanRepo = new ProgressPenjualanRepository(dbClient);
  const getProgressPenjualanUseCase = new GetProgressPenjualanUseCase(
    progressPenjualanRepo,
  );
  const updateProgressPenjualanUseCase = new UpdateProgressPenjualanUseCase(
    progressPenjualanRepo,
  );
  const uploadProgressDocumentUseCase = new UploadProgressDocumentUseCase(
    progressPenjualanRepo,
    cloudinaryService,
  );

  const progressPenjualanController = new ProgressPenjualanController(
    getProgressPenjualanUseCase,
    updateProgressPenjualanUseCase,
    uploadProgressDocumentUseCase,
  );
  const telegramBotService = new TelegramBotService(
    dbClient,
    uploadBuktiTagihanUseCase,
    uploadCustomerDocumentUseCase,
    uploadKavlingDocumentUseCase,
    uploadProgressDocumentUseCase,
    uploadBuktiPenjualanUseCase,
    uploadBuktiFeeUseCase,
  );
  const rolePermissionRepo = new RolePermissionRepository(dbClient);
  const upsertRolePermissionUseCase = new UpsertRolePermissionUseCase(
    rolePermissionRepo,
  );
  const getRolePermissionsUseCase = new GetRolePermissionsUseCase(
    rolePermissionRepo,
  );
  const deleteRolePermissionUseCase = new DeleteRolePermissionUseCase(
    rolePermissionRepo,
  );

  const rolePermissionController = new RolePermissionController(
    upsertRolePermissionUseCase,
    getRolePermissionsUseCase,
    deleteRolePermissionUseCase,
  );
  const perusahaanAgentRepo = new PerusahaanAgentRepository(dbClient);
  const perusahaanAgentUseCases = new PerusahaanAgentUseCases(
    perusahaanAgentRepo,
    cloudinaryService,
  );
  const perusahaanAgentController = new PerusahaanAgentController(
    perusahaanAgentUseCases,
  );
  const progressProyekRepo = new ProgressProyekRepository(dbClient);
  const getProgressProyekUseCase = new GetProgressProyekUseCase(
    progressProyekRepo,
  );
  const getProgressProyekByKavlingUseCase = new GetProgressProyekByKavlingUseCase(
    progressProyekRepo,
  );
  const getProgressProyekListPaginatedUseCase =
    new GetProgressProyekListPaginatedUseCase(progressProyekRepo);
  const updateProgressProyekUseCase = new UpdateProgressProyekUseCase(
    progressProyekRepo,
  );
  const uploadTahapanPhotoUseCase = new UploadTahapanPhotoUseCase(
    progressProyekRepo,
    cloudinaryService,
  );
  const uploadTahapanPhotoByKavlingUseCase =
    new UploadTahapanPhotoByKavlingUseCase(
      progressProyekRepo,
      cloudinaryService,
    );
  const createTahapanLogUseCase = new CreateTahapanLogUseCase(
    progressProyekRepo,
    cloudinaryService,
  );
  const createTahapanLogByKavlingUseCase = new CreateTahapanLogByKavlingUseCase(
    progressProyekRepo,
    cloudinaryService,
  );
  const listMandorsUseCase = new ListMandorsUseCase(userRepo);
  const setTotalProgressByKavlingUseCase = new SetTotalProgressByKavlingUseCase(
    progressProyekRepo,
  );
  const resetTotalProgressByKavlingUseCase =
    new ResetTotalProgressByKavlingUseCase(progressProyekRepo);
  const progressProyekController = new ProgressProyekController(
    getProgressProyekListPaginatedUseCase,
    getProgressProyekUseCase,
    getProgressProyekByKavlingUseCase,
    updateProgressProyekUseCase,
    uploadTahapanPhotoUseCase,
    uploadTahapanPhotoByKavlingUseCase,
    createTahapanLogUseCase,
    createTahapanLogByKavlingUseCase,
    listMandorsUseCase,
    setTotalProgressByKavlingUseCase,
    resetTotalProgressByKavlingUseCase,
  );

  const spkRepo = new SpkRepository(dbClient);
  const createSpkUseCase = new CreateSpkUseCase(spkRepo, cloudinaryService);
  const updateSpkUseCase = new UpdateSpkUseCase(spkRepo, cloudinaryService);
  const getSpkByIdUseCase = new GetSpkByIdUseCase(spkRepo);
  const getSpkPaginatedUseCase = new GetSpkPaginatedUseCase(spkRepo);
  const deleteSpkUseCase = new DeleteSpkUseCase(spkRepo);
  const spkController = new SpkController(
    createSpkUseCase,
    updateSpkUseCase,
    getSpkByIdUseCase,
    getSpkPaginatedUseCase,
    deleteSpkUseCase,
  );

  const spkPembayaranRepo = new SpkPembayaranRepository(dbClient);
  const createSpkPembayaranRequestUseCase = new CreateSpkPembayaranRequestUseCase(
    spkRepo,
    spkPembayaranRepo,
    notificationService,
  );
  const getSpkPembayaranBySpkUseCase = new GetSpkPembayaranBySpkUseCase(spkPembayaranRepo);
  const getSpkKasbonDraftUseCase = new GetSpkKasbonDraftUseCase(spkRepo, spkPembayaranRepo);
  const saveSpkKasbonDraftUseCase = new SaveSpkKasbonDraftUseCase(spkRepo, spkPembayaranRepo);
  const submitSpkKasbonDraftUseCase = new SubmitSpkKasbonDraftUseCase(
    spkRepo,
    spkPembayaranRepo,
    notificationService,
  );
  const getSpkPembayaranPaginatedUseCase = new GetSpkPembayaranPaginatedUseCase(
    spkPembayaranRepo,
  );
  const bayarSpkPembayaranUseCase = new BayarSpkPembayaranUseCase(
    spkRepo,
    spkPembayaranRepo,
    cloudinaryService,
    notificationService,
  );
  const addBuktiSpkPembayaranUseCase = new AddBuktiSpkPembayaranUseCase(
    spkPembayaranRepo,
    cloudinaryService,
  );
  const removeBuktiSpkPembayaranUseCase = new RemoveBuktiSpkPembayaranUseCase(
    spkPembayaranRepo,
    cloudinaryService,
  );
  const setBsiCmsDilaporkanUseCase = new SetBsiCmsDilaporkanUseCase(spkPembayaranRepo);
  const updateSpkKasbonUseCase = new UpdateSpkKasbonUseCase(
    spkPembayaranRepo,
    spkRepo,
  );
  const updateSpkUpahUseCase = new UpdateSpkUpahUseCase(spkPembayaranRepo, spkRepo);
  const deleteSpkPenguranganUseCase = new DeleteSpkPenguranganUseCase(
    spkPembayaranRepo,
    spkRepo,
  );
  const uploadKasbonFotoBonUseCase = new UploadKasbonFotoBonUseCase(
    cloudinaryService,
  );
  const approveSpkPembayaranUseCase = new ApproveSpkPembayaranUseCase(
    spkPembayaranRepo,
    spkRepo,
    notificationService,
  );
  const spkPembayaranController = new SpkPembayaranController(
    createSpkPembayaranRequestUseCase,
    getSpkPembayaranBySpkUseCase,
    getSpkKasbonDraftUseCase,
    saveSpkKasbonDraftUseCase,
    submitSpkKasbonDraftUseCase,
    getSpkPembayaranPaginatedUseCase,
    bayarSpkPembayaranUseCase,
    addBuktiSpkPembayaranUseCase,
    removeBuktiSpkPembayaranUseCase,
    setBsiCmsDilaporkanUseCase,
    updateSpkKasbonUseCase,
    updateSpkUpahUseCase,
    deleteSpkPenguranganUseCase,
    uploadKasbonFotoBonUseCase,
    approveSpkPembayaranUseCase,
  );

  const tukangRepo = new TukangRepository(dbClient);
  const tukangController = new TukangController(tukangRepo);

  const notarisPembayaranRepo = new NotarisPembayaranRepository(dbClient);
  const getNotarisPembayaranPaginatedUseCase = new GetNotarisPembayaranPaginatedUseCase(
    notarisPembayaranRepo,
  );
  const bayarNotarisPembayaranUseCase = new BayarNotarisPembayaranUseCase(
    notarisPembayaranRepo,
    cloudinaryService,
  );
  const setNotarisBsiCmsDilaporkanUseCase = new SetNotarisBsiCmsDilaporkanUseCase(
    notarisPembayaranRepo,
  );
  const syncAllNotarisPembayaranUseCase = new SyncAllNotarisPembayaranUseCase(
    notarisPembayaranRepo,
  );
  const notarisPembayaranController = new NotarisPembayaranController(
    getNotarisPembayaranPaginatedUseCase,
    bayarNotarisPembayaranUseCase,
    setNotarisBsiCmsDilaporkanUseCase,
    syncAllNotarisPembayaranUseCase,
  );

  const bankKprPembayaranRepo = new BankKprPembayaranRepository(dbClient);
  const getBankKprPembayaranPaginatedUseCase = new GetBankKprPembayaranPaginatedUseCase(
    bankKprPembayaranRepo,
  );
  const bayarBankKprPembayaranUseCase = new BayarBankKprPembayaranUseCase(
    bankKprPembayaranRepo,
    cloudinaryService,
  );
  const setBankKprBsiCmsDilaporkanUseCase = new SetBankKprBsiCmsDilaporkanUseCase(
    bankKprPembayaranRepo,
  );
  const syncAllBankKprPembayaranUseCase = new SyncAllBankKprPembayaranUseCase(
    bankKprPembayaranRepo,
  );
  const bankKprPembayaranController = new BankKprPembayaranController(
    getBankKprPembayaranPaginatedUseCase,
    bayarBankKprPembayaranUseCase,
    setBankKprBsiCmsDilaporkanUseCase,
    syncAllBankKprPembayaranUseCase,
  );

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
    kodeBillingPphController,
    suketPphController,
    penjualanController,
    feeAgentController,
    verifyController,
    auditLogController,
    progressPenjualanController,
    telegramBotService,
    rolePermissionController,
    socketService,
    notificationService,
    notificationController,
    perusahaanAgentController,
    progressProyekController,
    spkController,
    spkPembayaranController,
    tukangController,
    notarisPembayaranController,
    bankKprPembayaranController,
  };
};

export const container = createContainer(prisma as any);
