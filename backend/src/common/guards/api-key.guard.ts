import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Simple API Key auth (no JWT).
 *
 * Expected header: `x-api-key: <key>`
 * Server config: `SUBSCRIPTION_PLANS_API_KEY` (recommended) or `API_KEY`.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const provided =
      (req.headers?.['x-api-key'] as string | undefined) ||
      (req.headers?.['X-API-KEY'] as string | undefined) ||
      (req.headers?.['api-key'] as string | undefined);

    const expected =
      this.configService.get<string>('apiKeys.subscriptionPlans') ||
      this.configService.get<string>('apiKeys.default') ||
      '';

    if (!provided || !expected) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Constant-time compare
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      throw new UnauthorizedException('Invalid API key');
    }

    const ok = crypto.timingSafeEqual(a, b);
    if (!ok) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
