const functions = require('../../services/functions');
const Mat = require('../../models/QuanLyTaiSan/Mat');
const ThongBao = require('../../models/QuanLyTaiSan/ThongBao');
const TaiSanDangSD = require('../../models/QuanLyTaiSan/TaiSanDangSuDung');
const QuaTrinhSD = require('../../models/QuanLyTaiSan/QuaTrinhSuDung');
const Department = require('../../models/qlc/Deparment');

//danh sach bao mat
exports.danhSachTaiBaoMat = async(req, res, next) => {
    try{
        let {page, pageSize, key, dataType} = req.body;
        if(!page) page = 1;
        if(!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page-1)*pageSize;

        let id_cty = req.user.data.com_id;
        let condition = {};
        if (key) condition.mat_id = Number(key);
        let baoCaoMat = await functions.findCount(Mat, {id_cty: id_cty, xoa_dx_mat: 0, mat_trangthai: {$in: [0, 2]}});
        let choDenBu = await functions.findCount(Mat, {id_cty: id_cty, xoa_dx_mat: 0, mat_trangthai: 3});
        let slMat = await functions.findCount(Mat, {id_cty: id_cty, xoa_dx_mat: 0, mat_trangthai: 1});
        let thongKe = {
            baoCaoMat: baoCaoMat,
            choDenBu: choDenBu,
            slMat: slMat,
        };
        if (dataType == 1) {
            condition.id_cty = id_cty
            condition.xoa_dx_mat = 0
            condition.mat_trangthai = {$in: [0, 2]};
        } else if (dataType == 2) {
            condition.id_cty = id_cty
            condition.xoa_dx_mat = 0
            condition.mat_trangthai = 3
        } else if(dataType == 3){
            condition.id_cty = id_cty
            condition.xoa_dx_mat = 0
            condition.mat_trangthai = 1
        }else{
            return functions.setError(res, 'dataType không hợp lệ', 400);
        }
        let danhSachMat = await Mat.aggregate([
            {$match: condition},
            {$sort: {mat_id: -1}},
            {$skip: skip},
            {$limit: pageSize},
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "mat_taisan",
                    foreignField: "ts_id",
                    as: "TaiSan"
                }
            },
            { $unwind: { path: "$TaiSan", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "QLTS_Loai_Tai_San",
                    localField: "TaiSan.id_loai_ts",
                    foreignField: "id_loai",
                    as: "LoaiTaiSan"
                }
            },
            { $unwind: { path: "$LoaiTaiSan", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_tao",
                    foreignField: "_id",
                    as: "NguoiTao"
                }
            },
            
            { $unwind: { path: "$NguoiTao", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_lam_mat",
                    foreignField: "_id",
                    as: "NguoiBaoMat"
                }
            },
            
            { $unwind: { path: "$NguoiBaoMat", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_nhan_denbu",
                    foreignField: "_id",
                    as: "NguoiNhanDenBu"
                }
            },
            
            { $unwind: { path: "$NguoiNhanDenBu", preserveNullAndEmptyArrays: true } },
            { $project: {
                "mat_id": "$mat_id", 
                "mat_trangthai": "$mat_trangthai",
                "mat_date_create": "$mat_date_create", 
                "id_taisan": "$mat_taisan",
                "ten_taisan": "$TaiSan.ts_ten",
                "sl_taisan": "$TaiSan.ts_so_luong",
                "giaTri_taisan": "$TaiSan.ts_gia_tri",
                "mat_soluong": "$mat_soluong",
                "loai_taisan": "$LoaiTaiSan.ten_loai",
                "mat_ngay": "$mat_ngay",
                "mat_lydo": "$mat_lydo",
                "mat_giatri": "$mat_giatri",
                "giatri_ts": "$giatri_ts",
                "tien_denbu": "$tien_denbu",
                "mat_lydo_tuchoi": "$mat_lydo_tuchoi",
                "yc_denbu": "$yc_denbu",
                "hinhthuc_denbu": "$hinhthuc_denbu",
                "mat_han_ht": "$mat_han_ht",
                "loai_thanhtoan": "$loai_thanhtoan",
                "ngay_thanhtoan": "$ngay_thanhtoan",
                "so_tien_da_duyet": "$so_tien_da_duyet",
                "sotien_danhan": "$sotien_danhan",
                "ngay_duyet": "$ngay_duyet",
                "mat_type_quyen": "$mat_type_quyen",
                "type_quyen_nhan_db": "$type_quyen_nhan_db",

                "id_ng_nhan_denbu": "$id_ng_nhan_denbu",
                "ten_ng_nhan_denbu": "$NguoiNhanDenBu.userName",
                "dep_id_ng_nhan_denbu": "$NguoiNhanDenBu.inForPerson.employee.dep_id",               
                
                "id_ng_tao": "$id_ng_tao",
                "ten_ng_tao": "$NguoiTao.userName", 
                "ten_ng_bao_mat": "$NguoiBaoMat.userName", 
                "dep_id": "$NguoiBaoMat.inForPerson.employee.dep_id",

            }},
        ]);
        if (danhSachMat) {
        for(let i=0; i<danhSachMat.length; i++) {
            let mat = danhSachMat[i];
            let dep_name = mat.ten_ng_tao;
            if(mat.mat_type_quyen == 2) {
                let department = await Department.findOne({ com_id: id_cty, dep_id: danhSachMat[i].dep_id});
                if(department) dep_name = department.dep_name;
                else dep_name = "Chua cap nhat";
               
            }
            mat.dep_name_ng_tao = dep_name;
            danhSachMat[i] = mat;
            if (danhSachMat[i].dep_id_ng_nhan_denbu != 0) {
                let dep_id_ng_nhan_denbu = await Department.findOne({ dep_id: danhSachMat[i].dep_id_ng_nhan_denbu }, { dep_name: 1 })
                if (dep_id_ng_nhan_denbu) danhSachMat[i].name_pb_ng_nhan_denbu = dep_id_ng_nhan_denbu.dep_name
                else danhSachMat[i].name_pb_ng_nhan_denbu = null
              }
        }
    }
        // let danhSachMat = await functions.pageFind(Mat, condition, {mat_id: -1}, skip, pageSize);
        const total = await functions.findCount(Mat, condition);
        return functions.success(res,'get data success',{page, pageSize, total, thongKe, danhSachMat})
    }catch(error){
        return functions.setError(res,error.message);
    }
}

