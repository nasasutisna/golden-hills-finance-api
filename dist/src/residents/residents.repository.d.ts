import { PrismaService } from '../prisma/prisma.service';
import { Resident } from '@prisma/client';
export declare class ResidentsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: any;
        orderBy?: any;
        include?: any;
    }): Promise<{
        residents: Resident[];
        total: number;
    }>;
    findById(id: string, include?: any): Promise<Resident>;
    findByResidentCode(residentCode: string): Promise<Resident | null>;
    generateResidentCode(): Promise<string>;
    create(data: any): Promise<Resident>;
    update(id: string, data: any): Promise<Resident>;
    softDelete(id: string): Promise<Resident>;
    restore(id: string): Promise<Resident>;
    count(where?: any): Promise<number>;
    exists(id: string): Promise<boolean>;
    getActiveResidentsCount(): Promise<number>;
    getByHouseBlock(houseBlockId: string): Promise<Resident[]>;
    updateBalance(residentId: string): Promise<void>;
}
