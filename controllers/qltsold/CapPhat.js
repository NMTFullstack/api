const fnc = require('../../services/functions')
const capPhat = require('../../models/QuanLyTaiSan/CapPhat')
const TaiSan = require('../../models/QuanLyTaiSan/TaiSan')
const ViTri_ts = require('../../models/QuanLyTaiSan/ViTri_ts')
const Users = require('../../models/Users')
const TaiSanDangSuDung = require('../../models/QuanLyTaiSan/TaiSanDangSuDung')
const TaiSanDaiDienNhan = require('../../models/QuanLyTaiSan/TaiSanDaiDienNhan')
const thongBao = require('../../models/QuanLyTaiSan/ThongBao')
const dep = require('../../models/qlc/Deparment')
const user = require('../../models/Users')

exports.create = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const idQLC = req.user.data._id
        const pageNumber = req.body.pageNumber || 1;
        const id_phongban = req.body.id_phongban;
        const cp_lydo = req.body.cp_lydo;
        const cp_trangthai = req.body.cp_trangthai;
        const ts_daidien_nhan = req.body.ts_id;
        const cap_phat_taisan = req.body.cap_phat_taisan;
        const id_ng_thuchien = req.body.id_ng_thuchien;
        const id_ng_daidien = req.body.id_ng_daidien;
        const id_nhanvien = req.body.id_nhanvien;
        const cp_ngay = new Date(req.body.cp_ngay);
        let data = []
        let listItemsType = []
        let soluong_cp_bb = {}
        let max = await capPhat.findOne({}, {}, { sort: { cp_id: -1 } }).lean() || 0;
        let maxThongBao = await thongBao.findOne({}, {}, { sort: { id_tb: -1 } }).lean() || 0;
        let now = new Date()
        if ((cp_lydo && ts_daidien_nhan && id_ng_daidien && id_ng_thuchien)) {
            listItemsType = await TaiSan.find({ id_cty: id_cty }).select('ts_ten soluong_cp_bb').lean()
            if (listItemsType) data.listItemsType = listItemsType
            let listDepartment = await dep.find({ com_id: id_cty }).select('deparmentName').lean()
            let listEmp = await user.find({ "inForPerson.employee.com_id": id_cty, type: 2 }).select('userName').lean()
            if (listDepartment) data.listDepartment = listDepartment
            if (listEmp) data.listEmp = listEmp
            const ds_ts = JSON.parse(cap_phat_taisan).ds_ts;
            const updated_ds_ts = ds_ts.map((item) => ({
                ts_id: item[0],
                sl_cp: item[1]
            }));
            let CapPhatPB = new capPhat({
                //tao cap phat neu la cap phat phong ban thi dien phong ban, neu la cap phat nhan vien thi khong dien id_pb
                cp_id: Number(max.cp_id) + 1 || 1,
                id_nhanvien: id_nhanvien,
                id_phongban: id_phongban,
                cap_phat_taisan: { ds_ts: updated_ds_ts },
                cp_id_ng_tao: idQLC,
                id_cty: id_cty,
                cp_ngay: Date.parse(cp_ngay) / 1000,
                cp_trangthai: cp_trangthai || 0,
                ts_daidien_nhan: ts_daidien_nhan,
                cp_date_create: Date.parse(now) / 1000,
                id_ng_daidien: id_ng_daidien,
                id_ng_thuchien: id_ng_thuchien,
                cp_lydo: cp_lydo,
                cp_da_xoa: 0,
            })
            await CapPhatPB.save()
            data.CapPhatPB = CapPhatPB
            //cap nhat thong bao
            let updateThongBao = new thongBao({
                id_tb: Number(maxThongBao.id_tb) + 1 || 1,
                id_ts: updated_ds_ts[0].ts_id,
                id_cty: id_cty,
                id_ng_tao: idQLC,
                type_quyen: 1,
                type_quyen_tao: 1,
                loai_tb: 1,
                da_xem: 0,
                date_create: Date.parse(now) / 1000,
            })
            await updateThongBao.save()

            return fnc.success(res, " tạo thành công ", { data, CapPhatPB, updateThongBao })

        } else {
            return fnc.setError(res, " cần nhập đủ thông tin ")
        }
    } catch (e) {
        console.log(e);
        return fnc.setError(res, e.message)
    }
}

exports.edit = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id

        const idQLC = req.user.data._id
        const cp_id = req.body.cp_id;
        const id_phongban = req.body.id_phongban;
        const cp_lydo = req.body.cp_lydo;
        const cap_phat_taisan = req.body.cap_phat_taisan;
        const id_ng_thuchien = req.body.id_ng_thuchien;
        const id_ng_daidien = req.body.id_ng_daidien;
        const loai_edit = req.body.loai_edit;
        const id_nhanvien = req.body.id_nhanvien;
        const cp_vitri_sudung = req.body.cp_vitri_sudung;
        const cp_ngay = new Date(req.body.cp_ngay);
        // const ds_ts = JSON.parse(cap_phat_taisan).ds_ts;
        const cap = await capPhat.findOne({ id_cty: id_cty, cp_id: cp_id });

        if (!cap) {
            return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);
        } else {
            if (loai_edit == 2) {
                await capPhat.findOneAndUpdate({ id_cty: id_cty, cp_id: cp_id }, {
                    id_cty: id_cty,
                    cp_id_ng_tao: idQLC,
                    id_nhanvien: id_nhanvien,
                    id_phongban: id_phongban,
                    id_ng_daidien: id_ng_daidien,
                    id_ng_thuchien: id_ng_thuchien,
                    cp_ngay: Date.parse(cp_ngay) / 1000,
                    cp_vitri_sudung: cp_vitri_sudung,
                    cp_lydo: cp_lydo,
                    cp_id_ng_tao: idQLC,
                })
            } else {
                await capPhat.findOneAndUpdate({ id_cty: id_cty, cp_id: cp_id }, {
                    cp_ngay: Date.parse(cp_ngay) / 1000,
                    cp_lydo: cp_lydo,
                })
            }
            return fnc.success(res, "cập nhật thành công", { cap })
        }
    } catch (e) {
        return fnc.setError(res, e.message)
    }
}

