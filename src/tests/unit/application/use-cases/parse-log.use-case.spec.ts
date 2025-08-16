import { LogParserService } from '../../../../application/services/log-parser.service';
import { StatsCalculatorService } from '../../../../../src/application/services/stats-calculator.service';
import { ObjectLiteral, Repository } from 'typeorm';
import { MatchOrmEntity } from '../../../../../src/infrastructure/database/orm/match.orm-entity';
import { PlayerOrmEntity } from '../../../../../src/infrastructure/database/orm/player.orm-entity';
import { KillOrmEntity } from '../../../../../src/infrastructure/database/orm/kill.orm-entity';
import { AwardOrmEntity } from '../../../../../src/infrastructure/database/orm/award.orm-entity';
import { ParseLogUseCase } from '../../../../application/use-cases/parse-log.use-case';

type UpsertValues<T extends ObjectLiteral> = Parameters<Repository<T>['upsert']>[0];

function makeRepoMock<T extends ObjectLiteral>() {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((v: any) => v),
    upsert: jest.fn(),
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('ParseLogUseCase - validação', () => {
  it('lança erro para log vazio', async () => {
    const uc = new ParseLogUseCase(
      new LogParserService() as any,
      new StatsCalculatorService() as any,
      makeRepoMock<MatchOrmEntity>(),
      makeRepoMock<PlayerOrmEntity>(),
      makeRepoMock<KillOrmEntity>(),
      makeRepoMock<AwardOrmEntity>(),
    );
    await expect(uc.execute({ log: '' } as any)).rejects.toThrow('Empty log content');
  });
});