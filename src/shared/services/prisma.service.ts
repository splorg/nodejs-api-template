import { config } from "@/config";
import { PrismaClient } from "@prisma/client";

export class PrismaService extends PrismaClient {}

export const prisma = new PrismaService({
	log: config.env === "development" ? ["query"] : [],
});
