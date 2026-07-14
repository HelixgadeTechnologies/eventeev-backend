const mongoose = require('mongoose');
const Event = require('./src/models/Event');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    try {
      const event = new Event({
        owner: new mongoose.Types.ObjectId(),
        title: 'Test Event',
        description: 'Test Description',
        category: 'Tech',
        type: 'virtual',
        startDate: new Date(),
        endDate: new Date(),
        startTime: '10:00',
        endTime: '12:00',
        location: 'Online'
      });
      await event.save();
      console.log('Event saved successfully');
    } catch (err) {
      console.error('Error saving event:', err);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('DB Connection Error:', err);
    process.exit(1);
  });
