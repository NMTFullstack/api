const functions = require("../../services/functions");
const { default: axios } = require("axios");
const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");
const multer = require("multer");
const VideoAi = require("../../models/VideoAi/videoai");
const FormData = require("form-data");
const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytesResumable } = require("firebase/storage");

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

const firebaseConfig = {
    type: "service_account",
    project_id: "auto-upload-video-b0e84",
    private_key_id: "131ef332a2b9550460305626288d766f12f3043f",
    private_key:
        "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7ecfDX+1fW/KQ\n+dSPzdxXhhSQAdDC7BEL7hCnJDahPLD1VCNC2rnMXNWknkbxkJN1lBN4NNSvfheG\nux7TsBIEtLxt+N/BGCUM0OX1zBh6VIHYtHw+Njc6oBeAZe5sG4m5SLQOhw/ZQ1xH\nU77TvueRDTrXyETTUop6MPpjasb28RmujLkInZsFWqwdW3VjM0XG2gXG8VVl60jX\nfO5Rh/T6w6+f0eCyTxM/Iy8sjf909yDYeKEK5wha8HsnYFpLU0ErgkzCeMQUwJ+G\n4m5fyHPParhp25YUEtYQNfPdYATmyT0PBY4vH29VF/biTwJsEE7CKeXlf5e1psuP\nx1wsVbJzAgMBAAECggEAGToMhLW7yJZ5esNOCau3IpqK2cs6FCs/1U3Liod3nRVV\nmoLKhox4GTpvZR9chyo1LXUndDK9C9WjxMrDyH3AxEattFPw3ULVJCGtT/iOsqdR\nxvSXuKdYTIM4+7C7ocBy39kbTCPQdiPM9FbIhCWuyKNHGmd7G2nX8xP0HWdDg/w3\njpYZ/iGsdm1wDnXoR2ud8lMeKlMRbegsbgU281CchMeclyM6GU63Sv544O+B+bCr\nXgU1wJdZHdVJ+LkKTx9sHG7i6/M5D5QdZoIRop4YNBshM1RQL00Bn3t8Poo2TDhg\naVP6h+ibe7aHsinUygahuP8szcoCPkorGgS4O9NcAQKBgQDvmERq3cQC8iHZl16n\n9ZAx/paT6hzaR8qedRFtDrIbljrsVmqz7bFoKInQWFbG6AYuOBk7ziynZonZNaQS\nyBS5mZH/yEr2HkI0xxCFVHZITIylNO5pDR+EnrobPrCPVSfJkhfaA4RXYSOr78tq\nXTvsbV4A40TE4VPhx0Gno67ZwQKBgQDIT/HR4Fnd+Ysno+1vJCNFE2YwNua371MR\n76X2D0q+1sBN95WV/ldcd0YKY+FdSUi9j2cawPQn1FJHbjQGQAAyYgLl8AOzt2hx\nQM2SNQ270eKkoV/z3rNZcPLMBTkcg4C59d9s6pECTp9F+Qy4YaNZ53cdh6T0L2L5\ndCYdLaqRMwKBgQCtM1XCKy5XMtJliZdTs6DZg0E3DDZvVRaUFezS+ZyndKKD1rSr\n/VgSA7wccL/KalCNeOBE63Y8TVO5QZ2qNhlFUk7IqPIHmTgjDwRSXgxjl3LUur7e\nEi6GoHfI2jioZNauUH4NjB1PTVmMIXzbFysKbsVVvvUnnfwVawV7OkhcAQKBgQCN\n6xYI/EqvWf2dOCcgdxoF9piP0FXmO0k/i+qpSmxKiRv2IVN50ZlTia217s3cqe8/\nXjpOWiahkWw573osc2uwRoCHKGV3DpqQorkCvVPdnfZVbX/t5/ppg/yBT7IG4aRy\nHCEPqaDTYaC2kpzQhVyWdceOxGu6FViqJABc693MwQKBgE0lhaegA8s5tvKNQMFE\nSwPAodcTk3RYnV+J+DV/QaQQNyme+TBpxMR/It4eWbYdh+IgjCHni/1JaqSxU3+c\n7DMJppdAJEfZBD6oFprKsPQ4Olk1I0ocJTa1SXagrglfFjg4Mlr4wXNRaRpTOU2t\nNm01hRUjV8csFlSxTqJ+0ZC2\n-----END PRIVATE KEY-----\n",
    client_email:
        "firebase-adminsdk-hncyf@auto-upload-video-b0e84.iam.gserviceaccount.com",
    client_id: "102076085306212388939",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
        "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-hncyf%40auto-upload-video-b0e84.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
    storageBucket: "",
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const storageRef = ref(storage, "mp4");

exports.uploadStore = async (req, res, next) => {
    const file = req.file;

    const uploadTask = uploadBytesResumable(storageRef, file);
    console.log(storageRef);
    uploadTask.on(
        "state_changed",
        (snapshot) => {
            const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
            switch (snapshot.state) {
                case "paused":
                    console.log("Upload is paused");
                    break;
                case "running":
                    console.log("Upload is running");
                    break;
            }
        },
        (error) => {
            console.log(error);
            // Handle unsuccessful uploads
        },
        () => {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                console.log("File available at", downloadURL);
            });
        }
    );
    res.status(200).send({
        data: [],
    });
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
            const videoId = response.data.id;
            const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
            await VideoAi.updateOne(
                { id_blog: id_blog },
                {
                    link_youtube: videoLink,
                    id_youtube: videoId,
                }
            );
            fs.unlink(videoFilePath, (err) => {
                if (err) throw err;
            });
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
            formDestination = `${destination}/`;
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

