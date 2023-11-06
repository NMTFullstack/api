const functions = require('../../services/functions');
const Letter = require('../../models/Timviec365/CV/Letter');
const LetterCategory = require('../../models/Timviec365/CV/LetterCategory');
// Model này dùng chung cho cả cv, đơn, thư
const Cv365Like = require('../../models/Timviec365/CV/Like');
const LetterUV = require('../../models/Timviec365/CV/LetterUV');
const TblModules = require("../../models/Timviec365/CV/TblModules");
const TblFooter = require('../../models/Timviec365/CV/TblFooter');
const fs = require("fs");

// lấy danh sách mẫu thư
exports.list = async(req, res, next) => {
    try {
        const request = req.body,
            page = request.page || 1,
            pageSize = request.pageSize || 10,
            condition = {
                status: 1
            },
            sort = {
                vip: -1,
                _id: -1
            };

        let data;
        if (pageSize != "all") {
            data = await Letter.find(condition, "name alias cate_id price image view download love").skip((page - 1) * pageSize).sort(sort).limit(pageSize).lean();
        } else {
            data = await Letter.find(condition, "name alias cate_id price image view download love").sort(sort).lean();
        }

        // Lấy thông tin người dùng
        const user = await functions.getTokenUser(req, res);

        // Lấy danh sách thư mà ứng viên đã like
        let listCvLike = [];
        if (user && user != 1) {
            listCvLike = await Cv365Like.find({
                uid: user.idTimViec365,
                type: 3
            }, "id").lean();
        }

        // Cập nhật data theo vòng lặp
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            element.image = functions.getPictureLetter(element.image);
            if (listCvLike.find(cv => cv.id == element._id)) {
                element.isLike = 1;
            } else {
                element.isLike = 0;
            }
        }

        // Đếm tổng số thư
        const count = await functions.findCount(Letter, condition);

        // Lấy thông tin seo
        const seo = await TblModules.findOne({
            module: "mau-cover-letter-thu-xin-viec"
        }).lean();

        // Lấy thông tin bài viết chân trang
        const footerNew = await TblFooter.findOne({}).select("content_thu");
        return await functions.success(res, 'Lấy mẫu thư thành công', { data, count, seo, footerNew });
    } catch (err) {
        functions.setError(res, err.message);
    };
};

