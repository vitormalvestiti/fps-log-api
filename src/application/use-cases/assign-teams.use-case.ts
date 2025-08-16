import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PlayerMatchTeamOrmEntity } from '../../infrastructure/database/orm/player-match-team.orm-entity';
import { PlayerOrmEntity } from '../../infrastructure/database/orm/player.orm-entity';
import { TeamOrmEntity } from '../../infrastructure/database/orm/team.orm-entity';

type Input = {
    matchId: string;
    assignments: Array<{ playerName: string; teamName: string }>;
};

@Injectable()
export class AssignTeamsUseCase {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(PlayerMatchTeamOrmEntity)
        private readonly pmtRepo: Repository<PlayerMatchTeamOrmEntity>,
        @InjectRepository(PlayerOrmEntity)
        private readonly playerRepo: Repository<PlayerOrmEntity>,
        @InjectRepository(TeamOrmEntity)
        private readonly teamRepo: Repository<TeamOrmEntity>,
    ) { }

    async execute({ matchId, assignments }: Input) {
        return this.dataSource.transaction(async (trx) => {

            const pmt = trx.getRepository(PlayerMatchTeamOrmEntity);
            const players = trx.getRepository(PlayerOrmEntity);
            const teams = trx.getRepository(TeamOrmEntity);

            const playerIdByName = new Map<string, string>();
            const teamIdByName = new Map<string, string>();

            const ensurePlayer = async (name: string) => {
                const cached = playerIdByName.get(name);
                if (cached) return cached;
                const found = await players.findOne({ where: { name }, select: ['id'] });
                if (found) {
                    playerIdByName.set(name, found.id);
                    return found.id;
                }
                const created = await players.save(players.create({ name }));
                playerIdByName.set(name, created.id);
                return created.id;
            };

            const ensureTeam = async (name: string) => {
                const cached = teamIdByName.get(name);
                if (cached) return cached;
                const found = await teams.findOne({ where: { name }, select: ['id'] });
                if (found) {
                    teamIdByName.set(name, found.id);
                    return found.id;
                }
                const created = await teams.save(teams.create({ name }));
                teamIdByName.set(name, created.id);
                return created.id;
            };

            const rows = [];
            for (const a of assignments) {
                const playerId = await ensurePlayer(a.playerName);
                const teamId = await ensureTeam(a.teamName);

                rows.push(
                    pmt.create({
                        matchId,
                        playerId,
                        teamId,
                        playerName: a.playerName,
                        teamName: a.teamName,
                    }),
                );
            }

            await pmt.upsert(rows, ['matchId', 'playerId']);

            return { matchId, assigned: rows.length };
        });
    }
}
