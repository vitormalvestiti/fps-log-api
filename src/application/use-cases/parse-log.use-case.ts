import { Injectable } from '@nestjs/common';
import { LogParserService } from '../services/log-parser.service';
import { StatsCalculatorService } from '../services/stats-calculator.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchOrmEntity } from '../../infrastructure/database/orm/match.orm-entity';
import { PlayerOrmEntity } from '../../infrastructure/database/orm/player.orm-entity';
import { KillOrmEntity } from '../../infrastructure/database/orm/kill.orm-entity';
import { AwardOrmEntity } from '../../infrastructure/database/orm/award.orm-entity';

type Input = { log: string };

@Injectable()
export class ParseLogUseCase {
  constructor(
    private readonly parser: LogParserService,
    private readonly stats: StatsCalculatorService,
    @InjectRepository(MatchOrmEntity) private readonly matchRepo: Repository<MatchOrmEntity>,
    @InjectRepository(PlayerOrmEntity) private readonly playerRepo: Repository<PlayerOrmEntity>,
    @InjectRepository(KillOrmEntity) private readonly killRepo: Repository<KillOrmEntity>,
    @InjectRepository(AwardOrmEntity) private readonly awardRepo: Repository<AwardOrmEntity>,
  ) {}

  async execute({ log }: Input) {
    if (!log || log.trim().length === 0) {
      throw new Error('Empty log content');
    }
    return { matches: [] as Array<{ matchId: string }> };
  }
}