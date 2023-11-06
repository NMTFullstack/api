const functions = require('../../services/functions')
const ThanhLy = require('../../models/QuanLyTaiSan/ThanhLy');
const TaiSan = require('../../models/QuanLyTaiSan/TaiSan');
const ThongBao = require('../../models/QuanLyTaiSan/ThongBao');
const TaiSanDangSuDung = require('../../models/QuanLyTaiSan/TaiSanDangSuDung');
const QuaTrinhSuDung = require('../../models/QuanLyTaiSan/QuaTrinhSuDung');
const Users = require('../../models/Users');
const Department = require('../../models/qlc/Deparment');

// tạo đề xuất tài sản thanh lý
exports.createLiquidationAssetProposal = async (req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let emId = req.emId;
        let type_quyen = req.type;

        // khai báo biến người dùng nhập vào
        let tentstl = Number(req.body.tentstl);
        let sl_tl = Number(req.body.sl_tl);
        let lydo_thanhly = req.body.lydo_thanhly;

        // khai báo biến phụ
        let id_ng_tao = comId;
        let id_ng_dexuat = comId;
        let date = new Date().getTime() / 1000;

        // logic 
        if (type_quyen === 2) {
            id_ng_tao = emId;
            id_ng_dexuat = emId;
        }
        if (sl_tl && lydo_thanhly && tentstl) {
            let check_gt_ts = await TaiSan.findOne({ ts_id: tentstl, id_cty: comId }, { ts_gia_tri: 1 })
            if (check_gt_ts) {
                let gt_ts = check_gt_ts.ts_gia_tri;
                let tl_id = await functions.getMaxIdByField(ThanhLy, 'tl_id');
                // tạo bản ghi bảng thanh lý
                await ThanhLy.create({
                    tl_id,
                    thanhly_taisan: tentstl,
                    id_ngdexuat: id_ng_dexuat,
                    id_cty: comId,
                    id_ngtao: id_ng_tao,
                    tl_soluong: sl_tl,
                    tl_giatri: gt_ts,
                    tl_lydo: lydo_thanhly,
                    tl_type_quyen: type_quyen,
                    tl_date_create: date
                });
                // tạo bản ghi bảng thông báo
                let id_tb = await functions.getMaxIdByField(ThongBao, 'id_tb');
                await ThongBao.create({
                    id_tb,
                    id_cty: comId,
                    id_ng_nhan: comId,
                    id_ng_tao: id_ng_tao,
                    type_quyen: 2,
                    type_quyen_tao: type_quyen,
                    loai_tb: 8,
                    add_or_duyet: 1,
                    da_xem: 0,
                    date_create: date
                })
                return functions.success(res, 'Tạo đề xuất thanh lý tài sản thành công')
            }
            return functions.setError(res, 'Không tìm thấy tài sản', 404)
        }
        return functions.setError(res, 'Missing data input', 400)
    } catch (error) {
        console.error(error)
        return functions.setError(res, error);
    }
};

