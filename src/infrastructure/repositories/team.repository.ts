import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITeamRepository } from '../../application/interfaces/i-team-repository';
import { PlayerMatchTeamOrmEntity } from '../database/orm/player-match-team.orm-entity';

@Injectable()
export class TeamRepository implements ITeamRepository {
  constructor(@InjectRepository(PlayerMatchTeamOrmEntity) private readonly repo: Repository<PlayerMatchTeamOrmEntity>) {}

async getTeamsByMatchId(matchId: string): Promise<Record<string, string>> {
    const rows = await this.repo.find({ where: { matchId } });
    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.playerName] = r.teamName;
    }
    return map;
  }
}
