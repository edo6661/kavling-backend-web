-- AlterTable
ALTER TABLE `penjualan` ADD COLUMN `bank_kpr_nama_rekening` VARCHAR(100) NULL,
    ADD COLUMN `bank_kpr_atas_nama_rekening` VARCHAR(150) NULL,
    ADD COLUMN `bank_kpr_no_rekening` VARCHAR(50) NULL;
