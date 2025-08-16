import { Repository, ObjectLiteral } from 'typeorm';
import { PlayerMatchTeamOrmEntity } from '../../../../infrastructure/database/orm/player-match-team.orm-entity';
import { PlayerOrmEntity } from '../../../../infrastructure/database/orm/player.orm-entity';
import { TeamOrmEntity } from '../../../../infrastructure/database/orm/team.orm-entity';
import { AssignTeamsUseCase } from '../../../../application/use-cases/assign-teams.use-case';

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

describe('AssignTeamsUseCase (FKs reais + transação)', () => {
  let pmtRepo: jest.Mocked<Repository<PlayerMatchTeamOrmEntity>>;
  let playerRepo: jest.Mocked<Repository<PlayerOrmEntity>>;
  let teamRepo: jest.Mocked<Repository<TeamOrmEntity>>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    pmtRepo = makeRepoMock<PlayerMatchTeamOrmEntity>();
    playerRepo = makeRepoMock<PlayerOrmEntity>();
    teamRepo = makeRepoMock<TeamOrmEntity>();

    dataSource = {
      transaction: jest.fn(async (fn: any) =>
        fn({
          getRepository: (ent: any) => {
            if (ent === PlayerMatchTeamOrmEntity) return pmtRepo;
            if (ent === PlayerOrmEntity) return playerRepo;
            if (ent === TeamOrmEntity) return teamRepo;
            throw new Error('Repo não mapeado no mock: ' + ent?.name);
          },
        }),
      ),
    };
  });

  it('cria player/team quando não existem e faz upsert por (matchId, playerId)', async () => {
    playerRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    playerRepo.save
      .mockResolvedValueOnce({ id: 'p-alice', name: 'Alice' } as any)
      .mockResolvedValueOnce({ id: 'p-bob', name: 'Bob' } as any);

    teamRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    teamRepo.save
      .mockResolvedValueOnce({ id: 't-1', name: 'T1' } as any)
      .mockResolvedValueOnce({ id: 't-2', name: 'T2' } as any);

    const uc = new AssignTeamsUseCase(
      dataSource as any,
      pmtRepo as any,
      playerRepo as any,
      teamRepo as any,
    );

    await uc.execute({
      matchId: 'm1',
      assignments: [
        { playerName: 'Alice', teamName: 'T1' },
        { playerName: 'Bob',   teamName: 'T2' },
      ],
    });

    const calls = (pmtRepo.upsert as unknown as jest.Mock).mock.calls;
    const valuesArg = calls[0][0] as UpsertValues<PlayerMatchTeamOrmEntity>;
    const conflictArg = calls[0][1] as UpsertConflict<PlayerMatchTeamOrmEntity>;
    const rows = Array.isArray(valuesArg) ? valuesArg : [valuesArg];

    expect(rows).toHaveLength(2);
    expect(conflictArg).toEqual(['matchId', 'playerId']);
    expect(rows[0]).toMatchObject({ matchId: 'm1', playerId: 'p-alice', teamId: 't-1', playerName: 'Alice', teamName: 'T1' });
    expect(rows[1]).toMatchObject({ matchId: 'm1', playerId: 'p-bob',   teamId: 't-2', playerName: 'Bob',   teamName: 'T2' });

    expect(playerRepo.save).toHaveBeenCalledTimes(2);
    expect(teamRepo.save).toHaveBeenCalledTimes(2);
    expect(pmtRepo.create).toHaveBeenCalledTimes(2);
  });
});
