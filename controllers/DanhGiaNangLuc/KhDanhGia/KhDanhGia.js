const KhDanhGia = require('../../../models/DanhGiaNangLuc/KhDanhGia');
const functions = require('../../../services/functions');
const Users = require('../../../models/Users')
const QlCDep = require('../../../models/qlc/Deparment')
const DescPosition = require('../../../models/hr/DescPositions')
    // loc du lieu va hien thi du lieu
exports.searchKH = async(req, res, next) => {

    try {
        const result = { hienThi: 5, skipped: 0 }
        KhDanhGia.createIndexes({ kh_ten: 1 })
            // filter 
        const filter = { trangthai_xoa: 1 }
        const kh_ngaybatdau = req.body.kh_ngaybatdau
        const kh_ngayketthuc = req.body.kh_ngayketthuc

        if (kh_ngaybatdau) filter.kh_ngaybatdau = kh_ngaybatdau
        if (kh_ngayketthuc) filter.kh_ngayketthuc = kh_ngayketthuc

        const kh_trangthai = req.body.kh_trangthai
        const kh_id = req.body.kh_id

        if (kh_trangthai) filter.kh_trangthai = kh_trangthai
        if (kh_id) filter.kh_id = kh_id

        // phan trang
        const hienThi = req.body.hienThi
        const skipped = req.body.skipped
        if (hienThi) result.hienThi = hienThi
        if (skipped) result.skipped = result.hienThi * Number(skipped)

        // dem ban ghi
        const countItem = await KhDanhGia.find(filter).countDocuments()
        if (countItem === 0) return functions.setError(res, 'Not found data', 404)

        // lua chon field
        const option = [
            'id',
            'kh_ten',
            'kh_loai',
            'kh_trangthai',
            'kh_nguoitao',
            'kh_user_dg',
            'kh_user_nv',
            'kh_ngaybatdau',
            'kh_ngayketthuc',
            'kh_ghichu',

        ]
        const arrayResult = await KhDanhGia.find(filter, option).skip(result.skipped).limit(result.hienThi)
        const arrayVice = []
        const resultVice = {}
        if (arrayResult)
            for (let index = 0; index < arrayResult.length; index++) {
                let user_nv = arrayResult[index].kh_user_nv.split(',')
                let user_dg = arrayResult[index].kh_user_dg.split(',')

                resultVice.user_nvCount = user_nv.length
                resultVice.user_dgCount = user_dg.length
                arrayVice.push(resultVice)
            }
        result.countItem = countItem
        result.arrayResult = arrayResult
        result.arrayVice = arrayVice

        return functions.success(res, 'successfully', {
            new: result
        })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal server', 500)
    }
}

// xoa du lieu 

exports.XoaKH = async(req, res, next) => {
        try {
            const kh_id = req.body.kh_id
            const updateItem = await KhDanhGia.updateOne({ kh_id }, { trangthai_xoa: 2 }, { new: true })

            return functions.success(res, 'successfully', { data: updateItem })

        } catch (error) {
            return functions.setError(res, 'Internal Error', 500)
        }
    }
    /// add quan li ke hoach 

exports.addKh = async(req, res, next) => {
    try {
        /// lay id cong ty
        const type = req.user.data.type
        const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
        const filter = {
            kh_id: Number(await KhDanhGia.countDocuments()) + 1,
            kh_ngaytao: functions.getTimeNow(),
            kh_trangthai: 1,
            kh_laplai: req.body.kh_laplai,
            kh_thu: 1,
            id_congty,
            kh_ngaybatdau: functions.convertTimestamp(req.body.kh_ngaybatdau),
            kh_ngayketthuc: functions.convertTimestamp(req.body.kh_ngayketthuc),
            kh_giobatdau: req.body.kh_giobatdau,
            kh_gioketthuc: req.body.kh_gioketthuc,
            kh_ghichu: req.body.kh_ghichu,
            kh_ten: req.body.kh_ten,
            kh_loai: req.body.kh_loai,
        }
        if (req.body.kh_loai === 1) {
            filter.kh_id_dg = req.body.kh_id_dg
            filter.kh_id_kt = 0
        }
        if (req.body.kh_loai === 2) {
            filter.kh_id_dg = 0
            filter.kh_id_kt = req.body.kh_id_kt
        }
        if (req.body.kh_loai === 3) {
            filter.kh_id_dg = req.body.kh_id_dg
            filter.kh_id_kt = req.body.kh_id_kt
        }

        /// lay thu 
        if (Number(req.body.kh_laplai) === 2) {
            filter.kh_thu = req.body.kh_thu
        }
        const nv = req.body.kh_user_nv
        const pb = req.body.kh_user_pb
        const dg = req.body.kh_user_dg

        if (nv && !pb) {
            filter.kh_user_nv = nv
            filter.kh_user_pb = null

        }
        if (!nv && pb) {
            filter.kh_user_nv = null
            filter.kh_user_pb = pb

        }
        filter.kh_user_dg = dg
        filter.kh_nguoitao = req.body.kh_nguoitao
        const arrayResult = await (new KhDanhGia(filter)).save()
        return functions.success(res, 'successfull', { data: arrayResult })
    } catch (error) {
        return functions.setError(res, 'Internal Error', 500)
    }
}

