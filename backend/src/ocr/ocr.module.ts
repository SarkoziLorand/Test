import { Module } from '@nestjs/common';
import { OcrService } from './orc.service';

@Module({
  providers: [OcrService],
  exports: [OcrService]
})
export class OcrModule {}
