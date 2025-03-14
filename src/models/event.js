const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    thumbnail: { type: String },
    type: {
      type: String,
      enum: ["virtual", "hybrid", "inPerson"],
      required: true,
    },
    location: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "conference",
        "infoSession",
        "watchParty",
        "workshop",
        "speakerSession",
        "hackathon",
      ],
      required: true,
    },
    website: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
    status: {
      type: String,
      enum: ["published", "draft"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
