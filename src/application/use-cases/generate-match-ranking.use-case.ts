import { Inject, Injectable } from '@nestjs/common';
import type { IMatchRepository } from '../interfaces/i-match-repository';
import type { IKillRepository } from '../interfaces/i-kill-repository';
import type { ITeamRepository } from '../interfaces/i-team-repository';
import { StatsCalculatorService } from '../services/stats-calculator.service';
import { MatchRankingDto, MatchRankingItemDto } from '../dtos/match-ranking.dto';

type Input = { matchId: string };

@Injectable()
export class GenerateMatchRankingUseCase {
    constructor(
        @Inject('IMatchRepository') private readonly matchRepo: IMatchRepository,
        @Inject('IKillRepository') private readonly killRepo: IKillRepository,
        @Inject('ITeamRepository') private readonly teamRepo: ITeamRepository,
        private readonly stats: StatsCalculatorService,
    ) { }

    async execute({ matchId }: Input): Promise<MatchRankingDto> {
        const match = await this.matchRepo.findById(matchId);
        if (!match) throw new Error('Match not found');
        const events = await this.killRepo.listByMatchId(matchId);
        const teams = await this.teamRepo.getTeamsByMatchId(matchId);

        const computed = this.stats.computeMatchStats(match, events, teams);

        const ranking: MatchRankingItemDto[] = Object.values(computed.players)
            .map(p => ({
                player: p.player,
                frags: p.frags,
                deaths: p.deaths,
                maxStreak: p.maxStreak,
                awards: { ...p.awards },
            }))
            .sort((a, b) => {
                if (b.frags !== a.frags) return b.frags - a.frags;
                if (a.deaths !== b.deaths) return a.deaths - b.deaths;
                return b.maxStreak - a.maxStreak;
            });

        return {
            matchId,
            winner: computed.winner,
            ranking,
        };
    }
}
