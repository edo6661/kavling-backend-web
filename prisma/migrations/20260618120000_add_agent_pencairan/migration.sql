-- CreateTable
CREATE TABLE `agent_pencairan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fee_agent_id` INTEGER NOT NULL,
    `penjualan_id` INTEGER NOT NULL,
    `agent_id` INTEGER NOT NULL,
    `closing_nominal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `marketing_nominal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `potongan_pph` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_nominal` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('menunggu_pembayaran', 'sudah_dibayar') NOT NULL DEFAULT 'menunggu_pembayaran',
    `bukti_pembayaran` VARCHAR(500) NULL,
    `tanggal_pembayaran` DATE NULL,
    `bsi_cms_dilaporkan` BOOLEAN NOT NULL DEFAULT false,
    `bsi_cms_dilaporkan_at` DATETIME(3) NULL,
    `diajukan_oleh_id` INTEGER NOT NULL,
    `dibayar_oleh_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agent_pencairan_fee_agent_id_key`(`fee_agent_id`),
    UNIQUE INDEX `agent_pencairan_penjualan_id_key`(`penjualan_id`),
    INDEX `agent_pencairan_agent_id_fkey`(`agent_id`),
    INDEX `agent_pencairan_diajukan_oleh_id_fkey`(`diajukan_oleh_id`),
    INDEX `agent_pencairan_dibayar_oleh_id_fkey`(`dibayar_oleh_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agent_pencairan` ADD CONSTRAINT `agent_pencairan_fee_agent_id_fkey` FOREIGN KEY (`fee_agent_id`) REFERENCES `fee_agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_pencairan` ADD CONSTRAINT `agent_pencairan_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_pencairan` ADD CONSTRAINT `agent_pencairan_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_pencairan` ADD CONSTRAINT `agent_pencairan_diajukan_oleh_id_fkey` FOREIGN KEY (`diajukan_oleh_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_pencairan` ADD CONSTRAINT `agent_pencairan_dibayar_oleh_id_fkey` FOREIGN KEY (`dibayar_oleh_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
