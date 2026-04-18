require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

/**
 * Script to promote a user to admin role.
 * Usage: node scripts/promoteUser.js <user_email>
 */

const promoteUser = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error('Please provide a user email: node scripts/promoteUser.js <email>');
    process.exit(1);
  }

  try {
    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`Successfully promoted ${user.firstName} ${user.lastName} (${email}) to admin.`);
    process.exit(0);
  } catch (error) {
    console.error('Error promoting user:', error.message);
    process.exit(1);
  }
};

promoteUser();
