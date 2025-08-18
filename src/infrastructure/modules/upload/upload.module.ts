import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { ParseLogUseCase } from '../../../application/use-cases/parse-log.use-case';
import { LogParserService } from '../../../application/services/log-parser.service';
import { StatsCalculatorService } from '../../../application/services/stats-calculator.service';
import { MatchOrmEntity } from '../../database/orm/match.orm-entity';
import { PlayerOrmEntity } from '../../database/orm/player.orm-entity';
import { KillOrmEntity } from '../../database/orm/kill.orm-entity';
import { AwardOrmEntity } from '../../database/orm/award.orm-entity';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
    TypeOrmModule.forFeature([MatchOrmEntity, PlayerOrmEntity, KillOrmEntity, AwardOrmEntity]),
  ],
  controllers: [UploadController],
  providers: [ParseLogUseCase, LogParserService, StatsCalculatorService],
})
export class UploadModule { }