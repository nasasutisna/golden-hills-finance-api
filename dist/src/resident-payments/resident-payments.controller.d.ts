import { ResidentPaymentsService } from './resident-payments.service';
import { CreateResidentPaymentDto } from './dto/create-resident-payment.dto';
import { UpdateResidentPaymentDto } from './dto/update-resident-payment.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CurrentUserData } from '../common/decorators/current-user.decorator';
export declare class ResidentPaymentsController {
    private readonly residentPaymentsService;
    constructor(residentPaymentsService: ResidentPaymentsService);
    create(createResidentPaymentDto: CreateResidentPaymentDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            paymentDate: Date;
            createdBy: string;
            bankName: string | null;
            paymentNumber: string;
            residentId: string;
            invoiceId: string | null;
            paymentMethod: string;
            referenceNumber: string | null;
            transactionId: string | null;
        };
    }>;
    findAll(queryOptions: QueryOptionsDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            paymentDate: Date;
            createdBy: string;
            bankName: string | null;
            paymentNumber: string;
            residentId: string;
            invoiceId: string | null;
            paymentMethod: string;
            referenceNumber: string | null;
            transactionId: string | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getStatistics(residentId?: string): Promise<{
        statusCode: number;
        message: string;
        data: any;
    }>;
    getByResident(residentId: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            paymentDate: Date;
            createdBy: string;
            bankName: string | null;
            paymentNumber: string;
            residentId: string;
            invoiceId: string | null;
            paymentMethod: string;
            referenceNumber: string | null;
            transactionId: string | null;
        }[];
    }>;
    getByInvoice(invoiceId: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            paymentDate: Date;
            createdBy: string;
            bankName: string | null;
            paymentNumber: string;
            residentId: string;
            invoiceId: string | null;
            paymentMethod: string;
            referenceNumber: string | null;
            transactionId: string | null;
        }[];
    }>;
    findOne(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            paymentDate: Date;
            createdBy: string;
            bankName: string | null;
            paymentNumber: string;
            residentId: string;
            invoiceId: string | null;
            paymentMethod: string;
            referenceNumber: string | null;
            transactionId: string | null;
        };
    }>;
    update(id: string, updateResidentPaymentDto: UpdateResidentPaymentDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            paymentDate: Date;
            createdBy: string;
            bankName: string | null;
            paymentNumber: string;
            residentId: string;
            invoiceId: string | null;
            paymentMethod: string;
            referenceNumber: string | null;
            transactionId: string | null;
        };
    }>;
    verifyPayment(id: string, user: CurrentUserData): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            paymentDate: Date;
            createdBy: string;
            bankName: string | null;
            paymentNumber: string;
            residentId: string;
            invoiceId: string | null;
            paymentMethod: string;
            referenceNumber: string | null;
            transactionId: string | null;
        };
    }>;
    remove(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            notes: string | null;
            paymentDate: Date;
            createdBy: string;
            bankName: string | null;
            paymentNumber: string;
            residentId: string;
            invoiceId: string | null;
            paymentMethod: string;
            referenceNumber: string | null;
            transactionId: string | null;
        };
    }>;
}
