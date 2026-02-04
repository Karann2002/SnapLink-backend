const multer = require("multer");

const storage = multer.memoryStorage(); // Use memory, not disk

const upload = multer({ storage });

module.exports = upload;