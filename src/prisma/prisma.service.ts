import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const adapter = new PrismaMariaDb(connectionString as string);

    super({
      adapter,
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    this.$on('error' as never, (e: any) => {
      this.logger.error(`Error: ${e.message}`);
    });

    this.$on('warn' as never, (e: any) => {
      this.logger.warn(`Warning: ${e.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    // Only for testing/development - delete all data
    const models = Reflect.ownKeys(this).filter((key) => typeof key === 'string' && !key.startsWith('_')) as string[];

    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof this];
        if (model && typeof model === 'object' && 'deleteMany' in model) {
          return (model as any).deleteMany();
        }
        return Promise.resolve();
      }),
    );
  }

  /**
   * Execute a transaction with automatic retry on serialization failure
   */
  async executeInTransaction<T>(
    callback: (tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await this.$transaction(async (tx) => {
          return await callback(tx as unknown as PrismaService);
        });
      } catch (error: any) {
        attempt++;
        if (
          error.code === 'P2034' || // Transaction write conflict
          error.code === 'P2038'    // Node can't be deleted because it's connected
        ) {
          if (attempt >= maxRetries) {
            throw error;
          }
          // Wait before retrying with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
          continue;
        }
        throw error;
      }
    }

    throw new Error('Transaction failed after maximum retries');
  }

  /**
   * Soft delete helper
   */
  async softDelete(model: any, where: any, userId: string) {
    return model.update({
      where,
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  /**
   * Check if a record exists
   */
  async exists(model: any, where: any): Promise<boolean> {
    const count = await model.count({ where });
    return count > 0;
  }

  /**
   * Find one or throw
   */
  async findOrThrow(model: any, where: any, errorMessage?: string) {
    const record = await model.findFirst({ where });
    if (!record) {
      throw new Error(errorMessage || 'Record not found');
    }
    return record;
  }

  /**
   * Paginate query helper
   */
  async paginate(model: any, params: {
    where?: any;
    orderBy?: any;
    page?: number;
    limit?: number;
    include?: any;
    select?: any;
  }) {
    const { where, orderBy, page = 1, limit = 10, include, select } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      model.findMany({
        where: { ...where, deletedAt: null },
        orderBy,
        skip,
        take: limit,
        include,
        select,
      }),
      model.count({ where: { ...where, deletedAt: null } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * Search helper
   */
  async search(model: any, params: {
    search?: string;
    searchFields?: string[];
    where?: any;
    page?: number;
    limit?: number;
    orderBy?: any;
    include?: any;
  }) {
    const { search, searchFields = [], where, page = 1, limit = 10, orderBy, include } = params;

    let searchWhere = where || {};

    if (search && searchFields.length > 0) {
      searchWhere = {
        ...searchWhere,
        OR: searchFields.map((field) => ({
          [field]: { contains: search },
        })),
      };
    }

    return this.paginate(model, {
      where: searchWhere,
      page,
      limit,
      orderBy,
      include,
    });
  }

  /**
   * Filter helper with dynamic where clause
   */
  async filter(model: any, params: {
    filters?: Record<string, any>;
    page?: number;
    limit?: number;
    orderBy?: any;
    include?: any;
  }) {
    const { filters, page = 1, limit = 10, orderBy, include } = params;

    return this.paginate(model, {
      where: filters,
      page,
      limit,
      orderBy,
      include,
    });
  }
}

export type PrismaTransactionalClient = Omit<
  PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
