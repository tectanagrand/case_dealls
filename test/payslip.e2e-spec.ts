import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import * as moment from 'moment';

const TEST_USER_NAME = 'joy';
const TEST_USER_PASSWORD = 'ADMIN';
let access_token: string;
let refresh_token: string;
let createdPayrollId = '9ecfd7ed-bfa3-4ca2-8b31-6848556e5624';

describe('Payroll Controller (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login to get access token
    const response = await request(app.getHttpServer())
      .post('/user/login')
      .send({ username: TEST_USER_NAME, password: TEST_USER_PASSWORD })
      .expect(200);

    access_token = response.body.access_token;
    refresh_token = response.body.refresh_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /payslip/generate', () => {
    it('should be generate payslip', async () => {
      const month = 6;
      const year = 2025;
      const response = await request(app.getHttpServer())
        .post('/api/payslip/generate')
        .set('Cookie', [`token=${access_token}`])
        .send({ month, year })
        .expect((res) => {
          if (res.statusCode == 201) {
            expect(res.body).toHaveProperty('result');
          } else if (res.statusCode == 400) {
            expect(res.body).toHaveProperty('message');
          } else {
            throw new Error(
              'Error occured with status code : ' + res.statusCode,
            );
          }
        });
    });
  });

  describe('GET /payslip/summary', async () => {
    const year = 2025;
    const response = await request(app.getHttpServer())
      .get(`/api/payslip/summary/${year}`)
      .set('Cookie', [`token=${access_token}`])
      .send()
      .expect((res) => {
        if (res.statusCode == 201) {
          expect(res.body).toHaveProperty('result');
        } else if (res.statusCode == 400) {
          expect(res.body).toHaveProperty('message');
        } else {
          throw new Error('Error occured with status code : ' + res.statusCode);
        }
      });
  });
});
