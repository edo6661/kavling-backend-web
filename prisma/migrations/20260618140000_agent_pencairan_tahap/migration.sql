-- Add tahap column (existing rows default to ppjb)
ALTER TABLE `agent_pencairan` ADD COLUMN `tahap` ENUM('ppjb', 'ajb') NOT NULL DEFAULT 'ppjb' AFTER `agent_id`;

-- Composite unique indexes (required before dropping single-column uniques used by FK)
CREATE UNIQUE INDEX `agent_pencairan_fee_agent_id_tahap_key` ON `agent_pencairan`(`fee_agent_id`, `tahap`);
CREATE UNIQUE INDEX `agent_pencairan_penjualan_id_tahap_key` ON `agent_pencairan`(`penjualan_id`, `tahap`);

-- Drop FKs that depend on old unique indexes
ALTER TABLE `agent_pencairan` DROP FOREIGN KEY `agent_pencairan_fee_agent_id_fkey`;
ALTER TABLE `agent_pencairan` DROP FOREIGN KEY `agent_pencairan_penjualan_id_fkey`;

-- Drop old single-row unique constraints
ALTER TABLE `agent_pencairan` DROP INDEX `agent_pencairan_fee_agent_id_key`;
ALTER TABLE `agent_pencairan` DROP INDEX `agent_pencairan_penjualan_id_key`;

-- Re-add FKs (composite index left-prefix covers fee_agent_id / penjualan_id)
ALTER TABLE `agent_pencairan` ADD CONSTRAINT `agent_pencairan_fee_agent_id_fkey` FOREIGN KEY (`fee_agent_id`) REFERENCES `fee_agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `agent_pencairan` ADD CONSTRAINT `agent_pencairan_penjualan_id_fkey` FOREIGN KEY (`penjualan_id`) REFERENCES `penjualan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