// danh sach bao cho den bu va mat
exports.danhSachChoDenBuVaMat = async(req, res, next) => {
    try{
        let {page, pageSize, key, dataType} = req.body;
        if(!page) page = 1;
        if(!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page-1)*pageSize;

        let id_cty = req.user.data.com_id;
        let condition = {id_cty: id_cty, xoa_dx_mat: 0};
        if(dataType !=2 && dataType !=3) return functions.setError(res, "Truyen datatype = 2, 3!", 405);
        if(dataType == 2) {
            condition.mat_trangthai = 3;
        }
        if(dataType == 3) {
            condition.mat_trangthai = 1;
        }
        if(key) condition.mat_id = Number(key);

        let baoCaoMat = await functions.findCount(Mat, {id_cty: id_cty, xoa_dx_mat: 0, mat_trangthai: {$in: [0, 2]}});
        let choDenBu = await functions.findCount(Mat, {id_cty: id_cty, xoa_dx_mat: 0, mat_trangthai: 3});
        let slMat = await functions.findCount(Mat, {id_cty: id_cty, xoa_dx_mat: 0, mat_trangthai: 1});
        let thongKe = {
            baoCaoMat: baoCaoMat,
            choDenBu: choDenBu,
            slMat: slMat,
        };

        let danhSachChoDenBuVaMat = await Mat.aggregate([
            {$match: condition},
            {$sort: {mat_id: -1}},
            {$skip: skip},
            {$limit: pageSize},
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "mat_taisan",
                    foreignField: "ts_id",
                    as: "TaiSan"
                }
            },
            { $unwind: { path: "$TaiSan", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "QLTS_Loai_Tai_San",
                    localField: "TaiSan.id_loai_ts",
                    foreignField: "id_loai",
                    as: "LoaiTaiSan"
                }
            },
            { $unwind: { path: "$LoaiTaiSan", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_tao",
                    foreignField: "_id",
                    as: "NguoiTao"
                }
            },
            { $unwind: { path: "$NguoiTao", preserveNullAndEmptyArrays: true } },


            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_nhan_denbu",
                    foreignField: "_id",
                    as: "NguoiNhanDenBu"
                }
            },
            { $unwind: { path: "$NguoiNhanDenBu", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_duyet",
                    foreignField: "_id",
                    as: "NguoiDuyet"
                }
            },
            { $unwind: { path: "$NguoiDuyet", preserveNullAndEmptyArrays: true } },
            
            { $project: {
                "mat_id": "$mat_id", 
                "mat_trangthai": "$mat_trangthai",
                "mat_date_create": "$mat_date_create", 
                "id_taisan": "$mat_taisan",
                "ten_taisan": "$TaiSan.ts_ten",
                "sl_taisan": "$TaiSan.ts_so_luong",
                "giaTri_taisan": "$TaiSan.ts_gia_tri",
                "mat_soluong": "$mat_soluong",
                "loai_taisan": "$LoaiTaiSan.ten_loai",
                "mat_ngay": "$mat_ngay",
                "mat_lydo": "$mat_lydo",
                "mat_giatri": "$mat_giatri",
                "giatri_ts": "$giatri_ts",
                "tien_denbu": "$tien_denbu",
                "mat_lydo_tuchoi": "$mat_lydo_tuchoi",
                "yc_denbu": "$yc_denbu",
                "hinhthuc_denbu": "$hinhthuc_denbu",
                "mat_han_ht": "$mat_han_ht",
                "loai_thanhtoan": "$loai_thanhtoan",
                "ngay_thanhtoan": "$ngay_thanhtoan",
                "so_tien_da_duyet": "$so_tien_da_duyet",
                "sotien_danhan": "$sotien_danhan",
                "ngay_duyet": "$ngay_duyet",
                "mat_type_quyen": "$mat_type_quyen",
                "type_quyen_nhan_db": "$type_quyen_nhan_db",
                
                "id_ng_tao": "$id_ng_tao",
                "ten_ng_tao": "$NguoiTao.userName",
                "id_ng_nhan_denbu": "$id_ng_nhan_denbu",
                "ten_ng_nhan_denbu": "$NguoiNhanDenBu.userName",
                "dep_id_ng_nhan_denbu": "$NguoiNhanDenBu.inForPerson.employee.dep_id",       

                "id_ng_duyet": "$id_ng_duyet",
                "ten_ng_duyet": "$NguoiDuyet.userName",
                
            }},
        ]);
        for(let i=0; i<danhSachChoDenBuVaMat.length; i++) {
            let mat = danhSachChoDenBuVaMat[i];
            let dep_name = mat.ten_ng_tao;
            if(mat.mat_type_quyen == 2) {
                let department = await Department.findOne({dep_id: mat.id_ng_tao});
                if(department) dep_name = department.dep_name;
                else dep_name = "Chua cap nhat";
            }
            mat.dep_name_ng_tao = dep_name;
            danhSachChoDenBuVaMat[i] = mat;
            if (danhSachChoDenBuVaMat[i].dep_id_ng_nhan_denbu != 0) {
                let dep_id_ng_nhan_denbu = await Department.findOne({ dep_id: danhSachChoDenBuVaMat[i].dep_id_ng_nhan_denbu }, { dep_name: 1 })
                if (dep_id_ng_nhan_denbu) danhSachChoDenBuVaMat[i].name_pb_ng_nhan_denbu = dep_id_ng_nhan_denbu.dep_name
                else danhSachChoDenBuVaMat[i].name_pb_ng_nhan_denbu = null
              }
        }
        const total = await functions.findCount(Mat, condition);
        return functions.success(res,'get data success',{page, pageSize, total, thongKe, danhSachChoDenBuVaMat})
    }catch(error){
        return functions.setError(res,error.message);
    }
}

