const { google } = require('googleapis');

/**
 * Resolve OAuth2 redirect URI matching Google Console configuration.
 * For client-side code flow (@react-oauth/google), 'postmessage' is standard.
 */
const getRedirectUri = () => {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI.trim();
  }
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL.split(',')[0].trim();
  }
  return 'postmessage';
};

/**
 * Creates an isolated OAuth2 client per request to prevent token race conditions.
 */
const createOAuth2Client = (refreshToken) => {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );

  if (refreshToken) {
    client.setCredentials({ refresh_token: refreshToken });
  }

  return client;
};

/**
 * Parse time string into { hours: number, minutes: number }
 * Supports 24-hour ("14:30", "09:00:00") and 12-hour ("2:30 PM", "10:00 AM") formats.
 */
function parseTimeString(timeStr, defaultHours = 9, defaultMinutes = 0) {
  if (!timeStr || typeof timeStr !== 'string') {
    return { hours: defaultHours, minutes: defaultMinutes };
  }

  const trimmed = timeStr.trim();
  // 12-hour format: "02:30 PM", "2:30PM", "9:00 am"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridian = match12[3].toUpperCase();
    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  }

  // 24-hour format: "14:30", "09:00:00", "9:30"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return { hours, minutes };
  }

  return { hours: defaultHours, minutes: defaultMinutes };
}

/**
 * Extracts year, month, day components from a Date or date string.
 */
function extractDateParts(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return { year, month, day };
}

/**
 * Formats dateParts and timeObj into "YYYY-MM-DDTHH:mm:00" without timezone offset,
 * which Google Calendar correctly interprets in combination with `timeZone`.
 */
function formatDateTime(dateParts, timeObj) {
  const hours = String(timeObj.hours).padStart(2, '0');
  const minutes = String(timeObj.minutes).padStart(2, '0');
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}T${hours}:${minutes}:00`;
}

/**
 * Add an event to Google Calendar
 * @param {Object} user - User object with refresh token
 * @param {Object} eventData - Event data (title, description, start, end, location, website)
 */
exports.addEventToGoogleCalendar = async (user, eventData) => {
  if (!user || !user.googleRefreshToken) {
    console.log(`[Google Calendar] User ${user ? user.email : 'unknown'} does not have a Google Refresh Token. Skipping sync.`);
    return null;
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('[Google Calendar] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Skipping sync.');
    return null;
  }

  if (!eventData || !eventData.title) {
    console.warn('[Google Calendar] Event data missing or untitled. Skipping sync.');
    return null;
  }

  try {
    const oauth2Client = createOAuth2Client(user.googleRefreshToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const userTimeZone = user.tZone || 'Africa/Lagos';

    // 1. Build and validate start date & time
    const startDateParts = extractDateParts(eventData.startDate);
    if (!startDateParts) {
      console.error('[Google Calendar] Invalid or missing startDate');
      return null;
    }

    const startTimeObj = parseTimeString(eventData.startTime, 9, 0);
    const startDateTimeStr = formatDateTime(startDateParts, startTimeObj);

    // 2. Build and validate end date & time
    const endDateParts = extractDateParts(eventData.endDate) || startDateParts;
    // Default end time to 1 hour after start if not specified
    const defaultEndHours = (startTimeObj.hours + 1) % 24;
    const endTimeObj = parseTimeString(eventData.endTime, defaultEndHours, startTimeObj.minutes);
    let endDateTimeStr = formatDateTime(endDateParts, endTimeObj);

    // 3. Prevent start >= end rejection (Google 400 Bad Request)
    const startTimestamp = new Date(`${startDateTimeStr}Z`).getTime();
    const endTimestamp = new Date(`${endDateTimeStr}Z`).getTime();

    if (endTimestamp <= startTimestamp) {
      // Auto-extend end time by 1 hour
      const adjustedEndDate = new Date(startTimestamp + 60 * 60 * 1000);
      const adjYear = adjustedEndDate.getUTCFullYear();
      const adjMonth = String(adjustedEndDate.getUTCMonth() + 1).padStart(2, '0');
      const adjDay = String(adjustedEndDate.getUTCDate()).padStart(2, '0');
      const adjHours = String(adjustedEndDate.getUTCHours()).padStart(2, '0');
      const adjMinutes = String(adjustedEndDate.getUTCMinutes()).padStart(2, '0');
      endDateTimeStr = `${adjYear}-${adjMonth}-${adjDay}T${adjHours}:${adjMinutes}:00`;
    }

    // 4. Format location and description
    let location = eventData.location;
    if (!location || location.trim() === '') {
      location = eventData.type === 'virtual' ? (eventData.website || 'Online Event') : 'TBD';
    }

    let description = eventData.description || '';
    if (eventData.website && !description.includes(eventData.website)) {
      description += `\n\nEvent Link: ${eventData.website}`;
    }

    const googleEvent = {
      summary: eventData.title,
      location,
      description,
      start: {
        dateTime: startDateTimeStr,
        timeZone: userTimeZone,
      },
      end: {
        dateTime: endDateTimeStr,
        timeZone: userTimeZone,
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

    console.log(`[Google Calendar] Event successfully created: ${response.data.htmlLink}`);
    return response.data;
  } catch (error) {
    const errorDetails = error.response?.data?.error || error.response?.data || error.message;
    console.error('[Google Calendar] Error adding event:', errorDetails);

    // Only clear token if Google explicitly reported an unauthorized/invalid grant error
    const isAuthError =
      error.response?.status === 401 ||
      (error.response?.data && (
        error.response.data.error === 'invalid_grant' ||
        error.response.data.error === 'unauthorized_client'
      ));

    if (isAuthError) {
      console.warn(`[Google Calendar] Refresh token for ${user.email} is invalid/revoked.`);
      if (user && typeof user.save === 'function') {
        try {
          user.googleRefreshToken = undefined;
          await user.save();
          console.log(`[Google Calendar] Cleared invalid refresh token for ${user.email}`);
        } catch (saveErr) {
          console.error('[Google Calendar] Failed to clear user refresh token:', saveErr.message);
        }
      }
    }
    return null;
  }
};
