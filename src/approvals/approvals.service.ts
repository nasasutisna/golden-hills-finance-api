import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ApprovalType = 'IPL' | 'RESIDENT_PAYMENT' | 'EXPENSE';

export interface ProofFileDto {
  fileName: string;
  filePath: string;
  mimeType: string;
}

export interface ApprovalMonthDto {
  label: string;
  month: number;
  year: number;
}

export interface PendingApprovalItem {
  type: ApprovalType;
  /** Representative id — used for approve/reject/verify (IPL applies group-wide) */
  id: string;
  number: string;
  /** Decimal serialized as string */
  amount: string;
  unitCode: string | null;
  residentName: string | null;
  /** Covered months (IPL only — resident payments carry no per-month data) */
  months: ApprovalMonthDto[];
  paymentMethod: string | null;
  referenceNumber: string | null;
  date: string;
  fundType?: 'IPL' | 'WARGA';
  title?: string;
  invoiceNumber?: string | null;
  submittedByName: string;
  proofFiles: ProofFileDto[];
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

/**
 * The expense-requests module historically writes proof attachments under two
 * different entityType casings ('ExpenseRequest' in the service vs
 * 'EXPENSE_REQUEST' in the repository) — query both so no proof goes missing.
 */
const EXPENSE_ENTITY_TYPES = ['ExpenseRequest', 'EXPENSE_REQUEST'];

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPendingApprovals(): Promise<PendingApprovalItem[]> {
    const [iplPayments, residentPayments, expenseRequests] = await Promise.all([
      this.prisma.iplPayment.findMany({
        where: { status: 'PENDING', deletedAt: null },
        select: {
          id: true,
          paymentNumber: true,
          paymentGroupId: true,
          calculatedAmount: true,
          paymentMethod: true,
          paymentDate: true,
          referenceNumber: true,
          period: { select: { month: true, year: true, periodName: true } },
          resident: { select: { firstName: true, lastName: true } },
          houseUnit: { select: { unitCode: true, unitNumber: true } },
          submitter: { select: { firstName: true, lastName: true, username: true } },
        },
        orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.residentPayment.findMany({
        where: { status: 'PENDING', deletedAt: null },
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          paymentMethod: true,
          paymentDate: true,
          referenceNumber: true,
          invoice: { select: { invoiceNumber: true } },
          resident: {
            select: {
              firstName: true,
              lastName: true,
              unitNumber: true,
              houseUnit: { select: { unitCode: true } },
            },
          },
        },
        orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.expenseRequest.findMany({
        where: { status: 'PENDING', deletedAt: null },
        select: {
          id: true,
          requestNumber: true,
          title: true,
          description: true,
          amount: true,
          transactionDate: true,
          paymentMethod: true,
          fundType: true,
          requester: { select: { firstName: true, lastName: true, username: true } },
          resident: {
            select: {
              firstName: true,
              lastName: true,
              unitNumber: true,
              houseUnit: { select: { unitCode: true } },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
    ]);

    // Proof files are fetched with second queries keyed on entityId — a
    // `where` inside a relation include is rejected by this Prisma version
    // (mirrors ipl-payments.repository getFilesForPayments).
    const [iplFiles, residentFiles, expenseFiles] = await Promise.all([
      this.getFilesByEntityIds(iplPayments.map((p) => p.id), ['IplPayment']),
      this.getFilesByEntityIds(residentPayments.map((p) => p.id), ['ResidentPayment']),
      this.getFilesByEntityIds(expenseRequests.map((r) => r.id), EXPENSE_ENTITY_TYPES),
    ]);

    const items: PendingApprovalItem[] = [];

    // ---- IPL: group multi-month payments by paymentGroupId (one card per group)
    const iplGroups = new Map<string, typeof iplPayments>();
    for (const payment of iplPayments) {
      const key = payment.paymentGroupId ?? payment.id;
      const group = iplGroups.get(key);
      if (group) {
        group.push(payment);
      } else {
        iplGroups.set(key, [payment]);
      }
    }

    for (const group of iplGroups.values()) {
      const first = group[0];
      const totalAmount = group.reduce(
        (sum, p) => sum + Number(p.calculatedAmount),
        0,
      );
      const months = group
        .map((p) => p.period)
        .sort((a, b) => (a.year - b.year) || (a.month - b.month))
        .map((period) => ({
          label: `${MONTH_NAMES_SHORT[period.month - 1] ?? period.month} ${period.year}`,
          month: period.month,
          year: period.year,
        }));

      items.push({
        type: 'IPL',
        id: first.id, // approve/reject resolves the whole group via paymentGroupId
        number: first.paymentNumber,
        amount: totalAmount.toFixed(2),
        unitCode: first.houseUnit?.unitCode ?? first.houseUnit?.unitNumber ?? null,
        residentName: this.joinName(first.resident),
        months,
        paymentMethod: first.paymentMethod,
        referenceNumber: first.referenceNumber,
        date: first.paymentDate.toISOString(),
        submittedByName: this.userLabel(first.submitter),
        proofFiles: this.toProofFiles(iplFiles.get(first.id) ?? []),
      });
    }

    // ---- Resident payments (Iuran Warga): no per-month data in the schema —
    // the card surfaces invoice number + payment date instead.
    for (const payment of residentPayments) {
      items.push({
        type: 'RESIDENT_PAYMENT',
        id: payment.id,
        number: payment.paymentNumber,
        amount: Number(payment.amount).toFixed(2),
        unitCode:
          payment.resident?.houseUnit?.unitCode ?? payment.resident?.unitNumber ?? null,
        residentName: this.joinName(payment.resident),
        months: [],
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
        date: payment.paymentDate.toISOString(),
        invoiceNumber: payment.invoice?.invoiceNumber ?? null,
        submittedByName: '—',
        proofFiles: this.toProofFiles(residentFiles.get(payment.id) ?? []),
      });
    }

    // ---- Expense requests (Pengeluaran)
    for (const request of expenseRequests) {
      items.push({
        type: 'EXPENSE',
        id: request.id,
        number: request.requestNumber,
        amount: Number(request.amount).toFixed(2),
        unitCode:
          request.resident?.houseUnit?.unitCode ?? request.resident?.unitNumber ?? null,
        residentName: this.joinName(request.resident),
        months: [],
        paymentMethod: request.paymentMethod,
        referenceNumber: null,
        date: request.transactionDate.toISOString(),
        fundType: request.fundType === 'IPL' ? 'IPL' : 'WARGA',
        title: request.title,
        submittedByName: this.userLabel(request.requester),
        proofFiles: this.toProofFiles(expenseFiles.get(request.id) ?? []),
      });
    }

    // Newest first across all types
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }

  private async getFilesByEntityIds(entityIds: string[], entityTypes: string[]) {
    const map = new Map<string, { fileName: string; filePath: string; mimeType: string }[]>();
    if (entityIds.length === 0) {
      return map;
    }

    const files = await this.prisma.fileAttachment.findMany({
      where: {
        entityId: { in: entityIds },
        entityType: { in: entityTypes },
        deletedAt: null,
      },
      select: { entityId: true, fileName: true, filePath: true, mimeType: true },
      orderBy: { createdAt: 'asc' },
    });

    for (const file of files) {
      if (!file.entityId) continue;
      const list = map.get(file.entityId);
      if (list) {
        list.push(file);
      } else {
        map.set(file.entityId, [file]);
      }
    }
    return map;
  }

  private toProofFiles(files: { fileName: string; filePath: string; mimeType: string }[]): ProofFileDto[] {
    return files.map(({ fileName, filePath, mimeType }) => ({ fileName, filePath, mimeType }));
  }

  private joinName(person: { firstName: string; lastName: string } | null | undefined): string | null {
    if (!person) return null;
    const name = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
    return name || null;
  }

  private userLabel(user: { firstName: string; lastName: string; username: string } | null | undefined): string {
    if (!user) return '—';
    return this.joinName(user) ?? user.username ?? '—';
  }
}
