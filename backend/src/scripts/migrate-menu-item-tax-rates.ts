import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://localhost:27017/qrserv';

// Menu items created before per-item rates were introduced have no gstRate or vatRate.
// They are backfilled from their restaurant's current settings using the same rule the
// order service applies to legacy items: liquor is taxed under VAT, everything else under GST.
async function migrate() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(`Connecting to MongoDB at: ${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
  await mongoose.connect(MONGO_URI);
  console.log(`Connected. Mode: ${dryRun ? 'DRY RUN (no writes)' : 'APPLY'}`);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const restaurants = db.collection('restaurants');
  const menuItems = db.collection('menuitems');
  const missingRates = { gstRate: { $exists: false } };

  let total = 0;
  let updated = 0;

  for await (const restaurant of restaurants.find({})) {
    const gstRate = restaurant.taxEnabled ? Number(restaurant.taxRate) || 0 : 0;
    const vatRate = restaurant.vatEnabled ? Number(restaurant.vatRate) || 0 : 0;

    const filter = { restaurantId: restaurant._id, ...missingRates };
    const items = await menuItems.find(filter).project({ itemType: 1 }).toArray();
    total += items.length;

    for (const item of items) {
      const isLiquor = item.itemType === 'liquor';
      const rates = {
        gstRate: isLiquor ? 0 : gstRate,
        vatRate: isLiquor ? vatRate : 0,
      };

      if (!dryRun) {
        await menuItems.updateOne({ _id: item._id }, { $set: rates });
        updated += 1;
      }
    }

    if (items.length > 0) {
      console.log(
        `Restaurant ${restaurant._id}: ${items.length} item(s) (food gst=${gstRate}, liquor vat=${vatRate})`,
      );
    }
  }

  console.log(`Menu items missing gstRate: ${total}. Updated: ${dryRun ? 0 : updated}.`);

  await mongoose.disconnect();
  console.log('Done.');
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