exports.delete = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const datatype = req.body.datatype
        const cp_id = req.body.cp_id
        const type_quyen = req.body.type_quyen
        const id_ng_xoa = req.user.data._id
        const date_delete = new Date()

        if (datatype == 1) {
            const data = await capPhat.findOne({ cp_id: cp_id, id_cty: id_cty });
            if (!data) {
                return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);
            } else {
                await capPhat.findOneAndUpdate({ cp_id: cp_id }, {
                    id_cty: id_cty,
                    cp_da_xoa: 1,
                    cp_type_quyen_xoa: type_quyen,
                    cp_id_ng_xoa: id_ng_xoa,
                    cp_date_delete: Date.parse(date_delete) / 1000,

                })
                    .then((data) => fnc.success(res, "cập nhật thành công", { data }))
                    .catch((err) => fnc.setError(res, err.message, 511));
            }
        }
        if (datatype == 2) {
            const data = await capPhat.findOne({ cp_id: cp_id, id_cty: id_cty });
            if (!data) {
                return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);
            } else {
                await capPhat.findOneAndUpdate({ cp_id: cp_id, id_cty: id_cty }, {
                    id_cty: id_cty,
                    cp_da_xoa: 0,
                    cp_type_quyen_xoa: 0,
                    cp_id_ng_xoa: 0,
                    cp_date_delete: 0,

                })
                    .then((data) => fnc.success(res, "cập nhật thành công", { data }))
                    .catch((err) => fnc.setError(res, err.message, 511));
            }
        }
        if (datatype == 3) {
            const deleteonce = await fnc.getDatafindOne(capPhat, { cp_id: cp_id, id_cty: id_cty });
            if (!deleteonce) {
                return fnc.setError(res, "không tìm thấy bản ghi", 510);
            } else { //tồn tại thì xóa 
                fnc.getDataDeleteOne(capPhat, { cp_id: cp_id })
                    .then(() => fnc.success(res, "xóa thành công!", { deleteonce }))
                    .catch(err => fnc.setError(res, err.message, 512));
            }
        }



    } catch (e) {
        return fnc.setError(res, e.message)
    }
}

// dong y tiep nhan cap phat
exports.updateStatus = async (req, res) => {
    try {
        const type = req.user.data.type
        const id_cty = req.user.data.com_id
        const cp_id = req.body.cp_id
        let listConditions = {};
        if (id_cty) listConditions.id_cty = id_cty
        if (cp_id) listConditions.cp_id = cp_id
        let infoCP = await capPhat.findOne(listConditions)
        if (infoCP) {
            let arr = infoCP.cap_phat_taisan.ds_ts
            for (let i = 0; i < arr.length; i++) {
                let ts_id = arr[i].ts_id
                let sl_ts = arr[i].sl_cp
                let updateQuantity = await TaiSan.findOne({ ts_id: ts_id }).lean()
                if (updateQuantity) {
                    await TaiSan.findOneAndUpdate({ ts_id: ts_id }, {
                        soluong_cp_bb: (updateQuantity.soluong_cp_bb - sl_ts)
                    })
                }
            }
            await capPhat.findOneAndUpdate(listConditions, {
                cp_trangthai: 1,
            })
            return fnc.success(res, "cập nhật thành công trang thai bang 1")
        }
        return fnc.setError(res, "khong tim thấy thông tin cấp phát")

    } catch (e) {
        console.log(e);
        return fnc.setError(res, e.message)
    }
}


