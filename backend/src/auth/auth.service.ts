import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  JwtPayload,
  AuthTokens,
} from './schemas/auth.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12); 

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role as 'CLIENT' | 'PROVIDER',
      },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if(stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.generateTokens(stored.user.id, stored.user.email, stored.user.role);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  private async generateTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, role };
    const plainPayload = {...payload};



    const accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
    const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(plainPayload, {
        expiresIn: accessTokenExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
        secret: process.env.JWT_SECRET ?? 'fallback_access_secret',
      }),
      this.jwt.signAsync(payload as unknown as Record<string, unknown>, {
        expiresIn: refreshTokenExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
        secret: process.env.JWT_SECRET ?? 'fallback_refresh_secret',
      }),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