exports.danhSachMat = async(req, res, next) => {
    try{
        let {page, pageSize, key, dataType} = req.body;
        if(!page) page = 1;
        if(!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page-1)*pageSize;
        let id_cty = req.user.data.com_id;
        let condition = {id_cty: id_cty, xoa_dx_mat: 0, mat_trangthai: 3};
        if(key) condition.mat_id = Number(key);

        let data = await Mat.aggregate([
            {$match: condition},
            {$sort: {mat_id: -1}},
            {$skip: skip},
            {$limit: pageSize},
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "mat_taisan",
                    foreignField: "ts_id",
                    as: "TaiSan"
                }
            },
            { $unwind: { path: "$TaiSan", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "QLTS_Loai_Tai_San",
                    localField: "TaiSan.id_loai_ts",
                    foreignField: "id_loai",
                    as: "LoaiTaiSan"
                }
            },
            { $unwind: { path: "$LoaiTaiSan", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_tao",
                    foreignField: "_id",
                    as: "NguoiTao"
                }
            },
            { $unwind: { path: "$NguoiTao", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_nhan_denbu",
                    foreignField: "_id",
                    as: "NguoiNhanDenBu"
                }
            },
            { $unwind: { path: "$NguoiNhanDenBu", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_duyet",
                    foreignField: "_id",
                    as: "NguoiDuyet"
                }
            },
            { $unwind: { path: "$NguoiDuyet", preserveNullAndEmptyArrays: true } },
            
            { $project: {
                "mat_id": "$mat_id", 
                "mat_trangthai": "$mat_trangthai",
                "mat_date_create": "$mat_date_create", 
                "id_taisan": "$mat_taisan",
                "ten_taisan": "$TaiSan.ts_ten",
                "sl_taisan": "$TaiSan.ts_so_luong",
                "mat_soluong": "$mat_soluong",
                "loai_taisan": "$LoaiTaiSan.ten_loai",
                "mat_ngay": "$mat_ngay",
                "mat_lydo": "$mat_lydo",
                "mat_giatri": "$mat_giatri",
                "giatri_ts": "$giatri_ts",
                "tien_denbu": "$tien_denbu",
                "mat_lydo_tuchoi": "$mat_lydo_tuchoi",
                "yc_denbu": "$yc_denbu",
                "hinhthuc_denbu": "$hinhthuc_denbu",
                "mat_han_ht": "$mat_han_ht",
                "loai_thanhtoan": "$loai_thanhtoan",
                "ngay_thanhtoan": "$ngay_thanhtoan",
                "so_tien_da_duyet": "$so_tien_da_duyet",
                "sotien_danhan": "$sotien_danhan",
                "ngay_duyet": "$ngay_duyet",
                "mat_type_quyen": "$mat_type_quyen",
                "type_quyen_nhan_db": "$type_quyen_nhan_db",
                
                "id_ng_tao": "$id_ng_tao",
                "ten_ng_tao": "$NguoiTao.userName",
                "dep_id_ng_tao": "$NguoiTao.inForPerson.employee.dep_id",

                // "id_ng_lam_mat": "$id_ng_lam_mat",
                // "ten_ng_lam_mat": "$NguoiLamMat.userName",

                "id_ng_nhan_denbu": "$id_ng_nhan_denbu",
                "ten_ng_nhan_denbu": "$NguoiNhanDenBu.userName",

                "id_ng_duyet": "$id_ng_duyet",
                "ten_ng_duyet": "$NguoiDuyet.userName",
                
            }},
        ]);
        if (data) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].dep_id_ng_tao != 0) {
                    let dep_id_ng_tao = await department.findOne({ dep_id: data[i].dep_id_ng_tao }, { dep_name: 1 })
                    if (dep_id_ng_tao) data[i].name_pb_ng_tao = dep_id_ng_tao.dep_name
                    else data[i].name_pb_ng_tao = null
                  }
            }
        }
        const total = await functions.findCount(Mat, condition);
        return functions.success(res,'get data success',{page, pageSize, total, data})
    }catch(error){
        return functions.setError(res,error.message);
    }
}

