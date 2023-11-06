
const fnc = require('../../../../services/functions');
const ThongBao = require('../../../../models/QuanLyTaiSan/ThongBao');
const BaoDuong = require('../../../../models/QuanLyTaiSan/BaoDuong');
const QuaTrinhSuDung = require('../../../../models/QuanLyTaiSan/QuaTrinhSuDung');
const TaiSan = require('../../../../models/QuanLyTaiSan/TaiSan');
const TaiSanDangSuDung = require("../../../../models/QuanLyTaiSan/TaiSanDangSuDung");
const Users = require('../../../../models/Users');
const { errorMonitor } = require('nodemailer/lib/xoauth2');
const Department = require('../../../../models/qlc/Deparment');
const QuyDinhBaoDuong = require('../../../../models/QuanLyTaiSan/Quydinh_bd');
const NhacNho = require('../../../../models/QuanLyTaiSan/NhacNho');
const func = require('../../../../services/QLTS/qltsService');
const TheoDoiCongSuat = require('../../../../models/QuanLyTaiSan/TheoDoiCongSuat');

//xoa tai san can/dang/da bao duong (xoa/khoi phuc/xoa vinh vien)
exports.xoaBaoDuong = async (req, res) => {
    try {
        let { id, type } = req.body;
        if (!id) {
            return fnc.setError(res, 'Thông tin truyền lên không đầy đủ', 400);
        }
        let id_com = 0;
        if (req.user.data.type == 1 || req.user.data.type == 2) {
            id_com = req.user.data.com_id;
            bd_id_ng_xoa = req.user.data._id
        } else {
            return fnc.setError(res, 'không có quyền truy cập', 400);
        }
        const deleteDate = Math.floor(Date.now() / 1000);
        if (type == 1) { // xóa vĩnh viễn
            let idArraya = id.map(idItem => parseInt(idItem));
            await BaoDuong.deleteMany({ id_bd: { $in: idArraya }, id_cty: id_com });
            return fnc.success(res, 'xóa thành công!');
        } else if (type == 0) {
            // thay đổi trạng thái là 1
            let idArray = id.map(idItem => parseInt(idItem));
            await BaoDuong.updateMany(
                {
                    id_bd: { $in: idArray },

                    xoa_bd: 0
                },
                {
                    xoa_bd: 1,
                    bd_id_ng_xoa: bd_id_ng_xoa,
                    bd_date_delete: deleteDate
                }
            );
            return fnc.success(res, 'Bạn đã xóa thành công vào danh sách dã xóa !');
        } else if (type == 2) {
            // Khôi phục bảo dưỡng
            let idArray = id.map(idItem => parseInt(idItem));
            await BaoDuong.updateMany(
                { id_bd: { $in: idArray }, xoa_bd: 1 },
                {
                    xoa_bd: 0,
                    bd_id_ng_xoa: 0,
                    bd_date_delete: 0
                }
            );
            return fnc.success(res, 'Bạn đã khôi phục bảo dưỡng thành công!');
        } else {
            return fnc.setError(res, 'không thể thực thi!', 400);
        }
    } catch (e) {
        return fnc.setError(res, e.message);
    }
}

