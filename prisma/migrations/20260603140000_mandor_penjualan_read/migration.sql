-- Mandor: akses baca data penjualan (kavling yang ditugaskan via SPK)
INSERT INTO `role_permissions` (`role`, `resource`, `canCreate`, `canRead`, `canUpdate`, `canDelete`, `created_at`, `updated_at`)
VALUES
  ('mandor', 'PENJUALAN', 0, 1, 0, 0, NOW(3), NOW(3)),
  ('mandor', 'SPK', 0, 1, 0, 0, NOW(3), NOW(3)),
  ('mandor', 'PROGRESS_PROYEK', 0, 1, 1, 0, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `canRead` = GREATEST(`canRead`, VALUES(`canRead`)),
  `canUpdate` = GREATEST(`canUpdate`, VALUES(`canUpdate`)),
  `updated_at` = NOW(3);
