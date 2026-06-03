-- AlterTable
ALTER TABLE `spk_pembayaran` ADD COLUMN `tanggal_dari` DATE NULL,
    ADD COLUMN `tanggal_sampai` DATE NULL;

-- AlterTable (enum)
ALTER TABLE `spk_pembayaran` MODIFY `jenis` ENUM('termin_55', 'termin_100', 'retensi', 'kasbon', 'upah') NOT NULL;

-- CreateTable
CREATE TABLE `tukang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nik` VARCHAR(20) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tukang_nik_key`(`nik`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spk_pembayaran_upah_baris` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spk_pembayaran_id` INTEGER NOT NULL,
    `tukang_id` INTEGER NULL,
    `nik` VARCHAR(20) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,

    INDEX `spk_pembayaran_upah_baris_spk_pembayaran_id_fkey`(`spk_pembayaran_id`),
    INDEX `spk_pembayaran_upah_baris_tukang_id_fkey`(`tukang_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `spk_pembayaran_upah_baris` ADD CONSTRAINT `spk_pembayaran_upah_baris_spk_pembayaran_id_fkey` FOREIGN KEY (`spk_pembayaran_id`) REFERENCES `spk_pembayaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spk_pembayaran_upah_baris` ADD CONSTRAINT `spk_pembayaran_upah_baris_tukang_id_fkey` FOREIGN KEY (`tukang_id`) REFERENCES `tukang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
