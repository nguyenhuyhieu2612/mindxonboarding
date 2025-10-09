import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

export const prisma = new PrismaClient();

async function checkConnection() {
  try {
    await prisma.$connect();
    logger.info("✅ Connected to PostgreSQL successfully");
  } catch (error) {
    logger.error("❌ Failed to connect PostgreSQL:", error);
    process.exit(1);
  }
}

checkConnection();
