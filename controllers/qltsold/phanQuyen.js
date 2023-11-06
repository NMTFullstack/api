const functions = require('../../services/functions')
const fnc = require('../../services/QLTS/qltsService')
const phanQuyen = require('../../models/QuanLyTaiSan/PhanQuyen')
const dep = require('../../models/qlc/Deparment')

exports.create = async (req, res) => {
    try {
        const id_user = req.body.id_user
        const id_cty = req.user.data.com_id
        let {
            ds_ts,
            capphat_thuhoi,
            dieuchuyen_bangiao,
            suachua_baoduong,
            mat_huy_tl,
            ql_nhanvien,
            phan_quyen } = req.body;

        let data = await phanQuyen.findOne({ id_cty: id_cty, id_user: id_user }).lean()
        if (!data) {
            let max = await phanQuyen.findOne({}, {}, { sort: { id_phanquyen: -1 } }).lean() || 0;
            const phanQuyenTao = new phanQuyen({
                id_phanquyen: Number(max.id_phanquyen) + 1 || 1,
                id_user: id_user,
                id_cty: id_cty,
                ds_ts: ds_ts,
                capphat_thuhoi: capphat_thuhoi,
                dieuchuyen_bangiao: dieuchuyen_bangiao,
                suachua_baoduong: suachua_baoduong,
                mat_huy_tl: mat_huy_tl,
                ql_nhanvien: ql_nhanvien,
                phan_quyen: phan_quyen,
            })
            await phanQuyenTao.save()
            return functions.success(res, "Tạo thành công")
        } else {
            await phanQuyen.updateOne({ id_cty: id_cty, id_user: id_user }, {
                id_user: id_user,
                id_cty: id_cty,
                ds_ts: ds_ts,
                capphat_thuhoi: capphat_thuhoi,
                dieuchuyen_bangiao: dieuchuyen_bangiao,
                suachua_baoduong: suachua_baoduong,
                mat_huy_tl: mat_huy_tl,
                ql_nhanvien: ql_nhanvien,
                phan_quyen: phan_quyen,
            })
            return functions.success(res, "Cập nhật thành công")

        }
    } catch (e) {
        return functions.setError(res, e.message)
    }
}

exports.list = async (req, res) => {
    try {
        const id_user = req.body.id_user
        const dep_id = req.body.dep_id
        const id_cty = req.user.data.com_id
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let listConditions = {};
        listConditions.id_cty = id_cty
        if (id_user) { listConditions.id_user = Number(id_user) }
        let listConditions2 = {};
        if (dep_id) listConditions2.dep_id = Number(dep_id)
        let data = await phanQuyen.aggregate([
            // { $match: {id_cty: id_cty ,id_nhanvien : {$ne: 0} } },
            { $match: listConditions },
            { $sort: { id_phanquyen: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "Users",
                    localField: "id_user",
                    foreignField: "_id",
                    // pipeline: [
                    //     { $match: {$and : [
                    //     { "type" : {$ne : 1 }},
                    //     {"idQLC":{$ne : 0}},
                    //     {"idQLC":{$ne : 1}}
                    //     ]},
                    //     }
                    // ],
                    as: "info"
                }
            },
            { $unwind: { path: "$info", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    id_phanquyen: 1,
                    id_user: 1,
                    id_cty: 1,
                    "ten_nguoi_duoc_cap_quyen": "$info.userName",
                    "dep_id": "$info.inForPerson.employee.dep_id",
                    "chuc_vu": "$info.inForPerson.employee.position_id",
                }
            },
            { $match: listConditions2 },
        ])

        if (data) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].dep_id != 0) {
                    let depName = await dep.findOne({ com_id: id_cty, dep_id: data[i].dep_id })
                    data[i].depName = depName
                }
            }
            let count = await phanQuyen.find(listConditions).count()

            return functions.success(res, "lấy thành công", { data, count })
        }
        return functions.setError(res, "không tìm thấy nhân viên được phân quyền")
    } catch (e) {
        return functions.setError(res, e.message)
    }
}