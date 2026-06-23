-- CreateTable
CREATE TABLE `mandor_rekening` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mandor_id` INTEGER NOT NULL,
    `label` VARCHAR(100) NULL,
    `nama_bank` VARCHAR(100) NOT NULL,
    `no_rekening` VARCHAR(50) NOT NULL,
    `atas_nama_rekening` VARCHAR(150) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `mandor_rekening_mandor_id_fkey`(`mandor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrate existing mandor single account to mandor_rekening
INSERT INTO `mandor_rekening` (`mandor_id`, `label`, `nama_bank`, `no_rekening`, `atas_nama_rekening`, `is_default`, `created_at`, `updated_at`)
SELECT `id`, 'Utama', `nama_bank`, `no_rekening`, `atas_nama_rekening`, true, `created_at`, `updated_at`
FROM `mandors`;

-- AlterTable
ALTER TABLE `spk_pembayaran` ADD COLUMN `mandor_rekening_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `spk_pembayaran_mandor_rekening_id_fkey` ON `spk_pembayaran`(`mandor_rekening_id`);

-- AddForeignKey
ALTER TABLE `mandor_rekening` ADD CONSTRAINT `mandor_rekening_mandor_id_fkey` FOREIGN KEY (`mandor_id`) REFERENCES `mandors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spk_pembayaran` ADD CONSTRAINT `spk_pembayaran_mandor_rekening_id_fkey` FOREIGN KEY (`mandor_rekening_id`) REFERENCES `mandor_rekening`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
