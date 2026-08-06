const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
  const Interview = mongoose.model('Interview', new mongoose.Schema({}, { strict: false }));
  
  let instructor = await User.findOne({ role: 'instructor' });
  if (!instructor) {
    instructor = await User.create({ name: 'Demo Instructor', email: 'instructor@test.com', role: 'instructor', isActive: true });
    console.log("Created mock instructor");
  } else {
    console.log("Found instructor:", instructor.email);
  }

  let student = await Student.findOne();
  if (!student) {
    student = await Student.create({ name: 'Jane Doe', email: 'jane@test.com', course: 'Full Stack', batch: 'Batch 1', assignedInstructor: instructor._id });
    console.log("Created mock student");
  }

  const interview = await Interview.findOne({ student: student._id });
  if (!interview) {
    await Interview.create({ student: student._id, instructor: instructor._id, status: 'Assigned' });
    console.log("Created mock assigned interview");
  }

  console.log("Instructor ID:", instructor._id.toString());
  
  process.exit(0);
}
check();
