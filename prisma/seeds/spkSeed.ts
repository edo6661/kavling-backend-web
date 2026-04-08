import { PrismaClient } from "@prisma/client";

export async function seedSpk(prisma: PrismaClient) {
  await prisma.spk.createMany({
    data: [
      {
        noSpk: "SPK/001/SAR/IV/2026",
        tanggalSpk: new Date("2026-04-01"),
        judulPekerjaan: "Pembangunan Unit Rumah Blok A1 No. 01 & 02",
        lokasi: "Sari Asih Residence Tangerang",
        jangkaWaktu: 90,
        nilaiKontrak: 300000000.0,
        namaPihakPertama: "Direktur PT Sari Asih Group",
        nikPihakPertama: "3671000055556666",
        namaPihakKedua: "H. Mandor Surya",
        nikPihakKedua: "3671000077778888",
        alamatPihakKedua: "Jl. Pembangunan Raya No. 99, Tangerang",
        namaBank: "BCA",
        noRekening: "1234567890",
        atasNamaRekening: "Surya",
      },
    ],
  });
}