// show ten kh danh gia 
exports.showTen = async(req, res, next) => {
        try {
            const type = req.user.data.type
            const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
            const filter = { trangthai_xoa: 1, id_congty }
                /// lay id cong ty

            const option = [
                'kh_id', 'kh_ten'
            ]
            const arrayResult = await KhDanhGia.find(filter, option)

            return functions.success(res, 'successfully', { data: arrayResult })
        } catch (error) {
            return functions.setError(res, 'Internal error', 500)
        }
    }
    // duyet ke hoach danh gia

exports.duyetKh = async(req, res, next) => {
        try {
            const kh_id = req.body.kh_id
            const result = await KhDanhGia.updateOne({ kh_id }, { kh_trangthai: 2 }, { new: true })

            return functions.success(res, 'successfully', { data: result })
        } catch (error) {
            console.log(error)
            return functions.setError(res, "Internal Error", 500)
        }
    }
    // tu choi
exports.tuchoiKh = async(req, res, next) => {
    try {
        const kh_id = req.body.kh_id
        const result = await KhDanhGia.updateOne({ kh_id }, { kh_trangthai: 3 }, { new: true })

        return functions.success(res, 'successfully', { data: result })
    } catch (error) {
        console.log(error)
        return functions.setError(res, "Internal Error", 500)
    }
}

/// chinh sua
exports.chinhsuaKh = async(req, res, next) => {
        try {
            const kh_id = req.body.kh_id

            const kh_ten = req.body.kh_ten
            const kh_loai = req.body.kh_loai
            const kh_laplai = req.body.kh_laplai
            const kh_ngaybatdau = req.body.kh_ngaybatdau
            const kh_ngayketthuc = req.body.kh_ngayketthuc
            const kh_giobatdau = req.body.kh_giobatdau
            const kh_gioketthuc = req.body.kh_gioketthuc
            const kh_ghichu = req.body.kh_ghichu
            const now = functions.getTimeNow()
            const kh_capnhat = functions.convertDate(now)
            const filter = {}
            if (kh_ten) filter.kh_ten = kh_ten
            if (kh_loai) filter.kh_loai = kh_loai
            if (kh_laplai) filter.kh_laplai = kh_laplai
            if (kh_ngaybatdau) filter.kh_ngaybatdau = kh_ngaybatdau
            if (kh_ngayketthuc) filter.kh_ngayketthuc = kh_ngayketthuc
            if (kh_giobatdau) filter.kh_giobatdau = kh_giobatdau
            if (kh_gioketthuc) filter.kh_gioketthuc = kh_gioketthuc
            if (kh_ghichu) filter.kh_ghichu = kh_ghichu
            if (kh_capnhat) filter.kh_capnhat = kh_capnhat
            if (req.body.kh_loai === 1) {
                filter.kh_id_dg = req.body.kh_id_dg
                filter.kh_id_kt = null
            }
            if (req.body.kh_loai === 2) {
                filter.kh_id_dg = null
                filter.kh_id_kt = req.body.kh_id_kt
            }
            if (req.body.kh_loai === 3) {
                filter.kh_id_dg = req.body.kh_id_dg
                filter.kh_id_kt = req.body.kh_id_kt
            }
            const updateItem = await KhDanhGia.updateOne({ kh_id }, filter, { new: true })
            return functions.success(res, 'successfully', { data: updateItem })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Error', 500)
        }
    }
    // bang nhan vien thuc hien danh gia gom : ten. id phong ban, id chuc vu  
exports.nhanVienKH = async(req, res, next) => {
        try {
            const result = {}
            const kh_id = req.body.kh_id

            const option = {
                    kh_user_nv: 1
                }
                // lay chuoi chua cac id nhan vien lam danh gia
            const stringNv = await KhDanhGia.findOne({ kh_id }, option)
            const arrayNv = stringNv.kh_user_nv.split(',')
            const filter = {
                    _id: 1,
                    userName: 1,
                    'inForPerson.employee.com_id': 1,
                    'inForPerson.employee.dep_id': 1,
                    'inForPerson.employee.position_id': 1
                }
                // result.com_id = 0
            result.userArray = []

            const elementArr = { checkbox: false }

            for (let index = 0; index < arrayNv.length; index++) {
                const itemArray = await Users.findOne({ _id: Number(arrayNv[index]) }, filter)
                result.com_id = itemArray.inForPerson.employee.com_id
                elementArr.itemArray = itemArray
                elementArr.checkbox = true
                result.userArray.push(elementArr)
            }


            return functions.success(res, 'successfully', { data: result })
        } catch (error) {
            console.log(error)
            return functions.setError(res, "Internal server", 500)
        }
    }
    ///show al phong ban