//tao moi bien ban mat
exports.createMat = async(req, res, next) => {
    try{
        let {ts_mat, giatri_ts, ycdenbu, ngay_mat, hinhthucdb, sl_mat, ngnhandb, nglammat, phantram_nhap, tiendb,
            day_htdenbu, lydo, giatrimat} = req.body;
        if(ts_mat && ngay_mat && sl_mat && lydo ) {
            let type_quyen_nhan_db = 2;
            let id_cty = req.user.data.com_id;
            let id_ng_tao = req.user.data._id;
            let type_quyen = req.user.data.type;
            ngay_mat = new Date(ngay_mat);
            day_htdenbu = new Date(day_htdenbu);
            let today = new Date(Date.now());
            if(ngay_mat <= today) {
                if(day_htdenbu > ngay_mat && day_htdenbu > today) {
                    let mat_id = await functions.getMaxIdByField(Mat, 'mat_id');
                    let fields = {
                        mat_id: mat_id,
                        id_cty: id_cty, 
                        mat_taisan: ts_mat, 
                        id_ng_lam_mat: nglammat, 
                        id_ng_nhan_denbu: ngnhandb, 
                        id_ng_tao: id_ng_tao, 
                        mat_giatri: giatrimat, 
                        yc_denbu: ycdenbu, 
                        mat_ngay: functions.convertTimestamp(ngay_mat), 
                        hinhthuc_denbu: hinhthucdb, 
                        mat_soluong: sl_mat, 
                        tien_denbu: tiendb, 
                        mat_trangthai: 0, 
                        mat_lydo: lydo,
                        mat_han_ht: day_htdenbu, 
                        pt_denbu: phantram_nhap, 
                        giatri_ts: giatri_ts, 
                        mat_type_quyen: type_quyen, 
                        type_quyen_nhan_db: type_quyen_nhan_db, 
                        mat_date_create: functions.convertTimestamp(today)
                    };
                    let mat = new Mat(fields);
                    mat = await mat.save();

                    if(mat) {
                        let id_tb = await functions.getMaxIdByField(ThongBao, 'id_tb');
                        let fieldsTB = {
                            id_tb: id_tb,
                            id_cty: id_cty,
                            id_ng_nhan: id_cty,
                            id_ng_tao: id_ng_tao,
                            type_quyen: 2,
                            type_quyen_tao: type_quyen,
                            loai_tb: 6,
                            add_or_duyet: 1,
                            da_xem: 0,
                            date_create: functions.convertTimestamp(today)
                        }
                        let thongBao = new ThongBao(fieldsTB);
                        thongBao = await thongBao.save();
                        if(thongBao){
                            return functions.success(res, "Tao bien ban mat thanh cong!");
                        }
                        return functions.setError(res, `Tao thong bao that bai`, 506); 
                    }
                    return functions.setError(res, `Tao mat that bai`, 505); 
                }
                return functions.setError(res, `Ngay den bu < ngay mat or ngay den bu > today`, 406);
            }
            return functions.setError(res, `ngay_mat > today `, 405);
        }
        return functions.setError(res, `Missing input value`, 404);
    }catch(e) {
        return functions.setError(res, e.message);
    }
}


