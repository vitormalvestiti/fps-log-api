import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayersController } from './players.controller';
import { ComputeGlobalRankingUseCase } from '../../../application/use-cases/compute-global-ranking.use-case';
import { StatsCalculatorService } from '../../../application/services/stats-calculator.service';
import { MatchOrmEntity } from '../../database/orm/match.orm-entity';
import { MatchRepository } from '../../repositories/match.repository';
import { MatchListingRepository } from '../../repositories/match-listing.repository';
import { KillRepository } from '../../repositories/kill.repository';
import { TeamRepository } from '../../repositories/team.repository';
import { KillOrmEntity } from '../../database/orm/kill.orm-entity';
import { PlayerMatchTeamOrmEntity } from '../../database/orm/player-match-team.orm-entity';
import { TeamOrmEntity } from '../../database/orm/team.orm-entity';
import { PlayerOrmEntity } from '../../database/orm/player.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MatchOrmEntity,
      KillOrmEntity,
      PlayerMatchTeamOrmEntity,
      TeamOrmEntity,
      PlayerOrmEntity,
    ]),
  ],
  controllers: [PlayersController],
  providers: [
    ComputeGlobalRankingUseCase,
    StatsCalculatorService,
    { provide: 'IMatchRepository', useClass: MatchRepository },
    { provide: 'IKillRepository',  useClass: KillRepository },
    { provide: 'ITeamRepository',  useClass: TeamRepository },
    { provide: 'IMatchListing',    useClass: MatchListingRepository },
  ],
})
export class PlayersModule {}
