import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

declare global {
	namespace Express {
		interface Response {
			locals: {
        startTime: number;
      }
		}
	}
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  res.locals.startTime = Date.now();

  console.log(
    chalk.green('Start:'),
    chalk.yellow(req.method),
    req.originalUrl
  );

  res.on('finish', () => {
    const duration = Date.now() - res.locals.startTime;
    let statusColor = chalk.green;

    if (res.statusCode >= 500) {
      statusColor = chalk.red;
    } else if (res.statusCode >= 400) {
      statusColor = chalk.yellow;
    }

    console.log(
      chalk.green('Finished:'),
      chalk.yellow(req.method),
      req.originalUrl,
      '-',
      statusColor(res.statusCode),
      chalk.gray(`${duration}ms`)
    );
  });

  next();
};