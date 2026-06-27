-- Skema termin per SPK + enum termin infra 30/30/30/10 (MySQL)

ALTER TABLE `spk`
  ADD COLUMN `termin_scheme` ENUM('rumah_default', 'infra_20_6', 'infra_30_4') NOT NULL DEFAULT 'rumah_default';

UPDATE `spk`
SET `termin_scheme` = 'infra_20_6'
WHERE `jenis` = 'infrastruktur';

ALTER TABLE `spk_pembayaran`
  MODIFY `jenis` ENUM(
    'termin_55',
    'termin_100',
    'termin_infra_20_1',
    'termin_infra_20_2',
    'termin_infra_20_3',
    'termin_infra_20_4',
    'termin_infra_15',
    'termin_infra_30_1',
    'termin_infra_30_2',
    'termin_infra_30_3',
    'termin_infra_10',
    'retensi',
    'kasbon',
    'upah'
  ) NOT NULL;

ALTER TABLE `spk_pembayaran`
  MODIFY `mengurangi_termin` ENUM(
    'termin_55',
    'termin_100',
    'termin_infra_20_1',
    'termin_infra_20_2',
    'termin_infra_20_3',
    'termin_infra_20_4',
    'termin_infra_15',
    'termin_infra_30_1',
    'termin_infra_30_2',
    'termin_infra_30_3',
    'termin_infra_10'
  ) NULL;
