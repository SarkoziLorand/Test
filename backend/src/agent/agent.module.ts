import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { EncryptkeysModule } from 'src/encryptkeys/encryptkeys.module';

@Module({
  imports: [
    EncryptkeysModule,
  ],
  providers: [AgentService],
  controllers: [AgentController]
})
export class AgentModule {}