// Tĩnh
//tai sản cần bảo dưỡng
//add_baoduong
exports.add_Ts_can_bao_duong = async (req, res) => {
    try {
        let { id_ts, sl_bd, trang_thai_bd, cs_bd, ngay_bd, ngay_dukien_ht, ngay_ht_bd, chiphi_dukien, chiphi_thucte,
            nd_bd, ng_thuc_hien, dia_diem_bd, quyen_ng_sd, ng_sd, vitri_ts, dv_bd, dia_chi_nha_cung_cap } = req.body;
        if (!id_ts || !sl_bd || !ngay_bd) {
            return fnc.setError(res, "Missing input value!", 404);
        }
        if (fnc.checkDate(ngay_bd)) {
            ngay_bd = fnc.convertTimestamp(ngay_bd);
        }
        if (fnc.checkDate(ngay_dukien_ht)) {
            ngay_dukien_ht = fnc.convertTimestamp(ngay_dukien_ht);
        }
        if (fnc.checkDate(ngay_ht_bd)) {
            ngay_ht_bd = fnc.convertTimestamp(ngay_ht_bd);
        }
        let type_quyen = req.user.data.type;
        let com_id = req.user.data.com_id;
        let id_ng_tao = req.user.data._id;

        let date_create = new Date().getTime();
        let maxIDTb = 0;
        let Tb = await ThongBao.findOne({}, {}, { sort: { id_tb: -1 } });
        if (Tb) {
            maxIDTb = Tb.id_tb;
        }
        let insert_thongbao = await ThongBao.findOneAndUpdate({
            id_tb: maxIDTb + 1,
            id_cty: com_id,
            id_ng_nhan: com_id,
            id_ng_tao: id_ng_tao,
            type_quyen: 2,
            type_quyen_tao: type_quyen,
            loai_tb: 5,
            add_or_duyet: 1,
            da_xem: 0,
            date_create: date_create
        });
        await insert_thongbao.save()
        let maxIDBD = await fnc.getMaxIdByField(BaoDuong, 'id_bd');
        let insert_taisan = new BaoDuong({
            id_bd: maxIDBD,
            baoduong_taisan: id_ts,
            bd_sl: sl_bd,
            id_cty: com_id,
            bd_tai_congsuat: cs_bd,
            bd_trang_thai: trang_thai_bd,
            bd_ngay_batdau: ngay_bd,
            bd_dukien_ht: ngay_dukien_ht,
            bd_ngay_ht: ngay_ht_bd,
            bd_noi_dung: nd_bd,
            bd_chiphi_dukien: chiphi_dukien,
            bd_chiphi_thucte: chiphi_thucte,
            bd_ng_thuchien: ng_thuc_hien,
            donvi_bd: dv_bd,
            dia_diem_bd: dia_diem_bd,
            diachi_nha_cc: dia_chi_nha_cung_cap,
            bd_type_quyen: type_quyen,
            bd_id_ng_tao: id_ng_tao,
            bd_ng_sd: ng_sd,
            bd_type_quyen_sd: quyen_ng_sd,
            bd_vi_tri_dang_sd: vitri_ts,
            bd_date_create: date_create
        });
        await insert_taisan.save();
        if (quyen_ng_sd == 1) {
            let taisan = await TaiSan.findOne({ ts_id: id_ts, id_cty: com_id });
            if (taisan) {
                let sl_ts_cu = taisan.ts_so_luong;
                let update_sl = sl_ts_cu - sl_bd;
                let update_taisan = await TaiSan.findOneAndUpdate(
                    { ts_id: id_ts, id_cty: com_id },
                    {
                        ts_so_luong: update_sl,
                        soluong_cp_bb: update_sl,
                    });
                let maxIDQTSD = 0;
                let QTSD = await QuaTrinhSuDung.findOne({}, {}, { sort: { quatrinh_id: -1 } });
                if (QTSD) {
                    maxIDQTSD = QTSD.quatrinh_id;
                }
                let qr_qtr_sd = new QuaTrinhSuDung({
                    quatrinh_id: maxIDQTSD + 1,
                    id_ts: id_ts,
                    id_bien_ban: maxIDBD,
                    so_lg: sl_bd,
                    id_cty: com_id,
                    id_cty_sudung: com_id,
                    qt_ngay_thuchien: ngay_bd,
                    qt_nghiep_vu: 5,
                    vitri_ts: vitri_ts,
                    ghi_chu: nd_bd,
                    time_created: new Date().getTime()
                });
                await qr_qtr_sd.save();
            }

        }
        if (quyen_ng_sd == 2) {
            let taisan = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
            if (taisan) {

                let sl_ts_cu = taisan.sl_dang_sd;
                let update_sl = sl_ts_cu - sl_bd;
                let maxIDQTSD = 0;
                let QTSD = await QuaTrinhSuDung.findOne({}, {}, { sort: { quatrinh_id: -1 } });
                if (QTSD) {
                    maxIDBD = maxIDQTSD.quatrinh_id;
                }
                let qr_qtr_sd = new QuaTrinhSuDung({
                    quatrinh_id: maxIDQTSD + 1,
                    id_ts: id_ts,
                    id_bien_ban: last_id,
                    so_lg: sl_bd,
                    id_cty: com_id,
                    id_ng_sudung: ng_sd,
                    qt_ngay_thuchien: ngay_bd,
                    qt_nghiep_vu: 5,
                    vitri_ts: vitri_ts,
                    ghi_chu: nd_bd,
                    time_created: new Date().getTime()
                });
                await qr_qtr_sd.save();

                let update_taisan = await TaiSanDangSuDung.findOneAndUpdate(
                    { com_id_sd: com_id, id_ts_sd: id_ts, id_nv_sd: ng_sd }
                    , {
                        sl_dang_sd: update_sl
                    });
            }
        }
        if (quyen_ng_sd == 3) {
            let taisan = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
            if (taisan) {

                let sl_ts_cu = taisan.sl_dang_sd;
                let update_sl = sl_ts_cu - sl_bd;
                let maxIDQTSD = 0;
                let QTSD = await QuaTrinhSuDung.findOne({}, {}, { sort: { quatrinh_id: -1 } });
                if (QTSD) {
                    maxIDBD = maxIDQTSD.quatrinh_id;
                }
                let qr_qtr_sd = new QuaTrinhSuDung({
                    quatrinh_id: maxIDQTSD + 1,
                    id_ts: id_ts,
                    id_bien_ban: last_id,
                    so_lg: sl_bd,
                    id_cty: com_id,
                    id_ng_sudung: ng_sd,
                    qt_ngay_thuchien: ngay_bd,
                    qt_nghiep_vu: 5,
                    vitri_ts: vitri_ts,
                    ghi_chu: nd_bd,
                    time_created: new Date().getTime()
                });
                await qr_qtr_sd.save();
                let update_taisan = await TaiSanDangSuDung.findOneAndUpdate(
                    { com_id_sd: com_id, id_ts_sd: id_ts, id_pb_sd: ng_sd }
                    , {
                        sl_dang_sd: update_sl
                    });
            }
        }
        fnc.success(res, "ok", { insert_taisan });

    } catch (error) {
        console.log(error)
        return fnc.setError(res, error.message);

    }
}

