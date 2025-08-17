import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';

describe('Upload (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/upload (POST) com conteúdo em JSON', async () => {
    const log = [
      '23/04/2019 15:34:22 - New match 11348965 has started',
      '23/04/2019 15:36:04 - Roman killed Nick using M16',
      '23/04/2019 15:36:33 - <WORLD> killed Nick by DROWN',
      '23/04/2019 15:39:22 - Match 11348965 has ended',
    ].join('\n');

    const res = await request(app.getHttpServer())
      .post('/upload')
      .send({ content: log })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.matches[0].matchId).toBe('11348965');
  });
});
