const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  verifyuser,
  organisationdetails,
  forgotpassword,
  resetpassword
} = require("../auth/auth.controller");

router.post("/register", signup);
router.get("/verify/:token", verifyuser);
router.put("/organisation/:userId", organisationdetails);
router.post("/login", login);
router.post("/forgotpassword", forgotpassword)
router.post("/resetpassword/:token", resetpassword);

module.exports = router;
