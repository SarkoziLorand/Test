import { Test, TestingModule } from '@nestjs/testing';
import { AgentConfigController } from './agent-config.controller';

describe('AgentConfigController', () => {
  let controller: AgentConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentConfigController],
    }).compile();

    controller = module.get<AgentConfigController>(AgentConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
