-- AlterTable: kategori pekerjaan infra
ALTER TABLE `pekerjaan_infra`
  ADD COLUMN `kategori` ENUM('SALURAN', 'JALAN', 'LAINNYA') NOT NULL DEFAULT 'LAINNYA';

CREATE INDEX `pekerjaan_infra_kategori_idx` ON `pekerjaan_infra`(`kategori`);

-- Seed 17 item standar (Pak Arga) — upsert by nama
INSERT INTO `pekerjaan_infra` (`nama`, `urutan`, `kategori`, `is_active`, `created_at`, `updated_at`) VALUES
('Galian', 1, 'SALURAN', true, NOW(3), NOW(3)),
('Pemasangan buis / gorong gorong', 2, 'SALURAN', true, NOW(3), NOW(3)),
('Urugan', 3, 'SALURAN', true, NOW(3), NOW(3)),
('Perapihan', 4, 'SALURAN', true, NOW(3), NOW(3)),
('Kupas tanah', 5, 'JALAN', true, NOW(3), NOW(3)),
('Tebar limestone', 6, 'JALAN', true, NOW(3), NOW(3)),
('Tebar makadam', 7, 'JALAN', true, NOW(3), NOW(3)),
('Perataan makadam', 8, 'JALAN', true, NOW(3), NOW(3)),
('Pembuatan bak kontrol', 9, 'JALAN', true, NOW(3), NOW(3)),
('Pemasangan bekisting', 10, 'JALAN', true, NOW(3), NOW(3)),
('Pasang plastik cor', 11, 'JALAN', true, NOW(3), NOW(3)),
('Pemasangan wiremesh', 12, 'JALAN', true, NOW(3), NOW(3)),
('Pemasangan beton tahu', 13, 'JALAN', true, NOW(3), NOW(3)),
('Perapihan cor (gosok poles)', 14, 'JALAN', true, NOW(3), NOW(3)),
('Sisir beton', 15, 'JALAN', true, NOW(3), NOW(3)),
('Cutting beton', 16, 'JALAN', true, NOW(3), NOW(3)),
('Selimut beton / penyiraman', 17, 'JALAN', true, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `kategori` = VALUES(`kategori`),
  `urutan` = VALUES(`urutan`),
  `is_active` = true,
  `updated_at` = NOW(3);
