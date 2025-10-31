import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThreadMappingService {
    private cache = new Map<string, string>();
    
    constructor() { }

    getCacheMapping() {
        return this.cache;
    }
}
