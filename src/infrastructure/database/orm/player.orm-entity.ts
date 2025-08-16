import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';
import { KillOrmEntity } from './kill.orm-entity';
import { PlayerMatchTeamOrmEntity } from './player-match-team.orm-entity';

@Entity('players')
@Index(['name'], { unique: true })
export class PlayerOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  name!: string;

  @OneToMany(() => KillOrmEntity, k => k.killer)
  kills!: KillOrmEntity[];

  @OneToMany(() => KillOrmEntity, k => k.victim)
  deaths!: KillOrmEntity[];

  @OneToMany(() => PlayerMatchTeamOrmEntity, pmt => pmt.player)
  memberships!: PlayerMatchTeamOrmEntity[];

  @CreateDateColumn({ name: 'createdat', type: 'timestamp without time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedat', type: 'timestamp without time zone' })
  updatedAt!: Date;
}