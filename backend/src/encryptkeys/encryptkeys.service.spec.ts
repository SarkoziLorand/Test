import { Test, TestingModule } from '@nestjs/testing';
import { EncryptkeysService } from './encryptkeys.service';

describe('EncryptkeysService', () => {
  let service: EncryptkeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptkeysService],
    }).compile();

    service = module.get<EncryptkeysService>(EncryptkeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
