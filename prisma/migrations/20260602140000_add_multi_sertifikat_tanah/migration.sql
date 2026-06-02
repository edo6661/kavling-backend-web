-- Tambah flag jumlah sertifikat tanah (default 1 = perilaku existing)
ALTER TABLE `kavling` ADD COLUMN `jumlah_sertifikat_tanah` INTEGER NOT NULL DEFAULT 1;

-- Tabel sertifikat tanah ke-2+ (tanah ke-1 tetap di kolom kavling)
CREATE TABLE `kavling_sertifikat_tanah_tambahan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kavling_id` INTEGER NOT NULL,
    `urutan` INTEGER NOT NULL,
    `file_pbg` VARCHAR(255) NULL,
    `file_sertifikat_tanah` VARCHAR(255) NULL,
    `file_nop_pbb` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kavling_sertifikat_tanah_tambahan_kavling_id_urutan_key`(`kavling_id`, `urutan`),
    INDEX `kavling_sertifikat_tanah_tambahan_kavling_id_fkey`(`kavling_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `kavling_sertifikat_tanah_tambahan` ADD CONSTRAINT `kavling_sertifikat_tanah_tambahan_kavling_id_fkey` FOREIGN KEY (`kavling_id`) REFERENCES `kavling`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Kode Billing PPh: dukung beberapa sertifikat per penjualan
ALTER TABLE `kode_billing_pph` ADD COLUMN `sertifikat_urutan` INTEGER NOT NULL DEFAULT 1;

-- Buat index composite DULU agar FK penjualan_id tetap terpenuhi, baru drop unique lama
CREATE UNIQUE INDEX `kode_billing_pph_penjualan_id_sertifikat_urutan_key` ON `kode_billing_pph`(`penjualan_id`, `sertifikat_urutan`);

ALTER TABLE `kode_billing_pph` DROP INDEX `kode_billing_pph_penjualan_id_key`;

-- Suket PPh: dukung beberapa sertifikat per penjualan
ALTER TABLE `suket_pph` ADD COLUMN `sertifikat_urutan` INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX `suket_pph_penjualan_id_sertifikat_urutan_key` ON `suket_pph`(`penjualan_id`, `sertifikat_urutan`);

ALTER TABLE `suket_pph` DROP INDEX `suket_pph_penjualan_id_key`;
