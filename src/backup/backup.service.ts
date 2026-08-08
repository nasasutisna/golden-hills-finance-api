import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { createReadStream } from 'fs';
import { Response } from 'express';
import { Readable } from 'stream';
import * as archiver from 'archiver';
import * as unzipper from 'unzipper';
import { BackupInfo, CreateBackupResult, RestoreResult } from './backup.types';

/**
 * Backup & Restore service.
 *
 * Strategy
 * --------
 * - DB dump  : shell out to `mysqldump` (consistent snapshot via --single-transaction,
 *              routines/triggers/events included). Output is gzipped on the fly.
 * - DB restore: pipe (gunzipped) SQL into `mysql` CLI stdin.
 * - Archive  : one .zip via `archiver` containing db.sql.gz (+ uploads/** + manifest.json).
 * - Extract  : `unzipper.Open.file()` streams entries without buffering the whole archive.
 *
 * Credentials
 * -----------
 * DATABASE_URL is `mysql://user:password@host:port/db`. The password may contain `@`
 * (it does in this project), which breaks `new URL()`. We parse manually with
 * lastIndexOf('@') and pass the password through the MYSQL_PWD env var of the spawned
 * process — it never touches the command line (no special-char issues, no CLI warning).
 */
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.resolve(process.cwd(), 'backups');
  private readonly uploadsDir = path.resolve(process.cwd(), 'uploads');

  // Accept only .zip / .sql / .sql.gz produced by us or by mysqldump. No path bits.
  private static readonly FILENAME_RE = /^[\w.\-]+$/;

  constructor(private readonly configService: ConfigService) {}

  // ---------------------------------------------------------------------------
  // DB connection parsing
  // ---------------------------------------------------------------------------

  /** Parse `mysql://user:pass@host:port/db` tolerating `@` / `:` in the password. */
  private parseDbUrl(): {
    user: string;
    password: string;
    host: string;
    port: string;
    database: string;
  } {
    const raw: string =
      this.configService.get<string>('database.url') ||
      process.env.DATABASE_URL ||
      '';
    if (!raw) {
      throw new InternalServerErrorException('DATABASE_URL is not configured');
    }

    const withoutProto = raw.replace(/^mysql:\/\//, '');
    const lastAt = withoutProto.lastIndexOf('@');
    if (lastAt === -1) {
      throw new InternalServerErrorException('Malformed DATABASE_URL (no credentials)');
    }

    const credsPart = withoutProto.substring(0, lastAt);
    const hostPart = withoutProto.substring(lastAt + 1);

    const colonIdx = credsPart.indexOf(':');
    const user = colonIdx === -1 ? credsPart : credsPart.substring(0, colonIdx);
    const password = colonIdx === -1 ? '' : credsPart.substring(colonIdx + 1);

    const slashIdx = hostPart.indexOf('/');
    const hostPort = slashIdx === -1 ? hostPart : hostPart.substring(0, slashIdx);
    let database = slashIdx === -1 ? '' : hostPart.substring(slashIdx + 1);
    database = database.split('?')[0];

    const [host, port] = hostPort.split(':');
    if (!host || !database) {
      throw new InternalServerErrorException('Malformed DATABASE_URL (host/database)');
    }

    return { user, password, host, port: port || '3306', database };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private timestamp(d = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
      `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
    );
  }

  private ensureDirs(): void {
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  /** Resolve & validate a backup filename, ensuring it stays inside backups/. */
  private resolveSafe(filename: string): string {
    if (!filename || !BackupService.FILENAME_RE.test(filename)) {
      throw new BadRequestException('Invalid backup filename');
    }
    const full = path.resolve(this.backupDir, filename);
    const rel = path.relative(this.backupDir, full);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      // Path traversal attempt (e.g. "..%2f..%2f.env").
      throw new BadRequestException('Invalid backup filename');
    }
    return full;
  }

  /** Run `mysql` and pipe the given SQL stream into its stdin. */
  private runMysql(sqlInput: Readable): Promise<void> {
    const db = this.parseDbUrl();
    return new Promise<void>((resolve, reject) => {
      const args = [
        '-h',
        db.host,
        '-P',
        db.port,
        '-u',
        db.user,
        '--default-character-set=utf8mb4',
        db.database,
      ];
      const mysql = spawn('mysql', args, {
        env: { ...process.env, MYSQL_PWD: db.password },
      });

      let stderr = '';
      mysql.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      mysql.on('error', (err) => {
        reject(
          new InternalServerErrorException(
            `Failed to spawn mysql: ${err.message}. Is the mysql client installed?`,
          ),
        );
      });
      mysql.on('close', (code: number) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new BadRequestException(
              `Database restore failed (mysql exit ${code}): ${stderr.slice(0, 1500)}`,
            ),
          );
        }
      });

      sqlInput.on('error', (err) => {
        mysql.stdin.destroy();
        reject(new BadRequestException(`Invalid backup stream: ${err.message}`));
      });

      sqlInput.pipe(mysql.stdin);
    });
  }

  /** Spawn mysqldump and return its stdout stream (stderr collected separately). */
  private spawnMysqldump(): {
    stdout: Readable;
    done: Promise<{ code: number; stderr: string }>;
  } {
    const db = this.parseDbUrl();
    const args = [
      '--single-transaction',
      '--routines',
      '--triggers',
      '--events',
      '--default-character-set=utf8mb4',
      '-h',
      db.host,
      '-P',
      db.port,
      '-u',
      db.user,
      db.database,
    ];
    const dump = spawn('mysqldump', args, {
      env: { ...process.env, MYSQL_PWD: db.password },
    });

    let stderr = '';
    dump.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const done = new Promise<{ code: number; stderr: string }>((resolve) => {
      dump.on('close', (code: number) => resolve({ code: code ?? -1, stderr }));
      dump.on('error', (err) => {
        resolve({
          code: -1,
          stderr: `${stderr}\nspawn error: ${err.message}`,
        });
      });
    });

    return { stdout: dump.stdout, done };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** List backup files in the backups/ directory, newest first. */
  async listBackups(): Promise<BackupInfo[]> {
    this.ensureDirs();
    const entries = await fs.promises.readdir(this.backupDir, { withFileTypes: true });
    const result: BackupInfo[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (entry.name.startsWith('_')) continue; // skip _restore temp etc.
      const isZip = /\.zip$/i.test(entry.name);
      const isSql = /\.(sql|sql\.gz)$/i.test(entry.name);
      if (!isZip && !isSql) continue;

      const full = path.join(this.backupDir, entry.name);
      const stat = await fs.promises.stat(full);
      result.push({
        filename: entry.name,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
        kind: isZip ? 'full' : 'db',
      });
    }

    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return result;
  }

  /**
   * Create a backup archive (.zip) containing the gzipped DB dump and, optionally,
   * the uploads folder.
   */
  async createBackup(opts: { includeUploads?: boolean } = {}): Promise<CreateBackupResult> {
    const includeUploads = opts.includeUploads !== false;
    this.ensureDirs();

    const ts = this.timestamp();
    const filename = `gh_backup_${ts}.zip`;
    const outPath = path.join(this.backupDir, filename);

    const { stdout: dumpStdout, done: dumpDone } = this.spawnMysqldump();

    const archive = archiver('zip', { zlib: { level: 6 } });
    const writeStream = fs.createWriteStream(outPath);
    archive.pipe(writeStream);

    // DB dump -> gzip -> zip entry. archiver drains the stream during finalize().
    archive.append(dumpStdout.pipe(zlib.createGzip()), { name: 'db.sql.gz' });

    if (includeUploads && fs.existsSync(this.uploadsDir)) {
      archive.directory(this.uploadsDir, 'uploads');
    }

    const manifest = {
      version: 1,
      type: 'full',
      createdAt: new Date().toISOString(),
      database: this.parseDbUrl().database,
      uploadsIncluded: includeUploads,
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

    // Surface archiver errors (e.g. source stream failure) for cleanup.
    const archiveError = new Promise<never>((_, reject) => {
      archive.on('error', (err) => reject(err));
    });

    try {
      await Promise.race([archive.finalize(), archiveError]);
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });
    } catch (err) {
      await fs.promises.unlink(outPath).catch(() => undefined);
      throw new InternalServerErrorException(
        `Failed to create backup archive: ${(err as Error).message}`,
      );
    }

    // Now that archiver has fully drained the dump stream, mysqldump has exited.
    const { code, stderr } = await dumpDone;
    if (code !== 0) {
      await fs.promises.unlink(outPath).catch(() => undefined);
      throw new InternalServerErrorException(
        `mysqldump failed (exit ${code}): ${stderr.slice(0, 1500)}`,
      );
    }

    const stat = await fs.promises.stat(outPath);
    this.logger.log(
      `Backup created: ${filename} (${stat.size} bytes, uploads=${includeUploads})`,
    );
    return {
      filename,
      size: stat.size,
      createdAt: stat.mtime.toISOString(),
      uploadsIncluded: includeUploads,
    };
  }

  /**
   * Restore from an uploaded backup file.
   *
   * Accepted inputs:
   *  - our .zip archive (db.sql.gz + uploads/**) — full restore
   *  - standalone .sql / .sql.gz                  — DB-only restore
   *
   * A pre-restore snapshot is taken first so the change is reversible.
   */
  async restore(file: Express.Multer.File): Promise<RestoreResult> {
    if (!file?.path) {
      throw new BadRequestException('Backup file is required');
    }
    const startedAt = Date.now();

    // 1) Safety snapshot — best-effort; don't block the restore if it fails.
    let snapshotName: string | null = null;
    try {
      const snap = await this.createBackup({ includeUploads: true });
      snapshotName = snap.filename;
    } catch (err) {
      this.logger.warn(`Pre-restore snapshot failed: ${(err as Error).message}`);
    }

    try {
      const head = await this.readHead(file.path, 4);
      const isZip = head[0] === 0x50 && head[1] === 0x4b; // "PK"
      const isGzip = head[0] === 0x1f && head[1] === 0x8b;

      let restoredDb = false;
      let restoredUploads = false;

      if (isZip) {
        const res = await this.restoreFromZip(file.path);
        restoredDb = res.db;
        restoredUploads = res.uploads;
      } else if (isGzip || /\.sql(\.gz)?$/i.test(file.originalname)) {
        let input: Readable = createReadStream(file.path);
        if (isGzip) {
          input = input.pipe(zlib.createGunzip());
        }
        await this.runMysql(input);
        restoredDb = true;
      } else {
        throw new BadRequestException(
          'Unsupported file type. Provide a .zip, .sql, or .sql.gz backup.',
        );
      }

      this.logger.log(
        `Restore complete: db=${restoredDb} uploads=${restoredUploads} (snapshot=${snapshotName})`,
      );
      return {
        snapshot: snapshotName,
        restoredDb,
        restoredUploads,
        durationMs: Date.now() - startedAt,
      };
    } finally {
      // Always clean up the temp upload regardless of outcome.
      await fs.promises.unlink(file.path).catch(() => undefined);
    }
  }

  /** Stream a backup file to the HTTP response for download. */
  async download(filename: string, res: Response): Promise<void> {
    const full = this.resolveSafe(filename);
    if (!fs.existsSync(full)) {
      throw new NotFoundException(`Backup not found: ${filename}`);
    }
    const stat = fs.statSync(full);
    const isZip = /\.zip$/i.test(filename);

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    res.setHeader('Content-Type', isZip ? 'application/zip' : 'application/octet-stream');
    res.setHeader('Content-Length', stat.size.toString());

    createReadStream(full).pipe(res);
  }

  /** Delete a stored backup file. */
  async deleteBackup(filename: string): Promise<void> {
    const full = this.resolveSafe(filename);
    if (!fs.existsSync(full)) {
      throw new NotFoundException(`Backup not found: ${filename}`);
    }
    await fs.promises.unlink(full);
    this.logger.log(`Backup deleted: ${filename}`);
  }

  // ---------------------------------------------------------------------------
  // Restore internals
  // ---------------------------------------------------------------------------

  private async readHead(filePath: string, n: number): Promise<Buffer> {
    const fd = await fs.promises.open(filePath, 'r');
    try {
      const buf = Buffer.alloc(n);
      await fd.read(buf, 0, n, 0);
      return buf;
    } finally {
      await fd.close();
    }
  }

  /** Restore DB + uploads from our .zip format. */
  private async restoreFromZip(
    filePath: string,
  ): Promise<{ db: boolean; uploads: boolean }> {
    const directory = await unzipper.Open.file(filePath);

    const dbEntry = directory.files.find(
      (f) =>
        f.type === 'File' &&
        (f.path === 'db.sql.gz' ||
          f.path === 'db.sql' ||
          f.path.endsWith('/db.sql.gz') ||
          f.path.endsWith('/db.sql')),
    );

    let db = false;
    if (dbEntry) {
      let stream: Readable = (dbEntry as unknown as { stream(): Readable }).stream();
      if (dbEntry.path.endsWith('.gz')) {
        stream = stream.pipe(zlib.createGunzip());
      }
      await this.runMysql(stream);
      db = true;
    }

    let uploads = false;
    for (const entry of directory.files) {
      if (entry.type !== 'File') continue;
      const norm = entry.path.replace(/^\.?\//, '');
      if (norm === 'uploads/' || !norm.startsWith('uploads/')) continue;
      const rel = norm.slice('uploads/'.length);
      if (!rel || rel.endsWith('/')) continue;

      // Containment: resolved destination must stay inside uploads/.
      const dest = path.resolve(this.uploadsDir, rel);
      const relCheck = path.relative(this.uploadsDir, dest);
      if (relCheck.startsWith('..') || path.isAbsolute(relCheck)) {
        // Malicious zip entry — skip, don't traverse out.
        continue;
      }

      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      await new Promise<void>((resolve, reject) => {
        const ws = fs.createWriteStream(dest);
        (entry as unknown as { stream(): Readable })
          .stream()
          .pipe(ws)
          .on('finish', () => resolve())
          .on('error', reject);
      });
      uploads = true;
    }

    return { db, uploads };
  }
}
