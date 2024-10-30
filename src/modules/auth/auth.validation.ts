import { PASSWORD_MIN_LENGTH, PASSWORD_PATTERN } from "@/shared/constants";
import { z } from "zod";

export const authValidation = {
	signup: z
		.object({
			email: z.string().email("Invalid email format"),
			password: z
				.string()
				.min(
					PASSWORD_MIN_LENGTH,
					`Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
				)
				.regex(
					PASSWORD_PATTERN,
					"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
				),
			confirmPassword: z.string(),
			name: z
				.string()
				.min(2, "Name must be at least 2 characters")
				.max(50, "Name cannot exceed 50 characters")
				.regex(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces"),
			deviceType: z.enum(["web", "ios", "android", "other"]),
			model: z.string().optional(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: "Passwords don't match",
			path: ["confirmPassword"],
		}),

	login: z.object({
		email: z.string().email("Invalid email format"),
		password: z.string().min(1, "Password is required"),
		deviceType: z.enum(["web", "ios", "android", "other"]),
		model: z.string().optional(),
	}),

	refresh: z.object({
		refreshToken: z.string().min(1, "Refresh token is required"),
	}),

	logout: z.object({
		refreshToken: z.string().min(1, "Refresh token is required"),
	}),

	logoutDevice: z.object({
		deviceId: z.string().min(1, "Device ID is required"),
	}),

	changePassword: z
		.object({
			password: z
				.string()
				.min(
					PASSWORD_MIN_LENGTH,
					`Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
				)
				.regex(
					PASSWORD_PATTERN,
					"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
				),
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: "Passwords don't match",
			path: ["confirmPassword"],
		}),
};

export type SignupInput = z.infer<typeof authValidation.signup>;
export type LoginInput = z.infer<typeof authValidation.login>;
export type RefreshInput = z.infer<typeof authValidation.refresh>;
export type LogoutInput = z.infer<typeof authValidation.logout>;
