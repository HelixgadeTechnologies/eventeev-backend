const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    country: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    timezone:{
      type:String
    },
    organisationName: {
      type: String,
    },
    organisationWebsite: {
      type: String,
    },
    organisationIndustry: {
      type: String,
    },
    organisationszie:{
      type: String
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Users", UserSchema);
