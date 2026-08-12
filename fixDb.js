const mongoose = require('mongoose');
const Interview = require('./src/modules/interviews/interview.model.js');
const Student = require('./src/modules/students/student.model.js');
require('dotenv').config({ path: '.env' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  const ints = await Interview.find({ course: 'Previous Courses', status: { $ne: 'Completed' } }).populate('student');
  let count = 0;
  for (const intv of ints) {
    if (intv.student && intv.student.course) {
      intv.course = intv.student.course;
      await intv.save();
      count++;
    }
  }
  console.log('Fixed', count, 'interviews');
  process.exit(0);
}).catch(console.error);
