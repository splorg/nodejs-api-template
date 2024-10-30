export interface DeviceInfo {
	type: "web" | "ios" | "android" | "other";
	userAgent?: string;
	model?: string;
}

export interface JWTPayload {
	userId: string;
	deviceId: string;
	tokenVersion: number;
}

export interface AuthenticatedUser {
	id: string;
	email: string;
	name: string;
	tokenVersion: number;
}
