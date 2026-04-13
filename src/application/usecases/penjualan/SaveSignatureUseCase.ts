import type { PrismaClient } from "@prisma/client";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type { GenerateSprPdfUseCase } from "./GenerateSprPdfUseCase.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class SaveSignatureUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly cloudinaryService: CloudinaryService,
    private readonly generateSprPdfUseCase: GenerateSprPdfUseCase,
  ) {}

  async execute(
    noTransaksi: string,
    signatureBase64: string,
    nama: string,
    peran: string,
    tanggal: string,
  ) {
    const penjualan = await this.db.penjualan.findUnique({
      where: { noTransaksi },
    });

    if (!penjualan) throw new NotFoundError("Data Penjualan tidak ditemukan");

    const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const imageUrl = await this.cloudinaryService.uploadImage(
      buffer,
      `bumantara/signatures/${penjualan.noTransaksi}`,
    );

    const existingTtd = (penjualan.ttdData as any) ?? {};
    const updatedTtd = {
      ...existingTtd,
      [peran]: { nama, tanggal, url: imageUrl },
    };

    await this.db.penjualan.update({
      where: { id: penjualan.id },
      data: { ttdData: updatedTtd },
    });

    try {
      const pdfBuffer = await this.generateSprPdfUseCase.execute(penjualan.id);
      const sprUrl = await this.cloudinaryService.uploadFile(
        pdfBuffer,
        "bumantara/spr",
      );

      const result = await this.db.penjualan.update({
        where: { id: penjualan.id },
        data: { fileSpr: sprUrl },
      });

      return result;
    } catch (error) {
      console.error("Gagal re-generate SPR dengan TTD:", error);

      return penjualan;
    }
  }
}
