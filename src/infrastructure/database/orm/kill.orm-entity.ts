import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MatchOrmEntity } from './match.orm-entity';
import { PlayerOrmEntity } from './player.orm-entity';

@Entity('kills')
@Index(['matchId', 'occurredAt'])
@Index(['killerId', 'occurredAt'])
export class KillOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'matchid', type: 'varchar', length: 32 })
  matchId!: string;

  @ManyToOne(() => MatchOrmEntity, m => m.kills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchid', referencedColumnName: 'id' })
  match!: MatchOrmEntity;

  @Column({ name: 'killerid', type: 'uuid', nullable: true })
  killerId!: string | null;

  @ManyToOne(() => PlayerOrmEntity, p => p.kills, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'killerid', referencedColumnName: 'id' })
  killer!: PlayerOrmEntity | null;

  @Column({ name: 'victimid', type: 'uuid' })
  victimId!: string;

  @ManyToOne(() => PlayerOrmEntity, p => p.deaths, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'victimid', referencedColumnName: 'id' })
  victim!: PlayerOrmEntity;

  @Column({ name: 'occurredat', type: 'timestamp without time zone' })
  occurredAt!: Date;

  @Column({ name: 'causetype', type: 'varchar', length: 16 })
  causeType!: 'WEAPON' | 'WORLD';

  @Column({ name: 'weapon', type: 'varchar', length: 64, nullable: true })
  weapon!: string | null;

  @Column({ name: 'reason', type: 'varchar', length: 64, nullable: true })
  reason!: string | null;

  @Column({ name: 'killername', type: 'varchar', length: 64, nullable: true })
  killerName!: string | null;

  @Column({ name: 'victimname', type: 'varchar', length: 64 })
  victimName!: string;

  @CreateDateColumn({ name: 'createdat', type: 'timestamp without time zone' })
  createdAt!: Date;
}