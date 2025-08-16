import { Match } from '../../domain/entities/match.entity';

export interface IMatchListing {
  listAll(): Promise<Match[]>;
}