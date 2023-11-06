const ThongBao = require("../../../models/QuanLyTaiSan/ThongBao");
const SuaChua = require("../../../models/QuanLyTaiSan/Sua_chua");
const TaiSan = require('../../../models/QuanLyTaiSan/TaiSan');
const QuaTrinhSuDung = require("../../../models/QuanLyTaiSan/QuaTrinhSuDung");
const TaiSanDangSuDung = require("../../../models/QuanLyTaiSan/TaiSanDangSuDung");
const Users = require("../../../models/Users");
const fnc = require("../../../services/functions")
const Department = require('../../../models/qlc/Deparment');
const ViTriTaISan = require('../../../models/QuanLyTaiSan/ViTri_ts');
//Tài sản đang sửa chữa

//hoanthanh
exports.HoanThanhSuaChua = async(req, res) => {
    let { id_bb, chiphi_thucte, date_nhapkho, date_done, type_quyen_duyet } = req.body;
    let com_id = 0;
    // let id_ng_xoa = 0;

    if (req.user.data.type == 1) {
        com_id = req.user.data.idQLC;
        //  id_ng_xoa = req.user.data.idQLC;

    } else if (req.user.data.type == 2) {
        com_id = req.user.data.com_id;
        // id_ng_xoa = req.user.data.idQLC;

    }
    let ng_duyet = req.user.data._id;

    try {
        if (isNaN(id_bb) || id_bb <= 0) {
            return fnc.setError(res, "id_bb phai la 1 Number lon hon 0")
        }

        let hoan_thanh_sua_chua = await SuaChua.findOneAndUpdate({ sc_id: id_bb, id_cty: com_id }, {
            sc_trangthai: 3,
            sc_chiphi_thucte: chiphi_thucte,
            sc_hoanthanh: date_done,
            sc_ngay_nhapkho: date_nhapkho,
            sc_date_duyet: new Date().getTime(),
            sc_ng_duyet: ng_duyet,
            sc_type_quyet_duyet: type_quyen_duyet
        });
        let q_this_sc = await SuaChua.findOne({ id_cty: com_id, sc_id: id_bb });
        if (q_this_sc) {
            let quyen_ng_sd = q_this_sc.sc_quyen_sd;
            let id_ts = q_this_sc.suachua_taisan;
            let sl_sc = q_this_sc.sl_sc;
            let ng_sd = q_this_sc.sc_ng_sd;
            if (quyen_ng_sd == 1) {
                //sua chua tai san chua cap phat
                let q_taisan = await TaiSan.findOne({ id_cty: com_id, ts_id: id_ts });
                if (q_taisan) {
                    let sl_ts_cu = q_taisan.ts_so_luong;
                    let update_sl = sl_ts_cu + sl_sc;
                    let update_taisan = await TaiSan.findOneAndUpdate({ id_cty: com_id, ts_id: id_ts }, { ts_so_luong: update_sl, soluong_cp_bb: update_sl });
                }
            }
            if (quyen_ng_sd == 2) {
                //tai san cap phat cho nhan vien
                let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                if (q_taisan_doituong) {
                    let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                    let update_sl = sl_ts_cu + sl_sc;
                    let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts }, { sl_dang_sd: update_sl });
                }
            }
            if (quyen_ng_sd == 3) {
                //tai san cap phat cho phong ban
                let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                if (q_taisan_doituong) {
                    let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                    let update_sl = sl_ts_cu + sl_sc;
                    let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts }, { sl_dang_sd: update_sl });
                }
            }

            return fnc.success(res, "cập nhật thành công")
        }
        return fnc.setError(res, "không tìm thấy đối tượng sửa chữa")
    } catch (error) {
        console.log(error);
        return fnc.setError(res, error.message);

    }
}

//edit_suachua
exports.SuaChuaBB = async(req, res) => {
    let { id_sc, sl_sc, trangthai_sc, ngay_sc, ngay_dukien, hoanthanh_sc, chiphi_dukien, chiphi_thucte, nd_sc, ng_thuc_hien } = req.body;
    let dia_diem_sc = req.body.dia_diem_sc || 0;
    let dv_sc = req.body.dv_sc || 0;
    let dia_chi_nha_cung_cap = req.body.dia_chi_nha_cung_cap || 0;
    let com_id = 0;
    if (req.user.data.type == 1) {
        com_id = req.user.data.idQLC;
    } else if (req.user.data.type == 2) {
        com_id = req.user.data.com_id
    }
    try {
        if (isNaN(id_sc) || id_sc <= 0) {
            return res.status(404).json({ message: "id_sc phai la 1 Number lon hon 0" });
        }
        let q_sua_chua = await SuaChua.findOne({ id_cty: com_id, sc_id: id_sc });
        if (q_sua_chua) {
            let sc_quyen_sd = q_sua_chua.sc_quyen_sd;
            let sl_sc_cu = q_sua_chua.sl_sc;
            let ng_sd = q_sua_chua.sc_ng_sd;
            let id_ts = q_sua_chua.suachua_taisan;
            let taisan = {};
            if (sc_quyen_sd == 1) {
                let q_taisan = await TaiSan.findOne({ id_cty: com_id, ts_id: id_ts });
                if (q_taisan) {
                    let sl_ts_cu_ts = q_taisan.ts_so_luong;
                    let sl_ts_ban_dau = (sl_ts_cu_ts + sl_sc_cu);
                    let update_sl = sl_ts_ban_dau - sl_sc;
                    taisan = await TaiSan.findOneAndUpdate({ id_cty: com_id, ts_id: id_ts }, { ts_so_luong: update_sl, soluong_cp_bb: update_sl });
                }
            }
            if (sc_quyen_sd == 2) {
                let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                if (q_taisan_doituong) {
                    let sl_ts_cu_ts = q_taisan_doituong.sl_dang_sd;
                    let sl_ts_ban_dau = sl_ts_cu_ts + sl_sc_cu;
                    let update_sl = sl_ts_ban_dau - sl_sc;
                    taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_ts_sd: id_ts, id_nv_sd: ng_sd }, { sl_dang_sd: update_sl });
                }
            }
            if (sc_quyen_sd == 3) {
                let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                if (q_taisan_doituong) {
                    let sl_ts_cu_ts = q_taisan_doituong.sl_dang_sd;
                    let sl_ts_ban_dau = sl_ts_cu_ts + sl_sc_cu;
                    let update_sl = sl_ts_ban_dau - sl_sc;
                    taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_ts_sd: id_ts, id_pb_sd: ng_sd }, { sl_dang_sd: update_sl });
                }
            }

            await SuaChua.findOneAndUpdate({ id_cty: com_id, sc_id: id_sc }, {
                sl_sc: sl_sc,
                sc_ng_thuchien: ng_thuc_hien,
                sc_trangthai: trangthai_sc,
                sc_ngay: ngay_sc,
                sc_dukien: ngay_dukien,
                sc_hoanthanh: hoanthanh_sc,
                sc_noidung: nd_sc,
                sc_chiphi_dukien: chiphi_dukien,
                sc_chiphi_thucte: chiphi_thucte,
                sc_donvi: dv_sc,
                sc_loai_diadiem: dia_diem_sc,
                sc_diachi: dia_chi_nha_cung_cap,

            })

            return fnc.success(res, "cập nhật thành công")

        }
        return fnc.setError(res, "không tìm thấy đối tượng cần sửa ")

    } catch (error) {
        console.log(error)
        return fnc.setError(res, error.message);
    }

}

