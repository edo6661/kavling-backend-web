#!/usr/bin/env bash
# Recovery migrasi production (DB dulu pakai db push, history Prisma belum sinkron).
#
# Dari folder deploy: ~/apps/kavling-backend
#   git pull   # ambil script ini dulu
#   bash scripts/baseline-production-migrations.sh
#
# Jika migrasi gagal BUKAN karena kolom/tabel sudah ada (bukan error 1050/1060/1061),
# hentikan script dan perbaiki manual — jangan resolve --applied sembarangan.

set -euo pipefail

PRISMA=(docker compose exec -T app npx prisma)
MAX_ATTEMPTS=25

is_duplicate_schema_error() {
  local out=$1
  echo "$out" | grep -qE '1060|1050|1061|Duplicate column|Duplicate key|already exists'
}

extract_migration_name() {
  local out=$1
  echo "$out" | sed -n 's/^Migration name: \([^[:space:]]*\).*/\1/p' | head -1
}

echo "==> Coba bersihkan status migrasi gagal (mandor) jika ada"
"${PRISMA[@]}" migrate resolve --applied 20260521000000_add_mandor_role 2>/dev/null || true

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  echo ""
  echo "==> migrate deploy (percobaan $attempt/$MAX_ATTEMPTS)"
  set +e
  output=$("${PRISMA[@]}" migrate deploy 2>&1)
  status=$?
  set -e
  echo "$output"

  if [ "$status" -eq 0 ]; then
    echo ""
    echo "==> Semua migrasi berhasil."
    "${PRISMA[@]}" migrate status
    exit 0
  fi

  migration=$(extract_migration_name "$output")

  if [ -n "$migration" ] && is_duplicate_schema_error "$output"; then
    echo "==> Kolom/tabel sudah ada — tandai $migration sebagai applied, lalu lanjut..."
    "${PRISMA[@]}" migrate resolve --applied "$migration"
    continue
  fi

  echo ""
  echo "ERROR: migrate deploy gagal dan tidak bisa di-recover otomatis."
  echo "Periksa log di atas. Untuk migrasi yang SQL-nya sudah ada di DB:"
  echo "  docker compose exec -T app npx prisma migrate resolve --applied <nama_migrasi>"
  exit 1
done

echo "ERROR: Mencapai batas percobaan ($MAX_ATTEMPTS)."
exit 1
