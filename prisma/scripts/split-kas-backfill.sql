-- Backfill for the Kas IPL / Kas Warga split.
-- Run once after the schema change (cash_accounts table + fund_type on
-- transaction_categories + cash_account_id on cash_transactions) has been
-- applied (e.g. via `prisma db push`).
--
-- Apply with:  npx prisma db execute --file prisma/scripts/split-kas-backfill.sql
--
-- Stable account UUIDs (kept in sync with prisma/seed.ts):
--   KAS_IPL   = 11111111-1111-1111-1111-111111111101
--   KAS_WARGA = 11111111-1111-1111-1111-111111111102

-- 1. Create the two cash accounts (idempotent by account_code)
INSERT INTO cash_accounts (id, account_code, account_name, fund_type, opening_balance, is_active, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'KAS_IPL',   'Kas IPL',   'IPL',   0, 1, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111102', 'KAS_WARGA', 'Kas Warga', 'WARGA', 0, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE account_name = VALUES(account_name), fund_type = VALUES(fund_type);

-- 2. Tag category fund_type
UPDATE transaction_categories SET fund_type = 'IPL'
  WHERE category_code IN ('IPL-MASUK', 'CAT002', 'CAT003', 'CAT004', 'CAT005', 'OPERASIONAL-IPL', 'GAJI');
UPDATE transaction_categories SET fund_type = 'WARGA'
  WHERE category_code IN ('KEGIATAN-MASUK', 'RESIDENT-MASUK', 'PENGELUARAN-WARGA', 'CAT001', 'KEGIATAN-KELUAR');

-- 3. Backfill cash_account_id from the joined category fund_type
UPDATE cash_transactions ct
JOIN transaction_categories c ON ct.category_id = c.id
SET ct.cash_account_id = CASE c.fund_type
  WHEN 'IPL'   THEN '11111111-1111-1111-1111-111111111101'
  WHEN 'WARGA' THEN '11111111-1111-1111-1111-111111111102'
END
WHERE ct.deleted_at IS NULL
  AND ct.cash_account_id IS NULL
  AND c.fund_type IS NOT NULL;

-- 4. Fallback: rows whose category is null/untagged -> derive from reference_type
UPDATE cash_transactions
SET cash_account_id = '11111111-1111-1111-1111-111111111101'
WHERE deleted_at IS NULL AND cash_account_id IS NULL
  AND reference_type = 'IPL_PAYMENT';

UPDATE cash_transactions
SET cash_account_id = '11111111-1111-1111-1111-111111111102'
WHERE deleted_at IS NULL AND cash_account_id IS NULL
  AND reference_type IN ('KEGIATAN_PAYMENT','RESIDENT_PAYMENT','EXPENSE_REQUEST','COMMUNITY_INCOME','KEGIATAN_EXPENSE');

-- 5. Remaining orphans (no category, unrecognized reference_type) -> default Kas Warga
UPDATE cash_transactions
SET cash_account_id = '11111111-1111-1111-1111-111111111102'
WHERE deleted_at IS NULL AND cash_account_id IS NULL;
