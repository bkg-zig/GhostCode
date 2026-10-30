import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async registerEmailOnly(email: string) {
    const existing = await this.db.client.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    // Check if this is the first user (should be ADMIN)
    const userCount = await this.db.client.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const apiKeyRaw = `ghost_${nanoid(32)}`;
    const keyHash = await bcrypt.hash(apiKeyRaw, 10);

    const user = await this.db.client.user.create({
      data: {
        email,
        passwordHash: '', // Will be set via setupPassword
        role,
        apiKeys: {
          create: {
            keyHash,
            tokenBalance: parseInt(process.env.DEFAULT_START_TOKENS || '1000'),
            isActive: true,
          },
        },
        projects: {
          create: {
            name: `${email.split('@')[0]}-project`,
            quotaCpu: 500,
            quotaRam: 512,
            maxCaves: 3,
            allowedLanguages: ['python', 'node', 'rust'],
          },
        },
      },
      include: {
        apiKeys: true,
        projects: true,
      },
    });

    await this.db.client.auditEvent.create({
      data: {
        actorUserId: user.id,
        entityType: 'USER',
        entityId: user.id,
        action: 'CREATE',
        payload: { email },
      },
    });

    // TODO: Send email with setupUrl containing apiKey
    // For now, return it directly (dev mode)

    return {
      email: user.email,
      apiKey: apiKeyRaw,
      userId: user.id,
    };
  }

  async setupPassword(apiKey: string, password: string) {
    // Find user by API key
    const keys = await this.db.client.apiKey.findMany({
      where: { isActive: true },
      include: { user: true },
    });

    let matchedKey = null;
    for (const key of keys) {
      const isMatch = await bcrypt.compare(apiKey, key.keyHash);
      if (isMatch) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if password already set
    if (matchedKey.user.passwordHash && matchedKey.user.passwordHash !== '') {
      throw new ConflictException('Password already set. Please use login.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await this.db.client.user.update({
      where: { id: matchedKey.user.id },
      data: { passwordHash },
    });

    return {
      message: 'Password set successfully. You can now login.',
      email: matchedKey.user.email,
    };
  }

  async login(email: string, password: string) {
    const user = await this.db.client.user.findUnique({
      where: { email },
      include: { apiKeys: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash || user.passwordHash === '') {
      throw new UnauthorizedException('Please setup your password first using the link from your email');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get first active API key for token balance
    const activeKey = user.apiKeys.find(k => k.isActive);
    if (!activeKey) {
      throw new UnauthorizedException('No active API key found');
    }

    await this.db.client.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      apiKeyId: activeKey.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tokenBalance: activeKey.tokenBalance,
      },
    };
  }

  async validateApiKey(apiKey: string) {
    const keys = await this.db.client.apiKey.findMany({
      where: { isActive: true },
      include: { user: true },
    });

    for (const key of keys) {
      const isMatch = await bcrypt.compare(apiKey, key.keyHash);
      if (isMatch) {
        return { user: key.user, apiKey: key };
      }
    }

    return null;
  }
}