//chinh sua
exports.updateBaoDuong = async (req, res, next) => {
    try {
        let { id_ts, id_bd, sl_bd, trang_thai_bd, nd_bd, ng_thuc_hien, dia_diem_bd, dv_bd, chiphi_dukien,
            chiphi_thucte, dia_chi_nha_cung_cap, ngay_bd, ngay_dukien_ht, ngay_ht_bd } = req.body;
        let com_id = req.user.data.com_id;
        if (!id_ts || !sl_bd || !nd_bd || !ng_thuc_hien || !chiphi_dukien || !ngay_bd || !ngay_dukien_ht) {
            return fnc.setError(res, "Missing input value!", 404);
        }
        if (!fnc.checkDate(ngay_bd) || !fnc.checkDate(ngay_dukien_ht) || !fnc.checkDate(ngay_ht_bd)) {
            return fnc.setError(res, "Ngay khong dung dinh dang!", 405);
        }
        ngay_bd = fnc.convertTimestamp(ngay_bd);
        ngay_dukien_ht = fnc.convertTimestamp(ngay_dukien_ht);
        ngay_ht_bd = fnc.convertTimestamp(ngay_ht_bd);
        let baoduong = await BaoDuong.findOne({ id_cty: com_id, id_bd: id_bd });
        if (baoduong) {
            let quyen_ng_sd = baoduong.bd_type_quyen_sd;
            let sl_bd_cu = baoduong.bd_sl;
            let ng_sd = baoduong.bd_ng_sd;
            if (quyen_ng_sd == 1) {
                let taisan = await TaiSan.findOne({ ts_id: id_ts, id_cty: com_id });
                if (taisan) {
                    let sl_ts_cu = taisan.ts_so_luong;
                    let sl_ts_ban_dau = sl_ts_cu + sl_bd_cu;
                    let update_sl = sl_ts_ban_dau - sl_bd;
                    let update_taisan = await TaiSan.findOneAndUpdate({ ts_id: id_ts, id_cty: com_id }, {
                        ts_so_luong: update_sl,
                        soluong_cp_bb: update_sl
                    }, { new: true });
                } else {
                    return fnc.setError(res, "Cap nhat so luong tai san that bai!", 406);
                }
            }
            if (quyen_ng_sd == 2) {
                let taisan = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                if (taisan) {
                    let sl_ts_cu = taisan.sl_dang_sd;
                    let sl_ts_ban_dau = sl_ts_cu + sl_bd_cu;
                    let update_sl = sl_ts_ban_dau - sl_bd;
                    let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts }, {
                        sl_dang_sd: update_sl,
                    }, { new: true });
                } else {
                    return fnc.setError(res, "Cap nhat so luong tai san that bai!", 406);
                }
            }
            if (quyen_ng_sd == 3) {
                let taisan = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                if (taisan) {
                    let sl_ts_cu = taisan.sl_dang_sd;
                    let sl_ts_ban_dau = sl_ts_cu + sl_bd_cu;
                    let update_sl = sl_ts_ban_dau - sl_bd;
                    let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts }, {
                        sl_dang_sd: update_sl,
                    }, { new: true });
                } else {
                    return fnc.setError(res, "Cap nhat so luong tai san that bai!", 406);
                }
            }
            baoduong = await BaoDuong.findOneAndUpdate({ id_bd: id_bd, id_cty: com_id }, {
                baoduong_taisan: id_ts,
                bd_sl: sl_bd,
                bd_trang_thai: trang_thai_bd,
                bd_ngay_batdau: ngay_bd,
                bd_dukien_ht: ngay_dukien_ht,
                bd_ngay_ht: ngay_ht_bd,
                bd_noi_dung: nd_bd,
                bd_chiphi_dukien: chiphi_dukien,
                bd_chiphi_thucte: chiphi_thucte,
                bd_ng_thuchien: ng_thuc_hien,
                donvi_bd: dv_bd,
                dia_diem_bd: dia_diem_bd,
                diachi_nha_cc: dia_chi_nha_cung_cap
            }, { new: true });
            if (baoduong) return fnc.success(res, "Update bao duong thanh cong!");
            return fnc.setError(res, "Update bao duong that bai!");
        }
        return fnc.setError(res, "Bao duong not found!");
    } catch (error) {
        return fnc.setError(res, error.message);
    }
}

