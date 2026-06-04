-- Tukang milik mandor (nullable: data lama tetap aman)
ALTER TABLE `tukang`
  ADD COLUMN `mandor_id` INT NULL AFTER `nama`,
  ADD INDEX `tukang_mandor_id_fkey` (`mandor_id`);

ALTER TABLE `tukang`
  ADD CONSTRAINT `tukang_mandor_id_fkey`
  FOREIGN KEY (`mandor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
