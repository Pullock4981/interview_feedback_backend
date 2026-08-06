const app = require('../src/app');
const connectDB = require('../src/config/db');

// Connect to DB, handle promise rejections gently
connectDB().catch(console.error);

module.exports = app;
