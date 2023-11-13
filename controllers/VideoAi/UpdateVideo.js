const functions = require("../../services/functions");
const { default: axios } = require("axios");
const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");
const multer = require("multer");
const VideoAi = require("../../models/VideoAi/videoai");

const OAuth2 = google.auth.OAuth2;
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
var TOKEN_DIR = process.env.storage_tv365 + "/video/videoai";
const TOKEN_PATH = TOKEN_DIR + "/token.json";

const categoryIds = {
    Entertainment: 24,
    Education: 27,
    ScienceTechnology: 28,
};
const credentialsObject = {
    web: {
        client_id:
            "107099070730-f2p54kn1luu3kvjvv64dtpjlvell4ohm.apps.googleusercontent.com",
        project_id: "update-youtube-405003",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
            "https://www.googleapis.com/oauth2/v1/certs",
        client_secret: "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",
        redirect_uris: ["http://localhost:3000/admin/quan-ly-video/getToken"],
    },
};
function authorize(credentials, callback) {
    var clientSecret = credentials.web.client_secret;
    var clientId = credentials.web.client_id;
    var redirectUrl = credentials.web.redirect_uris[0];
    var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
        console.log(token);
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
    });
}

async function getChannel(
    videoFilePath,
    auth,
    link_blog,
    id_blog,
    title,
    description,
    res
) {
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
                    defaultLanguage: "vi",
                    defaultAudioLanguage: "vi",
                },
                status: {
                    privacyStatus: "public",
                },
            },
            media: {
                body: fs.createReadStream(videoFilePath),
            },
        },
        // function (err, response) {
        //     if (err) {
        //         console.log("The API returned an error: " + err);
        //         return;
        //     }
        //     console.log(response.data);

        //     console.log("Video uploaded. Uploading the thumbnail now.");
        //     // service.thumbnails.set(
        //     //     {
        //     //         auth: auth,
        //     //         videoId: response.data.id,
        //     //         media: {
        //     //             body: fs.createReadStream(thumbFilePath),
        //     //         },
        //     //     },
        //     //     function (err, response) {
        //     //         if (err) {
        //     //             console.log("The API returned an error: " + err);
        //     //             return;
        //     //         }
        //     //         console.log(response.data);
        //     //     }
        //     // );
        // }
        async function (err, response) {
            if (err) {
                console.log("The API returned an error: " + err);
                return functions.setError(res, "That bai" + err);
            }
            console.log(response.data);

            console.log("Video uploaded. Uploading the thumbnail now.");
            // Assuming you have the necessary information for the VideoAi model
        }
    );
}
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
            const allowedTypes = ["video/mp4"];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error("Only video/webm format allowed!"));
            }
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = req.body.title;
            // cb(null, uniqueSuffix + "." + file.originalname.split(".").pop());
            cb(null, uniqueSuffix + "." + "mp4");
        },
    });
};
exports.update = multer({
    storage: storageAvatarForm(`${process.env.storage_tv365}/video/videoai`),
}).single("file");

