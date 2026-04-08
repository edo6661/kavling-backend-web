import { PrismaClient } from "@prisma/client";

export async function seedCustomer(prisma: PrismaClient) {
  await prisma.customer.createMany({
    data: [
      {
        userId: 3,
        nikKtp: "3671000011112222",
        nama: "Budi Gunawan",
        noHp: "081122334455",
        alamatKtp: "Jl. Anggrek No. 15, RT 01/RW 02, Karawaci, Tangerang",
        alamatTinggal: "Jl. Anggrek No. 15, RT 01/RW 02, Karawaci, Tangerang",
        email: "budigunawan@example.com",
        pekerjaan: "Pegawai Swasta",
        perusahaan: "PT Maju Terus Pantang Mundur",
        bank: "BCA",
        alamatKoresponden: "Sama dengan KTP",
      },
      {
        userId: null,
        nikKtp: "3671000033334444",
        nama: "Siti Rahmawati",
        noHp: "081998877665",
        alamatKtp: "Perumahan Dasana Indah Blok BA No. 4, Tangerang",
        alamatTinggal: "Perumahan Dasana Indah Blok BA No. 4, Tangerang",
        email: "sitirahma@example.com",
        pekerjaan: "Wiraswasta",
        perusahaan: "Toko Kelontong Rahma",
        bank: "Mandiri",
        alamatKoresponden: "Sama dengan KTP",
      },
    ],
  });
}
