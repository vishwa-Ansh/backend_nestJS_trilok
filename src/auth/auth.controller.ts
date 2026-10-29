import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite:
        process.env.NODE_ENV === 'production'
            ? ('none' as const)
            : ('lax' as const),
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clearCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite:
        process.env.NODE_ENV === 'production'
            ? ('none' as const)
            : ('lax' as const),
};

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(
        @Body() body: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.register(
            body.name,
            body.email,
            body.password,
        );

        res.cookie('token', result.token, cookieOptions);

        return {
            success: true,
            message: 'Account created successfully',
            user: result.user,
        };
    }

    @Post('login')
    async login(
        @Body() body: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(
            body.email,
            body.password,
        );

        res.cookie('token', result.token, cookieOptions);

        return {
            success: true,
            message: 'Signed in successfully',
            user: result.user,
        };
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('token', clearCookieOptions);

        return {
            success: true,
            message: 'Logged out successfully',
        };
    }

    @UseGuards(AuthGuard)
    @Get('me')
    async getCurrentUser(@Req() req: Request) {
        return {
            success: true,
            user: await this.authService.getCurrentUser(
                req.user.userId,
            ),
        };
    }

    @UseGuards(AuthGuard)
    @Patch('profile')
    async updateAccount(
        @Req() req: Request,
        @Body() body: UpdateProfileDto,
    ) {
        return {
            success: true,
            message: 'Account updated successfully',
            user: await this.authService.updateAccount(
                req.user.userId,
                body.name,
            ),
        };
    }

    @Post('google')
    async googleLogin(
        @Body() body: GoogleLoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.googleLogin(
            body.credential,
        );

        res.cookie('token', result.token, cookieOptions);

        return {
            success: true,
            message: 'Google login successful',
            user: result.user,
        };
    }
}