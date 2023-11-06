const QlCDep = require('../../../models/qlc/Deparment')
const ChucVu = require('../../../models/DanhGiaNangLuc/TblChucVu')
const KhDanhGia = require('../../../models/DanhGiaNangLuc/KhDanhGia')
const Users = require('../../../models/Users')
const functions = require('../../../services/functions')
const PhieuDGChitiet = require('../../../models/DanhGiaNangLuc/PhieuDanhGiaChiTiet')
const PhieuDanhGiaChiTiet = require('../../../models/DanhGiaNangLuc/PhieuDanhGiaChiTiet')
// all dep
exports.allDep = async (req, res, next) => {
    try {
        const com_id = 3312
        const option = {
            dep_id: 1,
            dep_name: 1
        }
        const allDep = await QlCDep.find({ com_id }, option)

        return functions.success(res, 'successfully', { data: allDep })
    }
    catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Error', 500)
    }
}
// all name
exports.allName = async (req, res, next) => {
    try {
        const com_id = 3312
        const option = {
            _id: 1,
            userName: 1,
            'inForPerson.employee.com_id': 1,
            'inForPerson.employee.dep_id': 1,
        }
        const allName = await Users.find({ 'inForPerson.employee.com_id': com_id }, option)
        return functions.success(res, 'successfully', { data: allName })
    }
    catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal server', 500)
    }
}
// All ke hoach danh gias 
exports.allKh = async (req, res, next) => {
    try {
        const id_congty = 3312
        const option = {
            kh_id: 1, kh_ten: 1,
        }
        const allKh = await KhDanhGia.find({ id_congty, trangthai_xoa: 1 }, option)
        return functions.success(res, 'successfully', { data: allKh })
    }
    catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal server', 500)
    }
}


// render du lieu va phan trang

exports.renderItem = async (req, res, next) => {
    try {

        const com_id = 3312
        const _id = req.body._id
        const dep_id = req.body.dep_id
        const kh_id = req.body.kh_id
        const sap_xep = req.body.sap_xep
        const hienThi = req.body.hienThi
        const skipped = req.body.skipped


        const filter = { 'inForPerson.employee.com_id': com_id }
        const filter1 = { skipped: 0, hienThi: 5 }
        if (_id) filter._id = _id
        if (dep_id) filter.dep_id = dep_id
        if (kh_id) filter.kh_id = kh_id
        if (sap_xep) filter.sap_xep = sap_xep
        if (hienThi) filter1.hienThi = hienThi
        if (skipped) {

            filter1.skipped = filter1.hienThi * skipped

        }

        const option = {
            _id: 1,
            userName: 1,
            'inForPerson.employee.com_id': 1,
            'inForPerson.employee.dep_id': 1,
            'inForPerson.employee.position_id': 1

        }
        /// ket qua tra ra
        const result = {}
        // lay so phan tu  = hien thi , skipped = phan trang
        const renderItems = await Users.find(filter, option).skip(filter1.skipped).limit(filter1.hienThi)

        result.users = renderItems
        result.depNames = []
        result.posiNames = []

        /// lay ten phong ban va ten chuc vu
        for (let index = 0; index < renderItems.length; index++) {
            const element = renderItems[index];

            //lay ten phong ban
            const depName = await QlCDep.findOne
                ({ com_id: element.inForPerson.employee.com_id, dep_id: element.inForPerson.employee.dep_id }, { dep_name: 1 })
            result.depNames.push(depName)

            // lay ten chuc vu
            const positionName = await ChucVu.findOne
                ({
                    id_congty: element.inForPerson.employee.com_id,
                    id_chucvu: element.inForPerson.employee.position_id,
                    id_phongban: element.inForPerson.employee.dep_id
                }, { ten_chucvu: 1 })

            result.posiNames.push(positionName)
        }
        return functions.success(res, 'successfully', { data: result })


    }
    catch (error) {
        console.log(error)
        return functions.setError(res, 'Iternal server', 500)
    }
}

/// tool chuyen string qua array
exports.changeToArray = (string = "") => {
    const arrayto = string.slice(1, string.length - 1)
    const array = arrayto.split(',')
    return array
}


//// lay ke hoach danh gia

