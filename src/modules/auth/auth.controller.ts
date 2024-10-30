import type { Request, Response } from "express";
import type { AuthService } from "./auth.service";
import { authValidation } from "./auth.validation";

export class AuthController {
	constructor(private readonly authService: AuthService) {}

	signup = async (req: Request, res: Response) => {
		const validatedBody = authValidation.signup.parse(req.body);

		const tokens = await this.authService.signup(
			{
				...validatedBody,
				avatar: req.file,
			},
			{
				type: validatedBody.deviceType,
				model: validatedBody.model,
				userAgent:
					validatedBody.deviceType === "web"
						? req.headers["user-agent"]
						: undefined,
			},
		);

		res.status(201).json({
			tokens,
		});
	};

	login = async (req: Request, res: Response) => {
		const validatedBody = authValidation.login.parse(req.body);

		const tokens = await this.authService.login(
			validatedBody.email,
			validatedBody.password,
			{
				type: validatedBody.deviceType,
				model: validatedBody.model,
				userAgent:
					validatedBody.deviceType === "web"
						? req.headers["user-agent"]
						: undefined,
			},
		);

		res.status(200).json({
			tokens,
		});
	};

	refresh = async (req: Request, res: Response) => {
		const validatedBody = authValidation.refresh.parse(req.body);

		const tokens = await this.authService.refresh(validatedBody.refreshToken);

		res.status(200).json({
			tokens,
		});
	};

	logout = async (req: Request, res: Response) => {
		const validatedBody = authValidation.logout.parse(req.body);

		await this.authService.logout(validatedBody.refreshToken);

		res.status(200).json({
			message: "Successfully logged out",
		});
	};

	getDevices = async (req: Request, res: Response) => {
		const userId = req.user.id;

		const devices = await this.authService.getDevices(userId);

		res.status(200).json(devices);
	};

	logoutDevice = async (req: Request, res: Response) => {
		const validatedBody = authValidation.logoutDevice.parse(req.body);

		if (validatedBody.deviceId === req.deviceId) {
			res.status(400).json({
				error: "Cannot logout current device. Use /logout endpoint instead.",
			});
			return;
		}

		await this.authService.logoutDevice(validatedBody.deviceId);

		res.status(200).json({
			message: "Successfully logged out from device",
		});
	};

	logoutAllDevices = async (req: Request, res: Response) => {
		await this.authService.logoutAllDevices(req.user.id);

		res.status(200).json({
			message: "Successfully logged out from all devices",
		});
	};

	changePassword = async (req: Request, res: Response) => {
		const validatedBody = authValidation.changePassword.parse(req.body);

		await this.authService.changePassword(
			req.user.id,
			validatedBody.password,
			validatedBody.confirmPassword,
			req.deviceId,
		);

		res.status(200).json({
			message: "Password successfully changed",
		});
	};
}
