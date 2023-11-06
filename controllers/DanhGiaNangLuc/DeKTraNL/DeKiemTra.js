const functions = require('../../../services/functions')
const DeKiemTraCauHoi = require('../../../models/DanhGiaNangLuc/DeKiemTraCauHoi')
const DanhSachCauHoi = require('../../../models/DanhGiaNangLuc/DanhSachCauHoi')


// search and filter de kiem tra
exports.searchDeKT = async(req, res, next) => {
        try {
            const filter = { is_delete: 1 }
            const result = { hienThi: 5, skipped: 0 }

            /// lay id cong ty
            const type = req.user.data.type


            if (type === 1) {
                filter.id_congty = req.user.data.idQLC
            } else {
                filter.id_congty = req.user.data.com_id
            }

            const kt_loai = req.body.kt_loai
            const ten_de_kiemtra = req.body.ten_de_kiemtra
            if (kt_loai) filter.kt_loai = kt_loai
            if (ten_de_kiemtra) filter.ten_de_kiemtra = ten_de_kiemtra

            // phan trang
            const hienThi = req.body.hienThi
            const skipped = req.body.skipped
            if (hienThi) result.hienThi = hienThi
            if (skipped) result.skipped = result.hienThi * Number(skipped)

            // dem ban ghi
            const countItem = await DeKiemTraCauHoi.find(filter).countDocuments()
            if (countItem === 0) return functions.setError(res, 'Not found data', 404)

            const arrayResult = await DeKiemTraCauHoi.find(filter).skip(result.skipped).limit(result.hienThi)

            result.countItem = countItem
            result.arrayResult = arrayResult


            return functions.success(res, 'successfully', {
                new: result
            })
        } catch (error) {
            return functions.setError(res, 'Internal Error', 500)
        }
    }
    // show ten de ktra
exports.listDeKT = async(req, res, next) => {
    try {
        /// lay id cong ty
        const type = req.user.data.type
        const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
        const filter = { is_delete: 1, id_congty }
        const ten_de_kiemtra = req.query.ten_de_kiemtra
        const option = [
            'id',
            'ten_de_kiemtra'
        ]
        if (ten_de_kiemtra) filter.ten_de_kiemtra = ten_de_kiemtra
        const result = await DeKiemTraCauHoi.find(filter, option).sort({ id: -1 }).limit(12)
        if (result.length === 0) return functions.setError(res, 'Not Found Data', 404)
        return functions.success(res, 'successfully', { data: result })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Error', 500)
    }
}

// Des Item

exports.desDeKT = async(req, res, next) => {
    try {
        const result = {}
        const filter = { is_delete: 1 }

        const option = [
            'id', 'kt_loai', 'ten_de_kiemtra', 'nguoitao', 'ngaytao', 'ch_thangdiem',
            'danhsach_cauhoi', 'ghichu', 'phanloai_macdinh', 'phanloaikhac'
        ]
        const id = req.params.id
        console.log(id)
        if (id) filter.id = id

        result.arrayResult = await DeKiemTraCauHoi.findOne(filter, option)
        return functions.success(res, 'successfully', {
            data: result
        })

    } catch (error) {
        return functions.setError(res, 'Internal Error', 500)
    }
}

/// them de kiem tra

exports.addDeKT = async(req, res, next) => {
    try {

        const result = {}
        const id = await DeKiemTraCauHoi.countDocuments() + 1
        const hinhthuc_taode = req.body.hinhthuc_taode
        const kt_loai = req.body.kt_loai
        const ten_de_kiemtra = req.body.ten_de_kiemtra
        const ch_thangdiem = req.body.ch_thangdiem
        const nguoitao = req.body.nguoitao
        const ngaytao = functions.getTimeNow()
        const ghichu = req.body.ghichu
        const updated_at = functions.getTimeNow()
        const danhsach_cauhoi = req.body.danhsach_cauhoi
        var phanloai_macdinh = '[["0","3","1"],["4","6","2"],["7","8","3"],["9","10","4"]]'
        var phanloaikhac = null
            /// lay id cong ty
        const type = req.user.data.type
        const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
        const checkThietLap = req.body.checkThietLap
        if (checkThietLap === 2) {
            phanloai_macdinh = null
            phanloaikhac = req.body.phanloaikhac
        }
        const filter = {
            id,
            hinhthuc_taode,
            kt_loai,
            ten_de_kiemtra,
            ch_thangdiem,
            nguoitao,
            ngaytao,
            ghichu,
            danhsach_cauhoi,
            phanloai_macdinh,
            phanloaikhac,
            id_congty
        }
        const updateItem = await (
            new DeKiemTraCauHoi(filter)
        ).save()
        result.updateItem = updateItem
        return functions.success(res, 'successfully', {
            data: result
        })
    } catch (error) {
        return functions.setError(res, 'Internal Error', 500)
    }
}


/// lay cac cau hoi theo loai trong muc tu sinh de kiem tra

exports.sinhDeTuDong = async(req, res, next) => {
    try {
        const stringLoai = req.query.stringLoai
        console.log(stringLoai)
        const delimiter = ','
        const arrayLoai = stringLoai.split(delimiter)
        const option = [
            'id', 'loai', 'cauhoi', 'sodiem'
        ]
        const result = {}
        var arrayResult = []
        for (let index = 0; index < arrayLoai.length; index++) {

            const arrayI = await DanhSachCauHoi.find({ loai: Number(arrayLoai[index]) }, option)
            arrayResult = [...arrayResult, ...arrayI]

        }
        result.arrayResult = arrayResult
        return functions.success(res, 'succesfully', {
            data: result
        })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Error', 500)
    }
}

// chinh sua de kiem tra

exports.repairDeKT = async(req, res, next) => {
    try {
        const result = {}
        const id = req.body.id

        const ten_de_kiemtra = req.body.ten_de_kiemtra
        const ghichu = req.body.ghichu
        const updated_at = functions.getTimeNow()

        const updateItem = await DeKiemTraCauHoi.updateOne({ id }, {
            ten_de_kiemtra,
            updated_at,
            ghichu
        }, {
            new: true
        })
        result.updateItem = updateItem
        return functions.success(res, 'successfully', {
            data: result
        })
    } catch (error) {
        return
    }

}

// xoa de kiem tra

exports.xoaDeKT = async(req, res, next) => {
    try {
        const result = {}
        const id = req.body.id

        result.xoaDeKT = await DeKiemTraCauHoi.updateOne({ id }, { is_delete: 2 }, { new: true })

        return functions.success(res, 'successfully', {
            data: result
        })
    } catch (error) {
        return functions.setError(res, 'Internal Error', 500)
    }
}