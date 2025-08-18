import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/validation';
import { typeormConfig } from './infrastructure/database/typeorm.config';
import { UploadModule } from './infrastructure/modules/upload/upload.module';
import { PlayersModule } from './infrastructure/modules/players/players.module';
import { MatchesModule } from './infrastructure/modules/matches/matches.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    TypeOrmModule.forRootAsync(typeormConfig),
    UploadModule,
    PlayersModule,
    MatchesModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'ui'),
      serveRoot: '/painel',
    }),
  ],
})
export class AppModule { }