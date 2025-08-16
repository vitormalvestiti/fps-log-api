import { StatsCalculatorService } from '../../../../application/services/stats-calculator.service';
import type { IMatchRepository } from '../../../../application/interfaces/i-match-repository';
import type { IKillRepository } from '../../../../application/interfaces/i-kill-repository';
import type { ITeamRepository } from '../../../../application/interfaces/i-team-repository';
import { Match } from '../../../../domain/entities/match.entity';
import { KillEvent } from '../../../../domain/entities/kill-event.entity';

const d = (s: string) => {
    const [date, time] = s.split(' ');
    const [dd, mm, yyyy] = date.split('/').map(Number);
    const [HH, MM, SS] = time.split(':').map(Number);
    return new Date(yyyy, mm - 1, dd, HH, MM, SS);
};

describe('ComputeGlobalRankingUseCase', () => {
    let uc: ComputeGlobalRankingUseCase;
    let stats: StatsCalculatorService;
    let matchRepo: jest.Mocked<IMatchRepository>;
    let killRepo: jest.Mocked<IKillRepository>;
    let teamRepo: jest.Mocked<ITeamRepository>;

    beforeEach(() => {
        stats = new StatsCalculatorService();
        matchRepo = { findById: jest.fn() } as any;
        killRepo = { listByMatchId: jest.fn() } as any;
        teamRepo = { getTeamsByMatchId: jest.fn() } as any;
        uc = new ComputeGlobalRankingUseCase(matchRepo, killRepo, teamRepo, stats, {
            listAll: async () => [
                new Match('m1', d('01/01/2020 10:00:00'), d('01/01/2020 10:10:00')),
                new Match('m2', d('02/01/2020 10:00:00'), d('02/01/2020 10:10:00')),
            ],
        } as any);
    });

    it('agrega frags/deaths/wins de todas as partidas e ordena por frags desc, KD desc', async () => {
        killRepo.listByMatchId.mockImplementation(async (id: string) => {
            if (id === 'm1') {
                return [
                    new KillEvent(d('01/01/2020 10:01:00'), 'm1', 'Roman', 'Nick', { type: 'WEAPON', weapon: 'M16' }),
                    new KillEvent(d('01/01/2020 10:02:00'), 'm1', 'Roman', 'Nick', { type: 'WEAPON', weapon: 'M16' }),
                ];
            }
            return [
                new KillEvent(d('02/01/2020 10:01:00'), 'm2', 'Nick', 'Roman', { type: 'WEAPON', weapon: 'AK47' }),
                new KillEvent(d('02/01/2020 10:02:00'), 'm2', 'Nick', 'Roman', { type: 'WEAPON', weapon: 'AK47' }),
                new KillEvent(d('02/01/2020 10:03:00'), 'm2', 'Nick', 'Roman', { type: 'WEAPON', weapon: 'AK47' }),
            ];
        });
        teamRepo.getTeamsByMatchId.mockResolvedValue({});

        const out = await uc.execute({ limit: 10, offset: 0 });
        const roman = out.items.find((p: { player: string; }) => p.player === 'Roman')!;
        const nick = out.items.find((p: { player: string; }) => p.player === 'Nick')!;

        expect(nick.totalFrags).toBe(3);
        expect(roman.totalFrags).toBe(2);

        expect(nick.wins).toBe(1);
        expect(roman.wins).toBe(1);

        expect(out.items[0].player).toBe('Nick');
        expect(out.total).toBe(2);
    });
});
