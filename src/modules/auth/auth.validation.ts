import { z } from "zod";

export const authValidation = {
	signup: z
		.object({
			email: z.string().email("Invalid email format"),
			password: z
				.string()
				.min(8, "Password must be at least 8 characters")
				.regex(
					/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
					"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
				),
			confirmPassword: z.string(),
			name: z
				.string()
				.min(2, "Name must be at least 2 characters")
				.max(50, "Name cannot exceed 50 characters")
				.regex(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces"),
			avatarKey: z.string().optional().nullable(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: "Passwords don't match",
			path: ["confirmPassword"],
		}),

	login: z.object({
		email: z.string().email("Invalid email format"),
		password: z.string().min(1, "Password is required"),
	}),

	refresh: z.object({
		refreshToken: z.string().min(1, "Refresh token is required"),
	}),

	logout: z.object({
		refreshToken: z.string().min(1, "Refresh token is required"),
	}),
};

export type SignupInput = z.infer<typeof authValidation.signup>;
export type LoginInput = z.infer<typeof authValidation.login>;
export type RefreshInput = z.infer<typeof authValidation.refresh>;
export type LogoutInput = z.infer<typeof authValidation.logout>;
