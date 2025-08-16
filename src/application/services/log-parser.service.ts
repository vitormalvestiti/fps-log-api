import { Injectable } from '@nestjs/common';

type ParseResult = { matches: any[]; events: any[] };

@Injectable()
export class LogParserService {
    parse(rawLog: string): ParseResult {
        const trimmed = (rawLog ?? '').trim();
        if (trimmed.length === 0) return { matches: [], events: [] };
        return { matches: [], events: [] };
    }
}
