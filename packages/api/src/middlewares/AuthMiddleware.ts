import { ExpressMiddlewareInterface } from 'routing-controllers';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Inject } from 'typedi';
import { UserService } from '../services/UserService';

export class AuthMiddleware implements ExpressMiddlewareInterface {
    @Inject()
    private userService: UserService;

    async use(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                res.status(401).send({ message: 'Authentication token is missing' });
                return;
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            const user = await this.userService.findOne(decoded.id);

            req.user = user;
            next();
        } catch (error) {
            res.status(401).send({ message: 'Invalid authentication token' });
        }
    }
}