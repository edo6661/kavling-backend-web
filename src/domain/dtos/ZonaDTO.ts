export interface CreateZonaDTO {
  nama: string;
  hgb: string;
  luas: string;
  deskripsi: string;
}

export interface UpdateZonaDTO {
  nama?: string;
  hgb?: string;
  luas?: string;
  deskripsi?: string;
}

export interface ZonaFilterDTO {
  search?: string;
}
