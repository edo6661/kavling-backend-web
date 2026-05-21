-- AlterTable
ALTER TABLE `tagihan` ADD COLUMN `file_bukti_refund` VARCHAR(255) NULL,
    ADD COLUMN `is_refunded` BOOLEAN NOT NULL DEFAULT false;
