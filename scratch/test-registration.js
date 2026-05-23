require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

const BASE_URL = 'http://localhost:5000/api';

async function makeRequest(path, method = 'POST', body = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  const config = {
    method,
    headers,
  };
  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, config);
  const data = await response.json();
  return { status: response.status, data };
}

async function runRegistrationTests() {
  console.log('--- STARTING REGISTRATION ENDPOINT VERIFICATION ---');
  
  // Connect DB to read OTP and check database state
  await connectDB();

  const uniqueId = Date.now();
  const testEmail = `verification_test_${uniqueId}@test.com`;

  try {
    // 1. Test invalid inputs (missing required fields)
    console.log('\n[1] Testing registration with missing fields...');
    const invalidRes1 = await makeRequest('/auth/register', 'POST', {
      firstName: '',
      lastName: '',
      email: 'not-an-email',
      password: '123',
    });
    console.log('Status returned for invalid input:', invalidRes1.status);
    console.log('Validation errors:', invalidRes1.data);
    if (invalidRes1.status !== 400) {
      throw new Error('Expected 400 Bad Request for invalid inputs');
    }
    console.log('✅ Validation correctly rejected bad input.');

    // 2. Test successful registration
    console.log(`\n[2] Testing successful registration with email: ${testEmail}...`);
    const registerRes = await makeRequest('/auth/register', 'POST', {
      firstName: 'Test',
      lastName: 'Registration',
      email: testEmail,
      password: 'securePassword123',
    });
    console.log('Registration status:', registerRes.status);
    console.log('Registration response:', registerRes.data);
    if (registerRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(registerRes.data)}`);
    }
    console.log('✅ Registration successfully completed and OTP email triggered.');

    // 3. Verify user created in MongoDB as unverified
    console.log('\n[3] Querying user in DB...');
    const userInDb = await User.findOne({ email: testEmail });
    if (!userInDb) {
      throw new Error('User not found in database after registration');
    }
    console.log(`User found in DB. isVerified: ${userInDb.isVerified}, has OTP code: ${!!userInDb.otpCode}`);
    if (userInDb.isVerified !== false) {
      throw new Error('User should not be verified initially');
    }
    console.log('✅ DB user state verified.');

    // 4. Test duplicate email registration
    console.log('\n[4] Testing duplicate email registration...');
    const duplicateRes = await makeRequest('/auth/register', 'POST', {
      firstName: 'Duplicate',
      lastName: 'User',
      email: testEmail,
      password: 'securePassword123',
    });
    console.log('Duplicate status:', duplicateRes.status);
    console.log('Duplicate response:', duplicateRes.data);
    if (duplicateRes.status !== 400) {
      throw new Error('Expected 400 Bad Request for duplicate email');
    }
    console.log('✅ Duplicate registration correctly rejected.');

    console.log('\n🎉 ALL REGISTRATION ENDPOINT TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('\n❌ REGISTRATION VERIFICATION FAILED! ❌');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    // 5. Cleanup database
    console.log('\n[5] Cleaning up test registration user from DB...');
    await User.deleteOne({ email: testEmail });
    console.log('Cleanup completed.');
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runRegistrationTests();
