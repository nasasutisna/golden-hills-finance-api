import { registerAs } from '@nestjs/config';

export const paginationConfig = registerAs('pagination', () => ({
  defaultPage: parseInt(process.env.DEFAULT_PAGE || '1', 10),
  defaultLimit: parseInt(process.env.DEFAULT_LIMIT || '10', 10),
  maxLimit: parseInt(process.env.MAX_LIMIT || '100', 10),
}));

export const getPaginationConfig = () => paginationConfig;
