-- AlterTable
ALTER TABLE `detail_kavling_pajak` ADD COLUMN `biaya_notaris` DECIMAL(15, 2) NULL;

-- AlterTable
ALTER TABLE `notaris` ADD COLUMN `nomor_ijin` VARCHAR(50) NULL,
    ADD COLUMN `nomor_ktp` VARCHAR(20) NULL;
