-- CreateTable
CREATE TABLE `faktur_pajak_ppn` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `penjualan_id` INTEGER NOT NULL,
    `sertifikat_urutan` INTEGER NOT NULL DEFAULT 1,
    `file_faktur` VARCHAR(500) NOT NULL,
    `uploaded_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `faktur_pajak_ppn_penjualan_id_sertifikat_urutan_key`(`penjualan_id`, `sertifikat_urutan`),
    INDEX `faktur_pajak_ppn_customer_id_fkey`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `faktur_pajak_ppn` ADD CONSTRAINT `faktur_pajak_ppn_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faktur_pajak_ppn` ADD CONSTRAINT `faktur_pajak_ppn_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
