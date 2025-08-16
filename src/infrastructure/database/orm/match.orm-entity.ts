import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { KillOrmEntity } from './kill.orm-entity';

@Entity('matches')
export class MatchOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ name: 'startedat', type: 'timestamp without time zone' })
  startedAt!: Date;

  @Column({ name: 'endedat', type: 'timestamp without time zone', nullable: true })
  endedAt!: Date | null;

  @OneToMany(() => KillOrmEntity, k => k.match)
  kills!: KillOrmEntity[];

  @CreateDateColumn({ name: 'createdat', type: 'timestamp without time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedat', type: 'timestamp without time zone' })
  updatedAt!: Date;
}