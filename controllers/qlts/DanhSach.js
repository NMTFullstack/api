const fnc = require('../../services/functions');
const ViTriTaiSan = require('../../models/QuanLyTaiSan/ViTri_ts');
const TaiSan = require('../../models/QuanLyTaiSan/TaiSan');
const LoaiTaiSan = require('../../models/QuanLyTaiSan/LoaiTaiSan');
const DonViCongSuat = require('../../models/QuanLyTaiSan/DonViCS');
const dep = require('../../models/qlc/Deparment')
const user = require('../../models/Users')
//page dieu chuyen vi tri
exports.list_vitri = async (req, res) => {
    try {
        let com_id = req.user.data.com_id;
        let arr_vitri = await ViTriTaiSan.aggregate([
            {
                $match: {
                    id_cty: com_id
                }
            },
            {
                $project: {
                    'id_vitri': '$id_vitri',
                    'vi_tri': '$vi_tri'
                }
            }
        ]
        );
        fnc.success(res, 'success ', { arr_vitri });

    } catch (error) {
        console.log(error);
        fnc.setError(res, error.message);
    }
}

exports.listTaiSan = async (req, res) => {
    try {
        let { ts_vi_tri } = req.body;
        let com_id = req.user.data.com_id;

        let list_TS = await TaiSan.aggregate([
            {
                $match: {
                    id_cty: com_id,
                    ts_vi_tri: ts_vi_tri,
                }
            },
            {
                $project: {
                    'id_ts': '$ts_id',
                    'ten_ts': '$ts_ten',
                    'ts_vi_tri': '$ts_vi_tri'
                }
            }
        ]);
        fnc.success(res, 'sucess', { list_TS });
    } catch (error) {
        console.log(error);
        fnc.setError(res, error.message);
    }
}

exports.DetailTS = async (req, res) => {
    try {
        let { id_ts, ts_vi_tri } = req.body;
        let com_id = req.user.data.com_id;
        let arr = id_ts.split(',');
        let arr_ts = [];
        arr.map((item) => {
            arr_ts.push(Number(item))
        })

        let list_TS = await TaiSan.aggregate([
            {
                $match: {
                    id_cty: com_id,
                    ts_vi_tri: ts_vi_tri,
                    ts_id: {
                        $in: arr_ts
                    }
                }
            },
        ]);
        fnc.success(res, 'sucess', { list_TS });
    } catch (error) {
        console.log(error)
        fnc.setError(res, error.message);

    }

}
//page bao duong - sua_chua
exports.listTS = async (req, res) => {
    try {
        let com_id = req.user.data.com_id;

        let list_TS = await TaiSan.aggregate([
            {
                $match: {
                    id_cty: com_id,

                }
            },
            {
                $project: {
                    'id_ts': '$ts_id',
                    'ten_ts': '$ts_ten',
                    'ts_vi_tri': '$ts_vi_tri'
                }
            }
        ]);
        fnc.success(res, 'sucess', { list_TS });

    } catch (error) {
        console.log(error)
        fnc.setError(res, error.message);
    }
}
//page quy địnhbảo dưỡng
exports.listLoaiTaiSan = async (req, res) => {
    try {
        let com_id = req.user.data.com_id;
        let danhsach_loai_ts = await LoaiTaiSan.find({
            id_cty: com_id,
            loai_da_xoa: 0
        })
        fnc.success(res, "ok", { danhsach_loai_ts });
    } catch (error) {
        console.log(error);
        fnc.setError(res, error.message);
    }
}
//page theo doi cong suat 
exports.list_dvi_csuat = async (req, res) => {
    try {
        let com_id = req.user.data.com_id;
        let list_divi = await DonViCongSuat.find({
            id_cty: com_id
        });
        fnc.success(res, "OK", { list_divi });
    } catch (error) {
        console.log(error);
        fnc.setError(res, error.message);
    }
}
exports.list_Dep = async (req, res) => {
    try {
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let com_id = req.user.data.com_id;
        let cid = req.body.com_id;
        let dep_id = req.body.dep_id;
        let dep_name = req.body.dep_name;
        let cond = {}
        let id = ""
        if (cid) {
            id = cid
        } else {
            id = com_id
        }
        cond.com_id = Number(id)
        if (dep_id) cond.dep_id = Number(dep_id)
        if (dep_name) cond.dep_name = { $regex: dep_name , $options:'i' }
        let data = await dep.find(cond).select("dep_id dep_name -_id").sort({ dep_id: -1 }).skip(skip).limit(limit).lean()
        return fnc.success(res, "lấy thành công", { data });
    } catch (error) {
        console.log(error);
        return fnc.setError(res, error.message);
    }
}
exports.list_Users = async (req, res) => {
    try {
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let com_id = req.body.com_id;
        let userName = req.body.userName;
        let id_user = req.body.id_user;
        let cond = {}
        if (com_id) {
            cond.type = 2
            if (id_user) cond._id = Number(id_user)
            if (userName) cond.userName = { $regex: userName , $options:'i'}
            cond["inForPerson.employee.com_id"] = Number(com_id)
            let data = await user.aggregate([
                { $match: cond },
                { $sort: { updatedAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "QLC_OrganizeDetail",
                        localField: "inForPerson.employee.organizeDetailId",
                        foreignField: "id",
                        as: "deparment"
                    }
                },
                { $unwind: { path: "$deparment", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        userName: "$userName",
                        dep_id: "$inForPerson.employee.organizeDetailId",
                        com_id: "$inForPerson.employee.com_id",
                        nameDeparment: "$deparment.organizeDetailName",
                    }
                }
            ])
            return fnc.success(res, "lấy thành công", { data });
        }
        return fnc.setError(res, "nhap id cong ty");

    } catch (error) {
        console.log(error);
        return fnc.setError(res, error.message);
    }
}
exports.list_Com = async (req, res) => {
    try {
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let com_id = req.body.com_id;
        let comName = req.body.comName;
        let cond = {}
        if (com_id) cond._id = { $in: com_id }
        if (comName) cond.userName = { $regex: comName , $options:'i'}
        cond.type = 1
        let data = await user.find(cond).select("_id userName idQLC").skip(skip).limit(limit).sort({ updatedAt: -1 }).lean()
        return fnc.success(res, "lấy thành công", { data });
    } catch (error) {
        console.log(error);
        return fnc.setError(res, error.message);
    }
}