//duyet bao cao mat
exports.duyet = async(req, res, next) => {
    try{
        let {id_mat, type_quyen_duyet, duyet_hinhthuc, duyet_yc, so_tien_nhap, phantram_nhap,day_htdenbu} = req.body;
        let com_id = req.user.data.com_id;
        let id_ng_duyet = req.user.data._id;
        let htdenbu = 0
        if(day_htdenbu) {
            htdenbu = new Date(day_htdenbu);
        }else{
            htdenbu = new Date()
        }
        let phantram = 0;
        let so_tien_duyet = 0;
        let ngay_duyet = functions.convertTimestamp(Date.now());
        if(duyet_yc == 0) {
            if(duyet_hinhthuc==0) {
                so_tien_duyet = so_tien_nhap;
            }else {
                so_tien_duyet = so_tien_nhap;
                phantram =  phantram_nhap;
            }
        }
        let mat = await Mat.findOne({mat_id: id_mat, id_cty: com_id});
        if(mat) {
            let quyen_ng_nhan_db = mat.type_quyen_nhan_db;
            let ng_nhan_db = mat.id_ng_nhan_denbu;
            let id_ng_nhan = mat.id_ng_nhan_denbu;
            let id_ts_mat = mat.mat_taisan;
            if(duyet_yc == 1) {
                let update_mat = await Mat.findOneAndUpdate({mat_id: id_mat, id_cty: com_id}, {mat_trangthai: 1}, {new: true});
                if(update_mat) return functions.success(res, "Duyet bien ban mat thanh cong!", {update_mat});
            }else {
                let q_doituong_sd_ts = await TaiSanDangSD.findOne({com_id_sd: com_id, id_ts_sd: id_ts_mat, id_nv_sd: id_ng_nhan}); 
                if(q_doituong_sd_ts) {
                    let sl_ts_dang_sd = q_doituong_sd_ts.sl_dang_sd;
                    let sl_dang_sd_update = sl_ts_dang_sd - mat.mat_soluong;
                    if(sl_dang_sd_update >= 0) {
                        let update_dang_sd = await TaiSanDangSD.findOneAndUpdate({com_id_sd: com_id, id_ts_sd: id_ts_mat, id_nv_sd: id_ng_nhan}, {
                            sl_dang_sd: sl_dang_sd_update
                        });
                        if(update_dang_sd) {
                            let sotien_duyet_cu = mat.so_tien_da_duyet;
                            let sotien_duyet_moi = sotien_duyet_cu + so_tien_duyet;
                            let update_mat = await Mat.findOneAndUpdate({mat_id: id_mat, id_cty: com_id}, {
                                id_ng_duyet: id_ng_duyet,
                                mat_type_quyen_duyet: type_quyen_duyet,
                                hinhthuc_denbu: duyet_hinhthuc,
                                yc_denbu: duyet_yc,
                                pt_denbu: phantram,
                                so_tien_da_duyet: sotien_duyet_moi,
                                mat_trangthai: 3,
                                mat_han_ht: Date.parse(htdenbu)/1000,
                                ngay_duyet: ngay_duyet,
                            });
                            if(update_mat) {
                                let id_sd = await functions.getMaxIdByField(QuaTrinhSD, 'id_sd');
                                let fieldsQTSD = {
                                    id_sd: id_sd,
                                    id_ts: id_ts_mat,
                                    id_bien_ban: id_mat,
                                    so_lg: mat.mat_soluong,
                                    id_cty: com_id,
                                    qt_ngay_thuchien: mat.mat_ngay,
                                    qt_nghiep_vu: 6,
                                    ghi_chu: mat.mat_lydo,
                                    time_created: ngay_duyet
                                }; 
                                if(quyen_ng_nhan_db == 2) {
                                    fieldsQTSD.id_ng_sudung = id_ng_nhan;
                                }//phong ban
                                else if(quyen_ng_nhan_db == 3){
                                    fieldsQTSD.id_sd = Number(id_sd) + 1 ;
                                    fieldsQTSD.id_phong_sudung = id_ng_nhan;
                                }
                                
                                let insert_qtsd = new QuaTrinhSD(fieldsQTSD);
                                insert_qtsd = await insert_qtsd.save();
                                if(insert_qtsd) {
                                    let id_tb = await functions.getMaxIdByField(ThongBao, 'id_tb');
                                    let fieldsTB = {
                                        id_tb: id_tb,
                                        id_cty: com_id,
                                        id_ng_nhan: id_ng_nhan,
                                        id_ng_tao: com_id,
                                        type_quyen: quyen_ng_nhan_db,
                                        type_quyen_tao: 2,
                                        loai_tb: 6,
                                        add_or_duyet: 2,
                                        da_xem: 0,
                                        date_create: ngay_duyet
                                    };
                                    let insert_thong_bao = new ThongBao(fieldsTB);
                                    insert_thong_bao = await insert_thong_bao.save();
                                    if(insert_thong_bao) {
                                        return functions.success(res, "Duyet bien ban mat thanh cong!");
                                    }
                                    return functions.setError(res, "Them moi thong bao that bai", 409);
                                }
                                return functions.setError(res, "Them moi qua trinh su dung that bai", 408);
                            }
                        }
                        return functions.setError(res, "Cap nhat tai san dang su dung that bai", 407);
                    }
                    return functions.setError(res, "So luong mat > so luong dang su dung!", 406);
                }
                return functions.setError(res, "Tai san dang su dung khong tim thay!", 405);
            }
            return functions.setError(res, "Duyet bien ban mat that bai!", 506);
        }
        return functions.setError(res, "Bien ban mat khong tim thay!", 405);
    }catch(e){
        return functions.setError(res, e.message);
    }
}