exports.listBBDangSuaChua = async(req, res) => {
        try {

            const id_cty = req.user.data.com_id
            const sc_id = req.body.sc_id
            const page = Number(req.body.page) || 1
            const pageSize = Number(req.body.pageSize) || 10
            const skip = (page - 1) * pageSize
            const limit = pageSize
            const data = []
            let tscan_suachua = await SuaChua.find({ id_cty: id_cty, sc_da_xoa: 0, sc_trangthai: { $in: [0, 2] } }).count()
            let tsdang_suachua = await SuaChua.find({ id_cty: id_cty, sc_da_xoa: 0, sc_trangthai: 1 }).count()
            let tsda_suachua = await SuaChua.find({ id_cty: id_cty, sc_da_xoa: 0, sc_trangthai: 3 }).count()
            data.push({ tscan_suachua: tscan_suachua })
            data.push({ tsdang_suachua: tsdang_suachua })
            data.push({ tsda_suachua: tsda_suachua })
            let conditions = {}
            conditions.sc_da_xoa = 0
            conditions.sc_trangthai = 1
            conditions.id_cty = id_cty
            if (sc_id) conditions.sc_id = Number(sc_id)
            const data1 = await SuaChua.aggregate([
                { $match: conditions },
                { $skip: skip },
                { $limit: limit },
                { $sort: { sc_id: -1 } },
                {
                    $lookup: {
                        from: "QLTS_Tai_San",
                        localField: "suachua_taisan",
                        foreignField: "ts_id",
                        as: "infoTS"
                    }
                },
                { $unwind: { path: "$infoTS", preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                        from: "Users",
                        localField: "id_cty",
                        foreignField: "_id",
                        // pipeline: [
                        //     { $match: {$and : [
                        //     { "type" : 1 },
                        //     {"idQLC":{$ne : 0}},
                        //     {"idQLC":{$ne : 1}}] },
                        //     }],
                        as: "infoCtyDangSD"
                    }
                },
                { $unwind: { path: "$infoCtyDangSD", preserveNullAndEmptyArrays: true } },

                {
                    $project: {
                        "sc_id": "$sc_id",
                        "sc_trangthai": "$sc_trangthai",
                        "sc_ngay": "$sc_ngay",
                        "ma_tai_san": "$suachua_taisan",
                        "ten_tai_san": "$infoTS.ts_ten",
                        "sl_sc": "$sl_sc",
                        "doi_tuong_sd": "$infoCtyDangSD.userName",
                        "sc_ngay_hong": "$sc_ngay_hong",
                        "sc_ng_thuchien": "$sc_ng_thuchien",
                        "Vi_tri": "$Vi_tri",
                        "sc_ngay_nhapkho": "$sc_ngay_nhapkho",
                        "sc_ng_duyet": "$sc_ng_duyet",
                        "sc_date_duyet": "$sc_date_duyet",
                        "sc_noidung": "$sc_noidung",
                        "sc_dukien": "$sc_dukien",
                        "sc_hoanthanh": "$sc_hoanthanh",
                        "sc_chiphi_dukien": "$sc_chiphi_dukien",
                        "sc_chiphi_thucte": "$sc_chiphi_thucte",
                        "sc_donvi": "$sc_donvi",
                        "sc_loai_diadiem": "$sc_loai_diadiem",
                        "sc_diachi": "$sc_diachi",
                        "sc_ngay_nhapkho": "$sc_ngay_nhapkho",
                        "sc_lydo_tuchoi": "$sc_lydo_tuchoi",
                        "sc_id_ng_tao": "$sc_id_ng_tao",
                        "sc_ts_vitri": "$sc_ts_vitri",
                        "sc_date_create": "$sc_date_create",
                    }
                }
            ])
            for (let i = 0; i < data1.length; i++) {
                if (data1[i].sc_ngay != 0) data1[i].sc_ngay = new Date(data1[i].sc_ngay * 1000);
                if (data1[i].sc_ngay_nhapkho != 0) data1[i].sc_ngay_nhapkho = new Date(data1[i].sc_ngay_nhapkho * 1000);
                if (data1[i].sc_date_duyet != 0) data1[i].sc_date_duyet = new Date(data1[i].sc_date_duyet * 1000);
                if (data1[i].sc_dukien != 0) data1[i].sc_dukien = new Date(data1[i].sc_dukien * 1000);
                if (data1[i].sc_date_create != 0) data1[i].sc_date_create = new Date(data1[i].sc_date_create * 1000);
            }
            data.push({ list: data1 })
            let totalCount = await SuaChua.count(conditions)

            return fnc.success(res, "lấy thành công", { data, totalCount })
        } catch (error) {
            return fnc.setError(res, error.message);
        }

    }
    //xoa_sc2
exports.XoabbSuaChua = async(req, res) => {
    //nhân viên không có quyền xóa
    //xóa riêng lẻ từng biên bản

    let {
        datatype,
        id, //id bien ban sua chua
    } = req.body;
    let com_id = 0;
    let id_ng_xoa = 0;
    let type_quyen = req.user.data.type;

    if (req.user.data.type == 1) {
        com_id = req.user.data.idQLC;
        id_ng_xoa = req.user.data._id;

    } else if (req.user.data.type == 2) {
        com_id = req.user.data.com_id;
        id_ng_xoa = req.user.data._id;

    }
    try {
        if (isNaN(datatype) || datatype <= 0) {
            return fnc.setError(res, "datatype phai la 1 Number lon hon 0")
        }
        if (isNaN(id) || id <= 0) {
            return fnc.setError(res, "id phai la 1 Number lon hon 0")
        }


        let suachua = await SuaChua.findOne({ id_cty: com_id, sc_id: id });
        if (suachua) {
            let ng_sd = suachua.sc_ng_sd;
            let sc_quyen_sd = suachua.sc_quyen_sd;
            let sl_sc = suachua.sl_sc;
            let id_ts = suachua.suachua_taisan;
            let trang_thai_sc = suachua.sc_trangthai;
            let update_taisan = {};
            let bb_crr = {};
            if (datatype == 1) {
                //xoa 
                bb_crr = await SuaChua.findOneAndUpdate({ sc_id: id, id_cty: com_id }, { sc_da_xoa: 1, sc_type_quyen_xoa: type_quyen, sc_id_ng_xoa: id_ng_xoa, sc_date_delete: new Date().getTime() });
                if (trang_thai_sc == 0) {
                    if (sc_quyen_sd == 1) {
                        let q_taisan = await TaiSan.findOne({ id_cty: com_id, ts_id: id_ts });
                        if (q_taisan) {
                            let sl_ts_cu = q_taisan.ts_so_luong;
                            let update_sl = sl_ts_cu + sl_sc;
                            update_taisan = await TaiSan.findOneAndUpdate({ id_cty: com_id, ts_id: id_ts }, { ts_so_luong: update_sl });
                            return fnc.success(res, "cập nhật thành công")
                        }
                        return fnc.setError(res, "không tìm thấy tài sản")
                    }
                    if (sc_quyen_sd == 2) {
                        let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                        if (q_taisan_doituong) {

                            let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                            let update_sl = sl_ts_cu + sl_sc;
                            update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts }, { sl_dang_sd: update_sl });
                            return fnc.success(res, "cập nhật thành công")
                        }
                        return fnc.setError(res, "không tìm thấy tài sản đang sử dụng ")
                    }
                    if (sc_quyen_sd == 3) {
                        let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                        if (q_taisan_doituong) {
                            let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                            let update_sl = sl_ts_cu + sl_sc;
                            update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts }, { sl_dang_sd: update_sl });
                            return fnc.success(res, "cập nhật thành công")
                        }
                        return fnc.setError(res, "không tìm thấy tài sản đang sử dụng ")
                    }
                }
            } else if (datatype == 2) {
                //khoi phuc
                bb_crr = await SuaChua.findOneAndUpdate({ sc_id: id, id_cty: com_id }, { sc_da_xoa: 0, sc_type_quyen_xoa: 0, sc_id_ng_xoa: 0, sc_date_delete: 0 });
                if (trang_thai_sc == 0) {
                    if (sc_quyen_sd == 1) {
                        let q_taisan = await TaiSan.findOne({ id_cty: com_id, ts_id: id_ts });
                        if (q_taisan) {
                            let sl_ts_cu = q_taisan.ts_so_luong;
                            let update_sl = sl_ts_cu - sl_sc;
                            update_taisan = await TaiSan.findOneAndUpdate({ id_cty: com_id, ts_id: id_ts }, { ts_so_luong: update_sl });
                            return fnc.success(res, "cập nhật thành công")
                        }
                        return fnc.setError(res, "không tìm thấy tài sản ")
                    }
                    if (sc_quyen_sd == 2) {
                        let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                        if (q_taisan_doituong) {
                            let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                            let update_sl = sl_ts_cu - sl_sc;
                            update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts }, { sl_dang_sd: update_sl });
                            return fnc.success(res, "cập nhật thành công")
                        }
                        return fnc.setError(res, "không tìm thấy tài sản đang sử dụng ")
                    }
                    if (sc_quyen_sd == 3) {
                        let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                        if (q_taisan_doituong) {
                            let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                            let update_sl = sl_ts_cu - sl_sc;
                            update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts }, { sl_dang_sd: update_sl });
                            return fnc.success(res, "cập nhật thành công")
                        }
                        return fnc.setError(res, "không tìm thấy tài sản đang sử dụng ")
                    }
                }

            } else if (datatype == 3) {
                //xoa vinh vien
                bb_crr = await SuaChua.findOneAndRemove({ sc_id: id, id_cty: com_id });
                return fnc.success(res, "xoá thành công ")

            }
        }
        return fnc.setError(res, "không tìm thấy đối tượng cần xóa ")
    } catch (error) {
        return fnc.setError(res, error.message)

    }
}