exports.getListNV = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const id_nhanvien = req.body.id_nhanvien
        const dep_id = req.body.dep_id
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let data = []
        let numEmp = await capPhat.distinct('id_nhanvien', { id_cty: id_cty, id_nhanvien: { $exists: true }, cp_da_xoa: 0 })
        if (numEmp) data.push({ numEmp: numEmp.length })
        let numDep = await capPhat.distinct('id_phongban', { id_cty: id_cty, id_phongban: { $exists: true }, cp_da_xoa: 0 })
        if (numDep) data.push({ numDep: numDep.length })
        let listConditions = {};
        listConditions.id_cty = id_cty
        listConditions.cp_da_xoa = 0
        if (id_nhanvien) { listConditions.id_nhanvien = Number(id_nhanvien) }
        else { listConditions.id_phongban = 0 }
        let listConditions2 = {};
        if (dep_id) listConditions2.dep_id = Number(dep_id)

        // lay danh sach chi tiet phong ban - nhan vien
        let data1 = await capPhat.aggregate([
            // { $match: {id_cty: id_cty ,id_nhanvien : {$ne: 0} } },
            { $match: listConditions },
            { $sort: { cp_id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "cap_phat_taisan.ds_ts.ts_id",
                    foreignField: "ts_id",
                    as: "infoTS"
                }
            },
            { $unwind: { path: "$infoTS", preserveNullAndEmptyArrays: true } },
            // { $unwind: '$infoTS' },
            {
                $lookup: {
                    from: "Users",
                    localField: "id_nhanvien",
                    foreignField: "_id",
                    // pipeline: [
                    //     { $match: {$and : [
                    //     { "type" : {$ne : 1 }},
                    //     {"idQLC":{$ne : 0}},
                    //     {"idQLC":{$ne : 1}}
                    //     ]},
                    //     }
                    // ],
                    as: "infoNguoiDuocCP"
                }
            },
            { $unwind: { path: "$infoNguoiDuocCP", preserveNullAndEmptyArrays: true } },


            {
                $project: {
                    cp_id: 1,
                    id_cty: 1,
                    // cap_phat_taisan: 1,
                    cp_trangthai: 1,
                    ts_daidien_nhan: 1,
                    id_nhanvien: 1,
                    cp_id_ng_tao: 1,
                    cp_date_create: 1,
                    cp_lydo: 1,
                    cp_ngay: 1,
                    "ten_nguoi_duoc_cap_phat": "$infoNguoiDuocCP.userName",
                    "dep_id": "$infoNguoiDuocCP.inForPerson.employee.dep_id",
                    "ten_tai_san": "$infoTS.ts_ten",
                    "sl_tai_san": "$infoTS.ts_so_luong",
                    "id_vi_tri_tai_san": "$infoTS.ts_vi_tri",
                    "Ma_tai_san": "$infoTS.ts_id",
                    "So_luong_cap_phat": "$cap_phat_taisan.ds_ts.sl_cp",
                }
            },
            { $unwind: "$So_luong_cap_phat" },
            { $match: listConditions2 },
        ])
        // data.push({ NumberEmp: count })
        if (data1) {
            for (let i = 0; i < data1.length; i++) {
                if (data1[i].dep_id != 0) {
                    let depName = await dep.findOne({ com_id: id_cty, depb_id: data1[i].dep_id })
                    if (depName) data1[i].depName = depName.dep_name
                    else data1[i].depName = null
                }
                let depStatus = await TaiSanDangSuDung.findOne({ com_id_sd: id_cty, id_nv_sd: data1[i].id_nhanvien })
                let total = 0
                if (depStatus) total += depStatus.sl_dang_sd
                data1[i].NumCapitalUsingOfUser = total
                data1[i].cp_ngay = new Date(data1[i].cp_ngay * 1000);
                data1[i].cp_date_create = new Date(data1[i].cp_date_create * 1000);
            }
            data.push({ infoEmp: data1 })
            let count = await capPhat.find(listConditions).count()
            return fnc.success(res, " lấy thành công ", { data, count })
        }
        return fnc.setError(res, "không tìm thấy đối tượng");
    } catch (e) {
        return fnc.setError(res, e.message)
    }
}
exports.getListDep = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const id_phongban = req.body.id_phongban
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let data = []
        let numEmp = await capPhat.distinct('id_nhanvien', { id_cty: id_cty, id_nhanvien: { $exists: true }, cp_da_xoa: 0 })
        if (numEmp) data.push({ numEmp: numEmp.length })
        let numDep = await capPhat.distinct('id_phongban', { id_cty: id_cty, id_phongban: { $exists: true }, cp_da_xoa: 0 })
        if (numDep) data.push({ numDep: numDep.length })
        let listConditions = {};
        listConditions.id_cty = id_cty
        listConditions.cp_da_xoa = 0
        if (id_phongban) {
            listConditions.id_phongban = Number(id_phongban)
        } else {
            listConditions.id_nhanvien = 0
        }
        // lay danh sach chi tiet phong ban - nhan vien
        let dataDep = await capPhat.aggregate([
            { $match: listConditions },
            { $sort: { cp_id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "QLC_Deparments",
                    localField: "id_phongban",
                    foreignField: "dep_id",
                    as: "infoPhongBan"
                }
            },
            { $unwind: { path: "$infoPhongBan", preserveNullAndEmptyArrays: true } },

            {
                $project: {
                    "cp_id": "$cp_id",
                    "id_cty": "$id_cty",
                    id_ng_daidien: 1,
                    "cp_ngay": "$cp_ngay",
                    "sl_tai_san": "$infoTS.ts_so_luong",
                    "id_vi_tri_tai_san": "$infoTS.ts_vi_tri",
                    "cp_trangthai": "$cp_trangthai",
                    "id_phongban": "$id_phongban",
                    "dep_name": "$infoPhongBan.dep_name",
                    "manager_id": "$infoPhongBan.manager_id",
                }
            },
        ])
        // .explain("executionStats")
        if (dataDep.length > 0) {
            for (let i = 0; i < dataDep.length; i++) {
                let depStatus = await TaiSanDangSuDung.findOne({ com_id_sd: id_cty, id_pb_sd: dataDep[i].id_phongban })
                let total = 0
                if (depStatus) total += depStatus.sl_dang_sd
                dataDep[i].NumCapitalUsing = total
                let nameManager = await user.findOne({ _id: dataDep[i].manager_id, type: 2 })
                if (nameManager) dataDep[i].nameManager = nameManager.userName
                else dataDep[i].nameManager = null
                if (data[i].id_ng_daidien != 0) {
                    let id_ng_daidien = await Users.findOne({ _id: data[i].id_ng_daidien }, { userName: 1 })
                    if (id_ng_daidien) data[i].name_ng_dai_dien = id_ng_daidien.userName
                    else data[i].name_ng_dai_dien = null

                }
                if (data[i].id_vi_tri_tai_san != 0) {
                    let ten_vi_tri_ts = await ViTri_ts.findOne({ id_vitri: data[i].id_vi_tri_tai_san })
                    if (ten_vi_tri_ts) data[i].ten_vi_tri_ts = ten_vi_tri_ts.vi_tri
                    else data[i].ten_vi_tri_ts = null
                }
                dataDep[i].cp_ngay = new Date(dataDep[i].cp_ngay * 1000);

            }
            data.push({ dataDep: dataDep })
        }
        if (data) {
            let totalCount = await capPhat.count(listConditions)
            return fnc.success(res, " lấy thành công ", { data, totalCount })
        }
        return fnc.setError(res, "không tìm thấy đối tượng");
    } catch (e) {
        console.log(e);
        return fnc.setError(res, e.message)
    }
}


