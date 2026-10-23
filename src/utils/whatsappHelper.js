/**
 * Utility to generate 1-click WhatsApp share links for event tickets
 */

/**
 * Builds a universal WhatsApp click-to-chat URL with pre-filled event ticket details
 * @param {Object} params
 * @param {Object} params.attendee - Attendee document or object
 * @param {Object} params.event - Event document or object
 * @param {string} [params.ticketType] - Ticket tier name (e.g. VIP, Regular)
 * @param {string} [params.customPhone] - Optional specific recipient phone number (E.164)
 * @returns {string} WhatsApp URL
 */
const buildWhatsAppTicketUrl = ({ attendee, event, ticketType = 'General Admission', customPhone = '' }) => {
  const backendUrl = process.env.BACKEND_URL || 'https://eventeevapi.onrender.com';
  const attendeeId = attendee._id || attendee.id;
  const downloadUrl = `${backendUrl}/api/attendee/ticket/${attendeeId}/download`;

  const eventDate = event?.startDate 
    ? new Date(event.startDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  const timeStr = event?.startTime || '';
  const locationStr = event?.location || (event?.type === 'virtual' ? 'Virtual Event' : 'TBD');
  const orderStr = attendee.orderId || 'N/A';
  const attendeeName = attendee.name || 'Attendee';
  const eventTitle = event?.title || 'Event';

  const messageLines = [
    `🎟️ *My Ticket for ${eventTitle}*`,
    ``,
    `👤 *Attendee:* ${attendeeName}`,
    `🎫 *Ticket:* ${ticketType}`,
    `📅 *Date:* ${eventDate}${timeStr ? ` at ${timeStr}` : ''}`,
    `📍 *Location:* ${locationStr}`,
    `🔖 *Order ID:* ${orderStr}`,
    ``,
    `👉 *View & Download PDF Ticket:*`,
    `${downloadUrl}`,
    ``,
    `_Powered by Eventeev_`
  ];

  const encodedText = encodeURIComponent(messageLines.join('\n'));

  // If a specific phone number is targeted, route directly to that number
  if (customPhone) {
    const cleanPhone = customPhone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }

  // Universal click-to-chat (opens chat selector / "Message Yourself" / contacts)
  return `https://wa.me/?text=${encodedText}`;
};

module.exports = {
  buildWhatsAppTicketUrl
};
