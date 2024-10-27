import { config } from "@/config";
import type { PrismaService } from "@/shared/services/prisma.service";
import { ApplicationError } from "@/shared/types/errors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { FileStorageService } from "@/shared/services/file-storage.service";

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

	async signup(data: SignupData): Promise<Tokens> {
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
  
      const accessToken = jwt.sign({ userId: user.id }, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiry,
      });
  
      const refreshToken = jwt.sign({ userId: user.id }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiry,
      });
  
      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
        },
      });
  
      return { accessToken, refreshToken };
    });
	}

	async login(email: string, password: string): Promise<Tokens> {
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

		return this.generateTokens(user.id);
	}

	async refresh(refreshToken: string): Promise<Tokens> {
		const savedRefreshToken = await this.prisma.refreshToken.findUnique({
			where: { token: refreshToken },
		});

		if (!savedRefreshToken || !savedRefreshToken.isValid) {
			throw new ApplicationError("Invalid refresh token", 401);
		}

		try {
			jwt.verify(refreshToken, config.jwt.refreshSecret);
		} catch (error) {
			await this.invalidateRefreshToken(refreshToken);
			throw new ApplicationError("Invalid refresh token", 401);
		}

		await this.invalidateRefreshToken(refreshToken);
		return this.generateTokens(savedRefreshToken.userId);
	}

	async logout(refreshToken: string) {
		await this.invalidateRefreshToken(refreshToken);
	}

	private async invalidateRefreshToken(refreshToken: string) {
		await this.prisma.refreshToken.update({
			where: { token: refreshToken },
			data: { isValid: false },
		});
	}

	private async generateTokens(userId: string): Promise<Tokens> {
		const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, {
			expiresIn: config.jwt.accessExpiry,
		});

		const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, {
			expiresIn: config.jwt.refreshExpiry,
		});

		await this.prisma.refreshToken.create({
			data: {
				token: refreshToken,
				userId,
			},
		});

		return { accessToken, refreshToken };
	}
}
