const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      // Track the user who created the ticket
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    type: {
      type: String,
      enum: ["paid", "free", "donation"],
      required: true,
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true }, // Total tickets available
    remainingQuantity: { type: Number, required: true }, // Tickets left
    price: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
