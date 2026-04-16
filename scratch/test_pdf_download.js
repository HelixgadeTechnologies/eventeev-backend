require('dotenv').config();
const { generateTicketPDF } = require('../src/utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

const testPDFGen = async () => {
  console.log('Generating dummy ticket PDF...');
  
  const dummyData = {
    attendee: {
      _id: '60d21b4667d0d8992e610c8a',
      name: 'Godfrey',
      orderId: 'REG-8842-1234'
    },
    event: {
      title: 'Eventeev Mega Summit 2026',
      startDate: new Date('2026-06-25T09:00:00Z'),
      startTime: '09:00 AM',
      location: 'Main Exhibition Hall, Lagos'
    },
    ticketType: 'Premium Access'
  };

  try {
    const pdfBuffer = await generateTicketPDF(dummyData);
    
    const safeName = dummyData.attendee.name.replace(/[^a-z0-9]/gi, '_');
    const filename = `${safeName}-Ticket-${dummyData.attendee.orderId}.pdf`;
    const artifactsDir = path.join(__dirname, '..', 'artifacts');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
    const outputPath = path.join(artifactsDir, filename);

    
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`SUCCESS: PDF generated correctly at ${outputPath}`);
    console.log(`Filename: ${filename}`);
  } catch (error) {
    console.error('FAILED: Error generating PDF:', error);
  }
};

testPDFGen();
