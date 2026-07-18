/**
 * Reference type constants for CashTransaction referenceType field
 *
 * These constants define the types of entities that can be linked to cash transactions
 * via the referenceType and referenceId fields (polymorphic relation).
 */
export const REFERENCE_TYPES = {
  // Income sources - Pemasukan
  IPL_PAYMENT: 'IPL_PAYMENT',
  KEGIATAN_PAYMENT: 'KEGIATAN_PAYMENT',
  COMMUNITY_INCOME: 'COMMUNITY_INCOME',
  RESIDENT_PAYMENT: 'RESIDENT_PAYMENT',

  // Expense types - Pengeluaran
  IPL_EXPENSE: 'IPL_EXPENSE',
  KEGIATAN_EXPENSE: 'KEGIATAN_EXPENSE',
  OPERATIONAL: 'OPERATIONAL',
  SALARY: 'SALARY',
  EMPLOYEE_CASH_ADVANCE: 'EMPLOYEE_CASH_ADVANCE',
  EXPENSE_REQUEST: 'EXPENSE_REQUEST',
} as const;

export type ReferenceType = typeof REFERENCE_TYPES[keyof typeof REFERENCE_TYPES];

/**
 * Reference type options for DTO validation
 * Used in Swagger documentation and enum validators
 */
export const REFERENCE_TYPE_OPTIONS = Object.values(REFERENCE_TYPES);

/**
 * Group reference types by income/expense for easier filtering
 */
export const INCOME_REFERENCE_TYPES: ReferenceType[] = [
  REFERENCE_TYPES.IPL_PAYMENT,
  REFERENCE_TYPES.KEGIATAN_PAYMENT,
  REFERENCE_TYPES.COMMUNITY_INCOME,
  REFERENCE_TYPES.RESIDENT_PAYMENT,
];

export const EXPENSE_REFERENCE_TYPES: ReferenceType[] = [
  REFERENCE_TYPES.IPL_EXPENSE,
  REFERENCE_TYPES.KEGIATAN_EXPENSE,
  REFERENCE_TYPES.OPERATIONAL,
  REFERENCE_TYPES.SALARY,
  REFERENCE_TYPES.EMPLOYEE_CASH_ADVANCE,
  REFERENCE_TYPES.EXPENSE_REQUEST,
];
