import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesController } from './matches.controller';
import { GenerateMatchRankingUseCase } from '../../../application/use-cases/generate-match-ranking.use-case';
import { StatsCalculatorService } from '../../../application/services/stats-calculator.service';
import { MatchRepository } from '../../repositories/match.repository';
import { KillRepository } from '../../repositories/kill.repository';
import { TeamRepository } from '../../repositories/team.repository';
import { MatchOrmEntity } from '../../database/orm/match.orm-entity';
import { KillOrmEntity } from '../../database/orm/kill.orm-entity';
import { PlayerMatchTeamOrmEntity } from '../../database/orm/player-match-team.orm-entity';
import { TeamOrmEntity } from '../../database/orm/team.orm-entity';
import { PlayerOrmEntity } from '../../database/orm/player.orm-entity';
import { AssignTeamsUseCase } from 'src/application/use-cases/assign-teams.use-case';

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
    controllers: [MatchesController],
    providers: [
        GenerateMatchRankingUseCase,
        AssignTeamsUseCase,
        StatsCalculatorService,
        { provide: 'IMatchRepository', useClass: MatchRepository },
        { provide: 'IKillRepository', useClass: KillRepository },
        { provide: 'ITeamRepository', useClass: TeamRepository },
    ],
})
export class MatchesModule { }