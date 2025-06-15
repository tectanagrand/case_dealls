import { Test, TestingModule } from '@nestjs/testing';
import { ReimbController } from './reimb.controller';

describe('ReimbController', () => {
  let controller: ReimbController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReimbController],
    }).compile();

    controller = module.get<ReimbController>(ReimbController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
