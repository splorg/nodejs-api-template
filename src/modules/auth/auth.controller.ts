import type { Request, Response } from "express";
import type { AuthService } from "./auth.service";
import {
	authValidation,
} from "./auth.validation";

export class AuthController {
	constructor(
		private readonly authService: AuthService,
	) {}

	signup = async (req: Request, res: Response) => {
		const validatedBody = authValidation.signup.parse(req.body);

		const tokens = await this.authService.signup({
			...validatedBody,
			avatar: req.file,
		});

		res.status(201).json({
			tokens,
		});
	}

	login = async (req: Request, res: Response) => {
		const validatedBody = authValidation.login.parse(req.body);

		const tokens = await this.authService.login(
			validatedBody.email,
			validatedBody.password,
		);

		res.status(200).json({
			tokens,
		});
	}

	refresh = async (req: Request, res: Response) => {
		const validatedBody = authValidation.refresh.parse(req.body);

		const tokens = await this.authService.refresh(validatedBody.refreshToken);

		res.status(200).json({
			tokens,
		});
	}

	logout = async (req: Request, res: Response) => {
		const validatedBody = authValidation.logout.parse(req.body);

		await this.authService.logout(validatedBody.refreshToken);

		res.status(200).json({
			message: "Successfully logged out",
		});
	}
}
