import type { Request, Response } from "express";
import type { UserService } from "./user.service";
import { userValidation } from "./user.validation";

export class UserController {
	constructor(private readonly userService: UserService) {}

	getMe = async (req: Request, res: Response) => {
		if (!req.user) {
			res.status(401).json({
				error: "Authentication required. No token provided.",
			});
			return;
		}

		const userId = req.user.id;
		const user = await this.userService.getMe(userId);

		res.status(200).json(user);
	};

	update = async (req: Request, res: Response) => {
		const validatedBody = userValidation.update.parse(req.body);
		const userId = req.user.id;
		const newAvatar = req.file;

		const updatedUser = await this.userService.update(
			userId,
			validatedBody,
			newAvatar,
		);

		res.status(200).json(updatedUser);
	};
}
