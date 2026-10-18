import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { roundTo3 } from '../common/utils/precision';

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://localhost:27017/qrserv';

async function migrate() {
  console.log(`Connecting to MongoDB at: ${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB. Starting 3-decimal standardization migration...');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  // 1. Migrate Orders
  const ordersCollection = db.collection('orders');
  const orders = await ordersCollection.find({}).toArray();
  console.log(`Found ${orders.length} orders to inspect.`);

  let migratedOrders = 0;
  for (const order of orders) {
    const updatedItems = (order.items || []).map((item: any) => ({
      ...item,
      price: roundTo3(item.price),
      spiceLevel: item.spiceLevel
        ? {
            ...item.spiceLevel,
            priceDelta: roundTo3(item.spiceLevel.priceDelta || 0),
          }
        : item.spiceLevel,
      addOns: (item.addOns || []).map((addOn: any) => ({
        ...addOn,
        priceDelta: roundTo3(addOn.priceDelta || 0),
      })),
    }));

    await ordersCollection.updateOne(
      { _id: order._id },
      {
        $set: {
          items: updatedItems,
          totalAmount: roundTo3(order.totalAmount),
          subtotalAmount: roundTo3(order.subtotalAmount || 0),
          taxAmount: roundTo3(order.taxAmount || 0),
          taxRate: roundTo3(order.taxRate || 0),
          cgstRate: roundTo3(order.cgstRate || 0),
          sgstRate: roundTo3(order.sgstRate || 0),
          cgstAmount: roundTo3(order.cgstAmount || 0),
          sgstAmount: roundTo3(order.sgstAmount || 0),
          vatAmount: roundTo3(order.vatAmount || 0),
          vatRate: roundTo3(order.vatRate || 0),
          foodSubtotal: roundTo3(order.foodSubtotal || 0),
          liquorSubtotal: roundTo3(order.liquorSubtotal || 0),
          discountAmount: roundTo3(order.discountAmount || 0),
        },
      },
    );
    migratedOrders++;
  }
  console.log(`Migrated ${migratedOrders} orders.`);

  // 2. Migrate MenuItems
  const menuItemsCollection = db.collection('menuitems');
  const menuItems = await menuItemsCollection.find({}).toArray();
  console.log(`Found ${menuItems.length} menu items to inspect.`);

  let migratedMenuItems = 0;
  for (const item of menuItems) {
    const updatedCustomization = item.customization
      ? {
          ...item.customization,
          spiceLevels: (item.customization.spiceLevels || []).map((sl: any) => ({
            ...sl,
            priceDelta: roundTo3(sl.priceDelta || 0),
          })),
          addOns: (item.customization.addOns || []).map((ao: any) => ({
            ...ao,
            priceDelta: roundTo3(ao.priceDelta || 0),
          })),
        }
      : item.customization;

    await menuItemsCollection.updateOne(
      { _id: item._id },
      {
        $set: {
          price: roundTo3(item.price),
          discountValue: roundTo3(item.discountValue || 0),
          customization: updatedCustomization,
        },
      },
    );
    migratedMenuItems++;
  }
  console.log(`Migrated ${migratedMenuItems} menu items.`);

  // 3. Migrate Coupons
  const couponsCollection = db.collection('coupons');
  const coupons = await couponsCollection.find({}).toArray();
  console.log(`Found ${coupons.length} coupons to inspect.`);

  let migratedCoupons = 0;
  for (const coupon of coupons) {
    await couponsCollection.updateOne(
      { _id: coupon._id },
      {
        $set: {
          discountValue: roundTo3(coupon.discountValue),
          minOrderAmount: roundTo3(coupon.minOrderAmount || 0),
          maxDiscount: coupon.maxDiscount != null ? roundTo3(coupon.maxDiscount) : null,
        },
      },
    );
    migratedCoupons++;
  }
  console.log(`Migrated ${migratedCoupons} coupons.`);

  // 4. Migrate CouponUsages
  const couponUsagesCollection = db.collection('couponusages');
  const usages = await couponUsagesCollection.find({}).toArray();
  for (const usage of usages) {
    await couponUsagesCollection.updateOne(
      { _id: usage._id },
      {
        $set: {
          discountAmount: roundTo3(usage.discountAmount || 0),
        },
      },
    );
  }
  console.log(`Migrated ${usages.length} coupon usages.`);

  // 5. Migrate OrderStatistics
  const orderStatsCollection = db.collection('orderstatistics');
  const statsList = await orderStatsCollection.find({}).toArray();
  for (const stat of statsList) {
    await orderStatsCollection.updateOne(
      { _id: stat._id },
      {
        $set: {
          totalOrderAmount: roundTo3(stat.totalOrderAmount || 0),
        },
      },
    );
  }
  console.log(`Migrated ${statsList.length} order statistics documents.`);

  // 6. Migrate Payments
  const paymentsCollection = db.collection('payments');
  const payments = await paymentsCollection.find({}).toArray();
  for (const payment of payments) {
    await paymentsCollection.updateOne(
      { _id: payment._id },
      {
        $set: {
          amount: roundTo3(payment.amount),
        },
      },
    );
  }
  console.log(`Migrated ${payments.length} payment documents.`);

  // 7. Migrate WithdrawRequests
  const withdrawRequestsCollection = db.collection('withdrawrequests');
  const withdrawRequests = await withdrawRequestsCollection.find({}).toArray();
  for (const req of withdrawRequests) {
    await withdrawRequestsCollection.updateOne(
      { _id: req._id },
      {
        $set: {
          amount: roundTo3(req.amount),
          chargeBaseAmount: roundTo3(req.chargeBaseAmount || 0),
          chargeGstAmount: roundTo3(req.chargeGstAmount || 0),
          chargeAmount: roundTo3(req.chargeAmount || 0),
          netAmount: roundTo3(req.netAmount || 0),
        },
      },
    );
  }
  console.log(`Migrated ${withdrawRequests.length} withdraw requests.`);

  console.log('Successfully completed 3-decimal standardization migration!');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
