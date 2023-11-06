const thongBao = require('../../../models/QuanLyTaiSan/ThongBao')
const DieuChuyen = require("../../../models/QuanLyTaiSan/DieuChuyen");
const ViTriTaiSan = require('../../../models/QuanLyTaiSan/ViTri_ts');
const TaiSanViTri = require('../../../models/QuanLyTaiSan/TaiSanVitri');
const TaiSan = require("../../../models/QuanLyTaiSan/TaiSan");
const fnc = require("../../../services/functions");
const department = require('../../../models/qlc/Deparment');
const BaoDuong = require("../../../models/QuanLyTaiSan/BaoDuong");
const Users = require('../../../models/Users')
const capPhat = require('../../../models/QuanLyTaiSan/CapPhat')
const ThuHoi = require('../../../models/QuanLyTaiSan/ThuHoi')
const TaiSanDangSuDung = require('../../../models/QuanLyTaiSan/TaiSanDangSuDung')
const TaiSanDaiDienNhan = require('../../../models/QuanLyTaiSan/TaiSanDaiDienNhan')
const QuaTrinhSuDung = require('../../../models/QuanLyTaiSan/QuaTrinhSuDung')
exports.create = async(req, res) => {
    try { //code theo PHP : add_dc_ts.php
        const id_cty = req.user.data.com_id
        const idQLC = req.user.data._id
        const dieuchuyen_taisan = req.body.dieuchuyen_taisan
        const loai_dc = req.body.loai_dc
        const ng_thuc_hien = req.body.ng_thuc_hien
        const vi_tri_dc_tu = req.body.vi_tri_dc_tu
        const vitri_dc_den = req.body.vitri_dc_den
        const dc_ngay = new Date(req.body.ngay_dc)
        const ly_do_dc = req.body.ly_do_dc
        const id_dai_dien_nhan = req.body.id_dai_dien_nhan
        const khoi_chon_phong_ban_nv = req.body.khoi_chon_phong_ban_nv
        const khoi_chon_phong_ban_nv_den = req.body.khoi_chon_phong_ban_nv_den
        const khoi_dc_tu = req.body.khoi_dc_tu
        const khoi_dc_den = req.body.khoi_dc_den
        const khoi_ng_dai_dien_dc_den = req.body.khoi_ng_dai_dien_dc_den
        const khoi_ng_dai_dien_dc_tu = req.body.khoi_ng_dai_dien_dc_tu
        const dc_trangthai = req.body.dc_trangthai
        const dc_da_xoa = req.body.dc_da_xoa
        const date_delete = req.body.date_delete
        const id_daidien_nhan = req.body.id_daidien_nhan
            //thongbao
        const type_quyen = req.type
        const id_ng_nhan = req.body.id_ng_nhan

        let maxThongBao = await thongBao.findOne({}, {}, { sort: { id_tb: -1 } }).lean() || 0;
        let maxDieuChuyen = await DieuChuyen.findOne({}, {}, { sort: { dc_id: -1 } }).lean() || 0;
        let now = new Date()
        let ds_dc = ""
        if (dieuchuyen_taisan) ds_dc = JSON.parse(dieuchuyen_taisan).ds_dc;
        const updated_ds_dc = ds_dc.map((item) => ({
            ts_id: item[0],
            sl_ts: item[1]
        }));
        // let updateThongBao = new thongBao({
        //     id_tb : Number(maxThongBao.id_tb) +1 || 1,
        //     id_ts : updated_ds_dc[0].ts_id,
        //     id_cty : id_cty,
        //     id_ng_tao : idQLC,
        //     type_quyen :1,
        //     type_quyen_tao:1,
        //     loai_tb: 3,
        //     add_or_duyet: 1,
        //     da_xem: 0,
        //     date_create :  Date.parse(now)/1000,
        //  })
        //  await updateThongBao.save()
        if (loai_dc == 0) {
            let insert_dc_vt = new DieuChuyen({
                dc_id: Number(maxDieuChuyen.dc_id) + 1 || 1,
                id_cty: id_cty,
                dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                id_ng_thuchien: ng_thuc_hien,
                vi_tri_dc_tu: vi_tri_dc_tu,
                dc_vitri_tsnhan: vitri_dc_den,
                id_daidien_nhan: id_daidien_nhan,
                dc_type_quyen: type_quyen,
                dc_type: loai_dc,
                dc_ngay: Date.parse(dc_ngay) / 1000,
                vitri_ts_daidien: id_dai_dien_nhan,
                dc_lydo: ly_do_dc,
                id_ng_tao_dc: idQLC,
                dc_date_create: Date.parse(now) / 1000,
            })
            await insert_dc_vt.save()
            let updateThongBaoNguoiNhan = new thongBao({
                id_tb: Number(maxThongBao.id_tb) + 1 || 1,
                id_ng_nhan: id_ng_nhan,
                id_cty: id_cty,
                id_ng_tao: idQLC,
                type_quyen: 2,
                type_quyen_tao: type_quyen,
                loai_tb: 3,
                add_or_duyet: 1,
                da_xem: 0,
                date_create: Date.parse(now) / 1000,
            })
            await updateThongBaoNguoiNhan.save()
            let updateThongBaoDaidienNhan = new thongBao({
                id_tb: Number(maxThongBao.id_tb) + 2 || 2,
                id_ng_nhan: id_dai_dien_nhan,
                id_cty: id_cty,
                id_ng_tao: idQLC,
                type_quyen: 2,
                type_quyen_tao: type_quyen,
                loai_tb: 3,
                add_or_duyet: 1,
                da_xem: 0,
                date_create: Date.parse(now) / 1000,
            })
            await updateThongBaoDaidienNhan.save()
            return fnc.success(res, "tạo thành công", { insert_dc_vt, updateThongBaoNguoiNhan, updateThongBaoDaidienNhan })
        } else if (loai_dc == 1) {
            if (khoi_chon_phong_ban_nv == 0 && khoi_chon_phong_ban_nv_den == 0) {
                let insert_dc_vt = new DieuChuyen({
                    dc_id: Number(maxDieuChuyen.dc_id) + 1 || 1,
                    id_cty: id_cty,
                    dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                    id_ng_thuchien: ng_thuc_hien,
                    id_nv_dangsudung: khoi_dc_tu,
                    id_nv_nhan: khoi_dc_den,
                    dc_lydo: ly_do_dc,
                    vi_tri_dc_tu: vi_tri_dc_tu,
                    dc_vitri_tsnhan: vitri_dc_den,
                    dc_ngay: Date.parse(dc_ngay) / 1000,
                    dc_trangthai: dc_trangthai,
                    dc_type_quyen: type_quyen,
                    dc_type: loai_dc,
                    id_ng_tao_dc: idQLC,
                    xoa_dieuchuyen: dc_da_xoa,
                    dc_date_create: Date.parse(now) / 1000,
                    dc_date_delete: date_delete,
                })
                await insert_dc_vt.save()
                let updateThongBaoNguoiNhan = new thongBao({
                    id_tb: Number(maxThongBao.id_tb) + 1 || 1,
                    id_cty: id_cty,
                    id_ng_nhan: ng_thuc_hien,
                    id_ng_tao: idQLC,
                    type_quyen: 2,
                    type_quyen_tao: type_quyen,
                    loai_tb: 3,
                    add_or_duyet: 1,
                    da_xem: 0,
                    date_create: Date.parse(now) / 1000,
                })
                await updateThongBaoNguoiNhan.save()
                let updateThongBaoDaidienNhan = new thongBao({
                    id_tb: Number(maxThongBao.id_tb) + 2 || 2,
                    id_cty: id_cty,
                    id_ng_nhan: khoi_dc_den,
                    id_ng_tao: idQLC,
                    type_quyen: 2,
                    type_quyen_tao: type_quyen,
                    loai_tb: 3,
                    add_or_duyet: 1,
                    da_xem: 0,
                    date_create: Date.parse(now) / 1000,
                })
                await updateThongBaoDaidienNhan.save()
                return fnc.success(res, "tạo thành công", { insert_dc_vt, updateThongBaoNguoiNhan, updateThongBaoDaidienNhan })

            } else if (khoi_chon_phong_ban_nv == 1 && khoi_chon_phong_ban_nv_den == 0) {
                let insert_dc_vt = new DieuChuyen({
                    dc_id: Number(maxDieuChuyen.dc_id) + 1 || 1,
                    id_cty: id_cty,
                    dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                    id_ng_thuchien: ng_thuc_hien,
                    id_pb_dang_sd: khoi_dc_tu,
                    id_daidien_dangsd: khoi_ng_dai_dien_dc_tu,
                    id_nv_nhan: khoi_dc_den,
                    dc_lydo: ly_do_dc,
                    vi_tri_dc_tu: vi_tri_dc_tu,
                    dc_vitri_tsnhan: vitri_dc_den,
                    dc_ngay: Date.parse(dc_ngay) / 1000,
                    dc_trangthai: dc_trangthai,
                    dc_type_quyen: type_quyen,
                    dc_type: loai_dc,
                    id_ng_tao_dc: idQLC,
                    xoa_dieuchuyen: dc_da_xoa,
                    dc_date_create: Date.parse(now) / 1000,
                    dc_date_delete: date_delete,
                })
                await insert_dc_vt.save()
                let updateThongBaoNguoiNhan = new thongBao({
                    id_tb: Number(maxThongBao.id_tb) + 1 || 1,
                    id_cty: id_cty,
                    id_ng_nhan: ng_thuc_hien,
                    id_ng_tao: idQLC,
                    type_quyen: 2,
                    type_quyen_tao: type_quyen,
                    loai_tb: 3,
                    add_or_duyet: 1,
                    da_xem: 0,
                    date_create: Date.parse(now) / 1000,
                })
                await updateThongBaoNguoiNhan.save()
                let updateThongBaoDaidienNhan = new thongBao({
                    id_tb: Number(maxThongBao.id_tb) + 2 || 2,
                    id_cty: id_cty,
                    id_ng_nhan: khoi_dc_den,
                    id_ng_tao: idQLC,
                    type_quyen: 2,
                    type_quyen_tao: type_quyen,
                    loai_tb: 3,
                    add_or_duyet: 1,
                    da_xem: 0,
                    date_create: Date.parse(now) / 1000,
                })
                await updateThongBaoDaidienNhan.save()
                return fnc.success(res, "tạo thành công", { insert_dc_vt, updateThongBaoNguoiNhan, updateThongBaoDaidienNhan })

            } else if (khoi_chon_phong_ban_nv == 0 && khoi_chon_phong_ban_nv_den == 1) {
                let insert_dc_vt = new DieuChuyen({
                    dc_id: Number(maxDieuChuyen.dc_id) + 1 || 1,
                    id_cty: id_cty,
                    dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                    id_ng_thuchien: ng_thuc_hien,
                    id_nv_dangsudung: khoi_dc_tu,
                    id_pb_nhan: khoi_dc_den,
                    id_daidien_nhan: khoi_ng_dai_dien_dc_den,
                    dc_lydo: ly_do_dc,
                    vi_tri_dc_tu: vi_tri_dc_tu,
                    dc_vitri_tsnhan: vitri_dc_den,
                    dc_ngay: Date.parse(dc_ngay) / 1000,
                    dc_trangthai: dc_trangthai,
                    dc_type_quyen: type_quyen,
                    dc_type: loai_dc,
                    id_ng_tao_dc: idQLC,
                    xoa_dieuchuyen: dc_da_xoa,
                    dc_date_create: Date.parse(now) / 1000,
                    dc_date_delete: date_delete,
                })
                await insert_dc_vt.save()
                let updateThongBaoNguoiNhan = new thongBao({
                    id_tb: Number(maxThongBao.id_tb) + 1 || 1,
                    id_cty: id_cty,
                    id_ng_nhan: ng_thuc_hien,
                    id_ng_tao: idQLC,
                    type_quyen: 2,
                    type_quyen_tao: type_quyen,
                    loai_tb: 3,
                    add_or_duyet: 1,
                    da_xem: 0,
                    date_create: Date.parse(now) / 1000,
                })
                await updateThongBaoNguoiNhan.save()
                let updateThongBaoDaidienNhan = new thongBao({
                    id_tb: Number(maxThongBao.id_tb) + 2 || 2,
                    id_cty: id_cty,
                    id_ng_nhan: khoi_ng_dai_dien_dc_den,
                    id_ng_tao: idQLC,
                    type_quyen: 2,
                    type_quyen_tao: type_quyen,
                    loai_tb: 3,
                    add_or_duyet: 1,
                    da_xem: 0,
                    date_create: Date.parse(now) / 1000,
                })
                await updateThongBaoDaidienNhan.save()
                return fnc.success(res, "tạo thành công", { insert_dc_vt, updateThongBaoNguoiNhan, updateThongBaoDaidienNhan })

            } else if (khoi_chon_phong_ban_nv == 1 && khoi_chon_phong_ban_nv_den == 1) {
                let insert_dc_vt = new DieuChuyen({
                    dc_id: Number(maxDieuChuyen.dc_id) + 1 || 1,
                    id_cty: id_cty,
                    dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                    id_ng_thuchien: ng_thuc_hien,
                    id_pb_dang_sd: khoi_dc_tu,
                    id_daidien_dangsd: khoi_ng_dai_dien_dc_tu,
                    id_pb_nhan: khoi_dc_den,
                    id_daidien_nhan: khoi_ng_dai_dien_dc_den,
                    dc_lydo: ly_do_dc,
                    vi_tri_dc_tu: vi_tri_dc_tu,
                    dc_vitri_tsnhan: vitri_dc_den,
                    dc_ngay: Date.parse(dc_ngay) / 1000,
                    dc_trangthai: dc_trangthai,
                    dc_type_quyen: type_quyen,
                    dc_type: loai_dc,
                    id_ng_tao_dc: idQLC,
                    xoa_dieuchuyen: dc_da_xoa,
                    dc_date_create: Date.parse(now) / 1000,
                    dc_date_delete: date_delete,
                })
                await insert_dc_vt.save()
                let updateThongBaoNguoiNhan = new thongBao({
                    id_tb: Number(maxThongBao.id_tb) + 1 || 1,
                    id_cty: id_cty,
                    id_ng_nhan: ng_thuc_hien,
                    id_ng_tao: idQLC,
                    type_quyen: 2,
                    type_quyen_tao: type_quyen,
                    loai_tb: 3,
                    add_or_duyet: 1,
                    da_xem: 0,
                    date_create: Date.parse(now) / 1000,
                })
                await updateThongBaoNguoiNhan.save()
                let updateThongBaoDaidienNhan = new thongBao({
                    id_tb: Number(maxThongBao.id_tb) + 2 || 2,
                    id_cty: id_cty,
                    id_ng_nhan: id_dai_dien_nhan,
                    id_ng_tao: idQLC,
                    type_quyen: 2,
                    type_quyen_tao: type_quyen,
                    loai_tb: 3,
                    add_or_duyet: 1,
                    da_xem: 0,
                    date_create: Date.parse(now) / 1000,
                })
                await updateThongBaoDaidienNhan.save()
                return fnc.success(res, "tạo thành công", { insert_dc_vt, updateThongBaoNguoiNhan, updateThongBaoDaidienNhan })

            } else {
                return fnc.setError(res, "loai_dc 1 nhưng lỗi ở khoi_chon_phong_ban_nv và khoi_chon_phong_ban_nv_den")

            }
        } else if (loai_dc == 2) {
            let insert_dc_vt = new DieuChuyen({
                dc_id: Number(maxDieuChuyen.dc_id) + 1 || 1,
                id_cty: id_cty,
                dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                id_ng_thuchien: ng_thuc_hien,
                id_cty_dang_sd: khoi_dc_tu,
                id_daidien_dangsd: khoi_ng_dai_dien_dc_tu,
                id_cty_nhan: khoi_dc_den,
                id_daidien_nhan: khoi_ng_dai_dien_dc_den,
                dc_lydo: ly_do_dc,
                vi_tri_dc_tu: vi_tri_dc_tu,
                dc_vitri_tsnhan: vitri_dc_den,
                dc_ngay: Date.parse(dc_ngay) / 1000,
                dc_trangthai: dc_trangthai,
                dc_type_quyen: type_quyen,
                dc_type: loai_dc,
                id_ng_tao_dc: idQLC,
                xoa_dieuchuyen: dc_da_xoa,
                dc_date_create: Date.parse(now) / 1000,
                dc_date_delete: date_delete,
            })
            await insert_dc_vt.save()
            return fnc.success(res, "tạo thành công", { insert_dc_vt })
        } else {
            return fnc.setError(res, " lỗi không điền loai_dc")
        }
    } catch (e) {
        return fnc.setError(res, e.message)
    }
}

