import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(private readonly prisma: PrismaService) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  private createToken(userId: number) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    return jwt.sign({ userId: String(userId) }, secret, {
      expiresIn: '7d',
    });
  }

  private sanitizeUser(user: any) {
    if (!user) return null;

    return {
      id: String(user.id),
      name: user.name,
      email: user.email,
      avatar: user.avatar ?? null,
      emailVerified: Boolean(user.emailVerified),
    };
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async register(name: unknown, email: unknown, password: unknown) {
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      throw new BadRequestException('Name, email and password must be strings');
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();

    if (!trimmedName || !normalizedEmail || !password) {
      throw new BadRequestException('Name, email and password are required');
    }

    if (trimmedName.length < 2) {
      throw new BadRequestException('Name must be at least 2 characters');
    }

    if (trimmedName.length > 100) {
      throw new BadRequestException('Name is too long');
    }

    if (!this.isValidEmail(normalizedEmail)) {
      throw new BadRequestException('Please enter a valid email address');
    }

    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    if (password.length > 128) {
      throw new BadRequestException('Password is too long');
    }

    const existingUser = await this.prisma.client.orm.public.User.where({
      email: normalizedEmail,
    }).first();

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.client.orm.public.User.create({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
      avatar: null,
      emailVerified: false,
    });

    return {
      token: this.createToken(user.id),
      user: this.sanitizeUser(user),
    };
  }

  async login(email: unknown, password: unknown) {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new BadRequestException('Email and password must be strings');
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      throw new BadRequestException('Email and password are required');
    }

    if (!this.isValidEmail(normalizedEmail)) {
      throw new BadRequestException('Please enter a valid email address');
    }

    const user = await this.prisma.client.orm.public.User.where({
      email: normalizedEmail,
    }).first();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('This account uses social login');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      token: this.createToken(user.id),
      user: this.sanitizeUser(user),
    };
  }

  async getCurrentUser(userId: number) {
    const user = await this.prisma.client.orm.public.User.where({
      id: userId,
    }).first();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async updateAccount(userId: number, name: unknown) {
    if (typeof name !== 'string') {
      throw new BadRequestException('Name must be a string');
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new BadRequestException('Name is required');
    }

    if (trimmedName.length < 2) {
      throw new BadRequestException('Name must be at least 2 characters');
    }

    if (trimmedName.length > 100) {
      throw new BadRequestException('Name is too long');
    }

    const user = await this.prisma.client.orm.public.User.where({
      id: userId,
    }).first();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const updatedUser = await this.prisma.client.orm.public.User.where({
      id: user.id,
    }).update({
      name: trimmedName,
    });

    return this.sanitizeUser(updatedUser);
  }

  async googleLogin(credential: unknown) {
    if (typeof credential !== 'string' || !credential.trim()) {
      throw new BadRequestException('Google credential is required');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new InternalServerErrorException(
        'Google authentication is not configured',
      );
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException('Invalid Google credential');
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!googleId || !email) {
      throw new UnauthorizedException(
        'Google account information is incomplete',
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await this.prisma.client.orm.public.User.where({
      email: normalizedEmail,
    }).first();

    if (!user) {
      user = await this.prisma.client.orm.public.User.create({
        name: name?.trim() || 'Google User',
        email: normalizedEmail,
        passwordHash: null,
        avatar: picture || null,
        emailVerified: Boolean(email_verified),
      });
    }

    const existingProvider =
      await this.prisma.client.orm.public.AuthProvider.where({
        provider: 'google',
        providerId: googleId,
      }).first();

    if (!existingProvider) {
      await this.prisma.client.orm.public.AuthProvider.create({
        provider: 'google',
        providerId: googleId,
        userId: user.id,
      });
    }

    return {
      token: this.createToken(user.id),
      user: this.sanitizeUser(user),
    };
  }
}
