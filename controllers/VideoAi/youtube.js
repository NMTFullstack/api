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
const TOKEN_PATH_Work = TOKEN_DIR + "/token.json";
const TOKEN_PATH_TV = TOKEN_DIR + "/token_tv.json";
const tw = require("./twitter");
const fb = require("./facebook");

const categoryIds = {
    Entertainment: 24,
    Education: 27,
    ScienceTechnology: 28,
    ShortMovies: 18,
};
const credentialsObject = {
    web: {
        client_id:
            "258536247516-u2p0rq9shfq846lb8g9o4kh9i67giu76.apps.googleusercontent.com",
        project_id: "upload-406603",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
            "https://www.googleapis.com/oauth2/v1/certs",
        client_secret: "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",
        redirect_uris: [
            "https://hungha365.com/video-ai/getTokenTimViec",
            "https://hungha365.com/video-ai/getTokenWork",
        ],
    },
};

exports.getTokenYoutube = async (req, res, next) => {
    let com_name = req.body.com_name;
    let clientSecret = credentialsObject.web.client_secret;
    let clientId = credentialsObject.web.client_id;
    let redirectUrl = "";
    if (com_name == "timviec365") {
        redirectUrl = credentialsObject.web.redirect_uris[0];
    } else if (com_name == "work247") {
        redirectUrl = credentialsObject.web.redirect_uris[1];
    }
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
function getNewToken(oauth2Client, code, com_name) {
    oauth2Client.getToken(code, function (err, token) {
        if (err) {
            console.log("Error while trying to retrieve access token", err);
            return;
        }
        oauth2Client.credentials = token;
        storeToken(token, com_name);
    });
}
function storeToken(token, com_name) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != "EEXIST") {
            return null;
        }
    }
    if (com_name == "work247") {
        fs.writeFile(TOKEN_PATH_Work, JSON.stringify(token), (err) => {
            if (err) throw err;
            console.log("Token stored to " + TOKEN_PATH_Work);
        });
    } else if (com_name == "timviec365") {
        fs.writeFile(TOKEN_PATH_TV, JSON.stringify(token), (err) => {
            if (err) throw err;
            console.log("Token stored to " + TOKEN_PATH_TV);
        });
    }
}
// function authorize(credentials, callback) {
//     var clientSecret = credentials.web.client_secret;
//     var clientId = credentials.web.client_id;
//     var redirectUrl = credentials.web.redirect_uris[0];
//     var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
//     // Check if we have previously stored a token.
//     fs.readFile(TOKEN_PATH_Work, function (err, token) {
//         console.log(token);
//         oauth2Client.credentials = JSON.parse(token);
//         callback(oauth2Client);
//     });
// }
exports.uploadYoutube = async (req, res) => {
    try {
        let { id, type, com_name, title, description, link } = req.body;
        console.log(id_blog, type, com_name, title, description);

        let resp = await VideoAi.findOne({
            id_blog: id_blog,
            type: type,
            com_name: com_name,
        });
        console.log(resp);
        if (resp) {
            authorize(credentialsObject, async (auth) => {
                await getChannel(
                    // resp.link_server,
                    link,
                    auth,
                    title,
                    description,
                    id,
                    com_name
                );
            });
        } else {
            return functions.setError(res, {
                message: "Couldn't find id_blog",
            });
        }
    } catch (err) {
        return functions.setError(res, error.message);
    }
};
exports.updateTokenYoutube = async (req, res, next) => {
    try {
        const { code, com_name } = req.body;
        let clientSecret = credentialsObject.web.client_secret;
        let clientId = credentialsObject.web.client_id;
        let redirectUrl = "";
        if (com_name == "timviec365") {
            redirectUrl = credentialsObject.web.redirect_uris[0];
        } else if (com_name == "work247") {
            redirectUrl = credentialsObject.web.redirect_uris[1];
        }
        console.log(JSON.stringify(code));

        var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
        await getNewToken(oauth2Client, code, com_name);
        res.status(200).send({
            data: {
                result: true,
            },
        });
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

async function authorizeTest(credentials, com_name) {
    let clientSecret = credentials.web.client_secret;
    let clientId = credentials.web.client_id;
    let redirectUrl = null;
    if (com_name == "work247") {
        redirectUrl = credentials.web.redirect_uris[1];
        let oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
        const token = await fs.readFileSync(TOKEN_PATH_Work);
        let tokenInit = JSON.parse(token);
        oauth2Client.credentials = tokenInit;
        return oauth2Client;
    } else if (com_name == "timviec365") {
        redirectUrl = credentials.web.redirect_uris[0];
        let oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
        const token = await fs.readFileSync(TOKEN_PATH_TV);
        let tokenInit = JSON.parse(token);
        oauth2Client.credentials = tokenInit;
        return oauth2Client;
    }
}
async function getChannel(
    videoFilePath,
    auth,
    title,
    description,
    id,
    com_name
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
            }
            // console.log(response.data);
            const videoId = response.data.id;
            console.log("uploading video " + videoId);
            const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
            await VideoAi.updateOne(
                { id: id },
                {
                    link_youtube: videoLink,
                    id_youtube: videoId,
                    status_server: 1,
                    link_server: "",
                }
            );
            fs.unlink(videoFilePath, (err) => {
                if (err) return null;
            });
            let tweet_content = {
                text: `${title} Link-bai-viet: ${videoLink}`,
            };
            await tw.tweet(com_name, id, tweet_content);
            let tag = "ViecLam";
            await fb.postFb(com_name, id, title, tag, videoLink);
        }
    );
}

async function filterVideoAi(data, res, auth, index) {
    if (index < 3) {
        await getChannel(
            data[index].link_server,
            auth,
            data[index].title,
            data[index].description,
            data[index].id,
            data[index].com_name
        );
        setTimeout(() => {
            filterVideoAi(data, res, auth, index + 1);
        }, 60000);
    }
}
exports.run = async (req, res, next) => {
    try {
        let { com_name } = req.body;
        let data = await VideoAi.find({
            com_name: com_name,
            status_server: 0,
        });
        console.log(data);
        let auth = await authorizeTest(credentialsObject, com_name);
        filterVideoAi(data, res, auth, 0);
        res.status(200).send({
            message: "ok",
        });
    } catch (err) {
        return functions.setError(res, err.message);
    }
};
