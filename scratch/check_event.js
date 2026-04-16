require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../src/models/Event');

const checkEvent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const eventId = '69de2bca0f1f85acfbe4fc2e';
        const event = await Event.findById(eventId);
        console.log('Event found:', event);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkEvent();
