"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(['8.8.8.8', '8.8.4.4']);
const MONGODB_URI = process.env.MONGODB_URI ||
    'mongodb+srv://RohitMeanDev:Pass1234@meanlearn.whyze.mongodb.net/qr-order';
console.log('🚀 ~ MONGODB_URI:', MONGODB_URI);
const subscriptionSchema = new mongoose.Schema({
    name: String,
    price: Number,
    duration: Number,
    maxTables: Number,
    maxMenuItems: Number,
    maxCategories: Number,
    maxRestaurants: Number,
    customerDataAccess: String,
    features: [String],
    isMenuPdfEnabled: Boolean,
    isActive: Boolean,
}, { timestamps: true });
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const plans = [
    {
        name: 'FRANCHISE',
        price: 10000,
        duration: 30,
        maxTables: 0,
        maxMenuItems: 0,
        maxCategories: 0,
        maxRestaurants: 5,
        customerDataAccess: 'optional',
        isMenuPdfEnabled: false,
        features: [
            'Unlimited Items & Categories',
            'Sales Data Management',
            'Customer Contact Data (Optional)',
            'Max 5 Outlets',
        ],
        isActive: true,
    },
    {
        name: 'FRANCHISE PRO',
        price: 15000,
        duration: 30,
        maxTables: 0,
        maxMenuItems: 0,
        maxCategories: 0,
        maxRestaurants: 10,
        customerDataAccess: 'optional',
        isMenuPdfEnabled: false,
        features: [
            'Unlimited Items & Categories',
            'Sales Data Management',
            'Customer Contact Data (Optional)',
            'Max 10 Outlets',
        ],
        isActive: true,
    },
    {
        name: 'FRANCHISE GOLD',
        price: 30000,
        duration: 30,
        maxTables: 0,
        maxMenuItems: 0,
        maxCategories: 0,
        maxRestaurants: 0,
        customerDataAccess: 'optional',
        isMenuPdfEnabled: false,
        features: [
            'Unlimited Items & Categories',
            'Sales Data Management',
            'Customer Contact Data (Optional)',
            'Unlimited Outlets',
        ],
        isActive: true,
    },
];
async function seed() {
    try {
        await mongoose.connect(MONGODB_URI, {
            family: 4,
            serverSelectionTimeoutMS: 10000,
        });
        console.log('Connected to MongoDB');
        for (const plan of plans) {
            const result = await Subscription.updateOne({ name: plan.name }, { $set: plan }, { upsert: true });
            const action = result.upsertedCount ? 'Created' : 'Updated';
            console.log(`${action}: ${plan.name}`);
        }
        console.log('Seed completed successfully');
    }
    catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
    finally {
        await mongoose.disconnect();
    }
}
seed();
//# sourceMappingURL=seed-plans.js.map