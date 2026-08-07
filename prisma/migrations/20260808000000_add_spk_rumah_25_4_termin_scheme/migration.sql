-- Tambah skema termin SPK Rumah 25/50/75/95/5 (rumah_25_4) ke MySQL enum columns

ALTER TABLE `spk`
  MODIFY COLUMN `termin_scheme` ENUM('rumah_default', 'rumah_25_4', 'infra_20_6', 'infra_30_4') NOT NULL DEFAULT 'rumah_default';

ALTER TABLE `spk_pembayaran`
  MODIFY COLUMN `jenis` ENUM(
    'termin_55',
    'termin_100',
    'termin_rumah_25_1',
    'termin_rumah_25_2',
    'termin_rumah_25_3',
    'termin_rumah_25_4',
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
  MODIFY COLUMN `mengurangi_termin` ENUM(
    'termin_55',
    'termin_100',
    'termin_rumah_25_1',
    'termin_rumah_25_2',
    'termin_rumah_25_3',
    'termin_rumah_25_4',
    'termin_infra_20_1',
    'termin_infra_20_2',
    'termin_infra_20_3',
    'termin_infra_20_4',
    'termin_infra_15',
    'termin_infra_30_1',
    'termin_infra_30_2',
    'termin_infra_30_3',
    'termin_infra_10'
  ) NULL DEFAULT NULL;
