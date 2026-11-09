import { PrismaClient, Prisma } from '@prisma/client';
const globalDb = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalDb.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalDb.prisma = db;
export type DB = Prisma.TransactionClient;
export async function rows<T = Record<string, any>>(tx: DB, sql: string, ...values: any[]): Promise<T[]> {
  return tx.$queryRawUnsafe<T[]>(sql, ...values);
}
