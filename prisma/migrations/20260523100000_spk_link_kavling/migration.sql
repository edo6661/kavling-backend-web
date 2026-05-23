-- SpkPenjualan: link by kavling_id (supports kavling without penjualan/customer)

ALTER TABLE `spk_penjualan` DROP FOREIGN KEY `spk_penjualan_penjualan_id_fkey`;

ALTER TABLE `spk_penjualan` ADD COLUMN `kavling_id` INTEGER NULL;

UPDATE `spk_penjualan` sp
INNER JOIN `penjualan` p ON sp.`penjualan_id` = p.`id`
SET sp.`kavling_id` = p.`kavling_id`;

DELETE FROM `spk_penjualan` WHERE `kavling_id` IS NULL;

ALTER TABLE `spk_penjualan` DROP INDEX `spk_penjualan_penjualan_id_key`;
ALTER TABLE `spk_penjualan` DROP COLUMN `penjualan_id`;

ALTER TABLE `spk_penjualan` MODIFY `kavling_id` INTEGER NOT NULL;

CREATE UNIQUE INDEX `spk_penjualan_kavling_id_key` ON `spk_penjualan`(`kavling_id`);

ALTER TABLE `spk_penjualan` ADD CONSTRAINT `spk_penjualan_kavling_id_fkey` FOREIGN KEY (`kavling_id`) REFERENCES `kavling`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
