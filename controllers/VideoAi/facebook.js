const functions = require("../../services/functions");
const { default: axios } = require("axios");
const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");
const multer = require("multer");
const VideoAi = require("../../models/VideoAi/videoai");
const FormData = require("form-data");
var TOKEN_DIR = process.env.storage_tv365 + "/video/videoai";
const TOKEN_PATH = TOKEN_DIR + "/token_fb.json";
const TOKEN_PATH_TV = TOKEN_DIR + "/token_fb_tv.json";
function storeToken(token, type, res) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != "EEXIST") {
            return null;
        }
    }
    if (type == 1) {
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return null;
            console.log("Token stored to " + TOKEN_PATH);
            res.status(200).send({
                data: {
                    message: "update thanh cong work",
                },
            });
        });
    } else if (type == 2) {
        fs.writeFile(TOKEN_PATH_TV, JSON.stringify(token), (err) => {
            if (err) return null;
            console.log("Token stored to " + TOKEN_PATH);
            res.status(200).send({
                data: {
                    message: "update thanh cong tim viec",
                },
            });
        });
    }
}
exports.getTokenFacebook = async (req, res, next) => {
    try {
        let { access_token, type } = req.body;
        console.log(access_token);
        await storeToken(access_token, type, res);
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

exports.postNewFacebook = async (req, res) => {
    try {
        const { type, content, link } = req.body;
        if (type == 1) {
            let token = await fs.readFileSync(TOKEN_PATH);
            const acc_token = JSON.parse(token);
            const data = await axios.post(
                `https://graph.facebook.com/v18.0/194709737049276/feed?access_token=${acc_token}&message=${content}&link=${link}`
            );
            res.status(200).send({
                data: {
                    id: data.data.id,
                },
            });
        } else if (type == 2) {
            let token = await fs.readFileSync(TOKEN_PATH_TV);
            const acc_token = JSON.parse(token);
            const data = await axios.post(
                `https://graph.facebook.com/v18.0/139042436689304/feed?access_token=${acc_token}&message=${content}&link=${link}`
            );
            console.log(data);

            res.status(200).send({
                data: {
                    id: data.data.id,
                },
            });
        }
    } catch (err) {
        return functions.setError(res, err.message);
    }
};
exports.postFb = async (com_name, content, link, id) => {
    try {
        if (com_name == "work247") {
            let token = await fs.readFileSync(TOKEN_PATH);
            const acc_token = JSON.parse(token);

            await axios.post(
                `https://graph.facebook.com/v18.0/194709737049276/feed?access_token=${acc_token}&message=${content}&link=${link}`
            );
            await VideoAi.updateOne(
                { id: id },
                {
                    upload_face: true,
                }
            );
            console.log("upload success facebook work247");
        } else if (com_name == "timviec365") {
            let token = await fs.readFileSync(TOKEN_PATH_TV);
            const acc_token = JSON.parse(token);
            await axios.post(
                `https://graph.facebook.com/v18.0/139042436689304/feed?access_token=${acc_token}&message=${content}&link=${link}`
            );
            await VideoAi.updateOne(
                { id: id },
                {
                    upload_face: true,
                }
            );
            console.log("upload success facebook timviec365");
        }
    } catch (err) {
        console.error("err", err);
    }
};
