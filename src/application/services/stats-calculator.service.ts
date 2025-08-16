import { Injectable } from '@nestjs/common';
import { Match } from '../../domain/entities/match.entity';
import { KillEvent } from '../../domain/entities/kill-event.entity';

export type TeamMap = Record<string, string>;

export type PlayerMatchAwards = {
  invincible: boolean;
  fiveInOneMinute: boolean;
};

export type PlayerMatchStats = {
  player: string;
  frags: number;
  deaths: number;
  maxStreak: number;
  weapons: Record<string, number>;
  awards: PlayerMatchAwards;
};

export type MatchStatsResult = {
  matchId: string;
  players: Record<string, PlayerMatchStats>;
  winner: { player: string; favoriteWeapon: string } | null;
};

@Injectable()
export class StatsCalculatorService {
  computeMatchStats(match: Match, _events: KillEvent[], _teams: TeamMap): MatchStatsResult {
    return { matchId: match.id, players: {}, winner: null };
  }
}