import { Match } from '../../domain/entities/match.entity';
import { KillEvent } from '../../domain/entities/kill-event.entity';

export type ParseResult = { matches: Match[]; events: KillEvent[] };