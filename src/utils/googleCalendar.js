const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.FRONTEND_URL || 'http://localhost:3000' // Redirect URI must match what's in Google Console
);

/**
 * Add an event to Google Calendar
 * @param {Object} user - User object with refresh token
 * @param {Object} eventData - Event data (title, description, start, end, location)
 */
exports.addEventToGoogleCalendar = async (user, eventData) => {
  if (!user.googleRefreshToken) {
    console.log(`[Google Calendar] User ${user.email} does not have a Google Refresh Token. Skipping sync.`);
    return null;
  }

  try {
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const googleEvent = {
      summary: eventData.title,
      location: eventData.location,
      description: eventData.description,
      start: {
        dateTime: new Date(eventData.startDate).toISOString(),
        timeZone: user.tZone || 'Africa/Lagos',
      },
      end: {
        dateTime: new Date(eventData.endDate || new Date(eventData.startDate).getTime() + 3600000).toISOString(),
        timeZone: user.tZone || 'Africa/Lagos',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: googleEvent,
    });

    console.log(`[Google Calendar] Event created: ${response.data.htmlLink}`);
    return response.data;
  } catch (error) {
    console.error('[Google Calendar] Error adding event:', error);
    // If token is invalid/revoked, we might want to clear it
    if (error.response && (error.response.status === 401 || error.response.status === 400)) {
       console.warn(`[Google Calendar] Token for ${user.email} is invalid. Consider clearing refresh token.`);
    }
    return null;
  }
};
