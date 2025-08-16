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
  computeMatchStats(match: Match, events: KillEvent[], _teams: TeamMap): MatchStatsResult {
    const byPlayer: Record<string, PlayerMatchStats> = {};
    const ensure = (name: string) => {
      if (!byPlayer[name]) {
        byPlayer[name] = {
          player: name,
          frags: 0,
          deaths: 0,
          maxStreak: 0,
          weapons: {},
          awards: { invincible: false, fiveInOneMinute: false },
        };
      }
      return byPlayer[name];
    };

    const ordered = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    for (const ev of ordered) {
      const victim = ensure(ev.victim);
      victim.deaths += 1;

      if (ev.killer !== '<WORLD>') {
        const killer = ensure(ev.killer);
        killer.frags += 1;
        if (ev.cause.type === 'WEAPON') {
          killer.weapons[ev.cause.weapon] = (killer.weapons[ev.cause.weapon] ?? 0) + 1;
        }
      }
    }

    return {
      matchId: match.id,
      players: byPlayer,
      winner: null,
    };
  }
}