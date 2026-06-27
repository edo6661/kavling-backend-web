/**
 * Verifikasi skema termin SPK rumah vs infra.
 * Jalankan: npx tsx scripts/verify-spk-termin-calc.ts
 */
import {
  calcSpkPembayaranNominal,
  canRequestSpkPembayaran,
  canRequestKasbon,
  getSpkTerminJenisOrder,
  isTerminFulfilled,
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
const rumahOrder = getSpkTerminJenisOrder('RUMAH_DEFAULT');
ok('rumah punya 3 termin', rumahOrder.length === 3);
ok('rumah termin pertama TERMIN_55', rumahOrder[0] === 'TERMIN_55');

const rumahRows: never[] = [];
const n55 = calcSpkPembayaranNominal('TERMIN_55', { nilaiKontrak: kontrak }, rumahRows, 'RUMAH_DEFAULT');
ok('termin 55 = 50% kontrak', n55 === 50_000_000);

const can55 = canRequestSpkPembayaran('TERMIN_55', { nilaiKontrak: kontrak, progress: 55 }, [], 'RUMAH_DEFAULT');
ok('bisa ajukan termin 55 @ progress 55%', can55.allowed);

const cant55 = canRequestSpkPembayaran('TERMIN_55', { nilaiKontrak: kontrak, progress: 50 }, [], 'RUMAH_DEFAULT');
ok('tidak bisa termin 55 @ progress 50%', !cant55.allowed);

const cant100 = canRequestSpkPembayaran('TERMIN_100', { nilaiKontrak: kontrak, progress: 100 }, [], 'RUMAH_DEFAULT');
ok('tidak bisa termin 100 tanpa termin 55 dibayar', !cant100.allowed);

const kasbonRumah = canRequestKasbon([], kontrak, 'RUMAH_DEFAULT');
ok('kasbon target pertama TERMIN_55', kasbonRumah.allowed && kasbonRumah.targetTermin === 'TERMIN_55');

const paid55 = [{ id: 1, jenis: 'TERMIN_55' as const, status: 'SUDAH_DIBAYAR' as const, nominal: 50_000_000 }];
const n100 = calcSpkPembayaranNominal('TERMIN_100', { nilaiKontrak: kontrak }, paid55, 'RUMAH_DEFAULT');
ok('termin 100 = 45% kontrak', n100 === 45_000_000);
const nRetensiRumah = calcSpkPembayaranNominal('RETENSI', { nilaiKontrak: kontrak }, [], 'RUMAH_DEFAULT');
ok('retensi rumah = 5% kontrak', nRetensiRumah === 5_000_000);
const can100 = canRequestSpkPembayaran('TERMIN_100', { nilaiKontrak: kontrak, progress: 100 }, paid55, 'RUMAH_DEFAULT');
ok('bisa termin 100 setelah termin 55 dibayar', can100.allowed);
const rumahCantInfra = canRequestSpkPembayaran('TERMIN_INFRA_20_1', { nilaiKontrak: kontrak, progress: 20 }, [], 'RUMAH_DEFAULT');
ok('rumah tidak bisa ajukan TERMIN_INFRA_20_1', !rumahCantInfra.allowed);

console.log('\n=== SPK INFRA (20/20/20/20/15/5) ===');
const infraOrder = getSpkTerminJenisOrder('INFRA_20_6');
ok('infra 20_6 punya 6 termin', infraOrder.length === 6);
ok('infra termin pertama TERMIN_INFRA_20_1', infraOrder[0] === 'TERMIN_INFRA_20_1');
ok('infra retensi terakhir', infraOrder[5] === 'RETENSI');

const nInfra1 = calcSpkPembayaranNominal(
  'TERMIN_INFRA_20_1',
  { nilaiKontrak: kontrak },
  [],
  'INFRA_20_6',
);
ok('termin infra 1 = 20% kontrak', nInfra1 === 20_000_000);

const canInfra1 = canRequestSpkPembayaran(
  'TERMIN_INFRA_20_1',
  { nilaiKontrak: kontrak, progress: 20 },
  [],
  'INFRA_20_6',
);
ok('bisa ajukan termin infra 1 @ 20%', canInfra1.allowed);

const cantInfra2 = canRequestSpkPembayaran(
  'TERMIN_INFRA_20_2',
  { nilaiKontrak: kontrak, progress: 40 },
  [],
  'INFRA_20_6',
);
ok('tidak bisa termin infra 2 tanpa termin 1 dibayar', !cantInfra2.allowed);

const cantInfraRumahTermin = canRequestSpkPembayaran(
  'TERMIN_55',
  { nilaiKontrak: kontrak, progress: 100 },
  [],
  'INFRA_20_6',
);
ok('infra 20_6 tidak bisa ajukan TERMIN_55', !cantInfraRumahTermin.allowed);

const kasbonInfra = canRequestKasbon([], kontrak, 'INFRA_20_6');
ok(
  'kasbon infra target TERMIN_INFRA_20_1',
  kasbonInfra.allowed && kasbonInfra.targetTermin === 'TERMIN_INFRA_20_1',
);

const infraTerminOnly = infraOrder.filter((j) => j !== 'RETENSI');
const totalBruto = infraTerminOnly.reduce(
  (sum, j) => sum + calcSpkPembayaranNominal(j, { nilaiKontrak: kontrak }, [], 'INFRA_20_6'),
  0,
);
const retensi = calcSpkPembayaranNominal('RETENSI', { nilaiKontrak: kontrak }, [], 'INFRA_20_6');
ok('total termin infra + retensi = 100% kontrak', totalBruto + retensi === kontrak);

console.log('\n=== SPK INFRA (30/30/30/10) ===');
const infra30Order = getSpkTerminJenisOrder('INFRA_30_4');
ok('infra 30_4 punya 4 termin', infra30Order.length === 4);
ok('infra 30_4 termin pertama TERMIN_INFRA_30_1', infra30Order[0] === 'TERMIN_INFRA_30_1');
ok('infra 30_4 tanpa retensi', !infra30Order.includes('RETENSI'));

const nInfra30_1 = calcSpkPembayaranNominal(
  'TERMIN_INFRA_30_1',
  { nilaiKontrak: kontrak },
  [],
  'INFRA_30_4',
);
ok('termin infra 30_1 = 30% kontrak', nInfra30_1 === 30_000_000);

const canInfra30_1 = canRequestSpkPembayaran(
  'TERMIN_INFRA_30_1',
  { nilaiKontrak: kontrak, progress: 30 },
  [],
  'INFRA_30_4',
);
ok('bisa ajukan termin infra 30_1 @ 30%', canInfra30_1.allowed);

const cantInfra30Old = canRequestSpkPembayaran(
  'TERMIN_INFRA_20_1',
  { nilaiKontrak: kontrak, progress: 20 },
  [],
  'INFRA_30_4',
);
ok('infra 30_4 tidak bisa ajukan TERMIN_INFRA_20_1', !cantInfra30Old.allowed);

const totalInfra30 = infra30Order.reduce(
  (sum, j) => sum + calcSpkPembayaranNominal(j, { nilaiKontrak: kontrak }, [], 'INFRA_30_4'),
  0,
);
ok('total termin infra 30_4 = 100% kontrak', totalInfra30 === kontrak);

console.log('\n=== TERMIN LUNAS VIA KASBON (nominal Rp 0) ===');
const kontrakInfra = 436_507_000;
const bruto20 = Math.round(kontrakInfra * 0.2);
const kasbonFullTermin1 = [
  {
    id: 1,
    jenis: 'KASBON' as const,
    status: 'SUDAH_DIBAYAR' as const,
    nominal: bruto20,
    mengurangiTermin: 'TERMIN_INFRA_20_1' as const,
  },
];
const nInfra1Kasbon = calcSpkPembayaranNominal(
  'TERMIN_INFRA_20_1',
  { nilaiKontrak: kontrakInfra },
  kasbonFullTermin1,
  'INFRA_20_6',
);
ok('termin infra 1 nominal 0 setelah kasbon penuh', nInfra1Kasbon === 0);
ok(
  'termin infra 1 terpenuhi via kasbon',
  isTerminFulfilled(
    'TERMIN_INFRA_20_1',
    { nilaiKontrak: kontrakInfra },
    kasbonFullTermin1,
    'INFRA_20_6',
  ),
);
const cantAjukanTermin1 = canRequestSpkPembayaran(
  'TERMIN_INFRA_20_1',
  { nilaiKontrak: kontrakInfra, progress: 85 },
  kasbonFullTermin1,
  'INFRA_20_6',
);
ok('tidak bisa ajukan termin infra 1 @ nominal 0', !cantAjukanTermin1.allowed);

const kasbon3Termin = [
  ...kasbonFullTermin1,
  { id: 2, jenis: 'KASBON' as const, status: 'SUDAH_DIBAYAR' as const, nominal: bruto20, mengurangiTermin: 'TERMIN_INFRA_20_2' as const },
  { id: 3, jenis: 'KASBON' as const, status: 'SUDAH_DIBAYAR' as const, nominal: bruto20, mengurangiTermin: 'TERMIN_INFRA_20_3' as const },
];
const canAjukanTermin4 = canRequestSpkPembayaran(
  'TERMIN_INFRA_20_4',
  { nilaiKontrak: kontrakInfra, progress: 85 },
  kasbon3Termin,
  'INFRA_20_6',
);
ok('bisa ajukan termin infra 4 setelah termin 1-3 lunas kasbon', canAjukanTermin4.allowed);

console.log(`\n=== HASIL: ${passed} lulus, ${failed} gagal ===\n`);
process.exit(failed > 0 ? 1 : 0);
