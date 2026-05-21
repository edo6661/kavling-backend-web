-- CreateEnum (MySQL: enum values on column; Prisma style)
-- Tambah kolom `tujuan` pada tagihan untuk alokasi pembayaran (booking / DP / cicilan pokok / lainnya).
-- Default LAINNYA aman untuk baris produksi yang sudah ada sebelum migrasi ini.

ALTER TABLE `tagihan` ADD COLUMN `tujuan` ENUM('BOOKING_FEE', 'DP', 'HARGA_JUAL', 'LAINNYA') NOT NULL DEFAULT 'LAINNYA';

-- Backfill dari teks `pembayaran` (urutan: booking → cicilan pokok → DP)
UPDATE `tagihan` SET `tujuan` = 'BOOKING_FEE' WHERE LOWER(`pembayaran`) LIKE '%booking%';

UPDATE `tagihan` SET `tujuan` = 'HARGA_JUAL' WHERE TRIM(`pembayaran`) REGEXP '^Cicilan Ke-[0-9]+$';

UPDATE `tagihan` SET `tujuan` = 'DP' WHERE `tujuan` = 'LAINNYA' AND (
  LOWER(`pembayaran`) LIKE '%down payment%' OR
  LOWER(`pembayaran`) LIKE '%uang muka%' OR
  (LOWER(`pembayaran`) LIKE '%dp%' AND LOWER(`pembayaran`) NOT LIKE '%booking%')
);
