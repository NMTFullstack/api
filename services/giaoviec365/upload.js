const multer = require('multer');
const fc = require('../functions')
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const folder = req.params.folder
        if (!fs.existsSync(`../storage/base365/giaoviec365/${folder}`)) { // Nếu thư mục chưa tồn tại thì tạo mới
            fs.mkdirSync(`../storage/base365/giaoviec365/${folder}`, { recursive: true });
        }
        callback(null, `../storage/base365/giaoviec365/${folder}`);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = fc.getTimeNow() + '_' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + '_' + file.originalname)
    }
})

const upload = multer({ storage: storage });

module.exports = upload