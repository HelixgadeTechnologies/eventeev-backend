const express = require("express");
// const upload = require("../../config/multer");
const {
  publishevent,
  draftevent,
  publishDraftedEvent,
  getpublishedevents,
  getdraftedevents,
  getcompletedevents,
  editevent,
  deleteEvent,
} = require("../event/event.controller");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/publishevent", authMiddleware, publishevent);
router.post("/draftevent", authMiddleware, draftevent);
router.post("/drafttolive/:id", authMiddleware, publishDraftedEvent);
router.get("/published", authMiddleware, getpublishedevents);
router.get("/drafts", authMiddleware, getdraftedevents);
router.get("/completed", authMiddleware, getcompletedevents);
router.put("/editevent/:id", authMiddleware, editevent);
router.delete("/deleteevent/:id", authMiddleware, deleteEvent);

module.exports = router;
