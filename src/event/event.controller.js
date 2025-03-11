const Event = require("../models/event");
const cloudinary = require("cloudinary").v2;

console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// publish a new event
exports.publishevent = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      type,
      location,
      category,
      website,
      facebook,
      instagram,
      twitter,
    } = req.body;

    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is missing or invalid." });
    }

    cloudinary.api
      .ping()
      .then((result) =>
        console.log("Cloudinary configuration is valid:", result)
      )
      .catch((error) =>
        console.error("Cloudinary configuration error:", error)
      );

    let thumbnailUrl = "";

    if (req.file) {
      try {
        const thumbnails = req.file;
        console.log("Received file:", thumbnails.originalname);

        const b64 = Buffer.from(thumbnails.buffer).toString("base64");
        const dataURI = `data:${thumbnails.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "events/thumbnails",
        });

        thumbnailUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        return res.status(500).json({
          message: "Error uploading image.",
          error: uploadError.message,
        });
      }
    }

    //Create a new event
    const newEvent = new Event({
      userId,
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      thumbnail: thumbnailUrl,
      type,
      location,
      category,
      website,
      facebook,
      instagram,
      twitter,
      status: "published",
    });

    await newEvent.save();

    res
      .status(201)
      .json({ message: "Event published successfully!", newEvent });
  } catch (error) {
    console.error("Error publishing event:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// draft an event
exports.draftevent = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      type,
      location,
      category,
      website,
      facebook,
      instagram,
      twitter,
    } = req.body;

    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is missing or invalid." });
    }

    cloudinary.api
      .ping()
      .then((result) =>
        console.log("Cloudinary configuration is valid:", result)
      )
      .catch((error) =>
        console.error("Cloudinary configuration error:", error)
      );

    let thumbnailUrl = "";

    if (req.file) {
      try {
        const thumbnails = req.file;
        console.log("Received file:", thumbnails.originalname);

        const b64 = Buffer.from(thumbnails.buffer).toString("base64");
        const dataURI = `data:${thumbnails.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "events/thumbnails",
        });

        thumbnailUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        return res.status(500).json({
          message: "Error uploading image.",
          error: uploadError.message,
        });
      }
    }

    //draft a new event
    const draftedEvent = new Event({
      userId,
      name,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      thumbnail: thumbnailUrl,
      type,
      location,
      category,
      website,
      facebook,
      instagram,
      twitter,
      status: "draft",
    });

    await draftedEvent.save();

    res
      .status(201)
      .json({ message: "Event drafted successfully!", draftedEvent });
  } catch (error) {
    console.error("Error drafting event:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get all published events by a particular user
exports.getpublishedevents = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing or invalid" });
    }

    const publishedEvents = await Event.find({ userId, status: "published" });

    if (!publishedEvents.length) {
      return res
        .status(404)
        .json({ message: "No published events found for this user" });
    }

    res.status(200).json({
      message: "Published events retrieved successfully",
      events: publishedEvents,
    });
  } catch (error) {
    console.error("Error fetching published events:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get all drafted events by a particular user
exports.getdraftedevents = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing or invalid" });
    }

    const draftedEvents = await Event.find({ userId, status: "draft" });

    if (!draftedEvents.length) {
      return res.status(404).json({ message: "No drafted events found" });
    }

    res
      .status(200)
      .json({ message: "Drafted events retrieved", events: draftedEvents });
  } catch (error) {
    console.error("Error fetching drafted events:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get all completed events by a particular user
exports.getcompletedevents = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing or invalid" });
    }

    const currentDate = new Date();

    // Find events where endDate has passed
    const completedEvents = await Event.find({
      userId,
      endDate: { $lt: currentDate },
    });

    if (!completedEvents.length) {
      return res.status(404).json({ message: "No completed events found" });
    }

    res.status(200).json({
      message: "Completed events retrieved successfully",
      events: completedEvents,
    });
  } catch (error) {
    console.error("Error fetching completed events:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
