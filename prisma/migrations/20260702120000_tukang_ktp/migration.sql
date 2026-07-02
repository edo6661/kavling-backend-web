-- AlterTable: kolom nullable agar data tukang existing tetap valid
ALTER TABLE `tukang` ADD COLUMN `ktp` VARCHAR(20) NULL;
