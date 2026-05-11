import type { ITagihanRepository } from "../../../domain/repositories/ITagihanRepo.js";
import type { IPenjualanRepository } from "../../../domain/repositories/IPenjualanRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { GenerateSprPdfUseCase } from "../penjualan/GenerateSprPdfUseCase.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class ApproveBuktiTagihanUseCase {
  constructor(
    private readonly repo: ITagihanRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly penjualanRepo: IPenjualanRepository,
    private readonly generateSprPdfUseCase: GenerateSprPdfUseCase,
  ) {}

  async execute(id: number, isApproved: boolean) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Tagihan tidak ditemukan");

    if (!isApproved) {
      if (existing.fileBukti) {
        await this.cloudinaryService.deleteImageByUrl(existing.fileBukti);
      }
      return await this.repo.update(id, {
        status: "BELUM_BAYAR",
        fileBukti: null,
      });
    }

    const updatedTagihan = await this.repo.update(id, {
      status: "LUNAS",
    });

    if (existing.pembayaran.toLowerCase().includes("booking")) {
      try {
        const pdfBuffer = await this.generateSprPdfUseCase.execute(
          existing.penjualanId,
        );
        const pdfUrl = await this.cloudinaryService.uploadFile(
          pdfBuffer,
          "bumantara/spr",
        );
        await this.penjualanRepo.update(existing.penjualanId, {
          fileSpr: pdfUrl,
        });
      } catch (error) {
        console.error("Gagal auto-generate SPR setelah approve:", error);
      }
    }

    return updatedTagihan;
  }
}
