/**
 * @desc    Handle image upload response
 * @route   POST /api/upload
 * @access  Private
 */
exports.uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // The file URL is provided by multer-storage-cloudinary in req.file.path
    res.status(200).json({
      url: req.file.path,
      public_id: req.file.filename,
    });
  } catch (error) {
    console.error('[Upload Controller] Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
