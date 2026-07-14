import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';
import type { AppConfig } from '../../../config/env.validation';

describe('PasswordService', () => {
  const configService = {
    get: jest.fn().mockReturnValue(12),
  } as unknown as ConfigService<AppConfig, true>;

  const service = new PasswordService(configService);

  it('hashes passwords so the plain value is not stored', async () => {
    const hash = await service.hash('SecurePass1!');
    expect(hash).not.toBe('SecurePass1!');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await service.hash('SecurePass1!');
    await expect(service.verify('SecurePass1!', hash)).resolves.toBe(true);
    await expect(service.verify('WrongPass1!', hash)).resolves.toBe(false);
  });
});
