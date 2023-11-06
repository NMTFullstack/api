const functions = require('../../services/functions')
const TaiSan = require('../../models/QuanLyTaiSan/TaiSan')
const LoaiTaiSan = require('../../models/QuanLyTaiSan/LoaiTaiSan')
const NhomTaiSan = require('../../models/QuanLyTaiSan/NhomTaiSan')
const CapPhat = require('../../models/QuanLyTaiSan/CapPhat')
const ThuHoi = require('../../models/QuanLyTaiSan/ThuHoi')
const DieuChuyen = require('../../models/QuanLyTaiSan/DieuChuyen')
const SuaChua = require('../../models/QuanLyTaiSan/Sua_chua')
const BaoDuong = require('../../models/QuanLyTaiSan/BaoDuong')
const Quydinh_bd = require('../../models/QuanLyTaiSan/Quydinh_bd')
const DonViCS = require('../../models/QuanLyTaiSan/DonViCS')
const Mat = require('../../models/QuanLyTaiSan/Mat')
const Huy = require('../../models/QuanLyTaiSan/Huy')
const ThanhLy = require('../../models/QuanLyTaiSan/ThanhLy')
const KiemKe = require('../../models/QuanLyTaiSan/KiemKe')
const TheoDoiCongSuat = require('../../models/QuanLyTaiSan/TheoDoiCongSuat')
const qlts = require('../../services/QLTS/qltsService')
const Users = require('../../models/Users')
    // dữ liệu xoá trang chủ
exports.dataDeleteHome = async(req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;

        // khai báo biến phụ
        let data = {};
        // logic
        let demts = await TaiSan.countDocuments({ ts_da_xoa: 1, id_cty: comId });
        let loai_ts = await LoaiTaiSan.countDocuments({ loai_da_xoa: 1, id_cty: comId });
        let nhom_ts = await NhomTaiSan.countDocuments({ nhom_da_xoa: 1, id_cty: comId });
        let ds_ts = demts + loai_ts + nhom_ts;
        let demcp = await CapPhat.countDocuments({ cp_da_xoa: 1, id_cty: comId });
        let demth = await ThuHoi.countDocuments({ xoa_thuhoi: 1, id_cty: comId });
        let demcp_th = demcp + demth;
        let demsc = await SuaChua.countDocuments({ sc_da_xoa: 1, id_cty: comId });
        let dembd = await BaoDuong.countDocuments({ xoa_bd: 1, id_cty: comId });
        let demqd = await Quydinh_bd.countDocuments({ qd_xoa: 1, id_cty: comId });
        let demcs = await DonViCS.countDocuments({ donvi_xoa: 1, id_cty: comId });
        let demsc_bd = demsc + dembd + demqd + demcs;
        let demmat = await Mat.countDocuments({ xoa_dx_mat: 1, id_cty: comId });
        let demhuy = await Huy.countDocuments({ xoa_huy: 1, id_cty: comId });
        let demtl = await ThanhLy.countDocuments({ xoa_dx_tl: 1, id_cty: comId });
        let dem_mht = demmat + demhuy + demtl;
        let demdc = await DieuChuyen.countDocuments({ xoa_dieuchuyen: 1, id_cty: comId });
        let demkk = await KiemKe.countDocuments({ xoa_kiem_ke: 1, id_cty: comId });

        data.danhSachTaiSan = ds_ts;
        data.capPhatThuHoi = demcp_th;
        data.dieuChuyen = demdc;
        data.suaChuaBaoDuong = demsc_bd;
        data.matHuyThanhLy = dem_mht;
        data.kiemKe = demkk;
        return functions.success(res, 'get data success', { data })
    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
};

