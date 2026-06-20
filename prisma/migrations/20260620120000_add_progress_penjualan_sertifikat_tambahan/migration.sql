-- Tanah ke-1 tetap di progress_penjualan; tanah ke-2+ di tabel baru (additive, tidak mengubah data existing)
CREATE TABLE `progress_penjualan_sertifikat_tambahan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `penjualan_id` INTEGER NOT NULL,
    `urutan` INTEGER NOT NULL,
    `file_ppjb` VARCHAR(255) NULL,
    `nilai_ajb` DECIMAL(15, 2) NULL,
    `biaya_bphtb` DECIMAL(15, 2) NULL,
    `biaya_pph` DECIMAL(15, 2) NULL,
    `file_ajb` VARCHAR(255) NULL,
    `nomor_ajb` VARCHAR(100) NULL,
    `tanggal_ajb` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `progress_penjualan_sertifikat_tambahan_penjualan_id_urutan_key`(`penjualan_id`, `urutan`),
    INDEX `progress_penjualan_sertifikat_tambahan_penjualan_id_fkey`(`penjualan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `progress_penjualan_sertifikat_tambahan` ADD CONSTRAINT `progress_penjualan_sertifikat_tambahan_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `progress_penjualan`(`penjualan_id`) ON DELETE CASCADE ON UPDATE CASCADE;
