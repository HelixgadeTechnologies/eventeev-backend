const User = require("../models/user");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAIKEY,
});

exports.updateuser = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is missing or invalid." });
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

    await updatedUser.save();

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

// exports.testingopenai = async (req, res) => {
//   try {
//     const { body } = req.body;
//     const response = await openai.responses.create({
//       model: "gpt-4.1",
//       input: body,
//     });
//     res.status(200).json({
//       message: "Testing OpenAI",
//       response,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error testing OpenAI",
//       error: error.message,
//     });
//     console.log(error.message);
//   }
// };

// const apicache = {};

// exports.apicaching = async (req, res) => {
//   try {
//     const { url } = req.body;
//     if (apicache[url]) {
//       console.log(`Returning cached data for this url: ${url}`);
//       return res.status(200).json({
//         message: "Returning cached data",
//         response: apicache[url],
//       });
//     } else {
//       console.log(`Fetching data from this url: ${url}`);
//     }

//     const response = await fetch(url);
//     const data = await response.json();

//     // Save to cache for next time
//     apicache[url] = data;

//     res.status(200).json({
//       message: "Data fetched",
//       response: data,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error fetching data",
//       error: error.message,
//     });
//   }
// };
