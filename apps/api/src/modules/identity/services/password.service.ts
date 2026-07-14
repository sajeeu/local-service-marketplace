import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { AppConfig } from '../../../config/env.validation';

@Injectable()
export class PasswordService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async hash(plainPassword: string): Promise<string> {
    const rounds = this.configService.get('BCRYPT_SALT_ROUNDS', { infer: true });
    return bcrypt.hash(plainPassword, rounds);
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
