# nodejs-api-template

This repository is my personal template for creating a REST API with Node.js. It comes fully featured with: 

- Express.js with TypeScript
- CORS support
- Environment variables support and validation
- Local dev environment with a docker-compose.yml file which includes:
  - A PostgreSQL database
  - MinIO for object storage (S3 compatible)
- Prisma ORM with schema including users and refresh tokens 
- User signup and authentication
  - Optional avatar upload
  - JWT authentication with refresh tokens
  - Logged-in devices tracking/management
  - Authentication middleware
- S3-compatible file uploading service
- Logger service
- Error handling middleware
- Zod schema validation
- Biome.js for linting and formatting

Feel free to use this template as a starting point for your own projects.

## Getting Started

To get started, follow these steps:

1. Clone the repository
2. Install dependencies using `npm install`
3. Create a `.env` file based on the `.env.example` file
    1. Optionally, you can run `docker compose up -d` to get database and object storage containers running
4. Run `npx prisma generate dev` to generate the Prisma client 
5. Run `npx prisma migrate dev` to create the database schema
6. Run `npm run dev` to start the server
7. Happy coding!

## Architecture

The template uses a simple architecture, implementing a modular monolith design.

- The application entrypoint is `src/main.ts`, which sets up and initializes the Express.js server.
- The `src/config` directory contains the global configuration for the API.
- The `src/shared` directory contains shared code, such as middleware, services, constants, and utilities.
- In the `src/modules` directory, different features of the application are implemented as modules.
  - Each module is it's own directory, with router, controller, service, validation schemas, and other module-specific files.

## Future Plans

- Add more features
  - Unit and integration test support
  - Swagger documentation
  - Rate limiting
  - Queue for background jobs (BullMQ?)
- Module scaffolding with Plop
- Fastify branch