require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

const createAdmin = async () => {
  try {
    await connectDB();

    const email = 'admin@eventeev.com';
    let user = await User.findOne({ email }).select('+password');

    if (user) {
      console.log('User already exists in the database. Updating password and role to admin...');
      user.password = 'Qwerty12345@@';
      user.role = 'admin';
      user.isVerified = true;
      user.isWaitlisted = false;
      await user.save();
      console.log('Successfully updated existing user to admin with password "Qwerty12345@@".');
    } else {
      console.log('User does not exist. Creating new admin user...');
      user = new User({
        firstName: 'Admin',
        lastName: 'Eventeev',
        email: email,
        password: 'Qwerty12345@@',
        role: 'admin',
        isVerified: true,
        isWaitlisted: false
      });
      await user.save();
      console.log('Successfully created new admin user with password "Qwerty12345@@".');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdmin();