// danh sách tài sản đã xoá
exports.dataTaiSanDeleted = async(req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let emId = req.user.data._id;
        let type_quyen = req.type;
        // khai báo biến người dùng nhập vào
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;

        // giải thích biến type  1: danh sách tài sản 2: loại tài sản 3: nhóm tài sản
        let type = Number(req.body.type)
        let so_bb = req.body.so_bb;

        // logic phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        let conditions = {}
            // logic
        if (so_bb && type === 1) {
            conditions = { $or: [{ ts_id: Number(so_bb) }, { ts_ten: new RegExp(so_bb, 'i') }] }
        }
        if (so_bb && type === 2) {
            conditions = { $or: [{ ten_loai: new RegExp(so_bb, 'i') }, { id_loai: Number(so_bb) }] }
        }
        if (so_bb && type === 3) {
            conditions = { $or: [{ ten_nhom: new RegExp(so_bb, 'i') }, { id_nhom: Number(so_bb) }] }
        }
        conditions.id_cty = comId
        let dem = {};
        let demTS = await TaiSan.find({ ts_da_xoa: 1, id_cty: comId }).count();

        let demTSloai = await LoaiTaiSan.find({ loai_da_xoa: 1, id_cty: comId }).count();

        let demTSnhom = await NhomTaiSan.find({ nhom_da_xoa: 1, id_cty: comId }).count();
        dem.demts = demTS;
        dem.demloai = demTSloai;
        dem.demnhom = demTSnhom;
        // 1:  tài sản đã xoá
        if (type === 1) {
            return qlts.taiSanXoa(res, TaiSan, dem, conditions, skip, limit, comId);
        }
        // 2: loại tài sản đã xoá
        if (type === 2) {
            return qlts.loaiTaiSanXoa(res, LoaiTaiSan, dem, conditions, skip, limit);
        }
        // 3: nhóm tài sản đã xoá
        if (type === 3) {
            return qlts.nhomTaiSanDaXoa(res, NhomTaiSan, dem, conditions, skip, limit, LoaiTaiSan);
        }
        return functions.setError(res, 'invalid type input', 400)
    } catch (error) {
        return functions.setError(res, error)
    }
};

// danh sách tài sản cấp phát thu hồi đã xoá
exports.dataCapPhatThuHoiDeleted = async(req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let emId = req.emId;
        let type_quyen = req.type;

        // khai báo biến người dùng nhập vào
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let type = Number(req.body.type);
        // logic phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        // giải thích biến type  1: cấp phát 2: thu hồi
        let so_bb = Number(req.body.so_bb);

        // khai báo biến phụ
        let conditions = { id_cty: comId };
        let data = {};
        let dem = {};
        // logic
        if (so_bb && type === 1) conditions.cp_id = so_bb
        if (so_bb && type === 2) conditions.thuhoi_id = so_bb

        let demcp = await CapPhat.find({ cp_da_xoa: 1, id_cty: comId }).count();

        let demthuhoi = await ThuHoi.find({ xoa_thuhoi: 1, id_cty: comId }).count();

        dem.demcp = demcp;
        dem.demthuhoi = demthuhoi;

        // 1: cấp phát
        if (type === 1) {
            return qlts.capPhatXoa(res, CapPhat, dem, conditions, skip, limit);
        }
        // 2: thu hồi
        if (type === 2) {
            return qlts.thuHoiXoa(res, ThuHoi, dem, conditions, skip, limit);
        }
    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
};

// danh sách tài sản điều chuyển bàn giao đã xoá
exports.dataDieuChuyenBanGiaoDeleted = async(req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let type_quyen = req.type;
        let emId = req.emId;
        // khai báo biến người dùng nhập vào
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        // logic phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        // giải thích biến type  1: điều chuyển vị trí tài sản 2: điều chuyển đối tượng sd 3: điều chuyển đơn vị quản lý
        let so_bb = Number(req.body.so_bb);
        let type = Number(req.body.type);
        // khai báo biến phụ
        let conditions = { id_cty: comId };
        let dem = {};
        // logic
        if (so_bb) conditions.dc_id = so_bb
        let vitritaisan = 0;
        let donviquanly = 0;
        let doituongsudung = 0;
        if (type_quyen === 2) {

            vitritaisan = await DieuChuyen.find({ xoa_dieuchuyen: 1, id_cty: comId, dc_type: 0, id_ng_tao_dc: emId }).count();

            donviquanly = await DieuChuyen.find({ xoa_dieuchuyen: 1, id_cty: comId, dc_type: 2, id_ng_tao_dc: emId }).count();

            doituongsudung = await DieuChuyen.find({ xoa_dieuchuyen: 1, id_cty: comId, dc_type: 1, id_ng_tao_dc: emId }).count();
        } else {
            vitritaisan = await DieuChuyen.find({ xoa_dieuchuyen: 1, id_cty: comId, dc_type: 0 }).count();

            donviquanly = await DieuChuyen.find({ xoa_dieuchuyen: 1, id_cty: comId, dc_type: 2 }).count();

            doituongsudung = await DieuChuyen.find({ xoa_dieuchuyen: 1, id_cty: comId, dc_type: 1 }).count();
        }


        dem.vitritaisan = vitritaisan;
        dem.donviquanly = donviquanly;
        dem.doituongsudung = doituongsudung;

        //1: điều chuyển vị trí tài sản
        if (type === 1) {
            if (type_quyen === 2) conditions.id_ng_tao_dc = emId
            return qlts.dieuChuyenViTriTaiSanDaXoa(res, DieuChuyen, dem, conditions, skip, limit, comId);
        }
        //2: điều chuyển đối tượng sd
        if (type === 2) {
            if (type_quyen === 2) conditions.id_ng_tao_dc = emId
            return qlts.dieuChuyenDoiTuongSdDaXoa(res, DieuChuyen, dem, conditions, skip, limit);
        }

        //3: điều chuyển đơn vị quản lý
        if (type === 3) {
            if (type_quyen === 2) conditions.id_ng_tao_dc = emId
            return qlts.dieuChuyenDonViQuanLyDaXoa(res, DieuChuyen, dem, conditions, skip, limit);
        }
    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
};

