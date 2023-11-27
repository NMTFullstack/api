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
const TOKEN_PATH_TV = TOKEN_DIR + "/token_tv.json";

// type = 1 work247 , 2: timviec

const categoryIds = {
  Entertainment: 24,
  Education: 27,
  ScienceTechnology: 28,
};
const credentialsObject = {
  web: {
    client_id:
      "107099070730-flcu1l4632rjdpr0relqlv0j33qd5nd5.apps.googleusercontent.com",
    project_id: "update-youtube-405003",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_secret: "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",
    redirect_uris: [
      "http://localhost:3000/getToken",
      "http://localhost:3000/getTokenWork",
    ],
    javascript_origins: [
      "http://localhost",
      "http://localhost:5000",
      "https://update--405003.firebaseapp.com",
    ],
  },
};

exports.getTokenYoutube = async (req, res, next) => {
  let type = req.body.type;
  let clientSecret = credentialsObject.web.client_secret;
  let clientId = credentialsObject.web.client_id;
  let redirectUrl = "";
  if (type == 2) {
    redirectUrl = credentialsObject.web.redirect_uris[0];
  } else if (type == 1) {
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
function getNewToken(oauth2Client, code, type) {
  oauth2Client.getToken(code, function (err, token) {
    if (err) {
      console.log("Error while trying to retrieve access token", err);
      return;
    }
    oauth2Client.credentials = token;
    storeToken(token, type);
  });
}
function storeToken(token, type) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != "EEXIST") {
      return null;
    }
  }
  console.log(JSON.stringify(token));
  console.log(type);
  if (type == 2) {
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) throw err;
      console.log("Token stored to " + TOKEN_PATH);
    });
  } else if (type == 1) {
    fs.writeFile(TOKEN_PATH_TV, JSON.stringify(token), (err) => {
      if (err) throw err;
      console.log("Token stored to " + TOKEN_PATH_TV);
    });
  }
}
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

exports.uploadYoutube = async (req, res) => {
  try {
    let { id_blog, type, com_name, title, description } = req.body;
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
          resp.link_server,
          auth,
          title,
          description,
          resp.id,
          res
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
    const { code, type } = req.body;
    let clientSecret = credentialsObject.web.client_secret;
    let clientId = credentialsObject.web.client_id;
    let redirectUrl = "";
    if (type == 2) {
      redirectUrl = credentialsObject.web.redirect_uris[0];
    } else if (type == 1) {
      redirectUrl = credentialsObject.web.redirect_uris[1];
    }
    console.log(JSON.stringify(code));

    var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    await getNewToken(oauth2Client, code, type);
    res.status(200).send({
      data: {
        result: true,
      },
    });
  } catch (err) {
    return functions.setError(res, err.message);
  }
};
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
      console.log(response.data);
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
      if (com_name == "work247") {
        await tweet(1, id, tweet_content);
      } else if (com_name == "timviec365") {
        await tweet(2, id, tweet_content);
      }
    }
  );
}

async function filterVideoAi(data, index) {
  if (index < data.length) {
    await authorize(credentialsObject, async (auth) => {
      await getChannel(
        data[index].link_server,
        auth,
        data[index].title,
        data[index].description,
        data[index].id,
        data[index].com_name
      );
    });
    // setTimeout(() => {
    //   filterVideoAi(data, index + 1);
    // }, 10000);
  }
}
exports.run = async (req, res, next) => {
  try {
    let { com_name } = req.body;
    let data = await VideoAi.find({
      com_name: com_name,
      status_server: 0,
    });
    await filterVideoAi(data, 0);
    res.status(200).send({
      data: data,
    });
  } catch (err) {
    return functions.setError(res, err.message);
  }
};
