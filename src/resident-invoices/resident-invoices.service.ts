import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateResidentInvoiceDto } from './dto/create-resident-invoice.dto';
import { UpdateResidentInvoiceDto } from './dto/update-resident-invoice.dto';
import { ResidentInvoicesRepository } from './resident-invoices.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResidentInvoicesService {
  private readonly logger = new Logger(ResidentInvoicesService.name);

  constructor(
    private readonly residentInvoicesRepository: ResidentInvoicesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'invoiceDate', sortOrder = 'desc', search, searchFields, filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search && searchFields) {
      const fields = searchFields.split(',');
      where.OR = fields.map((field) => ({
        [field]: { contains: search },
      }));
    }

    if (filters) {
      where = { ...where, ...filters };
    }

    const { invoices, total } = await this.residentInvoicesRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: invoices,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string) {
    return await this.residentInvoicesRepository.findById(id);
  }

  async create(createResidentInvoiceDto: CreateResidentInvoiceDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      // Check if invoice number already exists
      const invoiceNumber = await this.residentInvoicesRepository.generateInvoiceNumber();

      // Calculate amounts
      const subtotal = Number(createResidentInvoiceDto.subtotal);
      const taxAmount = createResidentInvoiceDto.taxAmount
        ? Number(createResidentInvoiceDto.taxAmount)
        : 0;
      const discountAmount = createResidentInvoiceDto.discountAmount
        ? Number(createResidentInvoiceDto.discountAmount)
        : 0;
      const totalAmount = subtotal + taxAmount - discountAmount;

      const invoice = await this.residentInvoicesRepository.create(
        {
          ...createResidentInvoiceDto,
          invoiceNumber,
          totalAmount,
          paidAmount: 0,
          outstandingAmount: totalAmount,
          status: 'PENDING',
        },
        tx as any,
      );

      this.logger.log(`Invoice created: ${invoice.invoiceNumber}`);
      return invoice;
    });
  }

  async update(id: string, updateResidentInvoiceDto: UpdateResidentInvoiceDto) {
    try {
      const invoice = await this.residentInvoicesRepository.update(id, updateResidentInvoiceDto);
      this.logger.log(`Invoice updated: ${invoice.invoiceNumber}`);
      return invoice;
    } catch (error) {
      this.logger.error('Error updating invoice:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const invoice = await this.residentInvoicesRepository.softDelete(id);
    this.logger.log(`Invoice soft deleted: ${invoice.invoiceNumber}`);
    return invoice;
  }

  async getByResident(residentId: string) {
    return await this.residentInvoicesRepository.getByResident(residentId);
  }

  async getByStatus(status: string) {
    return await this.residentInvoicesRepository.getByStatus(status);
  }

  async getOverdueInvoices() {
    return await this.residentInvoicesRepository.getOverdueInvoices();
  }

  async getInvoiceStatistics(residentId?: string) {
    return await this.residentInvoicesRepository.getInvoiceStatistics(residentId);
  }

  async markAsPaid(id: string) {
    return await this.prisma.executeInTransaction(async (tx) => {
      return await this.residentInvoicesRepository.updateInvoiceStatus(
        id,
        'PAID',
        tx as any,
      );
    });
  }

  async markAsOverdue(id: string) {
    return await this.residentInvoicesRepository.updateInvoiceStatus(id, 'OVERDUE');
  }

  async cancelInvoice(id: string, reason?: string) {
    return await this.prisma.executeInTransaction(async (tx) => {
      return await this.residentInvoicesRepository.update(
        id,
        {
          status: 'CANCELLED',
          notes: reason || 'Invoice cancelled',
        },
        tx as any,
      );
    });
  }

  async count(where?: any): Promise<number> {
    return await this.residentInvoicesRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.residentInvoicesRepository.exists(id);
  }
}
