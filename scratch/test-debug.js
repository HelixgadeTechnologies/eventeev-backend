require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

async function testDebug() {
  await connectDB();
  try {
    const userObj = new User({
      firstName: 'Test',
      lastName: 'User',
      email: `test_debug_${Date.now()}@test.com`,
      password: 'password123',
      isVerified: true
    });
    await userObj.save();
    console.log('Test user saved:', userObj._id);

    const fetched = await User.findById(userObj._id)
      .populate('teammates.user', 'firstName lastName email avatar');
    console.log('Fetch succeeded:', fetched);

    // Clean up
    await User.deleteOne({ _id: userObj._id });
  } catch (err) {
    console.error('Debug test failed with error:');
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testDebug();
