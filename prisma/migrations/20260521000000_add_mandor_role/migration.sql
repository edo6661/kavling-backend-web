-- Add MANDOR role
ALTER TABLE `role_permissions` MODIFY `role` ENUM('superadmin', 'admin', 'finance', 'marketing', 'customer', 'bank', 'agent', 'mandor') NOT NULL;
ALTER TABLE `users` MODIFY `role` ENUM('superadmin', 'admin', 'finance', 'marketing', 'customer', 'bank', 'agent', 'mandor') NOT NULL;

-- Replace pelaksana with mandor_id on progress_proyek
ALTER TABLE `progress_proyek` ADD COLUMN `mandor_id` INTEGER NULL;
ALTER TABLE `progress_proyek` ADD CONSTRAINT `progress_proyek_mandor_id_fkey` FOREIGN KEY (`mandor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX `progress_proyek_mandor_id_fkey` ON `progress_proyek`(`mandor_id`);
ALTER TABLE `progress_proyek` DROP COLUMN `pelaksana`;

-- Track who reported each tahapan log
ALTER TABLE `tahapan_proyek` ADD COLUMN `reported_by_id` INTEGER NULL;
ALTER TABLE `tahapan_proyek` ADD CONSTRAINT `tahapan_proyek_reported_by_id_fkey` FOREIGN KEY (`reported_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX `tahapan_proyek_reported_by_id_fkey` ON `tahapan_proyek`(`reported_by_id`);
