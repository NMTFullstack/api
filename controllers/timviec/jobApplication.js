const functions = require('../../services/functions');
const DonXinViec = require('../../models/Timviec365/CV/Application');
const ApplicationCategory = require('../../models/Timviec365/CV/ApplicationCategory');
const SaveAppli = require('../../models/Timviec365/CV/ApplicationUV');
const TblModules = require("../../models/Timviec365/CV/TblModules");
const Cv365TblFooter = require("../../models/Timviec365/CV/TblFooter");
const fs = require("fs");
const Cv365Like = require('../../models/Timviec365/CV/Like');
// lấy danh sách mẫu đơn
exports.list = async(req, res, next) => {
    try {
        const request = req.body,
            page = request.page || 1,
            pageSize = request.pageSize || 10,
            condition = { status: 1 },
            sort = { vip: -1, _id: -1 };

        // Lấy dữ liệu theo điều kiện
        let data;
        if (pageSize != 'all') {
            data = await DonXinViec.find(condition, "name alias cate_id price image view download love").skip((page - 1) * pageSize).sort(sort).limit(pageSize);
        } else {
            data = await DonXinViec.find(condition, "name alias cate_id price image view download love").skip((page - 1) * pageSize).sort(sort);
        }

        // Lấy thông tin người dùng
        const user = await functions.getTokenUser(req, res);

        // Lấy danh sách đơn mà ứng viên đã like
        let listCvLike = [];
        if (user && user != 1) {
            listCvLike = await Cv365Like.find({
                uid: user.idTimViec365,
                type: 2
            }, "id").lean();
        }

        // Cập nhật data theo vòng lặp
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            element.image = functions.getPictureAppli(element.image);
            if (listCvLike.find(cv => cv.id == element._id)) {
                element.isLike = 1;
            } else {
                element.isLike = 0;
            }
        }

        // Đếm số đơn hiện có
        const count = await functions.findCount(DonXinViec, condition);

        // Lấy thông tin seo
        const seo = await TblModules.findOne({
            module: "mau-don-xin-viec"
        }).lean();

        // Lấy thông tin bài viết chân trang
        const footerNew = await Cv365TblFooter.findOne({}).select("content_don");

        return await functions.success(res, 'Lấy mẫu đơn thành công', { items: data, count, seo, footerNew });
    } catch (err) {
        functions.setError(res, err.message);
    };
};

// tìm đơn theo ngành
exports.listByCate = async(req, res, next) => {
    try {
        const request = req.body,
            page = request.page || 1,
            pageSize = request.pageSize || 20,
            alias = req.body.alias;

        if (alias) {
            const cate = await ApplicationCategory.find({ alias }).lean();
            if (cate) {
                const condition = { status: 1, cate_id: cate._id };
                // tìm theo id Ngành
                const data = await DonXinViec.find(condition, "name alias cate_id price image view download love").skip((page - 1) * 20).sort({
                    vip: -1,
                    _id: -1
                }).limit(pageSize);

                for (let i = 0; i < data.length; i++) {
                    const element = data[i];
                    element.image = functions.getPictureAppli(element.image);
                }
                const count = await functions.findCount(DonXinViec, condition);

                return await functions.success(res, `Danh sách đơn theo ngành`, { cate, items: data, count });
            }
        }
        functions.setError(res, "Không đầy đủ thông tin");

    } catch (err) {
        return functions.setError(res, err.message, );
    };
};

// lấy danh sách ngành đơn
exports.category = async(req, res, next) => {
    try {
        const data = await ApplicationCategory.find().select('_id name alias').lean();
        return functions.success(res, 'Danh sách ngành DON', { data });
    } catch (err) {
        return functions.setError(res, err.message);
    };
};


