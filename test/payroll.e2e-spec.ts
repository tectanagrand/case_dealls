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

  describe('POST /payroll/setattendance', () => {
    it('should create a new payroll period successfully but if exist return 400', async () => {
      const currentDate = moment();
      const startDate = currentDate.clone().startOf('month');
      const endDate = currentDate.clone().endOf('month');

      const setAttendancePayload = {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/payroll/setattendance')
        .send(setAttendancePayload)
        .set('Accept', 'application/json')
        .expect((res) => {
          if (res.statusCode == 400) {
            expect(
              res.body.message ==
                'Payroll Period already exist, please create a new one',
            );
          }
          if (res.statusCode == 200) {
            expect(res.body).toHaveProperty('uid');
            createdPayrollId = res.body.uid;
          }
        });
    });

    it('should return 400 when end date is less than start date', async () => {
      const currentDate = moment();
      const startDate = currentDate.clone().add(1, 'month');
      const endDate = currentDate.clone();

      const setAttendancePayload = {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/payroll/setattendance')
        .send(setAttendancePayload)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(400);

      expect(response.body.message).toBe('End Date is less than Start Date');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/payroll/setattendance')
        .send({})
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when dates are invalid format', async () => {
      const setAttendancePayload = {
        from: 'invalid',
        to: 'invalid',
      };

      const response = await request(app.getHttpServer())
        .post('/payroll/setattendance')
        .send(setAttendancePayload)
        .set('Accept', 'application/json')
        .expect(400);
      expect(response.body).toHaveProperty('message');
    });

    describe('PATCH /payroll/setattendance', () => {
      it('should update existing payroll period successfully', async () => {
        const currentDate = moment();
        const startDate = currentDate.clone().startOf('month').add(1, 'day');
        const endDate = currentDate.clone().endOf('month').subtract(1, 'day');

        const updateAttendancePayload = {
          uid: createdPayrollId,
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        };

        const response = await request(app.getHttpServer())
          .patch('/payroll/setattendance')
          .send(updateAttendancePayload)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${access_token}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body.id).toBe(createdPayrollId);
      });

      it('should return 400 when payroll period does not exist', async () => {
        const currentDate = moment();
        const startDate = currentDate.clone().startOf('month');
        const endDate = currentDate.clone().endOf('month');
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        const updateAttendancePayload = {
          uid: nonExistentId,
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        };

        const response = await request(app.getHttpServer())
          .patch('/payroll/setattendance')
          .send(updateAttendancePayload)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${access_token}`)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Data Not Found');
      });

      it('should return 400 when trying to change month/year of existing period', async () => {
        const nextMonth = moment().add(1, 'month');
        const startDate = nextMonth.clone().startOf('month');
        const endDate = nextMonth.clone().endOf('month');

        const updateAttendancePayload = {
          uid: createdPayrollId,
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        };

        const response = await request(app.getHttpServer())
          .patch('/payroll/setattendance')
          .send(updateAttendancePayload)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${access_token}`)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Not allowed to change period');
      });

      it('should return 400 when end date is less than start date on update', async () => {
        const currentDate = moment();
        const startDate = currentDate.clone().endOf('month');
        const endDate = currentDate.clone().startOf('month');

        const updateAttendancePayload = {
          uid: createdPayrollId,
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        };

        const response = await request(app.getHttpServer())
          .patch('/payroll/setattendance')
          .send(updateAttendancePayload)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${access_token}`)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('End Date is less than Start Date');
      });

      it('should return 400 when start date is same as end date on update', async () => {
        const currentDate = moment().startOf('month').add(15, 'days');

        const updateAttendancePayload = {
          uid: createdPayrollId,
          from: currentDate.toISOString(),
          to: currentDate.toISOString(),
        };

        const response = await request(app.getHttpServer())
          .patch('/payroll/setattendance')
          .send(updateAttendancePayload)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${access_token}`)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe(
          'Start Date cannot be same as End Date',
        );
      });

      it('should return 400 when uid is missing', async () => {
        const currentDate = moment();
        const startDate = currentDate.clone().startOf('month');
        const endDate = currentDate.clone().endOf('month');

        const updateAttendancePayload = {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        };

        const response = await request(app.getHttpServer())
          .patch('/payroll/setattendance')
          .send(updateAttendancePayload)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${access_token}`)
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });
    });
  });
});