// danh sách đề xuất tài sản thanh lý
exports.getDataLiquidationAssetProposal = async (req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let emId = req.emId;
        let type_quyen = req.type;

        // khai báo biến người dùng nhập vào
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let keywords = Number(req.body.keywords);

        // logic phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        // khai báo biến phụ
        let conditions = {};
        // logic xử lý
        // khai báo điều kiện tìm kiếm
        if (type_quyen === 2) { conditions = { $or: [{ id_ng_tao: emId }, { id_ngdexuat: emId }] } }

        conditions.id_cty = comId;

        conditions.xoa_dx_tl = 0;

        conditions.tl_trangthai = { $in: [0, 2] }


        if (keywords) conditions.tl_id = keywords



        // số lượng tài sản đề xuất thanh lý
        let countTaiSanDeXuatThanhLy = await ThanhLy.find(conditions).count();

        // số lượng tài sản đã thanh lý
        conditions.tl_trangthai = 3;
        let countTaiSanDaThanhLy = await ThanhLy.find(conditions).count();

        conditions.tl_trangthai = { $in: [0, 2] }
        // dữ liệu tài sản đề xuất thanh lý
        let taiSanDeXuatThanhLy = await ThanhLy.aggregate([
            { $match: conditions },
            { $sort: { tl_id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'QLTS_Tai_San',
                    localField: 'thanhly_taisan',
                    foreignField: 'ts_id',
                    as: 'taisan',
                }
            },
            { $unwind: { path: '$taisan' } },
            {
                $lookup: {
                    from: 'QLTS_Loai_Tai_San',
                    localField: 'taisan.id_loai_ts',
                    foreignField: 'id_loai',
                    as: 'loaiTS',
                }
            },
            { $unwind: { path: "$loaiTS" } },
            {
                $project: {
                    sobienban: '$tl_id',
                    ngaytao: '$tl_date_create',
                    tl_type_quyen: 1,
                    trangthai: '$tl_trangthai',
                    mataisan: '$taisan.ts_id',
                    tentaisan: '$taisan.ts_ten',
                    giatritaisan: '$taisan.ts_gia_tri',
                    soluong: '$tl_soluong',
                    lydo: '$tl_lydo',
                    ngdexuat: '$id_ngdexuat'
                }
            }
        ]);
        for (let i = 0; i < taiSanDeXuatThanhLy.length; i++) {

            // trả về định dạng ngày
            taiSanDeXuatThanhLy[i].ngaytao = new Date(taiSanDeXuatThanhLy[i].ngaytao * 1000);


            // lấy quyền người dùng đã đề xuất
            let tl_type_quyen = taiSanDeXuatThanhLy[i].tl_type_quyen;

            // lấy thông tin user
            let user = await Users.findOne({ _id: taiSanDeXuatThanhLy[i].ngdexuat }, { userName: 1, inForPerson: 1, address: 1 })
            if (user) {

                taiSanDeXuatThanhLy[i].ngdexuat = user.userName
                if (tl_type_quyen === 1) {
                    taiSanDeXuatThanhLy[i].phongban = user.userName
                }

                if (tl_type_quyen === 2 && user.inForPerson && user.inForPerson.employee) {
                    let dep = await Department.findOne({ dep_id: user.inForPerson.employee.dep_id })
                    taiSanDeXuatThanhLy[i].phongban = dep.dep_name
                }

                if (tl_type_quyen === 3 && user.inForPerson && user.inForPerson.employee) {
                    let dep = await Department.findOne({ dep_id: user.inForPerson.employee.dep_id })
                    taiSanDeXuatThanhLy[i].ngdexuat = dep.dep_name
                    taiSanDeXuatThanhLy[i].phongban = dep.dep_name
                }
            }

        }
        return functions.success(res, 'get data success', { countTaiSanDeXuatThanhLy, countTaiSanDaThanhLy, data: taiSanDeXuatThanhLy })
    } catch (error) {
        console.error(error)
        return functions.setError(res, error);
    }
};

