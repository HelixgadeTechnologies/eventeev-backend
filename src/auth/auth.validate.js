const { check } = require("express-validator");

// Validation for signin
exports.validateSignin = [
  
];

// Validation for login
exports.validateLogin = [
  check("phoneNumber").isMobilePhone().withMessage("Invalid PhoneNumber."),
  check("password").notEmpty().withMessage("Password is required."),
];
