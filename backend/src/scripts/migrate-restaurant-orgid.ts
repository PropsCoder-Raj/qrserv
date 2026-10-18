import mongoose, { Types } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://localhost:27017/qrserv';

async function migrate() {
  console.log(`Connecting to MongoDB at: ${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
  await mongoose.connect(MONGO_URI);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const restaurantsCollection = db.collection('restaurants');
  const stringOrgRestaurants = await restaurantsCollection
    .find({ organizationId: { $type: 'string' } })
    .toArray();

  console.log(`Found ${stringOrgRestaurants.length} restaurant(s) with string organizationId.`);

  let updatedCount = 0;
  for (const rest of stringOrgRestaurants) {
    if (typeof rest.organizationId === 'string' && Types.ObjectId.isValid(rest.organizationId)) {
      await restaurantsCollection.updateOne(
        { _id: rest._id },
        { $set: { organizationId: new Types.ObjectId(rest.organizationId) } },
      );
      updatedCount++;
    }
  }

  console.log(`Successfully migrated ${updatedCount} restaurant(s) to ObjectId organizationId.`);
  await mongoose.disconnect();
}

migrate()
  .then(() => {
    console.log('Migration completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
