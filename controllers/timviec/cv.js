const functions = require("../../services/functions");
const service = require("../../services/timviec365/cv");
const serviceCandi = require('../../services/timviec365/candidate');
const CV = require("../../models/Timviec365/CV/Cv365");
const Users = require("../../models/Users");
const Application = require("../../models/Timviec365/CV/Application");
const Letter = require("../../models/Timviec365/CV/Letter");
const Resume = require("../../models/Timviec365/CV/Resume");
const SaveCvCandi = require("../../models/Timviec365/UserOnSite/Candicate/SaveCvCandi");
const CategoryCv = require("../../models/Timviec365/CV/Category");
const CVGroup = require("../../models/Timviec365/CV/CVGroup");
const Cv365Like = require("../../models/Timviec365/CV/Like");
const TblModules = require("../../models/Timviec365/CV/TblModules");
const Cv365TblFooter = require("../../models/Timviec365/CV/TblFooter");
const Cv365Blog = require("../../models/Timviec365/CV/Blog");
const Cv365CustomHtml = require("../../models/Timviec365/CV/CustomHtml");
const CategoryLangCv = require("../../models/Timviec365/CV/CVLang");
const CvHistoryPoint = require('../../models/Timviec365/CV/HistoryPoint');
const CVPreview = require("../../models/Timviec365/CV/CVPreview");
const data = require('../data')

// uuid 
const { v4: uuidv4 } = require('uuid');
// gọi api
const axios = require('axios')

const fs = require("fs");
const https = require('https');
const path = require('path');

// lấy tất cả danh sách mẫu CV
exports.getList = async(req, res, next) => {
    try {
        const request = req.body;
        let pageNumber = request.pageNumber || 1,
            pageSize = request.pageSize || 20,
            skip = (pageNumber - 1) * pageSize,
            lang = request.lang,
            cate = request.cate,
            designID = request.designID,
            sortBy = request.sortBy || "new",
            condition = {},
            sort = { vip: -1, thutu: -1 };

        if (lang != undefined) {
            condition.lang_id = lang;
        }
        if (cate != undefined) {
            condition.cate_id = cate;
        }
        if (designID != undefined) {
            condition.design_id = designID;
        }

        if (sortBy != "new") {
            sort = {
                download: -1,
            };
        }


        // Lấy data theo từng điều kiện
        let data;
        if (pageSize != "all") {
            data = await CV.find(condition).select("_id alias url_alias image view love download price cid name colors design_id")
                .sort(sort).skip(skip)
                .limit(pageSize).lean();
        } else {
            data = await CV.find(condition)
                .select("_id alias url_alias image view love download price cid name colors design_id")
                .sort(sort).lean();
        }

        // Lấy thông tin người dùng
        const user = await functions.getTokenUser(req, res);

        // Lấy danh sách cv ứng viên đã thích
        let listCvLike = [];
        if (user && user != 1) {
            listCvLike = await Cv365Like.find({
                uid: user.idTimViec365,
                type: 1
            }, "id").lean();
        }

        // Cập nhật data theo vòng lặp
        for (let i = 0; i < data.length; i++) {
            var element = data[i];
            element.image = await functions.getPictureCv(element.image);
            if (listCvLike.find(cv => cv.id == element._id)) {
                element.isLike = 1;
            } else {
                element.isLike = 0;
            }
        }

        // Lấy thông tin bài viết chân trang
        const footerNew = await Cv365TblFooter.findOne({}).select("content");

        return await functions.success(res, "Lấy mẫu CV thành công", { data, footerNew });
    } catch (err) {
        functions.setError(res, err.message);
    }
};

