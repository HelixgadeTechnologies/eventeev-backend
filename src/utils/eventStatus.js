/**
 * Checks if an event has expired based on its endDate and endTime
 * @param {Object} event - The event object from database
 * @returns {Boolean} - True if expired, false otherwise
 */
const isEventExpired = (event) => {
  if (!event.endDate) return false;

  const now = new Date();
  const endDate = new Date(event.endDate);
  
  if (event.endTime) {
    const [hours, minutes] = event.endTime.split(':').map(Number);
    endDate.setHours(hours || 0, minutes || 0, 0, 0);
  } else {
    // If no endTime, assume end of day
    endDate.setHours(23, 59, 59, 999);
  }

  return endDate < now;
};

module.exports = { isEventExpired };
