import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';
import { PlayerMatchTeamOrmEntity } from './player-match-team.orm-entity';

@Entity('teams')
@Index(['name'], { unique: true })
export class TeamOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  name!: string;

  @OneToMany(() => PlayerMatchTeamOrmEntity, pmt => pmt.team)
  memberships!: PlayerMatchTeamOrmEntity[];

  @CreateDateColumn({ name: 'createdat', type: 'timestamp without time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedat', type: 'timestamp without time zone' })
  updatedAt!: Date;
}