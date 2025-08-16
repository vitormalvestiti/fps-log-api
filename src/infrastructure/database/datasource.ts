import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '5432',
  DB_USER = 'postgres',
  DB_PASS = 'postgres',
  DB_NAME = 'fps_log_db',
  DB_LOGGING = 'true',
} = process.env;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: Number(DB_PORT),
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  logging: DB_LOGGING === 'true',
  synchronize: false,
  entities: ['src/infrastructure/database/orm/*.ts'],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
});
