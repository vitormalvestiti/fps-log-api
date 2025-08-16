import { Player } from '../../domain/entities/player.entity';

export interface IPlayerRepository {
  getOrCreateByName(name: string): Promise<Player>;
  findIdByName(name: string): Promise<string | null>;
}