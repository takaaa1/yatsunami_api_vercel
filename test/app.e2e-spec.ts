import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});

/**
 * User Management E2E Tests
 *
 * Prerequisites:
 *   - Set TEST_ADMIN_TOKEN env var with a valid admin JWT token
 *   - Set TEST_USER_TOKEN env var with a valid regular user JWT token
 *   - Set TEST_TARGET_USER_ID env var with the ID of a test user to activate/deactivate
 *
 * These tests verify the full activate/deactivate flow:
 *   admin login → list users → deactivate user → user blocked → reactivate → user restored
 */
describe('Users – Admin Management Flow (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let targetUserId: string;

  const skipIfMissingEnv = () => {
    if (!process.env.TEST_ADMIN_TOKEN || !process.env.TEST_TARGET_USER_ID) {
      return true;
    }
    return false;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    adminToken = process.env.TEST_ADMIN_TOKEN ?? '';
    targetUserId = process.env.TEST_TARGET_USER_ID ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return list of users for admin', async () => {
      if (skipIfMissingEnv()) return;

      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data ?? res.body)).toBe(true);
    });

    it('should filter users by role=admin', async () => {
      if (skipIfMissingEnv()) return;

      const res = await request(app.getHttpServer())
        .get('/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const users = res.body.data ?? res.body;
      expect(Array.isArray(users)).toBe(true);
      users.forEach((u: any) => expect(u.role).toBe('admin'));
    });

    it('should filter users by ativo=true', async () => {
      if (skipIfMissingEnv()) return;

      const res = await request(app.getHttpServer())
        .get('/users?ativo=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const users = res.body.data ?? res.body;
      users.forEach((u: any) => expect(u.ativo).toBe(true));
    });

    it('should return 403 for non-admin users', async () => {
      if (!process.env.TEST_USER_TOKEN) return;

      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${process.env.TEST_USER_TOKEN}`)
        .expect(403);
    });
  });

  describe('GET /users/:id', () => {
    it('should return a single user by ID', async () => {
      if (skipIfMissingEnv()) return;

      const res = await request(app.getHttpServer())
        .get(`/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const user = res.body.data ?? res.body;
      expect(user.id).toBe(targetUserId);
    });

    it('should return 404 for non-existent user', async () => {
      if (skipIfMissingEnv()) return;

      await request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Activate / Deactivate flow', () => {
    it('1. admin deactivates target user', async () => {
      if (skipIfMissingEnv()) return;

      const res = await request(app.getHttpServer())
        .post(`/users/${targetUserId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const user = res.body.data ?? res.body;
      expect(user.ativo).toBe(false);
    });

    it('2. deactivated user appears in ativo=false filter', async () => {
      if (skipIfMissingEnv()) return;

      const res = await request(app.getHttpServer())
        .get('/users?ativo=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const users = res.body.data ?? res.body;
      const found = users.find((u: any) => u.id === targetUserId);
      expect(found).toBeDefined();
      expect(found.ativo).toBe(false);
    });

    it('3. deactivated user token is rejected by JWT strategy', async () => {
      if (!process.env.TEST_USER_TOKEN) return;
      // If TEST_USER_TOKEN belongs to targetUserId, that user should now be blocked
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${process.env.TEST_USER_TOKEN}`)
        .expect(401);
    });

    it('4. admin reactivates target user', async () => {
      if (skipIfMissingEnv()) return;

      const res = await request(app.getHttpServer())
        .post(`/users/${targetUserId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const user = res.body.data ?? res.body;
      expect(user.ativo).toBe(true);
    });

    it('5. reactivated user no longer in ativo=false filter', async () => {
      if (skipIfMissingEnv()) return;

      const res = await request(app.getHttpServer())
        .get('/users?ativo=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const users = res.body.data ?? res.body;
      const found = users.find((u: any) => u.id === targetUserId);
      expect(found).toBeUndefined();
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user name and observations', async () => {
      if (skipIfMissingEnv()) return;

      const res = await request(app.getHttpServer())
        .patch(`/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ observacoes: 'Usuário de teste E2E' })
        .expect(200);

      const user = res.body.data ?? res.body;
      expect(user.observacoes).toBe('Usuário de teste E2E');
    });
  });

  describe('POST /auth/deactivate-account', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/auth/deactivate-account')
        .expect(401);
    });
  });
});