//xoa_all2
exports.deleteAll = async(req, res) => {
    //xoa cùng lúc nhiều biên bản , bao gồm cả khôi phục và xóa vĩnh viễn
    let {
        xoa_vinh_vien,
        array_xoa, // danh sach bien ban muon xoa
    } = req.body;
    let com_id = 0;
    let id_ng_xoa = 0;
    let type_quyen = req.user.data.type;
    if (req.user.data.type == 1) {
        com_id = req.user.data.idQLC;
        id_ng_xoa = req.user.data._id;

    } else if (req.user.data.type == 2) {
        com_id = user_xoa.inForPerson.employee.com_id;
        id_ng_xoa = req.user.data._id;
    }
    try {
        let xoa = array_xoa.split(",");
        let dem = xoa.length;
        let xoa_sua_chua = {};
        let update_taisan = {};

        if (xoa_vinh_vien == 0) {
            //xoa
            for (let i = 0; i < dem; i++) {
                let suachua = await SuaChua.findOne({ id_cty: com_id, sc_id: xoa[i] });
                if (suachua) {
                    let ng_sd = suachua.sc_ng_sd;
                    let sc_quyen_sd = suachua.sc_quyen_sd;
                    let sl_sc = suachua.sl_sc;
                    let id_ts = suachua.suachua_taisan;
                    let trang_thai_sc = suachua.sc_trangthai;
                    xoa_sua_chua = await SuaChua.findOneAndUpdate({ sc_id: xoa[i], id_cty: com_id }, { sc_da_xoa: 1, sc_type_quyen_xoa: type_quyen, sc_id_ng_xoa: id_ng_xoa, sc_date_delete: new Date().getTime() });
                    if (trang_thai_sc == 0) {
                        if (sc_quyen_sd == 1) {
                            let q_taisan = await TaiSan.findOne({ id_cty: com_id, ts_id: id_ts });
                            if (q_taisan) {
                                let sl_ts_cu = q_taisan.ts_so_luong;
                                let update_sl = sl_ts_cu + sl_sc;
                                update_taisan = await TaiSan.findOneAndUpdate({ id_cty: com_id, ts_id: id_ts }, { ts_so_luong: update_sl });
                            }
                        }
                        if (sc_quyen_sd == 2) {
                            let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                            if (q_taisan_doituong) {
                                let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                                let update_sl = sl_ts_cu + sl_sc;
                                update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts }, { sl_dang_sd: update_sl });
                            }
                        }
                        if (sc_quyen_sd == 3) {
                            let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                            if (q_taisan_doituong) {
                                let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                                let update_sl = sl_ts_cu + sl_sc;
                                update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts }, { sl_dang_sd: update_sl });
                            }
                        }
                    }
                }

            }

        } else if (xoa_vinh_vien == 2) {
            //khoi phuc 
            for (let i = 0; i < dem; i++) {
                let suachua = await SuaChua.findOne({ id_cty: com_id, sc_id: xoa[i] });
                if (suachua) {
                    let ng_sd = suachua.sc_ng_sd;
                    let sc_quyen_sd = suachua.sc_quyen_sd;
                    let sl_sc = suachua.sl_sc;
                    let id_ts = suachua.suachua_taisan;
                    let trang_thai_sc = suachua.sc_trangthai;
                    xoa_sua_chua = await SuaChua.findOneAndUpdate({ sc_id: xoa[i], id_cty: com_id }, { sc_da_xoa: 0, sc_type_quyen_xoa: 0, sc_id_ng_xoa: 0, sc_date_delete: 0 });
                    if (trang_thai_sc == 0) {
                        if (sc_quyen_sd == 1) {
                            let q_taisan = await TaiSan.findOne({ id_cty: com_id, ts_id: id_ts });
                            if (q_taisan) {
                                let sl_ts_cu = q_taisan.ts_so_luong;
                                let update_sl = sl_ts_cu - sl_sc;
                                update_taisan = await TaiSan.findOneAndUpdate({ id_cty: com_id, ts_id: id_ts }, { ts_so_luong: update_sl });
                            }

                        }
                        if (sc_quyen_sd == 2) {
                            let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                            if (q_taisan_doituong) {
                                let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                                let update_sl = sl_ts_cu - sl_sc;
                                update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts }, { sl_dang_sd: update_sl });
                            }
                        }
                        if (sc_quyen_sd == 3) {
                            let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                            if (q_taisan_doituong) {
                                let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                                let update_sl = sl_ts_cu - sl_sc;
                                update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts }, { sl_dang_sd: update_sl });
                            }
                        }
                    }
                }

            }
        } else {
            //xoa vinh vien

            for (let i = 0; i < dem; i++) {

                xoa_sua_chua = await SuaChua.findOneAndRemove({ sc_id: xoa[i], id_cty: com_id });
            }
        }
        return fnc.success(res, "xoá thành công ")


    } catch (error) {


        return fnc.setError(res, error.message)


    }
}


exports.details = async(req, res) => {
    let iddsc = req.body.iddsc;
    let com_id = 0;

    if (req.user.data.type == 1) {
        com_id = req.user.data.idQLC;


    } else if (req.user.data.type == 2) {
        com_id = req.user.data.com_id;

    }
    try {
        if (isNaN(iddsc) || iddsc <= 0) {
            fnc.setError(res, "iddsc phai la 1 Number lon hon 0")
        } else {
            let bb = await SuaChua.findOne({ sc_id: iddsc, id_cty: com_id });

            let tenTaiSan = await TaiSan.findOne({ ts_id: Number(bb.suachua_taisan) });


            let nguoiThucHien = await Users.findOne({
                idQLC: bb.sc_ng_thuchien,
                type: { $ne: 1 }
            }) || null;
            let nguoi_tao = await Users.findOne({
                idQLC: bb.sc_id_ng_tao,
                type: { $ne: 1 }
            }) || null;
            let nguoi_duyet = await Users.findOne({
                idQLC: bb.sc_ng_duyet,
                type: { $ne: 1 }

            }) || null;

            let sc_vitri = 0;
            let sc_ng_sd = 0;
            if (bb.sc_quyen_sd == 1) {
                let nguoiSD = await Users.findOne({ idQLC: bb.sc_ng_sd, type: 1 });
                sc_ng_sd = nguoiSD.userName;
                sc_vitri = nguoiSD.address;
            } else if (bb.sc_quyen_sd == 2) {
                let nguoiSD = await Users.findOne({ idQLC: bb.sc_ng_sd, type: { $ne: 1 } });
                sc_ng_sd = nguoiSD.userName;
                let vitri = await Department.findOne({
                    dep_id: nguoiSD.inForPerson.employee.dep_id,
                    com_id: com_id
                });
                sc_vitri = vitri.dep_name;
            } else {
                let dep = await Department.findOne({
                    dep_id: bb.sc_ng_sd,
                    com_id: com_id
                });
                sc_vitri = sc_ng_sd = dep.dep_name;
            }

            let phongban = await Department.findOne({
                dep_id: nguoiThucHien.inForPerson.employee.dep_id,
                com_id: nguoiThucHien.inForPerson.employee.com_id
            }) || null;


            let info_bb = {
                //thong tin chung 
                so_bb: bb.sc_id,
                nguoi_tao: nguoi_tao ? nguoi_tao.userName : null,
                ngay_tao: new Date(bb.sc_date_create * 1000),
                nguoi_duyet: nguoi_duyet ? nguoi_duyet.userName : null,
                ngay_duyet: new Date(bb.sc_date_duyet * 1000),
                trang_thai: bb.sc_trangthai,
                //thong tin tai san
                ma_tai_san: bb.suachua_taisan,
                ten_tai_san: tenTaiSan.ts_ten,
                so_luong: bb.sl_sc,
                doi_tuong_su_dung: sc_ng_sd,
                vi_tri_tai_san: sc_vitri,
                //thong tin sua chua 
                ngay_hong: new Date(bb.sc_ngay_hong * 1000),
                noi_dung_sua_chua: bb.sc_noidung,
                nguoi_thuc_hien: nguoiThucHien ? nguoiThucHien.userName : null,
                phong_ban: phongban ? phongban.dep_name : null,
                ngay_sua_chua: new Date(bb.sc_ngay * 1000),
                ngay_du_kien_hoan_thanh: new Date(bb.sc_dukien * 1000),
                chi_phi_du_kien: bb.sc_chiphi_dukien,
                don_vi_sua_chua: bb.sc_donvi,
                dia_diem_sua_chua: bb.sc_diachi
            };
            fnc.success(res, "ok", { info_bb });

        }
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error.message);
    }
}

