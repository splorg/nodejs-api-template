import { extname } from "node:path";
import { NextFunction, type Request, type Response } from "express";
import multer from "multer";

declare global {
	namespace Express {
		interface Request {
			fileValidation?: {
				error?: string;
				mimeType?: string;
				extension?: string;
				size?: number;
			};
		}
	}
}

interface FileOptions {
	field: string;
	maxSize: number;
	allowedMimeTypes?: string[];
	allowedExtensions?: string[];
	required?: boolean;
}

export const handleFile = (options: FileOptions) => {
	const {
		field,
		maxSize = 5 * 1024 * 1024,
		allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"],
		allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"],
		required = false,
	} = options;

	const upload = multer({
		storage: multer.memoryStorage(),
		limits: {
			fileSize: maxSize,
		},
		fileFilter: (req, file, cb) => {
			req.fileValidation = {
				mimeType: file.mimetype,
				extension: extname(file.originalname),
				size: file.size,
			};

			if (!allowedMimeTypes.includes(file.mimetype)) {
				req.fileValidation.error = `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`;
				return cb(null, false);
			}

			const fileExtension = extname(file.originalname);
			if (!allowedExtensions.includes(fileExtension)) {
				req.fileValidation.error = `Invalid file extension. Allowed extensions: ${allowedExtensions.join(", ")}`;
				return cb(null, false);
			}

			cb(null, true);
		},
	}).single(field);

	return (req: Request, res: Response, next: NextFunction) => {
		upload(req, res, (err) => {
			if (err instanceof multer.MulterError) {
				if (err.code === "LIMIT_FILE_SIZE") {
					res.status(400).json({
						error: `File too large. Maximum size allowed is ${maxSize / (1024 * 1024)}MB`,
					});
					return;
				}
				res.status(400).json({
					error: err.message,
				});
				return;
			}
			if (err) {
				res.status(500).json({
					error: "Something went wrong processing the file",
				});
				return;
			}

			if (required && !req.file) {
				if (req.fileValidation?.error) {
					res.status(400).json({
						error: req.fileValidation.error,
					});
					return;
				}

				res.status(400).json({
					error: `${field} is required`,
				});
				return;
			}

			if (req.fileValidation?.error) {
				res.status(400).json({
					error: req.fileValidation.error,
				});
				return;
			}

      next();
		});
	};
};
