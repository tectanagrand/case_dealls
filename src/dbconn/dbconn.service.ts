import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

import { types } from 'pg';

types.setTypeParser(1700, parseFloat);
types.setTypeParser(20, BigInt);

//this is only necessary for JSON.stringify or jest-comparison tools.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

@Injectable()
export class DbconnService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT ?? '3000'),
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async DBClientWrapper<T>(cb: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      return cb(client);
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
}
