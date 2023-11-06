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
const LoaiTaiSan = require('../../../../models/QuanLyTaiSan/LoaiTaiSan');
const func = require('../../../../services/QLTS/qltsService');
// Tĩnh

//Quy dinh bao duong 
//edit_qd_bd
exports.EditRegulations = async (req, res) => {
    try {
        let { id_qd, loai_ts, tan_suat_bd, xac_dinh_bd, bd_noidung, chon_don_vi_do, cong_suat_bd, thoi_diem_bd
            , chon_ngay_tu_chon, nhap_so_ngay, bd_lap_lai_theo, sl_ngay_lap_lai, } = req.body;

        let com_id = req.user.data.com_id;
        if (isNaN(id_qd)) {
            return res.status(404).json({ messagee: 'id_qd have to a Number' });
        }
        let insert_qd = await QuyDinhBaoDuong.findOneAndUpdate({
            id_cty: com_id,
            qd_id: id_qd
        }, {
            id_loai: loai_ts,
            tan_suat_bd: tan_suat_bd,
            bd_lap_lai_theo: bd_lap_lai_theo,
            sl_ngay_lap_lai: sl_ngay_lap_lai,
            bd_noidung: bd_noidung,
            xac_dinh_bd: xac_dinh_bd,
            thoidiem_bd: thoi_diem_bd,
            sl_ngay_thoi_diem: nhap_so_ngay,
            ngay_tu_chon_td: chon_ngay_tu_chon,
            chon_don_vi_do: chon_don_vi_do,
            cong_suat_bd: cong_suat_bd,
        }, { new: true });
        if (!insert_qd) return fnc.setError(res, "Quy dinh not found!");
        fnc.success(res, 'edit sucess');
    } catch (error) {
        console.log(error)
        fnc.setError(res, error.message);
    }
}

