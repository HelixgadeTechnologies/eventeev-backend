const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Event = require('../src/models/Event');
const slugify = require('../src/utils/slugify');

// Load env vars from the root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const backfillSlugs = async () => {
  try {
    console.log('Connecting to MongoDB...');
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not found in .env file');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully.');

    // Find all events where slug is missing, null, or empty
    const events = await Event.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });
    
    console.log(`Found ${events.length} events needing slug generation.`);

    for (const event of events) {
      // The pre-save hook we updated will now handle slug generation 
      // if the slug is missing, even if the title hasn't changed.
      await event.save();
      console.log(`✅ Generated slug "${event.slug}" for event: ${event.title}`);
    }

    console.log('\nAll events have been processed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during backfill:', error.message);
    process.exit(1);
  }
};

backfillSlugs();
