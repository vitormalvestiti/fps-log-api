import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerOrmEntity } from '../database/orm/player.orm-entity';
import { IPlayerRepository } from '../../application/interfaces/i-player-repository';
import { Player } from '../../domain/entities/player.entity';

@Injectable()
export class PlayerRepository implements IPlayerRepository {
  constructor(
    @InjectRepository(PlayerOrmEntity)
    private readonly repo: Repository<PlayerOrmEntity>,
  ) {}

  async getOrCreateByName(name: string): Promise<Player> {
    let p = await this.repo.findOne({ where: { name } });
    if (!p) {
      p = this.repo.create({ name });
      p = await this.repo.save(p);
    }
    return new Player(p.id, p.name);
  }

  async findIdByName(name: string): Promise<string | null> {
    const p = await this.repo.findOne({ where: { name }, select: ['id'] });
    return p?.id ?? null;
  }
}