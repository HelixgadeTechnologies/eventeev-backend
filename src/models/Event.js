const mongoose = require('mongoose');

/**
 * @openapi
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         type:
 *           type: string
 *           enum: [virtual, hybrid, in person]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         location:
 *           type: string
 *         bannerImage:
 *           type: string
 *         thumbnailImage:
 *           type: string
 *         website:
 *           type: string
 *         facebookUrl:
 *           type: string
 *         instagramUrl:
 *           type: string
 *         xUrl:
 *           type: string
 *         recurrentEvent:
 *           type: boolean
 *         status:
 *           type: string
 *           enum: [Draft, Published, Completed]
 *         owner:
 *           type: string
 *           description: ID of the user who owns the event
 *       example:
 *         id: 60d21b4667d0d8992e610c8a
 *         title: Annual Tech Summit 2026
 *         description: A large-scale event for technology enthusiasts
 *         category: Conference
 *         type: physical
 *         startDate: 2026-05-15T10:00:00Z
 *         status: Published
 */
const slugify = require('../utils/slugify');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  connectCode: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
  },
  type: {
    type: String,
    enum: ['virtual', 'hybrid', 'in person'],
    required: [true, 'Please add an event type'],
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date'],
  },
  startTime: {
    type: String,
    required: [true, 'Please add a start time'],
  },
  endTime: {
    type: String,
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
  },
  bannerImage: {
    type: String,
  },
  thumbnailImage: {
    type: String,
  },
  website: {
    type: String,
  },
  facebookUrl: {
    type: String,
  },
  instagramUrl: {
    type: String,
  },
  xUrl: {
    type: String,
  },
  recurrentEvent: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Completed'],
    default: 'Draft',
    index: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  collaborators: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['manager', 'monitor'],
        required: true
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Helper to generate connect code
function generateConnectCodePrefix(title) {
  // Take first 4 alphanumeric characters, uppercase them. Pad with 'X' if less than 4.
  const clean = title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = (clean + 'XXXX').slice(0, 4);
  return prefix;
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create event slug and connect code from the title
EventSchema.pre('save', async function (next) {
  try {
    // Generate slug if title is modified OR slug is missing
    if (this.isModified('title') || !this.slug) {
      let generatedSlug = slugify(this.title);
      let slugExists = await this.constructor.findOne({ slug: generatedSlug });
      let counter = 1;
      
      while (slugExists && slugExists._id.toString() !== this._id.toString()) {
        generatedSlug = `${slugify(this.title)}-${counter}`;
        slugExists = await this.constructor.findOne({ slug: generatedSlug });
        counter++;
      }
      this.slug = generatedSlug;
    }

    // Generate connect code if missing
    if (!this.connectCode) {
      const prefix = generateConnectCodePrefix(this.title);
      let newConnectCode = '';
      let codeExists = true;

      while (codeExists) {
        newConnectCode = `${prefix}-${generateRandomString(4)}`;
        const existingEvent = await this.constructor.findOne({ connectCode: newConnectCode });
        if (!existingEvent) {
          codeExists = false;
        }
      }
      this.connectCode = newConnectCode;
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Event', EventSchema);
