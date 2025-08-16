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
    @Inject('IKillRepository')  private readonly killRepo: IKillRepository,
    @Inject('ITeamRepository')  private readonly teamRepo: ITeamRepository,
    private readonly stats: StatsCalculatorService,
  ) {}

  async execute({ matchId }: Input): Promise<MatchRankingDto> {
    const match = await this.matchRepo.findById(matchId);
    if (!match) throw new Error('Match not found');

    // implementação mínima por enquanto
    return { matchId, winner: null, ranking: [] as MatchRankingItemDto[] };
  }
}
