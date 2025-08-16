import { KillEvent } from "../../../../domain/entities/kill-event.entity";
import { LogParserService } from "../../../../application/services/log-parser.service";
import { Match } from '../../../../domain/entities/match.entity';

describe('LogParserService - básico', () => {
    let svc: LogParserService;

    beforeEach(() => {
        svc = new LogParserService();
    });

    it('retorna vazio para log vazio ou se tiver somente espacos', () => {
        expect(svc.parse('')).toEqual({ matches: [], events: [] });
        expect(svc.parse('   \n  ')).toEqual({ matches: [], events: [] });
    });

    it('reconhecer inicio e fim da partida', () => {
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

    it('reconhecer kills de arma e de mundo', () => {
        const log = `
      23/04/2019 18:34:22 - New match 1 has started
      23/04/2019 18:36:04 - Roman killed Nick using M16
      23/04/2019 18:36:33 - <WORLD> killed Nick by DROWN
      23/04/2019 18:39:22 - Match 1 has ended
    `;
        const out = svc.parse(log);
        expect(out.events.length).toBe(2);

        const e1 = out.events[0] as KillEvent;
        expect(e1.killer).toBe('Roman');
        expect(e1.victim).toBe('Nick');
        expect(e1.cause).toEqual({ type: 'WEAPON', weapon: 'M16' });

        const e2 = out.events[1] as KillEvent;
        expect(e2.killer).toBe('<WORLD>');
        expect(e2.victim).toBe('Nick');
        expect(e2.cause).toEqual({ type: 'WORLD', reason: 'DROWN' });
    });
});