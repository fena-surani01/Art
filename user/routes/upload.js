const express = require("express");
const router = express.Router();
const upload = require("../../admin/middleware/upload");
const imagekit = require("../../admin/config/imagekit");

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const response = await imagekit.upload({
      file: req.file.buffer, // file buffer from multer
      fileName: req.file.originalname, // original file name
      folder: "/user", // folder name in ImageKit
    });

    res.status(200).json({
      success: true,
      url: response.url,         // use this URL to display image
      fileId: response.fileId,   // save this if you want to delete later
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;