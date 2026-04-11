import type { IPenjualanRepository } from "../../../domain/repositories/IPenjualanRepo.js";
import type {
  CreatePenjualanDTO,
  PenjualanResponseDTO,
} from "../../../domain/dtos/PenjualanDTO.js";

export class CreatePenjualanUseCase {
  constructor(private readonly penjualanRepo: IPenjualanRepository) {}

  async execute(data: CreatePenjualanDTO): Promise<PenjualanResponseDTO> {
    const penjualan = await this.penjualanRepo.createWithTransaction(data);

    return {
      id: penjualan.id,
      noTransaksi: penjualan.noTransaksi,
      tanggal: penjualan.tanggal,
      customer: {
        id: penjualan.customer.id,
        nama: penjualan.customer.nama,
      },
      kavling: {
        id: penjualan.kavling.id,
        blok: penjualan.kavling.blok,
        nomorUnit: penjualan.kavling.nomorUnit,
        perumahan: penjualan.kavling.perumahan.nama,
      },
      caraPembayaran: penjualan.caraPembayaran,
      hargaJual: Number(penjualan.hargaJual),
      status: penjualan.status,
      createdAt: penjualan.createdAt,
    };
  }
}