// duyệt đề xuất tài sản thanh lý
exports.approveLiquidationAssetProposal = async (req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let emId = req.emId;
        let type_quyen = req.type;

        // khai báo biến người dùng nhập vào
        let bb_tl = Number(req.body.bb_tl);
        let giatri_TS = Number(req.body.giatri_TS);
        let chon_gt_tl = Number(req.body.chon_gt_tl);
        let day_thanhly = req.body.day_thanhly;
        let soluong_thanhly = Number(req.body.soluong_thanhly);
        let phan_tram_nhap = Number(req.body.phan_tram_nhap);
        let so_tien_nhap = Number(req.body.so_tien_nhap);
        let lydo_thanhly = req.body.lydo_thanhly;
        let so_tien_da_tinh = Number(req.body.so_tien_da_tinh);
        let ten_TS_thanhly = req.body.ten_TS_thanhly;

        // khai báo biến phụ 
        let ngay_duyet = new Date().getTime() / 1000;

        // logic 
        let id_ng_duyet = comId;

        if (type_quyen === 2) id_ng_duyet = emId;

        let so_tien_duyet_vippro = so_tien_da_tinh;

        if (chon_gt_tl === 0) so_tien_duyet_vippro = so_tien_nhap;

        if (bb_tl && giatri_TS && [0, 1].includes(chon_gt_tl) &&
            functions.checkTime(day_thanhly) && soluong_thanhly
            && lydo_thanhly && ten_TS_thanhly) {

            let checkThanhLy = await ThanhLy.findOne({ tl_id: bb_tl, id_cty: comId })

            if (checkThanhLy) {

                let id_ng_nhan = checkThanhLy.id_ngtao;

                let quyen_nhan = checkThanhLy.tl_type_quyen;

                if (quyen_nhan === 1) {
                    let doi_tuong_ds_ts = await TaiSan.findOne({ id_cty: comId, ts_id: checkThanhLy.thanhly_taisan });

                    if (doi_tuong_ds_ts) {

                        let sl_ts_dang_sd = doi_tuong_ds_ts.ts_so_luong;

                        if (sl_ts_dang_sd > soluong_thanhly) {
                            await ThanhLy.findOneAndUpdate(
                                { tl_id: bb_tl, id_cty: comId },
                                {
                                    id_ng_duyet: id_ng_duyet,
                                    ngay_duyet: ngay_duyet,
                                    type_quyen_duyet: type_quyen,
                                    tl_ngay: new Date(day_thanhly).getTime() / 1000,
                                    tl_soluong: soluong_thanhly,
                                    tl_sotien: so_tien_duyet_vippro,
                                    tl_loai_gt: chon_gt_tl,
                                    tl_trangthai: 3,
                                    tl_phantram: phan_tram_nhap
                                });

                            await TaiSan.findOneAndUpdate(
                                { id_cty: comId, ts_id: checkThanhLy.tl_id },
                                {
                                    // ts_so_luong: { $inc: -soluong_thanhly },
                                    // soluong_cp_bb: { $inc: -soluong_thanhly }
                                    $inc: { ts_so_luong: -soluong_thanhly },
                                    $inc: { soluong_cp_bb: -soluong_thanhly },

                                });

                            let id_tb = await functions.getMaxIdByField(ThongBao, 'id_tb');
                            await ThongBao.create({
                                id_tb,
                                id_cty: comId,
                                id_ng_nhan: id_ng_nhan,
                                id_ng_tao: comId,
                                type_quyen: quyen_nhan,
                                type_quyen_tao: 2,
                                loai_tb: 8,
                                add_or_duyet: 2,
                                da_xem: 0,
                                date_create: ngay_duyet
                            })

                            let quatrinh_id = await functions.getMaxIdByField(QuaTrinhSuDung, 'quatrinh_id');
                            await QuaTrinhSuDung.create({
                                quatrinh_id,
                                id_ts: checkThanhLy.thanhly_taisan,
                                id_bien_ban: bb_tl,
                                so_lg: soluong_thanhly,
                                id_cty: comId,
                                id_cty_sudung: comId,
                                qt_ngay_thuchien: checkThanhLy.tl_date_create,
                                qt_nghiep_vu: 8,
                                ghi_chu: checkThanhLy.tl_lydo,
                                time_created: ngay_duyet
                            })
                            return functions.success(res, 'Duyệt đề xuất thanh lý thành công')
                        }
                        return functions.setError(res, 'Số lượng không hợp lệ', 404)
                    }
                    return functions.setError(res, 'Không tìm thấy tài sản', 404)
                } else if (quyen_nhan === 2) {

                    let doi_tuong_ds_ts = await TaiSanDangSuDung.findOne({ com_id_sd: comId, id_ts_sd: checkThanhLy.thanhly_taisan, id_nv_sd: id_ng_nhan });

                    if (doi_tuong_ds_ts) {
                        let sl_ts_dang_sd = doi_tuong_ds_ts.sl_dang_sd;
                        if (sl_ts_dang_sd > soluong_thanhly) {
                            await ThanhLy.findOneAndUpdate(
                                { tl_id: bb_tl, id_cty: comId },
                                {
                                    id_ng_duyet: id_ng_duyet,
                                    ngay_duyet: ngay_duyet,
                                    type_quyen_duyet: type_quyen,
                                    tl_ngay: new Date(day_thanhly).getTime() / 1000,
                                    tl_soluong: soluong_thanhly,
                                    tl_sotien: so_tien_duyet_vippro,
                                    tl_loai_gt: chon_gt_tl,
                                    tl_trangthai: 3,
                                    tl_phantram: phan_tram_nhap
                                }
                            );

                            await TaiSanDangSuDung.findOneAndUpdate(
                                { com_id_sd: comId, id_ts_sd: checkThanhLy.thanhly_taisan, id_nv_sd: id_ng_nhan },
                                { $inc: { sl_dang_sd: -soluong_thanhly } }

                            );
                            let id_tb = await functions.getMaxIdByField(ThongBao, 'id_tb');
                            await ThongBao.create({
                                id_tb,
                                id_cty: comId,
                                id_ng_nhan: id_ng_nhan,
                                id_ng_tao: comId,
                                type_quyen: quyen_nhan,
                                type_quyen_tao: 2,
                                loai_tb: 8,
                                add_or_duyet: 2,
                                da_xem: 0,
                                date_create: ngay_duyet
                            })
                            let quatrinh_id = await functions.getMaxIdByField(QuaTrinhSuDung, 'quatrinh_id');
                            await QuaTrinhSuDung.create({
                                quatrinh_id,
                                id_ts: checkThanhLy.thanhly_taisan,
                                id_bien_ban: bb_tl,
                                so_lg: soluong_thanhly,
                                id_cty: comId,
                                id_ng_sudung: id_ng_nhan,
                                qt_ngay_thuchien: checkThanhLy.tl_date_create,
                                qt_nghiep_vu: 8,
                                ghi_chu: checkThanhLy.tl_lydo,
                                time_created: ngay_duyet
                            })
                            return functions.success(res, 'Duyệt đề xuất thanh lý thành công')
                        }
                        return functions.setError(res, 'Số lượng không hợp lệ', 404)
                    }
                    return functions.setError(res, 'Không tìm thấy tài sản đang sử dụng', 404)
                } else if (quyen_nhan === 3) {
                    let doi_tuong_ds_ts = await TaiSanDangSuDung.findOne({ com_id_sd: comId, id_ts_sd: checkThanhLy.thanhly_taisan, id_pb_sd: id_ng_nhan });

                    if (doi_tuong_ds_ts) {
                        let sl_ts_dang_sd = doi_tuong_ds_ts.sl_dang_sd;
                        if (sl_ts_dang_sd > soluong_thanhly) {

                            await ThanhLy.findOneAndUpdate(
                                { tl_id: bb_tl, id_cty: comId },
                                {
                                    id_ng_duyet: id_ng_duyet,
                                    ngay_duyet: ngay_duyet,
                                    type_quyen_duyet: type_quyen,
                                    tl_ngay: new Date(day_thanhly).getTime() / 1000,
                                    tl_soluong: soluong_thanhly,
                                    tl_sotien: so_tien_duyet_vippro,
                                    tl_loai_gt: chon_gt_tl,
                                    tl_trangthai: 3,
                                    tl_phantram: phan_tram_nhap
                                }
                            );

                            await TaiSanDangSuDung.findOneAndUpdate(
                                { com_id_sd: comId, id_ts_sd: checkThanhLy.thanhly_taisan, id_pb_sd: id_ng_nhan },
                                { $inc: { sl_dang_sd: -soluong_thanhly } }
                            );

                            let id_tb = await functions.getMaxIdByField(ThongBao, 'id_tb');
                            await ThongBao.create({
                                id_tb,
                                id_cty: comId,
                                id_ng_nhan: id_ng_nhan,
                                id_ng_tao: comId,
                                type_quyen: quyen_nhan,
                                type_quyen_tao: 2,
                                loai_tb: 8,
                                add_or_duyet: 2,
                                da_xem: 0,
                                date_create: ngay_duyet
                            })

                            let quatrinh_id = await functions.getMaxIdByField(QuaTrinhSuDung, 'quatrinh_id');
                            await QuaTrinhSuDung.create({
                                quatrinh_id,
                                id_ts: checkThanhLy.thanhly_taisan,
                                id_bien_ban: bb_tl,
                                so_lg: soluong_thanhly,
                                id_cty: comId,
                                id_ng_sudung: id_ng_nhan,
                                qt_ngay_thuchien: checkThanhLy.tl_date_create,
                                qt_nghiep_vu: 8,
                                ghi_chu: checkThanhLy.tl_lydo,
                                time_created: ngay_duyet
                            })
                            return functions.success(res, 'Duyệt đề xuất thanh lý thành công')
                        }
                        return functions.setError(res, 'Số lượng không hợp lệ', 404)
                    }
                    return functions.setError(res, 'Không tìm thấy tài sản đang sử dụng', 404)
                }
            }
            return functions.setError(res, `Không tìm thấy dữ liệu thanh lý`, 400);
        }
        return functions.setError(res, `Missing data input`, 400);
    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
};

