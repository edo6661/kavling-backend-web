-- AlterTable: kolom nullable agar data tukang existing tetap valid
ALTER TABLE `tukang` ADD COLUMN `sudah_menikah` BOOLEAN NULL;
ALTER TABLE `tukang` ADD COLUMN `jumlah_anak` INTEGER NULL;