exports.edit = async(req, res) => {
    try { //code theo PHP : edit_dc_ts.php
        const id_cty = req.user.data.com_id
        const idQLC = req.user.data.idQLC
        const dieuchuyen_taisan = req.body.dieuchuyen_taisan
        const loai_dc = req.body.loai_dc
        const ng_thuc_hien = req.body.ng_thuc_hien
        const vi_tri_dc_tu = req.body.vi_tri_dc_tu
        const vitri_dc_den = req.body.vitri_dc_den
        const dc_ngay = new Date(req.body.ngay_dc)
        const ly_do_dc = req.body.ly_do_dc
        const dc_id = req.body.dc_id
        const khoi_chon_phong_ban_nv = req.body.khoi_chon_phong_ban_nv
        const khoi_chon_phong_ban_nv_den = req.body.khoi_chon_phong_ban_nv_den
        const khoi_dc_tu = req.body.khoi_dc_tu
        const khoi_dc_den = req.body.khoi_dc_den
        const khoi_ng_dai_dien_dc_den = req.body.khoi_ng_dai_dien_dc_den
        const khoi_ng_dai_dien_dc_tu = req.body.khoi_ng_dai_dien_dc_tu
        const dai_dien_nhan = req.body.dai_dien_nhan
        let updated_ds_dc = ""
        let now = new Date()
        if (dieuchuyen_taisan) {
            const ds_dc = JSON.parse(dieuchuyen_taisan).ds_dc;
            updated_ds_dc = ds_dc.map((item) => ({
                ts_id: item[0],
                sl_ts: item[1]
            }));
        }

        if (loai_dc == 0) {
            const DC = await DieuChuyen.findOne({ dc_id: dc_id });
            if (DC) {
                await DieuChuyen.updateOne({ dc_id: dc_id }, {
                    dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                    id_ng_thuchien: ng_thuc_hien,
                    dc_ngay: Date.parse(dc_ngay) / 1000,
                    dc_lydo: ly_do_dc,
                    vi_tri_dc_tu: vi_tri_dc_tu,
                    dc_vitri_tsnhan: vitri_dc_den,
                    vitri_ts_daidien: dai_dien_nhan,
                })
                return fnc.success(res, "cập nhật thành công", { DC })
            }
            return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);

        } else if (loai_dc == 1) {
            if (khoi_chon_phong_ban_nv == 0 && khoi_chon_phong_ban_nv_den == 0) {
                const DC = await DieuChuyen.findOne({ dc_id: dc_id });
                if (DC) {
                    await DieuChuyen.updateOne({ dc_id: dc_id }, {
                        dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                        id_ng_thuchien: ng_thuc_hien,
                        id_nv_dangsudung: khoi_dc_tu,
                        id_pb_dang_sd: 0,
                        id_daidien_dangsd: 0,
                        id_nv_nhan: khoi_dc_den,
                        id_pb_nhan: 0,
                        id_daidien_nhan: 0,
                        vi_tri_dc_tu: vi_tri_dc_tu,
                        dc_vitri_tsnhan: vitri_dc_den,
                        dc_ngay: Date.parse(dc_ngay) / 1000,
                        dc_lydo: ly_do_dc,
                    })
                    return fnc.success(res, "cập nhật thành công", { DC })
                }
                return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);
            } else if (khoi_chon_phong_ban_nv == 1 && khoi_chon_phong_ban_nv_den == 0) {
                const DC = await DieuChuyen.findOne({ dc_id: dc_id });
                if (DC) {
                    await DieuChuyen.updateOne({ dc_id: dc_id }, {
                        dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                        id_ng_thuchien: ng_thuc_hien,
                        id_nv_dangsudung: 0,
                        id_pb_dang_sd: khoi_dc_tu,
                        id_daidien_dangsd: khoi_ng_dai_dien_dc_tu,
                        id_nv_nhan: khoi_dc_den,
                        id_pb_nhan: 0,
                        id_daidien_nhan: 0,
                        vi_tri_dc_tu: vi_tri_dc_tu,
                        dc_vitri_tsnhan: vitri_dc_den,
                        dc_ngay: Date.parse(dc_ngay) / 1000,
                        dc_lydo: ly_do_dc,
                    })
                    return fnc.success(res, "cập nhật thành công", { DC })
                }
                return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);
            } else if (khoi_chon_phong_ban_nv == 0 && khoi_chon_phong_ban_nv_den == 1) {
                const DC = await DieuChuyen.findOne({ dc_id: dc_id });
                if (DC) {
                    await DieuChuyen.updateOne({ dc_id: dc_id }, {
                        dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                        id_ng_thuchien: ng_thuc_hien,
                        id_nv_dangsudung: khoi_dc_tu,
                        id_pb_dang_sd: 0,
                        id_daidien_dangsd: 0,
                        id_nv_nhan: 0,
                        id_pb_nhan: khoi_dc_den,
                        id_daidien_nhan: khoi_ng_dai_dien_dc_den,
                        vi_tri_dc_tu: vi_tri_dc_tu,
                        dc_vitri_tsnhan: vitri_dc_den,
                        dc_ngay: Date.parse(dc_ngay) / 1000,
                        dc_lydo: ly_do_dc,
                    })
                    return fnc.success(res, "cập nhật thành công", { DC })
                }
                return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);
            } else if (khoi_chon_phong_ban_nv == 1 && khoi_chon_phong_ban_nv_den == 1) {
                const DC = await DieuChuyen.findOne({ dc_id: dc_id });
                if (DC) {
                    await DieuChuyen.updateOne({ dc_id: dc_id }, {
                        dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                        id_ng_thuchien: ng_thuc_hien,
                        id_nv_dangsudung: 0,
                        id_pb_dang_sd: khoi_dc_tu,
                        id_daidien_dangsd: khoi_ng_dai_dien_dc_tu,
                        id_nv_nhan: 0,
                        id_pb_nhan: khoi_dc_den,
                        id_daidien_nhan: khoi_ng_dai_dien_dc_den,
                        vi_tri_dc_tu: vi_tri_dc_tu,
                        dc_vitri_tsnhan: vitri_dc_den,
                        dc_ngay: Date.parse(dc_ngay) / 1000,
                        dc_lydo: ly_do_dc,
                    })
                    return fnc.success(res, "cập nhật thành công", { DC })
                }
                return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);
            } else {
                return fnc.setError(res, "loai_dc 1 nhưng sửa lỗi ở khoi_chon_phong_ban_nv và khoi_chon_phong_ban_nv_den")
            }
        } else if (loai_dc == 2) {
            const DC = await DieuChuyen.findOne({ dc_id: dc_id });
            if (DC) {
                await DieuChuyen.updateOne({ dc_id: dc_id }, {
                    dieuchuyen_taisan: { ds_dc: updated_ds_dc },
                    id_ng_thuchien: ng_thuc_hien,
                    id_cty_dang_sd: khoi_dc_tu,
                    id_daidien_dangsd: khoi_ng_dai_dien_dc_tu,
                    id_cty_nhan: khoi_dc_den,
                    id_daidien_nhan: khoi_ng_dai_dien_dc_den,
                    vi_tri_dc_tu: vi_tri_dc_tu,
                    dc_vitri_tsnhan: vitri_dc_den,
                    dc_ngay: Date.parse(dc_ngay) / 1000,
                    dc_lydo: ly_do_dc,
                })
                return fnc.success(res, "cập nhật thành công", { DC })
            }
            return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);
        } else {
            return fnc.setError(res, " lỗi không điền loai_dc")
        }
    } catch (e) {
        return fnc.setError(res, e.message)
    }
}

