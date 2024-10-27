export class ApplicationError extends Error {
	statusCode: number;

	constructor(message: string, statusCode = 500) {
		super(message);
		this.name = "ApplicationError";
		this.statusCode = statusCode;
	}
}
