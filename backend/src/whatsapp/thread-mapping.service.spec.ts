import { Test, TestingModule } from '@nestjs/testing';
import { ThreadMappingService } from './thread-mapping.service';

describe('ThreadMappingService', () => {
  let service: ThreadMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThreadMappingService],
    }).compile();

    service = module.get<ThreadMappingService>(ThreadMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
