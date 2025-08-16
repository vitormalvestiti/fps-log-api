import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MatchOrmEntity } from './match.orm-entity';
import { PlayerOrmEntity } from './player.orm-entity';

@Entity('awards')
@Index(['matchId', 'playerId', 'type'], { unique: true })
export class AwardOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'matchid', type: 'varchar', length: 32 })
  matchId!: string;

  @ManyToOne(() => MatchOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchid', referencedColumnName: 'id' })
  match!: MatchOrmEntity;

  @Column({ name: 'playerid', type: 'uuid' })
  playerId!: string;

  @ManyToOne(() => PlayerOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerid', referencedColumnName: 'id' })
  player!: PlayerOrmEntity;

  @Column({ name: 'type', type: 'varchar', length: 32 })
  type!: 'INVINCIBLE' | 'FIVE_IN_ONE_MINUTE';

  @CreateDateColumn({ name: 'createdat', type: 'timestamp without time zone' })
  createdAt!: Date;
}