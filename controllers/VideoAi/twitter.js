const { TwitterApi } = require("twitter-api-v2");
const functions = require("../../services/functions");
const VideoAi = require("../../models/VideoAi/videoai");

const twitterConfig = {
  API_KEY: "UAfpQ4iU3d2bPOrIWcHieKnWK",
  API_SECRET: "MOhxnWDFZ4gS19yIOWP8dSi7CpepOnQMJFZEq4uPVb6hyrpOXO",
  Client_ID: "LXEyV1V6XzRDb2twbHpVQzNnQkE6MTpjaQ",
  Client_Secret: "1-LmJmf0yRk1qxPW1Xt98R3iMro_sFpbyMWOdQVcENwYXotPUH",
  ACCESS_TOKEN: "1717449062855892992-wv5pD4VwDemUToZFIhTETAOwmMvtdd",
  ACCESS_SECRET: "TKlfcR5fZq7clIMq9OrEu6XwpBA4ET1d4sNtX3qgwwpJt",
  Bearer_Token:
    "AAAAAAAAAAAAAAAAAAAAAKzLrAEAAAAA66oOaEoO40oJA%2B6Wf3dfs7J9qAs%3DrAEid36H85sOeCJb7HjB9Zocw5IYroM1YbF7Ndzdflx9SGNGdd",
};
const twitterConfigTimViec = {
  API_KEY: "pEDhVzPUvq5QnY2vBa5UCuYGI",
  API_SECRET: "8QXG78JrhEC70YULm11PIfJ2ejuCbhRh8VYvULTapjfP7vRTx6",
  Client_ID: "UmkyMkJ6MHV1Z1JDQVJsOHZ1QV86MTpjaQ",
  Client_Secret: "uedoQo8S7489JztJPQRPFfTCvuaIFNVrbM7ISIy8yL9bN9NFYs",
  ACCESS_TOKEN: "998377215447347201-Esa0Kzb9XSeyKKtUeObpX4BXnc5FEt6",
  ACCESS_SECRET: "X5LaoTajKhaM1NCTIDUGph8qNEfmsqcB5slxxiLbA25pJ",
  Bearer_Token:
    "AAAAAAAAAAAAAAAAAAAAAEXsrAEAAAAA1xZCb9y11KjyeJYeh2i5waS84Z8%3D5V5yTfN4CfLgDG7DuHarLtd2nFmz9sYyirC5vpkjGQTzmb95m4",
};

const client = new TwitterApi({
  appKey: twitterConfig.API_KEY,
  appSecret: twitterConfig.API_SECRET,
  accessToken: twitterConfig.ACCESS_TOKEN,
  accessSecret: twitterConfig.ACCESS_SECRET,
});
const clientTV = new TwitterApi({
  appKey: twitterConfigTimViec.API_KEY,
  appSecret: twitterConfigTimViec.API_SECRET,
  accessToken: twitterConfigTimViec.ACCESS_TOKEN,
  accessSecret: twitterConfigTimViec.ACCESS_SECRET,
});
const twitterClient = client.readWrite;
const twitterClientTv = clientTV.readWrite;

exports.tweet = async (type, id, content) => {
  try {
    if (type == 1) {
      await twitterClient.v2.tweet(content);
    } else if (type == 2) {
      await twitterClientTv.v2.tweet(content);
    }
    await VideoAi.updateOne(
      { id: id },
      {
        upload_twitter: true,
      }
    );
  } catch (err) {
    return null;
  }
};

// exports.twitter_tweet = async (req, res) => {
//   try {
//     const content = req.body.content;
//     const type = req.body.type;

//     if (type == 1) {
//       await twitterClient.v2.tweet(content);
//       return functions.success(res, {
//         message: " Work OK",
//       });
//     } else if (type == 2) {
//       await twitterClientTv.v2.tweet(content);
//       return functions.success(res, {
//         message: "tv OK",
//       });
//     }
//   } catch (err) {
//     return functions.setError(res, err.message);
//   }
// };

// exports.twitter_v2_self_owned = async (req, res) => {
//   try {
//     const oauthVerifier = req.query.oauth_verifier;
//     fs.writeFile(TOKEN_PATH, JSON.stringify(oauthVerifier), (err) => {
//       if (err) return functions.setError(res, error.message);
//       console.log("Token stored to " + TOKEN_PATH);
//       res.status(200).send({
//         data: {
//           result: true,
//           data: oauthVerifier,
//         },
//       });
//     });
//   } catch (err) {
//     return functions.setError(res, error.message);
//   }
// };
