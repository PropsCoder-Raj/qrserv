export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/qr-order',
  },
  apiKeys: {
    // For simple API-key protected endpoints (non-JWT)
    default: process.env.API_KEY || '',
    subscriptionPlans:
      process.env.SUBSCRIPTION_PLANS_API_KEY || process.env.API_KEY || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  withdraw: {
    chargePercentage: parseFloat(process.env.WITHDRAW_CHARGE_PERCENTAGE || '2.5'),
    chargeGstPercentage: parseFloat(
      process.env.WITHDRAW_CHARGE_GST_PERCENTAGE || '18',
    ),
  },
  mail: {
    host: process.env.MAIL_HOST || '',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || '',
    to: process.env.MAIL_TO || 'quickratingservice@gmail.com',
    subjectPrefix: process.env.MAIL_SUBJECT_PREFIX || 'QRserve',
  },
});
