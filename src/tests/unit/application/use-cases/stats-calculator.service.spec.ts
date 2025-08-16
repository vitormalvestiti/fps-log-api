import { KillEvent } from '../../../../domain/entities/kill-event.entity';
import { StatsCalculatorService } from '../../../../application/services/stats-calculator.service';
import { Match } from '../../../../domain/entities/match.entity';

const d = (s: string) => {
    const [date, time] = s.split(' ');
    const [dd, mm, yyyy] = date.split('/').map(Number);
    const [HH, MM, SS] = time.split(':').map(Number);
    return new Date(yyyy, mm - 1, dd, HH, MM, SS);
};

describe('StatsCalculatorService', () => {
    let service: StatsCalculatorService;

    beforeEach(() => {
        service = new StatsCalculatorService();
    });

    it('retorna estrutura basica para ausencia de eventos', () => {
        const match = new Match('m0', d('01/01/2020 10:00:00'), d('01/01/2020 10:10:00'));
        const out = service.computeMatchStats(match, [], {});
        expect(out.players).toEqual({});
        expect(out.winner).toBeNull();
    });

    it('contabiliza frags e mortes por partida com WORLD contando só morte', () => {
        const match = new Match('11348965', d('23/04/2019 15:34:22'), d('23/04/2019 15:39:22'));
        const events: KillEvent[] = [
            new KillEvent(d('23/04/2019 15:36:04'), match.id, 'Roman', 'Nick', { type: 'WEAPON', weapon: 'M16' }),
            new KillEvent(d('23/04/2019 15:36:33'), match.id, '<WORLD>', 'Nick', { type: 'WORLD', reason: 'DROWN' }),
        ];
        const result = service.computeMatchStats(match, events, {});
        const roman = result.players['Roman'];
        const nick = result.players['Nick'];
        expect(roman.frags).toBe(1);
        expect(roman.deaths).toBe(0);
        expect(nick.frags).toBe(0);
        expect(nick.deaths).toBe(2);
    });

    it('calcula streak maximo por jogador e reseta ao morrer (se o player morrer)', () => {
        const match = new Match('m1', d('01/01/2020 10:00:00'), d('01/01/2020 10:10:00'));
        const ev = (t: string, killer: string, victim: string) =>
            new KillEvent(d(t), match.id, killer, victim, { type: 'WEAPON', weapon: 'AK' });
        const events: KillEvent[] = [
            ev('01/01/2020 10:01:00', 'A', 'B'),
            ev('01/01/2020 10:02:00', 'A', 'C'),
            ev('01/01/2020 10:03:00', 'B', 'A'),
            ev('01/01/2020 10:04:00', 'A', 'B'),
            ev('01/01/2020 10:05:00', 'A', 'C'),
            ev('01/01/2020 10:06:00', 'A', 'C'),
        ];
        const result = service.computeMatchStats(match, events, {});
        expect(result.players['A'].maxStreak).toBe(3);
        expect(result.players['B'].maxStreak).toBe(1);
        expect(result.players['C'].maxStreak).toBe(0);
    });

    it('identifica arma preferida do vencedor da partida', () => {
        const match = new Match('m2', d('01/01/2020 10:00:00'), d('01/01/2020 10:10:00'));
        const events: KillEvent[] = [
            new KillEvent(d('01/01/2020 10:01:00'), match.id, 'Roman', 'Nick', { type: 'WEAPON', weapon: 'M16' }),
            new KillEvent(d('01/01/2020 10:02:00'), match.id, 'Roman', 'Nick', { type: 'WEAPON', weapon: 'AK47' }),
            new KillEvent(d('01/01/2020 10:03:00'), match.id, 'Roman', 'Nick', { type: 'WEAPON', weapon: 'M16' }),
            new KillEvent(d('01/01/2020 10:04:00'), match.id, 'Nick', 'Roman', { type: 'WEAPON', weapon: 'AK47' }),
        ];
        const result = service.computeMatchStats(match, events, {});
        expect(result.winner?.player).toBe('Roman');
        expect(result.winner?.favoriteWeapon).toBe('M16');
    });
});