// từ chối đề xuất tài sản thanh lý
exports.rejectLiquidationAssetProposal = async (req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = Number(req.comId);

        // khai báo biến lấy dữ liệu từ người dùng
        let id_bb = Number(req.body.id_bb);
        let content = req.body.content;

        // logic xử lý
        let checkThanhLy = await ThanhLy.findOne({ tl_id: id_bb, id_cty: comId })
        if (checkThanhLy) {
            await ThanhLy.findOneAndUpdate({ tl_id: id_bb }, {
                tl_trangthai: 2,
                tl_lydo_tuchoi: content
            })
            return functions.success(res, 'Từ chối đề xuất thanh lý tài sản thành công')
        }
        return functions.setError(res, 'Không tìm thấy đề xuất thanh lý tài sản', 404)
    } catch (error) {
        return functions.setError(res, error)
    }
}

// xoá đề xuất tài sản thanh lý
exports.deleteLiquidationAssetProposal = async (req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let type_quyen = Number(req.type);
        let comId = Number(req.comId);
        let emId = Number(req.emId);

        // khai báo id người dùng muốn xoá
        let id = req.body.id;
        let type = Number(req.body.type);

        // xử lý trường id người xoá
        let id_ng_xoa = comId;
        if (type_quyen === 2) {
            id_ng_xoa = emId;
        }
        if (type === 1) {
            // logic xử lý
            if (Array.isArray(id) === true) {
                for (let i = 0; i < id.length; i++) {
                    await ThanhLy.findOneAndUpdate({ tl_id: id[i] }, {
                        xoa_dx_tl: 1,
                        tl_type_quyen_xoa: type_quyen,
                        tl_id_ng_xoa: id_ng_xoa,
                        tl_date_delete: new Date().getTime() / 1000,
                    })
                }
                return functions.success(res, 'Xoá đề xuất thanh lý tài sản thành công')
            } else {
                await ThanhLy.findOneAndUpdate({ tl_id: Number(id) }, {
                    xoa_dx_tl: 1,
                    tl_type_quyen_xoa: type_quyen,
                    tl_id_ng_xoa: id_ng_xoa,
                    tl_date_delete: new Date().getTime() / 1000,
                })
                return functions.success(res, 'Xoá 1 đề xuất thanh lý tài sản thành công')
            }
        } else if (type === 2) {
            if (Array.isArray(id) === true) {
                for (let i = 0; i < id.length; i++) {
                    await ThanhLy.findOneAndUpdate({ tl_id: id[i] }, {
                        xoa_dx_tl: 0,
                        tl_type_quyen_xoa: 0,
                        tl_id_ng_xoa: 0,
                        tl_date_delete: 0,
                    })
                }
                return functions.success(res, 'Khôi phục đề xuất thanh lý tài sản thành công')
            } else {
                await ThanhLy.findOneAndUpdate({ tl_id: Number(id) }, {
                    xoa_dx_tl: 0,
                    tl_type_quyen_xoa: 0,
                    tl_id_ng_xoa: 0,
                    tl_date_delete: 0,
                })
                return functions.success(res, 'Khôi phục 1 đề xuất thanh lý tài sản thành công')
            }
        } else if (type === 3) {
            if (Array.isArray(id) === true) {
                for (let i = 0; i < id.length; i++) {
                    await ThanhLy.findOneAndDelete({ tl_id: id[i] })
                }
                return functions.success(res, 'Xoá vĩnh viễn đề xuất thanh lý tài sản thành công')
            } else {
                await ThanhLy.findOneAndDelete({ tl_id: Number(id) })
                return functions.success(res, 'Xoá vĩnh viễn 1 đề xuất thanh lý tài sản thành công')
            }
        }
        return functions.setError(res, 'Missing type', 400)
    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
};

