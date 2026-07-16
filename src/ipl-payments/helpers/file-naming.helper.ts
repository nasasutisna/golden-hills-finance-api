import * as fs from 'fs';
import * as path from 'path';

/**
 * Sanitize filename by removing special characters and replacing spaces with underscores
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-+/g, '_') // Replace hyphens with underscores
    .trim();
}

/**
 * Format month to Indonesian month name or numeric
 */
export function formatMonth(month: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  return months[month - 1] || String(month).padStart(2, '0');
}

/**
 * Generate bukti transfer filename
 * Format: BTF-{bulan}-{tahun}-{unit rumah}-{timestamp}-{reference number}
 * Example: BTF-Jul-2026-A10-1720872000000-REF-20250114-0001.jpg
 */
export function generateBuktiTransferFilename(
  month: number,
  year: number,
  unitNumber: string,
  timestamp: number,
  referenceNumber: string,
  extension: string,
): string {
  const monthStr = formatMonth(month);
  const sanitizedUnit = sanitizeFilename(unitNumber);
  // Sanitize reference number for filename
  const sanitizedRef = referenceNumber.replace(/[^a-zA-Z0-9-]/g, '');
  return `BTF-${monthStr}-${year}-${sanitizedUnit}-${timestamp}-${sanitizedRef}${extension}`;
}

/**
 * Generate kwitansi filename
 * Format: KWT-{bulan}-{tahun}-{prefix}-{unit rumah}-{timestamp}
 * Example (IPL):       KWT-Jul-2026-IPL-A10-1720872000000.pdf
 * Example (RESIDENT):  KWT-Jul-2026-RESIDENT-A10-1720872000000.pdf
 * Example (KEGIATAN):  KWT-Jul-2026-KEGIATAN-A10-1720872000000.pdf
 */
export function generateKwitansiFilename(
  month: number,
  year: number,
  unitNumber: string,
  timestamp: number,
  prefix: string = 'IPL',
): string {
  const monthStr = formatMonth(month);
  const sanitizedUnit = sanitizeFilename(unitNumber);
  const sanitizedPrefix = sanitizeFilename(prefix).toUpperCase();
  return `KWT-${monthStr}-${year}-${sanitizedPrefix}-${sanitizedUnit}-${timestamp}.pdf`;
}

/**
 * Ensure directory exists, create if not
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Move file from source to destination
 * Creates destination directory if it doesn't exist
 */
export function moveFile(sourcePath: string, destPath: string): void {
  const destDir = path.dirname(destPath);
  ensureDir(destDir);

  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, destPath);
  }
}

/**
 * Delete file if exists
 */
export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
