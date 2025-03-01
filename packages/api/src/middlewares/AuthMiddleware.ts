import { Middleware } from 'routing-controllers';
import type { ExpressMiddlewareInterface } from 'routing-controllers';
import type { Request, Response, NextFunction } from 'express';
import { Service, Inject } from 'typedi';
import * as jwt from "jsonwebtoken";
import { UserService } from '../services/UserService.js';
import { UnauthorizedError } from '../domain/UnauthorizedError.js';
import { User } from '../entity/User.js';

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

interface JwtPayload {
    id: string;
    email: string;
    iat?: number;
    exp?: number;
}

@Middleware({ type: 'before' })
@Service()
export class AuthMiddleware implements ExpressMiddlewareInterface {
    constructor(
        @Inject()
        private userService: UserService
    ) {}

    async use(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new UnauthorizedError('Authentication token missing or invalid format');
            }

            const token = authHeader.split(' ')[1];

            if (!token)
                throw new UnauthorizedError('Invalid token');

            // Verify JWT token
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                console.error('JWT_SECRET environment variable is not set');
                throw new UnauthorizedError('Server authentication configuration error');
            }

            try {
                // Verify and decode the token
                const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

                // Get user from database (important for checking if user still exists or was disabled)
                const user = await this.userService.findOne(decoded.id);

                if (!user) {
                    throw new UnauthorizedError('User no longer exists');
                }

                if (!user.isActive) {
                    throw new UnauthorizedError('User account is deactivated');
                }

                // Add user to request object
                req.user = user;
                next();
            } catch (jwtError) {
                // Handle specific JWT errors
                if (jwtError instanceof jwt.TokenExpiredError) {
                    throw new UnauthorizedError('Authentication token expired');
                } else if (jwtError instanceof jwt.JsonWebTokenError) {
                    throw new UnauthorizedError('Invalid authentication token');
                } else {
                    throw jwtError; // Re-throw other errors
                }
            }
        } catch (error) {
            // Forward to the error handling middleware
            if (error instanceof UnauthorizedError) {
                res.status(401).json({
                    status: 'error',
                    message: error.message,
                    code: 'UNAUTHORIZED'
                });
                return;
            }

            next(error);
        }
    }
}