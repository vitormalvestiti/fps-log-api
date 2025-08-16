import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreTables1720000000000 implements MigrationInterface {
  name = 'CreateCoreTables1720000000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE matches (
        id varchar(32) PRIMARY KEY,
        startedAt timestamp without time zone NOT NULL,
        endedAt timestamp without time zone NULL,
        createdAt timestamp without time zone DEFAULT now(),
        updatedAt timestamp without time zone DEFAULT now()
      );
    `);

    await q.query(`
      CREATE TABLE players (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(64) NOT NULL UNIQUE,
        createdAt timestamp without time zone DEFAULT now(),
        updatedAt timestamp without time zone DEFAULT now()
      );
    `);

    await q.query(`
      CREATE TABLE teams (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(64) NOT NULL UNIQUE,
        createdAt timestamp without time zone DEFAULT now(),
        updatedAt timestamp without time zone DEFAULT now()
      );
    `);

    await q.query(`
      CREATE TABLE player_match_teams (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        matchId varchar(32) NOT NULL,
        playerId uuid NOT NULL,
        teamId uuid NOT NULL,
        playerName varchar(64) NOT NULL,
        teamName varchar(64) NOT NULL,
        CONSTRAINT uq_pmt UNIQUE (matchId, playerId)
      );
    `);

    await q.query(`CREATE INDEX idx_pmt_match_team ON player_match_teams(matchId, teamId);`);

    await q.query(`
      CREATE TABLE kills (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        matchId varchar(32) NOT NULL,
        killerId uuid NULL,
        victimId uuid NOT NULL,
        killerName varchar(64) NULL,
        victimName varchar(64) NOT NULL,
        occurredAt timestamp without time zone NOT NULL,
        causeType varchar(16) NOT NULL,
        weapon varchar(64) NULL,
        reason varchar(64) NULL,
        createdAt timestamp without time zone DEFAULT now()
      );
    `);

    await q.query(`CREATE INDEX idx_kills_match_time ON kills(matchId, occurredAt);`);
    await q.query(`CREATE INDEX idx_kills_killer_time ON kills(killerId, occurredAt);`);

    await q.query(`
      CREATE TABLE awards (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        matchId varchar(32) NOT NULL,
        playerId uuid NOT NULL,
        type varchar(32) NOT NULL,
        createdAt timestamp without time zone DEFAULT now(),
        CONSTRAINT uq_award UNIQUE (matchId, playerId, type)
      );
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE awards;`);
    await q.query(`DROP INDEX IF EXISTS idx_kills_killer_time;`);
    await q.query(`DROP INDEX IF EXISTS idx_kills_match_time;`);
    await q.query(`DROP TABLE kills;`);
    await q.query(`DROP INDEX IF EXISTS idx_pmt_match_team;`);
    await q.query(`DROP TABLE player_match_teams;`);
    await q.query(`DROP TABLE teams;`);
    await q.query(`DROP TABLE players;`);
    await q.query(`DROP TABLE matches;`);
  }
}