exports.getKQNV = async (req, res, next) => {
    try {
        const kh_id = Number(req.body.kh_id)
        const com_id = 3312
        const id = Number(req.body.id)
        const hienThi = Number(req.body.hienThi)
        const skipped = Number(req.body.skipped)
        const dep_id = Number(req.body.dep_id)
        const sorted =Number(req.body.sorted) 
        const filter3 ={sorted: 1}
        if(sorted)filter3.sorted=sorted
        
        const filter = {
            id_congty: com_id,
            trangthai_xoa: 1
        }
        
        if(kh_id)filter.kh_id = kh_id
        const filter1 = {
            kh_user_nv: KhDanhGia.countDocuments,  //// default nhan vien
            skipped: 0,
            hienThi: 5,
            dep_id: 0   ////// default dep_id
        }
        var filter2 ={}
        if(dep_id) filter2={
           'User.dep_id': dep_id
        }
        console.log(filter2)
         if (id) filter1.kh_user_nv = id
        // if (!dep_id) res.json({Waring:'Select department'})
        if (hienThi) filter1.hienThi = hienThi
        if (skipped) filter1.skipped = skipped * filter1.hienThi

        console.log(filter)



        const KQNV = {}
        KQNV.countKQ = await KhDanhGia.aggregate(
            [
                { $match: filter },
                {
                    $addFields: {
                        kh_user_nv: { $split: ["$kh_user_nv", ","] }
                    }
                },
                {
                    $unwind: "$kh_user_nv"
                },
                {
                    $project: {
                        kh_id: 1,
                        kh_user_nv: { $toDouble: "$kh_user_nv" }
                    }
                },
                {
                    $match: {
                        kh_user_nv: filter1.kh_user_nv
                    }
                },
                {
                    $lookup: {
                        from: "Users",
                        // localField:"kh_user_nv",
                        // foreignField:"_id",
                        // as:"linked"

                        let: { kh_nv: '$kh_user_nv' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$_id', '$$kh_nv'] },

                                        ]
                                    },

                                }
                            },
                            {
                                $project: {
                                    'inForPerson.employee.dep_id': 1,
                                }
                            }
                        ],
                        as: 'linked'
                    }
                },
                {
                    $match:filter2
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 }
                    }

                }
            ]
        )
        KQNV.arrayNv = await KhDanhGia.aggregate(
            [
                { $match: filter },
                {
                    $addFields: {
                        kh_user_nv: { $split: ["$kh_user_nv", ","] }
                    }
                },
                {
                    $unwind: "$kh_user_nv"
                },
                {
                    $project: {
                        kh_id: 1,
                        kh_user_nv: { $toDouble: "$kh_user_nv" },
                        kh_ten: 1
                    }
                },
                {
                    $match: {
                        kh_user_nv: filter1.kh_user_nv
                    }
                },
                { $skip: filter1.skipped }, { $limit: filter1.hienThi },
                //// lay com id, dep id,position id tu bang user
                {  
                    $lookup: {
                        from: "Users",
                        // localField:"kh_user_nv",
                        // foreignField:"_id",
                        // as:"linked"

                        let: { kh_nv: '$kh_user_nv' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$_id', '$$kh_nv'] },

                                        ]
                                    },

                                }
                            },
                            
                            {
                                $project: {
                                    _id: 1,
                                    userName: 1,
                                    com_id: '$inForPerson.employee.com_id',
                                    dep_id: '$inForPerson.employee.dep_id',
                                    position_id:'$inForPerson.employee.position_id',
                                    
                                }
                            }
                        ],
                        as: 'User'
                    }
                },
                {$unwind: "$User"},
                {
                    $match: filter2
                },
                // lay ten phong ban
                {
                    $lookup:{
                        from:'QLC_Deparments',
                        let: { dep_id: '$User.dep_id', com_id: '$User.com_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$dep_id', '$$dep_id'] },
                                            { $eq: ['$com_id', '$$com_id'] },
                                        ]
                                    },

                                }
                            },
                            {
                                $project: {
                                    dep_id: 1,
                                    dep_name:1
                                }
                            }
                        ],
                        as: 'Dep'
                    }
                },
                {$unwind: "$Dep"},
                // lay ten chuc vu
                {
                    $lookup:{
                        from:'HR_DescPositions',
                        let: { position_id: '$User.position_id', com_id: '$User.com_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$positionId', '$$position_id'] },
                                            { $eq: ['$comId', '$$com_id'] },
                                        ]
                                    },

                                }
                            },
                            {
                                $project: {
                                    positionId: 1,
                                    description:1
                                }
                            }
                        ],
                        as: 'Position'
                    }
                },
                {$unwind: "$Position"},
                // lay pdg
                {
                    $lookup:{
                        from:'DGNL_PhieuDanhGia',
                        let: {kh_id:'$kh_id',com_id:'$User.com_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$phieuct_id_kh', '$$kh_id'] },
                                            { $eq: ['$id_congty', '$$com_id'] },
                                        ]
                                    },

                                }
                            },
                            {
                                $project: {
                                    id:1,
                                    phieuct_id_kh: 1,
                                    
                                }
                            }
                        ],
                        as: 'PDG'
                    }
                },
                {$unwind: "$PDG"},
                {
                    $lookup:{
                        from:'DGNL_PhieuDanhGiaChiTiet',
                        let: {p_id:'$PDG.id',com_id:'$User.com_id',uId:'$kh_user_nv'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$phieu_id', '$$p_id'] },
                                            { $eq: ['$id_congty', '$$com_id'] },
                                            { $eq: ['$id_doituong', '$$uId'] },
                                        ]
                                    },

                                }
                            },
                            {
                                $project: {
                                    id:1,
                                    phieu_id: 1,
                                    tongdiem:{ $divide: ['$tongdiem',2]},
                                    tongdiem_kt:{ $divide: ['$tongdiem_kt',2]},
                                }
                            },
                            {
                                $addFields:{
                                    trungbinh:{
                                        $add:['$tongdiem','$tongdiem_kt']
                                    }
                                }
                            }
                        ],
                        as: 'PDGct'
                    }
                },
                { $unwind:'$PDGct'},
                { $sort: {'PDGct.trungbinh': filter3.sorted}},
                {
                    $project: {
                        kh_id: 1,
                        kh_user_nv: 1,
                        kh_ten: 1,
                        count: 1,
                        User:1,
                        Dep:1,
                        Position:1, PDG:1 ,PDGct:1
                    }
                }

            ]
        )
        
        let sameTime = await Promise.all(
            [
                KQNV.arrayNv, KQNV.countKQ
            ]
        )
        KQNV.arrayNv = sameTime[0]
        KQNV.countKQ = sameTime[1]
        return functions.success(res, 'successfully', { data: KQNV })
    }
    catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Error', 500)
    }
}
// lay chi tiet phieu danh gia ???