exports.showAllPhongBan = async(req, res, next) => {
        try {
            const result = {}
            const filter = ['dep_id', 'com_id', 'dep_name']
            const type = req.user.data.type
            const com_id = (type === 1) ? req.user.data.idQLC : req.user.data.com_id

            const depArray = await QlCDep.find({ com_id }, filter)
            result.depArray = depArray
            return functions.success(res, 'Successfully', { data: result })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal error', 500)
        }
    }
    // show bang nhan vien
exports.showAllNhanvien = async(req, res, next) => {
    try {
        const result = {}

        /// indexing USers qlc_department
        Users.createIndexes[{ "_id": 1 }, { 'inForPerson.employee.com_id': 1 }, { 'inForPerson.employee.dep_id': 1 }, { 'inForPerson.employee.position_id': 1 }]
        QlCDep.createIndexes[{ "dep_id": 1 }, { "com_id": 1 }, { "dep_id": 1 }]
        DescPosition.createIndexes[{ "dep_id": 1 }, { "com_id": 1 }, { "positionIdid": 1 }]


        /// option field 
        const option = {
            _id: 1,
            userName: 1,
            'inForPerson.employee.com_id': 1,
            'inForPerson.employee.dep_id': 1,
            'inForPerson.employee.position_id': 1
        }
        const type = req.user.data.type
        const com_id = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
        const filter = {
            'inForPerson.employee.com_id': com_id
        }
        const dep_id = req.query.dep_id
        if (dep_id) filter['inForPerson.employee.dep_id'] = dep_id
        const _id = req.query.id
        if (_id) filter._id = _id


        const arrayNv = await Users.find(filter, option)
        result.arrayResult = []

        for (let index = 0; index < arrayNv.length; index++) {
            const element = arrayNv[index];
            const objDep = {}
                /// get name nv
            objDep.nameNv = element.userName
                /// get name dep by dep_id
            objDep.nameDep = await QlCDep.findOne({
                    dep_id: element.inForPerson.employee.dep_id,
                    com_id
                }, { dep_name: 1 })
                /// get position by position id
            objDep.namePosi = await DescPosition.findOne({
                positionId: element.inForPerson.employee.position_id,
                com_id
            }, { description: 1 })
            result.arrayResult.push(objDep)
        }

        console.log(_id, dep_id)
        return functions.success(res, 'successfully', { data: result })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal error', 500)
    }
}

/// validate them moi ke hoach
exports.validateThemMoi1 = async(req, res, next) => {
        try {
            const body = req.body
            const kh_ten = body.kh_ten
            const kh_ngaybatdau = body.kh_ngaybatdau
            const kh_ngayketthuc = body.kh_ngayketthuc
            const kh_giobatdau = body.kh_giobatdau
            const kh_gioketthuc = body.kh_gioketthuc

            if (!kh_ten || !kh_ngaybatdau || !kh_ngayketthuc || !kh_giobatdau || !kh_gioketthuc) return res.json({ error: "Invalid Input" })
            else return res.json({ ok: "next" })
        } catch (error) {
            console.log(error)
            return functions.setError(res, "Internal Server", 500)
        }
    }
    /// validate chon de
exports.validateThemMoi2 = async(req, res, next) => {
        try {


            const kh_loai = Number(req.body.kh_loai)

            if (kh_loai === 1) {
                const kh_id_dg = req.body.kh_id_dg
                if (!kh_id_dg) return res.json({ Error: "Invalid Input" })
                else return res.json({ ok: "next" })
            } else if (kh_loai === 2) {
                const kh_id_kt = req.body.kh_id_kt
                if (!kh_id_kt) return res.json({ Error: "Invalid Input" })
                else return res.json({ ok: "next" })
            } else {
                const kh_id_dg = req.body.kh_id_dg
                const kh_id_kt = req.body.kh_id_kt
                if (!kh_id_dg || !kh_id_kt) return res.json({ Error: "Invalid Input" })
                else return res.json({ ok: "next" })
            }
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // validate chon nhan vien va nguoi danh gia
exports.validateThemMoi3 = async(req, res, next) => {
        try {
            const kh_user_nv = req.body.kh_user_nv
            const kh_user_dg = req.body.kh_user_dg

            if (!kh_user_dg || !kh_user_nv) return res.json({ Error: "Invalid Input" })
            else return res.json({ ok: "next" })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal Server', 500)
        }
    }
    // validate chon phon ban danh gia
    // show nhan vien gom id_phongban id_chuc vu
    // exports.showTableNV = async (req,res,next) =>{
    //     try{

//     }
//     catch(){

//     }
// }
// exports.addNhanVien = async (req,res,next) =>{
//     try{

//     }
//     catch(error){
//         return functions.setError(res,)
//     }
// }