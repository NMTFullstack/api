const functions = require("../../services/functions");
const { default: axios } = require("axios");
const fs = require("fs");
const multer = require("multer");
const VideoAi = require("../../models/VideoAi/videoai");
const FormData = require("form-data");

// type = 1 work247 , 2: timviec

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
            const allowedTypes = ["video/webm"];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error("Only video/webm format allowed!"));
            }
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = req.body.id_blog || Date.now();
            // cb(null, uniqueSuffix + "." + file.originalname.split(".").pop());
            cb(null, uniqueSuffix + "." + "webm");
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
        const type = req.body.type;
        const com_name = req.body.com_name;
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
                link_server: video.path,
                com_name: com_name,
                type: type,
            };

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

exports.editVideo = async (req, res) => {
    try {
        let { id_blog, link_youtube, id_youtube, id, title, des } = req.body;
        await VideoAi.updateOne(
            { id: id },
            {
                link_youtube: link_youtube,
                id_youtube: id_youtube,
                status_server: 1,
                id_blog: id_blog,
                title: title,
                des: des,
            }
        );
        return functions.success(res, {
            message: "update thành công",
        });
    } catch (err) {
        return functions.setError(res, err.message);
    }
};
exports.deleteVideo = async (req, res) => {
    try {
        let id_blog = req.body.id_blog;
        let type = req.body.type;
        let com_name = req.body.com_name;
        // let videoFilePath = await VideoAi.findOne({
        //     id_blog: id_blog,
        //     type: type,
        //     com_name: com_name,
        // });
        // const newPath = videoFilePath.link_youtube.replace(
        //     "https://api.timviec365.vn",
        //     "../storage/base365"
        // );
        await VideoAi.deleteOne({
            id_blog: id_blog,
            type: type,
            com_name: com_name,
        });
        return functions.success(res, {
            message: "Xoá thành công",
        });
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
    status_server,
    type,
    com_name,
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
            status_server: status_server,
            type: type,
            com_name: com_name,
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

        news_id && from.append("newId", news_id);
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

exports.listAllFilter = async (req, res) => {
    try {
        let id_blog = req.body.id_blog;
        let type = req.body.type;
        let com_name = req.body.com_name;
        let resp;
        if (id_blog) {
            resp = await VideoAi.findOne({
                id_blog: id_blog,
                type: type,
                com_name: com_name,
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
        return functions.setError(res, err.message);
    }
};

exports.callAi = async (req, res, next) => {
    try {
        const { image, company_id } = req.body;
        const data = await axios.post(
            "http://43.239.223.11:1900/verify_multi_no_direct",
            [
                {
                    company_id: String(company_id),
                    image: image,
                },
            ]
        );
        if (data) {
            res.status(200).send({
                data: data.data,
            });
        }
    } catch (err) {
        return functions.setError(res, err.message);
    }
};
