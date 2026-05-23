-- DropForeignKey (if exists from old schema - safe on fresh)
DROP TABLE IF EXISTS `spk_penjualan`;
DROP TABLE IF EXISTS `spk`;

CREATE TABLE `spk` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `no_spk` VARCHAR(100) NOT NULL,
    `tanggal_spk` DATE NOT NULL,
    `judul_pekerjaan` VARCHAR(255) NOT NULL,
    `nilai_kontrak` DECIMAL(15, 2) NOT NULL,
    `notes_pekerjaan` TEXT NULL,
    `jatuh_tempo` DATE NULL,
    `file_spk` VARCHAR(255) NULL,
    `mandor_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `spk_no_spk_key`(`no_spk`),
    INDEX `spk_mandor_id_fkey`(`mandor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `spk_penjualan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spk_id` INTEGER NOT NULL,
    `penjualan_id` INTEGER NOT NULL,

    UNIQUE INDEX `spk_penjualan_penjualan_id_key`(`penjualan_id`),
    INDEX `spk_penjualan_spk_id_fkey`(`spk_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `spk` ADD CONSTRAINT `spk_mandor_id_fkey` FOREIGN KEY (`mandor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `spk_penjualan` ADD CONSTRAINT `spk_penjualan_spk_id_fkey` FOREIGN KEY (`spk_id`) REFERENCES `spk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `spk_penjualan` ADD CONSTRAINT `spk_penjualan_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
