import { Match } from '../../domain/entities/match.entity';
import { KillEvent } from '../../domain/entities/kill-event.entity';
import { hasNItemsInWindow } from '../../common/utils/window.util';
import { TeamMap, MatchStatsResult, PlayerMatchStats } from './contracts';

export function computeMatchStats(
  match: Match,
  events: KillEvent[],
  teams: TeamMap,
): MatchStatsResult {
  const ordered = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  const byPlayer: Record<string, PlayerMatchStats & { currentStreak: number; killTimes: Date[] }> = {};

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

  for (const ev of ordered) {
    const victimStats = ensure(ev.victim);
    victimStats.deaths += 1;
    victimStats.currentStreak = 0;

    if (ev.killer !== '<WORLD>') {
      const killerStats = ensure(ev.killer);
      const isFF = teams[ev.killer] && teams[ev.victim] && teams[ev.killer] === teams[ev.victim];

      if (isFF) {
        killerStats.frags -= 1;
      } else {
        killerStats.frags += 1;
        killerStats.currentStreak += 1;
        if (killerStats.currentStreak > killerStats.maxStreak) {
          killerStats.maxStreak = killerStats.currentStreak;
        }
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
    delete (p as any).killTimes;
    delete (p as any).currentStreak;
  });

  const playersArr = Object.values(byPlayer);
  playersArr.sort((a, b) => {
    if (b.frags !== a.frags) return b.frags - a.frags;
    if (a.deaths !== b.deaths) return a.deaths - b.deaths;
    return b.maxStreak - a.maxStreak;
  });

  const winner = playersArr[0] ?? null;
  let winnerFavorite = '';

  if (winner) {
    const entries = Object.entries(winner.weapons);
    if (entries.length > 0) {
      entries.sort((a, b) => b[1] - a[1]);
      winnerFavorite = entries[0][0];
    }
  }

  if (winner && winner.deaths === 0) {
    byPlayer[winner.player].awards.invincible = true;
  }

  return {
    matchId: match.id,
    players: Object.fromEntries(Object.values(byPlayer).map(p => [p.player, p])),
    winner: winner ? { player: winner.player, favoriteWeapon: winnerFavorite } : null,
  };
}