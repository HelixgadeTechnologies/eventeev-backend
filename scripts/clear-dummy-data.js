require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Event = require('../src/models/Event');
const connectDB = require('../src/config/db');

async function clearDummyData() {
  console.log('--- STARTING DATABASE DUMMY DATA CLEANUP ---');
  
  try {
    // 1. Connect to Database
    await connectDB();
    console.log('Successfully connected to MongoDB.');

    // 2. Find and delete provisional invited test users
    console.log('\n[1] Identifying invited provisional/unverified users...');
    const unverifiedInvitedUsers = await User.find({
      firstName: 'Invited',
      lastName: 'Collaborator',
      isVerified: false
    });
    
    console.log(`Found ${unverifiedInvitedUsers.length} provisional invited users in DB.`);
    
    // 3. Find and delete users with '@test.com' or test domain emails
    console.log('\n[2] Identifying test users (*@test.com)...');
    const testUsers = await User.find({
      $or: [
        { email: /@test\.com$/i },
        { email: /test/i, isVerified: false }
      ]
    });
    console.log(`Found ${testUsers.length} test users in DB.`);

    const usersToDelete = [...unverifiedInvitedUsers, ...testUsers];
    const userIdsToDelete = usersToDelete.map(u => u._id.toString());
    const uniqueUserIdsToDelete = [...new Set(userIdsToDelete)];

    if (uniqueUserIdsToDelete.length > 0) {
      console.log(`Deleting ${uniqueUserIdsToDelete.length} unique test/provisional users...`);
      const deleteUsersResult = await User.deleteMany({ _id: { $in: uniqueUserIdsToDelete } });
      console.log(`Deleted ${deleteUsersResult.deletedCount} User documents.`);
    } else {
      console.log('No test or provisional users found to delete.');
    }

    // 4. Clean up test events
    console.log('\n[3] Identifying test/integration events...');
    const testEvents = await Event.find({
      $or: [
        { title: /test/i },
        { title: /dummy/i },
        { title: /integration/i }
      ]
    });
    console.log(`Found ${testEvents.length} test/integration events.`);

    if (testEvents.length > 0) {
      const eventIdsToDelete = testEvents.map(e => e._id);
      const deleteEventsResult = await Event.deleteMany({ _id: { $in: eventIdsToDelete } });
      console.log(`Deleted ${deleteEventsResult.deletedCount} test Event documents.`);
    } else {
      console.log('No test events found to delete.');
    }

    // 5. Clean up orphaned collaborators from ALL events
    console.log('\n[4] Scanning events for orphaned collaborators or test collaborators...');
    const allEvents = await Event.find({});
    let totalCollaboratorsCleaned = 0;

    for (const event of allEvents) {
      const initialCount = event.collaborators.length;
      
      // Filter out collaborators whose users were deleted, or are in our deletion list, or are null
      event.collaborators = event.collaborators.filter(c => {
        if (!c.user) return false;
        const collabUserId = c.user.toString();
        return !uniqueUserIdsToDelete.includes(collabUserId);
      });

      const cleanedCount = initialCount - event.collaborators.length;
      if (cleanedCount > 0) {
        await event.save();
        totalCollaboratorsCleaned += cleanedCount;
        console.log(`Event "${event.title}": Removed ${cleanedCount} test/orphaned collaborator(s).`);
      }
    }
    
    console.log(`Completed collaborator cleanup. Total removed: ${totalCollaboratorsCleaned}.`);

    console.log('\n🎉 DATABASE DUMMY DATA CLEANUP COMPLETED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('\n❌ CLEANUP SCRIPT FAILED ❌');
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

clearDummyData();