//tu choi bao cao mat
exports.tuChoi = async(req, res, next) => {
    try{
        let com_id = req.user.data.com_id;
        let {id_bb, content} = req.body;
        if(id_bb && content) {
            let tuchoi_mat = await Mat.findOneAndUpdate({mat_id: id_bb, id_cty: com_id}, {mat_trangthai: 2, mat_lydo_tuchoi: content}, {new: true});
            if(tuchoi_mat) {
                return functions.success(res, "Tu choi mat thanh cong!");
            }
            return functions.setError(res, "Tu choi mat that bai!", 406); 
        } 
        return functions.setError(res, "Missing input id_bb or content!", 405);
    }catch(e){
        return functions.setError(res, e.message);
    }
}

//xoa danh sach mat
exports.deleteMat = async(req, res, next) => {
    try{
        let {id_bb, datatype} = req.body;
        let type_quyen = req.user.data.type;
        let id_ng_xoa = req.user.data.idQLC;
        let com_id = req.user.data.com_id;
        let date_delete = functions.convertTimestamp(Date.now());
        if(!id_bb) return functions.setError(res, "Missing input id_bb!", 404);
        if(datatype != 1 && datatype != 2 && datatype != 3) return functions.setError(res, "Truyen datatype = 1, 2, 3!", 405);
        if(datatype == 1) {
            let mat = await Mat.findOneAndUpdate({mat_id: id_bb, id_cty: com_id}, {
                xoa_dx_mat: 1, mat_type_quyen_xoa: type_quyen, mat_id_ng_xoa: id_ng_xoa, mat_date_delete: date_delete
            }, {new: true});
            if(mat) return functions.success(res, "Xoa tam thoi thanh cong!");
            return functions.setError(res, "Xoa tam thoi that bai!", 504);
        }
        if(datatype == 2) {
            let mat = await Mat.findOneAndUpdate({mat_id: id_bb, id_cty: com_id}, {
                xoa_dx_mat: 0, mat_type_quyen_xoa: 0, mat_id_ng_xoa: 0, mat_date_delete: ''
            }, {new: true});
            if(mat) return functions.success(res, "Khoi phuc thanh cong!");
            return functions.setError(res, "Khoi phuc that bai!", 504);
        }
        if(datatype == 3) {
            let mat = await Mat.findOneAndDelete({mat_id: id_bb, id_cty: com_id});
            if(mat) return functions.success(res, "Xoa vinh vien thanh cong!");
            return functions.setError(res, "Xoa vinh vien that bai!", 504);
        }
    }catch(e){
        return functions.setError(res, e.message);
    }
}

