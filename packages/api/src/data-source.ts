import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_DATABASE || "app_db",
    synchronize: process.env.NODE_ENV !== "production", // Auto-create schema in development
    logging: process.env.NODE_ENV !== "production",
    entities: ["src/entities/**/*.ts"], // Path to your entity files
    migrations: ["src/migrations/**/*.ts"],
    subscribers: ["src/subscribers/**/*.ts"],
});