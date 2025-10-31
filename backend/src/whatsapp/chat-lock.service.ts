import { Injectable } from '@nestjs/common';
import { Mutex } from 'async-mutex';

@Injectable()
export class ChatLockService {
    private locks = new Map<string, Mutex>();

    private key(agentId: string, chatId: string) {
        return `${agentId}:${chatId}`;
    }

    getLock(agentId: string, chatId: string): Mutex {
        const k = this.key(agentId, chatId);
        if (!this.locks.has(k)) this.locks.set(k, new Mutex());
        return this.locks.get(k)!;
    }

    async runExclusive<T>(agentId: string, chatId: string, fn: () => Promise<T>): Promise<T> {
        const mutex = this.getLock(agentId, chatId);
        return mutex.runExclusive(fn);
    }
}