//lay ra danh sach can bao duong/ dang bao duong/ da bao duong/ quy dinh bao duong/ theo doi cong suat
exports.danhSachBaoDuong = async (req, res, next) => {
    try {
        let { page, pageSize, key, dataType } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        let com_id = req.user.data.com_id;
        let idQLC = req.user.data._id;
        let type = req.user.data.type;
        const findByName = req.body.findByName;

        let cond2 = {}

        let condition = {};
        if (type == 2) {
            condition = { id_cty: com_id, xoa_bd: 0 };
        } else {
            condition = {
                id_cty: com_id, xoa_bd: 0,
                $or: [
                    { bd_id_ng_tao: idQLC },
                    { bd_ng_thuchien: idQLC },
                    { bd_ng_sd: idQLC },
                    { bd_vi_tri_dang_sd: idQLC }
                ]
            };
        }
        //thong ke
        let taiSanCanBD = await fnc.findCount(BaoDuong, { ...condition, bd_trang_thai: { $in: [0, 2] } });

        let taiSanDangBD = await fnc.findCount(BaoDuong, { ...condition, bd_trang_thai: 0 });

        let taiDaBD = await fnc.findCount(BaoDuong, { ...condition, bd_trang_thai: 1 });

        let quyDinhBD = await fnc.findCount(QuyDinhBaoDuong, { id_cty: com_id, qd_xoa: 0 });

        let theoDoiCongSuat = await fnc.findCount(TheoDoiCongSuat, { id_cty: com_id, tdcs_xoa: 0 });

        let thongKe = {
            taiSanCanBD: taiSanCanBD,
            taiSanDangBD: taiSanDangBD,
            taiDaBD: taiDaBD,
            quyDinhBD: quyDinhBD,
            theoDoiCongSuat: theoDoiCongSuat,
        };


        if (key) condition.id_bd = Number(key);
        if (dataType != 1 && dataType != 2 && dataType != 3 && dataType != 4 && dataType != 5) return fnc.setError(res, "Truyen dataType = 1, 2, 3, 4, 5");
        //can bao duong
        if (dataType == 1) {
            condition.bd_trang_thai = { $in: [0, 2] };
        }
        //dang bao duong
        else if (dataType == 2) {
            condition.bd_trang_thai = 0;
        }
        //da bao duong
        else if (dataType == 3) {
            condition.bd_trang_thai = 1;
        }
        //quy dinh
        else if (dataType == 4) {
            let condition2 = { id_cty: com_id, qd_xoa: 0 };
            if (key) condition2.qd_id = Number(key);
            if (type == 2) condition2 = { ...condition2, id_ng_tao_qd: idQLC };
            if(findByName) cond2.LoaiTaiSan = {$regex : findByName}

            let quydinh = await QuyDinhBaoDuong.aggregate([
                { $match: condition2 },
                { $sort: { qd_id: -1 } },
                { $skip: skip },
                { $limit: pageSize },

                //loai tai san
                {
                    $lookup: {
                        from: 'QLTS_Loai_Tai_San',
                        localField: 'id_loai',
                        foreignField: 'id_loai',
                        as: 'LoaiTaiSan',
                    }
                },
                { $unwind: { path: '$LoaiTaiSan', preserveNullAndEmptyArrays: true } },

                //nhom tai san
                {
                    $lookup: {
                        from: 'QLTS_Nhom_Tai_San',
                        localField: 'LoaiTaiSan.id_nhom_ts',
                        foreignField: 'id_nhom',
                        as: 'NhomTaiSan',
                    }
                },
                { $unwind: { path: '$NhomTaiSan', preserveNullAndEmptyArrays: true } },

                //ten don vi do
                {
                    $lookup: {
                        from: 'QLTS_Don_Vi_CS',
                        localField: 'chon_don_vi_do',
                        foreignField: 'id_donvi',
                        as: 'DonVi',
                    }
                },
                { $unwind: { path: '$DonVi', preserveNullAndEmptyArrays: true } },

                //
                {
                    $project: {
                        "qd_id": "$qd_id",
                        "id_cty": "$id_cty",
                        "id_loai": "$id_loai",
                        "LoaiTaiSan": "$LoaiTaiSan.ten_loai",
                        "id_nhom": "$NhomTaiSan.id_nhom",
                        "NhomTaiSan": "$NhomTaiSan.ten_nhom",
                        "bd_noidung": "$bd_noidung",
                        "bd_lap_lai_theo": "$bd_lap_lai_theo",
                        "sl_ngay_lap_lai": "$sl_ngay_lap_lai",
                        "tan_suat_bd": "$tan_suat_bd",
                        "xac_dinh_bd": "$xac_dinh_bd",
                        "thoidiem_bd": "$thoidiem_bd",
                        "sl_ngay_thoi_diem": "$sl_ngay_thoi_diem",
                        "ngay_tu_chon_td": "$ngay_tu_chon_td",
                        "chon_don_vi_do": "$chon_don_vi_do",
                        "DonVi": "$DonVi.ten_donvi",
                        "cong_suat_bd": "$cong_suat_bd",
                        "qd_type_quyen": "$qd_type_quyen",
                        "id_ng_tao_qd": "$id_ng_tao_qd",
                        "qd_date_create": "$qd_date_create",
                    }
                },
                {$match:cond2 },

            ]);
            // let quydinh = await fnc.pageFind(QuyDinhBaoDuong, condition2, { qd_id: -1 }, skip, pageSize);
            let total = await fnc.findCount(QuyDinhBaoDuong, condition2);
            return fnc.success(res, "Lay ra danh sach quy dinh bao duong thanh cong", { page, pageSize, total, thongKe, quydinh });
        }
        //theo doi cong suat
        else if (dataType == 5) {
            let condition2 = { id_cty: com_id, tdcs_xoa: 0 };
            if (key) condition2.id_cs = Number(key);
            // let theoDoiCongSuat = await fnc.pageFind(TheoDoiCongSuat, condition2, { id_cs: -1 }, skip, pageSize);
            let theoDoiCongSuat = await TheoDoiCongSuat.aggregate([
                { $match: condition2 },
                { $sort: { id_cs: -1 } },
                { $skip: skip },
                { $limit: pageSize },

                //loai tai san
                {
                    $lookup: {
                        from: 'QLTS_Loai_Tai_San',
                        localField: 'id_loai',
                        foreignField: 'id_loai',
                        as: 'LoaiTaiSan',
                    }
                },
                { $unwind: { path: '$LoaiTaiSan', preserveNullAndEmptyArrays: true } },

                //tai san
                {
                    $lookup: {
                        from: 'QLTS_Tai_San',
                        localField: 'id_loai',
                        foreignField: 'id_loai_ts',
                        as: 'TaiSan',
                    }
                },
                { $unwind: { path: '$TaiSan', preserveNullAndEmptyArrays: true } },

                //don vi cong suat
                {
                    $lookup: {
                        from: 'QLTS_Don_Vi_CS',
                        localField: 'id_donvi',
                        foreignField: 'id_donvi',
                        as: 'DonViCS',
                    }
                },
                { $unwind: { path: '$DonViCS', preserveNullAndEmptyArrays: true } },

                //
                {
                    $project: {
                        "id_cs": "$id_cs",
                        "id_cty": "$id_cty",
                        "id_taisan": "$TaiSan.ts_id",
                        "ten_taisan": "$TaiSan.ts_ten",
                        "trangthai_taisan": "$TaiSan.ts_trangthai",
                        "id_loai": "$id_loai",
                        "LoaiTaiSan": "$LoaiTaiSan.ten_loai",
                        "id_donvi": "$id_donvi",
                        "DonViCS": "$DonViCS.ten_donvi",
                        "update_cs_theo": "$update_cs_theo",
                        "nhap_ngay": "$nhap_ngay",
                        "chon_ngay": "$chon_ngay",
                        "cs_gannhat": "$cs_gannhat",
                        "tdcs_type_quyen": "$tdcs_type_quyen",
                        "tdcs_id_ng_xoa": "$tdcs_id_ng_xoa",
                        "tdcs_xoa": "$tdcs_xoa",
                        "tdcs_date_create": "$tdcs_date_create",
                        "tdcs_date_delete": "$tdcs_date_delete",
                        "date_update": "$date_update",
                        "tdcs_type_quyen_xoa": "$tdcs_type_quyen_xoa",
                    }
                },
            ]);
            let total = await fnc.findCount(TheoDoiCongSuat, condition2);
            return fnc.success(res, "Lay ra danh sach theo doi cong suat thanh cong", { page, pageSize, total, thongKe, theoDoiCongSuat });
        }

        // let listBaoDuong = await fnc.pageFind(BaoDuong, condition, { id_bd: -1 }, skip, pageSize);
        let listBaoDuong = await BaoDuong.aggregate([
            { $match: condition },
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "baoduong_taisan",
                    foreignField: "ts_id",
                    as: "TaiSan"
                }
            },
            { $unwind: { path: "$TaiSan", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "Users",
                    localField: "bd_id_ng_tao",
                    foreignField: "_id",
                    as: "NguoiTao"
                }
            },
            { $unwind: { path: "$NguoiTao", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'id_bd': '$id_bd',
                    'bd_trang_thai': '$bd_trang_thai',
                    'bd_date_create': '$bd_date_create',
                    'baoduong_taisan': '$baoduong_taisan',
                    'ten_taisan': '$TaiSan.ts_ten',
                    'bd_sl': '$bd_sl',
                    'bd_noi_dung': '$bd_noi_dung',
                    'bd_chiphi_dukien': '$bd_chiphi_dukien',
                    'bd_ngay_batdau': '$bd_ngay_batdau',
                    'bd_dukien_ht': '$bd_dukien_ht',
                    'bd_ngay_ht': '$bd_ngay_ht',
                    'id_cty': '$id_cty',
                    'bd_tai_congsuat': '$bd_tai_congsuat',
                    'bd_cs_dukien': '$bd_cs_dukien',
                    'bd_gannhat': '$bd_gannhat',
                    'bd_chiphi_thucte': '$bd_chiphi_thucte',
                    'bd_ng_thuchien': '$bd_ng_thuchien',
                    'donvi_bd': '$donvi_bd',
                    'dia_diem_bd': '$dia_diem_bd',
                    'diachi_nha_cc': '$diachi_nha_cc',
                    'bd_ngay_sudung': '$bd_ngay_sudung',
                    'bd_type_quyen': '$bd_type_quyen',
                    'bd_id_ng_xoa': '$bd_id_ng_xoa',
                    'bd_id_ng_tao': '$bd_id_ng_tao',
                    'NguoiTao': '$NguoiTao.userName',
                    'bd_ng_sd': '$bd_ng_sd',
                    'bd_type_quyen_sd': '$bd_type_quyen_sd',
                    'bd_vi_tri_dang_sd': '$bd_vi_tri_dang_sd',
                    'xoa_bd': '$xoa_bd',
                    'bd_date_delete': '$bd_date_delete',
                    'lydo_tu_choi': '$lydo_tu_choi',
                    'bd_type_quyen_xoa': '$bd_type_quyen_xoa',
                    'ViTri': '$NguoiTao.address',
                }
            },
            { $skip: skip },
            { $limit: pageSize },
            { $sort: { id_bd: -1 } }
        ]);
        for (let i = 0; i < listBaoDuong.length; i++) {
            let ten_ng_sd = "";
            let ten_vi_tri = "";
            let bd_ng_sd = listBaoDuong[i].bd_ng_sd;
            let infoBaoDuong = listBaoDuong[i];
            if (listBaoDuong[i].bd_type_quyen_sd == 1) {
                let user = await Users.findOne({ _id: bd_ng_sd }, { userName: 1, address: 1 });
                if (user) {
                    ten_ng_sd = user.userName;
                    ten_vi_tri = user.address;
                }
            } else if (listBaoDuong[i].bd_type_quyen_sd == 2) {
                let user = await Users.findOne({ _id: bd_ng_sd }, { userName: 1 });
                if (user) ten_ng_sd = user.userName;

                let department = await Department.findOne({ dep_id: bd_ng_sd }, { dep_name: 1 });
                if (department) ten_vi_tri = department.dep_name;
            } else {
                let department = await Department.findOne({ dep_id: bd_ng_sd }, { dep_name: 1 });
                if (department) {
                    ten_ng_sd = department.dep_name;
                    ten_vi_tri = department.dep_name;
                }
            }
            listBaoDuong[i].ten_ng_sd = ten_ng_sd
            listBaoDuong[i].ten_vi_tri = ten_vi_tri
        }
        const total = await fnc.findCount(BaoDuong, condition);
        return fnc.success(res, "Lay ra danh sach bao duong thanh cong", { page, pageSize, total, thongKe, listBaoDuong });
    } catch (e) {
        return fnc.setError(res, e.message);
    }
}

