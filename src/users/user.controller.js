const User = require("../models/user");

exports.updateuser = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing or invalid." });
    }

    const {
      firstname,
      lastname,
      email,
      phoneNumber,
      gender,
      country,
      organisationName,
      organisationWebsite,
      organisationIndustry,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId, // use userId if only allowing self-update
      {
        firstname,
        lastname,
        email,
        phoneNumber,
        gender,
        country,
        organisationName,
        organisationWebsite,
        organisationIndustry,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User details updated successfully",
      updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating user details",
      error: error.message,
    });
  }
};


