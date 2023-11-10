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
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  const rl = readline.createInterface({
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
      // cb(null, uniqueSuffix + "." + file.originalname.split(".").pop());
      cb(null, uniqueSuffix + "." + ".webm");
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
    const description = req.body.des;
    const title = req.body.title;
    const link_blog = req.body.link_blog;
    const link_youtube = req.body.link_blog;
    const link_server = req.body.link_blog;
    const id_blog = Number(req.body.id_blog);
    const id_youtube = 123;
    const video_create = await create({
      id_blog,
      id_youtube,
      title,
      description,
      link_blog,
      link_youtube,
      link_server,
    });
    if (video_create) {
      functions.success(res, "Tạo thành công", { video_create });
    } else {
      return functions.setError(res, "That bai");
    }
    // if (video) {
    //   await fs.readFile(
    //     "/Users/manhtruong/Downloads/Code/API/controllers/VideoAi/ggapi.json",
    //     function processClientSecrets(err, content) {
    //       if (err) {
    //         return functions.setError(
    //           res,
    //           "Error loading client secret file: " + err
    //         );
    //       }
    //       // Authorize a client with the loaded credentials, then call the YouTube API.
    //       authorize(JSON.parse(content), (auth) => {
    //         getChannel(video.path, auth);
    //         res.status(200).send({
    //           data: [],
    //         });
    //       });
    //     }
    //   );
    // }
  } catch (err) {
    return functions.setError(res, error.message);
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

exports.getTokenYoutube = async (req, res, next) => {
  fs.readFile(
    `${TOKEN_DIR}/ggapi.json`,
    function processClientSecrets(err, content) {
      if (err) {
        return functions.setError(
          res,
          "Error loading client secret file: " + err
        );
      }
      const credentials = JSON.parse(content);
      var clientSecret = credentials.web.client_secret;
      var clientId = credentials.web.client_id;
      var redirectUrl = credentials.web.redirect_uris[0];
      var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
      });
      res.status(200).send({
        data: [
          {
            url: authUrl,
          },
        ],
      });
    }
  );
};
