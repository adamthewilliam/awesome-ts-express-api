import { Middleware } from 'routing-controllers';
import type { ExpressErrorMiddlewareInterface } from 'routing-controllers';
import type { Request, Response, NextFunction } from 'express';
import { Service } from 'typedi';
import { ValidationError } from 'class-validator';
import { QueryFailedError } from 'typeorm';

interface HttpError {
    httpCode: number;
    message: string;
    errors?: any[];
}

interface ValidationErrors {
    errors: ValidationError[];
}

function isHttpError(error: unknown): error is HttpError {
    return typeof error === 'object' && error !== null && 'httpCode' in error;
}

function isValidationErrors(error: unknown): error is ValidationErrors {
    return (
        typeof error === 'object' &&
        error !== null &&
        'errors' in error &&
        Array.isArray((error as any).errors) &&
        (error as any).errors.length > 0 &&
        (error as any).errors[0] instanceof ValidationError
    );
}

@Middleware({ type: 'after' })
@Service()
export class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
    error(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
        console.error('Error caught by middleware:', error);

        res.setHeader('Content-Type', 'application/json');

        if (isHttpError(error)) {
            // routing-controllers error
            res.status(error.httpCode).json({
                status: 'error',
                message: error.message,
                errors: error.errors || []
            });
        }

        if (isValidationErrors(error)) {
            const formattedErrors = error.errors.map(err => ({
                property: err.property,
                constraints: err.constraints || {},
                value: err.value
            }));

            res.status(400).json({
                status: 'error',
                message: 'Validation error',
                errors: formattedErrors
            });
        }

        if (error instanceof QueryFailedError) {
            const isDev = process.env.NODE_ENV !== 'production';

            res.status(500).json({
                status: 'error',
                message: 'Database operation failed',
                error: isDev ? (error as any).message : undefined,
                code: isDev ? (error as any).code : undefined
            });
        }

        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: isDev && error instanceof Error ? error.message : undefined
        });
    }
}