//xóa Tài sản đã sủa chữa
//xoa_bb_sua_chua
exports.xoa_bb_sua_chua = async(req, res) => {
        //xóa riêng lẻ từng biên bản 
        //
        let { datatype, id, } = req.body;
        let com_id = 0;
        let id_ng_xoa = 0;
        let type_quyen = req.user.data.type;
        if (req.user.data.type == 1) {
            com_id = req.user.data.idQLC;
            id_ng_xoa = req.user.data._id;

        } else if (req.user.data.type == 2) {
            com_id = req.user.dat.com_id;
            id_ng_xoa = req.user.data._id;

        }
        try {
            if (isNaN(datatype) || isNaN(id) || datatype <= 0 || id <= 0) {
                return res.status(404).json({ message: "datatype, id, phai la 1 so lon hon 0" });
            } else {
                if (datatype == 1) {
                    let suachua = await SuaChua.findOneAndUpdate({ sc_id: id, id_cty: com_id }, { sc_da_xoa: 1, sc_type_quyen_xoa: type_quyen, sc_id_ng_xoa: id_ng_xoa, date_delete: new Date().getTime() });
                    return fnc.success(res, " xoa thanh cong");
                } else if (datatype == 2) {
                    let khoiphuc = await SuaChua.findOneAndUpdate({ sc_id: id, id_cty: com_id }, { sc_da_xoa: 0, sc_type_quyen_xoa: 0, sc_id_ng_xoa: 0 });
                    return fnc.success(res, " khoi phuc thanh cong");
                } else if (datatype == 3) {
                    let xoavinhvien = await SuaChua.findOne({ sc_id: id, id_cty: com_id })
                    if (xoavinhvien) {
                        let xoa = await SuaChua.findOneAndRemove({ sc_id: id, id_cty: com_id });
                        return fnc.success(res, " xoa vinh vien thanh cong");
                    }
                    return fnc.setError(res, "không tìm thấy đối tượng cần xóa")
                } else {
                    return fnc.setError(res, 'datatype phai la 1 so tu 1- 3')
                }
            }
        } catch (error) {
            console.log(error)
            return fnc.setError(res, error.message);
        }
    }
    //xoa_all
exports.xoa_all = async(req, res) => {
    let { xoa_vinh_vien, array_xoa } = req.body;
    let com_id = 0;
    let id_ng_xoa = 0;
    let type_quyen = req.user.data.type;
    //let com_id  =req.comId || 1763; 

    if (req.user.data.type == 1) {
        com_id = req.user.data.idQLC;
        id_ng_xoa = req.user.data._id;

    } else if (req.user.data.type == 2) {
        com_id = req.user.data.com_id;
        id_ng_xoa = req.user.data._id;

    }

    try {

        if (isNaN(xoa_vinh_vien) || isNaN(type_quyen)) {
            return fnc.setError(res, "xoa_vinh_vien,type_quyen phai la 1 so  ");
        } else {
            let xoa = array_xoa.split(",");
            let dem = xoa.length;
            if (xoa_vinh_vien == 0) {
                //xoa
                let xoa_sua_chua = await SuaChua.findOneAndUpdate({ id_cty: com_id, sc_id: { $in: xoa } }, {
                    sc_da_xoa: 1,
                    sc_type_quyen_xoa: type_quyen,
                    sc_id_ng_xoa: id_ng_xoa
                });
                return fnc.success(res, "xoa thanh cong");
            } else if (xoa_vinh_vien == 2) {
                //khoi phuc
                let xoa_sua_chua = await SuaChua.findOneAndUpdate({ id_cty: com_id, sc_id: { $in: xoa } }, {
                    sc_da_xoa: 0,
                    sc_type_quyen_xoa: 0,
                    sc_id_ng_xoa: 0
                });
                return fnc.success(res, "khoi phuc thanh cong");
            } else {
                //xoa vinh vien 
                let xoa_sua_chua = await SuaChua.findOneAndRemove({ id_cty: com_id, sc_id: { $in: xoa } });
                return fnc.success(res, "xoa  vinh vien thanh cong");
            }
        }
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error.message);
    }

}
exports.deleteMany = async(req, res, next) => {
    try {
        const { array_xoa, datatype } = req.body;
        let type_quyen = req.user.data.type;
        let id_ng_xoa = req.user.data._id;
        let com_id = req.user.data.com_id;
        let date_delete = fnc.convertTimestamp(Date.now());
        if (!array_xoa) return fnc.setError(res, "Missing input array_xoa!", 404);
        if (datatype != 1 && datatype != 2 && datatype != 3) return fnc.setError(res, "Truyen datatype = 1, 2, 3!", 405);

        if (datatype == 1) {
            if (Array.isArray(array_xoa) === true) {
                for (let i = 0; i < array_xoa.length; i++) {
                    let cp = await SuaChua.findOneAndUpdate({ sc_id: array_xoa[i], id_cty: com_id }, {
                        sc_da_xoa: 1,
                        sc_type_quyen_xoa: type_quyen,
                        sc_id_ng_xoa: id_ng_xoa,
                        sc_date_delete: new Date().getTime() / 1000
                    }, { new: true });
                }
                return fnc.success(res, "Xoa nhieu tam thoi thanh cong!");
            } else {
                await SuaChua.findOneAndUpdate({ sc_id: array_xoa, id_cty: com_id }, {
                    sc_da_xoa: 1,
                    sc_type_quyen_xoa: type_quyen,
                    sc_id_ng_xoa: id_ng_xoa,
                    sc_date_delete: new Date().getTime() / 1000
                }, { new: true });
                return fnc.success(res, "Xoa 1 tam thoi thanh cong!");
            }
        }
        if (datatype == 2) {
            if (Array.isArray(array_xoa) === true) {
                for (let i = 0; i < array_xoa.length; i++) {
                    let cp = await SuaChua.findOneAndUpdate({ sc_id: array_xoa[i], id_cty: com_id }, {
                        sc_da_xoa: 0,
                        sc_type_quyen_xoa: 0,
                        sc_id_ng_xoa: 0,
                        sc_date_delete: 0
                    }, { new: true });
                }
                return fnc.success(res, "Khoi phuc nhieu thanh cong!");
            } else {
                await SuaChua.findOneAndUpdate({ sc_id: array_xoa, id_cty: com_id }, {
                    sc_da_xoa: 0,
                    sc_type_quyen_xoa: 0,
                    sc_id_ng_xoa: 0,
                    sc_date_delete: 0
                }, { new: true });
                return fnc.success(res, "Khoi phuc 1 thanh cong!");

            }
        }
        if (datatype == 3) {
            if (Array.isArray(array_xoa) === true) {
                for (let i = 0; i < array_xoa.length; i++) {
                    let cp = await SuaChua.deleteOne({ sc_id: array_xoa[i], id_cty: com_id });
                }
                return fnc.success(res, "Xoa vinh vien nhieu thanh cong!");
            } else {
                await SuaChua.deleteOne({ sc_id: array_xoa, id_cty: com_id });
                return fnc.success(res, "Xoa vinh vien 1 thanh cong!");
            }

        }
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error.message);
    }
}


