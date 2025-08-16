import { Injectable } from '@nestjs/common';
import { parseBrDatetime } from '../../common/utils/date.util';
import { KillEvent } from '../../domain/entities/kill-event.entity';
import { Match } from '../../domain/entities/match.entity';

type ParseResult = { matches: Match[]; events: KillEvent[] };

@Injectable()
export class LogParserService {
    private readonly reStart = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s*-\s*New match\s+(\d+)\s+has started$/i;
    private readonly reEnd = /^(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\s*-\s*Match\s+(\d+)\s+has ended$/i;

    parse(rawLog: string): ParseResult {
        const matches: Match[] = [];
        const events: KillEvent[] = [];

        const lines = (rawLog ?? '')
            .replace(/\r\n|\r/g, '\n')
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

            throw new Error(`Linha inválida: "${line}"`);
        }

        if (currentMatch) throw new Error(`Match ${currentMatch.id} não foi encerrada no log`);

        return { matches, events };
    }
}