// danh sách kiểm kê đã xoá
exports.dataKiemKeDaXoa = async(req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;

        // khai báo biến người dùng nhập vào
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let so_bb = Number(req.body.so_bb);
        // logic phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        // khai báo biến phụ
        let conditions = { id_cty: comId };

        if (so_bb) conditions.id_kiemke = so_bb

        let tongSoLuong = await KiemKe.find({ id_cty: comId, xoa_kiem_ke: 1 }).count();

        conditions.xoa_kiem_ke = 1
        let data = await KiemKe.aggregate([
            { $match: conditions },
            { $sort: { id_kiemke: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "Users",
                    localField: "id_cty",
                    foreignField: "_id",
                    as: "company"
                }
            },
            { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'id_ngtao_kk',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: 'Users',
                    localField: 'kk_id_ng_xoa',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            { $unwind: { path: "$users", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: 'Users',
                    localField: 'id_ng_kiemke',
                    foreignField: '_id',
                    as: 'usersid_ng_kiemke'
                }
            },
            { $unwind: { path: "$usersid_ng_kiemke", preserveNullAndEmptyArrays: true } },

            {
                $project: {
                    kk_date_create: 1,
                    kk_date_delete: 1,
                    kk_ky: 1,
                    kk_denngay: 1,
                    kk_batdau: 1,
                    kk_ketthuc: 1,
                    id_ngtao_kk: '$user.userName',
                    kk_id_ng_xoa: '$users.userName',
                    id_ng_kiemke: '$usersid_ng_kiemke.userName',
                    "vitri": "$company.address",
                    id_kiemke: 1,
                    kk_loai: 1,
                    kk_noidung: 1,
                    kk_tiendo: 1,
                }
            }
        ])
        let com = await Users.findOne({ idQLC: comId }, { userName: 1, address: 1 })
        for (let i = 0; i < data.length; i++) {
            data[i].ngaytao = new Date(data[i].kk_date_create * 1000)
            data[i].ngayxoa = new Date(data[i].kk_date_delete * 1000)
            data[i].kk_ky = new Date(data[i].kk_ky * 1000)
            data[i].kk_denngay = new Date(data[i].kk_denngay * 1000)
            data[i].kk_batdau = new Date(data[i].kk_batdau * 1000)
            data[i].kk_ketthuc = new Date(data[i].kk_ketthuc * 1000)
            if (com) {
                data[i].donvi_kk = com.userName
                data[i].vitri_kk = com.address
            }
        }

        return functions.success(res, 'get data success', { tongSoLuong, data })

    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
};

// danh sách sửa chữa đã xoá
exports.taiSanSuaChuaDaXoa = async(req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let type = req.type;
        let emId = req.emId;

        // khai báo biến người dùng nhập vào
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let so_bb = Number(req.body.so_bb);
        let typebb = Number(req.body.type) || 1;
        // logic phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        // khai báo biến phụ
        let conditions = {};
        let dem = {};


        // logic
        if (type === 2) {
            conditions = { id_cty: comId, $or: [{ sc_id_ng_tao: emId }, { sc_ng_thuchien: emId }] };
        }
        if (so_bb) conditions.sc_id = so_bb
        conditions.id_cty = comId;
        conditions.sc_da_xoa = 1;
        let cansuachua = 0;
        let dangsuachua = 0;
        let dasuachua = 0;

        if (type === 2) {
            cansuachua = await SuaChua.find({ sc_trangthai: { $in: [0, 2] }, id_cty: comId, sc_da_xoa: 1, $or: [{ sc_id_ng_tao: emId }, { sc_ng_thuchien: emId }] }).count();

            dangsuachua = await SuaChua.find({ sc_trangthai: 1, id_cty: comId, sc_da_xoa: 1, $or: [{ sc_id_ng_tao: emId }, { sc_ng_thuchien: emId }] }).count();

            dasuachua = await SuaChua.find({ sc_trangthai: 3, id_cty: comId, sc_da_xoa: 1, $or: [{ sc_id_ng_tao: emId }, { sc_ng_thuchien: emId }] }).count();
        } else {
            cansuachua = await SuaChua.find({ sc_trangthai: { $in: [0, 2] }, id_cty: comId, sc_da_xoa: 1 }).count();

            dangsuachua = await SuaChua.find({ sc_trangthai: 1, id_cty: comId, sc_da_xoa: 1 }).count();

            dasuachua = await SuaChua.find({ sc_trangthai: 3, id_cty: comId, sc_da_xoa: 1 }).count();
        }


        dem.cansuachua = cansuachua;
        dem.dangsuachua = dangsuachua;
        dem.dasuachua = dasuachua;

        //1: tài sản cần sửa chữa
        if (typebb === 1) {
            return qlts.canSuaChua(res, SuaChua, dem, conditions, skip, limit);
        }
        //2: tài sản đang sửa chữa
        if (typebb === 2) {
            return qlts.dangSuaChua(res, SuaChua, dem, conditions, skip, limit);
        }

        //3: tài sản đã sửa chữa
        if (typebb === 3) {
            return qlts.daSuaChua(res, SuaChua, dem, conditions, skip, limit);
        }
    } catch (error) {
        console.error(error)
        return functions.setError(res, error);
    }
};

