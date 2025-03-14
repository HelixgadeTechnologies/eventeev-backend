const express = require("express");
const authMiddleware = require("../middleware/auth");
const { createticket, editTicket, geteventTickets } = require("../ticket/ticket.controller");

const router = express.Router();

router.post("/create", authMiddleware, createticket);
router.get("/gettickets/:eventId", geteventTickets)
router.put("/edit/:ticketId", authMiddleware, editTicket)

module.exports = router;
