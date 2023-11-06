const functions = require('../../services/functions');
const Resume = require('../../models/Timviec365/CV/Resume');
const ResumeUV = require('../../models/Timviec365/CV/ResumeUV');
const TblModules = require("../../models/Timviec365/CV/TblModules");
const TblFooter = require("../../models/Timviec365/CV/TblFooter");
const fs = require("fs");
const https = require('https');
const path = require('path');

// lấy danh sách mẫu syll
exports.list = async(req, res, next) => {
    try {
        const data = await Resume.find({}).sort('-_id').select('price image name alias').lean();

        // Cập nhật thông tin theo vòng lặp
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            element.image = await functions.getPictureResume(element.image)
        }

        // Lấy thông tin seo
        const seo = await TblModules.findOne({
            module: "mau-so-yeu-ly-lich"
        }).lean();


        // Lấy thông tin bài viết chân trang
        const footerNew = await TblFooter.findOne({}).select("content_soyeu");

        if (data) return await functions.success(res, 'Lấy mẫu SYLL thành công', { data, seo, footerNew });

        return functions.setError(res, 'Không có dữ liệu', 404);
    } catch (err) {
        functions.setError(res, err.message);
    };
};

// xem trước
exports.preview = async(req, res, next) => {
    try {
        const _id = req.body._id;
        const data = await Resume.findOne({ _id: _id }).lean();

        if (!data) return functions.setError(res, 'Không có dữ liệu', 404);
        // cập nhật số lượng xem 
        await Resume.updateOne({ _id: _id }, { $set: { view: data.view + 1 } }, );

        let img = [];
        // Cập nhật hình ảnh
        for (let i = 1; i <= 4; i++) {
            img.push(`${process.env.cdn}/cv365/upload/hoso/${data.alias}/syll_${i}.jpg`);
        }
        data.img = img;
        return functions.success(res, 'Lấy mẫu SYLL thành công', { data });
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// xem chi tiết
exports.detail = async(req, res, next) => {
    try {
        const _id = Number(req.body._id);
        if (_id) {
            const user = req.user.data;
            const data = await Resume.findOne({ _id: _id }).lean();
            if (data) {
                // cập nhật số lượng xem 
                await Resume.updateOne({ _id: _id }, { $set: { view: data.view + 1 } }, );

                return await functions.success(res, 'Lấy SYLL thành công', { data });
            }
        };
        return await functions.setError(res, 'Không có dữ liệu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

//lưu và tải syll
exports.save = async(req, res, next) => {
    try {
        const pmKey = req.user.data._id,
            userId = req.user.data.idTimViec365,
            id = Number(req.body.id),
            name_img = req.body.name_img,
            html = req.body.html,
            lang = req.body.lang;
        let base64String = req.body.base64;
        if (id && base64String) {

            // Kiểm tra đã tạo hay chưa
            const checkSave = await ResumeUV.findOne({
                uid: userId,
                tid: id
            }).lean();
            // Đường dẫn ảnh
            const dir = `${process.env.storage_tv365}/cv365/upload/ungvien/uv_${userId}`;

            let data = {
                uid: userId,
                tid: id,
                html: html,
                lang: lang,
            };

            // Nếu chưa tạo thì lưu vào
            if (!checkSave) {
                let _id = 1;
                await ResumeUV.findOne({}, { id: 1 }).sort({ id: -1 }).then((res) => {
                    _id = res.id + 1;
                })
                data.id = _id;
                await ResumeUV.create(data);
            }
            // Nếu tạo rồi thì cập nhật đồng thời xóa cv cũ
            else {
                if (name_img && checkSave.name_img != null) {
                    const filePath = `${dir}/${checkSave.name_img}.png`;
                    await fs.access(filePath, fs.constants.F_OK, (error) => {
                        if (error) {} else {
                            // Tệp tin tồn tại
                            fs.unlink(filePath, (err) => {
                                if (err) throw err;
                            });
                        }
                    });
                }

                await ResumeUV.updateOne({ _id: checkSave._id }, { $set: data });
            }

            // Kiểm tra xem đã tạo thư mục lưu ảnh chưa
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            // Đường dẫn tới nơi bạn muốn lưu ảnh
            outputPath = `${dir}/${name_img}.png`;

            // Xóa đầu mục của chuỗi Base64 (ví dụ: "data:image/png;base64,")
            const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");

            // Giải mã chuỗi Base64 thành dữ liệu nhị phân
            const imageBuffer = Buffer.from(base64Data, "base64");

            // Ghi dữ liệu nhị phân vào tệp ảnh
            await fs.writeFile(outputPath, imageBuffer, (error) => {
                if (error) {
                    return functions.setError(res, "Lỗi khi ghi tệp ảnh", 404);
                }
            });
            let message = "Lưu";
            const checkImage = await functions.checkImage(outputPath);
            if (checkImage) {
                if (name_img) {
                    await ResumeUV.updateOne({
                        uid: userId,
                        tid: id
                    }, {
                        $set: {
                            name_img: name_img
                        }
                    });
                }
            };

            return functions.success(res, `${message} thành công`, {
                data: {
                    outputPath,
                    user: await ResumeUV.findOne({ tid: data.tid }).lean()
                }
            });
        }
        return functions.setError(res, "Thông tin truyền lên không đầy đủ", 404);
    } catch (e) {
        console.log(e);
        return functions.setError(res, "Đã có lỗi xảy ra", 404);
    }
};

// tạo mới mẫSYLL
exports.createSYLL = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập', 404);
        const data = req.body;

        let _id = 1;
        await functions.getMaxID(HoSo)
            .then(res => {
                if (res) {
                    _id = res + 1;
                }
            });
        data._id = _id;
        await Resume.create(data);
        return await functions.success(res, 'Tạo mới SYLL thành công', );
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// lấy dữ liệu mẫu SYLL cũ
exports.findSYLL = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');

        const _id = req.params._id;
        const data = await Resume.findOne({ _id: _id });

        if (data) return functions.success(res, 'Thành công', data);

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// update dữ liệu mẫu SYLL
exports.updateSYLL = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const _id = req.params._id;
        const data = await Resume.findOneAndUpdate({ _id: _id }, req.body);

        if (data) return functions.success(res, 'Cập nhật thành công', );

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

//xóa mẫu SYLL
exports.deleteSYLL = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const _id = req.params._id;
        const data = await Resume.findOneAndDelete({ _id: _id });

        if (data) return functions.success(res, 'Đã xóa thành công', );

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};