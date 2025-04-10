const Event = require("../models/event");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper function to upload image to Cloudinary
const uploadThumbnail = async (file) => {
  const b64 = Buffer.from(file.buffer).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder: "events/thumbnails",
  });

  return result.secure_url;
};

// ========== Publish a New Event ==========
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
    if (!userId) return res.status(400).json({ message: "User ID is missing." });

    let thumbnailUrl = "";
    if (req.file) {
      thumbnailUrl = await uploadThumbnail(req.file);
    }

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

    res.status(201).json({ message: "Event published successfully!", newEvent });
  } catch (error) {
    console.error("Error publishing event:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ========== Draft an Event ==========
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
    if (!userId) return res.status(400).json({ message: "User ID is missing." });

    let thumbnailUrl = "";
    if (req.file) {
      thumbnailUrl = await uploadThumbnail(req.file);
    }

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

    res.status(201).json({ message: "Event drafted successfully!", draftedEvent });
  } catch (error) {
    console.error("Error drafting event:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ========== Get Published Events ==========
exports.getpublishedevents = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(400).json({ message: "User ID is missing." });

    const publishedEvents = await Event.find({ userId, status: "published" });
    res.status(200).json({ message: "Published events retrieved", events: publishedEvents });
  } catch (error) {
    console.error("Error fetching published events:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ========== Get Draft Events ==========
exports.getdraftedevents = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(400).json({ message: "User ID is missing." });

    const draftedEvents = await Event.find({ userId, status: "draft" });
    res.status(200).json({ message: "Drafted events retrieved", events: draftedEvents });
  } catch (error) {
    console.error("Error fetching drafted events:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ========== Get Completed Events (and Auto-Update Status) ==========
exports.getcompletedevents = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(400).json({ message: "User ID is missing." });

    const currentDate = new Date();

    const expiredEvents = await Event.find({
      userId,
      endDate: { $lt: currentDate },
      status: { $ne: "completed" },
    });

    // Update expired events to completed
    await Promise.all(
      expiredEvents.map((event) => {
        event.status = "completed";
        return event.save();
      })
    );

    const completedEvents = await Event.find({ userId, status: "completed" });

    res.status(200).json({ message: "Completed events retrieved", events: completedEvents });
  } catch (error) {
    console.error("Error fetching completed events:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ========== Move Draft to Live ==========
exports.publishDraftedEvent = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) return res.status(400).json({ message: "User ID is missing." });

    const event = await Event.findOne({ _id: id, userId, status: "draft" });
    if (!event) return res.status(404).json({ message: "Drafted event not found." });

    event.status = "published";
    await event.save();

    res.status(200).json({ message: "Event published from draft successfully.", event });
  } catch (error) {
    console.error("Error publishing drafted event:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ========== Edit Event ==========
exports.editevent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?.userId;
    if (!userId) return res.status(400).json({ message: "User ID is missing." });

    if (req.file) {
      const thumbnailUrl = await uploadThumbnail(req.file);
      updates.thumbnail = thumbnailUrl;
    }

    const updatedEvent = await Event.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
    if (!updatedEvent) return res.status(404).json({ message: "Event not found or unauthorized" });

    res.status(200).json({ message: "Event updated successfully", updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ========== Delete Event ==========
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return res.status(400).json({ message: "User ID is missing." });

    const deleted = await Event.findOneAndDelete({ _id: id, userId });
    if (!deleted) return res.status(404).json({ message: "Event not found or unauthorized" });

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
