import { ParseLogUseCase } from '../../../../../src/application/use-cases/parse-log.use-case';
import { LogParserService } from '../../../../../src/application/services/log-parser.service';
import { StatsCalculatorService } from '../../../../../src/application/services/stats-calculator.service';
import { ObjectLiteral, Repository } from 'typeorm';
import { MatchOrmEntity } from '../../../../../src/infrastructure/database/orm/match.orm-entity';
import { PlayerOrmEntity } from '../../../../../src/infrastructure/database/orm/player.orm-entity';
import { KillOrmEntity } from '../../../../../src/infrastructure/database/orm/kill.orm-entity';
import { AwardOrmEntity } from '../../../../../src/infrastructure/database/orm/award.orm-entity';

function makeRepoMock<T extends ObjectLiteral>() {
    return {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn((v: any) => v),
        upsert: jest.fn(),
    } as unknown as jest.Mocked<Repository<T>>;
}

describe('ParseLogUseCase - partidas', () => {
    let matchRepo: jest.Mocked<Repository<MatchOrmEntity>>;
    let playerRepo: jest.Mocked<Repository<PlayerOrmEntity>>;
    let killRepo: jest.Mocked<Repository<KillOrmEntity>>;
    let awardRepo: jest.Mocked<Repository<AwardOrmEntity>>;
    let parser: jest.Mocked<LogParserService>;
    let stats: jest.Mocked<StatsCalculatorService>;
    let uc: ParseLogUseCase;

    beforeEach(() => {
        matchRepo = makeRepoMock<MatchOrmEntity>();
        playerRepo = makeRepoMock<PlayerOrmEntity>();
        killRepo = makeRepoMock<KillOrmEntity>();
        awardRepo = makeRepoMock<AwardOrmEntity>();
        parser = { parse: jest.fn() } as any;
        stats = { computeMatchStats: jest.fn().mockReturnValue({ winner: null, players: {} }) } as any;
        uc = new ParseLogUseCase(parser, stats, matchRepo, playerRepo, killRepo, awardRepo);
    });

    it('criacao a partida quando nao existe', async () => {
        parser.parse.mockReturnValue({
            matches: [{ id: 'm1', startedAt: new Date('2019-04-23T18:34:22Z'), endedAt: null, end() { } }],
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
    });

    it('atualiza endedAt se vier depois', async () => {
        parser.parse.mockReturnValue({
            matches: [
                { id: 'm1', startedAt: new Date('2019-04-23T18:34:22Z'), endedAt: new Date('2019-04-23T18:39:22Z'), end() { } },
            ],
            events: [],
        } as any);

        matchRepo.findOne.mockResolvedValueOnce({ id: 'm1', startedAt: new Date('2019-04-23T18:34:22Z'), endedAt: null } as any);

        await uc.execute({ log: 'any' });

        expect(matchRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'm1', endedAt: new Date('2019-04-23T18:39:22Z') }),
        );
    });
});