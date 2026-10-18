import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://localhost:27017/qrserv';

async function migrate() {
  console.log(`Connecting to MongoDB at: ${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB. Normalizing paymentMethod in orders...');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const ordersCollection = db.collection('orders');

  const cashResult = await ordersCollection.updateMany(
    { paymentMethod: { $in: ['cash', 'Cash'] } },
    { $set: { paymentMethod: 'CASH' } },
  );
  console.log(`Updated ${cashResult.modifiedCount} order(s) with 'cash' -> 'CASH'.`);

  const cardResult = await ordersCollection.updateMany(
    { paymentMethod: { $in: ['card', 'Card'] } },
    { $set: { paymentMethod: 'CARD' } },
  );
  console.log(`Updated ${cardResult.modifiedCount} order(s) with 'card' -> 'CARD'.`);

  const onlineResult = await ordersCollection.updateMany(
    { paymentMethod: { $in: ['online', 'Online'] } },
    { $set: { paymentMethod: 'ONLINE' } },
  );
  console.log(`Updated ${onlineResult.modifiedCount} order(s) with 'online' -> 'ONLINE'.`);

  // Ensure default for orders with null/missing paymentMethod
  const missingResult = await ordersCollection.updateMany(
    { $or: [{ paymentMethod: null }, { paymentMethod: { $exists: false } }] },
    { $set: { paymentMethod: 'CASH' } },
  );
  console.log(`Updated ${missingResult.modifiedCount} order(s) with missing paymentMethod -> 'CASH'.`);

  // Also normalize paymentStatus
  const paidResult = await ordersCollection.updateMany(
    { paymentStatus: { $in: ['PAID', 'Paid'] } },
    { $set: { paymentStatus: 'paid' } },
  );
  console.log(`Updated ${paidResult.modifiedCount} order(s) with paymentStatus -> 'paid'.`);

  const pendingResult = await ordersCollection.updateMany(
    { paymentStatus: { $in: ['PENDING', 'Pending'] } },
    { $set: { paymentStatus: 'pending' } },
  );
  console.log(`Updated ${pendingResult.modifiedCount} order(s) with paymentStatus -> 'pending'.`);

  console.log('Payment method and status normalization completed successfully.');
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
