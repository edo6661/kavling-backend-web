-- SPK infrastruktur: termin 20% × 4, 15%, retensi 5%
ALTER TABLE `spk_pembayaran`
  MODIFY `jenis` ENUM(
    'termin_55',
    'termin_100',
    'termin_infra_20_1',
    'termin_infra_20_2',
    'termin_infra_20_3',
    'termin_infra_20_4',
    'termin_infra_15',
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
    'termin_infra_15'
  ) NULL;
