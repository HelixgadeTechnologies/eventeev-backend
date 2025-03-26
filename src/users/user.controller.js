const User = require("../models/user");

exports.updateuser = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is missing or invalid." });
    }
    const { id } = req.params;
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

    // Find user by ID and update
    const updatedUser = await User.findByIdAndUpdate(id, {
      firstname,
      lastname,
      email,
      phoneNumber,
      gender,
      country,
      organisationName,
      organisationWebsite,
      organisationIndustry,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User details updated successfully",
      updatedUser
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating user details",
      error: error.message,
    });
  }
};
