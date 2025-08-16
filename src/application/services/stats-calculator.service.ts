import { Injectable } from '@nestjs/common';
import { Match } from '../../domain/entities/match.entity';
import { KillEvent } from '../../domain/entities/kill-event.entity';
import { hasNItemsInWindow } from '../../common/utils/window.util';

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
    const byPlayer: Record<string, (PlayerMatchStats & { currentStreak: number; killTimes: Date[] })> = {};
    const ensure = (name: string) => {
      if (!byPlayer[name]) {
        byPlayer[name] = {
          player: name,
          frags: 0,
          deaths: 0,
          maxStreak: 0,
          currentStreak: 0,
          weapons: {},
          awards: { invincible: false, fiveInOneMinute: false },
          killTimes: [],
        };
      }
      return byPlayer[name];
    };

    const ordered = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    for (const ev of ordered) {
      const victimStats = ensure(ev.victim);
      victimStats.deaths += 1;
      victimStats.currentStreak = 0;

      if (ev.killer !== '<WORLD>') {
        const killerStats = ensure(ev.killer);
        const isFF = _teams[ev.killer] && _teams[ev.victim] && _teams[ev.killer] === _teams[ev.victim];

        if (isFF) {
          killerStats.frags -= 1;
        } else {
          killerStats.frags += 1;
          killerStats.currentStreak += 1;
          if (killerStats.currentStreak > killerStats.maxStreak) killerStats.maxStreak = killerStats.currentStreak;
          if (ev.cause.type === 'WEAPON') {
            killerStats.weapons[ev.cause.weapon] = (killerStats.weapons[ev.cause.weapon] ?? 0) + 1;
          }
          killerStats.killTimes.push(ev.occurredAt);
        }
      }
    }

    const WINDOW_MS = 60 * 1000;
    Object.values(byPlayer).forEach(p => {
      if (hasNItemsInWindow(p.killTimes, WINDOW_MS, 5)) {
        p.awards.fiveInOneMinute = true;
      }
    });

    const playersArr = Object.values(byPlayer).map(p => ({ ...p }));
    playersArr.sort((a, b) => {
      if (b.frags !== a.frags) return b.frags - a.frags;
      if (a.deaths !== b.deaths) return a.deaths - b.deaths;
      return b.maxStreak - a.maxStreak;
    });
    const winnerP = playersArr[0] ?? null;

    let favoriteWeapon = '';
    if (winnerP) {
      const entries = Object.entries(winnerP.weapons);
      if (entries.length > 0) {
        entries.sort((a, b) => b[1] - a[1]);
        favoriteWeapon = entries[0][0];
      }
    }
    
    if (winnerP && byPlayer[winnerP.player].deaths === 0) {
      byPlayer[winnerP.player].awards.invincible = true;
    }

    const players: Record<string, PlayerMatchStats> = {};
    for (const p of Object.values(byPlayer)) {
      const { currentStreak, ...rest } = p;
      players[p.player] = rest;
    }

    return {
      matchId: match.id,
      players,
      winner: winnerP ? { player: winnerP.player, favoriteWeapon } : null,
    };
  }
}
