import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || origin === 'null') return cb(null, true);
      const allowed = ['http://localhost:5173', 'http://127.0.0.1:8080'];
      return allowed.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials: false,
    optionsSuccessStatus: 204,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(8080);
}
bootstrap();
