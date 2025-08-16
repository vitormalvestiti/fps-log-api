import { StatsCalculatorService } from '../../../../application/services/stats-calculator.service';
import type { IMatchRepository } from '../../../../application/interfaces/i-match-repository';
import type { IKillRepository } from '../../../../application/interfaces/i-kill-repository';
import type { ITeamRepository } from '../../../../application/interfaces/i-team-repository';
import { GenerateMatchRankingUseCase } from '../../../../application/use-cases/generate-match-ranking.use-case';
import { Match } from '../../../../domain/entities/match.entity';
import { KillEvent } from '../../../../domain/entities/kill-event.entity';


const d = (s: string) => {
    const [date, time] = s.split(' ');
    const [dd, mm, yyyy] = date.split('/').map(Number);
    const [HH, MM, SS] = time.split(':').map(Number);
    return new Date(yyyy, mm - 1, dd, HH, MM, SS);
};

describe('GenerateMatchRankingUseCase', () => {
    let uc: GenerateMatchRankingUseCase;
    let stats: StatsCalculatorService;
    let matchRepo: jest.Mocked<IMatchRepository>;
    let killRepo: jest.Mocked<IKillRepository>;
    let teamRepo: jest.Mocked<ITeamRepository>;

    beforeEach(() => {
        stats = new StatsCalculatorService();
        matchRepo = { findById: jest.fn() };
        killRepo = { listByMatchId: jest.fn() };
        teamRepo = { getTeamsByMatchId: jest.fn() };
        uc = new GenerateMatchRankingUseCase(matchRepo, killRepo, teamRepo, stats);
    });

    it('lança erro se a partida não existir', async () => {
        matchRepo.findById.mockResolvedValue(null);
        await expect(uc.execute({ matchId: 'x' })).rejects.toThrow(/match not found/i);
    });

    it('gera ranking ordenado e vencedor com arma preferida', async () => {
        const match = new Match('m1', d('01/01/2020 10:00:00'), d('01/01/2020 10:10:00'));
        matchRepo.findById.mockResolvedValue(match);

        const events: KillEvent[] = [
            new KillEvent(d('01/01/2020 10:01:00'), 'm1', 'Roman', 'Nick', { type: 'WEAPON', weapon: 'M16' }),
            new KillEvent(d('01/01/2020 10:02:00'), 'm1', 'Roman', 'Nick', { type: 'WEAPON', weapon: 'AK47' }),
            new KillEvent(d('01/01/2020 10:03:00'), 'm1', 'Roman', 'Nick', { type: 'WEAPON', weapon: 'M16' }),
            new KillEvent(d('01/01/2020 10:04:00'), 'm1', 'Nick', 'Roman', { type: 'WEAPON', weapon: 'AK47' }),
        ];
        killRepo.listByMatchId.mockResolvedValue(events);
        teamRepo.getTeamsByMatchId.mockResolvedValue({});

        const result = await uc.execute({ matchId: 'm1' });

        expect(result.matchId).toBe('m1');
        expect(result.winner?.player).toBe('Roman');
        expect(result.winner?.favoriteWeapon).toBe('M16');

        expect(result.ranking[0].player).toBe('Roman');
        expect(result.ranking[0].frags).toBe(3);
        expect(result.ranking[0].deaths).toBe(1);
    });
});