// danh sách bảo dưỡng đã xoá
exports.baoDuongDaXoa = async(req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let type = req.type;
        let emId = req.emId;

        // khai báo biến người dùng nhập vào
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let so_bb = req.body.so_bb;
        let typebb = Number(req.body.type) || 1;
        // logic phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        // khai báo biến phụ
        let conditions = {};
        let dem = {};


        // logic
        if (type === 2) {
            conditions = {
                id_cty: comId,
                $or: [{ bd_id_ng_tao: emId }, { bd_ng_thuchien: emId }, { bd_ng_sd: emId }, { bd_vi_tri_dang_sd: emId }]
            };
        }
        if (so_bb) conditions.id_bd = Number(so_bb)

        conditions.id_cty = comId;

        conditions.xoa_bd = 1;

        let canbaoduong = 0;
        let dangbaoduong = 0;
        let dabaoduong = 0;
        if (type === 2) {
            canbaoduong = await BaoDuong.find({
                bd_trang_thai: { $in: [0, 2] },
                id_cty: comId,
                xoa_bd: 1,
                $or: [{ bd_id_ng_tao: emId },
                    { bd_ng_thuchien: emId },
                    { bd_ng_sd: emId },
                    { bd_vi_tri_dang_sd: emId }
                ]
            }).count();

            dangbaoduong = await BaoDuong.find({
                bd_trang_thai: 0,
                id_cty: comId,
                xoa_bd: 1,
                $or: [{ bd_id_ng_tao: emId },
                    { bd_ng_thuchien: emId },
                    { bd_ng_sd: emId },
                    { bd_vi_tri_dang_sd: emId }
                ]
            }).count();

            dabaoduong = await BaoDuong.find({
                bd_trang_thai: 1,
                id_cty: comId,
                xoa_bd: 1,
                $or: [{ bd_id_ng_tao: emId },
                    { bd_ng_thuchien: emId },
                    { bd_ng_sd: emId },
                    { bd_vi_tri_dang_sd: emId }
                ]
            }).count();
        } else {
            canbaoduong = await BaoDuong.find({ bd_trang_thai: { $in: [0, 2] }, id_cty: comId, xoa_bd: 1 }).count();

            dangbaoduong = await BaoDuong.find({ bd_trang_thai: 0, id_cty: comId, xoa_bd: 1 }).count();

            dabaoduong = await BaoDuong.find({ bd_trang_thai: 1, id_cty: comId, xoa_bd: 1 }).count();
        }


        let thietlaplichbd = 0;

        if (type === 1) {
            thietlaplichbd = await Quydinh_bd.find({ id_cty: comId, qd_xoa: 1 }).count();
        } else {
            thietlaplichbd = await Quydinh_bd.find({ id_cty: comId, qd_xoa: 1, id_ng_tao_qd: emId }).count();
        }

        let theodoics = await TheoDoiCongSuat.find({ id_cty: comId, tdcs_xoa: 1 }).count();


        dem.canbaoduong = canbaoduong;
        dem.dangbaoduong = dangbaoduong;
        dem.dabaoduong = dabaoduong;
        dem.thietlaplichbd = thietlaplichbd;
        dem.theodoics = theodoics;

        //1: tài sản cần bảo dưỡng
        if (typebb === 1) {
            return qlts.canBaoDuong(res, BaoDuong, dem, conditions, skip, limit);
        }
        //2: tài sản đang bảo dưỡng
        if (typebb === 2) {
            return qlts.dangBaoDuong(res, BaoDuong, dem, conditions, skip, limit);
        }

        //3: tài sản đã bảo dưỡng
        if (typebb === 3) {
            return qlts.daBaoDuong(res, BaoDuong, dem, conditions, skip, limit);
        }

        //4: thiết lập lịch bảo dưỡng
        if (typebb === 4) {
            let condition = {}
            condition.qd_xoa = 1;
            condition.id_cty = comId;
            if (type === 2) condition.id_ng_tao_qd = emId;
            let search = {}
            if (so_bb) {
                search = { $or: [{ 'loaitaisan.id_loai': Number(so_bb) }, { 'loaitaisan.ten_loai': { $regex: so_bb, $options: 'i' } }] }
            }
            return qlts.thietLapLichBaoDuong(res, Quydinh_bd, dem, condition, skip, limit, search);
        }

        //5: Quản lý đơn vị đo công suất
        if (typebb === 5) {
            let condition = {}
            condition.donvi_xoa = 1;
            condition.id_cty = comId;
            return qlts.quanLyDonViDoCongSuat(res, DonViCS, dem, condition, skip, limit);
        }
        //6: Theo dõi công suất
        if (typebb === 6) {
            let condition = {}
            condition.tdcs_xoa = 1;
            condition.id_cty = comId;

            return qlts.theoDoiCongSuat(res, TheoDoiCongSuat, dem, condition, skip, limit);
        }
    } catch (error) {
        return functions.setError(res, error)
    }
};

