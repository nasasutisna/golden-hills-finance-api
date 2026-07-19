/**
 * Cash account (Kas) + fund type constants.
 *
 * The paguyuban keeps two independent cash accounts:
 *   - Kas IPL   — IPL income + operational/salary expenses + IPL-specific expenses
 *   - Kas Warga — iuran rutin + iuran kegiatan income + kegiatan/warga expenses
 *
 * A transaction's account is derived from its category's fundType at write time.
 * Stable account IDs are shared with prisma/seed.ts and prisma/scripts/split-kas-backfill.sql.
 */
export const FUND_TYPES = {
  IPL: 'IPL',
  WARGA: 'WARGA',
} as const;

export type FundType = typeof FUND_TYPES[keyof typeof FUND_TYPES];

export const CASH_ACCOUNT_CODES = {
  KAS_IPL: 'KAS_IPL',
  KAS_WARGA: 'KAS_WARGA',
} as const;

export type CashAccountCode = typeof CASH_ACCOUNT_CODES[keyof typeof CASH_ACCOUNT_CODES];

/** Stable UUIDs — keep in sync with prisma/seed.ts and split-kas-backfill.sql. */
export const CASH_ACCOUNT_IDS = {
  KAS_IPL: '11111111-1111-1111-1111-111111111101',
  KAS_WARGA: '11111111-1111-1111-1111-111111111102',
} as const;

/** Map a fund type to its stable account id. */
export function accountIdForFund(fundType: string | null | undefined): string | null {
  if (fundType === FUND_TYPES.IPL) return CASH_ACCOUNT_IDS.KAS_IPL;
  if (fundType === FUND_TYPES.WARGA) return CASH_ACCOUNT_IDS.KAS_WARGA;
  return null;
}

/** Map a stable account id back to its fund type. */
export function fundForAccountId(accountId: string | null | undefined): FundType | null {
  if (accountId === CASH_ACCOUNT_IDS.KAS_IPL) return FUND_TYPES.IPL;
  if (accountId === CASH_ACCOUNT_IDS.KAS_WARGA) return FUND_TYPES.WARGA;
  return null;
}
