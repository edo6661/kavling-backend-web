-- AlterTable: kolom nullable agar data tukang existing tetap valid
ALTER TABLE `tukang` ADD COLUMN `file_ktp` VARCHAR(255) NULL;
