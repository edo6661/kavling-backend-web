import type { PrismaClient } from "@prisma/client";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

type ITtdData = Record<
  string,
  {
    nama: string;
    tanggal: string;
    url: string;
  }
>;

export class SaveTagihanSignatureUseCase {
  constructor(
    private readonly db: PrismaClient,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    id: number,
    signatureBase64: string,
    nama: string,
    peran: string,
    tanggal: string,
  ) {
    const tagihan = await this.db.tagihan.findUnique({ where: { id } });
    if (!tagihan) throw new NotFoundError("Data Tagihan tidak ditemukan");

    const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const imageUrl = await this.cloudinaryService.uploadImage(
      buffer,
      `bumantara/signatures/tagihan/${tagihan.noTagihan}`,
    );

    const existingTtd = (tagihan.ttdData as unknown as ITtdData) || {};

    if (existingTtd[peran]?.url) {
      await this.cloudinaryService
        .deleteImageByUrl(existingTtd[peran].url)
        .catch((err) =>
          console.error(`Gagal menghapus TTD lama tagihan ${peran}:`, err),
        );
    }

    const updatedTtd: ITtdData = {
      ...existingTtd,
      [peran]: { nama, tanggal, url: imageUrl },
    };

    return await this.db.tagihan.update({
      where: { id },
      data: { ttdData: updatedTtd as any },
    });
  }
}
