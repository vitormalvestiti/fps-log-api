import { ParseLogUseCase } from '../../../../application/use-cases/parse-log.use-case';
import { LogParserService } from '../../../../application/services/log-parser.service';
import { StatsCalculatorService } from '../../../../application/services/stats-calculator.service';
import { Repository, ObjectLiteral } from 'typeorm';
import { MatchOrmEntity } from '../../../../infrastructure/database/orm/match.orm-entity';
import { PlayerOrmEntity } from '../../../../infrastructure/database/orm/player.orm-entity';
import { KillOrmEntity } from '../../../../infrastructure/database/orm/kill.orm-entity';
import { AwardOrmEntity } from '../../../../infrastructure/database/orm/award.orm-entity';

type UpsertValues<T extends ObjectLiteral> = Parameters<Repository<T>['upsert']>[0];
type UpsertConflict<T extends ObjectLiteral> = Parameters<Repository<T>['upsert']>[1];

function makeRepoMock<T extends ObjectLiteral>() {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((v: any) => v),
    upsert: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('ParseLogUseCase - suíte completa', () => {
  let matchRepo: jest.Mocked<Repository<MatchOrmEntity>>;
  let playerRepo: jest.Mocked<Repository<PlayerOrmEntity>>;
  let killRepo: jest.Mocked<Repository<KillOrmEntity>>;
  let awardRepo: jest.Mocked<Repository<AwardOrmEntity>>;
  let parser: jest.Mocked<LogParserService>;
  let stats: jest.Mocked<StatsCalculatorService>;
  let uc: ParseLogUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    matchRepo = makeRepoMock<MatchOrmEntity>();
    playerRepo = makeRepoMock<PlayerOrmEntity>();
    killRepo = makeRepoMock<KillOrmEntity>();
    awardRepo = makeRepoMock<AwardOrmEntity>();

    parser = { parse: jest.fn() } as any;
    stats = { computeMatchStats: jest.fn() } as any;

    (stats.computeMatchStats as jest.Mock).mockReturnValue({
      winner: null,
      players: {},
    });

    uc = new ParseLogUseCase(parser, stats, matchRepo, playerRepo, killRepo, awardRepo);
  });

  it('cria a partida quando não existe e atualiza endedAt se vier depois', async () => {
    parser.parse.mockReturnValue({
      matches: [
        { id: 'm1', startedAt: new Date('2019-04-23T18:34:22Z'), endedAt: null, end() {} },
      ],
      events: [],
    } as any);

    matchRepo.findOne.mockResolvedValueOnce(null);
    await uc.execute({ log: 'any' });

    expect(matchRepo.create).toHaveBeenCalledWith({
      id: 'm1',
      startedAt: new Date('2019-04-23T18:34:22Z'),
      endedAt: null,
    });
    expect(matchRepo.save).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    parser.parse.mockReturnValue({
      matches: [
        { id: 'm1', startedAt: new Date('2019-04-23T18:34:22Z'), endedAt: new Date('2019-04-23T18:39:22Z'), end() {} },
      ],
      events: [],
    } as any);

    matchRepo.findOne.mockResolvedValueOnce({ id: 'm1', startedAt: new Date('2019-04-23T18:34:22Z'), endedAt: null } as any);
    await uc.execute({ log: 'any' });

    expect(matchRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'm1', endedAt: new Date('2019-04-23T18:39:22Z') }),
    );
  });

  it('persiste kills resolvendo players e seta killerName=null quando killer é <WORLD>', async () => {
    parser.parse.mockReturnValue({
      matches: [{ id: 'm1', startedAt: new Date('2019-04-23T18:34:22Z'), endedAt: new Date('2019-04-23T18:39:22Z'), end() {} }],
      events: [
        {
          matchId: 'm1',
          occurredAt: new Date('2019-04-23T18:36:04Z'),
          killer: 'Roman',
          victim: 'Nick',
          cause: { type: 'WEAPON', weapon: 'M16' },
        },
        {
          matchId: 'm1',
          occurredAt: new Date('2019-04-23T18:36:33Z'),
          killer: '<WORLD>',
          victim: 'Nick',
          cause: { type: 'WORLD', reason: 'DROWN' },
        },
      ],
    } as any);

    matchRepo.findOne.mockResolvedValueOnce(null);

    playerRepo.findOne
      .mockResolvedValueOnce({ id: 'p-roman', name: 'Roman' } as any) 
      .mockResolvedValueOnce({ id: 'p-nick',  name: 'Nick'  } as any) 
      .mockResolvedValueOnce({ id: 'p-nick',  name: 'Nick'  } as any); 

    killRepo.findOne.mockResolvedValue(null);

    await uc.execute({ log: 'any' });

    expect(killRepo.save).toHaveBeenCalledTimes(2);

    expect(killRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'm1',
        killerId: 'p-roman',
        victimId: 'p-nick',
        killerName: 'Roman',
        victimName: 'Nick',
        occurredAt: new Date('2019-04-23T18:36:04Z'),
        causeType: 'WEAPON',
        weapon: 'M16',
        reason: null,
      }),
    );

    expect(killRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'm1',
        killerId: null,
        killerName: null,
        victimName: 'Nick',
        causeType: 'WORLD',
        weapon: null,
        reason: 'DROWN',
      }),
    );
  });

  it('não duplica kill quando já existe (matchId+occurredAt+killerName/victimName)', async () => {
    parser.parse.mockReturnValue({
      matches: [{ id: 'm1', startedAt: new Date(), endedAt: new Date(), end() {} }],
      events: [
        {
          matchId: 'm1',
          occurredAt: new Date('2019-04-23T18:36:04Z'),
          killer: 'Roman',
          victim: 'Nick',
          cause: { type: 'WEAPON', weapon: 'M16' },
        },
      ],
    } as any);

    matchRepo.findOne.mockResolvedValueOnce(null);

    playerRepo.findOne
      .mockResolvedValueOnce({ id: 'p-roman', name: 'Roman' } as any)
      .mockResolvedValueOnce({ id: 'p-nick',  name: 'Nick'  } as any);

    killRepo.findOne.mockResolvedValueOnce({ id: 'k1' } as any);

    await uc.execute({ log: 'any' });

    expect(killRepo.save).not.toHaveBeenCalled();
  });

  it('premia winner com INVINCIBLE e qualquer jogador com FIVE_IN_ONE_MINUTE', async () => {
    parser.parse.mockReturnValue({
      matches: [{ id: 'm1', startedAt: new Date(), endedAt: new Date(), end() {} }],
      events: [],
    } as any);

    matchRepo.findOne.mockResolvedValueOnce(null);

    playerRepo.findOne
      .mockResolvedValueOnce({ id: 'p-roman',  name: 'Roman'  } as any) 
      .mockResolvedValueOnce({ id: 'p-marcus', name: 'Marcus' } as any); 

    (stats.computeMatchStats as jest.Mock).mockReturnValueOnce({
      winner: { player: 'Roman' },
      players: {
        Roman:  { player: 'Roman',  awards: { invincible: true,  fiveInOneMinute: false } },
        Marcus: { player: 'Marcus', awards: { invincible: false, fiveInOneMinute: true  } },
      },
    });

    const out = await uc.execute({ log: 'any' });
    expect(out).toEqual({ matches: [{ matchId: 'm1' }] });

    const calls = (awardRepo.upsert as unknown as jest.Mock).mock.calls;
    expect(calls.length).toBe(1);

    const valuesArg = calls[0][0] as UpsertValues<AwardOrmEntity>;
    const conflictArg = calls[0][1] as UpsertConflict<AwardOrmEntity>;
    const rows = Array.isArray(valuesArg) ? valuesArg : [valuesArg];

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ matchId: 'm1', playerId: 'p-roman',  type: 'INVINCIBLE' }),
        expect.objectContaining({ matchId: 'm1', playerId: 'p-marcus', type: 'FIVE_IN_ONE_MINUTE' }),
      ]),
    );
    expect(conflictArg).toEqual(['matchId', 'playerId', 'type']);
  });

  it('processa múltiplas partidas no mesmo log e retorna todos os matchIds', async () => {
    parser.parse.mockReturnValue({
      matches: [
        { id: 'm1', startedAt: new Date(), endedAt: new Date(), end() {} },
        { id: 'm2', startedAt: new Date(), endedAt: new Date(), end() {} },
      ],
      events: [
        { matchId: 'm1', occurredAt: new Date('2019-01-01T10:00:00Z'), killer: 'A', victim: 'B', cause: { type: 'WEAPON', weapon: 'AK' } },
        { matchId: 'm2', occurredAt: new Date('2019-01-01T11:00:00Z'), killer: '<WORLD>', victim: 'C', cause: { type: 'WORLD', reason: 'DROWN' } },
      ],
    } as any);

    matchRepo.findOne.mockResolvedValueOnce(null);
    matchRepo.findOne.mockResolvedValueOnce(null);

    playerRepo.findOne
      .mockResolvedValueOnce({ id: 'p-a', name: 'A' } as any)
      .mockResolvedValueOnce({ id: 'p-b', name: 'B' } as any)
      .mockResolvedValueOnce({ id: 'p-c', name: 'C' } as any);

    killRepo.findOne.mockResolvedValue(null);

    const out = await uc.execute({ log: 'any' });
    expect(out).toEqual({ matches: [{ matchId: 'm1' }, { matchId: 'm2' }] });
    expect(killRepo.save).toHaveBeenCalledTimes(2);
  });
});