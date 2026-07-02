import { AuthService } from './auth.service';

describe('AuthService.validateUser', () => {
  it('returns null when password hash is invalid instead of throwing', async () => {
    const usersService = {
      findByUsername: jest.fn().mockResolvedValue({
        id: 'user-1',
        username: 'admin',
        password: 'not-a-valid-bcrypt-hash',
        isActive: true,
      }),
    };

    const service = new AuthService(
      usersService as any,
      {} as any,
      { get: jest.fn() } as any,
    );

    await expect(service.validateUser('admin', 'Admin@123')).resolves.toBeNull();
  });
});
