const { check } = require("express-validator");

// Validation for signin
exports.validateSignin = [
  check("category")
    .notEmpty()
    .withMessage("Please input a category")
    .isIn(["vehicleowner", "agent"])
    .withMessage("Category must be either 'vehicleowner' or 'agent'"),
  check("firstname")
    .notEmpty()
    .withMessage("Firstname is required.")
    .isAlpha()
    .withMessage("Firstname must contain only letters."),
  check("lastname")
    .notEmpty()
    .withMessage("Lastname is required.")
    .isAlpha()
    .withMessage("Lastname must contain only letters."),
  check("email")
    .isEmail()
    .withMessage("Invalid email address.")
    .normalizeEmail(),
  check("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required.")
    .isMobilePhone()
    .withMessage("Invalid phone number."),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
];

// Validation for login
exports.validateLogin = [
  check("phoneNumber").isMobilePhone().withMessage("Invalid PhoneNumber."),
  check("password").notEmpty().withMessage("Password is required."),
];
