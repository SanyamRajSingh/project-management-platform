import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/modules/auth/services/auth.service';
import { UsersService } from '../src/modules/users/services/users.service';
import { TokenService } from '../src/modules/auth/services/token.service';
import { OrganizationsService } from '../src/modules/organizations/services/organizations.service';
import { MailService } from '../src/modules/mail/mail.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailVerificationTokenRepository } from '../src/modules/auth/repositories/email-verification-token.repository';
import { PasswordResetTokenRepository } from '../src/modules/auth/repositories/password-reset-token.repository';
import { AppError } from '../src/shared/errors/app-error';
import * as argon2 from 'argon2';

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: any;
  let tokenServiceMock: any;
  let orgServiceMock: any;
  let mailServiceMock: any;
  let emailTokenRepoMock: any;
  let passwordResetRepoMock: any;
  let eventEmitterMock: any;

  beforeEach(async () => {
    process.env.AUTO_VERIFY_EMAIL = 'true';

    usersServiceMock = {
      existsByEmail: jest.fn().mockResolvedValue(false),
      createUser: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 'user-1',
          ...data,
          status: 'active',
          emailVerifiedAt: null,
        }),
      ),
      findByEmail: jest.fn(),
      findById: jest.fn().mockImplementation((id: string) =>
        Promise.resolve({
          id,
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          fullName: 'Jane Doe',
          status: 'active',
          emailVerifiedAt: new Date(),
          currentOrganizationId: 'org-1',
        }),
      ),
      setEmailVerifiedAt: jest.fn().mockResolvedValue(undefined),
      updateCurrentOrg: jest.fn().mockResolvedValue(undefined),
      updateProfile: jest.fn().mockResolvedValue(undefined),
    };

    tokenServiceMock = {
      generateTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }),
      verifyRefreshToken: jest.fn().mockResolvedValue({
        id: 'token-id-1',
        userId: 'user-1',
        familyId: 'family-1',
      }),
      revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    };

    orgServiceMock = {
      createOrganization: jest.fn().mockResolvedValue({
        id: 'org-1',
        name: "Test's workspace",
      }),
      listUserOrganizations: jest.fn().mockResolvedValue([
        { id: 'org-1', name: "Test's workspace", role: 'owner' },
      ]),
    };

    mailServiceMock = {
      sendVerifyEmail: jest.fn().mockResolvedValue(undefined),
    };

    emailTokenRepoMock = {
      invalidateUnusedForUser: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockResolvedValue(undefined),
      findUnusedByTokenHash: jest.fn(),
      markUsed: jest.fn().mockResolvedValue(undefined),
    };

    passwordResetRepoMock = {
      invalidateUnusedForUser: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockResolvedValue(undefined),
      findUnusedByTokenHash: jest.fn(),
      markUsed: jest.fn().mockResolvedValue(undefined),
    };

    eventEmitterMock = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: OrganizationsService, useValue: orgServiceMock },
        { provide: MailService, useValue: mailServiceMock },
        { provide: EmailVerificationTokenRepository, useValue: emailTokenRepoMock },
        { provide: PasswordResetTokenRepository, useValue: passwordResetRepoMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should hash password and create user with default workspace', async () => {
      const res = await service.register({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePassword123!',
      });

      expect(usersServiceMock.createUser).toHaveBeenCalled();
      const createArgs = usersServiceMock.createUser.mock.calls[0][0];
      expect(createArgs.email).toBe('jane@example.com');
      expect(createArgs.firstName).toBe('Jane');
      expect(createArgs.lastName).toBe('Doe');
      // Password must be hashed with argon2id, never plaintext
      expect(createArgs.passwordHash).not.toBe('SecurePassword123!');
      const verifyHash = await argon2.verify(
        createArgs.passwordHash,
        'SecurePassword123!',
      );
      expect(verifyHash).toBe(true);

      // Auto-creates workspace and returns tokens immediately in evaluation/dev mode
      expect(orgServiceMock.createOrganization).toHaveBeenCalled();
      expect(res.accessToken).toBe('mock-access-token');
    });

    it('should reject duplicate email registration', async () => {
      usersServiceMock.existsByEmail.mockResolvedValueOnce(true);

      await expect(
        service.register({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          password: 'SecurePassword123!',
        }),
      ).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials and return token pair', async () => {
      const passwordHash = await argon2.hash('Secret123!');
      usersServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'jane@example.com',
        passwordHash,
        firstName: 'Jane',
        lastName: 'Doe',
        status: 'active',
        emailVerifiedAt: new Date(),
        currentOrganizationId: 'org-1',
      });

      const res = await service.login({
        email: 'jane@example.com',
        password: 'Secret123!',
      });

      expect(res.accessToken).toBe('mock-access-token');
      expect(res.refreshToken).toBe('mock-refresh-token');
      expect(res.user.email).toBe('jane@example.com');
    });

    it('should reject invalid password', async () => {
      const passwordHash = await argon2.hash('RealSecret123!');
      usersServiceMock.findByEmail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'jane@example.com',
        passwordHash,
        status: 'active',
        emailVerifiedAt: new Date(),
      });

      await expect(
        service.login({
          email: 'jane@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(AppError);
    });
  });

  describe('logout', () => {
    it('should revoke refresh token on logout', async () => {
      await service.logout('valid-refresh-token');
      expect(tokenServiceMock.verifyRefreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(tokenServiceMock.revokeRefreshToken).toHaveBeenCalledWith('token-id-1');
    });

    it('should gracefully handle empty or invalid token without crashing', async () => {
      await expect(service.logout(undefined)).resolves.toBeUndefined();
    });
  });
});
