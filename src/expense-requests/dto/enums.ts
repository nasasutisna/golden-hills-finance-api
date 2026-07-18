export enum ExpenseRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

/**
 * Roles whose requests are auto-approved at creation time.
 * Everyone else (PENGURUS, COORDINATOR, MANAGER, STAFF) needs ADMIN/ACCOUNTANT approval.
 */
export const AUTO_APPROVE_ROLES = ['SUPERADMIN', 'ADMIN', 'ACCOUNTANT'];

/** entityType used when storing proof photos in FileAttachment. */
export const EXPENSE_REQUEST_ENTITY_TYPE = 'EXPENSE_REQUEST';

/** Default EXPENSE category used when the requester does not provide categoryId. */
export const DEFAULT_EXPENSE_CATEGORY_CODE = 'PENGELUARAN-WARGA';
