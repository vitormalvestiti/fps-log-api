import { KillEvent } from '../../domain/entities/kill-event.entity';

export interface IKillRepository {
  listByMatchId(matchId: string): Promise<KillEvent[]>;
}
