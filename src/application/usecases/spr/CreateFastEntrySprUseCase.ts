import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";
import type { CloudinaryService } from "../../../infrastructure/external/CloudinaryService.js";
import type {
  FastEntrySprDTO,
  FastEntrySprFiles,
  SprResponseDTO,
} from "../../../domain/dtos/SprDTO.js";
import { SprMapper } from "../../../infrastructure/mapper/SprMapper.js";

export class CreateFastEntrySprUseCase {
  constructor(
    private readonly sprRepo: ISprRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(
    data: FastEntrySprDTO,
    files: FastEntrySprFiles = {},
  ): Promise<SprResponseDTO> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    const nomorSpr = `SPR-FE-${dateStr}-${randomStr}`;

    let fileKtpUrl,
      fileKkUrl,
      fileNpwpUrl,
      buktiBookingUrl,
      buktiClosingUrl,
      buktiMarketingUrl;
    const uploadPromises = [];

    if (files?.fileKtp)
      uploadPromises.push(
        this.cloudinaryService
          .uploadImage(files.fileKtp, "customer_fileKtp")
          .then((url) => (fileKtpUrl = url)),
      );
    if (files?.fileKk)
      uploadPromises.push(
        this.cloudinaryService
          .uploadImage(files.fileKk, "customer_fileKk")
          .then((url) => (fileKkUrl = url)),
      );
    if (files?.fileNpwp)
      uploadPromises.push(
        this.cloudinaryService
          .uploadImage(files.fileNpwp, "customer_fileNpwp")
          .then((url) => (fileNpwpUrl = url)),
      );
    if (files?.buktiTransferBookingFee)
      uploadPromises.push(
        this.cloudinaryService
          .uploadImage(files.buktiTransferBookingFee, "bukti_transfer")
          .then((url) => (buktiBookingUrl = url)),
      );
    if (files?.buktiTransferClosingFee)
      uploadPromises.push(
        this.cloudinaryService
          .uploadImage(files.buktiTransferClosingFee, "bukti_transfer")
          .then((url) => (buktiClosingUrl = url)),
      );
    if (files?.buktiTransferMarketingFee)
      uploadPromises.push(
        this.cloudinaryService
          .uploadImage(files.buktiTransferMarketingFee, "bukti_transfer")
          .then((url) => (buktiMarketingUrl = url)),
      );

    await Promise.all(uploadPromises);

    const fileUrls = {
      fileKtp: fileKtpUrl,
      fileKk: fileKkUrl,
      fileNpwp: fileNpwpUrl,
      buktiTransferBookingFee: buktiBookingUrl,
      buktiTransferClosingFee: buktiClosingUrl,
      buktiTransferMarketingFee: buktiMarketingUrl,
    };

    const spr = await this.sprRepo.createFastEntry(data, fileUrls, nomorSpr);

    return SprMapper.toDomain(spr);
  }
}
