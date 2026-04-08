import type { ISprRepository } from "../../../domain/repositories/ISprRepo.js";
import type { ICustomerRepository } from "../../../domain/repositories/ICustomerRepo.js";
import { NotFoundError } from "../../../domain/errors/NotFoundError.js";

export class GetCustomerTrackRecordUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly sprRepo: ISprRepository,
  ) {}

  async execute(userId: number) {
    const customer = await this.customerRepo.findByUserId(userId);

    if (!customer) {
      throw new NotFoundError(
        "Data profil Customer belum lengkap atau belum ditautkan dengan akun ini.",
      );
    }

    const trackRecords = await this.sprRepo.findTrackRecordByCustomerId(
      customer.id,
    );

    return {
      profile: customer,
      trackRecords: trackRecords,
    };
  }
}