// lấy danh sách ngành cv
exports.getNganhCV = async(req, res, next) => {
    try {
        const data = await CategoryCv.find().select("_id name alias cId");

        return functions.success(res, "Danh sách ngành cv", { data });
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

//xem trước CV
exports.previewCV = async(req, res, next) => {
    try {
        const _id = req.body._id;
        const data = await CV.findOne({ _id: _id }).select(
            "_id lang_id name image mota_cv colors view"
        );

        if (data) {
            let view = data.view + 1; // cập nhật số lượng xem
            await CV.updateOne({ _id: _id }, { view: view });
            data.image = functions.getPictureCv(data.image);
            return await functions.success(res, "Lấy mẫu cv thành công", { data });
        }
        return functions.setError(res, "Không có dữ liệu", 404);
    } catch (e) {
        functions.setError(res, e.message);
    }
};

exports.listCvByCate = async(req, res, next) => {
    try {
        const alias = req.body.alias,
            cate_id = req.body.cate_id;
        if (alias || cate_id) {
            let condition = { alias };
            if (cate_id != null) {
                condition = { cid: Number(cate_id) };
            }

            let CateCv = await CategoryCv.findOne(condition).lean();
            if (CateCv) {
                // Lấy danh sách cv của ngành nghề đó
                const pageSize = req.body.pageSize,
                    listCv = await CV.find({
                            cate_id: CateCv._id,
                        },
                        "'_id alias url_alias image view love download price cid name colors design_id"
                    )
                    .sort({ vip: -1, _id: -1 })
                    .lean();

                // Xử lý hình ảnh cho bài viết chân trang
                if (CateCv.content != "") {
                    CateCv.content = functions.renderCDNImage(CateCv.content);
                }

                for (let i = 0; i < listCv.length; i++) {
                    const element = listCv[i];
                    element.image = await functions.getPictureCv(element.image);
                }

                return functions.success(res, "Danh sách cv theo ngành", {
                    items: CateCv,
                    listCv,
                });
            }
            return functions.setError(res, "Không tồn tại ngành cv");
        }
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

// chi tiết cv ( tạo cv)
exports.detail = async(req, res, next) => {
    try {
        const _id = req.body._id;
        const uid = req.body.uid;
        let data = await CV.findOne({ _id: _id }).lean();

        if (data) {
            // cập nhật số lượng xem
            let view = data.view + 1;
            await CV.updateOne({ _id: _id }, { view: view });

            let user = await functions.getTokenUser(req, res);
            /** Bổ sung luồng tải id ứng viên để check và lấy thông tin của ứng viên đó khi máy chủ gọi đến để lấy nội dung ảnh cv (Thanh Long làm) */
            if (uid) {
                const checkUser = await Users.findOne({ idTimViec365: uid, type: 0 }, { idTimViec365: 1 }).lean();
                if (checkUser) { user = checkUser; }
            }

            /** Nếu có thông tin ứng viên đăng nhập hoặc có id ứng viên truyền lên và ứng viên tồn tại thì tìm xem ứng viên đó đã tạo cv hay chưa */
            if (user != null) {
                const getCv = await SaveCvCandi.findOne({
                    uid: user.idTimViec365,
                    delete_cv: 0,
                    cvid: _id
                }).lean();

                if (getCv) {
                    data.item_ur = getCv;
                }

                if (data && data.status == 0) {
                    await SaveCvCandi.updateOne({
                        uid: user.idTimViec365,
                        cvid: _id
                    }, {
                        $set: {
                            status: 1,
                            delete_cv: 0
                        }
                    });
                };
            }
            return functions.success(res, "Lấy CV thành công", { data });
        } else {
            await functions.setError(res, "Không có dữ liệu", 404);
        }
    } catch (e) {
        return functions.setError(res, e.message);
    }
};

exports.like = async(req, res, next) => {
    try {
        const { type, idcv } = req.body;
        const user = req.user.data;
        if (type && idcv) {
            // Check xem có tồn tại không
            let checkItem;
            if (type == 1) {
                checkItem = await CV.findOne({
                    _id: idcv
                });
            } else if (type == 2) {
                checkItem = await Application.findOne({
                    _id: idcv
                });
            } else if (type == 3) {
                checkItem = await Letter.findOne({
                    _id: idcv
                });
            } else if (type == 4) {
                checkItem = await Resume.findOne({
                    _id: idcv
                });
            }
            // Nếu cv tồn tại và type thuộc 1,2,3,4
            if (checkItem && [1, 2, 3, 4].indexOf(Number(type)) != -1) {
                // Kiểm tra xem đã lưu cv hay chưa
                const userLike = await Cv365Like.findOne({
                    id: idcv,
                    uid: Number(user.idTimViec365),
                    type: type
                }).lean();

                // Nếu chưa like thì lưu lại vào bảng
                let result, message;
                if (!userLike) {
                    const item = new Cv365Like({
                        uid: user.idTimViec365,
                        id: idcv,
                        status: 1,
                        type: type
                    });
                    await item.save().then(() => {
                        result = "save";
                    });
                    await CV.updateOne({ _id: idcv }, { $inc: { love: 1 } });
                    message = "Lưu thành công";
                    result = true;
                } else {
                    await Cv365Like.deleteOne({
                        _id: userLike._id
                    });
                    message = "Bỏ lưu thành công";
                    result = false;
                }
                return await functions.success(res, message, { result });
            }
            return await functions.setError(res, "Không tồn tại cv hoặc tham số hợp lệ");
        }
        return await functions.setError(res, "Thiếu tham số");
    } catch (error) {
        return await functions.setError(res, error.message);
    }

}

//lưu và tải cv
exports.saveCV = async(req, res, next) => {
    try {

        const user = req.user.data;
        let pmKey = user._id,
            userId = user.idTimViec365,
            cvid = req.body.cvid,
            allowSendChat = req.body.allowSendChat,
            height_cv = req.body.height_cv,
            name_img = req.body.name_img,
            name_img_hide = req.body.name_img_hide,
            html = req.body.html,
            lang = req.body.lang;

        const storage = process.env.PORT_QLC;
        const domain = process.env.domain_tv365;
        if (cvid) {
            // Kiểm tra đã tạo cv hay chưa
            const checkSaveCv = await SaveCvCandi.findOne({
                uid: userId,
                cvid: cvid
            }).lean();
            const getTime = await Users.findOne({ _id: pmKey }, {
                createdAt: 1,
            }).lean();

            // Đường dẫn ảnh
            let dir = `${process.env.storage_tv365}/pictures/cv/${functions.convertDate(user.createdAt,true)}`;
            let dirAvatar = `${process.env.storage_tv365}/cv365/upload/ungvien/uv_${user.idTimViec365}`;
            let dirUser = `${process.env.storage_tv365}/pictures/uv/${functions.convertDate(user.createdAt,true)}`;

            // Kiểm tra xem đã tạo thư mục lưu ảnh chưa
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            if (!fs.existsSync(dirAvatar)) {
                fs.mkdirSync(dirAvatar);
            }
            if (!fs.existsSync(dirUser)) {
                fs.mkdirSync(dirUser);
            }

            let arrHtml = JSON.parse(html);
            if (arrHtml.avatar.includes("cv365/tmp")) {
                let arrUrl = arrHtml.avatar.split('/');
                let fileName = arrUrl[arrUrl.length - 1];
                let oldPath = arrHtml.avatar.replace('https://storage.timviec365.vn', process.env.storage_tv365);
                let newPath = `${dirAvatar}/${fileName}`;
                let avtUrlNew = `${process.env.PORT_QLC}cv365/upload/ungvien/uv_${user.idTimViec365}/${fileName}`;
                if (fs.existsSync(oldPath)) {

                    //Cập nhật ảnh đại diện user nếu chưa có
                    let linkAvatar = '';
                    if (!user.avatarUser) {
                        linkAvatar = `${dirUser}/${fileName}`;
                        await Users.updateOne({ _id: pmKey }, {
                            $set: {
                                avatarUser: fileName,
                            }
                        });
                    }
                    //Lưu ảnh đại diện trong CV
                    fs.rename(oldPath, newPath, function(err) {
                        if (err) throw err;
                        //Lưu ảnh đại diện user
                        if (linkAvatar) {
                            fs.copyFile(newPath, linkAvatar, (err) => {
                                if (err) throw err;
                            });
                        }
                    });
                    html = html.replace(arrHtml.avatar, avtUrlNew);
                }
            }

            const data = {
                uid: userId,
                cvid: cvid,
                html: html,
                lang: lang,
                time_edit: functions.getTimeNow(),
                height_cv: height_cv,
                cv: 1,
                status: 2,
                check_cv: 0,
                delete_cv: 0,
                delete_time: 0
            };


            // Nếu chưa tạo thì lưu vào
            if (!checkSaveCv) {
                let _id = 1;
                await SaveCvCandi.findOne({}, { id: 1 }).sort({ id: -1 }).then((res) => {
                    if (res) {
                        _id = res.id + 1;
                    }
                })
                data.id = _id;
                await SaveCvCandi.create(data);
            }
            // Nếu tạo rồi thì cập nhật đồng thời xóa cv cũ
            else {
                if (name_img && checkSaveCv.name_img != null) {
                    const filePath = `${dir}/${checkSaveCv.name_img}.png`;
                    await fs.access(filePath, fs.constants.F_OK, (error) => {
                        if (error) {} else {
                            // Tệp tin tồn tại
                            fs.unlink(filePath, (err) => {
                                if (err) throw err;
                            });
                        }
                    });
                }
                if (name_img_hide && checkSaveCv.name_img_hide != null) {
                    const filePath = `${dir}/${checkSaveCv.name_img_hide}.png`;
                    await fs.access(filePath, fs.constants.F_OK, (error) => {
                        if (error) {} else {
                            // Tệp tin tồn tại
                            fs.unlink(`${dir}/${checkSaveCv.name_img_hide}.png`, (err) => {
                                if (err) throw err;
                            });
                        }
                    });
                }
                await SaveCvCandi.updateOne({
                    _id: checkSaveCv._id
                }, {
                    $set: data
                });
            }

            //Bỏ cv đại diện cũ
            await SaveCvCandi.findOneAndUpdate({ uid: userId, cvid: 2135 }, { $set: { cv: 0 } });


            // Đường dẫn tới nơi bạn muốn lưu ảnh
            const outputPath = `${dir}/${name_img}.png`;
            const outputPathHide = `${dir}/${name_img_hide}.png`;

            //Render ảnh cv, không sử dụng ảnh gửi lên
            let linkImg = `${domain}/cv365/site/xem_cv_nodejs_no_hide/${cvid}/${userId}`,
                linkImgHide = `${domain}/cv365/site/xem_cv_nodejs_hide/${cvid}/${userId}`;
            const resImage = await functions.renderImageFromUrl(linkImg);
            const resImageHide = await functions.renderImageFromUrl(linkImgHide);
            if (!resImage.result) {
                return functions.setError(res, resImage.message, 500);
            }
            if (!resImageHide.result) {
                return functions.setError(res, resImageHide.message, 500);
            }
            let base64String = resImage.file,
                base64StringHide = resImageHide.file;

            // Giải mã chuỗi Base64 thành dữ liệu nhị phân
            const imageBuffer = Buffer.from(base64String, "base64");
            const imageBufferHide = Buffer.from(base64StringHide, "base64");

            // Ghi dữ liệu nhị phân vào tệp ảnh

            await fs.writeFile(outputPath, imageBuffer, (error) => {
                if (error) {
                    return functions.setError(res, "Lỗi khi ghi tệp ảnh");
                }
            });

            await fs.writeFile(outputPathHide, imageBufferHide, (error) => {
                if (error) {
                    return functions.setError(res, "Lỗi khi ghi tệp ảnh");
                }
            });
            let message = "Lưu";

            await SaveCvCandi.updateOne({
                uid: userId,
                cvid: cvid
            }, {
                $set: {
                    name_img: name_img,
                    name_img_hide: name_img_hide
                }
            });

            // Cập nhật phần trăm hoàn thiện hồ sơ
            const uvPercent = await serviceCandi.percentHTHS(userId);
            await Users.updateOne({ _id: pmKey }, {
                $set: {
                    "inForPerson.candidate.percents": uvPercent,
                }
            });

            //Gửi Cv qua chat
            if (allowSendChat == 1) {
                let linkViewPDF = `${domain}/cv365/site/xem_cv_nodejs/${cvid}/${userId}`;
                const resPDF = await functions.renderPdfFromUrl(linkViewPDF);

                //Lưu file pdf
                if (!resPDF.result) {
                    return functions.setError(res, "Lỗi render file pdf");
                }
                let base64PDF = resPDF.file;
                let id = await uuidv4();
                let dateNow = Math.ceil(new Date().getTime() / 1000);
                const dirPDF = `${process.env.storage_tv365}/cv365/tmp/${functions.convertDate(dateNow,true)}`;
                // Kiểm tra xem đã tạo thư mục lưu PDF chưa
                if (!fs.existsSync(dirPDF)) {
                    fs.mkdirSync(dirPDF, { recursive: true });
                }
                const outputPathPDF = `${dirPDF}/pdf_${id}.pdf`;
                // Giải mã chuỗi Base64 thành dữ liệu nhị phân
                const pdfBuffer = Buffer.from(base64PDF, "base64");

                // await fs.writeFile(outputPathPDF, pdfBuffer, (error) => {
                //     if (error) {
                //         return functions.setError(res, "Lỗi khi ghi tệp PDF");
                //     }
                // });
                fs.writeFileSync(outputPathPDF, pdfBuffer)

                const linkImg = `${storage}pictures/cv/${functions.convertDate(user.createdAt,true)}/${name_img}.png`;
                const linkPDF = `${storage}cv365/tmp/${functions.convertDate(dateNow,true)}/pdf_${id}.pdf`;

                const senderId = 1191; // ID chat của tài khoản tổng đài
                const text = "";
                let data = {
                    userId: pmKey,
                    senderId: senderId,
                    linkImg: linkImg,
                    linkPdf: linkPDF,
                    Title: text,
                };
                let response = await axios.post(
                    "http://210.245.108.202:9000/api/message/SendMessageCv", data
                );

                message += ",tải";
            }
            return functions.success(res, `${message} thành công`);
        }
        return functions.setError(res, "Thông tin truyền lên không đầy đủ", 404);
    } catch (e) {
        console.log(e);
        return functions.setError(res, e.message, 404);
    }
};

// xem CV viết sẵn
exports.viewAvailable = async(req, res, next) => {
    try {
        const cateId = req.params.cateId;
        const data = await CV.findOne({ cateId }).sort("-cvPoint").select("");
        if (!data) return await functions.setError(res, "Không có dữ liệu", 404);
        return await functions.success(res, "Thành công cv viết sẵn", data);
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

// tính điểm cv
exports.countPoints = async(req, res, next) => {
    try {
        const _id = req.query.id; // id cv
        const point = +req.query.p; // số point đc cộng
        const cv = await CV.findOne({ _id });
        if (cv) {
            const data = await CV.updateOne({ _id }, { $set: { cvPoint: cv.cvPoint + point } }).select("");
            if (data)
                return await functions.success(res, "Cập nhật điểm cv thành công");
        }
        return await functions.setError(res, "Không có dũ liệu", 404);
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

// tạo mới mẫu cv
exports.createCV = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1)
            return await functions.setError(res, "Chưa có quyền truy cập", 404);
        const data = req.body;

        let _id = 1;
        await functions.getMaxID(CV).then((res) => {
            if (res) {
                _id = res + 1;
            }
        });
        data._id = _id;
        await CV.create(data);
        return await functions.success(res, "Tạo mới cv thành công");
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

// lấy dữ liệu mẫu cv cũ
exports.findCV = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1)
            return await functions.setError(res, "Chưa có quyền truy cập");

        const _id = req.params._id;
        const data = await CV.findOne({ _id: _id });

        if (data) return functions.success(res, "Thành công", data);

        return functions.setError(res, "Không có dữ liêu", 404);
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

// update dữ liệu mẫu cv
exports.updateCV = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1)
            return await functions.setError(res, "Chưa có quyền truy cập");
        const _id = req.params._id;
        const data = await CV.findOneAndUpdate({ _id: _id }, req.body);

        if (data) return functions.success(res, "Cập nhật thành công");

        return functions.setError(res, "Không có dữ liêu", 404);
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

//xóa mẫu cv
exports.deleteCV = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1)
            return await functions.setError(res, "Chưa có quyền truy cập");
        const _id = req.params._id;
        const data = await CV.findOneAndDelete({ _id: _id });

        if (data) return functions.success(res, "Đã xóa thành công");

        return functions.setError(res, "Không có dữ liêu", 404);
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

// thêm ngành cv vào danh sách NganhCV
exports.createNganhCV = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1)
            return await functions.setError(res, "Chưa có quyền truy cập");
        const data = req.body;

        let _id = 1;
        await functions.getMaxID(NganhCV).then((res) => {
            if (res) {
                _id = res + 1;
            }
        });
        data._id = _id;
        await CategoryCv.create(data);
        return await functions.success(res, "Tạo mới NganhcCV thành công");
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

// lấy dữ liệu NganhCV cũ
exports.findNganhCV = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1)
            return await functions.setError(res, "Chưa có quyền truy cập");

        const _id = req.params._id;
        const data = await CategoryCv.findOne({ _id: _id });

        if (data) return functions.success(res, "Thành công", data);

        return functions.setError(res, "Không có dữ liêu", 404);
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

// update NganhCV
exports.updateNganhCV = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1)
            return await functions.setError(res, "Chưa có quyền truy cập");
        const _id = req.params._id;
        const data = await CategoryCv.findOneAndUpdate({ _id: _id }, req.body);

        if (data) return functions.success(res, "Cập nhật thành công");

        return functions.setError(res, "Không có dữ liêu", 404);
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

//xóa NganhCV
exports.deleteNganhCV = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1)
            return await functions.setError(res, "Chưa có quyền truy cập");
        const _id = req.params._id;
        const data = await CategoryCv.findOneAndDelete({ _id: _id });

        if (data) return functions.success(res, "Đã xóa thành công");

        return functions.setError(res, "Không có dữ liêu", 404);
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

