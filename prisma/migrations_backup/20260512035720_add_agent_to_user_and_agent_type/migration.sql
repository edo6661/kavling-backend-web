-- AlterTable
ALTER TABLE `agents` ADD COLUMN `file_ktp` VARCHAR(255) NULL,
    ADD COLUMN `file_ktp_direktur` VARCHAR(255) NULL,
    ADD COLUMN `file_npwp` VARCHAR(255) NULL,
    ADD COLUMN `file_npwp_perusahaan` VARCHAR(255) NULL,
    ADD COLUMN `file_surat_keterangan` VARCHAR(255) NULL,
    ADD COLUMN `kwitansi_booking_fee` VARCHAR(255) NULL,
    ADD COLUMN `type` ENUM('Pribadi', 'Perusahaan') NOT NULL DEFAULT 'Pribadi',
    ADD COLUMN `user_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `role_permissions` MODIFY `role` ENUM('superadmin', 'admin', 'finance', 'marketing', 'customer', 'bank', 'agent') NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('superadmin', 'admin', 'finance', 'marketing', 'customer', 'bank', 'agent') NOT NULL;

-- AddForeignKey
ALTER TABLE `agents` ADD CONSTRAINT `agents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