exports.details_bb_da_sua_chua = async(req, res) => {



    let id_bb = req.body.id_bb;
    let com_id = 0;


    if (req.user.data.type == 1) {
        com_id = req.user.data.idQLC;

    } else if (req.user.data.type == 2) {
        com_id = req.user.data.com_id;
    }
    try {

        if (isNaN(id_bb) || id_bb <= 0) {
            return res.status(404).json({ message: "id_bb bien ban phai la 1 so lon hon 0 " });
        } else {
            let bb = await SuaChua.findOne({ sc_id: id_bb, id_cty: com_id });

            let tenTaiSan = await TaiSan.findOne({ ts_id: Number(bb.suachua_taisan), id_cty: com_id });

            let nguoiThucHien = await Users.findOne({
                idQLC: bb.sc_ng_thuchien,
                type: { $ne: 1 }
            }) || null;
            let nguoi_tao = await Users.findOne({
                idQLC: bb.sc_id_ng_tao,
                type: { $ne: 1 }
            }) || null;
            let sc_vitri = 0;
            let sc_ng_sd = 0;
            if (bb.sc_quyen_sd == 1) {
                let nguoiSD = await Users.findOne({ idQLC: bb.sc_ng_sd, type: 1 });
                sc_ng_sd = nguoiSD.userName;
                sc_vitri = nguoiSD.address;
            }
            if (bb.sc_quyen_sd == 2) {
                let nguoiSD = await Users.findOne({ idQLC: bb.sc_ng_sd, type: { $ne: 1 } });
                sc_ng_sd = nguoiSD.userName;
                let vitri = await Department.findOne({
                    dep_id: nguoiSD.inForPerson.employee.dep_id,
                    com_id: com_id
                });
                sc_vitri = vitri.dep_name;
            } else {
                let dep = await Department.findOne({
                    dep_id: bb.sc_ng_sd,
                    com_id: com_id
                });
                sc_vitri = sc_ng_sd = dep.dep_name;
            }

            let phongban = await Department.findOne({
                dep_id: nguoiThucHien.inForPerson.employee.dep_id,
                com_id: nguoiThucHien.inForPerson.employee.com_id
            }) || null;

            let info_bb = {
                //thong tin chung 
                so_bb: bb.sc_id,
                nguoi_tao: nguoi_tao ? nguoi_tao.userName : null,
                ngay_tao: new Date(bb.sc_date_create * 1000),
                ngay_duyet: new Date(bb.sc_date_duyet * 1000),
                trang_thai: bb.sc_trangthai,
                //thong tin tai san
                ma_tai_san: bb.suachua_taisan,
                ten_tai_san: tenTaiSan ? tenTaiSan.ts_ten : null,
                so_luong: bb.sl_sc,
                doi_tuong_su_dung: sc_ng_sd,
                vi_tri_tai_san: sc_vitri,
                ngay_sd: new Date(tenTaiSan.ts_date_sd * 1000),
                //thong tin sua chua 
                ngay_hong: new Date(bb.sc_ngay_hong * 1000),
                noi_dung_sua_chua: bb.sc_noidung,
                nguoi_thuc_hien: nguoiThucHien ? nguoiThucHien.userName : null,
                phong_ban: phongban ? phongban.dep_name : null,
                chi_phi_du_kien: bb.sc_chiphi_dukien,
                chi_phi_thuc_te: bb.sc_chiphi_thucte,
                ngay_sua_chua: new Date(bb.sc_ngay * 1000),
                ngay_du_kien_hoan_thanh: new Date(bb.sc_dukien * 1000),
                ngay_sua_chua_xong: new Date(bb.sc_hoanthanh * 1000),
                don_vi_sua_chua: bb.sc_donvi,
                dia_diem_sua_chua: bb.sc_diachi
            };
            return fnc.success(res, 'thanh cong');
        }
    } catch (error) {

        return fnc.setError(res, error.message);
    }
}
exports.listBBDaSuaChua = async(req, res) => {
        try {

            const id_cty = req.user.data.com_id
            const sc_id = req.body.sc_id
            const page = Number(req.body.page) || 1
            const pageSize = Number(req.body.pageSize) || 10
            const skip = (page - 1) * pageSize
            const limit = pageSize
            const data = []
            let tscan_suachua = await SuaChua.find({ id_cty: id_cty, sc_da_xoa: 0, sc_trangthai: { $in: [0, 2] } }).count()
            let tsdang_suachua = await SuaChua.find({ id_cty: id_cty, sc_da_xoa: 0, sc_trangthai: 1 }).count()
            let tsda_suachua = await SuaChua.find({ id_cty: id_cty, sc_da_xoa: 0, sc_trangthai: 3 }).count()
            data.push({ tscan_suachua: tscan_suachua })
            data.push({ tsdang_suachua: tsdang_suachua })
            data.push({ tsda_suachua: tsda_suachua })
            let conditions = {}
            conditions.sc_da_xoa = 0
            conditions.sc_trangthai = 3
            conditions.id_cty = id_cty
            if (sc_id) conditions.sc_id = Number(sc_id)
            const data1 = await SuaChua.aggregate([
                { $match: conditions },
                { $skip: skip },
                { $limit: limit },
                { $sort: { sc_id: -1 } },
                {
                    $lookup: {
                        from: "QLTS_Tai_San",
                        localField: "suachua_taisan",
                        foreignField: "ts_id",
                        as: "infoTS"
                    }
                },
                { $unwind: { path: "$infoTS", preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                        from: "Users",
                        localField: "id_cty",
                        foreignField: "_id",
                        // pipeline: [
                        //     { $match: {$and : [
                        //     { "type" : 1 },
                        //     {"idQLC":{$ne : 0}},
                        //     {"idQLC":{$ne : 1}}] },
                        //     }],
                        as: "infoCtyDangSD"
                    }
                },
                { $unwind: { path: "$infoCtyDangSD", preserveNullAndEmptyArrays: true } },

                {
                    $project: {
                        "sc_id": "$sc_id",
                        "sc_trangthai": "$sc_trangthai",
                        "sc_ngay": "$sc_ngay",
                        "ma_tai_san": "$suachua_taisan",
                        "ten_tai_san": "$infoTS.ts_ten",
                        "sl_sc": "$sl_sc",
                        "doi_tuong_sd": "$infoCtyDangSD.userName",
                        "sc_ngay_hong": "$sc_ngay_hong",
                        "sc_ng_thuchien": "$sc_ng_thuchien",
                        "Vi_tri": "$Vi_tri",
                        "sc_ngay_nhapkho": "$sc_ngay_nhapkho",
                        "sc_ng_duyet": "$sc_ng_duyet",
                        "sc_date_duyet": "$sc_date_duyet",
                        "sc_noidung": "$sc_noidung",
                        "sc_dukien": "$sc_dukien",
                        "sc_hoanthanh": "$sc_hoanthanh",
                        "sc_chiphi_dukien": "$sc_chiphi_dukien",
                        "sc_chiphi_thucte": "$sc_chiphi_thucte",
                        "sc_donvi": "$sc_donvi",
                        "sc_loai_diadiem": "$sc_loai_diadiem",
                        "sc_diachi": "$sc_diachi",
                        "sc_ngay_nhapkho": "$sc_ngay_nhapkho",
                        "sc_lydo_tuchoi": "$sc_lydo_tuchoi",
                        "sc_id_ng_tao": "$sc_id_ng_tao",
                        "sc_ts_vitri": "$sc_ts_vitri",
                        "sc_date_create": "$sc_date_create",
                    }
                }
            ])
            for (let i = 0; i < data1.length; i++) {
                if (data1[i].sc_ngay != 0) data1[i].sc_ngay = new Date(data1[i].sc_ngay * 1000);
                if (data1[i].sc_ngay_nhapkho != 0) data1[i].sc_ngay_nhapkho = new Date(data1[i].sc_ngay_nhapkho * 1000);
                if (data1[i].sc_date_duyet != 0) data1[i].sc_date_duyet = new Date(data1[i].sc_date_duyet * 1000);
                if (data1[i].sc_dukien != 0) data1[i].sc_dukien = new Date(data1[i].sc_dukien * 1000);
                if (data1[i].sc_date_create != 0) data1[i].sc_date_create = new Date(data1[i].sc_date_create * 1000);
            }
            data.push({ list: data1 })
            let totalCount = await SuaChua.count(conditions)
                // return res.status(200).json({data : {data} , message : "lấy thành công"})
            return fnc.success(res, "lấy thành công", { data, totalCount })
        } catch (error) {
            return fnc.setError(res, error.message);
        }

    }
    //tài sản cần sửa chữa
    //add_suachua
