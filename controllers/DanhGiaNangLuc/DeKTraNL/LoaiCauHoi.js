const functions = require('../../../services/functions')
const LoaiCauHoi = require('../../../models/DanhGiaNangLuc/LoaiCauHoi')


exports.listTypeQues = async(req, res, next) => {
    try {
        const scrpitQery = { hienThi: 5, skipped: 0 }
        const result = {}
        const ten_loai = req.body.ten_loai
        const hienThi = req.body.hienThi
        const skipped = req.body.skipped


        // phan trang 
        if (hienThi) scrpitQery.hienThi = hienThi
        if (skipped) scrpitQery.skipped = Number(skipped) * result.hienThi
        result.scrpitQery = scrpitQery

        const filter = { trangthai_xoa: 1 }
        if (ten_loai) filter.ten_loai = ten_loai
            /// lay id cong ty
        const type = req.user.data.type


        if (type === 1) {
            filter.id_congty = req.user.data.idQLC
        } else {
            filter.id_congty = req.user.data.com_id
        }
        const option = [
            'id',
            'ten_loai',
            'nguoitao',
            'create_at',
            'ghichu'
        ]

        // loc theo search lay cac ban ghi moi nhat
        const arrayResult = await LoaiCauHoi.find(filter, option).sort({ id: -1 }).skip(scrpitQery.skipped).limit(scrpitQery.hienThi)



        if (arrayResult) {
            result.arrayResult = arrayResult

            // dem ban ghi 
            const countItem = await LoaiCauHoi.find(filter, option).countDocuments()
            if (countItem) scrpitQery.countItem = countItem
        }

        return functions.success(res, 'sucessfully', {
            data: result
        })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'internall server', 500)
    }
}

// xoa 
exports.deleteItem = async(req, res, next) => {
        try {
            const result = {}

            const id = req.query.id

            // detail
            const deleteresult = await LoaiCauHoi.updateOne({ id }, { trangthai_xoa: 2 }, {
                new: true
            })
            if (deleteresult) result.deleteresult = deleteresult
            return functions.success(res, 'successfully', {
                data: result
            })

        } catch (error) {
            return functions.setError(res, 'intenalll server')
        }
    }
    // Them moi 
exports.addItem = async(req, res, next) => {
    try {
        //Guarding clause
        // if (!req.user || !req.user.data || !req.user.data.idQLC)
        //     return functions.setError(res, "Không có thông tin tài khoản", 400);
        // let usc_id = req.user.data.idQLC;
        const result = {}

        const id = await LoaiCauHoi.countDocuments()
        const ten_loai = req.body.ten_loai || null
        const created_at = functions.getTimeNow()
        const ghichu = req.body.ghichu
        if (ten_loai) {
            const filter = {
                id,
                ten_loai,
                created_at,
                ghichu

            }
            const array = await (
                new LoaiCauHoi(filter)
            ).save()
            return functions.success(res, 'successfully', { data: array })
        }
        return functions.setError(res, 'error input', 400)
    } catch (error) {
        return functions.setError(res, 'Internal server', 500)
    }
}

// Chinh sua

exports.changeItem = async(req, res, next) => {
        try {
            const result = {}
            const id = req.body.id
            const ten_loai = req.body.ten_loai
            const ghichu = req.body.ghichu
            if (ten_loai) {
                const item = await LoaiCauHoi.updateOne({ id }, { ten_loai, ghichu })
                return functions.success(res, 'successfully', { data: item })
            }

            return functions.setError(res, 'error input', 400)
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Iternal server', 500)
        }
    }
    // search theo ten_loai
exports.searchLoai = async(req, res, next) => {
    try {
        const filter = { trangthai_xoa: 1 }
        const ten_loai = req.query.ten_loai
        const option = [
            'id',
            'ten_loai'
        ]
        if (ten_loai) filter.ten_loai = ten_loai
        const result = await LoaiCauHoi.find(filter).sort({ id: -1 }).limit(12)
        return functions.success(res, 'successfully', { data: result })
    } catch (error) {
        return functions.setError(res, 'Internal Error', 500)
    }
}