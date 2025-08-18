import { Injectable } from '@nestjs/common';
import { Match } from '../../domain/entities/match.entity';
import { KillEvent } from '../../domain/entities/kill-event.entity';
import { computeMatchStats } from '../../core/stats/compute-match-stats';
import { TeamMap, MatchStatsResult } from '../../core/stats/contracts';


@Injectable()
export class StatsCalculatorService {
computeMatchStats(match: Match, events: KillEvent[], teams: TeamMap): MatchStatsResult {
    return computeMatchStats(match, events, teams);
  }
}
