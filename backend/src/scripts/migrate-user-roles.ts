import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://localhost:27017/qrserv';

async function migrate() {
  const direction = (process.argv[2] || 'up').toLowerCase();

  if (direction !== 'up' && direction !== 'down') {
    console.error('Invalid direction. Use "up" or "down". Example: ts-node src/scripts/migrate-user-roles.ts up');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB at: ${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to MongoDB. Executing migration: ${direction.toUpperCase()}...`);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const usersCollection = db.collection('users');

  if (direction === 'up') {
    // manager -> captain
    const managerResult = await usersCollection.updateMany(
      { role: 'manager' },
      { $set: { role: 'captain' } },
    );
    console.log(`Migrated ${managerResult.modifiedCount} user(s) from 'manager' to 'captain'.`);

    // staff -> kitchen
    const staffResult = await usersCollection.updateMany(
      { role: 'staff' },
      { $set: { role: 'kitchen' } },
    );
    console.log(`Migrated ${staffResult.modifiedCount} user(s) from 'staff' to 'kitchen'.`);
  } else {
    // captain -> manager (rollback)
    const captainResult = await usersCollection.updateMany(
      { role: 'captain' },
      { $set: { role: 'manager' } },
    );
    console.log(`Rolled back ${captainResult.modifiedCount} user(s) from 'captain' to 'manager'.`);

    // kitchen -> staff (rollback)
    const kitchenResult = await usersCollection.updateMany(
      { role: 'kitchen' },
      { $set: { role: 'staff' } },
    );
    console.log(`Rolled back ${kitchenResult.modifiedCount} user(s) from 'kitchen' to 'staff'.`);
  }

  console.log(`Migration ${direction.toUpperCase()} completed successfully.`);
}

migrate()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Migration failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  });