exports.addSuaChua = async(req, res) => {


        try {
            let {
                id_ts,
                sl_sc,
                trangthai_sc,
                loai_bb,
                sc_quyen_sd,
                ng_sd,
                ngay_sc,
                vitri_ts,
                dv_sc,
                dia_chi_nha_cung_cap,
                ngay_dukien,
                hoanthanh_sc,
                chiphi_dukien,
                chiphi_thucte,
                nd_sc,
                ng_thuc_hien,
                dia_diem_sc,
            } = req.body;
            let id_ng_tao = req.user.data._id;
            let type_quyen = req.user.data.type;
            let com_id = req.user.data.com_id;

            let ID_bb_sua_chua = 0;
            let now = new Date()
            let ngay = ""
            if (ngay_sc) {
                ngay = new Date(ngay_sc) / 1000
            } else {
                ngay = now / 1000
            }
            let max_sc = await SuaChua.findOne({}, {}, { sort: { sc_id: -1 } }).lean() || 0;
            let max_tb = await ThongBao.findOne({}, {}, { sort: { id_tb: -1 } }).lean() || 0;
            let max_qtsd = await QuaTrinhSuDung.findOne({}, {}, { sort: { quatrinh_id: -1 } }).lean() || 0;
            let new_thongBao_1 = new ThongBao({
                id_tb: Number(max_tb.id_tb) + 1 || 1,
                id_cty: com_id,
                id_ng_nhan: com_id,
                id_ng_tao: id_ng_tao, //người tạo là công ty 
                type_quyen: 2,
                type_quyen_tao: type_quyen,
                loai_tb: 4,
                add_or_duyet: 1,
                da_xem: 0,
                date_create: Date.parse(now) / 1000
            });
            await new_thongBao_1.save();

            let new_thongBao_2 = new ThongBao({
                id_tb: Number(max_tb.id_tb) + 2 || 1,
                id_cty: com_id,
                id_ng_nhan: com_id,
                id_ng_tao: id_ng_tao, //người tạo là công ty 
                type_quyen: 1,
                loai_tb: 4,
                add_or_duyet: 1,
                da_xem: 0,
                date_create: Date.parse(now) / 1000
            });
            await new_thongBao_2.save();

            let new_thongBao_3 = new ThongBao({
                id_tb: Number(max_tb.id_tb) + 3 || 1,
                id_cty: com_id,
                id_ng_nhan: ng_sd,
                id_ng_tao: id_ng_tao,
                type_quyen: 2,
                type_quyen_tao: type_quyen,
                loai_tb: 4,
                add_or_duyet: 1,
                da_xem: 0,
                date_create: Date.parse(now) / 1000
            });
            await new_thongBao_3.save()


            let bb_sc = 0;
            if (loai_bb == 0) {
                // sc ts da cp
                let new_SuaChua = new SuaChua({
                    sc_id: Number(max_sc.sc_id) + 1 || 1,
                    suachua_taisan: id_ts,
                    sl_sc: sl_sc,
                    id_cty: com_id,
                    sc_ng_thuchien: ng_thuc_hien,
                    sc_trangthai: trangthai_sc,
                    sc_ngay_hong: ngay,
                    sc_ngay: ngay,
                    sc_dukien: ngay_dukien,
                    sc_hoanthanh: hoanthanh_sc,
                    sc_noidung: nd_sc,
                    sc_chiphi_dukien: chiphi_dukien,
                    sc_chiphi_thucte: chiphi_thucte,
                    sc_donvi: dv_sc,
                    sc_loai_diadiem: dia_diem_sc,
                    sc_diachi: dia_chi_nha_cung_cap,
                    sc_ngay_nhapkho: 0,
                    sc_type_quyen: type_quyen,
                    sc_id_ng_tao: id_ng_tao,
                    sc_ng_sd: ng_sd,
                    sc_quyen_sd: sc_quyen_sd,
                    sc_ts_vitri: vitri_ts,
                    sc_date_create: Date.parse(now) / 1000
                });
                await new_SuaChua.save();

                return fnc.success(res, "tạo thành công sửa chữa với loai_bb : 0", { new_SuaChua })


            } else if (loai_bb == 1) {
                // sc ts chua cp
                let new_SuaChua_1 = new SuaChua({
                    sc_id: Number(max_sc.sc_id) + 1 || 1,
                    suachua_taisan: id_ts,
                    sl_sc: sl_sc,
                    id_cty: com_id,
                    sc_ng_thuchien: ng_thuc_hien,
                    sc_trangthai: 1,
                    sc_ngay_hong: ngay,
                    sc_ngay: ngay,
                    sc_dukien: ngay_dukien,
                    sc_hoanthanh: hoanthanh_sc,
                    sc_noidung: nd_sc,
                    sc_chiphi_dukien: chiphi_dukien,
                    sc_chiphi_thucte: chiphi_thucte,
                    sc_donvi: dv_sc,
                    sc_loai_diadiem: dia_diem_sc,
                    sc_diachi: dia_chi_nha_cung_cap,
                    sc_ngay_nhapkho: 0,
                    sc_type_quyen: type_quyen,
                    sc_id_ng_tao: id_ng_tao, //nguoi tao la cong ty 
                    sc_ng_sd: ng_sd,
                    sc_quyen_sd: sc_quyen_sd,
                    sc_ts_vitri: vitri_ts,
                    sc_date_create: Date.parse(now) / 1000
                });
                await new_SuaChua_1.save();
                return fnc.success(res, "tạo thành công sửa chữa với loai_bb : 1", { new_SuaChua_1 })


            }
            let ts = 0;
            if (sc_quyen_sd == 1) {
                // sc tai san chua cap phat
                ts = await TaiSan.findOne({ id_cty: com_id, ts_id: id_ts });
                let sl_ts_cu = ts.ts_so_luong;
                let update_sl = 0;
                if (ts.ts_so_luong > sl_sc) {
                    update_sl = sl_ts_cu - sl_sc;
                    let update_taiSan = await TaiSan.findOneAndUpdate({ id_cty: com_id, ts_id: id_ts }, { ts_so_luong: update_sl, soluong_cp_bb: update_sl });
                    let qr_qtr_sd = new QuaTrinhSuDung({
                        quatrinh_id: Number(max_qtsd.quatrinh_id) + 1 || 1,
                        id_ts: id_ts,
                        id_bien_ban: ID_bb_sua_chua,
                        so_lg: sl_sc,
                        id_cty: com_id,
                        id_cty_sudung: com_id,
                        qt_ngay_thuchien: ngay,
                        qt_nghiep_vu: 4,
                        vitri_ts: vitri_ts,
                        ghi_chu: nd_sc,
                        time_created: Date.parse(now) / 1000
                    });
                    await qr_qtr_sd.save();
                    return fnc.success(res, "tạo thành công qtsd với sc_quyen_sd : 1")
                } else {
                    return fnc.setError(res, "so luong sua chua lon hon so tai san hien co");
                }
            } else if (sc_quyen_sd == 2) {
                // sc tai san cp cho nv
                let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                if (q_taisan_doituong) {
                    let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                    let update_sl = sl_ts_cu - sl_sc;
                    let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_ts_sd: id_ts, id_nv_sd: ng_sd }, { sl_dang_sd: update_sl });
                    let qr_qtr_sd = new QuaTrinhSuDung({
                        quatrinh_id: Number(max_qtsd.quatrinh_id) + 1 || 1,
                        id_ts: id_ts,
                        id_bien_ban: ID_bb_sua_chua,
                        so_lg: sl_sc,
                        id_cty: com_id,
                        id_ng_sudung: ng_sd,
                        qt_ngay_thuchien: ngay,
                        qt_nghiep_vu: 4,
                        vitri_ts: vitri_ts,
                        ghi_chu: nd_sc,
                        time_created: Date.parse(now) / 1000
                    });
                    await qr_qtr_sd.save();
                    return fnc.success(res, "tạo thành công qtsd với sc_quyen_sd : 2")
                }
                return fnc.setError(res, "khong tim thay tai san dang sd");
            } else if (sc_quyen_sd == 3) {
                // sc tai san cp cho phong ban
                let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                if (q_taisan_doituong) {
                    let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                    let update_sl = sl_ts_cu - sl_sc;
                    let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_ts_sd: id_ts, id_pb_sd: ng_sd }, { sl_dang_sd: update_sl });
                    let qr_qtr_sd = new QuaTrinhSuDung({
                        quatrinh_id: Number(max_qtsd.quatrinh_id) + 1 || 1,
                        id_ts: id_ts,
                        id_bien_ban: ID_bb_sua_chua,
                        so_lg: sl_sc,
                        id_cty: com_id,
                        id_phong_sudung: ng_sd,
                        qt_ngay_thuchien: ngay,
                        qt_nghiep_vu: 4,
                        vitri_ts: vitri_ts,
                        ghi_chu: nd_sc,
                        time_created: Date.parse(now) / 1000
                    });
                    await qr_qtr_sd.save();
                    return fnc.success(res, "tạo thành công qtsd với sc_quyen_sd : 3")
                }
                return fnc.setError(res, "khong tim thay tai san dang sd");
            }
        } catch (error) {
            console.log(error)
            return fnc.setError(res, error.message);
        }
    }
    //tu_choi
