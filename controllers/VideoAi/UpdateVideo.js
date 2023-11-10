const functions = require("../../services/functions");
const { default: axios } = require("axios");
const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");
const multer = require("multer");
const VideoAi = require("../../models/VideoAi/videoai");

const OAuth2 = google.auth.OAuth2;
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
var TOKEN_DIR = "/Users/manhtruong/Downloads/Code/API/controllers/VideoAi";
const TOKEN_PATH = TOKEN_DIR + "/token.json";

const categoryIds = {
    Entertainment: 24,
    Education: 27,
    ScienceTechnology: 28,
};

function authorize(credentials, callback) {
    var clientSecret = credentials.web.client_secret;
    var clientId = credentials.web.client_id;
    var redirectUrl = credentials.web.redirect_uris[0];
    var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
            console.log(err);
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
    });
    console.log("Authorize this app by visiting this url: ", authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question("Enter the code from that page here: ", function (code) {
        rl.close();
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log("Error while trying to retrieve access token", err);
                return;
            }
            oauth2Client.credentials = token;
            console.log("Access token retrieved");
            storeToken(token);
            callback(oauth2Client);
        });
    });
}
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != "EEXIST") {
            throw err;
        }
    }
    console.log(JSON.stringify(token));
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) throw err;
        console.log("Token stored to " + TOKEN_PATH);
    });
}
async function getChannel(videoFilePath, auth) {
    var service = google.youtube("v3");
    service.videos.insert(
        {
            auth: auth,
            part: "snippet,status",
            requestBody: {
                snippet: {
                    title,
                    description,
                    categoryId: categoryIds.ScienceTechnology,
                    defaultLanguage: "en",
                    defaultAudioLanguage: "en",
                },
                status: {
                    privacyStatus: "public",
                },
            },
            media: {
                body: fs.createReadStream(videoFilePath),
            },
        },
        function (err, response) {
            if (err) {
                console.log("The API returned an error: " + err);
                return;
            }
            console.log(response.data);

            console.log("Video uploaded. Uploading the thumbnail now.");
            // service.thumbnails.set(
            //     {
            //         auth: auth,
            //         videoId: response.data.id,
            //         media: {
            //             body: fs.createReadStream(thumbFilePath),
            //         },
            //     },
            //     function (err, response) {
            //         if (err) {
            //             console.log("The API returned an error: " + err);
            //             return;
            //         }
            //         console.log(response.data);
            //     }
            // );
        }
    );
}
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
            const allowedTypes = ["mp4"];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error("Only video/webm format allowed!"));
            }
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = req.body.video_id;
            // cb(null, uniqueSuffix + "." + file.originalname.split(".").pop());
            cb(null, uniqueSuffix + "." + "mp4");
        },
    });
};
exports.update = multer({
    storage: storageAvatarForm(`${process.env.storage_tv365}/video/videoai`),
}).single("file");
exports.handeUpdate = (req, res, tags) => {
    try {
        const video_id = req.body.video_id;
        const video = req.file;
        fs.readFile(
            "/Users/manhtruong/Downloads/Code/API/controllers/VideoAi/ggapi.json",
            function processClientSecrets(err, content) {
                if (err) {
                    console.log("Error loading client secret file: " + err);
                    return;
                }
                // Authorize a client with the loaded credentials, then call the YouTube API.
                authorize(JSON.parse(content), (auth) =>
                    getChannel(video.path, auth)
                );
            }
        );
        res.status(200).send({
            data: [],
        });
    } catch (err) {
        return functions.setError(res, error.message);
    }
};

exports.getListBlogAll = async (req, res, next) => {
    try {
        const page = req.body.page;
        const news_id = req.body.news_id;
        const from = new FormData();
        news_id && from.append("news_id", news_id);
        page && from.append("page", page);
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
async function create(data) {
    try {
        const page = req.body.page;
        const news_id = req.body.news_id;
        const video_id = await VideoAi.find();
        const { dep_name, manager_id, dep_order } = data.body;

        const foundGateway = await VideoAi.findOne({
            com_id,
            dep_name
        })
        if (foundGateway) {
            return functions.setError(res, "Tên phòng ban đã tồn tại", 504);
        }
        let maxID = await VideoAi.findOne({}, {}, { sort: { dep_id: -1 } }).lean() || 0;
        const video = new VideoAi({
            id: Number(maxID.dep_id) + 1 || 1,
            id_blog: com_id,
            id_youtube: dep_name,
            title: manager_id,
            description: Date.parse(now),
            link_blog: dep_order || 0,
            link_youtube:,
            link_server,
            status_server:
        });

        await video.save();
        return functions.success(res, "Tạo thành công", { video });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}