// xem trước
exports.preview = async(req, res, next) => {
    try {
        const _id = req.body._id;
        const data = await DonXinViec.findOne({ _id: _id }).select('_id image view').lean();

        if (!data) return await functions.setError(res, 'Không có dữ liệu', 404);
        let view = data.view + 1; // cập nhật số lượng xem 
        await DonXinViec.updateOne({ _id: _id }, { view: view });

        // Cập nhật hình ảnh bằng cdn
        data.image = functions.getPictureAppli(data.image);
        return await functions.success(res, 'Lấy mâũ DON thanh công', { data });
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// xem chi tiết ( tạo)
exports.detail = async(req, res, next) => {
    try {
        const _id = req.body._id;
        const user = req.user.data;
        if (_id) {
            const data = await DonXinViec.findOne({ _id: _id }).select('_id name alias html_vi html_cn html_jp html_kr html_en view colors');
            if (data) {
                let view = data.view + 1; // cập nhật số lượng xem 
                await DonXinViec.updateOne({ _id: _id }, { view: view });

                return await functions.success(res, 'Lấy DON thành công', { data });
            };
        }
        return await functions.setError(res, 'Không có dữ liệu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

//lưu và tải đơn
exports.save = async(req, res, next) => {
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
            const checkSave = await SaveAppli.findOne({
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
                await SaveAppli.findOne({}, { id: 1 }).sort({ id: -1 }).then((res) => {
                    _id = res.id + 1;
                })
                data.id = _id;
                await SaveAppli.create(data);
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

                await SaveAppli.updateOne({
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
                    await SaveAppli.updateOne({
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

// thêm mới NganhDon
exports.createNganhDon = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const data = req.body;

        let _id = 1;
        await functions.getMaxID(NganhDon)
            .then(res => {
                if (res) {
                    _id = res + 1;
                }
            });
        data._id = _id;
        await NganhDon.create(data);
        return await functions.success(res, 'Tạo mới NganhcDon thành công', );
    } catch (err) {
        return functions.setError(res, err.message);
    }
};

// lấy dữ liệu NganhDon cũ
exports.findNganhDon = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');

        const _id = req.params._id;
        const data = await NganhDon.findOne({ _id: _id });

        if (data) return functions.success(res, 'Thành công', data);

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// update NganhDon
exports.updateNganhDon = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const _id = req.params._id;
        const data = await NganhDon.findOneAndUpdate({ _id: _id }, req.body);

        if (data) return functions.success(res, 'Cập nhật thành công', );

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

//xóa NganhDon
exports.deleteNganhDon = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const _id = req.params._id;
        const data = await NganhDon.findOneAndDelete({ _id: _id });

        if (data) return functions.success(res, 'Đã xóa thành công', );

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// tạo mới mẫu DonXinViec
exports.createDon = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập', 404);
        const data = req.body;

        let _id = 1;
        await functions.getMaxID(DonXinViec)
            .then(res => {
                if (res) {
                    _id = res + 1;
                }
            });
        data._id = _id;
        await DonXinViec.create(data);
        return await functions.success(res, 'Tạo mới DonXinViec thành công', );
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// lấy dữ liệu mẫu DonXinViec cũ
exports.findDon = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');

        const _id = req.params._id;
        const data = await DonXinViec.findOne({ _id: _id });

        if (data) return functions.success(res, 'Thành công', data);

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

// update dữ liệu mẫu DonXinViec
exports.updateDon = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const _id = req.params._id;
        const data = await DonXinViec.findOneAndUpdate({ _id: _id }, req.body);

        if (data) return functions.success(res, 'Cập nhật thành công', );

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message);
    };
};

//xóa mẫu DonXinViec
exports.deleteDon = async(req, res, next) => {
    try {
        const user = req.user.data;
        if (user.role != 1) return await functions.setError(res, 'Chưa có quyền truy cập');
        const _id = req.params._id;
        const data = await DonXinViec.findOneAndDelete({ _id: _id });

        if (data) return functions.success(res, 'Đã xóa thành công', );

        return functions.setError(res, 'Không có dữ liêu', 404);
    } catch (err) {
        return functions.setError(res, err.message)
    };
};