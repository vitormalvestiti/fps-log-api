import { Injectable } from '@nestjs/common';
import { Match } from '../../domain/entities/match.entity';
import { KillEvent } from '../../domain/entities/kill-event.entity';

export type MatchStats = {
  winner: { player: string } | null;
  players: Record<
    string,
    { player: string; awards?: { invincible?: boolean; fiveInOneMinute?: boolean } }
  >;
};

@Injectable()
export class StatsCalculatorService {
  computeMatchStats(
    match: Match,
    events: KillEvent[],
    options?: Record<string, unknown>,
  ): MatchStats {
    return { winner: null, players: {} };
  }
}
