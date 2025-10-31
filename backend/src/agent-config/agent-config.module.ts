import { Module } from '@nestjs/common';
import { AgentConfigService } from './agent-config.service';
import { AgentConfigController } from './agent-config.controller';
import { EncryptkeysModule } from 'src/encryptkeys/encryptkeys.module';

@Module({
  imports: [EncryptkeysModule],
  providers: [AgentConfigService],
  controllers: [AgentConfigController]
})
export class AgentConfigModule {}
