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

    it('persiste kills resolvendo players e seta killerName=null quando killer é <WORLD>', async () => {
        parser.parse.mockReturnValue({
            matches: [{ id: 'm1', startedAt: new Date('2019-04-23T18:34:22Z'), endedAt: new Date('2019-04-23T18:39:22Z'), end() { } }],
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
            .mockResolvedValueOnce({ id: 'p-nick', name: 'Nick' } as any)
            .mockResolvedValueOnce({ id: 'p-nick', name: 'Nick' } as any);

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

    it('nao duplica kill quando já existe', async () => {
        parser.parse.mockReturnValue({
            matches: [{ id: 'm1', startedAt: new Date(), endedAt: new Date(), end() { } }],
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
            .mockResolvedValueOnce({ id: 'p-nick', name: 'Nick' } as any);

        killRepo.findOne.mockResolvedValueOnce({ id: 'k1' } as any);

        await uc.execute({ log: 'any' });

        expect(killRepo.save).not.toHaveBeenCalled();
    });

    it('premia winner com INVINCIBLE e qualquer jogador com FIVE_IN_ONE_MINUTE se passar nas condicoes', async () => {
        parser.parse.mockReturnValue({
            matches: [{ id: 'm1', startedAt: new Date(), endedAt: new Date(), end() { } }],
            events: [],
        } as any);

        matchRepo.findOne.mockResolvedValueOnce(null);

        playerRepo.findOne
            .mockResolvedValueOnce({ id: 'p-roman', name: 'Roman' } as any)
            .mockResolvedValueOnce({ id: 'p-marcus', name: 'Marcus' } as any);

        (stats.computeMatchStats as jest.Mock).mockReturnValueOnce({
            winner: { player: 'Roman' },
            players: {
                Roman: { player: 'Roman', awards: { invincible: true, fiveInOneMinute: false } },
                Marcus: { player: 'Marcus', awards: { invincible: false, fiveInOneMinute: true } },
            },
        });

        const out = await uc.execute({ log: 'any' });
        expect(out).toEqual({ matches: [{ matchId: 'm1' }] });

        const calls = (awardRepo.upsert as unknown as jest.Mock).mock.calls;
        expect(calls.length).toBe(1);

        const rows = (calls[0][0] as any[]);
        const conflict = calls[0][1];

        expect(rows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ matchId: 'm1', playerId: 'p-roman', type: 'INVINCIBLE' }),
                expect.objectContaining({ matchId: 'm1', playerId: 'p-marcus', type: 'FIVE_IN_ONE_MINUTE' }),
            ]),
        );
        expect(conflict).toEqual(['matchId', 'playerId', 'type']);
    });


});