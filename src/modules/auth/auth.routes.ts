import { handleFile } from "@/shared/middleware/file";
import { prisma } from "@/shared/services/prisma.service";
import { FileStorageService } from "@/shared/services/file-storage.service";
import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

const router = Router();
const s3Service = new FileStorageService();
const authService = new AuthService(prisma, s3Service);
const authController = new AuthController(authService);

const avatarUpload = handleFile({
	field: "avatar",
	maxSize: 1024 * 1024 * 10,
});

router.post(
	"/signup",
	avatarUpload,
	authController.signup,
);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export const authRoutes = router;