exports.getListDetail = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const type = req.user.data.type
        // const type_quyen = req.body.type_quyen
        let option = req.body.option
        const id_nhanvien = req.body.id_nhanvien
        const id_phongban = req.body.id_phongban
        const cp_id = req.body.cp_id
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let data = {}
        let listConditions = {};
        listConditions.id_cty = id_cty
        // if(id_nhanvien) listConditions.id_nhanvien = id_nhanvien
        // if(id_phongban) listConditions.id_phongban = id_phongban
        // if(cp_id) listConditions.cp_id = cp_id
        if (option == 1) listConditions.cp_trangthai = 0, listConditions.id_nhanvien = Number(id_nhanvien)   ////DS cấp phát chờ nhận NV
        if (option == 2) listConditions.cp_trangthai = 0, listConditions.cp_id = Number(cp_id), listConditions.id_nhanvien = Number(id_nhanvien)  ////query cấp phát chờ nhận NV
        if (option == 3) listConditions.cp_trangthai = 5, listConditions.id_nhanvien = Number(id_nhanvien)  //DS đồng ý cấp phát  NV
        if (option == 4) listConditions.cp_trangthai = 5, listConditions.cp_id = Number(cp_id), listConditions.id_nhanvien = Number(id_nhanvien)  // query đồng ý cấp phát  NV
        if (option == 5) listConditions.cp_trangthai = 0, listConditions.id_phongban = Number(id_phongban) // DS cấp phát chờ nhận PB
        if (option == 6) listConditions.cp_trangthai = 0, listConditions.cp_id = Number(cp_id), listConditions.id_phongban = Number(id_phongban) // query cấp phát chờ nhận PB
        if (option == 7) listConditions.cp_trangthai = 5, listConditions.id_phongban = Number(id_phongban)  //DS đồng ý cấp phát PB
        if (option == 8) listConditions.cp_trangthai = 5, listConditions.cp_id = Number(cp_id), listConditions.id_phongban = Number(id_phongban) // query đồng ý cấp phát  PB
        data = await capPhat.aggregate([
            { $match: listConditions },
            { $skip: skip },
            { $limit: limit },
            { $sort: { cp_id: -1 } },
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "cap_phat_taisan.ds_ts.ts_id",
                    foreignField: "ts_id",
                    as: "infoTS"
                }
            },
            { $unwind: { path: "$infoTS", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "Users",
                    localField: "cp_id_ng_tao",
                    foreignField: "_id",
                    // pipeline: [
                    //     { $match: {$and : [
                    //     {"idQLC":{$ne : 0}},
                    //     {"idQLC":{$ne : 1}}] },
                    //     }
                    // ],
                    as: "info"
                }
            },
            { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },


            {
                $project: {
                    "cp_id": "$cp_id",
                    id_ng_daidien: 1,
                    id_ng_thuchien: 1,
                    "cp_trangthai": "$cp_trangthai",
                    "id_nhanvien": "$id_nhanvien",
                    "id_phongban": "$id_phongban",
                    "cp_id_ng_tao": "$cp_id_ng_tao",
                    "cp_date_create": "$cp_date_create",
                    "cp_ngay": "$cp_ngay",
                    "cp_lydo": "$cp_lydo",
                    "ten_nguoi_tao": "$info.userName",
                    "ten_tai_san": "$infoTS.ts_ten",
                    "Ma_tai_san": "$infoTS.ts_id",
                    "id_vi_tri_tai_san": "$infoTS.ts_vi_tri",
                    "so_luong_tai_san_con_lai": "$infoTS.ts_so_luong",
                    "So_luong_cap_phat": "$cap_phat_taisan.ds_ts.sl_cp",

                }
            },
            { $unwind: { path: "$So_luong_cap_phat", preserveNullAndEmptyArrays: true } },

        ])
        let count = await capPhat.find(listConditions).count()
        // if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].id_vi_tri_tai_san != 0) {
                let ten_vi_tri_ts = await ViTri_ts.findOne({ id_vitri: data[i].id_vi_tri_tai_san })
                if (ten_vi_tri_ts) data[i].ten_vi_tri_ts = ten_vi_tri_ts.vi_tri
                else data[i].ten_vi_tri_ts = null
            }
            if (data[i].id_nhanvien != 0) {
                let id_nhanvien = await Users.findOne({ _id: data[i].id_nhanvien }, { userName: 1 })
                if (id_nhanvien) data[i].name_nv_nhan = id_nhanvien.userName
                else data[i].name_nv_nhan = null
            }
            if (data[i].id_ng_thuchien != 0) {
                let id_ng_thuchien = await Users.findOne({ _id: data[i].id_ng_thuchien }, { userName: 1 })
                if (id_ng_thuchien) data[i].name_nv_thuchien = id_ng_thuchien.userName
                else data[i].name_nv_thuchien = null
            }
            if (data[i].id_phongban != 0) {
                let id_phongban = await dep.findOne({ dep_id: data[i].id_phongban }, { dep_name: 1 })
                if (id_phongban) data[i].name_pb_dang_sd = id_phongban.dep_name
                else data[i].name_pb_dang_sd = 0
            }
            data[i].cp_ngay = new Date(data[i].cp_ngay * 1000);
            data[i].cp_date_create = new Date(data[i].cp_date_create * 1000);
        }
        return fnc.success(res, " lấy thành công ", { data, count })
        // }
        // return fnc.setError(res, "không tìm thấy đối tượng", 510);
        // }
        // return fnc.setError(res, "bạn chưa có quyền", 510);
    } catch (e) {
        console.log(e)
        return fnc.setError(res, e.message)
    }
}

