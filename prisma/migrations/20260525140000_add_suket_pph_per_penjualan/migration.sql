-- CreateTable
CREATE TABLE `suket_pph` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `penjualan_id` INTEGER NOT NULL,
    `file_suket` VARCHAR(500) NOT NULL,
    `uploaded_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `suket_pph_penjualan_id_key`(`penjualan_id`),
    INDEX `suket_pph_customer_id_fkey`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `suket_pph` ADD CONSTRAINT `suket_pph_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suket_pph` ADD CONSTRAINT `suket_pph_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
