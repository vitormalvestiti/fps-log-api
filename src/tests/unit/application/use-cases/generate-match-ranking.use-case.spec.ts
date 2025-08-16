import { StatsCalculatorService } from '../../../../application/services/stats-calculator.service';
import type { IMatchRepository } from '../../../../application/interfaces/i-match-repository';
import type { IKillRepository } from '../../../../application/interfaces/i-kill-repository';
import type { ITeamRepository } from '../../../../application/interfaces/i-team-repository';

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
});
