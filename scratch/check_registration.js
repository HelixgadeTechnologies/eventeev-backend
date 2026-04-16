require('dotenv').config();
const mongoose = require('mongoose');
const Attendee = require('../src/models/Attendee');

const checkAttendee = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const email = 'alphadude4all@gmail.com';
        const attendee = await Attendee.findOne({ email }).sort({ createdAt: -1 });
        
        if (attendee) {
            console.log('Attendee found:', attendee);
        } else {
            console.log('Attendee not found with email:', email);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkAttendee();
