const fnc = require('../../../../services/functions');
const functions = require('../../../../services/QLTS/qltsService');
const DonViCongSuat = require('../../../../models/QuanLyTaiSan/DonViCS');
const TheoDoiCongSuat = require('../../../../models/QuanLyTaiSan/TheoDoiCongSuat');

//quan ly don  vi do cong suat
exports.add_dvi_csuat = async (req, res) => {
    try {
        let { ten_dv, mota } = req.body;
        let date_create = new Date().getTime();
        let id_cty = req.user.data.com_id;
        let maxId = await functions.maxID_dvcs(DonViCongSuat);
        let insert_dvcs = new DonViCongSuat({
            id_donvi: maxId + 1,
            id_cty: id_cty,
            ten_donvi: ten_dv,
            mota_donvi: mota,
            dvcs_date_create: date_create
        });
        await insert_dvcs.save();
        return fnc.success(res, 'add unit suceess', { insert_dvcs });

    } catch (error) {
        console.log(error)
        return fnc.setError(res, error.message);
    }
}

exports.edit_dvi_csuat = async (req, res) => {
    try {
        let { id_donvi_edit, ten_DV, mota } = req.body;
        let com_id = req.user.data.com_id;
        let dvi = await DonViCongSuat.findOne({
            id_donvi: id_donvi_edit,
            id_cty: com_id
        })
        if (dvi) {
            let edit = await DonViCongSuat.findOneAndUpdate({
                id_donvi: id_donvi_edit,
                id_cty: com_id
            }, {
                ten_donvi: ten_DV,
                mota_donvi: mota
            }
            );
            return fnc.success(res, "ok", { edit });
        }
        return fnc.setError(res, "khong tim thay doi tuong can sua");
    } catch (error) {
        return fnc.setError(res, error.message);
    }
}

exports.danhSachDonViCongSuat = async (req, res) => {
    try {
        let { id_dv, page, pageSize } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        let com_id = req.user.data.com_id;
        let condition = { id_cty: com_id, donvi_xoa: 0 };
        if (id_dv) condition.id_donvi = Number(id_dv);

        let danhSachDonViCongSuat = await fnc.pageFind(DonViCongSuat, condition, { id_donvi: -1 }, skip, pageSize);
        let totalCount = await fnc.findCount(DonViCongSuat, condition);
        return fnc.success(res, "Lay ra don vi cong suat thanh cong", { totalCount, danhSachDonViCongSuat });
    } catch (error) {
        return fnc.setError(res, error.message);
    }
}
//thoe dõi công suất 
exports.add_do_csuat = async (req, res) => {
    try {
        let com_id = req.user.data.com_id;
        let { loai_ts, capnhattu_theodoics, ten_dv, nhap_ngay, chon_ngay } = req.body;
        if (chon_ngay && fnc.checkDate(chon_ngay)) chon_ngay = fnc.convertTimestamp(chon_ngay);
        else chon_ngay = fnc.convertTimestamp(Date.now());

        let type_quyen = req.user.data.type;
        let maxid = await fnc.getMaxIdByField(TheoDoiCongSuat, 'id_cs') || 1;

        let insert = await TheoDoiCongSuat({
            id_cs: maxid,
            id_cty: com_id,
            id_loai: loai_ts,
            id_donvi: ten_dv,
            update_cs_theo: capnhattu_theodoics,
            chon_ngay: chon_ngay,
            nhap_ngay: nhap_ngay,
            cs_gannhat: 0,
            tdcs_type_quyen: type_quyen,
            tdcs_xoa: 0,
            tdcs_date_create: new Date().getTime()
        })
        await insert.save();
        return fnc.success(res, 'OK', { insert });
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error.message);
    }

}

exports.update_theodoi_cs = async (req, res) => {
    try {

        let { id, day_update, cs_thuc } = req.body;
        let com_id = req.user.data.com_id;
        if (id && day_update && cs_thuc) {
            if (isNaN(id) || id <= 0) {
                return fnc.setError(res, 'id phai la 1 so lon hon 0')
            }
            if (fnc.checkDate(day_update)) day_update = fnc.convertTimestamp(day_update);
            else return fnc.setError(res, "Khong dung dinh dang date");
            let theodoi = await TheoDoiCongSuat.findOne({
                id_cs: id,
                id_cty: com_id
            })
            if (theodoi) {
                let update = await TheoDoiCongSuat.findOneAndUpdate({
                    id_cs: id,
                    id_cty: com_id
                }, {
                    date_update: day_update,
                    cs_gannhat: cs_thuc
                })
                return fnc.success(res, "OK", { update })
            }
            return fnc.setError(res, "khong tim thay đối tượng cần cập nhật ");

        }
        return fnc.setError(res, "Missing input value!");
    } catch (error) {
        console.log(error);
        return fnc.setError(res, error.message);
    }
}

