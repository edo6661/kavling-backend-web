import { PrismaClient, ProgressStatus } from "@prisma/client";

export async function seedProgressProyek(prisma: PrismaClient) {
  await prisma.progressProyek.createMany({
    data: [
      {
        kavlingId: 1,
        pelaksana: "H. Mandor Surya",
        tanggalLaporan: new Date("2026-04-10"),
        tahapanPekerjaan: "Pondasi dan Cakar Ayam",
        persentase: 15,
        keterangan: "Penggalian dan pemasangan batu kali selesai",
        kendala: "Hujan deras 2 hari berturut-turut",
        fotoLapangan: ["pondasi_1.jpg", "pondasi_2.jpg"],
        status: ProgressStatus.DISETUJUI,
      },
      {
        kavlingId: 1,
        pelaksana: "H. Mandor Surya",
        tanggalLaporan: new Date("2026-04-17"),
        tahapanPekerjaan: "Pemasangan Bata Merah",
        persentase: 35,
        keterangan: "Dinding lantai 1 hampir selesai",
        kendala: null,
        fotoLapangan: ["bata_1.jpg"],
        status: ProgressStatus.MENUNGGU_VERIFIKASI,
      },
    ],
  });
}
