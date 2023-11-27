const functions = require("../../services/functions");
const { default: axios } = require("axios");
const { google } = require("googleapis");
const fs = require("fs");
const multer = require("multer");
const VideoAi = require("../../models/VideoAi/videoai");
const FormData = require("form-data");

const createCsrfState = () => Math.random().toString(36).substring(7);
let url = "https://open-api.tiktok.com/platform/oauth/connect/";
const CLIENT_KEY = "aw7qlmvbt03zlhhu";
// res.cookie("csrfState", csrfState, { maxAge: 60000 });
exports.getTokenTikTok = async (req, res, next) => {
  try {
    const csrfState = createCsrfState();
    url += `?client_key=${CLIENT_KEY}`;
    url += "&scope=user.info.basic";
    url += "&response_type=code";
    url += `&redirect_uri=${encodeURIComponent(
      "https://hungha365.com/video-ai/"
    )}`;
    url += "&state=" + csrfState;
    res.status(200).send({
      data: {
        result: true,
        message: "done",
        url: url,
      },
    });
  } catch (err) {
    return functions.setError(res, err.message);
  }
};
