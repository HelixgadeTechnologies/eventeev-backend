const express = require("express");
const authMiddleware = require("../middleware/auth");
const { createticket, editTicket, geteventTickets, purchaseticket, checkin, getattendeesbyticket } = require("../ticket/ticket.controller");

const router = express.Router();

router.post("/create", authMiddleware, createticket);
router.get("/gettickets/:eventId", geteventTickets)
router.put("/edit/:ticketId", authMiddleware, editTicket)
router.post("/purchaseticket", purchaseticket)
router.post("/checkin", checkin)
router.get("/:eventId/:ticketId/attendees", getattendeesbyticket)

module.exports = router;
