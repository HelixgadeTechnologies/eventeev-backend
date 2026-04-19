const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generates a professional PDF ticket for an event attendee
 * @param {Object} data - Attendee and Event details
 * @returns {Promise<Buffer>} - The generated PDF as a buffer
 */
const generateTicketPDF = async (data) => {
  const { attendee, event, ticketType } = data;
  
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Ticket - ${event.title}`,
          Author: 'Eventeev',
        }
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#FF6B00';
      const secondaryColor = '#101828';
      const textColor = '#1D2939';
      const mutedColor = '#667085';

      // --- Header / Border ---
      doc
        .rect(0, 0, doc.page.width, 150)
        .fill(secondaryColor);

      // Logo Text (as placeholder for actual logo image)
      doc
        .fillColor('white')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('event', 50, 60, { continued: true })
        .fillColor(primaryColor)
        .text('eev');

      doc
        .fillColor('white')
        .fontSize(12)
        .font('Helvetica')
        .text('OFFICIAL E-TICKET', 50, 95, { characterSpacing: 2 });

      // --- Ticket Body ---
      doc.y = 200;

      // Event Title
      doc
        .fillColor(secondaryColor)
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(event.title, 50, 200);

      doc.moveDown(0.5);

      // Date & Time
      const eventDate = new Date(event.startDate).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc
        .fillColor(textColor)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('DATE AND TIME');
      
      doc
        .font('Helvetica')
        .text(`${eventDate} at ${event.startTime || 'TBD'}`);

      doc.moveDown(1.5);

      // Venue
      doc
        .font('Helvetica-Bold')
        .text('LOCATION');
      
      doc
        .font('Helvetica')
        .text(event.location || 'Online Event');

      // --- Attendee Info (Right Side) ---
      const rightColX = 350;
      doc.y = 260;

      doc
        .font('Helvetica-Bold')
        .text('ATTENDEE', rightColX, 260);
      
      doc
        .font('Helvetica')
        .text(attendee.name);

      doc.moveDown(1.5);

      doc
        .font('Helvetica-Bold')
        .text('TICKET TYPE', rightColX);
      
      doc
        .font('Helvetica')
        .text(ticketType || 'General Admission');

      doc.moveDown(1.5);

      doc
        .font('Helvetica-Bold')
        .text('ORDER ID', rightColX);
      
      doc
        .font('Helvetica')
        .text(`#${attendee.orderId}`);

      // --- QR Code ---
      const qrData = await QRCode.toDataURL(attendee._id.toString());
      doc.image(qrData, 50, 450, { width: 150 });

      doc
        .fontSize(10)
        .fillColor(mutedColor)
        .text('SCAN FOR CHECK-IN', 50, 610, { width: 150, align: 'center' });

      // --- Footer ---
      doc
        .moveTo(50, 700)
        .lineTo(545, 700)
        .strokeColor('#EAECF0')
        .stroke();

      doc
        .y = 720;
      
      doc
        .fillColor(textColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('HELPFUL INFO', 50, 720);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(mutedColor)
        .text('Please arrive 15 minutes before the event starts. Have your ID ready along with this ticket (digital or printed) for a smooth check-in experience.', 50, 740, { width: 300 });

      doc
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('Terms & Conditions', 400, 740, {
          link: 'https://eventeev.com/terms',
          underline: true
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateTicketPDF };
