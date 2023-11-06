const capPhat = require('../../models/QuanLyTaiSan/CapPhat')
const TaiSan = require('../../models/QuanLyTaiSan/TaiSan')
const suaChua = require('../../models/QuanLyTaiSan/Sua_chua')
const BaoDuong = require('../../models/QuanLyTaiSan/BaoDuong')
const dangSd = require('../../models/QuanLyTaiSan/TaiSanDangSuDung')
const Mat = require('../../models/QuanLyTaiSan/Mat')
const Huy = require('../../models/QuanLyTaiSan/Huy')
const ThanhLy = require('../../models/QuanLyTaiSan/ThanhLy')
const fnc = require('../../services/functions')

exports.Home = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        let data = {}
        let q_ts_chua_sd = await TaiSan.find({ id_cty: id_cty, ts_da_xoa: 0 })
        let sl_chua_sd = 0;
        let gt_ts_chua_sd = 0;
        q_ts_chua_sd.forEach(function (value_ts_chua_sd) {
            sl_chua_sd += value_ts_chua_sd.ts_so_luong;
            gt_ts_chua_sd += value_ts_chua_sd.ts_gia_tri * value_ts_chua_sd.ts_so_luong;
        });
        data.sl_chua_sd = sl_chua_sd
        data.gt_ts_chua_sd = gt_ts_chua_sd
        let q_ts_dang_sd = await dangSd.aggregate([
            { $match: { id_cty: id_cty } },

            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "id_sd",
                    foreignField: "ts_id",
                    as: "info"
                }
            },
            { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$id_sd",
                    ts_id: { $first: "$info.ts_id" },
                    id_cty: { $first: "$com_id_sd" },
                    ts_gia_tri: { $first: "$info.ts_gia_tri" },
                    ts_so_luong: { $first: "$sl_dang_sd" }
                }
            },
        ])
        let sl_dang_sd = 0;
        let gt_ts_dang_sd = 0;
        q_ts_dang_sd.forEach(function (value_ts_dang_sd) {
            sl_dang_sd += value_ts_dang_sd.ts_so_luong;
            gt_ts_dang_sd += value_ts_dang_sd.ts_gia_tri * value_ts_dang_sd.ts_so_luong;
        });
        let tong_gt_ts = (gt_ts_dang_sd + gt_ts_chua_sd)
        let tong_sl_ts = (sl_chua_sd + sl_dang_sd)
        data.sl_dang_sd = sl_dang_sd
        data.gt_ts_dang_sd = gt_ts_dang_sd
        data.tong_gt_ts = tong_gt_ts
        data.tong_sl_ts = tong_sl_ts
        let q_ts_sua_chua = await suaChua.aggregate([
            { $match: { id_cty: id_cty } },
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "suachua_taisan",
                    foreignField: "ts_id",
                    as: "info"
                }
            },
            { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },

            {
                $group: {
                    _id: "$sc_id",
                    ts_id: { $first: "$info.ts_id" },
                    id_cty: { $first: "$id_cty" },
                    ts_gia_tri: { $first: "$info.ts_gia_tri" },
                    ts_so_luong: { $first: "$sl_sc" }
                }
            },
        ])
        let sl_dang_sc = 0;
        let gt_ts_dang_sc = 0;
        q_ts_sua_chua.forEach(function (value_ts_dang_sd) {
            gt_ts_dang_sc += value_ts_dang_sd.ts_gia_tri * value_ts_dang_sd.ts_so_luong;
            sl_dang_sc += value_ts_dang_sd.ts_so_luong;
        });

        let q_ts_bao_duong = await BaoDuong.aggregate([
            { $match: { id_cty: id_cty } },
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "baoduong_taisan",
                    foreignField: "ts_id",
                    as: "info"
                }
            },
            { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },

            {
                $group: {
                    _id: "$id_bd",
                    ts_id: { $first: "$info.ts_id" },
                    id_cty: { $first: "$id_cty" },
                    ts_gia_tri: { $first: "$info.ts_gia_tri" },
                    ts_so_luong: { $first: "$bd_sl" }
                }
            },

        ])
        let sl_dang_bd = 0;
        let gt_ts_dang_bd = 0;
        q_ts_bao_duong.forEach(function (value_ts_dang_sd) {
            gt_ts_dang_bd += value_ts_dang_sd.ts_gia_tri * value_ts_dang_sd.ts_so_luong;
            sl_dang_bd += value_ts_dang_sd.ts_so_luong;
        });
        let sl_tong_sc_bd = (sl_dang_sc + sl_dang_bd)
        let sl_tong_gt_sc_bd = (gt_ts_dang_bd + gt_ts_dang_sc)
        data.sl_tong_sc_bd = sl_tong_sc_bd
        data.sl_tong_gt_sc_bd = sl_tong_gt_sc_bd

        let q_ts_mat = await Mat.aggregate([
            { $match: { id_cty: id_cty } },
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "mat_taisan",
                    foreignField: "ts_id",
                    as: "info"
                }
            },
            { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$mat_id",
                    ts_id: { $first: "$info.ts_id" },
                    id_cty: { $first: "$id_cty" },
                    ts_gia_tri: { $first: "$info.ts_gia_tri" },
                    ts_so_luong: { $first: "$mat_soluong" }
                }
            },
            { $match: { id_cty: id_cty } },
        ])
        let sl_mat = 0;
        let gt_ts_mat = 0;
        q_ts_mat.forEach(function (value_ts_dang_sd) {
            gt_ts_mat += value_ts_dang_sd.ts_gia_tri * value_ts_dang_sd.ts_so_luong;
            sl_mat += value_ts_dang_sd.ts_so_luong;
        });

        let q_ts_huy = await Huy.aggregate([
            { $match: { id_cty: id_cty } },
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "huy_taisan",
                    foreignField: "ts_id",
                    as: "info"
                }
            },
            { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$huy_id",
                    ts_id: { $first: "$info.ts_id" },
                    id_cty: { $first: "$id_cty" },
                    ts_gia_tri: { $first: "$info.ts_gia_tri" },
                    ts_so_luong: { $first: "$huy_soluong" }
                }
            },
        ])
        let sl_huy = 0;
        let gt_ts_huy = 0;
        q_ts_huy.forEach(function (value_ts_dang_sd) {
            gt_ts_huy += value_ts_dang_sd.ts_gia_tri * value_ts_dang_sd.ts_so_luong;
            sl_huy += value_ts_dang_sd.ts_so_luong;
        });

        let q_ts_thanhly = await ThanhLy.aggregate([
            { $match: { id_cty: id_cty } },
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "thanhly_taisan",
                    foreignField: "ts_id",
                    as: "info"
                }
            },
            { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$tl_id",
                    ts_id: { $first: "$info.ts_id" },
                    id_cty: { $first: "$id_cty" },
                    ts_gia_tri: { $first: "$info.ts_gia_tri" },
                    ts_so_luong: { $first: "$tl_soluong" }
                }
            },
        ])
        let sl_thanhly = 0;
        let gt_ts_thanhly = 0;
        q_ts_thanhly.forEach(function (value_ts_dang_sd) {
            gt_ts_thanhly += value_ts_dang_sd.ts_gia_tri * value_ts_dang_sd.ts_so_luong;
            sl_thanhly += value_ts_dang_sd.ts_so_luong;
        });
        let sl_m_h_tl = (sl_mat + sl_huy + sl_thanhly)
        let gt_m_h_tl = (gt_ts_mat + gt_ts_huy + gt_ts_thanhly)
        data.sl_m_h_tl = sl_m_h_tl
        data.gt_m_h_tl = gt_m_h_tl

        let now = new Date()
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        let nextMonth = ""
        let next_year = ""
        if (month == 12) {
            nextMonth = 1;
            next_year = year + 1
        } else {
            nextMonth = month + 1
            next_year = year
        }
        const first_month = `${year}-${month}-01`
        const next_month = `${next_year}-${nextMonth}-01`
        let q_ts_trong_thang = await TaiSan.find({ id_cty: id_cty, ts_date_create: { $gte: Date.parse(first_month) / 1000, $lte: Date.parse(next_month) / 1000 } })
        let sl_ts_trong_thang = 0;
        let gt_ts_trong_thang = 0;
        q_ts_trong_thang.forEach(function (value_ts_chua_sd) {
            sl_ts_trong_thang += value_ts_chua_sd.ts_so_luong;
            gt_ts_trong_thang += value_ts_chua_sd.ts_gia_tri * value_ts_chua_sd.ts_so_luong;
        });
        data.sl_ts_trong_thang = sl_ts_trong_thang
        data.gt_ts_trong_thang = gt_ts_trong_thang
        return fnc.success(res, "lay thanh cong", { data })
    } catch (e) {
        return fnc.setError(res, e.message)
    }
}