//code theo dieuchuyen_dvQL2.php

exports.list = async(req, res, next) => {
    try {
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        const id_cty = req.user.data.com_id
        const idQLC = req.user.data.idQLC
        const dc_id = req.body.dc_id
        const dc_trangthai = req.body.dc_trangthai
        const type = req.body.type
            // let data = []

        let Num_dc_vitri = await DieuChuyen.find({ id_cty: id_cty, xoa_dieuchuyen: 0, dc_type: 0 }).count()
        let Num_dc_doituong = await DieuChuyen.find({ id_cty: id_cty, xoa_dieuchuyen: 0, dc_type: 1 }).count()
        let Num_dcdvQL = await DieuChuyen.find({ id_cty: id_cty, xoa_dieuchuyen: 0, dc_type: 2 }).count()
        let numAllocaction = await capPhat.distinct('id_ng_thuchien', { id_cty: id_cty, cp_da_xoa: 0 })
        let numRecall = await ThuHoi.distinct('id_ng_thuhoi', { id_cty: id_cty, xoa_thuhoi: 0 })
        let dem_bg = (numAllocaction.length + numRecall.length)
        let thongKe = {
            Num_dc_vitri: Num_dc_vitri,
            Num_dc_doituong: Num_dc_doituong,
            Num_dcdvQL: Num_dcdvQL,
            dem_bg: dem_bg,
        };
        // data.push({Num_dc_vitri : Num_dc_vitri})
        // data.push({Num_dc_doituong : Num_dc_doituong})
        // data.push({Num_dcdvQL : Num_dcdvQL})
        // data.push({dem_bg : dem_bg})
        let filter = {};
        filter.id_cty = id_cty
        filter.xoa_dieuchuyen = 0
        filter.dc_type = 0
        if (dc_id) filter.dc_id = Number(dc_id)
        if (dc_trangthai) filter.dc_trangthai = Number(dc_trangthai)
            //1: điều chuyển vị trí tài sản
        if (type == 1) {
            filter.dc_type = 0

            let data = await DieuChuyen.aggregate([
                { $match: filter },
                { $sort: { dc_id: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "QLTS_Tai_San",
                        localField: "dieuchuyen_taisan.ds_dc.ts_id",
                        foreignField: "ts_id",
                        as: "infoTS"
                    }
                },
                // { $unwind: { path: "$infoTS", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "QLTS_ViTri_ts",
                        localField: "vi_tri_dc_tu",
                        foreignField: "id_vitri",
                        as: "infoVTtu"
                    }
                },
                { $unwind: { path: "$infoVTtu", preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                        from: "QLTS_ViTri_ts",
                        localField: "dc_vitri_tsnhan",
                        foreignField: "id_vitri",
                        as: "infoVTden"
                    }
                },
                { $unwind: { path: "$infoVTden", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Users",
                        localField: "id_ng_thuchien",
                        foreignField: "_id",
                        //   pipeline: [
                        //       { $match: {$and : [
                        //       { "type" : {$ne : 1 }},
                        //       {"idQLC":{$ne : 0}},
                        //       {"idQLC":{$ne : 1}}
                        //       ]},
                        //       }
                        //   ],
                        as: "users_id_ng_thuchien"
                    }
                },
                { $unwind: { path: "$users_id_ng_thuchien", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Users",
                        localField: "id_daidien_nhan",
                        foreignField: "_id",
                        //   pipeline: [
                        //       { $match: {$and : [
                        //       { "type" : {$ne : 1 }},
                        //       {"idQLC":{$ne : 0}},
                        //       {"idQLC":{$ne : 1}}
                        //       ]},
                        //       }
                        //   ],
                        as: "daidien_nhan"
                    }
                },
                { $unwind: { path: "$daidien_nhan", preserveNullAndEmptyArrays: true } },

                {
                    $project: {

                        dc_ngay: 1,
                        dc_date_delete: 1,
                        dc_id: 1,
                        dc_trangthai: 1,
                        id_nv_dangsudung: '$id_nv_dangsudung',
                        id_pb_dang_sd: '$did_pb_dang_sd',
                        id_nv_nhan: '$id_nv_nhan',
                        id_pb_nhan: '$id_pb_nhan',
                        dc_lydo: 1,
                        id_ng_thuchien: 1,
                        // dieuchuyen_taisan: 1,
                        "so_luong_tai_san_dc": "$dieuchuyen_taisan.ds_dc.sl_ts",
                        id_daidien_nhan: 1,
                        dc_hoan_thanh: 1,
                        dc_date_create: 1,
                        "vi_tri_dc_tu": "$vi_tri_dc_tu",
                        "dc_vitri_tsnhan": "$dc_vitri_tsnhan",
                        ten_ng_thuchien: '$users_id_ng_thuchien.userName',
                        pb_ng_nhan: "$daidien_nhan.inForPerson.employee.dep_id",
                        ten_ng_nhan: '$daidien_nhan.userName',
                        pb_ng_thuc_hien: "$users_id_ng_thuchien.inForPerson.employee.dep_id",
                        dc_vi_tri_tu: "$infoVTtu.vi_tri",
                        dc_vi_tri_den: "$infoVTden.vi_tri",
                        dc_lydo_tuchoi: 1,
                        taisan_thucnhan: 1,

                        "ts_id": "$infoTS.ts_id",
                        "ten_tai_san": "$infoTS.ts_ten",
                        "tong_so_luong_tai_san": "$infoTS.ts_so_luong",
                        "trang_thai_tai_san": "$infoTS.ts_trangthai",

                    }
                },

            ]);
            for (let i = 0; i < data.length; i++) {
                if (data[i].id_nv_dangsudung != 0) {
                    let id_nv_dangsudung = await Users.findOne({ _id: data[i].id_nv_dangsudung }, { userName: 1 })
                    if (id_nv_dangsudung) data[i].name_nv_dangsudung = id_nv_dangsudung.userName
                    else data[i].name_nv_dangsudung = 0

                }
                if (data[i].id_pb_dang_sd != 0) {
                    let id_pb_dang_sd = await department.findOne({ dep_id: data[i].id_pb_dang_sd }, { dep_name: 1 })
                    if (id_pb_dang_sd) data[i].name_pb_dang_sd = id_pb_dang_sd.dep_name
                    else data[i].name_pb_dang_sd = 0

                }
                if (data[i].id_nv_nhan != 0) {
                    let id_nv_nhan = await Users.findOne({ _id: data[i].id_nv_nhan }, { userName: 1 })
                    if (id_nv_nhan) data[i].name_nv_nhan = id_nv_nhan.userName
                    else data[i].name_nv_nhan = 0

                }
                if (data[i].pb_ng_thuc_hien != 0) {
                    let depName_nguoi_thuchien = await department.findOne({ com_id: id_cty, dep_id: data[i].pb_ng_thuc_hien })
                    if (depName_nguoi_thuchien) data[i].depName_nguoi_thuchien = depName_nguoi_thuchien.dep_name
                    else data[i].depName_nguoi_thuchien = 0

                }
                if (data[i].pb_ng_nhan != 0) {
                    let depName_ng_nhan = await department.findOne({ com_id: id_cty, dep_id: data[i].pb_ng_nhan })
                    if (depName_ng_nhan) data[i].depName_ng_nhan = depName_ng_nhan.dep_name
                    else data[i].depName_ng_nhan = 0

                }
                if (data[i].id_tai_san != 0) {
                    let id_ng_su_dung_tai_san = await TaiSanDangSuDung.findOne({ com_id_sd: id_cty, id_ts_sd: data[i].id_tai_san })
                    if (id_ng_su_dung_tai_san) data[i].id_ng_su_dung_tai_san = id_ng_su_dung_tai_san.doi_tuong_dang_sd
                    else data[i].id_ng_su_dung_tai_san = 0
                }
                if (data[i].id_ng_su_dung_tai_san != 0) {
                    let ten_ng_su_dung_tai_san = await Users.findOne({ _id: data[i].id_ng_su_dung_tai_san }, { userName: 1 })
                    if (ten_ng_su_dung_tai_san) data[i].ten_ng_su_dung_tai_san = ten_ng_su_dung_tai_san.userName
                    else data[i].ten_ng_su_dung_tai_san = 0
                }

                if (data[i].id_pb_nhan != 0) {
                    let id_pb_nhan = await department.findOne({ dep_id: data[i].id_pb_nhan }, { dep_name: 1 })
                    if (id_pb_nhan) data[i].id_pb_nhan = id_pb_nhan.dep_name
                }
                if (data[i].dc_ngay != 0) data[i].dc_ngay = new Date(data[i].dc_ngay * 1000);
                if (data[i].dc_hoan_thanh != 0) data[i].dc_hoan_thanh = new Date(data[i].dc_hoan_thanh * 1000);
                if (data[i].dc_date_create != 0) data[i].dc_date_create = new Date(data[i].dc_date_create * 1000);
                if (data[i].dc_date_delete != 0) data[i].dc_date_delete = new Date(data[i].dc_date_delete * 1000);
            }
            let totalCount = await DieuChuyen.count(filter)

            return fnc.success(res, 'get data success', { thongKe, data, totalCount })
        }
        //2: điều chuyển đối tượng sd
        if (type == 2) {
            filter.dc_type = 1
            let data = await DieuChuyen.aggregate([
                { $match: filter },
                { $sort: { dc_id: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "QLTS_Tai_San",
                        localField: "dieuchuyen_taisan.ds_dc.ts_id",
                        foreignField: "ts_id",
                        as: "infoTS"
                    }
                },
                // { $unwind: { path: "$infoTS", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Users",
                        localField: "id_ng_thuchien",
                        foreignField: "_id",
                        //   pipeline: [
                        //       { $match: {$and : [
                        //       { "type" : {$ne : 1 }},
                        //       {"idQLC":{$ne : 0}},
                        //       {"idQLC":{$ne : 1}}
                        //       ]},
                        //       }
                        //   ],
                        as: "users_id_ng_thuchien"
                    }
                },
                { $unwind: { path: "$users_id_ng_thuchien", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Users",
                        localField: "id_daidien_nhan",
                        foreignField: "_id",
                        //   pipeline: [
                        //       { $match: {$and : [
                        //       { "type" : {$ne : 1 }},
                        //       {"idQLC":{$ne : 0}},
                        //       {"idQLC":{$ne : 1}}
                        //       ]},
                        //       }
                        //   ],
                        as: "users_id_ng_daidien"
                    }
                },
                { $unwind: { path: "$users_id_ng_daidien", preserveNullAndEmptyArrays: true } },

                {
                    $project: {
                        dc_ngay: 1,
                        dc_date_delete: 1,
                        dc_id: 1,
                        dc_trangthai: 1,
                        "so_luong_tai_san_dc": "$dieuchuyen_taisan.ds_dc.sl_ts",
                        dc_hoan_thanh: 1,
                        dc_date_create: 1,
                        id_nv_dangsudung: '$id_nv_dangsudung',
                        id_pb_dang_sd: '$id_pb_dang_sd',
                        id_nv_nhan: '$id_nv_nhan',
                        id_pb_nhan: '$id_pb_nhan',
                        "vi_tri_dc_tu": "$vi_tri_dc_tu",
                        "dc_vitri_tsnhan": "$dc_vitri_tsnhan",
                        dc_lydo: 1,
                        id_ng_thuchien: 1,
                        id_daidien_nhan: 1,
                        id_daidien_dangsd: 1,
                        ten_daidien_nhan: '$users_id_ng_daidien.userName',
                        ten_ng_thuchien: '$users_id_ng_thuchien.userName',
                        dc_lydo_tuchoi: 1,
                        taisan_thucnhan: 1,

                        "id_tai_san": "$infoTS.ts_id",
                        "ten_tai_san": "$infoTS.ts_ten",
                        "tong_so_luong_tai_san": "$infoTS.ts_so_luong",
                        "trang_thai_tai_san": "$infoTS.ts_trangthai",
                    }
                }
            ]);

            for (let i = 0; i < data.length; i++) {
                if (data[i].id_nv_dangsudung != 0) {
                    let id_nv_dangsudung = await Users.findOne({ _id: data[i].id_nv_dangsudung }, { userName: 1 })
                    if (id_nv_dangsudung) data[i].name_nv_dangsudung = id_nv_dangsudung.userName
                    else data[i].name_nv_dangsudung = 0

                }
                if (data[i].id_pb_dang_sd != 0) {
                    let id_pb_dang_sd = await department.findOne({ dep_id: data[i].id_pb_dang_sd }, { dep_name: 1 })
                    if (id_pb_dang_sd) data[i].name_pb_dang_sd = id_pb_dang_sd.dep_name
                    else data[i].name_pb_dang_sd = 0

                }
                if (data[i].id_nv_nhan != 0) {
                    let id_nv_nhan = await Users.findOne({ _id: data[i].id_nv_nhan }, { userName: 1 })
                    if (id_nv_nhan) data[i].name_nv_nhan = id_nv_nhan.userName
                    else data[i].name_nv_nhan = 0

                }
                if (data[i].id_daidien_dangsd != 0) {
                    let id_daidien_dangsd = await Users.findOne({ _id: data[i].id_daidien_dangsd }, { userName: 1 })
                    if (id_daidien_dangsd) data[i].ten_daidien_sd = id_daidien_dangsd.userName
                    else data[i].ten_daidien_sd = 0

                }
                if (data[i].id_daidien_nhan != 0) {
                    let id_daidien_nhan = await Users.findOne({ _id: data[i].id_daidien_nhan }, { userName: 1 })
                    if (id_daidien_nhan) data[i].ten_daidien_nhan = id_daidien_nhan.userName
                    else data[i].ten_daidien_nhan = 0

                }
                if (data[i].id_pb_nhan != 0) {
                    let id_pb_nhan = await department.findOne({ dep_id: data[i].id_pb_nhan }, { dep_name: 1 })
                    if (id_pb_nhan) data[i].name_pb_nhan = id_pb_nhan.dep_name
                    else data[i].name_pb_nhan = 0
                }

                if (data[i].dc_ngay != 0) data[i].dc_ngay = new Date(data[i].dc_ngay * 1000);
                if (data[i].dc_hoan_thanh != 0) data[i].dc_hoan_thanh = new Date(data[i].dc_hoan_thanh * 1000);
                if (data[i].dc_date_create != 0) data[i].dc_date_create = new Date(data[i].dc_date_create * 1000);
                if (data[i].dc_date_delete != 0) data[i].dc_date_delete = new Date(data[i].dc_date_delete * 1000);
            }
            let totalCount = await DieuChuyen.count(filter)

            return fnc.success(res, 'get data success', { thongKe, data, totalCount })
        }

        //3: điều chuyển đơn vị quản lý
        if (type == 3) {
            // if (type_quyen == 2) filter.id_ng_tao_dc = idQLC
            filter.dc_type = 2
            let data = await DieuChuyen.aggregate([
                { $match: filter },
                { $sort: { dc_id: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "QLTS_Tai_San",
                        localField: "dieuchuyen_taisan.ds_dc.ts_id",
                        foreignField: "ts_id",
                        as: "infoTS"
                    }
                },
                // { $unwind: { path: "$infoTS", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "QLTS_ViTri_ts",
                        localField: "vi_tri_dc_tu",
                        foreignField: "id_vitri",
                        as: "infoVTtu"
                    }
                },
                { $unwind: { path: "$infoVTtu", preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                        from: "QLTS_ViTri_ts",
                        localField: "dc_vitri_tsnhan",
                        foreignField: "id_vitri",
                        as: "infoVTden"
                    }
                },
                { $unwind: { path: "$infoVTden", preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                        from: "Users",
                        localField: "id_cty_dang_sd",
                        foreignField: "_id",
                        //   pipeline: [
                        //       { $match: {$and : [
                        //       { "type" : 1},
                        //       {"idQLC":{$ne : 0}},
                        //       {"idQLC":{$ne : 1}}
                        //       ]},
                        //       }
                        //   ],
                        as: "cty_dang_sd"
                    }
                },
                { $unwind: { path: "$cty_dang_sd", preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                        from: "Users",
                        localField: "id_cty_nhan",
                        foreignField: "_id",
                        //   pipeline: [
                        //       { $match: {$and : [
                        //       { "type" : 1},
                        //       {"idQLC":{$ne : 0}},
                        //       {"idQLC":{$ne : 1}}
                        //       ]},
                        //       }
                        //   ],
                        as: "cty_nhan"
                    }
                },
                { $unwind: { path: "$cty_nhan", preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                        from: 'Users',
                        localField: 'id_ng_thuchien',
                        foreignField: '_id',
                        as: 'users_id_ng_thuchien'
                    }
                },
                { $unwind: { path: "$users_id_ng_thuchien", preserveNullAndEmptyArrays: true } },
                { $match: { "users_id_ng_thuchien.type": 2 } },

                {
                    $project: {
                        dc_ngay: 1,
                        dc_id: 1,
                        dc_date_delete: 1,
                        dc_trangthai: 1,
                        dc_lydo: 1,
                        id_ng_thuchien: 1,
                        "so_luong_tai_san_dc": "$dieuchuyen_taisan.ds_dc.sl_ts",
                        "vi_tri_dc_tu": "$vi_tri_dc_tu",
                        "dc_vitri_tsnhan": "$dc_vitri_tsnhan",
                        ten_ng_thuchien: '$users_id_ng_thuchien.userName',
                        id_cty_nhan: 1,
                        ten_cty_nhan: '$cty_nhan.userName',
                        id_cty_dang_sd: 1,
                        ten_cty_dang_sd: '$cty_dang_sd.userName',
                        vi_tri_dc_tu: 1,
                        id_daidien_nhan: 1,
                        id_daidien_dangsd: 1,
                        dc_vi_tri_tu: "$infoVTtu.vi_tri",
                        dc_vitri_tsnhan: 1,
                        dc_lydo_tuchoi: 1,
                        taisan_thucnhan: 1,
                        dc_date_create: 1,
                        dc_vi_tri_den: "$infoVTden.vi_tri",


                        "id_tai_san": "$infoTS.ts_id",
                        "ten_tai_san": "$infoTS.ts_ten",
                        "tong_so_luong_tai_san": "$infoTS.ts_so_luong",
                        "trang_thai_tai_san": "$infoTS.ts_trangthai",
                    }
                }
            ]);

            for (let i = 0; i < data.length; i++) {
                if (data[i].id_tai_san != 0) {
                    let id_ng_su_dung_tai_san = await TaiSanDangSuDung.findOne({ com_id_sd: id_cty, id_ts_sd: data[i].id_tai_san })
                    if (id_ng_su_dung_tai_san) data[i].id_ng_su_dung_tai_san = id_ng_su_dung_tai_san.doi_tuong_dang_sd
                    else data[i].id_ng_su_dung_tai_san = 0
                    if (data[i].id_ng_su_dung_tai_san != 0) {
                        let ten_ng_su_dung_tai_san = await Users.findOne({ _id: data[i].id_ng_su_dung_tai_san }, { userName: 1 })
                        if (ten_ng_su_dung_tai_san) data[i].ten_ng_su_dung_tai_san = ten_ng_su_dung_tai_san.userName
                        else data[i].ten_ng_su_dung_tai_san = 0
                    }
                    if (data[i].id_daidien_nhan != 0) {
                        let id_daidien_nhan = await Users.findOne({ _id: data[i].id_daidien_nhan }, { userName: 1 })
                        if (id_daidien_nhan) data[i].ten_daidien_nhan = id_daidien_nhan.userName
                        else data[i].ten_daidien_nhan = 0

                    }
                    if (data[i].id_daidien_dangsd != 0) {
                        let id_daidien_dangsd = await Users.findOne({ _id: data[i].id_daidien_dangsd }, { userName: 1 })
                        if (id_daidien_dangsd) data[i].ten_daidien_sd = id_daidien_dangsd.userName
                        else data[i].ten_daidien_sd = 0

                    }
                }
                if (data[i].dc_ngay != 0) data[i].dc_ngay = new Date(data[i].dc_ngay * 1000);
                if (data[i].dc_hoan_thanh != 0) data[i].dc_hoan_thanh = new Date(data[i].dc_hoan_thanh * 1000);
                if (data[i].dc_date_create != 0) data[i].dc_date_create = new Date(data[i].dc_date_create * 1000);
                if (data[i].dc_date_delete != 0) data[i].dc_date_delete = new Date(data[i].dc_date_delete * 1000);
            }
            let totalCount = await DieuChuyen.count(filter)

            return fnc.success(res, 'get data success', { thongKe, data, totalCount })
        }
    } catch (error) {
        console.error(error)
        return fnc.setError(res, error)
    }
};
//tu choi dieu chuyen 
exports.refuserTransfer = async(req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const dc_id = req.body.dc_id
        const content = req.body.content
        if (dc_id) {
            const data = await DieuChuyen.findOne({ dc_id: dc_id, id_cty: id_cty });
            if (!data) {
                return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);
            } else {
                await DieuChuyen.updateOne({ dc_id: dc_id, id_cty: id_cty }, {
                    dc_trangthai: 4,
                    dc_lydo_tuchoi: content,
                })
            }
            return fnc.success(res, "cập nhật thành công")
        }
        return fnc.setError(res, "thiếu trường dc_id")

    } catch (e) {
        return fnc.setError(res, e.message)
    }
}

