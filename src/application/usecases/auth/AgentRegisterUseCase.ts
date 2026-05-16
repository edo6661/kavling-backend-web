import type { PrismaClient } from "@prisma/client";
import { Role, AgentStatus, AgentType } from "@prisma/client";
import { hashPassword } from "../../../utils/hashing.js";
import { ConflictError } from "../../../domain/errors/ConflictError.js";
import type { RegisterAgentDTO } from "../../../domain/dtos/AgentDTO.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { GenerateSuratPernyataanPdfUseCase } from "../agent/GenerateSuratPernyataanPdfUseCase.js";
import type { EmailService } from "../../../infrastructure/external/EmailService.js";

export class RegisterAgentUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly cloudinary: CloudinaryService,
    private readonly generateSuratPernyataanPdf: GenerateSuratPernyataanPdfUseCase,
    private readonly emailService: EmailService,
  ) {}

  async execute(data: RegisterAgentDTO) {
    const result = await this.db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser)
        throw new ConflictError("Email sudah terdaftar di sistem");

      const existingAgent = await tx.agent.findUnique({
        where: { nik: data.nik },
      });
      if (existingAgent) throw new ConflictError("NIK Agent sudah terdaftar");

      const hashedPassword = await hashPassword(data.password);

      const user = await tx.user.create({
        data: {
          username: data.nama,
          email: data.email,
          password: hashedPassword,
          role: Role.AGENT,
        },
      });

      const agent = await tx.agent.create({
        data: {
          userId: user.id,
          nik: data.nik,
          nama: data.nama,
          noHp: data.noHp,
          email: data.email,
          alamat: data.alamat ?? null,
          status: AgentStatus.PENDING,
          type: data.type ?? AgentType.PRIBADI,
          namaBank: data.namaBank ?? null,
          noRekening: data.noRekening ?? null,
          atasNamaRekening: data.atasNamaRekening ?? null,
          perusahaanAgentId: data.perusahaanAgentId ?? null,
          ttdData: data.ttdData ?? null,
        },
        include: { perusahaanAgent: true },
      });

      return { user, agent };
    });

    try {
      const namaPerusahaan = result.agent.perusahaanAgent?.nama ?? "Pribadi";
      const pdfBuffer = await this.generateSuratPernyataanPdf.execute({
        nama: result.agent.nama,
        perusahaan: namaPerusahaan,
        alamat: result.agent.alamat ?? "",
      });
      this.emailService
        .sendAgentRegistrationEmail(data.email, pdfBuffer, result.agent.nama)
        .catch((err) => console.error("Gagal kirim email:", err));

      const pdfUrl = await this.cloudinary.uploadFile(
        pdfBuffer,
        "bumantara/agents/surat_pernyataan_default",
      );

      await this.db.agent.update({
        where: { id: result.agent.id },
        data: { defaultSuratPernyataan: pdfUrl },
      });
    } catch (err) {
      console.error("Gagal generate/upload Surat Pernyataan Default:", err);
    }

    return {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
      role: result.user.role,
    };
  }
}
