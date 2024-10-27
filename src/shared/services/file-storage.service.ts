import { randomUUID } from "node:crypto";
import { config } from "@/config";
import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class FileStorageService {
	private readonly s3Client: S3Client;
	private readonly bucketName: string;

	constructor() {
		const isDevelopment = config.env === 'development';
    
    this.s3Client = new S3Client({
      ...config.storage,
      credentials: {
        accessKeyId: config.storage.credentials.accessKeyId,
        secretAccessKey: config.storage.credentials.secretAccessKey,
      },
      endpoint: isDevelopment ? config.storage.endpoint : undefined,
      forcePathStyle: isDevelopment ? true : undefined,
      region: config.storage.region,
    });
		this.bucketName = config.storage.bucket;
	}

	async uploadFile(file: Express.Multer.File, folder: string) {
		const fileExtension = file.originalname.split(".").pop();
		const key = `${folder}/${randomUUID()}.${fileExtension}`;

		const putObjectCommand = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: file.buffer,
			ContentType: file.mimetype,
		});

		await this.s3Client.send(putObjectCommand);

		return key;
	}

	async getPresignedUrl(key: string) {
		const command = new GetObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});

		return await getSignedUrl(this.s3Client, command, {
			expiresIn: 3600,
		});
	}
}
