const multer = require("multer");

// Store file in memory (not disk), so we can send it to ImageKit
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

module.exports = upload;



// const storage = multer.diskStorage({
//     destination: "./uploads",
//     filename: (req, file, cb) => {
//         cb(null, file.originalname);
//     }
// });