exports.DetailEmp = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const cp_id = Number(req.body.cp_id)
        const id_nhanvien = Number(req.body.id_nhanvien)
        const id_phongban = Number(req.body.id_phongban)
        let filter = {}
        filter.id_cty = id_cty
        filter.cp_da_xoa = 0
        if (cp_id) filter.cp_id = cp_id
        if (id_nhanvien) filter.id_nhanvien = id_nhanvien
        // await Users.ensureIndex("idQLC", 1) 
        let data = await capPhat.aggregate([
            { $match: filter },
            { $sort: { cp_id: -1 } },

            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_thuchien",
                    foreignField: "_id",
                    // pipeline: [
                    //     { $match: {$and : [
                    //     { "type" : {$ne : 1 }},
                    //     {"idQLC":{$ne : 0}},
                    //     {"idQLC":{$ne : 1}}] },
                    //     }
                    // ],
                    as: "info"
                }
            },
            { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "Users",
                    localField: "id_nhanvien",
                    foreignField: "_id",
                    // pipeline: [
                    //     { $match: {$and : [
                    //     { "type" : {$ne : 1 }},
                    //     {"idQLC":{$ne : 0}},
                    //     {"idQLC":{$ne : 1}}] },
                    //     }],
                    as: "infoNguoiDuocCP"
                }
            },
            { $unwind: { path: "$infoNguoiDuocCP", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "cap_phat_taisan.ds_ts.ts_id",
                    foreignField: "ts_id",
                    as: "infoTS"
                }
            },
            { $unwind: { path: "$infoTS", preserveNullAndEmptyArrays: true } },

            {
                $project: {
                    cp_id: 1,
                    id_cty: 1,
                    cp_trangthai: 1,
                    ts_daidien_nhan: 1,
                    id_nhanvien: 1,
                    id_phongban: 1,
                    cp_id_ng_tao: 1,
                    cp_date_create: 1,
                    cp_ngay: 1,
                    cp_hoanthanh: 1,
                    cp_lydo: 1,
                    id_ng_thuchien: 1,
                    "ten_nguoi_thuc_hien": "$info.userName",
                    "ten_nguoi_duoc_cap_phat": "$infoNguoiDuocCP.userName",
                    "dep_id": "$infoNguoiDuocCP.inForPerson.employee.dep_id",
                    "ten_tai_san": "$infoTS.ts_ten",
                    "Ma_tai_san": "$infoTS.ts_id",
                    "sl_tai_san": "$infoTS.ts_so_luong",
                    "id_vi_tri_tai_san": "$infoTS.ts_vi_tri",
                    "So_luong_cap_phat": "$cap_phat_taisan.ds_ts.sl_cp",
                }
            },


        ])

        if (data) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].dep_id != 0) {
                    let depName = await dep.findOne({ com_id: id_cty, depb_id: data[i].dep_id })
                    if (depName) data[i].depName = depName.dep_name
                    else data[i].depName = null
                }
                if (data[i].id_ng_thuchien != 0) {
                    let id_ng_thuchien = await Users.findOne({ _id: data[i].id_ng_thuchien }, { userName: 1 })
                    if (id_ng_thuchien) data[i].name_ng_thuc_hien = id_ng_thuchien.userName
                    else data[i].name_ng_thuc_hien = null

                }

                data[i].cp_ngay = new Date(data[i].cp_ngay * 1000);
                data[i].cp_date_create = new Date(data[i].cp_date_create * 1000);
            }
            return fnc.success(res, " lấy thành công ", { data })
        }
        return fnc.setError(res, "không tìm thấy đối tượng", 510);
    } catch (e) {
        return fnc.setError(res, e.message)
    }
}

