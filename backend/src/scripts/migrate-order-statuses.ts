import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://localhost:27017/qrserv';

// PREPARING orders are still being cooked, so they return to CONFIRMED (the
// kitchen-active stage) instead of jumping to READY.
const ORDER_STATUS_REMAP: Array<{ from: string[]; to: string }> = [
  { from: ['preparing', 'PREPARING'], to: 'confirmed' },
  { from: ['served', 'SERVED'], to: 'completed' },
];

const LEGACY_COUNTER_FIELDS = ['servedOrderCount', 'preparingOrderCount'];

async function migrate() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(`Connecting to MongoDB at: ${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
  await mongoose.connect(MONGO_URI);
  console.log(`Connected. Mode: ${dryRun ? 'DRY RUN (no writes)' : 'APPLY'}`);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const orders = db.collection('orders');
  for (const { from, to } of ORDER_STATUS_REMAP) {
    const filter = { status: { $in: from } };
    const count = await orders.countDocuments(filter);
    console.log(`Orders with status ${from.join('/')} -> ${to}: ${count}`);

    if (!dryRun && count > 0) {
      const result = await orders.updateMany(filter, { $set: { status: to } });
      console.log(`  Updated ${result.modifiedCount} order(s).`);
    }
  }

  // Fold legacy served counts into completedOrderCount without overwriting
  // any completions already counted by the new code, then drop legacy fields.
  const statistics = db.collection('orderstatistics');
  const legacyFilter = {
    $or: LEGACY_COUNTER_FIELDS.map((field) => ({ [field]: { $exists: true } })),
  };
  const legacyCount = await statistics.countDocuments(legacyFilter);
  console.log(`Order statistics records with legacy counters: ${legacyCount}`);

  if (!dryRun && legacyCount > 0) {
    const result = await statistics.updateMany(legacyFilter, [
      {
        $set: {
          completedOrderCount: {
            $add: [
              { $ifNull: ['$completedOrderCount', 0] },
              { $ifNull: ['$servedOrderCount', 0] },
            ],
          },
        },
      },
      { $unset: LEGACY_COUNTER_FIELDS },
    ]);
    console.log(`  Updated ${result.modifiedCount} statistics record(s).`);
  }

  console.log(
    'Note: totalOrderAmount was previously accrued on payment (PAID). It is not ' +
      'recalculated here; revenue accrues on COMPLETED going forward.',
  );

  await mongoose.disconnect();
  console.log('Done.');
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