exports.uploadAvatarCV = async(req, res) => {
    try {
        const base64String = req.body.img;

        // Đường dẫn ảnh
        const dir = `../storage/base365/timviec365/cv365/tmp`;

        // Xóa đầu mục của chuỗi Base64 (ví dụ: "data:image/png;base64,")
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");

        // Giải mã chuỗi Base64 thành dữ liệu nhị phân
        const imageBuffer = Buffer.from(base64Data, "base64");
        const name_img = "tmp_cv_" + functions.getTimeNow();
        // Ghi dữ liệu nhị phân vào tệp ảnh
        const outputPath = `${dir}/${name_img}.png`;
        await fs.writeFile(outputPath, imageBuffer, (error) => {
            if (error) {
                console.error("Lỗi khi ghi tệp ảnh");
                return functions.setError(res, "Lỗi khi ghi tệp ảnh", 404);
            }
        });
        return functions.success(res, "Hình ảnh", {
            img: `https://storage.timviec365.vn/cv365/tmp/${name_img}.png`
        });
    } catch (error) {
        return functions.setError(res, error);
    }
}

exports.module = async(req, res) => {
    try {
        const modulecv = req.body.module;
        if (modulecv) {
            const item = await TblModules.findOne({
                module: modulecv
            }).lean();
            if (item) {
                return functions.success(res, "Thông tin module", { item });
            }
            return functions.setError(res, "Module không tồn tại");
        }
        return functions.setError(res, "Chưa tải module");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

exports.cv365 = async(req, res) => {
    try {
        const seo = await TblModules.findOne({
            module: 'cv365'
        }).lean();

        const blog = await Cv365Blog.find({
                status: 1
            })
            .select("id alias title image")
            .sort({ id: -1 })
            .limit(4);

        for (let index = 0; index < blog.length; index++) {
            const element = blog[index];
            element.image = `${process.env.cdn}/cv365/upload/news/thumb/${element.image}`;
        }

        const custom_html = await Cv365CustomHtml.findOne({
                status: 1,
                sort: 2
            })
            .select("html")
            .sort({ id: -1 })
            .limit(1)
            .lean();
        const footer = await Cv365TblFooter.findOne({}, { content_cv365: 1 }).lean();

        return functions.success(res, "Danh sách", {
            seo,
            blog,
            custom_html,
            footer
        });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

exports.seo_dm_nn_cv = async(req, res) => {
    try {
        const lang_id = req.body.lang_id;
        if (lang_id) {
            const item = await CategoryLangCv.findOne({ id: lang_id });
            if (item) {
                item.content = functions.renderCDNImage(item.content);
                return functions.success(res, "Thông tin seo của ngôn ngữ cv", { item });
            }
            return functions.setError(res, "Không tồn tại ngôn ngữ");
        }
        return functions.setError(res, "Chưa truyền id ngôn ngữ");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

exports.cv_mau = async(req, res) => {
    try {
        const cid = req.body.cid;
        const time_get = functions.getTimeNow() - 86400 * 210;
        if (cid) {
            const HistoryPoint = await CvHistoryPoint.aggregate([
                { $match: { chp_cate_id: cid, chp_created_at: { $gt: time_get } } },
                {
                    $group: {
                        _id: "$chp_cv_id",
                        sum_point: { $sum: "$chp_point" }
                    }
                },
                { $sort: { sum_point: -1, _id: -1 } },
                { $limit: 1 }
            ]);

            let cv;
            if (HistoryPoint.length > 0) {
                cv = await CV.findOne({ _id: HistoryPoint.chp_cv_id }).select("alias colors view cv_point").lean();
            } else {
                cv = await CV.findOne({ cid: cid }).sort({ cv_point: -1 }).select("alias colors view cv_point").lean();
            }
            if (cv) {
                const color = cv.colors.split(',');
                const link_image = `${process.env.cdn}/cv365/upload/cv/${cv.alias}/${color[1]}.jpg`;
                const data = {
                    time: Number(cv.cv_point) * 3,
                    view_count: cv.view,
                    link_image: link_image
                };
                return functions.success(res, "CV mẫu", { data });
            }
            return functions.setError(res, "Cv không tồn tại");
        }
        return functions.setError(res, "Chưa truyền id ngành nghề");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

exports.update_point_cv = async(req, res) => {
    try {
        const cv_id = req.body.cv_id;
        if (cv_id) {
            const cv = await CV.findOne({ _id: cv_id }).lean();
            if (cv) {
                let cv_point = Number(cv.cv_point) + 1;

                await CV.updateOne({ _id: cv._id }, {
                    $set: { cv_point: cv_point }
                });
                const max_chp = await CvHistoryPoint.findOne({}, { chp_id: 1 }).sort({ chp_id: -1 }).lean();
                const chp = new CvHistoryPoint({
                    chp_id: Number(max_chp.chp_id) + 1,
                    chp_cv_id: cv._id,
                    chp_cate_id: cv.cate_id,
                    chp_point: 1,
                    chp_created_at: functions.getTimeNow(),
                });
                await chp.save();
                return functions.success(res, "Cập nhật thành công");
            }
            return functions.setError(res, "Cv không tồn tại");
        }
        return functions.setError(res, "Chưa truyền id cv");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

exports.dataFromTimviec365 = async(req, res) => {
    try {
        const request = req.body;
        const data = {
            uid: request.uid,
            cvid: request.cvid,
            lang: request.lang,
            html: request.html,
            name_img: request.name_img,
            time_edit: request.time_edit,
            cv: request.cv,
            status: request.status,
            delete_cv: request.delete_cv,
            delete_time: request.delete_time,
            height_cv: request.height_cv,
            state: request.state,
        };
        const item = new SaveCvCandi(data);
        await item.save();
        return functions.success(res, "Cập nhật thành công");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

exports.detailBlog = async(req, res) => {
    try {
        const { id } = req.body;
        if (id) {
            const item = await Cv365Blog.findOne({ id: id });
            return functions.success(res, "Chi tiết bài viết", { item });
        }
        return functions.setError(res, "Chưa truyền lên ID");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

//Tạo CV bằng AI365
exports.createCVAI365 = async(req, res, next) => {
    try {
        if (req.file) {
            let docCVPath = req.file.path;
            var docCV = fs.createReadStream(docCVPath);
            // let blob = new Blob([docCV], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
            let city = await functions.getDatafind(City, {}),
                dataCity = [];

            for (let index = 0; index < city.length; index++) {
                const element = city[index];
                dataCity.push({
                    "cit_id": element._id,
                    "cit_name": element.name,
                    "cit_order": element.order,
                    "cit_type": element.type,
                    "cit_count": element.count,
                    "cit_count_vl": element.countVl,
                    "cit_count_vlch": element.countVlch,
                    "postcode": element.postCode
                });
            }
            dataCity = JSON.stringify(dataCity);

            let dataCategory = await CategoryTv365.find({}).sort({ cat_name: 1 });
            dataCategory = JSON.stringify(dataCategory);
            // personally I'd function out the inner body here and just call 
            // to the function and pass in the newFile
            const form_data = new FormData();
            // form_data.append("file", docCV, 'cv365.docx');
            form_data.append("category", dataCity);
            form_data.append("city", dataCategory);

            const request_config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };
            let data = 'test';

            let response = await axios
                .post('http://43.239.223.19:8005/create_cv', form_data, request_config);
            return functions.success(res, "Thành công!", {});
        } else {
            return functions.setError(res, 'Thông tin truyền lên không đầy đủ!');
        }
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

exports.updateCVPreview = async(req, res) => {
    try {
        const request = req.body;
        let css = request.css,
            cv_title = request.cv_title,
            avatar = "",
            name = request.name,
            position = request.position,
            menu = request.menu,
            experiences = request.experiences,
            now = functions.getTimeNow();
        if (id) {
            let arr = {
                css: JSON.parse(css),
                cv_title: cv_title,
                avatar: avatar,
                name: name,
                position: position,
                menu: JSON.parse(menu),
                experiences: JSON.parse(experiences),
            }
            html = JSON.stringify(arr);

            html = html.replaceAll("\'", "'");
            html = html.replaceAll("'", "''");
            let check = CVPreview.findOne({ id }).lean();
            if (check) {
                let dataCV = {
                    id: id,
                    html: html,
                    name_img: avatar,
                    time_update: now
                }
                await CVPreview.updateOne({ id }, {
                    $set: dataCV
                });
            } else {
                let dataCV = {
                    id: id,
                    html: html,
                    name_img: avatar,
                    time_update: now
                }
                dataCVPreview = new CVPreview(dataCV);
                await dataCVPreview.save();
            }
        }
        return functions.setError(res, "Thông tin truyền lên không đầy đủ");
    } catch (e) {
        console.log(e);
        return functions.setError(res, e);
    }
}