exports.tuChoiSC = async(req, res) => {
    let { id_bb, content } = req.body;
    let com_id = 0;
    try {
        if (isNaN(id_bb) || id_bb <= 0) {
            return fnc.setError(res, "id_bb phai la 1 Number lon hon 0");
        }
        if (req.user.data.type == 1) {
            com_id = req.user.data.idQLC;
        } else if (req.user.data.type == 2) {
            com_id = req.user.data.com_id;
        }

        let tuchoi_sua_chua = await SuaChua.findOneAndUpdate({ sc_id: id_bb, id_cty: com_id }, { sc_trangthai: 2, sc_lydo_tuchoi: content });
        let q_suachua = await SuaChua.findOne({ id_cty: com_id, sc_id: id_bb });
        if (q_suachua) {
            let ng_sd = q_suachua.sc_ng_sd;
            let sc_quyen_sd = q_suachua.sc_quyen_sd;
            let sl_sc = q_suachua.sl_sc;
            let id_ts = q_suachua.suachua_taisan;
            if (sc_quyen_sd == 1) {
                let q_taisan = await TaiSan.findOne({ id_cty: com_id, ts_id: id_ts });
                if (q_taisan) {
                    let sl_ts_cu = q_taisan.ts_so_luong;
                    let update_sl = sl_ts_cu + sl_sc;
                    let update_taisan = await TaiSan.findOneAndUpdate({ id_cty: com_id, ts_id: id_ts }, { ts_so_luong: update_sl, soluong_cp_bb: update_sl });
                    return fnc.success(res, "success", { update_taisan });
                }
                return fnc.setError(res, " khong tim thay tài sản");
            } else if (sc_quyen_sd == 2) {
                let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                if (q_taisan_doituong) {
                    let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                    let update_sl = sl_ts_cu + sl_sc;
                    let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_ts_sd: id_ts, id_nv_sd: ng_sd }, { sl_dang_sd: update_sl, });
                    return fnc.success(res, "success", { update_taisan });
                }
                return fnc.setError(res, " khong tim thay tài sản đang sử dụng");
            } else if (sc_quyen_sd == 3) {
                let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                if (q_taisan_doituong) {
                    let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                    let update_sl = sl_ts_cu + sl_sc;
                    let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_pb_sd: id_ts, id_nv_sd: ng_sd }, { sl_dang_sd: update_sl, });
                    return fnc.success(res, "success", { update_taisan });
                }
                return fnc.setError(res, " khong tim thay tài sản đang sử dụng");

            } else {
                return fnc.setError(res, " sc_quyen_sd  fails");
            }
        }
        // return fnc.setError(res," khong tim thay bb sửa chữa" );



    } catch (error) {
        console.log(error)
        return fnc.setError(res, error.message);
    }
}

//xoa_sc2
exports.xoaBBcanSC = async(req, res) => {


        //xóa riêng lẻ từng biên bản
        let { datatype, id, } = req.body;
        let com_id = 0;
        let id_ng_xoa = 0;
        let type_quyen = req.user.data.type;
        try {
            if (isNaN(datatype) || datatype <= 0) {
                return fnc.setError(res, "datatype phai la 1 Number lon hon 0");
            }
            if (isNaN(id) || id <= 0) {
                return fnc.setError(res, "id phai la 1 Number lon hon 0");
            }
            if (req.user.data.type == 1) {
                com_id = req.user.data.idQLC;
                id_ng_xoa = req.user.data.idQLC;

            } else if (req.user.data.type == 2) {
                com_id = user_xoa.inForPerson.employee.type.com_id;
                id_ng_xoa = req.user.data._id;

            }
            let q_suachua = await SuaChua.findOne({ id_cty: com_id, sc_id: id });
            if (q_suachua) {
                let ng_sd = q_suachua.sc_ng_sd;
                let sc_quyen_sd = q_suachua.sc_quyen_sd;
                let sl_sc = q_suachua.sl_sc;
                let id_ts = q_suachua.suachua_taisan;
                let trang_thai_sc = q_suachua.sc_trangthai;
                if (datatype == 1) {
                    //xoa
                    let suachua = await SuaChua.findOneAndUpdate({ sc_id: id, id_cty: com_id }, {
                        sc_da_xoa: 1,
                        sc_type_quyen_xoa: type_quyen,
                        sc_id_ng_xoa: id_ng_xoa,
                        sc_date_delete: new Date().getTime()
                    });
                    if (trang_thai_sc == 0) {
                        if (sc_quyen_sd == 1) {
                            let q_taisan = await TaiSan.findOne({ id_cty: com_id, ts_id: id_ts });
                            if (q_taisan) {
                                let sl_ts_cu = q_taisan.ts_so_luong;
                                let update_sl = sl_ts_cu + sl_sc;
                                let update_taisan = await TaiSan.findOneAndUpdate({ id_cty: com_id, ts_id: id_ts }, { ts_so_luong: update_sl });
                                return fnc.success(res, "xoa thanh cong ");
                            }

                        }
                        if (sc_quyen_sd == 2) {
                            let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                            if (q_taisan_doituong) {
                                let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                                let update_sl = sl_ts_cu + sl_sc;
                                let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_ts_sd: id_ts, id_nv_sd: ng_sd }, { sl_dang_sd: update_sl, });
                                return fnc.success(res, "xoa thanh cong ");
                            }
                        }
                        if (sc_quyen_sd == 3) {
                            let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                            if (q_taisan_doituong) {
                                let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                                let update_sl = sl_ts_cu + sl_sc;
                                let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_ts_sd: id_ts, id_pb_sd: ng_sd }, { sl_dang_sd: update_sl, });
                                return fnc.success(res, "xoa thanh cong ");
                            }

                        }
                    }
                    return fnc.success(res, "xoa thanh cong ");
                }
                if (datatype == 2) {
                    //khoiphuc
                    let khoiphuc = await SuaChua.findOneAndUpdate({ sc_id: id, id_cty: com_id }, {
                        sc_da_xoa: 0,
                        sc_type_quyen_xoa: 0,
                        sc_id_ng_xoa: 0,
                        sc_date_delete: 0
                    });
                    if (trang_thai_sc == 0) {

                        if (sc_quyen_sd == 1) {
                            let q_taisan = await TaiSan.findOne({ id_cty: com_id, ts_id: id_ts });
                            if (q_taisan) {
                                let sl_ts_cu = q_taisan.ts_so_luong;
                                let update_sl = sl_ts_cu - sl_sc;
                                let update_taisan = await TaiSan.findOneAndUpdate({ id_cty: com_id, ts_id: id_ts }, { ts_so_luong: update_sl });
                                return fnc.success(res, "khoi phuc thanh cong");
                            }
                        }
                        if (sc_quyen_sd == 2) {
                            let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: ng_sd, id_ts_sd: id_ts });
                            if (q_taisan_doituong) {
                                let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                                let update_sl = sl_ts_cu - sl_sc;
                                let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_ts_sd: id_ts, id_nv_sd: ng_sd }, { sl_dang_sd: update_sl, });
                                return fnc.success(res, "khoi phuc thanh cong");
                            }
                        }
                        if (sc_quyen_sd == 3) {
                            let q_taisan_doituong = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_pb_sd: ng_sd, id_ts_sd: id_ts });
                            if (q_taisan_doituong) {
                                let sl_ts_cu = q_taisan_doituong.sl_dang_sd;
                                let update_sl = sl_ts_cu - sl_sc;
                                let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({ com_id_sd: com_id, id_ts_sd: id_ts, id_pb_sd: ng_sd }, { sl_dang_sd: update_sl, });
                                return fnc.success(res, "khoi phuc thanh cong");
                            }


                        }
                    }
                    return fnc.success(res, "khoi phuc thanh cong ");
                }
                if (datatype == 3) {
                    //xoavinhvien
                    let xoa = await SuaChua.findOneAndRemove({ sc_id: id, id_cty: com_id });
                    return fnc.success(res, "xoa vinh vien thanh cong ");
                }

            }
            return fnc.setError(res, "khong tim thay doi tuong can xoa")
        } catch (error) {
            console.log(error)

            return fnc.setError(res, error.message);
        }
    }
    // chua biết cần trả ra những trường gì vì chưa test được
