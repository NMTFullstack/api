const DeKt = require('../../../models/DanhGiaNangLuc/DeKiemTraCauHoi')
const functions = require('../../../services/functions')


/// lay tem de kiem tra theo com id
exports.DeKtName = async(req, res, next) => {
    try {
        /// lay id cong ty
        const type = req.user.data.type

        const filter = {}
        if (type === 1) {
            filter.id_congty = req.user.data.idQLC
        } else {
            filter.id_congty = req.user.data.com_id
        }
        const DeKtName = await DeKt.find({ filter, is_delete: 2 }, { id: 1, ten_de_kiemtra: 1 })

        return functions.success(res, 'Successfully', { data: DeKtName })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Server', 500)
    }
}

/// lay du lieu cac de kiem tra da xoa gan day

exports.DeKtData = async(req, res, next) => {
        try {

            const id = req.body.id
            const skipp = req.body.skipp
            const limit = req.body.limit

            const filter = { id_congty: 0, is_delete: 2 }
            if (id) filter.id = id
                /// lay id cong ty
            const type = req.user.data.type


            if (type === 1) {
                filter.id_congty = req.user.data.idQLC
            } else {
                filter.id_congty = req.user.data.com_id
            }
            const filter1 = { skipp: 0, limit: 5 }
            if (limit) filter1.limit = limit
            if (skipp) filter1.skipp = filter1.limit * skipp

            const result = {}

            result.DeData = await DeKt.aggregate(
                [{
                        $match: filter
                    },
                    { $skip: filter1.skipp }, { $limit: filter1.limit },

                    {
                        $lookup: {
                            from: 'Users',
                            let: { nguoitao: '$nguoitao' },
                            pipeline: [{
                                    $match: {
                                        $expr: {
                                            $and: [{ $eq: ['$_id', '$$nguoitao'] }]
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        userName: 1
                                    }
                                }
                            ],
                            as: 'User'
                        }
                    },
                    { $unwind: '$User' },
                    {
                        $project: {
                            id: 1,
                            ten_de_kiemtra: 1,
                            nguoitao: 1,
                            so_cauhoi: { $size: { $split: ['$danhsach_cauhoi', ','] } },
                            ghichu: 1,
                            is_delete: 1,
                            updated_at: 1,
                            User: 1
                        }
                    }
                ]
            )
            return functions.success(res, 'successfully', { data: result })
        } catch (error) {
            console.log(error)
            return functions.success(res, 'Internal Server', 500)
        }
    }
    // chuc nang khoi phuc De kiem tra
exports.restoreDeKt = async(req, res, next) => {
        try {

            const id = req.body.id

            const De = await DeKt.updateOne({ id: id }, { trangthai_xoa: 1 }, { new: true })
            return functions.success(res, 'successfully', { data: De })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // chuc nang khoi phuc nhieu p 1 luc
exports.restoreDeKts = async(req, res, next) => {
        try {
            const ids = req.body.ids

            const arrayId = ids.split(',')
            for (let index = 0; index < arrayId.length; index++) {
                const element = await DeKt.updateOne({ id: Number(arrayId[index]) }, { trangthai_xoa: 1 }, { new: true });
            }
            return res.json({ success: 'successfully' })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // chuc nang xoa theo id
exports.deleteDeKt = async(req, res, next) => {
        try {

            const id = req.body.id

            const De = await DeKt.deleteOne({ id: id })
            return functions.success(res, 'successfully', { data: De })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // xoa nhieu DeKt 1 luc
exports.deleteDeKts = async(req, res, next) => {
    try {
        const ids = req.body.ids
        const arrayId = ids.split(',')
        for (let index = 0; index < arrayId.length; index++) {
            const element = await DeKt.deleteOne({ id: Number(arrayId[index]) });
        }
        return res.json({ success: 'successfully' })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Server', 500)
    }
}