import { Injectable } from '@nestjs/common';
import { parseBrDatetime } from '../../common/utils/date.util';
import { KillEvent } from '../../domain/entities/kill-event.entity';
import { Match } from '../../domain/entities/match.entity';

type ParseResult = { matches: Match[]; events: KillEvent[] };

@Injectable()
export class LogParserService {
    private readonly reStart = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s*-\s*New match\s+(\d+)\s+has started$/i;
    private readonly reEnd = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s*-\s*Match\s+(\d+)\s+has ended$/i;
    private readonly reKillWeapon = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s*-\s*(.+)\s+killed\s+(.+)\s+using\s+([A-Za-z0-9_\-:]+)$/i;
    private readonly reKillWorld = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s*-\s*<WORLD>\s+killed\s+(.+)\s+by\s+([A-Z_]+)$/i;

    parse(rawLog: string): ParseResult {
        const matches: Match[] = [];
        const events: KillEvent[] = [];

        const normalized = (rawLog ?? '')
            .replace(/\r\n|\r/g, '\n')
            .replace(/(?<!^)(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/g, '\n$1');

        const lines = normalized
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean);

        if (lines.length === 0) return { matches, events };

        let currentMatch: Match | null = null;

        for (const line of lines) {
            let m = line.match(this.reStart);
            if (m) {
                const when = parseBrDatetime(m[1]);
                const id = m[2];
                if (currentMatch) throw new Error(`New match started before ending previous match ${currentMatch.id}`);
                currentMatch = new Match(id, when);
                matches.push(currentMatch);
                continue;
            }

            m = line.match(this.reEnd);
            if (m) {
                const when = parseBrDatetime(m[1]);
                const id = m[2];
                if (!currentMatch || currentMatch.id !== id) throw new Error(`End for unknown or mismatched match ${id}`);
                currentMatch.end(when);
                currentMatch = null;
                continue;
            }

            m = line.match(this.reKillWeapon);
            if (m) {
                if (!currentMatch) throw new Error('Kill event with no active match');
                const when = parseBrDatetime(m[1]);
                const killer = m[2].trim();
                const victim = m[3].trim();
                const weapon = m[4].trim();
                events.push(new KillEvent(when, currentMatch.id, killer, victim, { type: 'WEAPON', weapon }));
                continue;
            }

            m = line.match(this.reKillWorld);
            if (m) {
                if (!currentMatch) throw new Error('Kill event with no active match');
                const when = parseBrDatetime(m[1]);
                const victim = m[2].trim();
                const reason = m[3].trim();
                events.push(new KillEvent(when, currentMatch.id, '<WORLD>', victim, { type: 'WORLD', reason }));
                continue;
            }

            throw new Error(`Linha inválida: "${line}"`);
        }

        if (currentMatch) throw new Error(`Match ${currentMatch.id} não foi encerrada no log`);

        return { matches, events };
    }
}