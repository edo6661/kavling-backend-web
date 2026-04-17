-- CreateTable
CREATE TABLE `riwayat_ganti_kavling` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `penjualan_id` INTEGER NOT NULL,
    `kavling_lama_id` INTEGER NOT NULL,
    `kavling_baru_id` INTEGER NOT NULL,
    `alasan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `riwayat_ganti_kavling` ADD CONSTRAINT `riwayat_ganti_kavling_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_ganti_kavling` ADD CONSTRAINT `riwayat_ganti_kavling_kavling_lama_id_fkey` FOREIGN KEY (`kavling_lama_id`) REFERENCES `kavling`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_ganti_kavling` ADD CONSTRAINT `riwayat_ganti_kavling_kavling_baru_id_fkey` FOREIGN KEY (`kavling_baru_id`) REFERENCES `kavling`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
