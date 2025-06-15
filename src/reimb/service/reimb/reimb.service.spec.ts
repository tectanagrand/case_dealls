import { Test, TestingModule } from '@nestjs/testing';
import { ReimbService } from './reimb.service';

describe('ReimbService', () => {
  let service: ReimbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReimbService],
    }).compile();

    service = module.get<ReimbService>(ReimbService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
