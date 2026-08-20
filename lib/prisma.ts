import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// dev hot-reloadでモジュールが再評価されるたびに new PrismaClient() が
// 走って接続が増殖しないよう、globalThis(モジュール再読み込みをまたいで残る場所)に
// 一度作ったインスタンスを保管して使い回す
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
