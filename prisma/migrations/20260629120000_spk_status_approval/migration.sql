-- SPK approval workflow: existing rows default to APPROVED (prod-safe)
ALTER TABLE `spk`
ADD COLUMN `status_approval` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED' AFTER `mandor_id`,
ADD COLUMN `diajukan_oleh_id` INTEGER NULL AFTER `status_approval`,
ADD COLUMN `disetujui_oleh_id` INTEGER NULL AFTER `diajukan_oleh_id`,
ADD COLUMN `tanggal_disetujui` DATETIME(3) NULL AFTER `disetujui_oleh_id`,
ADD COLUMN `catatan_penolakan` TEXT NULL AFTER `tanggal_disetujui`;

ALTER TABLE `spk`
ADD CONSTRAINT `spk_diajukan_oleh_id_fkey`
FOREIGN KEY (`diajukan_oleh_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `spk`
ADD CONSTRAINT `spk_disetujui_oleh_id_fkey`
FOREIGN KEY (`disetujui_oleh_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `spk_status_approval_idx` ON `spk`(`status_approval`);
CREATE INDEX `spk_diajukan_oleh_id_fkey` ON `spk`(`diajukan_oleh_id`);
CREATE INDEX `spk_disetujui_oleh_id_fkey` ON `spk`(`disetujui_oleh_id`);

-- Notification types for SPK approval
ALTER TABLE `notifications`
MODIFY `type` ENUM(
  'spk_pengajuan_baru',
  'spk_menunggu_approval',
  'spk_approval_selesai',
  'spk_disetujui',
  'spk_dibayar',
  'upload_bukti',
  'ganti_kavling',
  'kode_billing_pph',
  'agent_pencairan'
) NOT NULL;