exports.detailBBCanSuaChua = async(req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const sc_id = req.body.sc_id
        const data = []
        if (sc_id) {
            let conditions = {}
            conditions.sc_da_xoa = 0
            conditions.id_cty = id_cty
            conditions.sc_id = Number(sc_id)
            const data1 = await SuaChua.aggregate([
                { $match: conditions },
                { $sort: { sc_id: -1 } },
                {
                    $lookup: {
                        from: "QLTS_Tai_San",
                        localField: "suachua_taisan",
                        foreignField: "ts_id",
                        as: "infoTS"
                    }
                },
                // { $unwind: "$infoTS" },
                { $unwind: { path: "$infoTS", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "QLTS_ViTri_ts",
                        localField: "sc_ts_vitri",
                        foreignField: "id_vitri",
                        as: "infoVT"
                    }
                },
                { $unwind: { path: "$infoVT", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Users",
                        localField: "id_cty",
                        foreignField: "_id",
                        // pipeline: [
                        //     { $match: {$and : [
                        //     { "type" : 1},
                        //     {"idQLC":{$ne : 0}},
                        //     {"idQLC":{$ne : 1}}] },
                        //     }],
                        as: "infoCtyDangSD"
                    }
                },
                // { $unwind: "$infoCtyDangSD" },
                { $unwind: { path: "$infoCtyDangSD", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Users",
                        localField: "sc_id_ng_tao",
                        foreignField: "_id",
                        // pipeline: [
                        //     { $match: {$and : [
                        //     {"idQLC":{$ne : 0}},
                        //     {"idQLC":{$ne : 1}}] },
                        //     }],
                        as: "infoNV"
                    }
                },
                { $unwind: { path: "$infoNV", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Users",
                        localField: "sc_ng_thuchien",
                        foreignField: "_id",
                        // pipeline: [
                        //     { $match: {$and : [
                        //     { "type" : {$ne : 1 }},
                        //     {"idQLC":{$ne : 0}},
                        //     {"idQLC":{$ne : 1}}] },
                        //     }],
                        as: "infoNV_ng_thuchien"
                    }
                },
                { $unwind: { path: "$infoNV_ng_thuchien", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        "sc_id": "$sc_id",
                        "sc_trangthai": "$sc_trangthai",
                        "sc_ngay": "$sc_ngay",
                        "ma_tai_san": "$suachua_taisan",
                        "ten_tai_san": "$infoTS.ts_ten",
                        "sl_sc": "$sl_sc",
                        "doi_tuong_sd": "$infoCtyDangSD.userName",
                        "sc_ngay_hong": "$sc_ngay_hong",
                        "Vi_tri": "$Vi_tri",
                        "sc_ngay_nhapkho": "$sc_ngay_nhapkho",
                        "sc_ng_duyet": "$sc_ng_duyet",
                        "sc_date_duyet": "$sc_date_duyet",
                        "sc_noidung": "$sc_noidung",
                        "sc_dukien": "$sc_dukien",
                        "sc_hoanthanh": "$sc_hoanthanh",
                        "sc_chiphi_dukien": "$sc_chiphi_dukien",
                        "sc_chiphi_thucte": "$sc_chiphi_thucte",
                        "sc_donvi": "$sc_donvi",
                        "sc_loai_diadiem": "$sc_loai_diadiem",
                        "sc_diachi": "$sc_diachi",
                        "sc_ngay_nhapkho": "$sc_ngay_nhapkho",
                        "sc_lydo_tuchoi": "$sc_lydo_tuchoi",
                        "sc_id_ng_tao": "$sc_id_ng_tao",
                        "sc_ng_thuchien": "$sc_ng_thuchien",
                        "ten_nguoi_tao": "$infoNV.userName",
                        "vi_tri": "$infoVT.vi_tri",
                        "sc_ts_vitri": "$sc_ts_vitri",
                        "ten_nguoi_thuchien": "$infoNV_ng_thuchien.userName",
                        "dep_id": "$infoNV_ng_thuchien.inForPerson.employee.dep_id",
                        "sc_date_create": "$sc_date_create",

                    }
                }
            ])
            for (let i = 0; i < data1.length; i++) {
                let depName = await Department.findOne({ com_id: id_cty, dep_id: data1[i].dep_id })
                data1[i].depName = depName.dep_name
                if (data1[i].sc_ngay != 0) data1[i].sc_ngay = new Date(data1[i].sc_ngay * 1000);
                if (data1[i].sc_ngay_nhapkho != 0) data1[i].sc_ngay_nhapkho = new Date(data1[i].sc_ngay_nhapkho * 1000);
                if (data1[i].sc_date_duyet != 0) data1[i].sc_date_duyet = new Date(data1[i].sc_date_duyet * 1000);
                if (data1[i].sc_dukien != 0) data1[i].sc_dukien = new Date(data1[i].sc_dukien * 1000);
                if (data1[i].sc_hoanthanh != 0) data1[i].sc_hoanthanh = new Date(data1[i].sc_hoanthanh * 1000);
                if (data1[i].sc_date_create != 0) data1[i].sc_date_create = new Date(data1[i].sc_date_create * 1000);
            }
            data.push({ list: data1 })
            return fnc.success(res, "lấy thành công", { data })
        }
        return fnc.setError(res, "vui lòng nhập sc_id");

    } catch (error) {
        return fnc.setError(res, error.message);
    }

}

exports.listBBCanSuaChua = async(req, res) => {
    try {

        const id_cty = req.user.data.com_id
        const sc_id = req.body.sc_id
        const page = Number(req.body.page) || 1
        const pageSize = Number(req.body.pageSize) || 10
        const skip = (page - 1) * pageSize
        const limit = pageSize
        const data = []
        let tscan_suachua = await SuaChua.find({ id_cty: id_cty, sc_da_xoa: 0, sc_trangthai: { $in: [0, 2] } }).count()
        let tsdang_suachua = await SuaChua.find({ id_cty: id_cty, sc_da_xoa: 0, sc_trangthai: 1 }).count()
        let tsda_suachua = await SuaChua.find({ id_cty: id_cty, sc_da_xoa: 0, sc_trangthai: 3 }).count()
        data.push({ tscan_suachua: tscan_suachua })
        data.push({ tsdang_suachua: tsdang_suachua })
        data.push({ tsda_suachua: tsda_suachua })
        let conditions = {}
        conditions.sc_da_xoa = 0
        conditions.sc_trangthai = { $in: [0, 2] }
        conditions.id_cty = id_cty
        if (sc_id) conditions.sc_id = Number(sc_id)
        const data1 = await SuaChua.aggregate([
            { $match: conditions },
            { $skip: skip },
            { $limit: limit },
            { $sort: { sc_id: -1 } },
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "suachua_taisan",
                    foreignField: "ts_id",
                    as: "infoTS"
                }
            },
            { $unwind: { path: "$infoTS", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "Users",
                    localField: "id_cty",
                    foreignField: "_id",
                    // pipeline: [
                    //     { $match: {$and : [
                    //     { "type" : 1},
                    //     {"idQLC":{$ne : 0}},
                    //     {"idQLC":{$ne : 1}}] },
                    //     }],
                    as: "infoCtyDangSD"
                }
            },
            { $unwind: { path: "$infoCtyDangSD", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    "sc_id": "$sc_id",
                    "sc_trangthai": "$sc_trangthai",
                    "sc_ngay": "$sc_ngay",
                    "ma_tai_san": "$suachua_taisan",
                    "ten_tai_san": "$infoTS.ts_ten",
                    "sl_sc": "$sl_sc",
                    "doi_tuong_sd": "$infoCtyDangSD.userName",
                    "sc_ngay_hong": "$sc_ngay_hong",
                    "sc_ng_thuchien": "$sc_ng_thuchien",
                    "Vi_tri": "$Vi_tri",
                    "sc_ngay_nhapkho": "$sc_ngay_nhapkho",
                    "sc_noidung": "$sc_noidung",
                    "sc_dukien": "$sc_dukien",
                    "sc_hoanthanh": "$sc_hoanthanh",
                    "sc_chiphi_dukien": "$sc_chiphi_dukien",
                    "sc_chiphi_thucte": "$sc_chiphi_thucte",
                    "sc_donvi": "$sc_donvi",
                    "sc_loai_diadiem": "$sc_loai_diadiem",
                    "sc_diachi": "$sc_diachi",
                    "sc_ngay_nhapkho": "$sc_ngay_nhapkho",
                    "sc_lydo_tuchoi": "$sc_lydo_tuchoi",
                    "sc_id_ng_tao": "$sc_id_ng_tao",
                    "sc_date_create": "$sc_date_create",

                }
            }
        ])
        for (let i = 0; i < data1.length; i++) {
            if (data1[i].sc_ngay != 0) data1[i].sc_ngay = new Date(data1[i].sc_ngay * 1000);
            if (data1[i].sc_ngay_nhapkho != 0) data1[i].sc_ngay_nhapkho = new Date(data1[i].sc_ngay_nhapkho * 1000);
            if (data1[i].sc_date_duyet != 0) data1[i].sc_date_duyet = new Date(data1[i].sc_date_duyet * 1000);
            if (data1[i].sc_dukien != 0) data1[i].sc_dukien = new Date(data1[i].sc_dukien * 1000);
            if (data1[i].sc_hoanthanh != 0) data1[i].sc_hoanthanh = new Date(data1[i].sc_hoanthanh * 1000);
            if (data1[i].sc_date_create != 0) data1[i].sc_date_create = new Date(data1[i].sc_date_create * 1000);
        }
        data.push({ list: data1 })
        let totalCount = await SuaChua.count(conditions)

        return fnc.success(res, "lấy thành công", { data, totalCount })
    } catch (error) {
        return fnc.setError(res, error.message);
    }

}