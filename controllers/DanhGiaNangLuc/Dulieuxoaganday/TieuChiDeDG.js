const functions = require('../../../services/functions')
const TblTieuchi = require('../../../models/DanhGiaNangLuc/TblTieuChi')
const DeDG = require('../../../models/DanhGiaNangLuc/DeDanhGia')
const Kehoach = require('../../../models/DanhGiaNangLuc/KhDanhGia')

const DeKt = require('../../../models/DanhGiaNangLuc/DeKiemTraCauHoi')
const TblTieuChi = require('../../../models/DanhGiaNangLuc/TblTieuChi')
const PhieuDanhGia = require('../../../models/DanhGiaNangLuc/PhieuDanhGia')

// lay tat ca ten tieu chi da xoa
exports.getNameTc = async(req, res, next) => {
        try {
            const option = {
                    id: 1,
                    tcd_ten: 1
                }
                /// lay id cong ty
            const type = req.user.data.type
            const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
            const arrayTc = await TblTieuchi.find({ trangthai_xoa: 2, id_congty }, option)
            return functions.success(res, 'successfully', { data: arrayTc })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal server', 500)
        }
    }
    /// lay cac tieu chi da xoa gan day
exports.getTcXoa = async(req, res, next) => {
        try {
            const id = req.body.id
            const limit = req.body.limit
            const skipp = req.body.skipp
                /// lay id cong ty
            const type = req.user.data.type
            const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
            const filter = { id_congty, trangthai_xoa: 2 }

            const pagingSkipp = { skipp: 0 } // phan tranng
            const pagingLimit = { limit: 5 }
            if (id) filter.id = id

            if (skipp) paging.skipp = skipp * pagingLimit.limit
            if (limit) paging.limit = limit
            const result = {}
            result.count = await DeDG.aggregate(
                [{
                        $match: filter
                    },
                    {
                        $lookup: {
                            from: 'Users',
                            let: { nguoitao: '$tcd_nguoitao', com_id: '$id_congty' },
                            pipeline: [{
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$_id', '$$nguoitao'] },
                                                { $eq: ['$inForPerson.employee.com_id', '$$com_id'] },
                                            ]
                                        },

                                    }
                                },
                                {
                                    $project: {
                                        name: '$userName'
                                    }
                                }
                            ],
                            as: 'userName'

                        }
                    },
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 }
                        }
                    }
                ]
            )
            result.arrayTc = await TblTieuchi.aggregate(
                [{
                        $match: filter
                    },
                    {
                        $lookup: {
                            from: 'Users',
                            let: { nguoitao: '$tcd_nguoitao', com_id: '$id_congty' },
                            pipeline: [{
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$_id', '$$nguoitao'] },
                                                { $eq: ['$inForPerson.employee.com_id', '$$com_id'] },
                                            ]
                                        },

                                    }
                                },
                                {
                                    $project: {
                                        name: '$userName'
                                    }
                                }
                            ],
                            as: 'userName'

                        }
                    },
                    { $skip: pagingSkipp.skipp }, { $limit: pagingLimit.limit },
                    {
                        $unwind: '$userName'
                    },
                    {
                        $project: {
                            id: 1,
                            tcd_ten: 1,
                            tcd_loai: 1,
                            tcd_thangdiem: 1,
                            userName: 1,
                            tcd_capnhat: 1
                        }
                    }
                ]
            )
            return functions.success(res, 'successfully', { data: result })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal server', 500)
        }
    }
    // chuc nang khoi phuc Tieu chi
