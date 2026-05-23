require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Event = require('../src/models/Event');
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
  console.log('--- STARTING EVENT COLLABORATOR INTEGRATION TESTS ---');
  
  // 1. Connect DB
  await connectDB();

  // Create unique test users
  const uniqueId = Date.now();
  const emailA = `user_a_${uniqueId}@test.com`;
  const emailB = `user_b_${uniqueId}@test.com`;
  const emailC = `user_c_invite_${uniqueId}@test.com`;
  let event;
  let eventId;

  console.log(`Test users: User A (${emailA}), User B (${emailB}), User C (${emailC})`);

  try {
    // 2. Register User A via API
    console.log('\n[1] Registering User A...');
    const regResA = await makeRequest('/auth/register', 'POST', {
      firstName: 'User',
      lastName: 'A',
      email: emailA,
      password: 'password123',
    });
    
    if (regResA.status !== 201) {
      throw new Error(`Failed to register User A: ${JSON.stringify(regResA.data)}`);
    }
    console.log('User A registered successfully.');

    // 3. Register User B via API
    console.log('\n[2] Registering User B...');
    const regResB = await makeRequest('/auth/register', 'POST', {
      firstName: 'User',
      lastName: 'B',
      email: emailB,
      password: 'password123',
    });
    if (regResB.status !== 201) {
      throw new Error(`Failed to register User B: ${JSON.stringify(regResB.data)}`);
    }
    console.log('User B registered successfully.');

    // 4. Bypass OTP via direct Mongoose updates (so we don't have to send real emails or enter OTP manually)
    console.log('\n[3] Bypassing OTP verification in DB...');
    await User.updateMany({ email: { $in: [emailA, emailB] } }, { $set: { isVerified: true } });
    console.log('User A and User B successfully verified in DB.');

    // 5. Login User A and User B via API to retrieve JWTs
    console.log('\n[4] Logging in User A...');
    const loginResA = await makeRequest('/auth/login', 'POST', {
      email: emailA,
      password: 'password123',
    });
    if (loginResA.status !== 200) {
      throw new Error(`User A login failed: ${JSON.stringify(loginResA.data)}`);
    }
    const tokenA = loginResA.data.token;
    console.log('User A logged in. Token acquired.');

    console.log('Logging in User B...');
    const loginResB = await makeRequest('/auth/login', 'POST', {
      email: emailB,
      password: 'password123',
    });
    if (loginResB.status !== 200) {
      throw new Error(`User B login failed: ${JSON.stringify(loginResB.data)}`);
    }
    const tokenB = loginResB.data.token;
    console.log('User B logged in. Token acquired.');

    // Get User B's user ID from db
    const userB = await User.findOne({ email: emailB });
    const userBId = userB._id.toString();

    // 6. User A creates an Event
    console.log('\n[5] User A creating an Event...');
    const createEventRes = await makeRequest('/event/publish', 'POST', {
      title: `Integration Test Event ${uniqueId}`,
      description: 'A test event created during integration tests',
      category: 'Technology',
      type: 'virtual',
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      startTime: '10:00 AM',
      location: 'Zoom',
    }, tokenA);
    if (createEventRes.status !== 201) {
      throw new Error(`Event creation failed: ${JSON.stringify(createEventRes.data)}`);
    }
    event = createEventRes.data;
    eventId = event._id;
    console.log(`Event created: "${event.title}" (ID: ${eventId})`);

    // 7. Get Collaborators list (should be empty)
    console.log('\n[6] Fetching collaborators (should be empty)...');
    const getCollabsRes1 = await makeRequest(`/event/${eventId}/collaborators`, 'GET', null, tokenA);
    console.log('Collaborators list:', getCollabsRes1.data);
    if (getCollabsRes1.status !== 200 || getCollabsRes1.data.length !== 0) {
      throw new Error('Collaborators list should be empty initially');
    }

    // 8. User A adds User B as a Monitor
    console.log('\n[7] Adding User B as Monitor...');
    const addCollabRes = await makeRequest(`/event/${eventId}/collaborators`, 'POST', {
      email: emailB,
      role: 'monitor'
    }, tokenA);
    console.log('Add response:', addCollabRes.data);
    if (addCollabRes.status !== 200) {
      throw new Error(`Failed to add collaborator: ${JSON.stringify(addCollabRes.data)}`);
    }

    // 9. Fetch and verify User B is now a Monitor
    console.log('\n[8] Verifying User B was added as Monitor...');
    const getCollabsRes2 = await makeRequest(`/event/${eventId}/collaborators`, 'GET', null, tokenA);
    console.log('Collaborators list:', getCollabsRes2.data);
    const addedCollab = getCollabsRes2.data.find(c => c.user && c.user.email === emailB);
    if (!addedCollab || addedCollab.role !== 'monitor') {
      throw new Error('User B was not successfully added as a monitor');
    }
    console.log('✅ User B verified as Monitor.');

    // 10. Attempt forbidden actions by User B (Monitor role)
    console.log('\n[9] Testing authorization boundary (User B attempting to add User C)...');
    const forbiddenRes = await makeRequest(`/event/${eventId}/collaborators`, 'POST', {
      email: emailC,
      role: 'manager'
    }, tokenB);
    console.log(`Status returned for forbidden action: ${forbiddenRes.status}`);
    if (forbiddenRes.status !== 403) {
      throw new Error('User B (monitor) should not be allowed to manage collaborators (expected 403 Forbidden)');
    }
    console.log('✅ Access boundary working (403 Forbidden received).');

    // 11. User A promotes User B to Manager
    console.log('\n[10] User A promoting User B to Manager...');
    const updateRes = await makeRequest(`/event/${eventId}/collaborators/${userBId}`, 'PATCH', {
      role: 'manager'
    }, tokenA);
    console.log('Update response:', updateRes.data);
    if (updateRes.status !== 200) {
      throw new Error(`Failed to update role: ${JSON.stringify(updateRes.data)}`);
    }

    // 12. Fetch and verify role is now Manager
    console.log('\n[11] Verifying User B promoted to Manager...');
    const getCollabsRes3 = await makeRequest(`/event/${eventId}/collaborators`, 'GET', null, tokenA);
    const updatedCollab = getCollabsRes3.data.find(c => c.user && c.user.email === emailB);
    if (!updatedCollab || updatedCollab.role !== 'manager') {
      throw new Error('User B was not promoted to manager');
    }
    console.log('✅ User B verified as Manager.');

    // 13. Testing Invitation Flow for non-existent User C
    console.log('\n[12] Testing invitation onboarding flow for non-existent User C...');
    const inviteRes = await makeRequest(`/event/${eventId}/collaborators`, 'POST', {
      email: emailC,
      role: 'manager'
    }, tokenA);
    console.log('Invite response:', inviteRes.data);
    if (inviteRes.status !== 201) {
      throw new Error(`Invite onboarding flow failed: ${JSON.stringify(inviteRes.data)}`);
    }
    console.log('✅ Onboarding invitation flow successfully created unverified placeholder account and added to event.');

    // 14. User A removes User B
    console.log('\n[13] User A removing User B from collaborators...');
    const removeRes = await makeRequest(`/event/${eventId}/collaborators/${userBId}`, 'DELETE', null, tokenA);
    console.log('Remove response:', removeRes.data);
    if (removeRes.status !== 200) {
      throw new Error(`Failed to remove collaborator: ${JSON.stringify(removeRes.data)}`);
    }

    // 15. Verify User B is removed
    console.log('\n[14] Verifying User B was successfully removed...');
    const getCollabsRes4 = await makeRequest(`/event/${eventId}/collaborators`, 'GET', null, tokenA);
    const removedCollab = getCollabsRes4.data.find(c => c.user && c.user.email === emailB);
    if (removedCollab) {
      throw new Error('User B was not successfully removed from collaborators list');
    }
    console.log('✅ User B verified as successfully removed.');

    console.log('\n🎉 ALL EVENT COLLABORATOR INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('\n❌ INTEGRATION TESTS FAILED! ❌');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    // 16. Cleanup all test data from database
    console.log('\n[15] Cleaning up test data from DB...');
    await User.deleteMany({ email: { $in: [emailA, emailB, emailC] } });
    if (event && eventId) {
      await Event.deleteOne({ _id: eventId });
    }
    console.log('DB Cleanup completed.');
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runTests();
