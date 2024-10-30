import { config } from "@/config";
import type { FileStorageService } from "@/shared/services/file-storage.service";
import type { PrismaService } from "@/shared/services/prisma.service";
import { ApplicationError } from "@/shared/types/errors";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import type { DeviceInfo, JWTPayload } from "./auth.types";

interface Tokens {
	accessToken: string;
	refreshToken: string;
}

interface SignupData {
	email: string;
	password: string;
	confirmPassword: string;
	name: string;
	avatar?: Express.Multer.File;
}

export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly fileService: FileStorageService,
	) {}

	async signup(data: SignupData, deviceInfo: DeviceInfo): Promise<Tokens> {
		const { email, name, password, confirmPassword, avatar } = data;

		if (password !== confirmPassword) {
			throw new ApplicationError("Passwords do not match", 401);
		}

		const existingUser = await this.prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			throw new ApplicationError("Credentials already in use", 401);
		}

		return await this.prisma.$transaction(async (tx) => {
			let avatarKey: string | undefined;

			if (avatar) {
				const key = await this.fileService.uploadFile(avatar, "avatars");
				avatarKey = key;
			}

			const hashedPassword = await bcrypt.hash(password, 10);

			const user = await tx.user.create({
				data: {
					email,
					name,
					password: hashedPassword,
					avatarKey,
				},
			});

			const device = await tx.device.create({
				data: {
					userId: user.id,
					type: deviceInfo.type,
					name: this.getDeviceName(deviceInfo),
					lastUsedAt: new Date(),
				},
			});

			return this.generateTokens(user.id, device.id, tx);
		});
	}

	async login(
		email: string,
		password: string,
		deviceInfo: DeviceInfo,
	): Promise<Tokens> {
		const user = await this.prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			throw new ApplicationError("Invalid credentials", 401);
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			throw new ApplicationError("Invalid credentials", 401);
		}

		return await this.prisma.$transaction(async (tx) => {
			const device = await tx.device.create({
				data: {
					userId: user.id,
					type: deviceInfo.type,
					name: this.getDeviceName(deviceInfo),
					lastUsedAt: new Date(),
				},
			});

			return this.generateTokens(user.id, device.id, tx);
		});
	}

	async refresh(refreshToken: string): Promise<Tokens> {
		const savedRefreshToken = await this.prisma.refreshToken.findUnique({
			where: { token: refreshToken },
			include: { device: true },
		});

		if (!savedRefreshToken || !savedRefreshToken.isValid) {
			throw new ApplicationError("Invalid refresh token", 401);
		}

		let payload: JWTPayload;
		try {
			payload = jwt.verify(
				refreshToken,
				config.jwt.refreshSecret,
			) as JWTPayload;
		} catch (error) {
			await this.invalidateRefreshToken(refreshToken);
			throw new ApplicationError("Invalid refresh token", 401);
		}

		return await this.prisma.$transaction(async (tx) => {
			await tx.refreshToken.update({
				where: { token: refreshToken },
				data: { isValid: false },
			});

			await tx.device.update({
				where: { id: payload.deviceId },
				data: { lastUsedAt: new Date() },
			});

			return this.generateTokens(payload.userId, payload.deviceId, tx);
		});
	}

	async logout(refreshToken: string) {
		await this.invalidateRefreshToken(refreshToken);
	}

	async getDevices(userId: string) {
		const devices = await this.prisma.device.findMany({
			where: { userId, refreshTokens: { some: { isValid: true } } },
			select: {
				id: true,
				name: true,
				type: true,
				lastUsedAt: true,
			},
		});

		return devices;
	}

	async logoutDevice(id: string) {
		const refreshToken = await this.prisma.refreshToken.findFirst({
			where: { id },
			select: { token: true },
		});

		if (!refreshToken) {
			throw new ApplicationError("Device not found", 404);
		}

		await this.invalidateRefreshToken(refreshToken.token);
	}

	async logoutAllDevices(userId: string) {
		await this.prisma.refreshToken.updateMany({
			where: { userId },
			data: { isValid: false },
		});
	}

	async changePassword(
		userId: string,
		password: string,
		confirmPassword: string,
		deviceId: string,
	) {
		const existingUser = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!existingUser) {
			throw new ApplicationError("User not found", 404);
		}

		if (password !== confirmPassword) {
			throw new ApplicationError("Passwords do not match", 401);
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		return this.prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: userId },
				data: { password: hashedPassword },
			});

			await tx.refreshToken.updateMany({
				where: { userId, deviceId: { notIn: [deviceId] } },
				data: { isValid: false },
			});
		});
	}

	async forceUserLogout(userId: string) {
		await this.prisma.user.update({
			where: { id: userId },
			data: { tokenVersion: { increment: 1 } },
		});
	}

	private getDeviceName(info: DeviceInfo): string {
		if (info.type === "web" && info.userAgent) {
			const parser = new UAParser(info.userAgent);
			const result = parser.getResult();
			return `${result.browser.name || "Browser"} on ${result.os.name || "unknown OS"}`;
		}

		if ((info.type === "ios" || info.type === "android") && info.model) {
			return info.model;
		}

		return `${info.type.charAt(0).toUpperCase() + info.type.slice(1)} Device`;
	}

	private async invalidateRefreshToken(refreshToken: string) {
		await this.prisma.refreshToken.update({
			where: { token: refreshToken },
			data: { isValid: false },
		});
	}

	private async generateTokens(
		userId: string,
		deviceId: string,
		tx: Prisma.TransactionClient,
	): Promise<Tokens> {
		const user = await tx.user.findUnique({ where: { id: userId } });
		if (!user) throw new ApplicationError("User not found", 404);

		const payload: JWTPayload = {
			userId,
			deviceId,
			tokenVersion: user.tokenVersion,
		};

		await tx.refreshToken.updateMany({
			where: {
				userId,
				deviceId,
				isValid: true,
			},
			data: {
				isValid: false,
			},
		});

		const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
			expiresIn: config.jwt.accessExpiry,
		});

		const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
			expiresIn: config.jwt.refreshExpiry,
		});

		await tx.refreshToken.create({
			data: {
				token: refreshToken,
				userId,
				deviceId,
			},
		});

		return { accessToken, refreshToken };
	}
}
