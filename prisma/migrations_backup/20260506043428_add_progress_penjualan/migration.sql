-- CreateTable
CREATE TABLE `progress_penjualan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `penjualan_id` INTEGER NOT NULL,
    `berkas_customer_valid` BOOLEAN NOT NULL DEFAULT false,
    `file_sp3k` VARCHAR(255) NULL,
    `file_salinan_ajb` VARCHAR(255) NULL,
    `file_ppjb` VARCHAR(255) NULL,
    `nilai_ajb` DECIMAL(15, 2) NULL,
    `biaya_bphtb` DECIMAL(15, 2) NULL,
    `biaya_pph` DECIMAL(15, 2) NULL,
    `file_ajb` VARCHAR(255) NULL,
    `file_bast` VARCHAR(255) NULL,
    `checklist_bast` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `progress_penjualan_penjualan_id_key`(`penjualan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `progress_penjualan` ADD CONSTRAINT `progress_penjualan_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
