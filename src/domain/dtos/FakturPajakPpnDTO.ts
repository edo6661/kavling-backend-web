export interface FakturPajakPpnResponseDTO {
  id: number;
  customerId: number;
  namaCustomer: string;
  penjualanId: number;
  sertifikatUrutan: number;
  perumahan: string | null;
  blok: string | null;
  nomorUnit: string | null;
  fileFaktur: string;
  createdAt: string;
  updatedAt: string;
}