exports.DetailDep = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const cp_id = Number(req.body.cp_id)
        const id_phongban = Number(req.body.id_phongban)
        let filter = {}
        filter.id_cty = id_cty
        filter.cp_da_xoa = 0
        if (cp_id) filter.cp_id = cp_id
        if (id_phongban) filter.id_phongban = id_phongban
        // await Users.ensureIndex("idQLC", 1) 
        let data = await capPhat.aggregate([
            { $match: filter },
            { $sort: { cp_id: -1 } },
            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_thuchien",
                    foreignField: "_id",
                    // pipeline: [
                    //     { $match: {$and : [
                    //     { "type" : {$ne : 1 }},
                    //     {"idQLC":{$ne : 0}},
                    //     {"idQLC":{$ne : 1}}] },
                    //     }
                    // ],
                    as: "info"
                }
            },
            { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "Users",
                    localField: "id_ng_daidien",
                    foreignField: "_id",
                    // pipeline: [
                    //     { $match: {$and : [
                    //     { "type" : {$ne : 1 }},
                    //     {"idQLC":{$ne : 0}},
                    //     {"idQLC":{$ne : 1}}] },
                    //     }
                    // ],
                    as: "infoNgDaiDienCP"
                }
            },
            { $unwind: { path: "$infoNgDaiDienCP", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "cap_phat_taisan.ds_ts.ts_id",
                    foreignField: "ts_id",
                    as: "infoTS"
                }
            },
            { $unwind: { path: "$infoTS", preserveNullAndEmptyArrays: true } },


            {
                $lookup: {
                    from: "QLC_Deparments",
                    localField: "id_phongban",
                    foreignField: "dep_id",
                    as: "infoPhongBan"
                }
            },
            { $unwind: { path: "$infoPhongBan", preserveNullAndEmptyArrays: true } },

            {
                $project: {
                    cp_id: 1,
                    id_cty: 1,
                    cp_trangthai: 1,
                    ts_daidien_nhan: 1,
                    id_nhanvien: 1,
                    id_phongban: 1,
                    cp_id_ng_tao: 1,
                    cp_date_create: 1,
                    cp_ngay: 1,
                    cp_hoanthanh: 1,
                    cp_lydo: 1,
                    id_ng_daidien: 1,
                    id_ng_thuchien: 1,
                    "ten_nguoi_thuc_hien": "$info.userName",
                    "dep_id": "$info.inForPerson.employee.dep_id",
                    "ten_nguoi_duoc_cap_phat": "$infoNgDaiDienCP.userName",
                    "ten_tai_san": "$infoTS.ts_ten",
                    "sl_tai_san": "$infoTS.ts_so_luong",
                    "id_vi_tri_tai_san": "$infoTS.ts_vi_tri",
                    "Ma_tai_san": "$infoTS.ts_id",
                    "So_luong_cap_phat": "$cap_phat_taisan.ds_ts.sl_cp",
                    "dep_name": "$infoPhongBan.dep_name",
                    "manager_id": "$infoPhongBan.manager_id",
                }
            },
            { $unwind: "$So_luong_cap_phat" },
        ])

        if (data) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].dep_id != 0) {
                    let depName = await dep.findOne({ com_id: id_cty, depb_id: data[i].dep_id })
                    if (depName) data[i].depName = depName.dep_name
                    else data[i].depName = null
                }
                if (data[i].id_ng_thuchien != 0) {
                    let id_ng_thuchien = await Users.findOne({ _id: data[i].id_ng_thuchien }, { userName: 1 })
                    if (id_ng_thuchien) data[i].name_ng_thuc_hien = id_ng_thuchien.userName
                    else data[i].name_ng_thuc_hien = null

                }
                if (data[i].id_ng_daidien != 0) {
                    let id_ng_daidien = await Users.findOne({ _id: data[i].id_ng_daidien }, { userName: 1 })
                    if (id_ng_daidien) data[i].name_ng_dai_dien = id_ng_daidien.userName
                    else data[i].name_ng_dai_dien = null

                }
                if (data[i].id_vi_tri_tai_san != 0) {
                    let ten_vi_tri_ts = await ViTri_ts.findOne({ id_vitri: data[i].id_vi_tri_tai_san })
                    if (ten_vi_tri_ts) data[i].ten_vi_tri_ts = ten_vi_tri_ts.vi_tri
                    else data[i].ten_vi_tri_ts = null
                }
                data[i].cp_ngay = new Date(data[i].cp_ngay * 1000);
                data[i].cp_date_create = new Date(data[i].cp_date_create * 1000);
            }
            return fnc.success(res, " lấy thành công ", { data })
        }
        return fnc.setError(res, "không tìm thấy đối tượng");
    } catch (e) {
        return fnc.setError(res, e.message)
    }
}
//Từ chối tiếp nhận tài sản cấp phát"
exports.refuserAll = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const cp_id = req.body.cp_id
        const content = req.body.content
        const data = await capPhat.findOne({ cp_id: cp_id, id_cty: id_cty });
        if (!data) {
            return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);
        } else {
            let arr = data.cap_phat_taisan.ds_ts
            for (let i = 0; i < arr.length; i++) {
                let ts_id = arr[i].ts_id
                let sl_ts = arr[i].sl_cp
                let listItemsType = await TaiSan.findOne({ id_cty: id_cty, ts_id: ts_id })
                if (listItemsType) {
                    let sl_taisan = listItemsType.ts_so_luong + sl_ts
                    await TaiSan.updateOne({ ts_id: ts_id, id_cty: id_cty }, {
                        ts_so_luong: sl_taisan,
                        soluong_cp_bb: sl_taisan,
                    })
                }
            }
            await capPhat.updateOne({ cp_id: cp_id, id_cty: id_cty }, {
                cp_trangthai: 4,
                cp_tu_choi_tiep_nhan: content,
            })
        }
        return fnc.success(res, "cập nhật thành công")
    } catch (e) {
        return fnc.setError(res, e.message)
    }
}
exports.refuser2 = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const cp_id = req.body.cp_id
        const content = req.body.content
        const data = await capPhat.findOne({ cp_id: cp_id, id_cty: id_cty });
        if (!data) {
            return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật", 510);
        } else {
            let arr = data.cap_phat_taisan.ds_ts
            for (let i = 0; i < arr.length; i++) {
                let ts_id = arr[i].ts_id
                let sl_ts = arr[i].sl_cp
                let listItemsType = await TaiSan.findOne({ id_cty: id_cty, ts_id: ts_id })
                if (listItemsType) {
                    let sl_taisan = listItemsType.ts_so_luong + sl_ts
                    await TaiSan.updateOne({ ts_id: ts_id, id_cty: id_cty }, {
                        soluong_cp_bb: sl_taisan,
                    })
                }
            }
            await capPhat.updateOne({ cp_id: cp_id, id_cty: id_cty }, {
                cp_trangthai: 2,
                cp_tu_choi_tiep_nhan: content,
            })
        }
        return fnc.success(res, "cập nhật thành công")
    } catch (e) {
        return fnc.setError(res, e.message)
    }
}
//tiếp nhận tài sản cấp phát
exports.acceptAllocation = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const cp_id = req.body.cp_id
        if (cp_id) {
            const data = await capPhat.findOne({ cp_id: cp_id, id_cty: id_cty });
            if (!data) {
                return fnc.setError(res, "không tìm thấy đối tượng cần cập nhật");
            } else {
                await capPhat.updateOne({ cp_id: cp_id, id_cty: id_cty }, {
                    cp_trangthai: 6,
                })
                return fnc.success(res, "cập nhật thành công")
            }
        }
        return fnc.setError(res, "vui lòng nhập cp_id")

    } catch (e) {
        return fnc.setError(res, e.message)
    }
}

