import { Match } from '../../domain/entities/match.entity';

export interface IMatchRepository {
  findById(id: string): Promise<Match | null>;
}
