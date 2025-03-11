const express = require("express");
const upload = require("../../config/multer");
const {
  publishevent,
  draftevent,
  getpublishedevents,
  getdraftedevents,
  getcompletedevents
} = require("../event/event.controller");
const authMiddleware = require("../middleware/auth");


const router = express.Router();

router.post(
  "/publishevent",
  authMiddleware,
  upload.single("thumbnail"),
  publishevent
);
router.post(
  "/draftevent",
  authMiddleware,
  upload.single("thumbnail"),
  draftevent
);
router.get("/published", authMiddleware, getpublishedevents);
router.get("/drafts", authMiddleware, getdraftedevents);
router.get("/completed", authMiddleware, getcompletedevents)

module.exports = router;
