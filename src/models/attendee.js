const mongoose = require("mongoose");

const attendeeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    dateregistered: { type: Date, default: Date.now },
    ischeckedin: { type: Boolean, default: false },
    ticketCode: { type: String, unique: true }, // Unique ticket ID
    qrCode: { type: String }, // QR code URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendee", attendeeSchema);