exports.restoreTC = async(req, res, next) => {
        try {

            const id = req.body.id

            const tieuChi = await TblTieuchi.updateOne({ id }, { trangthai_xoa: 1 }, { new: true })
            return functions.success(res, 'successfully', { data: tieuChi })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // chuc nang khoi phuc nhieu tieu chi 1 luc
exports.restoreTCs = async(req, res, next) => {
        try {
            const ids = req.body.ids

            const arrayId = ids.split(',')
            for (let index = 0; index < arrayId.length; index++) {
                const element = await TblTieuchi.updateOne({ id: Number(arrayId[index]) }, { trangthai_xoa: 1 }, { new: true });
            }
            return res.json({ success: 'successfully' })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // chuc nang xoa theo id
exports.deleteTC = async(req, res, next) => {
        try {

            const id = req.body.id

            const tieuChi = await TblTieuchi.deleteOne({ id }, { new: true })
            return functions.success(res, 'successfully', { data: tieuChi })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // xoa nhieu tieu chi 1 luc
exports.deleteTcs = async(req, res, next) => {
        try {
            const ids = req.body.ids
            const arrayId = ids.split(',')
            for (let index = 0; index < arrayId.length; index++) {
                const element = await TblTieuchi.deleteOne({ id: Number(arrayId[index]) });
            }
            return res.json({ success: 'successfully' })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    /// lay ten de danh gia va lay cac de danh gia da xoa

exports.deDG = async(req, res, next) => {
        try {

            const dg_id = req.body.dg_id
            const limit = req.body.limit
            const skipp = req.body.skipp


            const filter = { id_congty: 3312, trangthai_xoa: 2 }
            if (dg_id) filter.dg_id = dg_id

            const filter1 = { skipp: 0, limit: 5 }
            if (limit) filter1.limit = limit
            if (skipp) filter1.skipp = filter1.limit * skipp
            const result = {}
            result.arrayName = await DeDG.find({ trangthai_xoa: 2, id_congty: 3312 }, { dg_id: 1, dg_ten: 1 })
            result.count = await DeDG.aggregate(
                [{
                        $match: filter
                    },
                    {
                        $lookup: {
                            from: 'Users',
                            let: { nguoitao: '$dg_nguoitao', com_id: '$id_congty' },
                            pipeline: [{
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$_id', '$$nguoitao'] },
                                                { $eq: ['$inForPerson.employee.com_id', '$$com_id'] },
                                            ]
                                        },

                                    }
                                },
                                {
                                    $project: {
                                        name: '$userName'
                                    }
                                }
                            ],
                            as: 'userName'

                        }
                    },
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 }
                        }
                    }
                ]
            )
            result.arrayNameById = await DeDG.aggregate(
                [{
                        $match: filter
                    },
                    {
                        $lookup: {
                            from: 'Users',
                            let: { nguoitao: '$dg_nguoitao', com_id: '$id_congty' },
                            pipeline: [{
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$_id', '$$nguoitao'] },
                                                { $eq: ['$inForPerson.employee.com_id', '$$com_id'] },
                                            ]
                                        },

                                    }
                                },
                                {
                                    $project: {
                                        name: '$userName'
                                    }
                                }
                            ],
                            as: 'userName'

                        }
                    },
                    {
                        $skip: filter1.skipp
                    },
                    {
                        $limit: filter1.limit
                    },
                    {
                        $unwind: '$userName'
                    },
                    {
                        $project: {
                            dg_id: 1,
                            dg_ten: 1,
                            userName: 1,
                            dg_ghichu: 1,
                            dg_capnhat: 1
                        }
                    }
                ]
            )
            const promise = await Promise.all(
                [
                    result.arrayName,
                    result.arrayNameById,
                    result.count
                ]
            )
            result.arrayName = promise[0],
                result.arrayNameById = promise[1],
                result.count = promise[2]
            return functions.success(res, 'successfully', { data: result })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal server', 500)
        }
    }
    // chuc nang khoi phuc De DG
exports.restoreDG = async(req, res, next) => {
        try {

            const id = req.body.id

            const DeDG = await DeDG.updateOne({ dg_id: id }, { trangthai_xoa: 1 }, { new: true })
            return functions.success(res, 'successfully', { data: DeDG })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // chuc nang khoi phuc nhieu tieu chi 1 luc
exports.restoreDGs = async(req, res, next) => {
        try {
            const ids = req.body.ids

            const arrayId = ids.split(',')
            for (let index = 0; index < arrayId.length; index++) {
                const element = await DeDG.updateOne({ dg_id: Number(arrayId[index]) }, { trangthai_xoa: 1 }, { new: true });
            }
            return res.json({ success: 'successfully' })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // chuc nang xoa theo id
exports.deleteDG = async(req, res, next) => {
        try {

            const id = req.body.id

            const tieuChi = await DeDG.deleteOne({ dg_id: id })
            return functions.success(res, 'successfully', { data: tieuChi })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // xoa nhieu tieu chi 1 luc
exports.deleteDGs = async(req, res, next) => {
    try {
        const ids = req.body.ids
        const arrayId = ids.split(',')
        for (let index = 0; index < arrayId.length; index++) {
            const element = await TblTieuchi.deleteOne({ dg_id: Number(arrayId[index]) });
        }
        return res.json({ success: 'successfully' })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Server', 500)
    }
}

/// dem so luong tieuchi tieude, ke hoach danh gia,phieu danh gia,de kiem tra
exports.renderCount = async(req, res, next) => {
    try {
        const result = {}
            /// lay id cong ty
        const type = req.user.data.type
        const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
        result.tieuchi = await TblTieuChi.countDocuments({ id_congty, trangthai_xoa: 2 })
        result.deDG = await DeDG.countDocuments({ id_congty: com_id, trangthai_xoa: 2 })
        result.DeKt = await DeKt.countDocuments({ id_congty: com_id, is_delete: 2 })
        result.Kehoach = await Kehoach.countDocuments({ id_congty: com_id, trangthai_xoa: 2 })
        result.PhieuDG = await PhieuDanhGia.countDocuments({ id_congty: com_id, trangthai_xoa: 2 })

        const sameTime = await Promise.all(
            [result.tieuchi, result.deDG, result.DeKt, result.Kehoach, result.PhieuDG]
        )
        result.tieuchi = sameTime[0]
        result.deDG = sameTime[1]
        result.DeKt = sameTime[2]
        result.Kehoach = sameTime[3]
        result.PhieuDG = sameTime[4]

        return functions.success(res, 'successfully', { data: result })
    } catch (error) {
        return functions.setError(res, 'Internal Server', 500)
    }
}