exports.deleteMany = async(req, res, next) => {
    try{        
        const {array_xoa, datatype} = req.body;
        let type_quyen = req.user.data.type;
        let id_ng_xoa = req.user.data._id;
        let com_id = req.user.data.com_id;
        let date_delete = functions.convertTimestamp(Date.now());
        if(!array_xoa) return functions.setError(res, "Missing input array_xoa!", 404);
        if(datatype != 1 && datatype != 2 && datatype != 3) return functions.setError(res, "Truyen datatype = 1, 2, 3!", 405);

        if(datatype == 1) {
            if (Array.isArray(array_xoa) === true) {
            for(let i=0; i<array_xoa.length; i++) {
                let mat = await Mat.findOneAndUpdate({mat_id: array_xoa[i], id_cty: com_id}, {
                    xoa_dx_mat: 1, 
                    mat_type_quyen_xoa: type_quyen, 
                    mat_id_ng_xoa: id_ng_xoa, 
                    mat_date_delete: date_delete
                }, {new: true});
            }
            return functions.success(res, "Xoa tam thoi thanh cong!");
        }else{
            await Mat.findOneAndUpdate({mat_id: array_xoa, id_cty: com_id}, {
                xoa_dx_mat: 1, 
                mat_type_quyen_xoa: type_quyen, 
                mat_id_ng_xoa: id_ng_xoa, 
                mat_date_delete: date_delete
            }, {new: true});
            return functions.success(res, "Xoa 1 tam thoi thanh cong!");
        }
        }
        if(datatype == 2) {
            if (Array.isArray(array_xoa) === true) {
            for(let i=0; i<array_xoa.length; i++) {
                let mat = await Mat.findOneAndUpdate({mat_id: array_xoa[i], id_cty: com_id}, {
                    xoa_dx_mat: 0,
                    mat_type_quyen_xoa: 0, 
                    mat_id_ng_xoa: 0, 
                    mat_date_delete: ''
                }, {new: true});
            }
            return functions.success(res, "Khoi phuc thanh cong!");
        }else{
            await Mat.findOneAndUpdate({mat_id: array_xoa, id_cty: com_id}, {
                xoa_dx_mat: 0,
                mat_type_quyen_xoa: 0, 
                mat_id_ng_xoa: 0, 
                mat_date_delete: ''
            }, {new: true});
            return functions.success(res, "Khoi phuc 1 thanh cong!");
        }
        }
        if(datatype == 3) {
            if (Array.isArray(array_xoa) === true) {
            for(let i=0; i<array_xoa.length; i++) {
                let mat = await Mat.findOneAndDelete({mat_id: array_xoa[i], id_cty: com_id});
            }
            return functions.success(res, "Xoa vinh vien thanh cong!");
        }else{
            await Mat.findOneAndDelete({mat_id: array_xoa, id_cty: com_id});
            return functions.success(res, "Xoa vinh vien 1 thanh cong!");
        }
        }

    
    }catch(error){
        return functions.setError(res, error.message, 500);
    }
}

