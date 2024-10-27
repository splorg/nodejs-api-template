import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApplicationError } from "../types/errors";

export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (err instanceof ZodError) {
		res.status(400).json({ error: err.issues[0].message });
		return;
	}

	if (err instanceof ApplicationError) {
		res.status(err.statusCode).json({ error: err.message });
		return;
	}

	console.error(err);
	res.status(500).json({ error: "Internal server error" });
};