// chi tiết đề xuất tài sản thanh lý
exports.detailLiquidationAssetProposal = async (req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let type_quyen = Number(req.type);
        let comId = Number(req.comId);
        let emId = Number(req.emId);

        // khai báo biến người dùng nhập
        let id = Number(req.query.id);

        //logic
        if (id) {
            let chiTiet = await ThanhLy.aggregate([
                { $match: { id_cty: comId, tl_id: id } },
                {
                    $lookup: {
                        from: 'QLTS_Tai_San',
                        localField: 'thanhly_taisan',
                        foreignField: 'ts_id',
                        as: 'taisan',
                    }
                },
                { $unwind: { path: '$taisan', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'QLTS_Loai_Tai_San',
                        localField: 'taisan.id_loai_ts',
                        foreignField: 'id_loai',
                        as: 'loaiTS',
                    }
                },
                { $unwind: { path: "$loaiTS", preserveNullAndEmptyArrays: true } },
            ]);
            if (chiTiet.length !== 0) {
                chiTiet = chiTiet[0];

                let link_url = '';
                let name_link = '';
                if (chiTiet.tl_trangthai === 0 || chiTiet.tl_trangthai === 2) {
                    chiTiet.link_url = '/dsts-da-thanh-ly.html';
                    chiTiet.name_link = 'Tài sản đề xuất thanh lý';
                }
                if (chiTiet.tl_trangthai === 1 || chiTiet.tl_trangthai === 3) {
                    chiTiet.link_url = '/ts-dx-thanh-ly.html';
                    chiTiet.name_link = 'Danh sách tài sản đã thanh lý';
                }

                // trả về định dạng ngày
                chiTiet.tl_date_create = new Date(chiTiet.tl_date_create * 1000);

                // lấy quyền người dùng đã đề xuất
                let tl_type_quyen = chiTiet.tl_type_quyen;

                // lấy thông tin user
                let user = await Users.findOne({ _id: chiTiet.id_ngtao }, { userName: 1, inForPerson: 1, address: 1 })

                if (tl_type_quyen === 1) {
                    chiTiet.nguoitao = user.userName
                    chiTiet.ngdexuat = user.userName
                    chiTiet.phongban = "---"
                    chiTiet.vitri = user.address
                    chiTiet.doi_tuong_sd = user.userName
                }

                if (tl_type_quyen === 2) {
                    let dep = await Department.findOne({ dep_id: user.inForPerson.employee.dep_id })
                    chiTiet.nguoitao = user.userName
                    chiTiet.ngdexuat = user.userName
                    chiTiet.phongban = dep.dep_name
                    chiTiet.vitri = dep.dep_name
                    chiTiet.doi_tuong_sd = user.userName
                }

                if (tl_type_quyen === 3) {
                    let dep = await Department.findOne({ dep_id: user.inForPerson.employee.dep_id })
                    chiTiet.nguoitao = dep.dep_name
                    chiTiet.ngdexuat = dep.dep_name
                    chiTiet.phongban = dep.dep_name
                    chiTiet.vitri = dep.dep_name
                    chiTiet.doi_tuong_sd = dep.dep_name
                }
                chiTiet.nguoiduyet = user.userName
                return functions.success(res, 'get data success', { data: chiTiet })
            }
            return functions.setError(res, 'cannot get data')

        }
        return functions.setError(res, 'Missing id')
    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
};

