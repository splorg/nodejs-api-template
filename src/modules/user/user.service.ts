import type { FileStorageService } from "@/shared/services/file-storage.service";
import type { PrismaService } from "@/shared/services/prisma.service";
import { ApplicationError } from "@/shared/types/errors";
import bcrypt from "bcrypt";
import type { UpdateInput } from "./user.validation";

export class UserService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly fileService: FileStorageService,
	) {}

	async getMe(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				name: true,
				avatarKey: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) {
			throw new ApplicationError("User not found", 404);
		}

		let avatarUrl: string | null = null;
		if (user.avatarKey) {
			avatarUrl = await this.fileService.getPresignedUrl(user.avatarKey);
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			avatarUrl,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};
	}

	async update(
		userId: string,
		data: UpdateInput,
		avatar?: Express.Multer.File,
	) {
		const { name, email } = data;

		let avatarKey: string | undefined;
		if (avatar) {
			avatarKey = await this.fileService.uploadFile(avatar, "avatars");
		}

		const updateBody = {
			name,
			email,
			avatarKey,
		};

		const updatedUser = await this.prisma.user.update({
			where: { id: userId },
			data: { ...updateBody },
		});

		let avatarUrl: string | null = null;
		if (updatedUser.avatarKey) {
			avatarUrl = await this.fileService.getPresignedUrl(updatedUser.avatarKey);
		}

		return {
			id: updatedUser.id,
			name: updatedUser.name,
			email: updatedUser.email,
			avatarUrl,
			createdAt: updatedUser.createdAt,
			updatedAt: updatedUser.updatedAt,
		};
	}
}
