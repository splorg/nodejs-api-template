import chalk from "chalk";

export class LoggerService {
	constructor(private readonly context: string) {}

	info(message: string) {
		console.log(
			chalk.blue.bold("INFO: "),
			message,
			"-",
			chalk.italic.dim(this.context),
		);
	}

	warn(message: string) {
		console.log(
			chalk.yellow.bold("WARNING: "),
			message,
			"-",
			chalk.italic.dim(this.context),
		);
	}

	error(message: string | Error) {
		console.error(
			chalk.red.bold("ERROR: "),
			message,
			"-",
			chalk.italic.dim(this.context),
		);
	}
}
