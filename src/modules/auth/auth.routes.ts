import { authenticate } from "@/shared/middleware/authenticate";
import { handleFile } from "@/shared/middleware/file";
import { FileStorageService } from "@/shared/services/file-storage.service";
import { prisma } from "@/shared/services/prisma.service";
import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

const router = Router();
const fileService = new FileStorageService();
const authService = new AuthService(prisma, fileService);
const authController = new AuthController(authService);

const avatarUpload = handleFile({
	field: "avatar",
	maxSize: 1024 * 1024 * 10,
});

router.post("/signup", avatarUpload, authController.signup);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.get("/devices", authenticate, authController.getDevices);
router.post("/logout/device", authenticate, authController.logoutDevice);
router.post(
	"/logout/device/all",
	authenticate,
	authController.logoutAllDevices,
);
router.patch("/password", authenticate, authController.changePassword);

export const authRoutes = router;
