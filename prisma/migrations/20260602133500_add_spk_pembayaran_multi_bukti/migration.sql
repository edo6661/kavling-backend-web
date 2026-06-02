ALTER TABLE `spk_pembayaran`
ADD COLUMN `bukti_pembayaran_list` JSON NULL;

UPDATE `spk_pembayaran`
SET `bukti_pembayaran_list` = JSON_ARRAY(`bukti_pembayaran`)
WHERE `bukti_pembayaran` IS NOT NULL
  AND JSON_VALID(JSON_ARRAY(`bukti_pembayaran`));
