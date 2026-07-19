import { ResidentPaymentsService } from './resident-payments.service';
import { ResidentPaymentReceiptsService } from './resident-payment-receipts.service';
import { FileAttachmentsService } from '../file-attachments/file-attachments.service';
import { CreateResidentPaymentDto } from './dto/create-resident-payment.dto';
import { UpdateResidentPaymentDto } from './dto/update-resident-payment.dto';
import { CreateBulkResidentPaymentDto } from './dto/create-bulk-resident-payment.dto';
import { QueryResidentPaymentMatrixDto } from './dto/query-resident-payment-matrix.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CurrentUserData } from '../common/decorators/current-user.decorator';
export declare class ResidentPaymentsController {
    private readonly residentPaymentsService;
    private readonly fileAttachmentsService;
    private readonly residentPaymentReceiptsService;
    constructor(residentPaymentsService: ResidentPaymentsService, fileAttachmentsService: FileAttachmentsService, residentPaymentReceiptsService: ResidentPaymentReceiptsService);
    create(proofFile: Express.Multer.File, userId: string, createResidentPaymentDto: CreateResidentPaymentDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            bankName: string | null;
            notes: string | null;
            status: string;
            createdBy: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paymentDate: Date;
            paymentNumber: string;
            residentId: string;
            paymentMethod: string;
            referenceNumber: string | null;
            invoiceId: string | null;
            transactionId: string | null;
            verifiedBy: string | null;
            verifiedAt: Date | null;
        };
    }>;
    createBulk(createBulkDto: CreateBulkResidentPaymentDto): Promise<{
        statusCode: number;
        message: string;
        data: import("./dto/create-bulk-resident-payment.dto").BulkPaymentResultDto;
    }>;
    findAll(queryOptions: QueryOptionsDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            bankName: string | null;
            notes: string | null;
            status: string;
            createdBy: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paymentDate: Date;
            paymentNumber: string;
            residentId: string;
            paymentMethod: string;
            referenceNumber: string | null;
            invoiceId: string | null;
            transactionId: string | null;
            verifiedBy: string | null;
            verifiedAt: Date | null;
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
            bankName: string | null;
            notes: string | null;
            status: string;
            createdBy: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paymentDate: Date;
            paymentNumber: string;
            residentId: string;
            paymentMethod: string;
            referenceNumber: string | null;
            invoiceId: string | null;
            transactionId: string | null;
            verifiedBy: string | null;
            verifiedAt: Date | null;
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
            bankName: string | null;
            notes: string | null;
            status: string;
            createdBy: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paymentDate: Date;
            paymentNumber: string;
            residentId: string;
            paymentMethod: string;
            referenceNumber: string | null;
            invoiceId: string | null;
            transactionId: string | null;
            verifiedBy: string | null;
            verifiedAt: Date | null;
        }[];
    }>;
    getMatrix(query: QueryResidentPaymentMatrixDto): Promise<{
        statusCode: number;
        message: string;
        data: {
            year: number;
            unitCount: number;
            paidCellCount: number;
            grandTotal: number;
            monthTotals: number[];
            rows: {
                no: number;
                unitId: any;
                unitCode: any;
                unitNumber: any;
                blockCode: any;
                blockName: any;
                landArea: number;
                buildingArea: number;
                residentId: any;
                residentName: string | null;
                phoneNumber: any;
                isActive: any;
                cells: any[];
                paidCount: number;
                pendingCount: number;
            }[];
        };
    }>;
    findOne(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            bankName: string | null;
            notes: string | null;
            status: string;
            createdBy: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paymentDate: Date;
            paymentNumber: string;
            residentId: string;
            paymentMethod: string;
            referenceNumber: string | null;
            invoiceId: string | null;
            transactionId: string | null;
            verifiedBy: string | null;
            verifiedAt: Date | null;
        };
    }>;
    getReceipt(id: string): Promise<{
        statusCode: number;
        message: string;
        data: {
            url: string;
            id: string;
            fileName: string;
            filePath: string;
            fileSize: number;
            mimeType: string;
            category: string | null;
            paymentNumber: string;
            paymentId: string;
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
            bankName: string | null;
            notes: string | null;
            status: string;
            createdBy: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paymentDate: Date;
            paymentNumber: string;
            residentId: string;
            paymentMethod: string;
            referenceNumber: string | null;
            invoiceId: string | null;
            transactionId: string | null;
            verifiedBy: string | null;
            verifiedAt: Date | null;
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
            bankName: string | null;
            notes: string | null;
            status: string;
            createdBy: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paymentDate: Date;
            paymentNumber: string;
            residentId: string;
            paymentMethod: string;
            referenceNumber: string | null;
            invoiceId: string | null;
            transactionId: string | null;
            verifiedBy: string | null;
            verifiedAt: Date | null;
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
            bankName: string | null;
            notes: string | null;
            status: string;
            createdBy: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            paymentDate: Date;
            paymentNumber: string;
            residentId: string;
            paymentMethod: string;
            referenceNumber: string | null;
            invoiceId: string | null;
            transactionId: string | null;
            verifiedBy: string | null;
            verifiedAt: Date | null;
        };
    }>;
}