//hoan thanh den bu
exports.hoanThanh = async(req, res, next) => {
    try{
        let com_id = req.user.data.com_id;
        let {id_db, sotien_thanhtoan_nhap, ngay_ht} = req.body;
        if(id_db && sotien_thanhtoan_nhap && ngay_ht) {
            let mat = await Mat.findOne({mat_id: id_db, id_cty: com_id});
            if(mat) {
                let gt_db_conlai = mat.tien_denbu - sotien_thanhtoan_nhap;
                let tien_danhan = mat.sotien_danhan + sotien_thanhtoan_nhap;
                let hoan_thanh_mat = await Mat.findOneAndUpdate({mat_id: id_db, id_cty: com_id}, {
                    mat_trangthai: 1,
                    tien_denbu: gt_db_conlai,
                    sotien_danhan: tien_danhan,
                    ngay_thanhtoan: functions.convertTimestamp(ngay_ht)
                }, {new: true});
                if(hoan_thanh_mat) {
                    return functions.success(res, "Hoan thanh den bu thanh cong!");
                }
                return functions.setError(res, "Den bu that bai!", 407);
            }
            return functions.setError(res, "Khong tim thay thong tin bao mat!", 406);
        } 
        return functions.setError(res, "Missing input id_bb or content!", 405);
    }catch(e){
        return functions.setError(res, e.message);
    }
}