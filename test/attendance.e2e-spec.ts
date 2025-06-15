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

describe('Attendance Controller (e2e)', () => {
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

  describe('POST /attendance/clockin', () => {
    it('should be return 200 if user successfully clocked in, but 400 if already clocked in that date', async () => {
      const current_timestamp = moment().toISOString();
      const response = await request(app.getHttpServer())
        .post('/attendance/clockin')
        .set('Cookie', [`token=${access_token}`])
        .send({ ts_checkin: current_timestamp })
        .then((res) => {
          console.log(res.body);
          if (res.statusCode == 201) {
            expect(res.body).toHaveProperty('data');
          } else if (res.statusCode == 400) {
            expect(res.body).toHaveProperty('message');
          } else {
            throw new Error(`Unexpected Error ${res.statusCode}`);
          }
        });
    });
  });

  describe('POST /attendance/clockout', () => {
    it('should be return 200 if user successfully clocked out, but 400 if already clocked out that date or not clocked in', async () => {
      const current_timestamp = moment().toISOString();
      const response = await request(app.getHttpServer())
        .post('/attendance/clockout')
        .set('Cookie', [`token=${access_token}`])
        .send({ ts_checkout: current_timestamp })
        .then((res) => {
          console.log(res.body);
          if (res.statusCode == 201) {
            expect(res.body).toHaveProperty('data');
          } else if (res.statusCode == 400) {
            expect(res.body).toHaveProperty('message');
          } else {
            throw new Error(`Unexpected Error ${res.statusCode}`);
          }
        });
    });
  });
});