exports.updateVideo = async (req, res) => {
    try {
        const video = req.file;
        const description = req.body.des;
        const title = req.body.title;
        const link_blog = req.body.link_blog;
        const id_blog = Number(req.body.id_blog);
        const newPath = video.path.replace(
            "../storage/base365",
            "https://api.timviec365.vn"
        );
        if (video) {
            const videoInfo = {
                id_blog: id_blog,
                title: title,
                description: description,
                link_blog: link_blog,
                link_youtube: newPath,
            };
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
            // Create a new entry in the VideoAi model
            const video_create = await create(videoInfo);
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
// async function unloadYoutube() {
//     authorize(credentialsObject, async (auth) => {
//         await getChannel(
//             video.path,
//             auth,
//             link_blog,
//             id_blog,
//             title,
//             description,
//             res
//         );
//     });
// }
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
        const id = req.body.id;
        const type = req.body.type;
        const from = new FormData();
        page && from.append("page", page);
        let resp;
        // type = 1 : blog; type = 2 : tuyendung; type = 3 : ung viec
        if (type == 1) {
            id && from.append("news_id", id);
            resp = await axios.post(
                "https://work247.vn/api/list_news_ai.php",
                from
            );
        } else if (type == 2) {
            id && from.append("new_id", id);
            resp = await axios.post(
                "https://work247.vn/api/thongtin_text_ttd.php",
                from
            );
        } else if (type == 3) {
            id && from.append("use_id", id);
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
        const pageSize = req.body.pageSize;
        const news_id = req.body.news_id;
        const type = req.body.type;
        const from = new FormData();
        console.log(type);
        news_id && from.append("news_id", news_id);
        page && from.append("page", page);
        pageSize && from.append("pageSize", pageSize);
        let resp;
        // type = 1 : blog; type = 2 : tuyendung; type = 3 : ung viec
        if (type == 1) {
            resp = await axios.post(
                "http://210.245.108.202:8001/api/timviec/blog/listNewsAI",
                from
            );
        } else if (type == 2) {
            resp = await axios.post(
                "http://210.245.108.202:8001/api/timviec/new/listNewsAI",
                from
            );
        } else if (type == 3) {
            resp = await axios.post(
                "https://work247.vn/api/list_news_ai.php",
                from
            );
        }
        if (resp.data.data.result) {
            res.status(200).send({
                data: resp.data.data,
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
        res.status(200).send({
            data: {
                result: true,
            },
        });
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
