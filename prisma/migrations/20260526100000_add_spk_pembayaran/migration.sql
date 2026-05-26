-- CreateEnum
CREATE TABLE `spk_pembayaran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spk_id` INTEGER NOT NULL,
    `jenis` ENUM('termin_55', 'termin_100', 'retensi') NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('menunggu_pembayaran', 'sudah_dibayar') NOT NULL DEFAULT 'menunggu_pembayaran',
    `bukti_pembayaran` VARCHAR(500) NULL,
    `tanggal_pembayaran` DATE NULL,
    `diajukan_oleh_id` INTEGER NOT NULL,
    `dibayar_oleh_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `spk_pembayaran_spk_id_jenis_key`(`spk_id`, `jenis`),
    INDEX `spk_pembayaran_spk_id_fkey`(`spk_id`),
    INDEX `spk_pembayaran_diajukan_oleh_id_fkey`(`diajukan_oleh_id`),
    INDEX `spk_pembayaran_dibayar_oleh_id_fkey`(`dibayar_oleh_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `spk_pembayaran` ADD CONSTRAINT `spk_pembayaran_spk_id_fkey` FOREIGN KEY (`spk_id`) REFERENCES `spk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `spk_pembayaran` ADD CONSTRAINT `spk_pembayaran_diajukan_oleh_id_fkey` FOREIGN KEY (`diajukan_oleh_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `spk_pembayaran` ADD CONSTRAINT `spk_pembayaran_dibayar_oleh_id_fkey` FOREIGN KEY (`dibayar_oleh_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
