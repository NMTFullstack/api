const { promises } = require('fs')
const PhieuDanhGia = require('../../../models/DanhGiaNangLuc/PhieuDanhGia')
const functions = require('../../../services/functions')


exports.PhieuName = async(req, res, next) => {
    try {
        /// lay id cong ty
        const type = req.user.data.type
        const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
        const TenPhieu = await PhieuDanhGia.aggregate(
            [{
                    $match: {
                        trangthai_xoa: 2,
                        id_congty
                    }
                },
                {
                    $lookup: {
                        from: 'DGNL_khDanhGia',
                        pipeline: [{
                            $project: {
                                kh_id: 1,
                                kh_ten: 1
                            }
                        }],
                        as: 'tenPhieu'
                    }
                },
                {
                    $project: {
                        phieu_id: 1,
                        tenPhieu: 1
                    }
                }
            ]
        )
        return functions.success(res, 'successfully', { data: TenPhieu })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Server', 500)
    }
}

/// lay du lieu tu bang kh

exports.PhieuData = async(req, res, next) => {
        try {
            const id = req.body.id
                /// lay id cong ty
            const type = req.user.data.type
            const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
            const skipp = req.body.skipp
            const limit = req.body.limit


            const filter = { trangthai_xoa: 2, id_congty }
            if (id) filter.id = id

            const filter1 = { skipp: 0, limit: 5 }
            if (limit) filter1.limit = limit
            if (skipp) filter1.skipp = skipp * filter1.limit

            const result = {}

            result.CountDoc = await PhieuDanhGia.count(filter)
            result.PhieuData = await PhieuDanhGia.aggregate(
                [{
                        $match: filter
                    },
                    {
                        $lookup: {
                            from: 'DGNL_khDanhGia',
                            let: { phieu_id: '$phieuct_id_kh' },
                            pipeline: [{
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$kh_id', '$$phieu_id'] }
                                            ]
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        kh_id: 1,
                                        kh_ten: 1,
                                        kh_trangthai: 1,
                                        doituong: {
                                            $cond: {
                                                if: { $eq: ["$kh_use_nv", null] }, // Check if "kh_user_nv" is null
                                                then: 2,
                                                else: 1
                                            }
                                        },
                                        sodoituong: {
                                            $cond: {
                                                if: { $eq: ["$kh_use_nv", null] }, // Check if "kh_user_nv" is null
                                                then: { $size: { $split: ["$kh_user_pb", ','] } },
                                                else: { $size: { $split: ["$kh_user_nv", ','] } }
                                            }
                                        },
                                        kh_ngaybatdau: {
                                            $dateToString: {
                                                format: '%d/%m/%Y',
                                                date: { $toDate: { $multiply: ["$kh_ngaybatdau", 1000] } }
                                            }
                                        },
                                        kh_ngayketthuc: {
                                            $dateToString: {
                                                format: '%d/%m/%Y',
                                                date: { $toDate: { $multiply: ["$kh_ngayketthuc", 1000] } }
                                            }
                                        },
                                        kh_giobatdau: 1,
                                        kh_gioketthuc: 1,
                                        nguoidanhgia: {
                                            $split: ['$kh_user_dg', ',']
                                        },
                                        kh_ghichu: 1
                                    }
                                },
                                {
                                    $unwind: '$nguoidanhgia'
                                }, {
                                    $lookup: {
                                        from: 'Users',
                                        let: { nguoidanhgia: { $toDouble: '$nguoidanhgia' } },
                                        pipeline: [{
                                                $match: {
                                                    $expr: {
                                                        $and: [{ $eq: ['$_id', '$$nguoidanhgia'] }]
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    userName: 1,
                                                    dep_id: '$inForPerson.employee.dep_id',
                                                    position_id: '$inForPerson.employee.position_id',
                                                    com_id: '$inForPerson.employee.com_id'
                                                }
                                            }
                                        ],
                                        as: 'userName'
                                    }
                                }, { $unwind: '$userName' },
                                {
                                    $lookup: {
                                        from: 'QLC_Deparments',
                                        let: { dep: '$userName.dep_id', com: '$userName.com_id' },
                                        pipeline: [{
                                                $match: {
                                                    $expr: {
                                                        $and: [{ $eq: ['$dep_id', '$$dep'] }, { $eq: ['$com_id', '$$com'] }]
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    dep_name: 1,
                                                }
                                            }
                                        ],
                                        as: 'depName'
                                    }
                                }, { $unwind: '$depName' },
                                {
                                    $lookup: {
                                        from: 'HR_DescPositions',
                                        let: { posi: '$userName.position_id', com: '$userName.com_id' },
                                        pipeline: [{
                                                $match: {
                                                    $expr: {
                                                        $and: [{ $eq: ['$positionId', '$$posi'] }, { $eq: ['$comId', '$$com'] }]
                                                    }
                                                }
                                            },
                                            {
                                                $project: {
                                                    description: 1,
                                                }
                                            }
                                        ],
                                        as: 'positionName'
                                    }
                                }, { $unwind: '$positionName' },
                                {
                                    $group: {
                                        _id: {
                                            kh_id: '$kh_id',
                                            kh_ten: "$kh_ten",
                                            doituong: '$doituong',
                                            sodoituong: '$sodoituong',
                                            kh_ngaybatdau: '$kh_ngaybatdau',
                                            kh_ngayketthuc: '$kh_ngayketthuc',
                                            kh_giobatdau: '$kh_giobatdau',
                                            kh_gioketthuc: '$kh_gioketthuc',
                                            kh_ghichu: '$kh_ghichu'
                                        }, // Trường dùng để nhóm
                                        Name: { $push: "$userName.userName" }, // Tạo một mảng các sản phẩm trong mỗi nhóm
                                        Dep: { $push: "$depName.dep_name" },
                                        Position: { $push: "$positionName.description" }
                                    }
                                }
                            ],
                            as: 'KhData'
                        }
                    },

                    { $skip: filter1.skipp }, { $limit: filter1.limit },
                    {
                        $project: {
                            id: 1,
                            KhData: 1
                        }
                    }
                ]
            )

            const sameTime = await Promise.all(
                [result.CountDoc, result.PhieuData]
            )
            result.CountDoc = sameTime[0]
            result.PhieuData = sameTime[1]
            return functions.success(res, 'successfully', { data: result })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // chuc nang khoi phuc Phieu
exports.restorePhieu = async(req, res, next) => {
        try {

            const id = req.body.id

            const Phieu = await PhieuDanhGia.updateOne({ id: id }, { trangthai_xoa: 1 }, { new: true })
            return functions.success(res, 'successfully', { data: Phieu })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // chuc nang khoi phuc nhieu p 1 luc
exports.restorePhieus = async(req, res, next) => {
        try {
            const ids = req.body.ids

            const arrayId = ids.split(',')
            for (let index = 0; index < arrayId.length; index++) {
                const element = await PhieuDanhGia.updateOne({ id: Number(arrayId[index]) }, { trangthai_xoa: 1 }, { new: true });
            }
            return res.json({ success: 'successfully' })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // chuc nang xoa theo id
exports.deletePhieu = async(req, res, next) => {
        try {

            const id = req.body.id

            const Phieu = await PhieuDanhGia.deleteOne({ id: id })
            return functions.success(res, 'successfully', { data: Phieu })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // xoa nhieu Phieu 1 luc
exports.deletePhieus = async(req, res, next) => {
    try {
        const ids = req.body.ids
        const arrayId = ids.split(',')
        for (let index = 0; index < arrayId.length; index++) {
            const element = await PhieuDanhGia.deleteOne({ id: Number(arrayId[index]) });
        }
        return res.json({ success: 'successfully' })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Server', 500)
    }
}