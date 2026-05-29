-- AlterTable
ALTER TABLE `spk_pembayaran` ADD COLUMN `bsi_cms_dilaporkan` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `bsi_cms_dilaporkan_at` DATETIME(3) NULL;
