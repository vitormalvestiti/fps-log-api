import { Inject, Injectable } from '@nestjs/common';
import type { IMatchRepository } from '../interfaces/i-match-repository';
import type { IKillRepository } from '../interfaces/i-kill-repository';
import type { ITeamRepository } from '../interfaces/i-team-repository';
import type { IMatchListing } from '../interfaces/i-match-listing-repository';
import { StatsCalculatorService } from '../services/stats-calculator.service';
import { GlobalRankingDto, GlobalRankingItemDto } from '../dtos/global-ranking.dto';

type Input = { limit?: number; offset?: number };

@Injectable()
export class ComputeGlobalRankingUseCase {
    constructor(
        @Inject('IMatchRepository') private readonly matchRepo: IMatchRepository,
        @Inject('IKillRepository') private readonly killRepo: IKillRepository,
        @Inject('ITeamRepository') private readonly teamRepo: ITeamRepository,
        private readonly stats: StatsCalculatorService,

        @Inject('IMatchListing') private readonly matchListing: IMatchListing,
    ) { }

    async execute({ limit = 20, offset = 0 }: Input): Promise<GlobalRankingDto> {
        const matches = await this.matchListing.listAll();
        const acc: Record<string, GlobalRankingItemDto & { winsSet: number; bestStreakAcc: number }> = {};

        for (const m of matches) {
            const events = await this.killRepo.listByMatchId(m.id);
            const teams = await this.teamRepo.getTeamsByMatchId(m.id);
            const res = this.stats.computeMatchStats(m, events, teams);

            for (const p of Object.values(res.players)) {
                if (!acc[p.player]) {
                    acc[p.player] = {
                        player: p.player,
                        totalFrags: 0,
                        totalDeaths: 0,
                        kd: 0,
                        wins: 0,
                        bestStreak: 0,
                        winsSet: 0,
                        bestStreakAcc: 0,
                    };
                }
                acc[p.player].totalFrags += p.frags;
                acc[p.player].totalDeaths += p.deaths;
                if (p.maxStreak > acc[p.player].bestStreak) {
                    acc[p.player].bestStreak = p.maxStreak;
                }
            }

            if (res.winner) {
                acc[res.winner.player].wins += 1;
            }
        }

        const items: GlobalRankingItemDto[] = Object.values(acc)
            .map(p => ({
                ...p,
                kd: p.totalDeaths === 0 ? p.totalFrags : p.totalFrags / p.totalDeaths,
            }))
            .sort((a, b) => {
                if (b.totalFrags !== a.totalFrags) return b.totalFrags - a.totalFrags;
                if (b.kd !== a.kd) return b.kd - a.kd;
                if (b.wins !== a.wins) return b.wins - a.wins;
                return b.bestStreak - a.bestStreak;
            });

        const total = items.length;
        const paged = items.slice(offset, offset + limit);

        return { total, items: paged };
    }
}
