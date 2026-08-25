import { PrismaClient } from "@prisma/client";

// Singleton pattern — prevents multiple PrismaClient instances during
// hot-reload in development (each restart would otherwise open a new connection pool).

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
