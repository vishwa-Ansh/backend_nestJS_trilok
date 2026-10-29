import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';

@Injectable()
export class AuthGuard
    implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean {
        const request =
            context.switchToHttp().getRequest<Request>();

        const token = request.cookies?.token;

        if (!token) {
            throw new UnauthorizedException(
                'Not authenticated',
            );
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new UnauthorizedException(
                'Authentication service is not configured',
            );
        }

        try {
            const decoded = jwt.verify(
                token,
                secret,
            );

            if (
                !decoded ||
                typeof decoded !== 'object' ||
                !decoded.userId
            ) {
                throw new UnauthorizedException(
                    'Invalid session',
                );
            }

            request.user = {
                userId: Number(decoded.userId),
            };

            return true;
        } catch {
            throw new UnauthorizedException(
                'Invalid or expired session',
            );
        }
    }
}