exports.handeUpdate = async (req, res) => {
    try {
        const video = req.file;
        const description = req.body.des;
        const title = req.body.title;
        const link_blog = req.body.link_blog;
        const id_blog = Number(req.body.id_blog);
        if (video) {
            authorize(credentialsObject, async (auth) => {
                await getChannel(
                    video.path,
                    auth,
                    link_blog,
                    id_blog,
                    title,
                    description,
                    res
                );
            });
            const videoInfo = {
                id_blog: id_blog,
                title: title,
                description: description,
                link_blog: link_blog,
                link_server: video.path,
            };

            // Create a new entry in the VideoAi model
            const video_create = await create(videoInfo);
            console.log(video_create);
            if (video_create) {
                functions.success(res, "Tạo thành công", {
                    video_create,
                });
            } else {
                return functions.setError(res, "That bai");
            }
        }
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

async function create({
    id_blog,
    id_youtube,
    title,
    description,
    link_blog,
    link_youtube,
    link_server,
}) {
    try {
        let maxID =
            (await VideoAi.findOne({}, {}, { sort: { id: -1 } }).lean()) || 0;
        const video = new VideoAi({
            id: Number(maxID.id) + 1 || 1,
            id_blog: id_blog,
            id_youtube: id_youtube,
            title: title,
            description: description,
            link_blog: link_blog,
            link_youtube: link_youtube,
            link_server: link_server,
            status_server: 1,
        });
        await video.save();
        return video;
    } catch (error) {
        return null;
    }
}
exports.getListBlogWork247 = async (req, res, next) => {
    try {
        const page = req.body.page;
        // id blog
        const news_id = req.body.news_id;
        // id ung vien
        const use_id = req.body.use_id;
        const type = req.body.type;
        const from = new FormData();
        news_id && from.append("news_id", news_id);
        use_id && from.append("use_id", use_id);
        page && from.append("page", page);
        let resp;
        // type = 1 : blog; type = 2 : tuyendung; type = 3 : ung viec
        if (type == 1) {
            resp = await axios.post(
                "https://work247.vn/api/list_news_ai.php",
                from
            );
        } else if (type == 2) {
            resp = await axios.post(
                "https://work247.vn/api/thongtin_text_ttd.php",
                from
            );
        } else if (type == 3) {
            resp = await axios.post(
                "https://work247.vn/api/thongtin_uv_audio.php",
                from
            );
        }
        if (resp.data.result) {
            res.status(200).send({
                data: resp.data,
            });
        }
    } catch (error) {
        return functions.setError(res, error.message);
    }
};
exports.getListBlogTimViec = async (req, res, next) => {
    try {
        const page = req.body.page;
        const news_id = req.body.news_id;
        const type = req.body.type;
        const from = new FormData();
        news_id && from.append("news_id", news_id);
        page && from.append("page", page);
        let resp;
        // type = 1 : blog; type = 2 : tuyendung; type = 3 : ung viec
        if (type == 1) {
            resp = await axios.post(
                "https://work247.vn/api/list_news_ai.php",
                from
            );
        } else if (type == 2) {
            resp = await axios.post(
                "https://work247.vn/api/list_news_ai.php",
                from
            );
        } else if (type == 3) {
            resp = await axios.post(
                "https://work247.vn/api/list_news_ai.php",
                from
            );
        }
        if (resp.data.result) {
            res.status(200).send({
                data: resp.data,
            });
        }
    } catch (error) {
        return functions.setError(res, error.message);
    }
};

exports.getTokenYoutube = async (req, res, next) => {
    var clientSecret = credentialsObject.web.client_secret;
    var clientId = credentialsObject.web.client_id;
    var redirectUrl = credentialsObject.web.redirect_uris[0];
    var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
    });
    res.status(200).send({
        data: {
            url: authUrl,
        },
    });
};
function getNewToken(oauth2Client, code) {
    oauth2Client.getToken(code, function (err, token) {
        if (err) {
            console.log("Error while trying to retrieve access token", err);
            return;
        }
        oauth2Client.credentials = token;
        storeToken(token);
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
exports.updateTokenYoutube = async (req, res, next) => {
    try {
        const code = req.body.token;
        var clientSecret = credentialsObject.web.client_secret;
        var clientId = credentialsObject.web.client_id;
        var redirectUrl = credentialsObject.web.redirect_uris[0];
        var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
        await getNewToken(oauth2Client, code);
    } catch (err) {
        return functions.setError(res, err.message);
    }
};
exports.listAllFilter = async (req, res) => {
    try {
        let id_blog = req.body.id_blog;
        let resp;
        if (id_blog) {
            resp = await VideoAi.findOne({
                id_blog: id_blog,
            });
        } else {
            resp = await VideoAi.find({});
        }
        console.log(resp);
        res.status(200).send({
            data: {
                result: true,
                data: resp,
            },
        });
    } catch (err) {
        return functions.setError(res, error.message);
    }
};