// danh sách tài sản báo mất đã xoá
exports.taiSanBaomatDaXoa = async(req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let type = req.type;
        let emId = req.emId;

        // khai báo biến người dùng nhập vào
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let so_bb = Number(req.body.so_bb);
        let typebb = Number(req.body.type) || 1;
        // logic phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        // khai báo biến phụ
        let conditions = {};
        let dem = {};


        // logic
        if (type === 2) {
            conditions = {
                id_ng_tao: emId
            };
        }
        if (so_bb) conditions.mat_id = so_bb

        conditions.id_cty = comId;

        conditions.xoa_dx_mat = 1;

        let taisanbaomat = 0;
        let taisanchodenbu = 0;
        let danhsachtaisanmat = 0;
        if (type === 2) {
            taisanbaomat = await Mat.find({ mat_trangthai: { $in: [0, 2] }, id_cty: comId, xoa_dx_mat: 1, id_ng_tao: emId }).count();

            taisanchodenbu = await Mat.find({ mat_trangthai: 3, id_cty: comId, xoa_dx_mat: 1, id_ng_tao: emId }).count();

            danhsachtaisanmat = await Mat.find({ mat_trangthai: 1, id_cty: comId, xoa_dx_mat: 1, id_ng_tao: emId }).count();
        } else {
            taisanbaomat = await Mat.find({ mat_trangthai: { $in: [0, 2] }, id_cty: comId, xoa_dx_mat: 1 }).count();

            taisanchodenbu = await Mat.find({ mat_trangthai: 3, id_cty: comId, xoa_dx_mat: 1 }).count();

            danhsachtaisanmat = await Mat.find({ mat_trangthai: 1, id_cty: comId, xoa_dx_mat: 1 }).count();
        }



        dem.taisanbaomat = taisanbaomat;
        dem.taisanchodenbu = taisanchodenbu;
        dem.danhsachtaisanmat = danhsachtaisanmat;

        //1: tài sản báo mất
        if (typebb === 1) {
            return qlts.taiSanBaoMat(res, Mat, dem, conditions, skip, limit);
        }
        //2: tài sản chờ đền bù
        if (typebb === 2) {
            return qlts.taiSanChoDenBu(res, Mat, dem, conditions, skip, limit);
        }

        //3: danh sách tài sản mất
        if (typebb === 3) {
            return qlts.danhSachTaiSanMat(res, Mat, dem, conditions, skip, limit);
        }

    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
};

