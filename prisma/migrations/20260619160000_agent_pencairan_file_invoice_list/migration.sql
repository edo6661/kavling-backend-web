-- AlterTable
ALTER TABLE `agent_pencairan` ADD COLUMN `file_invoice_list` JSON NULL AFTER `file_invoice`;

UPDATE `agent_pencairan`
SET `file_invoice_list` = JSON_ARRAY(`file_invoice`)
WHERE `file_invoice` IS NOT NULL
  AND TRIM(`file_invoice`) <> '';
