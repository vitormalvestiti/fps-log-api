import { LogParserService } from "../../../../application/services/log-parser.service";
import { Match } from 'src/domain/entities/match.entity';

describe('LogParserService - básico', () => {
    let svc: LogParserService;

    beforeEach(() => {
        svc = new LogParserService();
    });

    it('retorna vazio para log vazio ou se tiver somente espacos', () => {
        expect(svc.parse('')).toEqual({ matches: [], events: [] });
        expect(svc.parse('   \n  ')).toEqual({ matches: [], events: [] });
    });

    it('reconhcer inicio e fim da partida', () => {
        const log = `
      23/04/2019 18:34:22 - New match 1 has started
      23/04/2019 18:39:22 - Match 1 has ended
    `;
        const out = svc.parse(log);
        expect(out.matches.length).toBe(1);
        expect(out.matches[0]).toBeInstanceOf(Match);
        expect(out.matches[0].id).toBe('1');
        expect(out.matches[0].startedAt.toISOString()).toBe('2019-04-23T18:34:22.000Z');
        expect(out.matches[0].endedAt?.toISOString()).toBe('2019-04-23T18:39:22.000Z');
    });
});