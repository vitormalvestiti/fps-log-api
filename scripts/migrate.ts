import 'reflect-metadata';
import { AppDataSource } from '../src/infrastructure/database/datasource';

async function main() {
  const action = process.argv[2];
  if (!action) {
    console.error('Usage: ts-node -r dotenv/config ./scripts/migrate.ts <run|revert>');
    process.exit(1);
  }

  await AppDataSource.initialize();

  try {
    if (action === 'run') {
      const res = await AppDataSource.runMigrations();
      console.log(`Run ${res.length} migration(s).`);
    } else if (action === 'revert') {
      await AppDataSource.undoLastMigration();
      console.log('Reverted last migration.');
    } else {
      console.error('Unknown action. Use "run" or "revert".');
      process.exit(1);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
