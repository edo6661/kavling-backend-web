-- Progress proyek dapat diikat ke kavling (tanpa penjualan) atau ke penjualan
ALTER TABLE `progress_proyek` ADD COLUMN `kavling_id` INTEGER NULL;

CREATE UNIQUE INDEX `progress_proyek_kavling_id_key` ON `progress_proyek`(`kavling_id`);

ALTER TABLE `progress_proyek` MODIFY `penjualan_id` INTEGER NULL;

ALTER TABLE `progress_proyek` ADD CONSTRAINT `progress_proyek_kavling_id_fkey` FOREIGN KEY (`kavling_id`) REFERENCES `kavling`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
