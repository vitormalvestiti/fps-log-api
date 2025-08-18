import { Match } from '../../domain/entities/match.entity';
import { KillEvent } from '../../domain/entities/kill-event.entity';
import { parseBrDatetime } from '../../common/utils/date.util';
import { ParseResult } from './types';

const reStart = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s*-\s*New match\s+(\d+)\s+has started$/i;
const reEnd = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s*-\s*Match\s+(\d+)\s+has ended$/i;
const reKillWeapon = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s*-\s*(.+)\s+killed\s+(.+)\s+using\s+([A-Za-z0-9_\-:]+)$/i;
const reKillWorld = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s*-\s*<WORLD>\s+killed\s+(.+)\s+by\s+([A-Z_]+)$/i;

export function parseLog(rawLog: string): ParseResult {
  const matches: Match[] = [];
  const events: KillEvent[] = [];
  let currentMatch: Match | null = null;

  const normalized = rawLog
    .replace(/\r\n|\r/g, '\n')
    .replace(/(?<!^)(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/g, '\n$1');

  const lines = normalized
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return { matches, events };
  }

  for (const line of lines) {
    let m = line.match(reStart);
    if (m) {
      const when = parseBrDatetime(m[1]);
      const id = m[2];
      if (currentMatch) {
        throw new Error(`New match started before ending previous match ${currentMatch.id}`);
      }
      currentMatch = new Match(id, when);
      matches.push(currentMatch);
      continue;
    }

    m = line.match(reEnd);
    if (m) {
      const when = parseBrDatetime(m[1]);
      const id = m[2];
      if (!currentMatch || currentMatch.id !== id) {
        throw new Error(`End for unknown of match ${id}`);
      }
      currentMatch.end(when);
      currentMatch = null;
      continue;
    }

    m = line.match(reKillWeapon);
    if (m) {
      if (!currentMatch) throw new Error('Kill event with no active match');
      const when = parseBrDatetime(m[1]);
      const killer = m[2].trim();
      const victim = m[3].trim();
      const weapon = m[4].trim();
      events.push(new KillEvent(when, (currentMatch as Match).id, killer, victim, { type: 'WEAPON', weapon }));
      continue;
    }

    m = line.match(reKillWorld);
    if (m) {
      if (!currentMatch) throw new Error('Kill event with no active match');
      const when = parseBrDatetime(m[1]);
      const victim = m[2].trim();
      const reason = m[3].trim();
      events.push(new KillEvent(when, (currentMatch as Match).id, '<WORLD>', victim, { type: 'WORLD', reason }));
      continue;
    }

    throw new Error(`Line not found: "${line}"`);
  }

  if (currentMatch) {
    throw new Error(`Match ${(currentMatch as Match).id} not closed in the log`);
  }

  return { matches, events };
}