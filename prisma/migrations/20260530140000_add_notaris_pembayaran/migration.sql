-- CreateTable
CREATE TABLE `notaris_pembayaran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `penjualan_id` INTEGER NOT NULL,
    `jenis` ENUM('biaya_notaris', 'bphtb') NOT NULL,
    `nominal` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('menunggu_pembayaran', 'sudah_dibayar') NOT NULL DEFAULT 'menunggu_pembayaran',
    `bukti_pembayaran` VARCHAR(500) NULL,
    `tanggal_pembayaran` DATE NULL,
    `bsi_cms_dilaporkan` BOOLEAN NOT NULL DEFAULT false,
    `bsi_cms_dilaporkan_at` DATETIME(3) NULL,
    `dibayar_oleh_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notaris_pembayaran_penjualan_id_jenis_key`(`penjualan_id`, `jenis`),
    INDEX `notaris_pembayaran_penjualan_id_fkey`(`penjualan_id`),
    INDEX `notaris_pembayaran_dibayar_oleh_id_fkey`(`dibayar_oleh_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notaris_pembayaran` ADD CONSTRAINT `notaris_pembayaran_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notaris_pembayaran` ADD CONSTRAINT `notaris_pembayaran_dibayar_oleh_id_fkey` FOREIGN KEY (`dibayar_oleh_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
