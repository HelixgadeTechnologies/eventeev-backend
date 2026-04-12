const cron = require('node-cron');
const Event = require('../models/Event');

/**
 * Task to move events from 'Published' to 'Completed' status
 * runs every 5 minutes
 */
const startEventStatusTask = () => {
  console.log('[Task] Initializing Event Status Maintenance Task (Every 5 Minutes)');
  
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Task] Checking for expired events...');
    try {
      const now = new Date();
      
      // Fetch all Published events that MIGHT have expired
      // We check endDate <= now (comparing date parts)
      const events = await Event.find({ status: 'Published' });
      
      let updatedCount = 0;

      for (const event of events) {
        let isExpired = false;
        const endDate = new Date(event.endDate);
        
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':').map(Number);
          endDate.setHours(hours || 0, minutes || 0, 0, 0);
        } else {
          // If no endTime, assume end of day
          endDate.setHours(23, 59, 59, 999);
        }

        if (endDate < now) {
          isExpired = true;
        }

        if (isExpired) {
          event.status = 'Completed';
          await event.save();
          updatedCount++;
        }
      }
      
      if (updatedCount > 0) {
        console.log(`[Task] Successfully moved ${updatedCount} events to 'Completed'.`);
      } else {
        console.log('[Task] No expired events found.');
      }
    } catch (error) {
      console.error('[Task] Error updating event statuses:', error.message);
    }
  });
};

module.exports = startEventStatusTask;

