/**
 * Backup & Restore — shared types.
 *
 * A "full" backup is a single .zip archive produced by BackupService containing:
 *   - db.sql.gz   : gzipped `mysqldump` output (schema + data + routines/triggers/events)
 *   - uploads/**  : the ./uploads folder (proof-of-payment photos, documents, etc.) — optional
 *   - manifest.json : { version, createdAt, type, database, uploadsIncluded }
 *
 * A standalone .sql / .sql.gz (e.g. an external mysqldump) is also accepted by the
 * restore endpoint (DB-only) for flexibility.
 */

export type BackupKind = 'full' | 'db';

export interface BackupInfo {
  /** Filename within the backups/ directory, e.g. `gh_backup_20260804_124336.zip`. */
  filename: string;
  /** Size in bytes. */
  size: number;
  /** ISO timestamp from the file mtime. */
  createdAt: string;
  /** full = .zip (db + maybe uploads), db = standalone .sql/.sql.gz */
  kind: BackupKind;
}

export interface CreateBackupResult {
  filename: string;
  size: number;
  createdAt: string;
  uploadsIncluded: boolean;
}

export interface RestoreResult {
  /** Filename of the auto pre-restore snapshot, or null if snapshot creation failed. */
  snapshot: string | null;
  /** True when a database dump was applied. */
  restoredDb: boolean;
  /** True when upload files were extracted. */
  restoredUploads: boolean;
  /** Wall-clock duration in ms. */
  durationMs: number;
}