//add_qd_bd
exports.addRegulations = async (req, res) => {
    try {
        let { loai_ts, tan_suat_bd, xac_dinh_bd, bd_noidung, chon_don_vi_do, cong_suat_bd, thoi_diem_bd, nhap_so_ngay,
            chon_ngay_tu_chon, bd_lap_lai_theo, sl_ngay_lap_lai, } = req.body;
        if (!loai_ts || !bd_noidung) {
            return fnc.setError(res, "Missing input value!");
        }
        let type_quyen = req.user.data.type;
        let com_id = req.user.data.com_id;
        let id_ng_tao = req.user.data.idQLC;

        if (chon_ngay_tu_chon && fnc.checkDate(chon_ngay_tu_chon)) {
            chon_ngay_tu_chon = fnc.convertTimestamp(chon_ngay_tu_chon);
        } else chon_ngay_tu_chon = fnc.convertTimestamp(Date.now());

        let date_create = new Date().getTime();

        let qd_xoa = 0;

        let qd_bd = await QuyDinhBaoDuong.findOne({
            id_cty: com_id,
            id_loai: loai_ts
        });

        if (!qd_bd) {
            let maxId = 0;
            let maxQDBD = await QuyDinhBaoDuong.findOne({}, {}, { sort: { qd_id: -1 } });
            if (maxQDBD) {
                maxId = maxQDBD.qd_id
            }
            let last_id = maxId + 1;
            let insert_nhacnho = 0;
            let insert_qd = new QuyDinhBaoDuong({
                qd_id: maxId + 1,
                id_cty: com_id,
                id_loai: loai_ts,
                tan_suat_bd: tan_suat_bd,
                bd_lap_lai_theo: bd_lap_lai_theo,
                sl_ngay_lap_lai: sl_ngay_lap_lai,
                bd_noidung: bd_noidung,
                xac_dinh_bd: xac_dinh_bd,
                thoidiem_bd: thoi_diem_bd,
                sl_ngay_thoi_diem: nhap_so_ngay,
                ngay_tu_chon_td: chon_ngay_tu_chon,
                chon_don_vi_do: chon_don_vi_do,
                cong_suat_bd: cong_suat_bd,
                qd_type_quyen: type_quyen,
                id_ng_tao_qd: id_ng_tao,
                qd_xoa: qd_xoa,
                qd_date_create: date_create
            });

            await insert_qd.save();
            let taisan = await TaiSan.find({
                id_cty: com_id,
                id_loai_ts: loai_ts
            });

            // ADD NHẮC NHỞ BẢO DƯỠNG
            taisan.map(async (item, index) => {
                let id_ts_nhac_nho = item.ts_id;
                let ngay_co_ts = item.ts_date_create;
                let tong_so_ngay_lap_lai = 0;
                let ngay_sd_ts = 0;
                let ngay_thong_bao = 0;
                // ĐỊNH KỲ
                if (tan_suat_bd == 1) {
                    if (bd_lap_lai_theo == 0) {
                        tong_so_ngay_lap_lai = sl_ngay_lap_lai * 86400;
                    }
                    if (bd_lap_lai_theo == 1) {
                        tong_so_ngay_lap_lai = sl_ngay_lap_lai * 86400 * 30;
                    }
                    if (bd_lap_lai_theo == 2) {
                        tong_so_ngay_lap_lai = sl_ngay_lap_lai * 86400 * 90;
                    }
                    if (bd_lap_lai_theo == 3) {
                        tong_so_ngay_lap_lai = sl_ngay_lap_lai * 86400 * 365;
                    }
                    if (xac_dinh_bd == 0 || xac_dinh_bd == 2) {
                        if (thoi_diem_bd == 0 || thoi_diem_bd == 1) {
                            ngay_sd_ts = ngay_co_ts + (nhap_so_ngay * 86400);
                            ngay_thong_bao = ngay_sd_ts + tong_so_ngay_lap_lai;
                            let maxId = await func.maxIDNhacNho(NhacNho);
                            insert_nhacnho = new NhacNho({
                                id_nhac_nho: maxId + 1,
                                id_cty: com_id,
                                id_ts_nhac_nho: id_ts_nhac_nho,
                                id_quy_dinh_bd: last_id,
                                tan_suat: tan_suat_bd,
                                so_ngay_lap_lai: sl_ngay_lap_lai,
                                thoigian_or_congsuat: xac_dinh_bd,
                                congsuat_hientai: 0,
                                cong_suat_nhac_nho: cong_suat_bd,
                                xem_or_chuaxem: 0,
                                ngay_nhac_nho: ngay_thong_bao,
                                bd_lap_lai_theo: bd_lap_lai_theo
                            });
                            await insert_nhacnho.save();
                        }
                        else {
                            ngay_thong_bao = chon_ngay_tu_chon + tong_so_ngay_lap_lai;
                            let maxId = await func.maxIDNhacNho(NhacNho);
                            insert_nhacnho = new NhacNho({
                                id_nhac_nho: maxId + 1,
                                id_cty: com_id,
                                id_ts_nhac_nho: id_ts_nhac_nho,
                                id_quy_dinh_bd: last_id,
                                tan_suat: tan_suat_bd,
                                so_ngay_lap_lai: sl_ngay_lap_lai,
                                thoigian_or_congsuat: xac_dinh_bd,
                                congsuat_hientai: 0,
                                cong_suat_nhac_nho: cong_suat_bd,
                                xem_or_chuaxem: 0,
                                ngay_nhac_nho: ngay_thong_bao,
                                bd_lap_lai_theo: bd_lap_lai_theo
                            });
                            await insert_nhacnho.save();
                        }

                    }
                    // if(xac_dinh_bd ==  1){

                    // }


                } else {
                    if (xac_dinh_bd == 0) {
                        if (thoi_diem_bd == 0 || thoi_diem_bd == 1) {
                            ngay_thong_bao = ngay_co_ts + (nhap_so_ngay * 86400);
                            let maxId = await func.maxIDNhacNho(NhacNho);
                            insert_nhacnho = new NhacNho({
                                id_nhac_nho: maxId + 1,
                                id_cty: com_id,
                                id_ts_nhac_nho: id_ts_nhac_nho,
                                id_quy_dinh_bd: last_id,
                                tan_suat: tan_suat_bd,
                                so_ngay_lap_lai: sl_ngay_lap_lai,
                                thoigian_or_congsuat: xac_dinh_bd,
                                congsuat_hientai: 0,
                                cong_suat_nhac_nho: cong_suat_bd,
                                xem_or_chuaxem: 0,
                                ngay_nhac_nho: ngay_thong_bao,
                                bd_lap_lai_theo: bd_lap_lai_theo
                            });
                            await insert_nhacnho.save();
                        } else {
                            ngay_thong_bao = chon_ngay_tu_chon;
                            let maxId = await func.maxIDNhacNho(NhacNho);
                            insert_nhacnho = new NhacNho({
                                id_nhac_nho: maxId + 1,
                                id_cty: com_id,
                                id_ts_nhac_nho: id_ts_nhac_nho,
                                id_quy_dinh_bd: last_id,
                                tan_suat: tan_suat_bd,
                                so_ngay_lap_lai: sl_ngay_lap_lai,
                                thoigian_or_congsuat: xac_dinh_bd,
                                congsuat_hientai: 0,
                                cong_suat_nhac_nho: cong_suat_bd,
                                xem_or_chuaxem: 0,
                                ngay_nhac_nho: ngay_thong_bao,
                                bd_lap_lai_theo: bd_lap_lai_theo
                            });
                            await insert_nhacnho.save();
                        }
                    }
                }

            })
            return fnc.success(res, 'add qd_bd success', { insert_qd, insert_nhacnho });
        } else {

            fnc.success(res, 'quy dinh da ton tai');
        }

    } catch (error) {
        console.log(error);
        fnc.setError(res, error.message);
    }

}

exports.xoaQuyDinhBaoDuong = async (req, res) => {
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
            await QuyDinhBaoDuong.deleteMany({ qd_id: { $in: idArraya }, id_cty: id_com });
            return fnc.success(res, 'Xoa vinh vien thanh cong!');
        } else if (type == 0) {
            // thay đổi trạng thái là 1
            let idArray = id.map(idItem => parseInt(idItem));
            await QuyDinhBaoDuong.updateMany(
                {
                    qd_id: { $in: idArray },
                    qd_xoa: 0
                },
                { qd_xoa: 1, qd_type_quyen_xoa: type_quyen, qd_id_ng_xoa: idQLC, qd_date_delete: date }
            );
            return fnc.success(res, 'Xoa tam thoi thanh cong!');
        } else if (type == 2) {
            // Khôi phục bảo dưỡng
            let idArray = id.map(idItem => parseInt(idItem));
            await QuyDinhBaoDuong.updateMany(
                { qd_id: { $in: idArray }, qd_xoa: 1 },
                { qd_xoa: 0, qd_type_quyen_xoa: 0, qd_id_ng_xoa: 0, qd_date_delete: "" }
            );
            return fnc.success(res, 'Khoi phuc thanh cong!');
        } else {
            return fnc.setError(res, 'không thể thực thi!', 400);
        }
    } catch (e) {
        return fnc.setError(res, e.message);
    }
}