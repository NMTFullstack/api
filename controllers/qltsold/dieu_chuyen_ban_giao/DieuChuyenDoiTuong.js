const DieuChuyen = require("../../../models/QuanLyTaiSan/DieuChuyen");
const ThongBao = require('../../../models/QuanLyTaiSan/ThongBao');
const ViTriTaiSan = require('../../../models/QuanLyTaiSan/ViTri_ts');
const TaiSanViTri = require('../../../models/QuanLyTaiSan/TaiSanVitri');
const TaiSan = require("../../../models/QuanLyTaiSan/TaiSan");
const fnc = require("../../../services/functions");
//add_dc_ts
exports.add = async(req, res) => {
    let {
        loai_dc,
        type_quyen,
        dieuchuyen_taisan1,
        ngay_dc,
        ng_thuc_hien,
        khoi_chon_phong_ban_nv,
        khoi_chon_phong_ban_nv_den,
        khoi_dc_tu,
        khoi_dc_den,
        khoi_ng_dai_dien_dc_tu,
        khoi_ng_dai_dien_dc_den,
        id_dai_dien_nhan,
        vitri_dc,
        vitri_dc_tu,
        vitri_dc_den,
        ly_do_dc
    } = req.body;
    let id_cty, id_ng_tao = 0;

    if (req.user.data.type == 1) {
        id_cty = req.user.data.idQLC;
        id_ng_tao = req.user.data.idQLC;

    } else if (req.user.data.type == 2) {
        id_cty = req.user.dat.inForPerson.employee.type.com_id;
        id_ng_tao = req.user.data.idQLC;
    }
    let dieuchuyen_vippro = dieuchuyen_taisan1;
    let dc_da_xoa = 0;
    let date_delete = 0;
    let dc_trang_thai = 0;
    let ID_tb = 0;
    let maxID = await ThongBao.findOne({}, {}, { sort: { id_tb: -1 } });
    if (maxID) {
        ID_tb = maxID.id_tb;
    }

    let insert_thongbao = new ThongBao({
        id_tb: ID_tb + 1,
        id_cty: id_cty,
        id_ng_nhan: id_cty,
        id_ng_tao: id_ng_tao,
        type_quyen: 2,
        type_quyen_tao: type_quyen,
        loai_tb: 3,
        add_or_duyet: 1,
        da_xem: 0,
        date_create: new Date().getTime()
    });
    await insert_thongbao.save();

    // dieu chuyen tu nv den nv
    if (khoi_chon_phong_ban_nv == 0 && khoi_chon_phong_ban_nv_den == 0) {
        let ID_dc = 0;
        let maxIDDc = await DieuChuyen.findOne({}, {}, { sort: { dc_id: -1 } });
        if (maxID) {
            ID_dc = maxIDDc.dc_id;
        }

        let insert_dieuchuyen = new DieuChuyen({
            dc_id: ID_dc + 1,
            id_cty: id_cty,
            dieuchuyen_taisan: dieuchuyen_vippro,
            id_ng_thuchien: ng_thuc_hien,
            id_nv_dangsudung: khoi_dc_tu,
            id_nv_nhan: khoi_dc_den,
            dc_lydo: ly_do_dc,
            vi_tri_dc_tu: vitri_dc_tu,
            dc_vitri_tsnhan: vitri_dc_den,
            dc_ngay: ngay_dc,
            dc_trangthai: dc_trang_thai,
            dc_type_quyen: type_quyen,
            dc_type: loai_dc,
            id_ng_tao_dc: id_ng_tao,
            xoa_dieuchuyen: dc_da_xoa,
            dc_date_create: new Date().getTime(),
            dc_date_delete: date_delete,
        });
        await insert_dieuchuyen.save();


        let ID_tb_1 = 0;
        let maxID_1 = await ThongBao.findOne({}, {}, { sort: { id_tb: -1 } });
        if (maxID) {
            ID_tb_1 = maxID_1.id_tb;
        }
        let insert_thongbao1 = new ThongBao({
            id_tb: ID_tb_1 + 1,
            id_cty: id_cty,
            id_ng_nhan: ng_thuc_hien,
            id_ng_tao: id_ng_tao,
            type_quyen: 2,
            type_quyen_tao: type_quyen,
            loai_tb: 3,
            add_or_duyet: 1,
            da_xem: 0,
            date_create: new Date().getTime()

        });
        await insert_thongbao1.save();

        let ID_tb_2 = 0;
        let maxID_2 = await ThongBao.findOne({}, {}, { sort: { id_tb: -1 } });
        if (maxID) {
            ID_tb_2 = maxID_2.id_tb;
        }
        //thong boa den nguoi nhan
        let insert_thongbao2 = new ThongBao({
            id_tb: ID_tb_2 + 1,
            id_cty: id_cty,
            id_ng_nhan: khoi_dc_den,
            id_ng_tao: id_ng_tao,
            type_quyen: 2,
            type_quyen_tao: type_quyen,
            loai_tb: 3,
            add_or_duyet: 1,
            da_xem: 0,
            date_create: new Date().getTime()
        });
        await insert_thongbao2.save();
        return res.status(200).json({ data: { insert_dieuchuyen: insert_dieuchuyen, insert_thongbao1: insert_thongbao1, insert_thongbao2: insert_thongbao2 }, message: "thanh cong " });
    } else if (khoi_chon_phong_ban_nv == 1 && khoi_chon_phong_ban_nv_den == 0) {
        // dieu chuyen tu pb den nv
        let ID_dc = 0;
        let maxIDDc = await DieuChuyen.findOne({}, {}, { sort: { dc_id: -1 } });
        if (maxID) {
            ID_dc = maxIDDc.dc_id;
        }

        let insert_dieuchuyen = new DieuChuyen({
            dc_id: ID_dc + 1,
            id_cty: id_cty,
            dieuchuyen_taisan: dieuchuyen_vippro,
            id_ng_thuchien: ng_thuc_hien,
            id_pb_dang_sd: khoi_dc_tu,
            id_daidien_dangsd: khoi_ng_dai_dien_dc_tu,
            id_nv_nhan: khoi_dc_den,
            dc_lydo: ly_do_dc,
            vi_tri_dc_tu: vitri_dc_tu,
            dc_vitri_tsnhan: vitri_dc_den,
            dc_ngay: ngay_dc,
            dc_trangthai: dc_trang_thai,
            dc_type_quyen: type_quyen,
            dc_type: loai_dc,
            id_ng_tao_dc: id_ng_tao,
            xoa_dieuchuyen: dc_da_xoa,
            dc_date_create: new Date().getTime(),
            dc_date_delete: date_delete,
        });
        await insert_dieuchuyen.save();


        let ID_tb_1 = 0;
        let maxID_1 = await ThongBao.findOne({}, {}, { sort: { id_tb: -1 } });
        if (maxID) {
            ID_tb_1 = maxID_1.id_tb;
        }
        let insert_thongbao1 = new ThongBao({
            id_tb: ID_tb_1 + 1,
            id_cty: id_cty,
            id_ng_nhan: ng_thuc_hien,
            id_ng_tao: id_ng_tao,
            type_quyen: 2,
            type_quyen_tao: type_quyen,
            loai_tb: 3,
            add_or_duyet: 1,
            da_xem: 0,
            date_create: new Date().getTime()

        });
        await insert_thongbao1.save();

        let ID_tb_2 = 0;
        let maxID_2 = await ThongBao.findOne({}, {}, { sort: { id_tb: -1 } });
        if (maxID) {
            ID_tb_2 = maxID_2.id_tb;
        }
        //thong boa den nguoi nhan
        let insert_thongbao2 = new ThongBao({
            id_tb: ID_tb_2 + 1,
            id_cty: id_cty,
            id_ng_nhan: khoi_dc_den,
            id_ng_tao: id_ng_tao,
            type_quyen: 2,
            type_quyen_tao: type_quyen,
            loai_tb: 3,
            add_or_duyet: 1,
            da_xem: 0,
            date_create: new Date().getTime()
        });
        await insert_thongbao2.save();
        return res.status(200).json({ data: { insert_dieuchuyen: insert_dieuchuyen, insert_thongbao1: insert_thongbao1, insert_thongbao2: insert_thongbao2 }, message: "thanh cong " });
    } else if (khoi_chon_phong_ban_nv == 0 && khoi_chon_phong_ban_nv_den == 1) {
        // dieu chuyen tu nv den pb
        let ID_dc = 0;
        let maxIDDc = await DieuChuyen.findOne({}, {}, { sort: { dc_id: -1 } });
        if (maxID) {
            ID_dc = maxIDDc.dc_id;
        }

        let insert_dieuchuyen = new DieuChuyen({
            dc_id: ID_dc + 1,
            id_cty: id_cty,
            dieuchuyen_taisan: dieuchuyen_vippro,
            id_ng_thuchien: ng_thuc_hien,
            id_nv_dangsudung: khoi_dc_tu,
            // id_daidien_dangsd: khoi_ng_dai_dien_dc_tu,
            id_pb_nhan: khoi_dc_den,
            id_daidien_nhan: khoi_ng_dai_dien_dc_den,
            dc_lydo: ly_do_dc,
            vi_tri_dc_tu: vitri_dc_tu,
            dc_vitri_tsnhan: vitri_dc_den,
            dc_ngay: ngay_dc,
            dc_trangthai: dc_trang_thai,
            dc_type_quyen: type_quyen,
            dc_type: loai_dc,
            id_ng_tao_dc: id_ng_tao,
            xoa_dieuchuyen: dc_da_xoa,
            dc_date_create: new Date().getTime(),
            dc_date_delete: date_delete,
        });
        await insert_dieuchuyen.save();
        let ID_tb_1 = 0;
        let maxID_1 = await ThongBao.findOne({}, {}, { sort: { id_tb: -1 } });
        if (maxID) {
            ID_tb_1 = maxID_1.id_tb;
        }
        let insert_thongbao1 = new ThongBao({
            id_tb: ID_tb_1 + 1,
            id_cty: id_cty,
            id_ng_nhan: ng_thuc_hien,
            id_ng_tao: id_ng_tao,
            type_quyen: 2,
            type_quyen_tao: type_quyen,
            loai_tb: 3,
            add_or_duyet: 1,
            da_xem: 0,
            date_create: new Date().getTime()

        });
        await insert_thongbao1.save();

        let ID_tb_2 = 0;
        let maxID_2 = await ThongBao.findOne({}, {}, { sort: { id_tb: -1 } });
        if (maxID) {
            ID_tb_2 = maxID_2.id_tb;
        }
        //thong boa den nguoi nhan
        let insert_thongbao2 = new ThongBao({
            id_tb: ID_tb_2 + 1,
            id_cty: id_cty,
            id_ng_nhan: khoi_ng_dai_dien_dc_den,
            id_ng_tao: id_ng_tao,
            type_quyen: 2,
            type_quyen_tao: type_quyen,
            loai_tb: 3,
            add_or_duyet: 1,
            da_xem: 0,
            date_create: new Date().getTime()
        });
        await insert_thongbao2.save();
        return res.status(200).json({ data: { insert_dieuchuyen: insert_dieuchuyen, insert_thongbao1: insert_thongbao1, insert_thongbao2: insert_thongbao2 }, message: "thanh cong " });
    } else if (khoi_chon_phong_ban_nv == 1 && khoi_chon_phong_ban_nv == 1) {
        // dieu chuyen tu pb den pb
        let ID_dc = 0;
        let maxIDDc = await DieuChuyen.findOne({}, {}, { sort: { dc_id: -1 } });
        if (maxID) {
            ID_dc = maxIDDc.dc_id;
        }

        let insert_dieuchuyen = new DieuChuyen({
            dc_id: ID_dc + 1,
            id_cty: id_cty,
            dieuchuyen_taisan: dieuchuyen_vippro,
            id_ng_thuchien: ng_thuc_hien,
            id_pb_dang_sd: khoi_dc_tu,
            id_daidien_dangsd: khoi_ng_dai_dien_dc_tu,
            id_pb_nhan: khoi_dc_den,
            id_daidien_nhan: khoi_ng_dai_dien_dc_den,
            dc_lydo: ly_do_dc,
            vi_tri_dc_tu: vitri_dc_tu,
            dc_vitri_tsnhan: vitri_dc_den,
            dc_ngay: ngay_dc,
            dc_trangthai: dc_trang_thai,
            dc_type_quyen: type_quyen,
            dc_type: loai_dc,
            id_ng_tao_dc: id_ng_tao,
            xoa_dieuchuyen: dc_da_xoa,
            dc_date_create: new Date().getTime(),
            dc_date_delete: date_delete,
        });
        await insert_dieuchuyen.save();
        let ID_tb_1 = 0;
        let maxID_1 = await ThongBao.findOne({}, {}, { sort: { id_tb: -1 } });
        if (maxID) {
            ID_tb_1 = maxID_1.id_tb;
        }
        let insert_thongbao1 = new ThongBao({
            id_tb: ID_tb_1 + 1,
            id_cty: id_cty,
            id_ng_nhan: ng_thuc_hien,
            id_ng_tao: id_ng_tao,
            type_quyen: 2,
            type_quyen_tao: type_quyen,
            loai_tb: 3,
            add_or_duyet: 1,
            da_xem: 0,
            date_create: new Date().getTime()

        });
        await insert_thongbao1.save();

        let ID_tb_2 = 0;
        let maxID_2 = await ThongBao.findOne({}, {}, { sort: { id_tb: -1 } });
        if (maxID) {
            ID_tb_2 = maxID_2.id_tb;
        }
        //thong boa den nguoi nhan
        let insert_thongbao2 = new ThongBao({
            id_tb: ID_tb_2 + 1,
            id_cty: id_cty,
            id_ng_nhan: khoi_ng_dai_dien_dc_den,
            id_ng_tao: id_ng_tao,
            type_quyen: 2,
            type_quyen_tao: type_quyen,
            loai_tb: 3,
            add_or_duyet: 1,
            da_xem: 0,
            date_create: new Date().getTime()
        });
        await insert_thongbao2.save();
        return res.status(200).json({ data: { insert_dieuchuyen: insert_dieuchuyen, insert_thongbao1: insert_thongbao1, insert_thongbao2: insert_thongbao2 }, message: "thanh cong " });


    } else {
        return res.status(400).json({ message: "khoi_chon_phong_ban_nv or khoi_chon_phong_ban_nv_den phai la 0 or 1 " })
    } //json({ data: { insert_dieuchuyen: insert_dieuchuyen, insert_thongbao1: insert_thongbao1, insert_thongbao2: insert_thongbao2 }, message: "thanh cong " });



}