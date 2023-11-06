const functions = require("../../services/functions");
const { default: axios } = require("axios");
const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");
const multer = require("multer");

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const TOKEN_PATH = "token.json";

// Xác thực và lấy token
function authenticateAndUploadVideo(videoPath, title, description, callback) {
    const credentials = require("./path-to-your-credentials.json");
    const oauth2Client = new google.auth.OAuth2(
        credentials.installed.client_id,
        credentials.installed.client_secret,
        credentials.installed.redirect_uris[0]
    );

    // Đọc hoặc tạo file token cho xác thực
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            uploadVideo(oauth2Client, videoPath, title, description, callback);
        }
    });
}

// Xác thực người dùng và lấy token mới nếu cần
function getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
    });

    console.log("Authorize this app by visiting this url:", authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question("Enter the code from that page here: ", (code) => {
        rl.close();
        oauth2Client.getToken(code, (err, token) => {
            if (err)
                return console.error(
                    "Error while trying to retrieve access token",
                    err
                );

            oauth2Client.credentials = token;
            storeToken(token);
            uploadVideo(oauth2Client, videoPath, title, description, callback);
        });
    });
}

// Lưu token vào file
function storeToken(token) {
    try {
        fs.mkdirSync("tokens");
    } catch (err) {
        if (err.code !== "EEXIST") {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
    });
}

// Tải lên video lên YouTube
function uploadVideo(oauth2Client, videoPath, title, description, callback) {
    const youtube = google.youtube({
        version: "v3",
        auth: oauth2Client,
    });

    const videoMetadata = {
        snippet: {
            title: title,
            description: description,
        },
        status: {
            privacyStatus: "public", // Có thể sử dụng 'public' hoặc 'private'
        },
    };

    const media = {
        body: fs.createReadStream(videoPath),
    };

    youtube.videos.insert(
        {
            part: "snippet,status",
            media: media,
            resource: videoMetadata,
        },
        (err, data) => {
            if (err) {
                console.error("Error uploading video:", err);
                return callback(err, null);
            }

            console.log("Video uploaded to YouTube:", data.data.snippet.title);
            callback(null, data.data);
        }
    );
}

// Sử dụng hàm để tải lên video
const videoPath = "path-to-your-video.mp4";
const title = "Your Video Title";
const description = "Your video description";
const storageAvatarForm = (destination) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            let formDestination = " ";
            const d = new Date(),
                day = d.getDate() < 10 ? "0" + d.getDate() : d.getDate(),
                month =
                    Number(d.getMonth() + 1) < 10
                        ? "0" + Number(d.getMonth() + 1)
                        : Number(d.getMonth() + 1),
                year = d.getFullYear();
            formDestination = `${destination}/${year}/${month}/${day}`;
            if (!fs.existsSync(formDestination)) {
                console.log("add new");
                fs.mkdirSync(formDestination, { recursive: true });
            }
            cb(null, formDestination);
        },
        fileFilter: function (req, file, cb) {
            const allowedTypes = ["video/webm"];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error("Only video/webm format allowed!"));
            }
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = req.body.video_id;
            cb(null, uniqueSuffix + "." + file.originalname.split(".").pop());
        },
    });
};
exports.update = multer({
    storage: storageAvatarForm(`${process.env.storage_tv365}/video/videoai`),
}).single("file");

exports.handeUpdate = async (req, res) => {
    try {
        const video_id = req.body.video_id;
        const video = req.file;
        console.log(video);
        if (video && video_id) {
            // authenticateAndUploadVideo(
            //     videoPath,
            //     title,
            //     description,
            //     (err, response) => {
            //         if (err) {
            //             console.error("Error:", err);
            //         } else {
            //             console.log("Video uploaded:", response);
            //         }
            //     }
            // );
            res.status(200).send({
                data: [],
            });
        }
    } catch (error) {
        return functions.setError(res, error.message);
    }
};

exports.getBlog = async (req, res, next) => {
    try {
        const page = req.body.page;
        const news_id = req.body.news_id;

        const from = new FormData();
        from.append("news_id", news_id);
        from.append("page", page);
        const resp = await axios.post(
            "https://work247.vn/api/list_news_ai.php",
            from
        );
        const audioUrl = resp.data.news[0].news_audio[0];

        const audio = await axios.get(audioUrl);
        console.log(audio.data);
        const newData = resp.data.news[0];
        newData.news_audio = audio.data;
        if (resp.data.result) {
            res.status(200).send({
                data: newData,
            });
        }
    } catch (error) {
        return functions.setError(res, error.message);
    }
};
exports.getListBlogAll = async (req, res, next) => {
    try {
        const page = req.body.page;
        const news_id = req.body.news_id;

        const from = new FormData();
        from.append("news_id", news_id);
        from.append("page", page);
        const resp = await axios.post(
            "https://work247.vn/api/list_news_ai.php",
            from
        );
        if (resp.data.result) {
            res.status(200).send({
                data: resp.data,
            });
        }
    } catch (error) {
        return functions.setError(res, error.message);
    }
};