// danh sách tài sản huỷ đã xoá
exports.taiSanBaoHuyDaXoa = async(req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let type = req.type;
        let emId = req.emId;

        // khai báo biến người dùng nhập vào
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let so_bb = Number(req.body.so_bb);
        let typebb = Number(req.body.type) || 1;
        // logic phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        // khai báo biến phụ
        let conditions = {};
        let dem = {};


        // logic
        if (type === 2) {
            conditions = {
                id_ng_tao: emId
            };
        }
        if (so_bb) conditions.huy_id = so_bb

        conditions.id_cty = comId;

        conditions.xoa_huy = 1;

        let taisandexuathuy = 0;

        let danhsachtaisanhuy = 0;

        if (type === 2) {
            taisandexuathuy = await Huy.find({ huy_trangthai: { $in: [0, 2] }, id_cty: comId, xoa_huy: 1, id_ng_tao: emId }).count();

            danhsachtaisanhuy = await Huy.find({ huy_trangthai: 1, id_cty: comId, xoa_huy: 1, id_ng_tao: emId }).count();
        } else {
            taisandexuathuy = await Huy.find({ huy_trangthai: { $in: [0, 2] }, id_cty: comId, xoa_huy: 1 }).count();

            danhsachtaisanhuy = await Huy.find({ huy_trangthai: 1, id_cty: comId, xoa_huy: 1 }).count();
        }


        dem.taisandexuathuy = taisandexuathuy;
        dem.danhsachtaisanhuy = danhsachtaisanhuy;


        //1: tài sản đề xuất huỷ
        if (typebb === 1) {
            return qlts.taiSanDeXuatHuy(res, Huy, dem, conditions, skip, limit);
        }
        //2: danh sách tài sản huỷ
        if (typebb === 2) {
            return qlts.danhSachTaiSanHuy(res, Huy, dem, conditions, skip, limit);
        }


    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
};

// danh sách tài sản thanh lý đã xoá
exports.taiSanThanhLyDaXoa = async(req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let type = req.type;
        let emId = req.emId;

        // khai báo biến người dùng nhập vào
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let so_bb = Number(req.body.so_bb);
        let typebb = Number(req.body.type) || 1;
        // logic phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        // khai báo biến phụ
        let conditions = {};
        let dem = {};


        // logic
        if (type === 2) {
            conditions = {
                id_ng_tao: emId
            };
        }
        if (so_bb) conditions.tl_id = so_bb

        conditions.id_cty = comId;

        conditions.xoa_dx_tl = 1;

        let taisandexuatthanhly = 0;
        let danhsachtaisandathanhly = 0;
        if (type === 2) {
            taisandexuatthanhly = await ThanhLy.find({ tl_trangthai: { $in: [0, 2] }, id_cty: comId, xoa_dx_tl: 1, id_ngtao: emId }).count();

            danhsachtaisandathanhly = await ThanhLy.find({ tl_trangthai: 3, id_cty: comId, xoa_dx_tl: 1, id_ngtao: emId }).count();
        } else {
            taisandexuatthanhly = await ThanhLy.find({ tl_trangthai: { $in: [0, 2] }, id_cty: comId, xoa_dx_tl: 1 }).count();

            danhsachtaisandathanhly = await ThanhLy.find({ tl_trangthai: 3, id_cty: comId, xoa_dx_tl: 1 }).count();
        }


        dem.taisandexuatthanhly = taisandexuatthanhly;
        dem.danhsachtaisandathanhly = danhsachtaisandathanhly;


        //1: tài sản đề xuất thanh lý
        if (typebb === 1) {
            return qlts.taiSanDeXuatThanhLy(res, ThanhLy, dem, conditions, skip, limit);
        }
        //2: danh sách tài sản đã thanh lý
        if (typebb === 2) {
            return qlts.taiSanDaThanhLy(res, ThanhLy, dem, conditions, skip, limit);
        }


    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
};