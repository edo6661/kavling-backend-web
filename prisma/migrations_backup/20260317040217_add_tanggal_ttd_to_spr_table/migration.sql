-- AlterTable
ALTER TABLE `spr` ADD COLUMN `tanggalTtdManager` DATETIME(3) NULL,
    ADD COLUMN `tanggalTtdMarketing` DATETIME(3) NULL,
    ADD COLUMN `tanggalTtdPemesan` DATETIME(3) NULL,
    ADD COLUMN `tanggalTtdSalesAdmin` DATETIME(3) NULL,
    ADD COLUMN `tanggalTtdSupervisor` DATETIME(3) NULL;
