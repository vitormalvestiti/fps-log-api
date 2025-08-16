import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, Index, JoinColumn } from 'typeorm';
import { PlayerOrmEntity } from './player.orm-entity';
import { TeamOrmEntity } from './team.orm-entity';
import { MatchOrmEntity } from './match.orm-entity';

@Entity('player_match_teams')
@Unique(['matchId', 'playerId'])
@Index(['matchId', 'teamId'])
export class PlayerMatchTeamOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'matchid', type: 'varchar', length: 32 })
  matchId!: string;

  @Column({ name: 'playerid', type: 'uuid' })
  playerId!: string;

  @Column({ name: 'teamid', type: 'uuid' })
  teamId!: string;

  @Column({ name: 'playername', type: 'varchar', length: 64 })
  playerName!: string;

  @Column({ name: 'teamname', type: 'varchar', length: 64 })
  teamName!: string;

  @ManyToOne(() => MatchOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchid', referencedColumnName: 'id' })
  match!: MatchOrmEntity;

  @ManyToOne(() => PlayerOrmEntity, p => p.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerid', referencedColumnName: 'id' })
  player!: PlayerOrmEntity;

  @ManyToOne(() => TeamOrmEntity, t => t.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamid', referencedColumnName: 'id' })
  team!: TeamOrmEntity;
}