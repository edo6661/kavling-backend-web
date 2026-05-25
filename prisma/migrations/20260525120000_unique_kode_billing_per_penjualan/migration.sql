-- Hapus duplikat: simpan record terbaru per penjualan
DELETE t1 FROM `kode_billing_pph` t1
INNER JOIN `kode_billing_pph` t2
  ON t1.`penjualan_id` = t2.`penjualan_id`
  AND t1.`penjualan_id` IS NOT NULL
  AND t1.`id` < t2.`id`;

-- Hapus baris tanpa penjualan
DELETE FROM `kode_billing_pph` WHERE `penjualan_id` IS NULL;
