import express from "express";
import "express-async-errors";
import cors from "cors";
import { config } from "./config";
import { authRoutes } from "./modules/auth/auth.routes";
import { userRoutes } from "./modules/user/user.routes";
import { errorHandler } from "./shared/middleware/errorHandler";
import { requestLogger } from "./shared/middleware/requestLogger";
import { logRoutes } from "./shared/utils";

const app = express();

app.use(
	cors({
		origin: [config.frontendUrl],
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
	logRoutes(app);
	console.log(
		`Server running on port ${config.port}. Environment: ${config.env}`,
	);
});