//tu_choi
exports.TuChoiBaoDuong = async (req, res) => {
    try {
        let { id_bb, content } = req.body;
        let com_id = req.user.data.com_id;
        let id_ng_tao = req.user.data._id;

        let tuchoi_bao_duong = await BaoDuong.findOneAndUpdate({
            id_bd: id_bb,
            id_cty: com_id,
        }, {
            bd_trang_thai: 2,
            lydo_tu_choi: content
        });
        let this_baoduong = await BaoDuong.findOne({
            id_cty: com_id,
            id_bd: id_bb
        });
        if (!this_baoduong) {
            return fnc.setError(res, "khong co thong tin cua bien ban nay");
        }

        let ng_sd = this_baoduong.bd_ng_sd;
        let bd_quyen_sd = this_baoduong.bd_type_quyen_sd;
        let sl_bd = this_baoduong.bd_sl;
        let id_ts = this_baoduong.baoduong_taisan;
        let update_taisan = 0;
        if (bd_quyen_sd == 1) {
            let taisan = await TaiSan.findOne({
                id_cty: com_id,
                ts_id: id_ts
            });
            if (taisan) {
                let sl_ts_cu = taisan.ts_so_luong;
                let update_sl = sl_ts_cu + sl_bd;
                update_taisan = await TaiSan.findOneAndUpdate({
                    id_cty: com_id,
                    ts_id: id_ts
                }, {
                    ts_so_luong: update_sl,
                    soluong_cp_bb: update_sl
                });

            }
        }
        if (bd_quyen_sd == 2) {
            let taisan = TaiSanDangSuDung.findOne({
                com_id_sd: com_id,
                id_nv_sd: ng_sd,
                id_ts_sd: id_ts
            });
            if (taisan) {
                let sl_ts_cu = taisan.sl_dang_sd;
                let update_sl = sl_ts_cu + sl_bd;
                update_taisan = await TaiSanDangSuDung.findOneAndUpdate({
                    com_id_sd: com_id,
                    id_ts_sd: id_ts,
                    id_nv_sd: ng_sd
                }, {
                    sl_dang_sd: update_sl,
                })
            }
        }
        if (bd_quyen_sd == 3) {
            let taisan = await TaiSanDangSuDung.findOne(
                {
                    com_id_sd: com_id,
                    id_pb_sd: ng_sd,
                    id_ts_sd: id_ts
                });
            if (taisan) {
                let sl_ts_cu = taisan.sl_dang_sd;
                let update_sl = sl_ts_cu + sl_bd;
                update_taisan = await TaiSanDangSuDung.findOneAndUpdate({
                    com_id_sd: com_id,
                    id_ts_sd: id_ts,
                    id_pb_sd: ng_sd,
                }, {
                    sl_dang_sd: update_sl
                });

            }
        }


        fnc.success(res, 'sucess', { tuchoi_bao_duong, update_taisan });

    } catch (error) {
        console.log(error)
        return fnc.setError(res, error.message);
    }
}

