/**
 * Verifikasi skema termin SPK rumah vs infra.
 * Jalankan: npx tsx scripts/verify-spk-termin-calc.ts
 */
import {
  calcSpkPembayaranNominal,
  canRequestSpkPembayaran,
  canRequestKasbon,
  getSpkTerminJenisOrder,
} from '../src/domain/spk/spkPembayaranCalc.js';

const kontrak = 100_000_000;
let passed = 0;
let failed = 0;

function ok(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`);
  }
}

console.log('\n=== SPK RUMAH ===');
const rumahOrder = getSpkTerminJenisOrder('RUMAH');
ok('rumah punya 3 termin', rumahOrder.length === 3);
ok('rumah termin pertama TERMIN_55', rumahOrder[0] === 'TERMIN_55');

const rumahRows: never[] = [];
const n55 = calcSpkPembayaranNominal('TERMIN_55', { nilaiKontrak: kontrak }, rumahRows, 'RUMAH');
ok('termin 55 = 50% kontrak', n55 === 50_000_000);

const can55 = canRequestSpkPembayaran('TERMIN_55', { nilaiKontrak: kontrak, progress: 55 }, [], 'RUMAH');
ok('bisa ajukan termin 55 @ progress 55%', can55.allowed);

const cant55 = canRequestSpkPembayaran('TERMIN_55', { nilaiKontrak: kontrak, progress: 50 }, [], 'RUMAH');
ok('tidak bisa termin 55 @ progress 50%', !cant55.allowed);

const cant100 = canRequestSpkPembayaran('TERMIN_100', { nilaiKontrak: kontrak, progress: 100 }, [], 'RUMAH');
ok('tidak bisa termin 100 tanpa termin 55 dibayar', !cant100.allowed);

const kasbonRumah = canRequestKasbon([], kontrak, 'RUMAH');
ok('kasbon target pertama TERMIN_55', kasbonRumah.allowed && kasbonRumah.targetTermin === 'TERMIN_55');

const paid55 = [{ id: 1, jenis: 'TERMIN_55' as const, status: 'SUDAH_DIBAYAR' as const, nominal: 50_000_000 }];
const n100 = calcSpkPembayaranNominal('TERMIN_100', { nilaiKontrak: kontrak }, paid55, 'RUMAH');
ok('termin 100 = 45% kontrak', n100 === 45_000_000);
const nRetensiRumah = calcSpkPembayaranNominal('RETENSI', { nilaiKontrak: kontrak }, [], 'RUMAH');
ok('retensi rumah = 5% kontrak', nRetensiRumah === 5_000_000);
const can100 = canRequestSpkPembayaran('TERMIN_100', { nilaiKontrak: kontrak, progress: 100 }, paid55, 'RUMAH');
ok('bisa termin 100 setelah termin 55 dibayar', can100.allowed);
const rumahCantInfra = canRequestSpkPembayaran('TERMIN_INFRA_20_1', { nilaiKontrak: kontrak, progress: 20 }, [], 'RUMAH');
ok('rumah tidak bisa ajukan TERMIN_INFRA_20_1', !rumahCantInfra.allowed);

console.log('\n=== SPK INFRA ===');
const infraOrder = getSpkTerminJenisOrder('INFRASTRUKTUR');
ok('infra punya 6 termin', infraOrder.length === 6);
ok('infra termin pertama TERMIN_INFRA_20_1', infraOrder[0] === 'TERMIN_INFRA_20_1');
ok('infra retensi terakhir', infraOrder[5] === 'RETENSI');

const nInfra1 = calcSpkPembayaranNominal(
  'TERMIN_INFRA_20_1',
  { nilaiKontrak: kontrak },
  [],
  'INFRASTRUKTUR',
);
ok('termin infra 1 = 20% kontrak', nInfra1 === 20_000_000);

const canInfra1 = canRequestSpkPembayaran(
  'TERMIN_INFRA_20_1',
  { nilaiKontrak: kontrak, progress: 20 },
  [],
  'INFRASTRUKTUR',
);
ok('bisa ajukan termin infra 1 @ 20%', canInfra1.allowed);

const cantInfra2 = canRequestSpkPembayaran(
  'TERMIN_INFRA_20_2',
  { nilaiKontrak: kontrak, progress: 40 },
  [],
  'INFRASTRUKTUR',
);
ok('tidak bisa termin infra 2 tanpa termin 1 dibayar', !cantInfra2.allowed);

const cantInfraRumahTermin = canRequestSpkPembayaran(
  'TERMIN_55',
  { nilaiKontrak: kontrak, progress: 100 },
  [],
  'INFRASTRUKTUR',
);
ok('infra tidak bisa ajukan TERMIN_55', !cantInfraRumahTermin.allowed);

const kasbonInfra = canRequestKasbon([], kontrak, 'INFRASTRUKTUR');
ok(
  'kasbon infra target TERMIN_INFRA_20_1',
  kasbonInfra.allowed && kasbonInfra.targetTermin === 'TERMIN_INFRA_20_1',
);

const infraTerminOnly = infraOrder.filter((j) => j !== 'RETENSI');
const totalBruto = infraTerminOnly.reduce(
  (sum, j) => sum + calcSpkPembayaranNominal(j, { nilaiKontrak: kontrak }, [], 'INFRASTRUKTUR'),
  0,
);
const retensi = calcSpkPembayaranNominal('RETENSI', { nilaiKontrak: kontrak }, [], 'INFRASTRUKTUR');
ok('total termin infra + retensi = 100% kontrak', totalBruto + retensi === kontrak);

console.log(`\n=== HASIL: ${passed} lulus, ${failed} gagal ===\n`);
process.exit(failed > 0 ? 1 : 0);
