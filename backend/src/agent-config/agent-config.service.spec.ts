import { Test, TestingModule } from '@nestjs/testing';
import { AgentConfigService } from './agent-config.service';

describe('AgentConfigService', () => {
  let service: AgentConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentConfigService],
    }).compile();

    service = module.get<AgentConfigService>(AgentConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
