import express from "express";
import {type Action, useContainer, useExpressServer} from "routing-controllers";
import { Container } from "typedi";
import { AppDataSource } from "./data-source.js";

useContainer(Container);

async function bootstrap() {
    const app = express();

    app.use(express.json());

    try {
        await AppDataSource.initialize();
        console.log("Database connection established");

        useExpressServer(app, {
            controllers: ["src/controllers/**/*.ts"],
            middlewares: ["src/middlewares/**/*.ts"],
            validation: {
                whitelist: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false, value: false }
            },

            authorizationChecker: async (action: Action, roles: string[] = []) => {
                // If @Authorized(false) is used, allow access without checking
                if (roles.length === 1 && roles[0] === 'public') {
                    return true;
                }

                // Get user from request (set by AuthMiddleware)
                const user = action.request.user;

                // No user means not authenticated
                if (!user) {
                    return false;
                }

                // If no specific roles required but user exists, grant access
                if (roles.length === 0) {
                    return true;
                }

                // Check if user has required roles
                return roles.some(role => user.roles?.includes(role));
            },

            // Optional: Provide current user to controllers
            currentUserChecker: (action: Action) => action.request.user
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Error during application startup:", error);
        process.exit(1);
    }
}

bootstrap().catch(console.error);