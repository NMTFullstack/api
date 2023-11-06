const functions = require("../../../services/functions");
const vanThuService = require("../../../services/vanthu");
const VanBan = require('../../../models/Vanthu365/van_ban');
const UserModel = require('../../../models/Vanthu365/user_model');
const TextBook = require('../../../models/Vanthu365/tbl_textBook');

exports.thietLapQuyen = async(req, res, next) => {
    try {
        let infoUser = req.user.data;
        if (infoUser.type != 1) {
            return functions.setError(res, "Tai khoan nhan vien khong co quyen cap quyen!", 408);
        }
        let id = infoUser.com_id;
        let { type_cong_ty, type_ngoai, duyet_pb, duyet_tung_pb } = req.body;
        if (!type_cong_ty || !type_ngoai) {
            return functions.setError(res, "Missing input value!", 404);
        }
        let data_cong_ty = "",
            data_ngoai = "",
            data_duyet_pb = "",
            data_duyet_tung_pb = "";
        if (type_cong_ty) data_cong_ty = type_cong_ty.join(", ");
        if (type_ngoai) data_ngoai = type_ngoai.join(", ");
        if (duyet_pb) data_duyet_pb = duyet_pb.join(", ");
        if (duyet_tung_pb) data_duyet_tung_pb = duyet_tung_pb.join(", ");
        let created_time = vanThuService.convertTimestamp(Date.now());

        let userModel = await UserModel.findOne({ id_user: id });

        if (userModel) {
            userModel = await UserModel.findOneAndUpdate({ id_user: id }, {
                type_cong_ty: data_cong_ty,
                type_ngoai: data_ngoai,
                duyet_pb: data_duyet_pb,
                duyet_tung_pb: data_duyet_tung_pb,
                created_time: created_time
            }, { new: true });
            if (!userModel) {
                return functions.setError(res, "Cap nhat quyen that bai!", 405);
            }
            return functions.success(res, "Cap nhat quyen thanh cong!");
        }

        let idMax = await vanThuService.getMaxId(UserModel);
        userModel = new UserModel({
            _id: idMax,
            id_user: id,
            type_cong_ty: data_cong_ty,
            type_ngoai: data_ngoai,
            duyet_pb: data_duyet_pb,
            duyet_tung_pb: data_duyet_tung_pb,
            created_time: created_time
        })
        userModel = await userModel.save();
        if (!userModel) {
            return functions.setError(res, "Thiet lap quyen that bai quyen that bai!", 405);
        }
        return functions.success(res, "Thiet lap quyen thanh cong!");
    } catch (err) {
        return functions.setError(res, err.message);
    }
}

exports.getListQuyen = async(req, res) => {
        try {
            let infoUser = req.user.data;
            let comId = infoUser.com_id;
            let listQuyen = await UserModel.findOne({ id_user: comId });
            if (!listQuyen) {
                return functions.setError(res, "Chua thiet lap quyen cho cong ty!", 404);
            }
            return functions.success(res, "Get quyen success!", { listQuyen: listQuyen });
        } catch (err) {
            return functions.setError(res, err.message);
        }
    }
    //-----------------------so van ban-----------------------
exports.getListSoVanBan = async(req, res, next) => {
    try {
        let { page, pageSize, id_so_vb } = req.body;
        let infoUser = req.user.data;

        if (id_so_vb) {
            let so_vb = await TextBook.findOne({ _id: id_so_vb }).lean();
            if (!so_vb) return functions.setError(res, "So van ban not found!", 504);
            return functions.success(res, "Get so van ban thanh cong!", { so_vb: so_vb });
        }
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = pageSize * (page - 1);
        const limit = pageSize;
        let id = infoUser.idQLC;
        let com_id = infoUser.com_id;
        let condition = { nguoi_tao: id, com_id: com_id };
        let listSoVanBan = await functions.pageFind(TextBook, condition, { _id: 1 }, skip, limit);
        let total = await TextBook.countDocuments(condition);
        return functions.success(res, { total, page, pageSize, listSoVanBan });
    } catch (err) {
        return functions.setError(res, err.message);
    }
}
exports.getListFullSoVB = async(req, res, next) => {
    try {
        const com_id = req.user.data.com_id;
        const data = await TextBook.find({
            com_id: com_id
        })
        return res.status(200).json({ data: data });
    } catch (err) {
        return functions.setError(res, err.message);
    }
}
exports.createSoVanBan = async(req, res, next) => {
    try {
        let name_book = req.body.name_book;
        if (!name_book) {
            return functions.setError(res, "Missing input name_book!", 404);
        }
        let infoUser = req.user.data;
        let id = infoUser.idQLC;
        let comId = infoUser.com_id;
        let date = new Date(Date.now());
        let year = date.getFullYear();
        let timestamp = Math.round(date.getTime() / 1000);
        let maxId = await vanThuService.getMaxId(TextBook);
        let soVB = new TextBook({
            _id: maxId,
            name_book: name_book,
            nguoi_tao: id,
            com_id: comId,
            year: year,
            creat_date: timestamp
        })
        soVB = await soVB.save();
        if (!soVB) {
            return functions.setError(res, "Tao moi so van ban!", 505);
        }
        return functions.success(res, "Tao so van ban thanh cong!");
    } catch (err) {
        return functions.setError(res, err.message);
    }
}

exports.updateSoVanBan = async(req, res, next) => {
    try {
        let { id_so_vb, name_book } = req.body;
        if (!id_so_vb || !name_book) {
            return functions.setError(res, "Missing input value!", 404);
        }
        let soVB = await TextBook.findOneAndUpdate({ _id: id_so_vb }, { name_book: name_book }, { new: true });
        if (!soVB) {
            return functions.setError(res, "Khong ton tai so van ban!", 404);
        }
        return functions.success(res, "Chinh sua so van ban thanh cong!");
    } catch (err) {
        return functions.setError(res, err.message);
    }
}

exports.deleteSoVanBan = async(req, res, next) => {
    try {
        let id_so_vb = req.body.id_so_vb;
        if (!id_so_vb) {
            return functions.setError(res, "Missing input value!", 404);
        }
        let soVB = await TextBook.deleteOne({ _id: id_so_vb });
        if (soVB.deletedCount == 0) {
            return functions.setError(res, "Khong ton tai so van ban!", 404);
        }
        return functions.success(res, "Xoa so van ban thanh cong!");
    } catch (err) {
        return functions.setError(res, err.message);
    }
}