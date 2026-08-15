-- AlterTable spk: tambah skema termin rumah_3_termin & custom, dan kolom termin_config JSON
ALTER TABLE `spk`
  MODIFY COLUMN `termin_scheme` ENUM('rumah_default', 'rumah_25_4', 'rumah_3_termin', 'infra_20_6', 'infra_30_4', 'custom') NOT NULL DEFAULT 'rumah_default',
  ADD COLUMN `termin_config` JSON NULL DEFAULT NULL;

-- AlterTable spk_pembayaran: tambah enum jenis termin_rumah_3_* dan termin_custom_*
ALTER TABLE `spk_pembayaran`
  MODIFY COLUMN `jenis` ENUM(
    'termin_55',
    'termin_100',
    'termin_rumah_25_1',
    'termin_rumah_25_2',
    'termin_rumah_25_3',
    'termin_rumah_25_4',
    'termin_rumah_3_1',
    'termin_rumah_3_2',
    'termin_rumah_3_3',
    'termin_infra_20_1',
    'termin_infra_20_2',
    'termin_infra_20_3',
    'termin_infra_20_4',
    'termin_infra_15',
    'termin_infra_30_1',
    'termin_infra_30_2',
    'termin_infra_30_3',
    'termin_infra_10',
    'termin_custom_1',
    'termin_custom_2',
    'termin_custom_3',
    'termin_custom_4',
    'termin_custom_5',
    'termin_custom_6',
    'termin_custom_7',
    'termin_custom_8',
    'termin_custom_9',
    'termin_custom_10',
    'retensi',
    'kasbon',
    'upah'
  ) NOT NULL;

-- AlterTable spk_pembayaran: tambah enum mengurangi_termin termin_rumah_3_* dan termin_custom_*
ALTER TABLE `spk_pembayaran`
  MODIFY COLUMN `mengurangi_termin` ENUM(
    'termin_55',
    'termin_100',
    'termin_rumah_25_1',
    'termin_rumah_25_2',
    'termin_rumah_25_3',
    'termin_rumah_25_4',
    'termin_rumah_3_1',
    'termin_rumah_3_2',
    'termin_rumah_3_3',
    'termin_infra_20_1',
    'termin_infra_20_2',
    'termin_infra_20_3',
    'termin_infra_20_4',
    'termin_infra_15',
    'termin_infra_30_1',
    'termin_infra_30_2',
    'termin_infra_30_3',
    'termin_infra_10',
    'termin_custom_1',
    'termin_custom_2',
    'termin_custom_3',
    'termin_custom_4',
    'termin_custom_5',
    'termin_custom_6',
    'termin_custom_7',
    'termin_custom_8',
    'termin_custom_9',
    'termin_custom_10'
  ) NULL DEFAULT NULL;