exports.xoaTheoDoiCongSuat = async (req, res) => {
    try {
        let { id, type } = req.body;
        if (!id) {
            return fnc.setError(res, 'Thông tin truyền lên không đầy đủ', 400);
        }
        let id_com = 0;
        if (req.user.data.type == 1 || req.user.data.type == 2) {
            id_com = req.user.data.com_id;
        } else {
            return fnc.setError(res, 'không có quyền truy cập', 400);
        }
        let type_quyen = req.user.data.type;
        let idQLC = req.user.data._id;
        let date = fnc.convertTimestamp(Date.now());
        if (type == 1) { // xóa vĩnh viễn
            let idArraya = id.map(idItem => parseInt(idItem));
            await TheoDoiCongSuat.deleteMany({ id_cs: { $in: idArraya }, id_cty: id_com });
            return fnc.success(res, 'Xoa vinh vien thanh cong!');
        } else if (type == 0) {
            // thay đổi trạng thái là 1
            let idArray = id.map(idItem => parseInt(idItem));
            await TheoDoiCongSuat.updateMany(
                {
                    id_cs: { $in: idArray },
                    tdcs_xoa: 0,
                    id_cty: id_com
                },
                { tdcs_xoa: 1, tdcs_type_quyen_xoa: type_quyen, tdcs_id_ng_xoa: idQLC, tdcs_date_delete: date }
            );
            return fnc.success(res, 'Xoa tam thoi thanh cong!');
        } else if (type == 2) {
            // Khôi phục bảo dưỡng
            let idArray = id.map(idItem => parseInt(idItem));
            await TheoDoiCongSuat.updateMany(
                { id_cs: { $in: idArray }, tdcs_xoa: 1, id_cty: id_com },
                { tdcs_xoa: 0, tdcs_type_quyen_xoa: 0, tdcs_id_ng_xoa: 0, tdcs_date_delete: "" }
            );
            return fnc.success(res, 'Khoi phuc thanh cong!');
        } else {
            return fnc.setError(res, 'không thể thực thi!', 400);
        }
    } catch (e) {
        return fnc.setError(res, e.message);
    }
}

exports.xoaDonViCongSuat = async (req, res) => {
    try {
        let { id, type } = req.body;
        if (!id) {
            return fnc.setError(res, 'Thông tin truyền lên không đầy đủ', 400);
        }
        let id_com = 0;
        if (req.user.data.type == 1 || req.user.data.type == 2) {
            id_com = req.user.data.com_id;
        } else {
            return fnc.setError(res, 'không có quyền truy cập', 400);
        }
        let type_quyen = req.user.data.type;
        let idQLC = req.user.data._id;
        let date = fnc.convertTimestamp(Date.now());
        if (type == 1) { // xóa vĩnh viễn
            let idArraya = id.map(idItem => parseInt(idItem));
            await DonViCongSuat.deleteMany({ id_donvi: { $in: idArraya }, id_cty: id_com });
            return fnc.success(res, 'Xoa vinh vien thanh cong!');
        } else if (type == 0) {
            // thay đổi trạng thái là 1
            let idArray = id.map(idItem => parseInt(idItem));
            await DonViCongSuat.updateMany(
                {
                    id_donvi: { $in: idArray },
                    donvi_xoa: 0,
                    id_cty: id_com
                },
                { donvi_xoa: 1, dvcs_type_quyen_xoa: type_quyen, dvcs_id_ng_xoa: idQLC, dvcs_date_delete: date }
            );
            return fnc.success(res, 'Xoa tam thoi thanh cong!');
        } else if (type == 2) {
            // Khôi phục bảo dưỡng
            let idArray = id.map(idItem => parseInt(idItem));
            await DonViCongSuat.updateMany(
                { id_donvi: { $in: idArray }, donvi_xoa: 1, id_cty: id_com },
                { donvi_xoa: 0, dvcs_type_quyen_xoa: 0, dvcs_id_ng_xoa: 0, dvcs_date_delete: "" }
            );
            return fnc.success(res, 'Khoi phuc thanh cong!');
        } else {
            return fnc.setError(res, 'không thể thực thi!', 400);
        }
    } catch (e) {
        return fnc.setError(res, e.message);
    }
}