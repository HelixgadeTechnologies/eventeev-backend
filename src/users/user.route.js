const express = require("express");
const authMiddleware = require("../middleware/auth");
const {updateuser} = require("../users/user.controller")
const router = express.Router();


router.put("/updateuser/:id", authMiddleware, updateuser)
// router.post("/testingopenai", testingopenai)
// router.post("/caching", apicaching)

module.exports = router;