exports.hoanThanh = async (req, res) => {
    try {
        let { id_bb, chiphi_thucte, day_taisd, ngay_bd_done } = req.body;
        if (id_bb && chiphi_thucte && day_taisd && ngay_bd_done) {
            let com_id = req.user.data.com_id;
            id_bb = Number(id_bb);
            if (fnc.checkDate(day_taisd) && fnc.checkDate(ngay_bd_done)) {
                day_taisd = fnc.convertTimestamp(day_taisd);
                ngay_bd_done = fnc.convertTimestamp(ngay_bd_done);
            } else {
                return fnc.setError(res, "Truyen ngay khong dung dinh dang!");
            }
            let hoan_thanh_bao_duong = await BaoDuong.findOneAndUpdate({ id_bd: id_bb, id_cty: com_id }, {
                bd_trang_thai: 1,
                bd_chiphi_thucte: chiphi_thucte,
                bd_ngay_ht: ngay_bd_done,
                bd_ngay_sudung: day_taisd
            }, { new: true });
            if (hoan_thanh_bao_duong) {
                let quyen_ng_sd = hoan_thanh_bao_duong.bd_type_quyen_sd;
                let id_ts = hoan_thanh_bao_duong.baoduong_taisan;
                let sl_bd = hoan_thanh_bao_duong.bd_sl;
                let ng_sd = hoan_thanh_bao_duong.bd_ng_sd;
                if (quyen_ng_sd == 1) {
                    let taisan = await TaiSan.findOne({ ts_id: id_ts, id_cty: com_id });
                    if (taisan) {
                        let update_sl = sl_bd + taisan.ts_so_luong;
                        let update_taisan = await TaiSan.findOneAndUpdate({ ts_id: id_ts, id_cty: com_id }, {
                            ts_so_luong: update_sl,
                            soluong_cp_bb: update_sl
                        }, { new: true });
                        return fnc.success(res, "Bao duong thanh cong, da cap nhat so luong tai san!")
                    }
                    return fnc.setError(res, "Cap nhat so luong tai san that bai vi khong tim thay tai san !");
                }
                if (quyen_ng_sd == 2) {
                    let taisan = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                    if (taisan) {
                        let update_sl = sl_bd + taisan.sl_dang_sd;
                        let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts }, {
                            sl_dang_sd: update_sl,
                        }, { new: true });
                        return fnc.success(res, "Bao duong thanh cong, da cap nhat so luong tai san!")
                    }
                    return fnc.setError(res, "Cap nhat so luong tai san that bai vi khong tim thay tai san !");
                }
                if (quyen_ng_sd == 3) {
                    let taisan = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                    if (taisan) {
                        let update_sl = sl_bd + taisan.sl_dang_sd;
                        let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts }, {
                            sl_dang_sd: update_sl,
                        }, { new: true });
                        return fnc.success(res, "Bao duong thanh cong, da cap nhat so luong tai san!")
                    }
                    return fnc.setError(res, "Cap nhat so luong tai san that bai vi khong tim thay tai san !");
                }
            }
            return fnc.setError(res, "Bao duong not found!!");
        }
        return fnc.setError(res, "Missing input value!");
    } catch (error) {
        return fnc.setError(res, error.message);
    }
}
//xoa_bd2
exports.delete1 = async (req, res) => {
    try {

        let { datatype, id, } = req.body;
        let com_id = req.user.data.com_id;
        let id_ng_xoa = req.user.data._id;
        let date_delete = new Date().getTime();
        let this_baoduong = await BaoDuong.findOne({
            id_cty: com_id,
            id_bd: id
        });
        let type_quyen = req.user.data.type;
        if (!this_baoduong) {
            return res.status(400).json({ message: "khong co thong tin cua bien ban nay" });
        }

        let ng_sd = this_baoduong.bd_ng_sd;
        let bd_quyen_sd = this_baoduong.bd_type_quyen_sd;
        let sl_bd = this_baoduong.bd_sl;
        let id_ts = this_baoduong.baoduong_taisan;
        let trang_thai_bd = this_baoduong.bd_trang_thai;
        let update_taisan = 0;
        let taisan = 0;
        if (datatype == 1) {
            let baoduong = await BaoDuong.findOneAndUpdate({
                id_bd: id,
                id_cty: com_id
            }, {
                xoa_bd: 1,
                bd_type_quyen_xoa: type_quyen,
                bd_id_ng_xoa: id_ng_xoa,
                bd_date_delete: date_delete
            });
            if (trang_thai_bd == 0) {
                if (bd_quyen_sd == 1) {
                    taisan = await TaiSan.findOne({
                        ts_id: id_ts,
                        id_cty: com_id
                    });
                    let sl_ts_cu = taisan.ts_so_luong;
                    let update_sl = sl_ts_cu + sl_bd;
                    update_taisan = await TaiSan.findOneAndUpdate({
                        id_cty: com_id,
                        ts_id: id_ts
                    }, {
                        ts_so_luong: update_sl,

                    });
                }
                if (bd_quyen_sd == 2) {
                    taisan = await TaiSanDangSuDung.findOne({
                        com_id_sd: com_id,
                        id_nv_sd: ng_sd,
                        id_ts_sd: id_ts
                    });
                    let sl_ts_cu = taisan.sl_dang_sd;
                    let update_sl = sl_ts_cu + sl_bd;
                    update_taisan = await TaiSanDangSuDung.findOneAndUpdate({
                        com_id_sd: com_id,
                        id_nv_sd: ng_sd,
                        id_ts_sd: id_ts
                    }, {
                        sl_dang_sd: update_sl,

                    });
                }
                if (bd_quyen_sd == 3) {
                    taisan = await TaiSanDangSuDung.findOne({
                        com_id_sd: com_id,
                        id_pb_sd: ng_sd,
                        id_ts_sd: id_ts
                    });
                    let sl_ts_cu = taisan.sl_dang_sd;
                    let update_sl = sl_ts_cu + sl_bd;
                    update_taisan = await TaiSanDangSuDung.findOneAndUpdate({
                        com_id_sd: com_id,
                        id_pb_sd: ng_sd,
                        id_ts_sd: id_ts
                    }, {
                        sl_dang_sd: update_sl,

                    });
                }
            }
            fnc.success(res, 'xoa thanh cong ',);
        }
        if (datatype == 2) {
            let khoiphuc = await BaoDuong.findOneAndUpdate({
                id_bd: id,
                id_cty: com_id,
            }, {
                xoa_bd: 0,
                bd_type_quyen_xoa: 0,
                bd_id_ng_xoa: 0,
                bd_date_delete: 0
            });
            if (trang_thai_bd == 0) {
                if (bd_quyen_sd == 1) {
                    taisan = await TaiSan.findOne({
                        ts_id: id_ts,
                        id_cty: com_id
                    });
                    let sl_ts_cu = taisan.ts_so_luong;
                    let update_sl = sl_ts_cu - sl_bd;
                    update_taisan = await TaiSan.findOneAndUpdate({
                        id_cty: com_id,
                        ts_id: id_ts
                    }, {
                        ts_so_luong: update_sl,

                    });
                }
                if (bd_quyen_sd == 2) {
                    taisan = await TaiSanDangSuDung.findOne({
                        com_id_sd: com_id,
                        id_nv_sd: ng_sd,
                        id_ts_sd: id_ts
                    });
                    let sl_ts_cu = taisan.sl_dang_sd;
                    let update_sl = sl_ts_cu - sl_bd;
                    update_taisan = await TaiSanDangSuDung.findOneAndUpdate({
                        com_id_sd: com_id,
                        id_nv_sd: ng_sd,
                        id_ts_sd: id_ts
                    }, {
                        sl_dang_sd: update_sl,

                    });
                }
                if (bd_quyen_sd == 3) {
                    taisan = await TaiSanDangSuDung.findOne({
                        com_id_sd: com_id,
                        id_pb_sd: ng_sd,
                        id_ts_sd: id_ts
                    });
                    let sl_ts_cu = taisan.sl_dang_sd;
                    let update_sl = sl_ts_cu - sl_bd;
                    update_taisan = await TaiSanDangSuDung.findOneAndUpdate({
                        com_id_sd: com_id,
                        id_pb_sd: ng_sd,
                        id_ts_sd: id_ts
                    }, {
                        sl_dang_sd: update_sl,

                    });
                }

            }
            fnc.success(res, 'khoi phuc thanh cong',);
        }
        if (datatype == 3) {
            let xoa_loai = await BaoDuong.findOneAndRemove({
                id_bd: id,
                id_cty: com_id
            });
            fnc.success(res, 'xoa vinh vien thanh cong ');
        }
    } catch (error) {

        return fnc.setError(res, error.message);
    }
}
//xoa_all2
exports.deleteAll = async (req, res) => {
    try {
        let { xoa_vinh_vien, array_xoa } = req.body;
        let com_id = req.user.data.com_id;
        let id_ng_xoa = req.user.data._id;
        let xoa = array_xoa.split(',');
        let dem = xoa.length;
        let type_quyen = req.user.data.type;
        if (xoa_vinh_vien == 0 || xoa_vinh_vien == 2) {
            for (let i = 0; i < dem; i++) {


                let this_bd = await BaoDuong.findOne({
                    //   id_cty: com_id,
                    id_bd: xoa[i]
                })

                let ng_sd = this_bd.bd_ng_sd;
                let bd_quyen_sd = this_bd.bd_type_quyen_sd;
                let sl_bd = this_bd.bd_sl;
                let id_ts = this_bd.baoduong_taisan;
                let trang_thai_bd = this_bd.bd_trang_thai;

                let xoa_bao_duong = {};
                let taisan = {};
                let update_taisan = {};
                if (xoa_vinh_vien == 0) {
                    xoa_bao_duong = await BaoDuong.findOneAndUpdate({
                        id_bd: xoa[i],
                        id_cty: com_id,
                    }, {
                        xoa_bd: 1,
                        bd_type_quyen_xoa: type_quyen,
                        bd_id_ng_xoa: id_ng_xoa
                    });
                }
                if (xoa_vinh_vien == 2) {
                    xoa_bao_duong = await BaoDuong.findOneAndUpdate({
                        id_bd: xoa[i],
                        id_cty: com_id,
                    }, {
                        xoa_bd: 0,
                        bd_type_quyen_xoa: 0,
                        bd_id_ng_xoa: 0
                    });
                }



                if (trang_thai_bd == 0) {
                    if (bd_quyen_sd == 1) {
                        taisan = await TaiSan.findOne({
                            id_cty: com_id,
                            ts_id: id_ts
                        });
                        let sl_ts_cu = taisan.ts_so_luong;
                        let update_sl = 0;
                        if (xoa_vinh_vien == 0) {
                            update_sl = sl_ts_cu + sl_bd;
                        }
                        if (xoa_vinh_vien == 2) {
                            update_sl = sl_ts_cu - sl_bd;
                        }

                        update_taisan = await TaiSan.findOneAndUpdate({
                            id_cty: com_id,
                            ts_id: id_ts
                        }, {
                            ts_so_luong: update_sl
                        });
                    }
                    if (bd_quyen_sd == 2) {
                        taisan = await TaiSanDangSuDung.findOne({
                            com_id_sd: com_id,
                            id_nv_sd: ng_sd,
                            id_ts_sd: id_ts
                        });
                        let update_sl = 0;
                        if (xoa_vinh_vien == 0) {
                            update_sl = sl_ts_cu + sl_bd;
                        }
                        if (xoa_vinh_vien == 2) {
                            update_sl = sl_ts_cu - sl_bd;
                        }
                        update_taisan = await TaiSanDangSuDung.findOneAndUpdate({
                            com_id_sd: com_id,
                            id_ts_sd: id_ts,
                            id_nv_sd: ng_sd
                        }, {
                            sl_dang_sd: update_sl
                        });
                    }
                    if (bd_quyen_sd == 3) {
                        taisan = await TaiSanDangSuDung.findOne({
                            com_id_sd: com_id,
                            id_pb_sd: ng_sd,
                            id_ts_sd: id_ts
                        });
                        let update_sl = 0;
                        if (xoa_vinh_vien == 0) {
                            update_sl = sl_ts_cu + sl_bd;
                        }
                        if (xoa_vinh_vien == 2) {
                            update_sl = sl_ts_cu - sl_bd;
                        }
                        update_taisan = await TaiSanDangSuDung.findOneAndUpdate({
                            com_id_sd: com_id,
                            id_pb_sd: ng_sd,
                            id_ts_sd: id_ts
                        }, {
                            sl_dang_sd: update_sl
                        });
                    }
                }
            }
            fnc.success(res, 'thanh cong ')


        } else {
            let xoa_bao_duong = await BaoDuong.findOneAndRemove({
                id_cty: com_id,
                id_bd: { $in: xoa }
            });
            return fnc.success(res, [xoa_bao_duong]);
        }


    } catch (error) {

        return fnc.setError(res, error.message);
    }
}
