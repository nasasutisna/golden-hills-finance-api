import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateResidentPaymentDto } from './dto/create-resident-payment.dto';
import { UpdateResidentPaymentDto } from './dto/update-resident-payment.dto';
import { ResidentPaymentsRepository } from './resident-payments.repository';
import { ResidentInvoicesRepository } from '../resident-invoices/resident-invoices.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResidentPaymentsService {
  private readonly logger = new Logger(ResidentPaymentsService.name);

  constructor(
    private readonly residentPaymentsRepository: ResidentPaymentsRepository,
    private readonly residentInvoicesRepository: ResidentInvoicesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'paymentDate', sortOrder = 'desc', search, searchFields, filters } = queryOptions;

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

    const { payments, total } = await this.residentPaymentsRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: payments,
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
    return await this.residentPaymentsRepository.findById(id);
  }

  async create(createResidentPaymentDto: CreateResidentPaymentDto) {
    return await this.prisma.executeInTransaction(async (tx) => {
      // Check if invoice exists
      const invoice = await this.residentInvoicesRepository.findById(
        createResidentPaymentDto.invoiceId,
      );

      if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
        throw new ConflictException(
          'Cannot create payment for this invoice status',
        );
      }

      // Generate payment number
      const paymentNumber = await this.residentPaymentsRepository.generatePaymentNumber();

      // Create payment
      const payment = await this.residentPaymentsRepository.create(
        {
          ...createResidentPaymentDto,
          paymentNumber,
          status: 'PENDING',
        },
        tx as any,
      );

      // Update invoice
      await this.residentInvoicesRepository.updatePaymentAmount(
        createResidentPaymentDto.invoiceId,
        Number(createResidentPaymentDto.amount),
        tx as any,
      );

      this.logger.log(`Payment created: ${payment.paymentNumber}`);
      return payment;
    });
  }

  async verifyPayment(id: string, verifiedBy: string) {
    return await this.prisma.executeInTransaction(async (tx) => {
      const payment = await this.residentPaymentsRepository.findById(id);

      if (!payment.invoiceId) {
        throw new BadRequestException('Payment is not linked to an invoice');
      }

      const verifiedPayment = await this.residentPaymentsRepository.verifyPayment(
        id,
        verifiedBy,
        tx as any,
      );

      const invoice = await this.residentInvoicesRepository.findById(payment.invoiceId);
      if (invoice.status === 'PAID') {
        await this.residentInvoicesRepository.updateInvoiceStatus(
          invoice.id,
          'PAID',
          tx as any,
        );
      }

      this.logger.log(`Payment verified: ${verifiedPayment.paymentNumber}`);
      return verifiedPayment;
    });
  }

  async update(id: string, updateResidentPaymentDto: UpdateResidentPaymentDto) {
    try {
      const payment = await this.residentPaymentsRepository.update(id, updateResidentPaymentDto);
      this.logger.log(`Payment updated: ${payment.paymentNumber}`);
      return payment;
    } catch (error) {
      this.logger.error('Error updating payment:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const payment = await this.residentPaymentsRepository.softDelete(id);
    this.logger.log(`Payment soft deleted: ${payment.paymentNumber}`);
    return payment;
  }

  async getByResident(residentId: string) {
    return await this.residentPaymentsRepository.getByResident(residentId);
  }

  async getByInvoice(invoiceId: string) {
    return await this.residentPaymentsRepository.getByInvoice(invoiceId);
  }

  async getPaymentStatistics(residentId?: string) {
    return await this.residentPaymentsRepository.getPaymentStatistics(residentId);
  }

  async count(where?: any): Promise<number> {
    return await this.residentPaymentsRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.residentPaymentsRepository.exists(id);
  }
}
