const cron = require('node-cron');
const Event = require('../models/Event');

/**
 * Task to move events from 'Published' to 'Completed' status
 * runs every hour on the hour
 */
const startEventStatusTask = () => {
  console.log('[Task] Initializing Event Status Maintenance Task (Hourly)');
  
  cron.schedule('0 * * * *', async () => {
    console.log('[Task] Checking for expired events...');
    try {
      const now = new Date();
      
      // Find all events that are Published and have passed their end date
      const result = await Event.updateMany(
        { 
          status: 'Published', 
          endDate: { $lt: now } 
        },
        { 
          $set: { status: 'Completed' } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`[Task] Successfully moved ${result.modifiedCount} events to 'Completed'.`);
      } else {
        console.log('[Task] No expired events found.');
      }
    } catch (error) {
      console.error('[Task] Error updating event statuses:', error.message);
    }
  });
};

module.exports = startEventStatusTask;
