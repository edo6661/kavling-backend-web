ALTER TABLE `tagihan`
ADD COLUMN `file_bukti_list` JSON NULL;

UPDATE `tagihan`
SET `file_bukti_list` = JSON_ARRAY(`file_bukti`)
WHERE `file_bukti` IS NOT NULL
  AND TRIM(`file_bukti`) <> ''
  AND JSON_VALID(JSON_ARRAY(`file_bukti`));
