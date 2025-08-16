import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMatchRepository } from '../../application/interfaces/i-match-repository';
import { MatchOrmEntity } from '../database/orm/match.orm-entity';
import { Match } from '../../domain/entities/match.entity';

@Injectable()
export class MatchRepository implements IMatchRepository {
  constructor(@InjectRepository(MatchOrmEntity) private readonly repo: Repository<MatchOrmEntity>) {}

  async findById(id: string): Promise<Match | null> {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) return null;
    return new Match(m.id, m.startedAt, m.endedAt ?? undefined);
  }
}