// danh sách đề xuất tài sản đã thanh lý
exports.getDataDidLiquidationAssetProposal = async (req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let comId = req.comId;
        let emId = req.emId;
        let type_quyen = req.type;

        // khai báo biến người dùng nhập vào
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let keywords = Number(req.body.keywords);

        // logic phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        // khai báo biến phụ
        let conditions = {};
        // logic xử lý
        // khai báo điều kiện tìm kiếm

        if (type_quyen === 2) { conditions = { $or: [{ id_ng_tao: emId }, { id_ngdexuat: emId }] } }

        conditions.id_cty = comId;

        conditions.xoa_dx_tl = 0;

        conditions.tl_trangthai = { $in: [0, 2] }


        if (keywords) { conditions.tl_id = { $regex: keywords } }



        // số lượng tài sản đề xuất thanh lý
        let countTaiSanDeXuatThanhLy = await ThanhLy.find(conditions).count();

        // số lượng tài sản đã thanh lý
        conditions.tl_trangthai = 3;
        let countTaiSanDaThanhLy = await ThanhLy.find(conditions).count();

        // dữ liệu tài sản đề xuất thanh lý
        let taiSanDeXuatThanhLy = await ThanhLy.aggregate([
            { $match: conditions },
            { $sort: { tl_id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'QLTS_Tai_San',
                    localField: 'thanhly_taisan',
                    foreignField: 'ts_id',
                    as: 'taisan',
                }
            },
            { $unwind: { path: '$taisan' } },
            {
                $lookup: {
                    from: 'QLTS_Loai_Tai_San',
                    localField: 'taisan.id_loai_ts',
                    foreignField: 'id_loai',
                    as: 'loaiTS',
                }
            },
            { $unwind: { path: "$loaiTS" } },
            {
                $project: {
                    sobienban: '$tl_id',
                    mataisan: '$taisan.ts_id',
                    tentaisan: '$taisan.ts_ten',
                    soluong: '$tl_soluong',
                    ngdexuat: '$id_ngdexuat',
                    ngayduyet: '$ngay_duyet',
                    tl_type_quyen: 1,
                    ngaythanhly: '$tl_ngay',
                    lydo: '$tl_lydo',
                    tienthanhly: '$tl_sotien'

                }
            }
        ]);
        for (let i = 0; i < taiSanDeXuatThanhLy.length; i++) {

            // trả về định dạng ngày
            taiSanDeXuatThanhLy[i].ngayduyet = new Date(taiSanDeXuatThanhLy[i].ngayduyet * 1000);
            taiSanDeXuatThanhLy[i].ngaythanhly = new Date(taiSanDeXuatThanhLy[i].ngaythanhly * 1000);


            // lấy quyền người dùng đã đề xuất
            let tl_type_quyen = taiSanDeXuatThanhLy[i].tl_type_quyen;

            // lấy thông tin user
            let user = await Users.findOne({ idQLC: taiSanDeXuatThanhLy[i].ngdexuat }, { userName: 1, inForPerson: 1, address: 1 })
            if (user) {
                if (tl_type_quyen === 1) {
                    taiSanDeXuatThanhLy[i].phongban = user.userName
                }
                taiSanDeXuatThanhLy[i].ngdexuat = user.userName

                if (tl_type_quyen === 2 && user.inForPerson && user.inForPerson.employee) {
                    let dep = await Department.findOne({ dep_id: user.inForPerson.employee.dep_id })
                    taiSanDeXuatThanhLy[i].phongban = dep.dep_name
                }

                if (tl_type_quyen === 3 && user.inForPerson && user.inForPerson.employee) {
                    let dep = await Department.findOne({ dep_id: user.inForPerson.employee.dep_id })
                    taiSanDeXuatThanhLy[i].ngdexuat = dep.dep_name
                    taiSanDeXuatThanhLy[i].phongban = dep.dep_name
                }
            }

        }
        return functions.success(res, 'get data success', { countTaiSanDeXuatThanhLy, countTaiSanDaThanhLy, data: taiSanDeXuatThanhLy })
    } catch (error) {
        console.error(error)
        return functions.setError(res, error);
    }
};