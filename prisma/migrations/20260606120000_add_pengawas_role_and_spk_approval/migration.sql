-- Add PENGAWAS role
ALTER TABLE `role_permissions`
MODIFY `role` ENUM(
  'superadmin',
  'admin',
  'finance',
  'marketing',
  'customer',
  'bank',
  'agent',
  'mandor',
  'pengawas'
) NOT NULL;

ALTER TABLE `users`
MODIFY `role` ENUM(
  'superadmin',
  'admin',
  'finance',
  'marketing',
  'customer',
  'bank',
  'agent',
  'mandor',
  'pengawas'
) NOT NULL;

-- Add MENUNGGU_PERSETUJUAN status + approval audit on spk_pembayaran
ALTER TABLE `spk_pembayaran`
MODIFY `status` ENUM(
  'menunggu_pembayaran',
  'sudah_dibayar',
  'draft',
  'menunggu_persetujuan'
) NOT NULL DEFAULT 'menunggu_pembayaran';

ALTER TABLE `spk_pembayaran`
ADD COLUMN `disetujui_oleh_id` INTEGER NULL AFTER `diajukan_oleh_id`,
ADD COLUMN `tanggal_disetujui` DATETIME(3) NULL AFTER `disetujui_oleh_id`;

ALTER TABLE `spk_pembayaran`
ADD CONSTRAINT `spk_pembayaran_disetujui_oleh_id_fkey`
FOREIGN KEY (`disetujui_oleh_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `spk_pembayaran_disetujui_oleh_id_fkey` ON `spk_pembayaran`(`disetujui_oleh_id`);

-- Default permissions for pengawas (read SPK + progress, approve via SPK update)
INSERT INTO `role_permissions` (`role`, `resource`, `canCreate`, `canRead`, `canUpdate`, `canDelete`, `created_at`, `updated_at`)
VALUES
  ('pengawas', 'SPK', 0, 1, 1, 0, NOW(3), NOW(3)),
  ('pengawas', 'PROGRESS_PROYEK', 0, 1, 0, 0, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `canRead` = GREATEST(`canRead`, VALUES(`canRead`)),
  `canUpdate` = GREATEST(`canUpdate`, VALUES(`canUpdate`)),
  `updated_at` = NOW(3);
