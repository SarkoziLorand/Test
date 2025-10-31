import { Test, TestingModule } from '@nestjs/testing';
import { ChatLockService } from './chat-lock.service';

describe('ChatLockService', () => {
  let service: ChatLockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatLockService],
    }).compile();

    service = module.get<ChatLockService>(ChatLockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
