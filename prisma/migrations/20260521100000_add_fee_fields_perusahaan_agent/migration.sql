-- Fee fields on perusahaan_agents (same shape as agents table)
ALTER TABLE `perusahaan_agents` ADD COLUMN `fee_marketing_pct` DECIMAL(5, 2) NULL;
ALTER TABLE `perusahaan_agents` ADD COLUMN `fee_closing_nominal` DECIMAL(15, 2) NULL;
ALTER TABLE `perusahaan_agents` ADD COLUMN `potongan_pph` DECIMAL(5, 2) NULL;
