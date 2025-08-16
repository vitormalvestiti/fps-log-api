import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMatchListing } from '../../application/interfaces/i-match-listing-repository';
import { MatchOrmEntity } from '../database/orm/match.orm-entity';
import { Match } from '../../domain/entities/match.entity';

@Injectable()
export class MatchListingRepository implements IMatchListing {
  constructor(@InjectRepository(MatchOrmEntity) private readonly repo: Repository<MatchOrmEntity>) {}

  async listAll(): Promise<Match[]> {
    const rows = await this.repo.find({ order: { startedAt: 'ASC' as any } });
    return rows.map(r => new Match(r.id, r.startedAt, r.endedAt ?? undefined));
  }
}
