const cron = require('node-cron');
const Event = require('../models/Event');

/**
 * Task to move events from 'Published' to 'Completed' status
 * runs every 5 minutes
 */
const startEventStatusTask = () => {
  console.log('[Task] Initializing Event Status Maintenance Task (Every 5 Minutes)');
  
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();

      // 1. Bulk update any Published events whose endDate was strictly before today
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const bulkRes = await Event.updateMany(
        { status: 'Published', endDate: { $lt: startOfToday } },
        { $set: { status: 'Completed' } }
      );

      // 2. For events ending today, check their specific endTime
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const candidateEvents = await Event.find({
        status: 'Published',
        endDate: { $gte: startOfToday, $lte: endOfToday }
      }).select('_id endDate endTime');

      const expiredIds = [];
      for (const event of candidateEvents) {
        const endDate = new Date(event.endDate);
        if (event.endTime) {
          const [hours, minutes] = event.endTime.split(':').map(Number);
          endDate.setHours(hours || 0, minutes || 0, 0, 0);
        } else {
          endDate.setHours(23, 59, 59, 999);
        }

        if (endDate < now) {
          expiredIds.push(event._id);
        }
      }

      let candidateUpdated = 0;
      if (expiredIds.length > 0) {
        const updateRes = await Event.updateMany(
          { _id: { $in: expiredIds } },
          { $set: { status: 'Completed' } }
        );
        candidateUpdated = updateRes.modifiedCount || 0;
      }

      const totalUpdated = (bulkRes.modifiedCount || 0) + candidateUpdated;
      if (totalUpdated > 0) {
        console.log(`[Task] Successfully moved ${totalUpdated} events to 'Completed'.`);
      }
    } catch (error) {
      console.error('[Task] Error updating event statuses:', error.message);
    }
  });
};

module.exports = startEventStatusTask;

