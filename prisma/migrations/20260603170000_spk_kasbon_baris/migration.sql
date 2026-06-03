-- CreateTable
CREATE TABLE `spk_pembayaran_kasbon_baris` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spk_pembayaran_id` INTEGER NOT NULL,
    `keterangan` VARCHAR(500) NOT NULL,
    `tanggal_po` DATE NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,

    INDEX `spk_pembayaran_kasbon_baris_spk_pembayaran_id_fkey`(`spk_pembayaran_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `spk_pembayaran_kasbon_baris` ADD CONSTRAINT `spk_pembayaran_kasbon_baris_spk_pembayaran_id_fkey` FOREIGN KEY (`spk_pembayaran_id`) REFERENCES `spk_pembayaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
