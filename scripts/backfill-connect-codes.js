const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('../src/models/Event');

dotenv.config({ path: __dirname + '/../.env' });

const backfillConnectCodes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Find all events where connectCode is missing, null, or empty
    const events = await Event.find({
      $or: [
        { connectCode: { $exists: false } },
        { connectCode: null },
        { connectCode: '' }
      ]
    });

    console.log(`Found ${events.length} events needing connectCode generation.`);

    for (let event of events) {
      // The pre-save hook we updated will handle connectCode generation 
      await event.save();
      console.log(`✅ Generated connectCode "${event.connectCode}" for event: ${event.title}`);
    }

    console.log('🎉 Connect Code backfill completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  }
};

backfillConnectCodes();
