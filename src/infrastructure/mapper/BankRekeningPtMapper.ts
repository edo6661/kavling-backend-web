import type {
  BankRekeningPt as PrismaBankRekeningPt,
  Perumahan,
} from "@prisma/client";

type BankRekeningPtWithRelation = PrismaBankRekeningPt & {
  perumahan?: Perumahan;
};

export class BankRekeningPtMapper {
  static toDomain(prismaBankRekeningPt: BankRekeningPtWithRelation) {
    return {
      id: prismaBankRekeningPt.id,
      perumahanId: prismaBankRekeningPt.perumahanId,
      perumahan: prismaBankRekeningPt.perumahan?.nama ?? "",
      namaBank: prismaBankRekeningPt.namaBank,
      noRekening: prismaBankRekeningPt.noRekening,
      atasNama: prismaBankRekeningPt.atasNama,
      createdAt: prismaBankRekeningPt.createdAt,
    };
  }
}
