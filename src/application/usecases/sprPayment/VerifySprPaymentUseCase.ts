import type { ISprPaymentRepository } from "../../../domain/repositories/ISprPaymentRepo.js";
import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";
import type { IMasterDataProgressRepository } from "../../../domain/repositories/IMasterDataProgressRepo.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";
import { SprPaymentMapper } from "../../../infrastructure/mapper/SprPaymentMapper.js";
import type { SprPaymentResponseDTO } from "../../../domain/dtos/SprPaymentDTO.js";

export class VerifySprPaymentUseCase {
  constructor(
    private readonly sprPaymentRepo: ISprPaymentRepository,
    private readonly sprRepo: ISprRepository,
    private readonly masterDataProgressRepo: IMasterDataProgressRepository,
  ) {}

  async execute(
    id: number,
    isApproved: boolean,
  ): Promise<SprPaymentResponseDTO> {
    const payment = await this.sprPaymentRepo.findById(id);
    if (!payment) {
      throw new NotFoundError("Data pembayaran tidak ditemukan");
    }

    const newStatus = isApproved ? "LUNAS" : "BELUM_BAYAR";

    const updatedPayment = await this.sprPaymentRepo.update(id, {
      statusPembayaran: newStatus,
    });

    if (
      isApproved &&
      payment.keterangan.toLowerCase().includes("booking fee")
    ) {
      const spr = await this.sprRepo.findById(payment.sprId);

      if (spr?.status === "DRAFT") {
        await this.sprRepo.update(spr.id, { status: "AKTIF" });

        const existingProgress = await this.masterDataProgressRepo.findBySprId(
          spr.id,
        );
        if (!existingProgress) {
          await this.masterDataProgressRepo.create({ sprId: spr.id });
        }
      }
    }

    return SprPaymentMapper.toDomain(updatedPayment);
  }
}
