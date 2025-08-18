import { BadRequestException, Injectable } from '@nestjs/common';
import { LogParserService } from '../services/log-parser.service';
import { StatsCalculatorService } from '../services/stats-calculator.service';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MatchOrmEntity } from '../../infrastructure/database/orm/match.orm-entity';
import { PlayerOrmEntity } from '../../infrastructure/database/orm/player.orm-entity';
import { KillOrmEntity } from '../../infrastructure/database/orm/kill.orm-entity';
import { AwardOrmEntity } from '../../infrastructure/database/orm/award.orm-entity';
import { KillEvent } from '../../domain/entities/kill-event.entity';
import { Match } from '../../domain/entities/match.entity';

type Input = { log: string };

@Injectable()
export class ParseLogUseCase {
  constructor(
    private readonly parser: LogParserService,
    private readonly stats: StatsCalculatorService,
    @InjectRepository(MatchOrmEntity) private readonly matchRepo: Repository<MatchOrmEntity>,
    @InjectRepository(PlayerOrmEntity) private readonly playerRepo: Repository<PlayerOrmEntity>,
    @InjectRepository(KillOrmEntity) private readonly killRepo: Repository<KillOrmEntity>,
    @InjectRepository(AwardOrmEntity) private readonly awardRepo: Repository<AwardOrmEntity>,
  ) { }

  async execute({ log }: Input) {
    if (!log || log.trim().length === 0) {
      throw new Error('Empty log content');
    }

    const parsed = this.parser.parse(log);
    const results: Array<{ matchId: string }> = [];

    for (const match of parsed.matches) {
      await this.persistMatchWithEvents(match, parsed.events.filter(e => e.matchId === match.id));
      results.push({ matchId: match.id });
    }

    return { matches: results };
  }

  private async getOrCreatePlayerByName(name: string): Promise<PlayerOrmEntity> {
    let p = await this.playerRepo.findOne({ where: { name } });
    if (!p) {
      p = this.playerRepo.create({ name });
      p = await this.playerRepo.save(p);
    }
    return p;
  }

  private async persistMatchWithEvents(match: Match, events: KillEvent[]) {
    const playerNames = new Set<string>();
    for (const ev of events) {
      if (ev.killer && ev.killer !== '<WORLD>') playerNames.add(ev.killer);
      if (ev.victim && ev.victim !== '<WORLD>') playerNames.add(ev.victim);
      if (playerNames.size > 20) {
        throw new BadRequestException(
          `Partida ${match.id} possui ${playerNames.size} jogadores. Limite máximo é 20.`,
        );
      }
    }

    let m = await this.matchRepo.findOne({ where: { id: match.id } });
    if (!m) {
      m = this.matchRepo.create({
        id: match.id,
        startedAt: match.startedAt,
        endedAt: match.endedAt ?? null,
      });
      await this.matchRepo.save(m);
    } else if (match.endedAt && !m.endedAt) {
      m.endedAt = match.endedAt;
      await this.matchRepo.save(m);
    }

    const byName = new Map<string, PlayerOrmEntity>();
    const ensurePlayer = async (name: string) => {
      if (name === '<WORLD>') return null;
      if (!byName.has(name)) {
        byName.set(name, await this.getOrCreatePlayerByName(name));
      }
      return byName.get(name)!;
    };

    for (const ev of events) {
      const killer = await ensurePlayer(ev.killer);
      const victim = await ensurePlayer(ev.victim);

      const exists = await this.killRepo.findOne({
        where: {
          matchId: match.id,
          occurredAt: ev.occurredAt,
          killerName: ev.killer === '<WORLD>' ? IsNull() : ev.killer,
          victimName: ev.victim,
        },
      });
      if (exists) continue;

      const row = this.killRepo.create({
        matchId: match.id,
        killerId: killer?.id ?? null,
        victimId: victim!.id,
        killerName: killer ? killer.name : null,
        victimName: victim!.name,
        occurredAt: ev.occurredAt,
        causeType: ev.cause.type,
        weapon: ev.cause.type === 'WEAPON' ? ev.cause.weapon : null,
        reason: ev.cause.type === 'WORLD' ? ev.cause.reason : null,
      });
      await this.killRepo.save(row);
    }

    const domainEvents = events.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    const computed = this.stats.computeMatchStats(match, domainEvents, {});
    const awardRows: Array<Partial<AwardOrmEntity>> = [];

    if (computed.winner) {
      const winnerName = computed.winner.player;
      const winnerStats = computed.players[winnerName];
      if (winnerStats?.awards?.invincible) {
        const winner = byName.get(winnerName) ?? (await this.getOrCreatePlayerByName(winnerName));
        awardRows.push({
          matchId: match.id,
          playerId: winner.id,
          type: 'INVINCIBLE',
        });
      }
    }

    for (const p of Object.values(computed.players)) {
      if (p.awards?.fiveInOneMinute) {
        const pl = byName.get(p.player) ?? (await this.getOrCreatePlayerByName(p.player));
        awardRows.push({
          matchId: match.id,
          playerId: pl.id,
          type: 'FIVE_IN_ONE_MINUTE',
        });
      }
    }

    if (awardRows.length > 0) {
      await this.awardRepo.upsert(awardRows as AwardOrmEntity[], ['matchId', 'playerId', 'type']);
    }
  }
}
