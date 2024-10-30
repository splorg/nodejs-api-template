import { authenticate } from "@/shared/middleware/authenticate";
import { FileStorageService } from "@/shared/services/file-storage.service";
import { prisma } from "@/shared/services/prisma.service";
import { Router } from "express";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

const router = Router();
const fileService = new FileStorageService();
const userService = new UserService(prisma, fileService);
const userController = new UserController(userService);

router.get("/me", authenticate, userController.getMe);

export const userRoutes = router;
