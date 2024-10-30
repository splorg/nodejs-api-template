import { config as loadEnv } from "dotenv";

loadEnv();

interface StorageConfig {
	credentials: {
		accessKeyId: string;
		secretAccessKey: string;
	};
	bucket: string;
	endpoint?: string;
	region: string;
	forcePathStyle?: boolean;
	credentials_provider?: string;
	use_path_style_endpoint?: boolean;
	s3ForcePathStyle?: boolean;
}

interface JwtConfig {
	accessSecret: string;
	refreshSecret: string;
	accessExpiry: string;
	refreshExpiry: string;
}

interface Config {
	env: "development" | "production";
	frontendUrl: string;
	port: number;
	storage: StorageConfig;
	jwt: JwtConfig;
}

function validateEnvVars(): void {
	const requiredVars = [
		"NODE_ENV",
		"PORT",
		"BUCKET_NAME",
		"FRONTEND_URL",
		"DATABASE_URL",
		"JWT_ACCESS_SECRET",
		"JWT_REFRESH_SECRET",
		"JWT_ACCESS_EXPIRY",
		"JWT_REFRESH_EXPIRY",
	];

	if (process.env.NODE_ENV === "production") {
		requiredVars.push(
			"AWS_ACCESS_KEY_ID",
			"AWS_SECRET_ACCESS_KEY",
			"AWS_REGION",
		);
	} else {
		requiredVars.push(
			"MINIO_ROOT_USER",
			"MINIO_ROOT_PASSWORD",
			"MINIO_ENDPOINT",
		);
	}

	const missingVars = requiredVars.filter((varName) => !process.env[varName]);

	if (missingVars.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missingVars.join(", ")}`,
		);
	}
}

function createStorageConfig(): StorageConfig {
	const isDevelopment = process.env.NODE_ENV !== "production";

	if (isDevelopment) {
		return {
			credentials: {
				accessKeyId: process.env.MINIO_ROOT_USER!,
				secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
			},
			bucket: process.env.BUCKET_NAME!,
			endpoint: process.env.MINIO_ENDPOINT,
			region: "us-east-1",
			forcePathStyle: true,
			credentials_provider: "function",
			use_path_style_endpoint: true,
			s3ForcePathStyle: true,
		};
	}

	return {
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
		},
		bucket: process.env.BUCKET_NAME!,
		region: process.env.AWS_REGION!,
	};
}

validateEnvVars();

const config: Config = {
	env: process.env.NODE_ENV === "production" ? "production" : "development",
	port: Number.parseInt(process.env.PORT || "3000", 10),
	frontendUrl: process.env.FRONTEND_URL!,
	storage: createStorageConfig(),
	jwt: {
		accessSecret: process.env.JWT_ACCESS_SECRET!,
		refreshSecret: process.env.JWT_REFRESH_SECRET!,
		accessExpiry: process.env.JWT_ACCESS_EXPIRY!,
		refreshExpiry: process.env.JWT_REFRESH_EXPIRY!,
	},
};

Object.freeze(config);
Object.freeze(config.storage);
Object.freeze(config.storage.credentials);
Object.freeze(config.jwt);

export { config };
