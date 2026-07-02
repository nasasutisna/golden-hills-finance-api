import { PrismaService } from '../prisma/prisma.service';
import { SalaryComponent } from '@prisma/client';
export declare class SalaryComponentsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
    }): Promise<{
        components: SalaryComponent[];
        total: number;
    }>;
    findById(id: string): Promise<SalaryComponent | null>;
    findByComponentCode(componentCode: string): Promise<SalaryComponent | null>;
    findActive(): Promise<SalaryComponent[]>;
    create(data: any): Promise<SalaryComponent>;
    update(id: string, data: any): Promise<SalaryComponent>;
    softDelete(id: string): Promise<SalaryComponent>;
    count(where?: any): Promise<number>;
}