// tìm thư theo ngành
exports.listByCate = async(req, res, next) => {
    try {
        const request = req.body,
            page = request.page || 1,
            pageSize = request.pageSize || 10,
            alias = request.alias;

        if (alias) {
            // Lấy thông tin của ngành nghề thư
            const category = await LetterCategory.findOne({ alias }, "name").lean();

            if (category) {
                // Lấy thư theo id Ngành
                const data = await Letter.find({ cate_id: category._id }, "name alias cate_id price image view download love").skip((page - 1) * pageSize).limit(pageSize);
                for (let i = 0; i < data.length; i++) {
                    const element = data[i];
                    element.image = functions.getPictureLetter(element.image);
                }
                return await functions.success(res, `Danh sách thư theo ngành`, { category, items: data });
            }
        }
        return await functions.setError(res, 'Không có dữ liệu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// lấy danh sách ngành thư
exports.listCategory = async(req, res, next) => {
    try {
        const data = await LetterCategory.find().select('_id name alias');
        return functions.success(res, 'Danh sách ngành thư xin việc', { data });

    } catch (err) {
        return functions.setError(res, err.message);
    };
};


// xem trước 
exports.preview = async(req, res, next) => {
    try {
        const _id = req.body._id;
        const data = await Letter.findOne({ _id: _id }).select('_id image view colors');

        if (!data) return await functions.setError(res, 'Không có dữ liệu', 404);

        let view = data.view + 1; // cập nhật số lượng xem 
        await Letter.updateOne({ _id: _id }, { view: view });
        return await functions.success(res, 'Lấy mẫu thư thanh công', { data });
    } catch (err) {
        return functions.setError(res, err.message);
    };
};


// xem chi tiết thư ( tạo)
exports.detail = async(req, res, next) => {
    try {
        const _id = req.body.id;
        const user = req.user.data;
        const data = await Letter.findOne({ _id: _id }).select('_id alias name html_vi html_cn html_jp html_kr html_en view colors lang_id').lean();

        if (data) {
            let view = data.view + 1; // cập nhật số lượng xem 
            await Letter.updateOne({ _id: _id }, { view: view });


            return await functions.success(res, 'Chi tiết nội dung thư xin việc', { data });
        };
        return await functions.setError(res, 'Không có dữ liệu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

//lưu và tải thư
exports.saveThu = async(req, res, next) => {
    try {
        const pmKey = req.user.data._id,
            userId = req.user.data.idTimViec365,
            id = req.body.id,
            name_img = req.body.name_img,
            html = req.body.html,
            lang = req.body.lang;

        let base64String = req.body.base64;
        if (id && base64String) {

            // Kiểm tra đã tạo hay chưa
            const checkSave = await LetterUV.findOne({
                uid: userId,
                tid: id
            }).lean();

            // Đường dẫn ảnh
            const dir = `../storage/base365/timviec365/cv365/upload/ungvien/uv_${userId}`;

            const data = {
                uid: userId,
                tid: id,
                html: html,
                lang: lang,
            };

            // Nếu chưa tạo thì lưu vào
            if (!checkSave) {
                let _id = 1;
                await LetterUV.findOne({}, { id: 1 }).sort({ id: -1 }).then((res) => {
                    _id = res.id + 1;
                })
                data.id = _id;
                await LetterUV.create(data);
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

                await LetterUV.updateOne({
                    _id: checkSave._id
                }, {
                    $set: data
                });
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
                    console.error("Lỗi khi ghi tệp ảnh");
                    return functions.setError(res, "Lỗi khi ghi tệp ảnh", 404);
                }
            });
            let message = "Lưu";
            const checkImage = await functions.checkImage(outputPath);
            if (checkImage) {
                if (name_img) {
                    await LetterUV.updateOne({
                        uid: userId,
                        tid: id
                    }, {
                        $set: {
                            name_img: name_img
                        }
                    });
                }
            }
            return await functions.success(res, `${message} thành công`);
        }
        return functions.setError(res, "Thông tin truyền lên không đầy đủ", 404);
    } catch (e) {
        console.log(e);
        return functions.setError(res, "Đã có lỗi xảy ra", 404);
    }
};

// thêm mới NganhThu
exports.createNganhThu = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const data = req.body;

        let _id = 1;
        await functions.getMaxID(NganhThu)
            .then(res => {
                if (res) {
                    _id = res + 1;
                }
            });
        data._id = _id;
        await NganhLetter.create(data);
        return await functions.success(res, 'Tạo mới NganhcDon thành công', );
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

// lấy dữ liệu NganhThu cũ
exports.findNganhThu = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');

        const _id = req.params._id;
        const data = await NganhLetter.findOne({ _id: _id });

        if (data) return functions.success(res, 'Thành công', data);

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// update NganhThu
exports.updateNganhThu = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const _id = req.params._id;
        const data = await NganhLetter.findOneAndUpdate({ _id: _id }, req.body);

        if (data) return functions.success(res, 'Cập nhật thành công', );

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

//xóa NganhThu
exports.deleteNganhThu = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const _id = req.params._id;
        const data = await NganhLetter.findOneAndDelete({ _id: _id });

        if (data) return functions.success(res, 'Đã xóa thành công', );

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// tạo mới mẫu Thu
exports.createThu = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập', 404);
        const data = req.body;

        let _id = 1;
        await functions.getMaxID(Thu)
            .then(res => {
                if (res) {
                    _id = res + 1;
                }
            });
        data._id = _id;
        await Letter.create(data);
        return await functions.success(res, 'Tạo mới Thu thành công', );
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// lấy dữ liệu mẫu Thu cũ
exports.findThu = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');

        const _id = req.params._id;
        const data = await Letter.findOne({ _id: _id });

        if (data) return functions.success(res, 'Thành công', data);

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// update dữ liệu mẫu Thu
exports.updateThu = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const _id = req.params._id;
        const data = await Letter.findOneAndUpdate({ _id: _id }, req.body);

        if (data) return functions.success(res, 'Cập nhật thành công', );

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

//xóa mẫu Thu
exports.deleteThu = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const _id = req.params._id;
        const data = await Letter.findOneAndDelete({ _id: _id });

        if (data) return functions.success(res, 'Đã xóa thành công', );

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};