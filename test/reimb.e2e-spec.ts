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

describe('Reimbursment Controller (e2e)', () => {
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

  describe('POST /reimb', () => {
    it('should return successfully create reimbursement', async () => {
      const date_reimb = moment().format('YYYY-MM-DD');
      const amount_reimb = 20;
      const response = await request(app.getHttpServer())
        .post('/reimb')
        .set('Cookie', [`token=${access_token}`])
        .send({
          date_reimb,
          amount_reimb,
        })
        .expect((res) => {
          console.log(res);
          if (res.statusCode == 201) {
            expect(res.body).toHaveProperty('uid');
          } else if (res.statusCode == 400) {
            expect(res.body).toHaveProperty('message');
          } else {
            throw new Error(`Error with status code : ${res.statusCode}`);
          }
        });
    });
  });
  describe('Delete /reimb', () => {
    it('should return successfully revoking reimbursement', async () => {
      const date_revoke = moment().format('YYYY-MM-DD');
      const response = await request(app.getHttpServer())
        .delete('/reimb')
        .set('Cookie', [`token=${access_token}`])
        .send({ date_revoke })
        .expect((res) => {
          console.log(res.body);
          if (res.statusCode == 200) {
            expect(res.body).toHaveProperty('uid');
          } else if (res.statusCode == 400) {
            expect(res.body).toHaveProperty('message');
          } else {
            throw new Error(`Error with status code : ${res.statusCode}`);
          }
        });
    });
  });
});
