const Attendee = require('../models/Attendee');
const mongoose = require('mongoose');

/**
 * Verify that an attendee is checked in for the given event.
 * Organiser/User callers are always allowed (pass req.user, not req.attendee).
 *
 * @param {string|null} attendeeId - from req.attendee.id / socket.attendee.id
 * @param {string|mongoose.Types.ObjectId} eventId - the event the room belongs to
 * @returns {Promise<{allowed: boolean, reason: string|null, attendee: object|null}>}
 */
async function assertAttendeeCheckedIn(attendeeId, eventId) {
  if (!attendeeId || !mongoose.Types.ObjectId.isValid(attendeeId)) {
    return { allowed: false, reason: 'Invalid attendee identity', attendee: null };
  }

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return { allowed: false, reason: 'Valid event ID is required', attendee: null };
  }

  const eventObjectId = new mongoose.Types.ObjectId(eventId);

  const attendee = await Attendee.findOne({
    _id: attendeeId,
    eventId: { $in: [eventId, eventObjectId] },
    status: { $ne: 'cancelled' }
  }).select('isCheckedIn status name eventId checkInTime');

  if (!attendee) {
    return { allowed: false, reason: 'You are not registered for this event', attendee: null };
  }

  if (!attendee.isCheckedIn) {
    return {
      allowed: false,
      reason: 'You must be checked in to participate in the event chat',
      attendee
    };
  }

  return { allowed: true, reason: null, attendee };
}

module.exports = { assertAttendeeCheckedIn };
