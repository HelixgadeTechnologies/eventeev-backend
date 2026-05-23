require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const connectDB = require('../src/config/db');

// Helper to make API requests to localhost:5000
const BASE_URL = 'http://localhost:5000/api';

async function makeRequest(path, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['x-auth-token'] = token;
  }
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

async function runTests() {
  console.log('--- STARTING ACCOUNT TEAMMATE INTEGRATION TESTS ---');
  
  // 1. Connect DB
  await connectDB();

  // Create unique test users
  const uniqueId = Date.now();
  const emailA = `owner_${uniqueId}@test.com`;
  const emailB = `teammate_${uniqueId}@test.com`;
  const emailC = `provisional_teammate_${uniqueId}@test.com`;

  console.log(`Test users: Owner A (${emailA}), Teammate B (${emailB}), Invited Teammate C (${emailC})`);

  try {
    // 2. Register Owner A via API
    console.log('\n[1] Registering Owner A...');
    const regResA = await makeRequest('/auth/register', 'POST', {
      firstName: 'Owner',
      lastName: 'A',
      email: emailA,
      password: 'password123',
    });
    
    if (regResA.status !== 201) {
      throw new Error(`Failed to register Owner A: ${JSON.stringify(regResA.data)}`);
    }
    console.log('Owner A registered successfully.');

    // 3. Register Teammate B via API
    console.log('\n[2] Registering Teammate B...');
    const regResB = await makeRequest('/auth/register', 'POST', {
      firstName: 'Teammate',
      lastName: 'B',
      email: emailB,
      password: 'password123',
    });
    if (regResB.status !== 201) {
      throw new Error(`Failed to register Teammate B: ${JSON.stringify(regResB.data)}`);
    }
    console.log('Teammate B registered successfully.');

    // 4. Bypass OTP via direct Mongoose updates
    console.log('\n[3] Bypassing OTP verification in DB...');
    await User.updateMany({ email: { $in: [emailA, emailB] } }, { $set: { isVerified: true } });
    console.log('Owner A and Teammate B successfully verified in DB.');

    // 5. Login Owner A and Teammate B via API to retrieve JWTs
    console.log('\n[4] Logging in Owner A...');
    const loginResA = await makeRequest('/auth/login', 'POST', {
      email: emailA,
      password: 'password123',
    });
    if (loginResA.status !== 200) {
      throw new Error(`Owner A login failed: ${JSON.stringify(loginResA.data)}`);
    }
    const tokenA = loginResA.data.token;
    console.log('Owner A logged in. Token acquired.');

    // Get Teammate B's user ID from db
    const userB = await User.findOne({ email: emailB });
    const userBId = userB._id.toString();

    // 6. Get Teammates list (should only contain Owner A)
    console.log('\n[5] Fetching teammates list (should only contain Owner)...');
    const getTeammatesRes1 = await makeRequest('/user/teammates', 'GET', null, tokenA);
    console.log('Teammates list:', getTeammatesRes1.data);
    if (getTeammatesRes1.status !== 200 || getTeammatesRes1.data.length !== 1) {
      throw new Error('Teammates list should contain exactly the Owner initially');
    }
    if (getTeammatesRes1.data[0].role !== 'Owner') {
      throw new Error('First element in teammates list must be the Owner');
    }

    // 7. Owner A invites Teammate B (existing user) as Coordinator
    console.log('\n[6] Inviting existing user Teammate B as Coordinator...');
    const inviteResB = await makeRequest('/user/teammates', 'POST', {
      email: emailB,
      role: 'Coordinator'
    }, tokenA);
    console.log('Invite response:', inviteResB.data);
    if (inviteResB.status !== 200) {
      throw new Error(`Failed to invite teammate: ${JSON.stringify(inviteResB.data)}`);
    }

    // 8. Fetch and verify Teammate B is in teammates list with Active status
    console.log('\n[7] Verifying Teammate B added as Coordinator (Active)...');
    const getTeammatesRes2 = await makeRequest('/user/teammates', 'GET', null, tokenA);
    console.log('Teammates list:', getTeammatesRes2.data);
    const addedB = getTeammatesRes2.data.find(t => t.user && t.user.email === emailB);
    if (!addedB || addedB.role !== 'Coordinator' || addedB.status !== 'Active') {
      throw new Error('Teammate B was not successfully added as active Coordinator');
    }
    console.log('✅ Teammate B verified as Active Coordinator.');

    // 9. Testing self-invite restriction
    console.log('\n[8] Testing self-invite restriction (Owner A inviting emailA)...');
    const selfRes = await makeRequest('/user/teammates', 'POST', {
      email: emailA,
      role: 'Organizer'
    }, tokenA);
    console.log(`Status returned for self-invite: ${selfRes.status}, message: ${JSON.stringify(selfRes.data)}`);
    if (selfRes.status !== 400) {
      throw new Error('Owner A should not be allowed to invite themselves (expected 400 Bad Request)');
    }
    console.log('✅ Self-invite restriction working perfectly.');

    // 10. Invite non-existent user C (Provisional)
    console.log('\n[9] Inviting non-existent email C as Staff (Pending)...');
    const inviteResC = await makeRequest('/user/teammates', 'POST', {
      email: emailC,
      role: 'Staff'
    }, tokenA);
    console.log('Invite response:', inviteResC.data);
    if (inviteResC.status !== 201) {
      throw new Error(`Provisional invite failed: ${JSON.stringify(inviteResC.data)}`);
    }
    console.log('✅ Provisional invite flow working successfully.');

    // 11. Fetch and verify Teammate C is in teammates list with Pending status
    console.log('\n[10] Verifying Teammate C in teammates list as Pending...');
    const getTeammatesRes3 = await makeRequest('/user/teammates', 'GET', null, tokenA);
    console.log('Teammates list:', getTeammatesRes3.data);
    const addedC = getTeammatesRes3.data.find(t => t.user && t.user.email === emailC);
    if (!addedC || addedC.role !== 'Staff' || addedC.status !== 'Pending') {
      throw new Error('Teammate C was not successfully added as pending Staff');
    }
    console.log('✅ Teammate C verified as Pending Staff.');

    // 12. Remove Teammate B from workspace
    console.log('\n[11] Removing Teammate B from workspace...');
    const removeRes = await makeRequest(`/user/teammates/${userBId}`, 'DELETE', null, tokenA);
    console.log('Remove response:', removeRes.data);
    if (removeRes.status !== 200) {
      throw new Error(`Failed to remove teammate: ${JSON.stringify(removeRes.data)}`);
    }

    // 13. Verify Teammate B is removed
    console.log('\n[12] Verifying Teammate B is removed...');
    const getTeammatesRes4 = await makeRequest('/user/teammates', 'GET', null, tokenA);
    const deletedB = getTeammatesRes4.data.find(t => t.user && t.user.email === emailB);
    if (deletedB) {
      throw new Error('Teammate B was not successfully removed from the workspace');
    }
    console.log('✅ Teammate B verified as successfully removed.');

    console.log('\n🎉 ALL ACCOUNT TEAMMATE INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('\n❌ INTEGRATION TESTS FAILED! ❌');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    // 14. Cleanup all test data from database
    console.log('\n[13] Cleaning up test data from DB...');
    // Delete test users and any provisional users created
    await User.deleteMany({ email: { $in: [emailA, emailB, emailC] } });
    console.log('DB Cleanup completed.');
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runTests();
