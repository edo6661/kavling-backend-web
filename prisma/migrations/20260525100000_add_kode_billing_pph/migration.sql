-- CreateTable
CREATE TABLE `kode_billing_pph` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `penjualan_id` INTEGER NULL,
    `kode_billing` VARCHAR(30) NOT NULL,
    `file_billing` VARCHAR(500) NOT NULL,
    `file_bukti_bayar` VARCHAR(500) NULL,
    `status` ENUM('MENUNGGU_BAYAR', 'SUDAH_BAYAR') NOT NULL DEFAULT 'MENUNGGU_BAYAR',
    `uploaded_by` INTEGER NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `kode_billing_pph_customer_id_fkey`(`customer_id`),
    INDEX `kode_billing_pph_penjualan_id_fkey`(`penjualan_id`),
    INDEX `kode_billing_pph_kode_billing_idx`(`kode_billing`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kode_billing_pph` ADD CONSTRAINT `kode_billing_pph_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kode_billing_pph` ADD CONSTRAINT `kode_billing_pph_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
