const mongoose = require('mongoose');
const env = require('./config/env');

mongoose.connect(env.MONGO_URI).then(async () => {
  try {
    const db = mongoose.connection.db;
    const indexes = await db.collection('attendances').indexes();
    console.log('Existing Indexes:', indexes);

    // Agar koi extra unique index hai (employee_1_date_1 ke alawa), use delete karo
    for (let idx of indexes) {
      if (idx.unique && idx.name !== '_id_' && idx.name !== 'employee_1_date_1') {
        await db.collection('attendances').dropIndex(idx.name);
        console.log(`Dropped index: ${idx.name}`);
      }
    }

    console.log('✅ Extra indexes deleted!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});