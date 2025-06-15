import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import * as moment from 'moment';
import * as cookieParser from 'cookie-parser';

const TEST_USER_NAME = 'joy';
const TEST_USER_PASSWORD = 'ADMIN';
let access_token: string;
let refresh_token: string;

describe('Overtime Controller (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    app.enableCors({
      credentials: true,
      origin: process.env.FRONTEND_URL,
    });
    await app.init();

    // Login to get access token
    const response = await request(app.getHttpServer())
      .post('/user/login')
      .send({ username: TEST_USER_NAME, password: TEST_USER_PASSWORD })
      .expect(200);

    access_token = response.body.token;
    refresh_token = response.body.refresh_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /ovetime/propose', () => {
    it('should be return 400 if overtime requested over 3 hours', async () => {
      const current_date = moment().format('YYYY-MM-DD');
      const hours = 3.5;
      const response = await request(app.getHttpServer())
        .post('/overtime/propose')
        .set('Cookie', [`token=${access_token}`])
        .send({
          date_overtime: current_date,
          hours,
        })
        .expect(400);
      expect(response.body.message).toBe('Overtime proposed exceed 3 hours');
      console.log(response.body);
    });

    it('should be create overtime request, but return 400 if request already exist, last clockout not over 5p.m. or not clocked out yet', async () => {
      const current_date = moment().format('YYYY-MM-DD');
      const hours = 2.5;
      const response = await request(app.getHttpServer())
        .post('/overtime/propose')
        .set('Cookie', [`token=${access_token}`])
        .send({
          date_overtime: current_date,
          hours,
        })
        .expect((res) => {
          console.log(res.body);
          if (res.statusCode == 201) {
            expect(res.body).toHaveProperty('uid');
          } else if (res.statusCode == 400) {
            expect(res.body).toHaveProperty('message');
          } else {
            throw new Error(`Failed with status ${res.statusCode}`);
          }
        });
    });

    it('should be overtime clocked out, but return 400 if already clocked out, clocking out less than 1 hour ', async () => {
      const current_timestamp = '2025-06-14T20:30:00';
      const response = await request(app.getHttpServer())
        .post('/overtime/clockout')
        .set('Cookie', [`token=${access_token}`])
        .send({
          clock_out: current_timestamp,
        })
        .expect((res) => {
          console.log(res.body);
          if (res.statusCode == 201) {
            expect(res.body).toHaveProperty('uid');
          } else if (res.statusCode == 400) {
            expect(res.body).toHaveProperty('message');
          } else {
            throw new Error(`Failed with status ${res.statusCode}`);
          }
        });
    });
  });
});
