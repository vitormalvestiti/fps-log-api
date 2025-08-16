import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IKillRepository } from '../../application/interfaces/i-kill-repository';
import { KillOrmEntity } from '../database/orm/kill.orm-entity';
import { KillEvent } from '../../domain/entities/kill-event.entity';

@Injectable()
export class KillRepository implements IKillRepository {
    constructor(@InjectRepository(KillOrmEntity) private readonly repo: Repository<KillOrmEntity>) { }

    async listByMatchId(matchId: string): Promise<KillEvent[]> {
        const rows = await this.repo.find({ where: { matchId }, order: { occurredAt: 'ASC' } });
        return rows.map(r => new KillEvent(
            r.occurredAt,
            r.matchId,
            r.killerName ?? '<WORLD>',
            r.victimName,
            r.causeType === 'WEAPON' ? { type: 'WEAPON', weapon: r.weapon! } : { type: 'WORLD', reason: r.reason! },
        ));
    }

    async insertKill(row: Omit<KillOrmEntity, 'id' | 'createdAt'>): Promise<void> {
        await this.repo.insert(row as any);
    }
}
