const cron = require('node-cron');
const CalendarEvent = require('../models/CalendarEvent');
const { createNotification } = require('../controllers/notificationController');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');

/**
 * Task to check for upcoming events and send reminders to attendees
 * Runs every hour
 */
const startReminderTask = () => {
  console.log('[Task] Initializing Event Reminder Task (Hourly)');
  
  cron.schedule('0 * * * *', async () => {
    console.log('[Task] Checking for upcoming events to send reminders...');
    try {
      const now = new Date();
      // Target window: events starting in exactly 24 hours (with 1 hour buffer)
      const tomorrowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const tomorrowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const upcomingEvents = await CalendarEvent.find({
        startDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
        isRegistrationEntry: true,
        owner: { $exists: true }
      }).populate('owner', 'email firstName');

      for (const event of upcomingEvents) {
        if (!event.owner) continue;

        // 1. Create In-App Notification
        await createNotification({
          recipient: event.owner._id,
          type: 'event',
          title: 'Event Reminder',
          message: `Your event "${event.title}" is starting in 24 hours!`,
          link: `/calendar`
        });

        // 2. Send Email Reminder
        try {
            await sendEmail({
                email: event.owner.email,
                subject: `Reminder: ${event.title} starts in 24 hours`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #eb5017; text-align: center;">Event Reminder</h2>
                    <p style="font-size: 16px; color: #333;">Hi ${event.owner.firstName},</p>
                    <p style="font-size: 16px; color: #333;">This is a reminder that the event <strong>${event.title}</strong> you registered for is starting in 24 hours.</p>
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Event:</strong> ${event.title}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(event.startDate).toDateString()}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${event.startTime}</p>
                        <p style="margin: 5px 0;"><strong>Location:</strong> ${event.location}</p>
                    </div>
                    <p style="font-size: 14px; color: #666;">We hope to see you there!</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2024 Eventeev. All rights reserved.</p>
                    </div>
                `
            });
            console.log(`[Reminder Task] Sent 24h reminder for "${event.title}" to ${event.owner.email}`);
        } catch (emailErr) {
            console.error(`[Reminder Task] Email failed for ${event.owner.email}:`, emailErr.message);
        }
      }
    } catch (error) {
      console.error('[Reminder Task] Error executing task:', error.message);
    }
  });
};

module.exports = startReminderTask;