exports.XacNhanDC = async(req, res) => {
    try {
        const id_cty = req.user.data.com_id

        let { dc_id, loai_xacnhan_dc, vitri_dc_tu, loai_bg_dc, dc_type, pb, nv } = req.body;
        let now = new Date()
            // if (dc_id && dc_type && vitri_dc_tu) {
        if (loai_bg_dc == 0) {
            // dc vi tri
            let this_dc = await DieuChuyen.findOne({
                dc_id: dc_id,
                id_cty: id_cty,
                dc_type: dc_type,
            })
            if (this_dc) {

                let taisan_dc = this_dc.dieuchuyen_taisan.ds_dc

                for (let i = 0; i < taisan_dc.length; i++) {
                    let maxTSVT = await fnc.getMaxIdByField(TaiSanViTri, "tsvt_id")
                    let ts_id = taisan_dc[i].ts_id
                    let sl_ts = taisan_dc[i].sl_ts
                    let check_tsvt_tu = await TaiSanViTri.findOne({
                        tsvt_taisan: ts_id,
                        tsvt_vitri: vitri_dc_tu,
                        tsvt_cty: id_cty,
                    })
                    let check_ts_tu = await TaiSan.findOne({
                        ts_id: ts_id,
                        ts_vi_tri: vitri_dc_tu,
                        id_cty: id_cty,
                    })
                    if (check_tsvt_tu) {
                        let sl_tu_moi = check_tsvt_tu.tsvt_soluong - sl_ts
                        let update_sl_tu = await TaiSanViTri.updateOne({
                            tsvt_taisan: ts_id,
                            tsvt_vitri: vitri_dc_tu,
                            tsvt_cty: id_cty,
                        }, {
                            tsvt_soluong: sl_tu_moi
                        })
                    } else {
                        let add_sl_tu = new TaiSanViTri({
                            tsvt_id: maxTSVT,
                            tsvt_cty: id_cty,
                            tsvt_taisan: ts_id,
                            tsvt_vitri: vitri_dc_tu,
                            tsvt_soluong: sl_ts,
                        })
                        await add_sl_tu.save()
                    }
                }
                let xac_nhan_bg = await DieuChuyen.updateOne({ dc_id: dc_id, id_cty: id_cty }, {
                    dc_trangthai: 1,
                    dc_hoan_thanh: Date.parse(now) / 1000,
                })
                return fnc.success(res, "xac nhan thanh cong voi loai_bg_dc = 0", { xac_nhan_bg });
            }
            return fnc.setError(res, "khong tim thay tai san dieu chuyen voi loai_bg_dc = 0")
        }
        if (loai_bg_dc == 1) {
            // dc doi tuong
            let this_danhsach_ts_dc = await DieuChuyen.findOne({
                dc_id: dc_id,
                id_cty: id_cty,
                dc_type: dc_type,
            })
            if (this_danhsach_ts_dc) {
                let taisan_dc = this_danhsach_ts_dc.dieuchuyen_taisan.ds_dc
                if (pb) {
                    for (let i = 0; i < taisan_dc.length; i++) {
                        let ts_id = taisan_dc[i].ts_id
                        let sl_ts = taisan_dc[i].sl_ts
                        let check_ts_sd = await TaiSanDangSuDung.findOne({
                            id_pb_sd: pb,
                            com_id_sd: id_cty,
                            id_ts_sd: ts_id,
                        })
                        if (check_ts_sd) {
                            let sl_moi = check_ts_sd.sl_dang_sd - sl_ts
                            let update_sl = await TaiSanDangSuDung.updateOne({
                                id_pb_sd: pb,
                                com_id_sd: id_cty,
                                id_ts_sd: ts_id,
                            }, {
                                sl_dang_sd: sl_moi
                            })
                        }
                    }
                }
                if (nv) {
                    for (let i = 0; i < taisan_dc.length; i++) {
                        let ts_id = taisan_dc[i].ts_id
                        let sl_ts = taisan_dc[i].sl_ts
                        let check_ts_sd = await TaiSanDangSuDung.findOne({
                            id_nv_sd: nv,
                            com_id_sd: id_cty,
                            id_ts_sd: ts_id,
                        })
                        if (check_ts_sd) {
                            let sl_moi = check_ts_sd.sl_dang_sd - sl_ts
                            let update_sl = await TaiSanDangSuDung.updateOne({
                                id_nv_sd: nv,
                                com_id_sd: id_cty,
                                id_ts_sd: ts_id,
                            }, {
                                sl_dang_sd: sl_moi
                            })
                        }
                    }
                }
                let xac_nhan_bg = await DieuChuyen.updateOne({ dc_id: dc_id, id_cty: id_cty }, {
                    dc_trangthai: 1,
                    dc_hoan_thanh: Date.parse(now) / 1000,
                })
                return fnc.success(res, "xac nhan dieu chuyen thanh cong voi loai_bg_dc = 1  ", { xac_nhan_bg });
            }
            return fnc.setError(res, "khong tim thay tai san dieu chuyen  voi loai_bg_dc = 1 ")

        }
        if (loai_xacnhan_dc == 1) {
            let this_danhsach_ts_dc = await DieuChuyen.findOne({
                dc_id: dc_id,
                id_cty: id_cty,
                dc_type: loai_xacnhan_dc,
            })
            if (this_danhsach_ts_dc) {
                if (this_danhsach_ts_dc.id_nv_dangsudung != 0) {
                    id_doituong_sd = this_danhsach_ts_dc.id_nv_dangsudung
                }
                if (this_danhsach_ts_dc.id_pb_dang_sd != 0) {
                    id_doituong_sd = this_danhsach_ts_dc.id_pb_dang_sd
                }
                if (this_danhsach_ts_dc.id_nv_nhan != 0) {
                    id_doituong_nhan = this_danhsach_ts_dc.id_nv_nhan
                }
                if (this_danhsach_ts_dc.id_pb_nhan != 0) {
                    id_doituong_nhan = this_danhsach_ts_dc.id_pb_nhan
                }
                // XỬ LÝ CỘNG TRỪ SỐ LƯỢNG SỬ DỤNG
                let taisan_dc = this_danhsach_ts_dc.dieuchuyen_taisan.ds_dc
                for (let i = 0; i < taisan_dc.length; i++) {
                    let ts_id = taisan_dc[i].ts_id
                    let sl_ts = taisan_dc[i].sl_ts
                    let id_nv_dai_dien = this_danhsach_ts_dc.id_daidien_nhan


                    if (this_danhsach_ts_dc.id_nv_dangsudung != 0) {
                        let query_ts_dang_sd = await TaiSanDangSuDung.findOne({
                            id_nv_sd: id_doituong_sd,
                            com_id_sd: id_cty,
                            id_ts_sd: ts_id,
                        })
                        if (query_ts_dang_sd) {
                            let sl_ts_hientai = query_ts_dang_sd.sl_dang_sd
                                // TRỪ CỦA NG ĐIỀU CHUYỂN
                            let sl_da_tru = sl_ts_hientai - sl_ts
                            let tru_taisan = await TaiSanDangSuDung.updateOne({
                                    id_nv_sd: id_doituong_sd,
                                    com_id_sd: id_cty,
                                    id_ts_sd: ts_id,
                                }, {
                                    sl_dang_sd: sl_da_tru
                                })
                                // CỘNG HOẶC THÊM MỚI
                            if (this_danhsach_ts_dc.id_nv_nhan != 0) {
                                let query_doituong_nhan_ts = await TaiSanDangSuDung.findOne({
                                    id_nv_sd: id_doituong_nhan,
                                    com_id_sd: id_cty,
                                    id_ts_sd: ts_id,
                                })
                                if (query_doituong_nhan_ts) {
                                    let sl_da_cong = query_doituong_nhan_ts.sl_dang_sd - sl_ts
                                    let cong_taisan = await TaiSanDangSuDung.updateOne({
                                        id_nv_sd: id_doituong_nhan,
                                        com_id_sd: id_cty,
                                        id_ts_sd: ts_id,
                                    }, {
                                        sl_dang_sd: sl_da_cong
                                    })

                                } else {
                                    let maxTS = await fnc.getMaxIdByField(TaiSanDangSuDung, "id_sd")
                                    let cong_taisan = new TaiSanDangSuDung({
                                        id_sd: maxTS,
                                        com_id_sd: id_cty,
                                        id_ts_sd: ts_id,
                                        id_nv_sd: id_doituong_nhan,
                                        id_pb_sd: 0,
                                        sl_dang_sd: sl_ts,
                                        doi_tuong_dang_sd: id_doituong_nhan,
                                        day_bd_sd: Date.parse(now) / 1000,
                                        tinhtrang_ts: 1,
                                    })
                                    await cong_taisan.save()
                                }
                            }
                            if (this_danhsach_ts_dc.id_pb_nhan != 0) {
                                let query_doituong_nhan_ts = await TaiSanDangSuDung.findOne({
                                    id_pb_sd: id_doituong_nhan,
                                    com_id_sd: id_cty,
                                    id_ts_sd: ts_id,
                                })
                                let query_this_dt_dd = await TaiSanDaiDienNhan.findOne({
                                    id_nv_dd_nhan: id_nv_dai_dien,
                                    id_cty_dd: id_cty,
                                    id_ts_dd_nhan: ts_id,
                                })

                                if (query_doituong_nhan_ts) {
                                    let sl_da_cong = query_doituong_nhan_ts.sl_dang_sd + sl_ts
                                    let cong_taisan = await TaiSanDangSuDung.updateOne({
                                        id_pb_sd: id_doituong_nhan,
                                        com_id_sd: id_cty,
                                        id_ts_sd: ts_id,
                                    }, {
                                        sl_dang_sd: sl_da_cong
                                    })
                                } else {
                                    let maxTS = await fnc.getMaxIdByField(TaiSanDangSuDung, "id_sd")
                                    let cong_taisan = new TaiSanDangSuDung({
                                        id_sd: maxTS,
                                        com_id_sd: id_cty,
                                        id_ts_sd: ts_id,
                                        id_nv_sd: 0,
                                        id_pb_sd: id_doituong_nhan,
                                        sl_dang_sd: sl_ts,
                                        doi_tuong_dang_sd: id_doituong_nhan,
                                        day_bd_sd: Date.parse(now) / 1000,
                                        tinhtrang_ts: 1,
                                    })
                                    await cong_taisan.save()
                                }
                            }
                            if (query_this_dt_dd) {
                                let sl_da_cong = query_this_dt_dd.sl_dd_nhan + this_sl_dc
                                let cong_taisan_dd = await TaiSanDaiDienNhan.updateOne({
                                    id_nv_dd_nhan: id_nv_dai_dien,
                                    id_cty_dd: id_cty,
                                    id_ts_dd_nhan: ts_id,
                                }, {
                                    sl_dd_nhan: sl_da_cong
                                })
                            } else {
                                let maxDaidienNhan = await fnc.getMaxIdByField(TaiSanDaiDienNhan, "_id")
                                let insert_ts_dd = new TaiSanDaiDienNhan({
                                    _id: maxDaidienNhan,
                                    id_cty_dd: id_cty,
                                    id_ts_dd_nhan: ts_id,
                                    id_nv_dd_nhan: id_nv_dai_dien,
                                    sl_dd_nhan: sl_ts,
                                    day_dd_nhan: Date.parse(now) / 1000,
                                })
                                await insert_ts_dd.save()
                            }
                        }
                    }
                    if (this_danhsach_ts_dc.id_pb_dang_sd != 0) {
                        let query_ts_dang_sd = await TaiSanDangSuDung.findOne({
                            id_pb_sd: id_doituong_sd,
                            com_id_sd: id_cty,
                            id_ts_sd: ts_id,
                        })
                        if (query_ts_dang_sd) {
                            let sl_ts_hientai = query_ts_dang_sd.sl_dang_sd
                                // TRỪ CỦA NG ĐIỀU CHUYỂN
                            let sl_da_tru = sl_ts_hientai - sl_ts
                            let tru_taisan = await TaiSanDangSuDung.updateOne({
                                    id_pb_sd: id_doituong_sd,
                                    com_id_sd: id_cty,
                                    id_ts_sd: ts_id,
                                }, {
                                    sl_dang_sd: sl_da_tru
                                })
                                // CỘNG HOẶC THÊM MỚI
                            if (this_danhsach_ts_dc.id_nv_nhan != 0) {
                                let query_doituong_nhan_ts = await TaiSanDangSuDung.findOne({
                                    id_nv_sd: id_doituong_nhan,
                                    com_id_sd: id_cty,
                                    id_ts_sd: ts_id,
                                })
                                if (query_doituong_nhan_ts) {
                                    let sl_da_cong = query_doituong_nhan_ts.sl_dang_sd - sl_ts
                                    let cong_taisan = await TaiSanDangSuDung.updateOne({
                                        id_nv_sd: id_doituong_nhan,
                                        com_id_sd: id_cty,
                                        id_ts_sd: ts_id,
                                    }, {
                                        sl_dang_sd: sl_da_cong
                                    })

                                } else {
                                    let maxTS = await fnc.getMaxIdByField(TaiSanDangSuDung, "id_sd")
                                    let cong_taisan = new TaiSanDangSuDung({
                                        id_sd: maxTS,
                                        com_id_sd: id_cty,
                                        id_ts_sd: ts_id,
                                        id_nv_sd: id_doituong_nhan,
                                        id_pb_sd: 0,
                                        sl_dang_sd: sl_ts,
                                        doi_tuong_dang_sd: id_doituong_nhan,
                                        day_bd_sd: Date.parse(now) / 1000,
                                        tinhtrang_ts: 1,
                                    })
                                    await cong_taisan.save()
                                }
                            }
                            if (this_danhsach_ts_dc.id_pb_nhan != 0) {
                                let query_doituong_nhan_ts = await TaiSanDangSuDung.findOne({
                                    id_pb_sd: id_doituong_nhan,
                                    com_id_sd: id_cty,
                                    id_ts_sd: ts_id,
                                })

                                if (query_doituong_nhan_ts) {
                                    let sl_da_cong = query_doituong_nhan_ts.sl_dang_sd + sl_ts
                                    let cong_taisan = await TaiSanDangSuDung.updateOne({
                                        id_pb_sd: id_doituong_nhan,
                                        com_id_sd: id_cty,
                                        id_ts_sd: ts_id,
                                    }, {
                                        sl_dang_sd: sl_da_cong
                                    })
                                } else {
                                    let maxTS = await fnc.getMaxIdByField(TaiSanDangSuDung, "id_sd")
                                    let cong_taisan = new TaiSanDangSuDung({
                                        id_sd: maxTS,
                                        com_id_sd: id_cty,
                                        id_ts_sd: ts_id,
                                        id_nv_sd: 0,
                                        id_pb_sd: id_doituong_nhan,
                                        sl_dang_sd: sl_ts,
                                        doi_tuong_dang_sd: id_doituong_nhan,
                                        day_bd_sd: Date.parse(now) / 1000,
                                        tinhtrang_ts: 1,
                                    })
                                    await cong_taisan.save()
                                }
                            }


                        }
                    } //END

                }
                let xac_nhan_bg = await DieuChuyen.updateOne({
                    dc_id: dc_id,
                    id_cty: id_cty
                }, {
                    dc_trangthai: 1,
                    dc_hoan_thanh: Date.parse(now) / 1000,
                })

                for (let t = 0; t < taisan_dc.length; t++) {
                    let ts_id = taisan_dc[t].ts_id
                    let sl_ts = taisan_dc[t].sl_ts
                    let max = await fnc.getMaxIdByField(QuaTrinhSuDung, "quatrinh_id")
                    let insert_qt_sd = new QuaTrinhSuDung({
                        quatrinh_id: max,
                        id_ts: ts_id,
                        id_bien_ban: dc_id,
                        so_lg: sl_ts,
                        id_cty: id_cty,
                        id_ng_sudung: this_danhsach_ts_dc.id_nv_nhan,
                        id_phong_sudung: this_danhsach_ts_dc.id_pb_nhan,
                        id_cty_sudung: this_danhsach_ts_dc.id_cty_nhan,
                        qt_ngay_thuchien: this_danhsach_ts_dc.dc_ngay,
                        qt_nghiep_vu: 3,
                        vitri_ts: this_danhsach_ts_dc.dc_vitri_tsnhan,
                        ghi_chu: this_danhsach_ts_dc.dc_lydo,
                        time_created: Date.parse(now) / 1000,
                    })
                }
                return fnc.success(res, "xac nhan dieu chuyen thanh cong voi  loai_xacnhan_dc = type_dc = 1 ", { xac_nhan_bg });

            }
            return fnc.setError(res, "khong tim thay tai san dieu chuyen  voi loai_xacnhan_dc = type_dc = 1 ")

        }
        if (loai_xacnhan_dc == 2) {
            let this_dc = await DieuChuyen.findOne({
                dc_id: dc_id,
                id_cty: id_cty,
                dc_type: loai_xacnhan_dc,
            })
            if (this_dc) {
                let taisan_dc = this_dc.dieuchuyen_taisan.ds_dc
                for (let i = 0; i < taisan_dc.length; i++) {
                    let ts_id = taisan_dc[i].ts_id
                    let sl_ts = taisan_dc[i].sl_ts
                    let query_ts = await TaiSan.findOne({
                        id_cty: id_cty,
                        ts_id: ts_id,
                    })
                    if (query_ts) {
                        let new_sl = query_ts.ts_so_luong - sl_ts
                        let update_taisan_cty = await TaiSan.updateOne({
                            id_cty: id_cty,
                            ts_id: ts_id,
                        }, {
                            ts_so_luong: new_sl,
                            soluong_cp_bb: new_sl,
                        })
                    }
                }
                let xac_nhan_bg = await DieuChuyen.updateOne({
                    dc_id: dc_id,
                    id_cty: id_cty
                }, {
                    dc_trangthai: 1,
                    dc_hoan_thanh: Date.parse(now) / 1000,
                })

                for (let t = 0; t < taisan_dc.length; t++) {
                    let ts_id = taisan_dc[t].ts_id
                    let sl_ts = taisan_dc[t].sl_ts
                    let max = await fnc.getMaxIdByField(QuaTrinhSuDung, "quatrinh_id")
                    let insert_qt_sd = new QuaTrinhSuDung({
                        quatrinh_id: max,
                        id_ts: ts_id,
                        id_bien_ban: dc_id,
                        so_lg: sl_ts,
                        id_cty: id_cty,
                        id_ng_sudung: this_dc.id_nv_nhan,
                        id_phong_sudung: this_dc.id_pb_nhan,
                        id_cty_sudung: this_dc.id_cty_nhan,
                        qt_ngay_thuchien: this_dc.dc_ngay,
                        qt_nghiep_vu: 3,
                        vitri_ts: this_dc.dc_vitri_tsnhan,
                        ghi_chu: this_dc.dc_lydo,
                        time_created: Date.parse(now) / 1000,
                    })
                }
                return fnc.success(res, "xac nhan dc don vi quan li thanh cong voi loai_xacnhan_dc = type_dc = 2", { xac_nhan_bg });
            }
            return fnc.setError(res, "khong tim thay tai san dieu chuyen voi loai_xacnhan_dc = type_dc = 2 ")

        }
        // }
        // return fnc.setError(res, "nhập thiếu trường dc_id và dc_type")
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error.message)
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
                    let cp = await DieuChuyen.findOneAndUpdate({ dc_id: array_xoa[i], id_cty: com_id }, {
                        xoa_dieuchuyen: 1,
                        dc_type_quyen_xoa: type_quyen,
                        id_ng_xoa_dc: id_ng_xoa,
                        dc_date_delete: new Date().getTime() / 1000,
                    }, { new: true });
                }
                return fnc.success(res, "Xoa nhieu tam thoi thanh cong!");
            } else {
                await DieuChuyen.findOneAndUpdate({ dc_id: array_xoa, id_cty: com_id }, {
                    xoa_dieuchuyen: 1,
                    dc_type_quyen_xoa: type_quyen,
                    id_ng_xoa_dc: id_ng_xoa,
                    dc_date_delete: new Date().getTime() / 1000,
                }, { new: true });
                return fnc.success(res, "Xoa 1 tam thoi thanh cong!");
            }
        }
        if (datatype == 2) {
            if (Array.isArray(array_xoa) === true) {
                for (let i = 0; i < array_xoa.length; i++) {
                    let cp = await DieuChuyen.findOneAndUpdate({ dc_id: array_xoa[i], id_cty: com_id }, {
                        xoa_dieuchuyen: 0,
                        dc_type_quyen_xoa: 0,
                        id_ng_xoa_dc: 0,
                        dc_date_delete: 0
                    }, { new: true });
                }
                return fnc.success(res, "Khoi phuc nhieu thanh cong!");
            } else {
                await DieuChuyen.findOneAndUpdate({ dc_id: array_xoa, id_cty: com_id }, {
                    xoa_dieuchuyen: 0,
                    dc_type_quyen_xoa: 0,
                    id_ng_xoa_dc: 0,
                    dc_date_delete: 0
                }, { new: true });
                return fnc.success(res, "Khoi phuc 1 thanh cong!");

            }
        }
        if (datatype == 3) {
            if (Array.isArray(array_xoa) === true) {
                for (let i = 0; i < array_xoa.length; i++) {
                    let cp = await DieuChuyen.deleteOne({ dc_id: array_xoa[i], id_cty: com_id });
                }
                return fnc.success(res, "Xoa vinh vien nhieu thanh cong!");
            } else {
                await DieuChuyen.deleteOne({ dc_id: array_xoa, id_cty: com_id });
                return fnc.success(res, "Xoa vinh vien 1 thanh cong!");
            }

        }
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error.message);
    }
}