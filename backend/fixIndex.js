const mongoose = require('mongoose');
const env = require('./config/env');

mongoose.connect(env.MONGO_URI).then(async () => {
  try {
    const db = mongoose.connection.db;
    
    // Leads collection se leadId index drop karo
    await db.collection('leads').dropIndex('leadId_1').catch(e => console.log('leadId_1 index already dropped or not found'));
    
    // Customers collection se customerId index drop karo
    await db.collection('customers').dropIndex('customerId_1').catch(e => console.log('customerId_1 index already dropped or not found'));
    
    console.log('✅ Purane indexes delete ho gaye!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});