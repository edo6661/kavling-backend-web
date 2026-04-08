import type { BankRekeningPt as PrismaBankRekeningPt } from "@prisma/client";
import type { BankRekeningPtEntity } from "../../domain/entities/BankRekeningPt.js";

export class BankRekeningPtMapper {
  static toDomain(
    prismaBankRekeningPt: PrismaBankRekeningPt,
  ): BankRekeningPtEntity {
    return {
      id: prismaBankRekeningPt.id,
      namaBank: prismaBankRekeningPt.namaBank,
      noRekening: prismaBankRekeningPt.noRekening,
      atasNama: prismaBankRekeningPt.atasNama,
      createdAt: prismaBankRekeningPt.createdAt,
    };
  }
}
