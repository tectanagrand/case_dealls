import { Test, TestingModule } from '@nestjs/testing';
import { DbconnService } from './dbconn.service';

describe('DbconnService', () => {
  let service: DbconnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DbconnService],
    }).compile();

    service = module.get<DbconnService>(DbconnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
