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
});