// dong y tiep nhan cap phat
exports.accept = async (req, res) => {
    try {
        const id_cty = req.user.data.com_id
        const cp_id = req.body.cp_id
        let listConditions = {};
        let now = new Date()
        if (cp_id) {
            // for (let i = 0 ; i< arr.length ; i++){
            listConditions.cp_id = Number(cp_id)
            listConditions.id_cty = id_cty
            listConditions.cp_trangthai = { $in: [1, 6] }
            let infoCP = await capPhat.findOne(listConditions)
            if (infoCP) {
                let arr = infoCP.cap_phat_taisan.ds_ts
                let id_nv = infoCP.id_nhanvien
                let id_pb = infoCP.id_phongban || 0
                let id_nv_dai_dien = infoCP.id_ng_daidien
                for (let i = 0; i < arr.length; i++) {
                    let ts_id = arr[i].ts_id
                    let sl_ts = arr[i].sl_cp
                    // for so luong ts trong moi bb
                    let updateQuantity = await TaiSan.findOne({ ts_id: ts_id }).lean()
                    if (updateQuantity) {
                        // kiểm tra trạng thái tài sản
                        if (updateQuantity.ts_trangthai == 0) {
                            await TaiSan.findOneAndUpdate({ ts_id: ts_id, ts_trangthai: 0 }, {
                                ts_trangthai: 1,
                                ts_date_sd: Date.parse(now) / 1000,
                            })
                        }
                        if (id_nv != 0) {
                            let dem_dt_sd = await TaiSanDangSuDung.findOne({ com_id_sd: id_cty, id_nv_sd: id_nv, id_ts_sd: ts_id })
                            if (dem_dt_sd) {
                                let sl_da_cong = (dem_dt_sd.sl_dang_sd + sl_ts)
                                let add_ts = await TaiSanDangSuDung.updateOne({ com_id_sd: id_cty, id_nv_sd: id_nv, id_ts_sd: ts_id }, {
                                    sl_dang_sd: sl_da_cong
                                })
                            } else {
                                let maxTSdangSD = await TaiSanDangSuDung.findOne({}, {}, { sort: { id_sd: -1 } }).lean() || 0
                                let add_ts = new TaiSanDangSuDung({
                                    id_sd: Number(maxTSdangSD.id_sd) + 1 || 1,
                                    com_id_sd: id_cty,
                                    id_nv_sd: id_nv,
                                    id_pb_sd: id_pb,
                                    id_ts_sd: ts_id,
                                    sl_dang_sd: sl_ts,
                                    doi_tuong_dang_sd: id_nv,
                                    day_bd_sd: Date.parse(now) / 1000,
                                    tinhtrang_ts: 1,
                                })
                                await add_ts.save()
                            }
                        }
                        if (id_pb != 0) {
                            let dem_dt_sd = await TaiSanDangSuDung.findOne({ com_id_sd: id_cty, id_pb_sd: id_pb, id_ts_sd: ts_id })
                            let dem_dt_dd = await TaiSanDaiDienNhan.findOne({ id_cty_dd: id_cty, id_nv_dd_nhan: id_nv_dai_dien, id_ts_dd_nhan: ts_id })
                            if (dem_dt_sd) {
                                let sl_da_cong = (dem_dt_sd.sl_dang_sd + sl_ts)
                                let add_ts = await TaiSanDangSuDung.updateOne({ com_id_sd: id_cty, id_pb_sd: id_pb, id_ts_sd: ts_id }, {
                                    sl_dang_sd: sl_da_cong
                                })
                            } else {
                                let maxTSdangSD = await TaiSanDangSuDung.findOne({}, {}, { sort: { id_sd: -1 } }).lean() || 0
                                let add_ts = new TaiSanDangSuDung({
                                    id_sd: Number(maxTSdangSD.id_sd) + 1 || 1,
                                    com_id_sd: id_cty,
                                    id_nv_sd: id_nv,
                                    id_pb_sd: id_pb,
                                    id_ts_sd: ts_id,
                                    sl_dang_sd: sl_ts,
                                    doi_tuong_dang_sd: id_pb,
                                    day_bd_sd: Date.parse(now) / 1000,
                                    tinhtrang_ts: 1,
                                })
                                await add_ts.save()
                            }
                            if (dem_dt_dd) {
                                let sl_da_cong = (dem_dt_dd.sl_dd_nhan + sl_ts)
                                let add_ts = await TaiSanDaiDienNhan.updateOne({ id_cty_dd: id_cty, id_nv_dd_nhan: id_nv_dai_dien, id_ts_dd_nhan: ts_id }, {
                                    sl_dd_nhan: sl_da_cong
                                })
                            } else {
                                let maxDaiDienNhan = await TaiSanDaiDienNhan.findOne({}, {}, { sort: { _id: -1 } }).lean() || 0
                                let add_ts = new TaiSanDaiDienNhan({
                                    _id: Number(maxDaiDienNhan._id) + 1 || 1,
                                    id_cty_dd: id_cty,
                                    id_nv_dd_nhan: id_nv_dai_dien,
                                    id_ts_dd_nhan: ts_id,
                                    sl_dd_nhan: sl_ts,
                                    day_dd_nhan: Date.parse(now) / 1000,
                                })
                                await add_ts.save()
                            }
                        }
                    }
                }
                await capPhat.findOneAndUpdate(listConditions, {
                    cp_trangthai: 5,
                    cp_hoanthanh: Date.parse(now) / 1000,
                })
                return fnc.success(res, "cập nhật thành công")
            }
            return fnc.setError(res, "khong tim thấy thông tin cấp phát")
        }
        return fnc.setError(res, "vui long nhap cp_id")
    } catch (e) {
        console.log(e);
        return fnc.setError(res, e.message)
    }
}

