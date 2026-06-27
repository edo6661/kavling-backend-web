-- CreateEnum
CREATE TYPE "SpkTerminScheme" AS ENUM ('rumah_default', 'infra_20_6', 'infra_30_4');

-- AlterEnum SpkPembayaranJenis
ALTER TYPE "SpkPembayaranJenis" ADD VALUE 'termin_infra_30_1';
ALTER TYPE "SpkPembayaranJenis" ADD VALUE 'termin_infra_30_2';
ALTER TYPE "SpkPembayaranJenis" ADD VALUE 'termin_infra_30_3';
ALTER TYPE "SpkPembayaranJenis" ADD VALUE 'termin_infra_10';

-- AlterEnum SpkKasbonTargetTermin
ALTER TYPE "SpkKasbonTargetTermin" ADD VALUE 'termin_infra_30_1';
ALTER TYPE "SpkKasbonTargetTermin" ADD VALUE 'termin_infra_30_2';
ALTER TYPE "SpkKasbonTargetTermin" ADD VALUE 'termin_infra_30_3';
ALTER TYPE "SpkKasbonTargetTermin" ADD VALUE 'termin_infra_10';

-- AlterTable
ALTER TABLE "spk" ADD COLUMN "termin_scheme" "SpkTerminScheme" NOT NULL DEFAULT 'rumah_default';

-- Backfill: SPK infrastruktur existing → skema lama
UPDATE "spk" SET "termin_scheme" = 'infra_20_6' WHERE "jenis" = 'infrastruktur';
