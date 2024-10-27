import { config } from "@/config";
import { NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../services/prisma.service";

declare global {
	namespace Express {
		interface Request {
			user: {
				id: string;
				email: string;
				name: string;
			};
		}
	}
}

interface JWTPayload {
	userId: string;
}

const accessSecret = config.jwt.accessSecret;

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
	const token = extractTokenFromHeader(req);

	if (!token) {
		res.status(401).json({
			error: "Authentication required. No token provided.",
		});
		return;
	}

	try {
		const decoded = jwt.verify(token, accessSecret) as JWTPayload;
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: {
				id: true,
				email: true,
				name: true,
			},
		});

		if (!user) {
			res.status(401).json({
				error: "User not found.",
			});
			return;
		}

		req.user = user;
		next();
	} catch (error) {
		if (error instanceof Error && error.name === "TokenExpiredError") {
			res.status(401).json({
				error: "Access token has expired.",
			});
			return;
		}

		if (error instanceof Error && error.name === "JsonWebTokenError") {
			res.status(401).json({
				error: "Invalid token provided.",
			});
			return;
		}

		res.status(401).json({
			error: "Authentication failed.",
		});
	}
};

const extractTokenFromHeader = (req: Request) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}

	return authHeader.split(" ")[1];
};