// xoá nhieu
exports.deleteMany = async (req, res, next) => {
    try {
        // khai báo biến lấy dữ liệu từ token
        let type_quyen = req.user.data.type;
        let id_ng_xoa = req.user.data._id;
        let com_id = req.user.data.com_id;

        // khai báo id người dùng muốn xoá
        let id = req.body.id;
        let type = Number(req.body.type);

        if (type === 1) {
            // logic xử lý
            if (Array.isArray(id) === true) {
                for (let i = 0; i < id.length; i++) {
                    await capPhat.findOneAndUpdate({ cp_id: id[i] }, {
                        cp_da_xoa: 1,
                        cp_type_quyen_xoa: type_quyen,
                        cp_id_ng_xoa: id_ng_xoa,
                        cp_date_delete: new Date().getTime() / 1000,
                    })
                }
                return fnc.success(res, 'Xoá cap phat tai sản thành công')
            } else {
                await capPhat.findOneAndUpdate({ cp_id: id }, {
                    cp_da_xoa: 1,
                    cp_type_quyen_xoa: type_quyen,
                    cp_id_ng_xoa: id_ng_xoa,
                    cp_date_delete: new Date().getTime() / 1000,
                })
                return fnc.success(res, 'Xoá cap phat 1 tai sản thành công')
            }
        } else if (type === 2) {
            if (Array.isArray(id) === true) {
                for (let i = 0; i < id.length; i++) {
                    await capPhat.findOneAndUpdate({ cp_id: id[i] }, {
                        cp_da_xoa: 0,
                        cp_type_quyen_xoa: 0,
                        cp_id_ng_xoa: 0,
                        cp_date_delete: 0,
                    })
                }
                return fnc.success(res, 'Khôi phục cap phat tai sản thành công')
            } else {
                await capPhat.findOneAndUpdate({ cp_id: id }, {
                    cp_da_xoa: 0,
                    cp_type_quyen_xoa: 0,
                    cp_id_ng_xoa: 0,
                    cp_date_delete: 0,
                })
                return fnc.success(res, 'Khôi phục cap phat 1 tai sản thành công')

            }
        } else if (type === 3) {
            if (Array.isArray(id) === true) {
                for (let i = 0; i < id.length; i++) {
                    await capPhat.findOneAndDelete({ cp_id: id[i] })
                }
                return fnc.success(res, 'Xoá vĩnh viễn cap phat tai sản thành công')
            } else {
                await capPhat.findOneAndDelete({ cp_id: id })
                return fnc.success(res, 'Xoá vĩnh viễn 1 cap phat tai sản thành công')

            }


        }
        return fnc.setError(res, 'Missing id')

    } catch (error) {
        console.error(error)
        return fnc.setError(res, error)
    }
};