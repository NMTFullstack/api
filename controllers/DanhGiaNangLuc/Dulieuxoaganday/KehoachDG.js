const functions = require('../../../services/functions')
const KehoachDG = require('../../../models/DanhGiaNangLuc/KhDanhGia')

const PhieuDG = require('../../../models/DanhGiaNangLuc/PhieuDanhGia')
const PhieuDanhGia = require('../../../models/DanhGiaNangLuc/PhieuDanhGia')

// lay ten cac ke hoach danh gia da xoa 

exports.KhName = async(req, res, next) => {
    try {
        /// lay id cong ty
        const type = req.user.data.type

        const filters = {}
        if (type === 1) {
            filters.id_congty = req.user.data.idQLC
        } else {
            filters.id_congty = req.user.data.com_id
        }
        const arrayName = await KehoachDG.find({ id_congty: filters.id_congty, trangthai_xoa: 2 }, { kh_id: 1, kh_ten: 1 })
        return functions.success(res, 'successfully', { data: arrayName })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Server', 500)
    }
}


// lay du lieu cho bang ke hoach da xoa gan day

exports.DataKh = async(req, res, next) => {
        try {

            const limit = req.body.limit
            const skipp = req.body.skipp
            const kh_id = req.body.kh_id

            const filter = { id_congty: 0 }
                /// lay id cong ty
            const type = req.user.data.type


            if (type === 1) {
                filter.id_congty = req.user.data.idQLC
            } else {
                filter.id_congty = req.user.data.com_id
            }
            if (kh_id) filter.kh_id = kh_id
            const paging = { skipp: 0, limit: 5 }

            if (limit) paging.limit = limit
            if (skipp) paging.skipp = skipp * paging.limit

            const arrayData = await KehoachDG.aggregate(
                [{
                        $match: filter
                    },
                    {
                        $lookup: {
                            from: 'Users',
                            let: { nguoitao: '$kh_nguoitao', comId: '$id_congty' },
                            pipeline: [{
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$inForPerson.employee.com_id', '$$comId'] },
                                                { $eq: ['$_id', '$$nguoitao'] }

                                            ]

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
                            as: 'nguoitao'
                        }
                    },
                    {
                        $unwind: '$nguoitao'
                    },
                    {
                        $addFields: {
                            nguoidanhgia: { $split: ["$kh_user_dg", ','] },
                            nguoiduocdanhgia: {
                                $cond: {
                                    if: { $eq: ["$kh_use_nv", null] }, // Check if "kh_user_nv" is null
                                    then: { $split: ["$kh_user_pb", ','] },
                                    else: { $split: ["$kh_user_nv", ','] }
                                }
                            }
                        }
                    },
                    { $limit: paging.limit }, { $skip: paging.skipp },
                    {
                        $project: {
                            kh_id: 1,
                            kh_ten: 1,
                            kh_trangthai: 1,
                            nguoitao: 1,
                            nguoidanhgia: 1,
                            nguoiduocdanhgia: { $size: '$nguoiduocdanhgia' },
                            kh_ngaybatdau: 1,
                            kh_ngayketthuc: 1,
                            kh_tiendo: 1,
                            kh_ghichu: 1
                        }
                    }
                ]
            )
            return functions.success(res, 'successfull', { data: arrayData })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // xem chi tiet nguoi danh gia
    // {
    //     $unwind: '$nguoidanhgia'
    // },
    // {
    //     $lookup:{
    //         from:'Users',
    //         let:{ comId : '$id_congty', userId :'$nguoidanhgia'},
    //         pipeline:[
    //             {
    //                 $match:{
    //                     $expr:{
    //                         $and:[
    //                             { $eq: ['$inForPerson.employee.com_id','$$comId']},
    //                             { $eq: ['$_id',{$toDouble:'$$userId'}]}
    //                         ]
    //                     }
    //                 }
    //             },
    //             {
    //                 $project:{
    //                     depId: '$inForPerson.employee.dep_id',
    //                     userName: 1
    //                 }
    //             }
    //         ],
    //         as:'personal'
    //     }
    // },
    // {
    //     $unwind:'$personal'
    // },  
    // {
    //     $group:{
    //         kh_id:'$kh_id',
    //         nguoidanhgiaDetail:{ $push: '$personal'}
    //     }
    // },
    // chuc nang khoi phuc ke hoach
exports.restoreKH = async(req, res, next) => {
        try {

            const id = req.body.id

            /// lay id cong ty
            const type = req.user.data.type
            const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id

            const restoreData = await KhDanhGia.updateOne({ kh_id: id, id_congty }, { trangthai_xoa: 1 }, { new: true })
            return functions.success(res, 'successfully', { data: restoreData })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // chuc nang khoi phuc nhieu ke hoach 1 luc
exports.restoreKHs = async(req, res, next) => {
        try {
            const ids = req.body.ids

            /// lay id cong ty
            const type = req.user.data.type
            const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
            const arrayId = ids.split(',')
            for (let index = 0; index < arrayId.length; index++) {
                const element = await KhDanhGia.updateOne({ kh_id: Number(arrayId[index]), id_congty }, { trangthai_xoa: 1 }, { new: true });
            }
            return res.json({ success: 'successfully' })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // chuc nang xoa theo id
exports.deleteKH = async(req, res, next) => {
        try {

            const id = req.body.id
                /// lay id cong ty
            const type = req.user.data.type
            const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
            const xoaData = await KhDanhGia.deleteOne({ kh_id: id, id_congty }, { new: true })
            const PhieuDG = await PhieuDanhGia.deleteOne({ phieuct_id_kh: id }, { new: true })

            return functions.success(res, 'successfully', { data: xoaData })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // xoa nhieu ke hoach 1 luc
exports.deleteKHs = async(req, res, next) => {
    try {
        const ids = req.body.ids
            /// lay id cong ty
        const type = req.user.data.type
        const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
        const arrayId = ids.split(',')
        for (let index = 0; index < arrayId.length; index++) {
            const element = await KhDanhGia.deleteOne({ kh_id: Number(arrayId[index]), id_congty });
            const element2 = await PhieuDG.deleteOne({ phieuct_id_kh: Number(arrayId[index]) });
        }
        return res.json({ success: 'successfully' })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Server', 500)
    }
}