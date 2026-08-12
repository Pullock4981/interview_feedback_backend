const mongoose = require('mongoose');
const Interview = require('./src/modules/interviews/interview.model.js');
require('dotenv').config({ path: '.env' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  const result = await Interview.updateMany(
    { $or: [{ course: { $exists: false } }, { course: 'N/A' }] },
    { $set: { course: 'Previous Courses' } }
  );
  console.log('Updated:', result);
  process.exit(0);
}).catch(console.error);
