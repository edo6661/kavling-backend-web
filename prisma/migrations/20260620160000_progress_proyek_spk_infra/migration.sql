-- AlterTable
ALTER TABLE `progress_proyek` ADD COLUMN `spk_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `progress_proyek_spk_id_key` ON `progress_proyek`(`spk_id`);

-- CreateIndex
CREATE INDEX `progress_proyek_spk_id_fkey` ON `progress_proyek`(`spk_id`);

-- AddForeignKey
ALTER TABLE `progress_proyek` ADD CONSTRAINT `progress_proyek_spk_id_fkey` FOREIGN KEY (`spk_id`) REFERENCES `spk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
