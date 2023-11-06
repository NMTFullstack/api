const functions = require('../../../services/functions')
const TblTieuChi = require('../../../models/DanhGiaNangLuc/TblTieuChi')
const DeDanhGia = require('../../../models/DanhGiaNangLuc/DeDanhGia')



// them moi de danh gia
exports.addDe = async(req, res, next) => {
    try {
        const type = req.user.data.type

        const tokenData = { id_congty: 0 }; // Define usc_id as needed
        if (type === 1) {
            tokenData.id_congty = req.user.data.idQLC
        } else {
            tokenData.id_congty = req.user.data.com_id
        }
        //Guarding clause
        // if (!req.user || !req.user.data || !req.user.data.idQLC)
        //     return functions.setError(res, "Không có thông tin tài khoản", 400);
        // let usc_id = req.user.data.idQLC;
        const now = functions.getTimeNow()
        const dg_capnhat = functions.convertDate(now)
        let dg_id = Number(await DeDanhGia.countDocuments()) + 1
        let dg_ten = req.body.dg_ten
        if (!dg_ten) return functions.setError(res, 'Missing Information')
        let dg_nguoitao = req.user.data.idQLC
        const dg_ngaytao = now
        let dg_thangdiem_id = req.body.dg_thangdiem_id
        let dg_ghichu = req.body.dg_ghichu

        /// xet phan loai mac dinh 
        var dg_loai_macdinh = req.body.dg_loai_macdinh
        var dg_phanloaikhac = null
        const dg_id_tieuchi = req.body.dg_id_tieuchi
        if (!dg_id_tieuchi) return functions.setError(res, 'Select a least Title')
        const checkThietLap = req.body.checkThietLap
        if (checkThietLap === 2) {
            dg_loai_macdinh = null
            dg_phanloaikhac = req.body.dg_phanloaikhac
        }

        const dataResult = await (new DeDanhGia({
            dg_id,
            dg_ten,
            dg_nguoitao,
            dg_ngaytao,
            dg_thangdiem_id,
            dg_ghichu,
            dg_loai_macdinh,
            dg_phanloaikhac,
            dg_id_tieuchi,
            dg_capnhat,
            id_congty: tokenData.id_congty,
            trangthai_xoa: 1,
        })).save()

        return functions.success(res, 'sucessful', {
            data: dataResult
        })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Them khong thanh cong', 400)
    }
}


/// show danh sach de danh gia nang luc (default 10 latest records) and search
exports.listDeDG = async(req, res, next) => {
    try {
        const dg_id = req.query.dg_id
        const filter = { trangthai_xoa: 1 }
        const hienThi = req.query.hienThi || 5;
        var skipped = 0;
        if (req.query.skipped) {
            skipped = Number(req.query.skipped) * hienThi
        }
        if (dg_id) {
            filter.dg_id = dg_id
        }
        const option = [
            'dg_id',
            'dg_ten',
            'dg_nguoitao',
            'dg_capnhat',
            'dg_ghichu'
        ]
        const result = await DeDanhGia.find(filter, option).skip(skipped).limit(hienThi);


        return functions.success(res, 'sucessfully', {
            data: result
        })
    } catch (error) {
        return functions.setError(res, 'internall server', 500)
    }
}

// list name thanh search de danh gia theo ten

exports.listNameDe = async(req, res, next) => {
    try {
        const result = {}
        const type = req.user.data.type
        const id_congty = (type === 1) ? (req.user.data.idQLC) : (req.user.data.com_id)
        const option = [
            'dg_id',
            'dg_ten'
        ]
        const nameDeDG = await DeDanhGia.find(id_congty, option)
        if (nameDeDG) result.nameDeDG = nameDeDG
        return functions.success(res, 'sucessfully', {
            data: result
        })
    } catch (error) {
        return functions.setError(res, 'internall server', 500)
    }
}

// Chinh sua

exports.changeDeDG = async(req, res, next) => {
        try {
            const id = req.params.id
            const result = {}
            const filter = {}
            const dg_ten = req.body.dg_ten
            if (!dg_ten) return functions.setError(res, 'Missing Information')
            const dg_ghichu = req.body.dg_ghichu
            var dg_loai_macdinh = req.body.dg_loai_macdinh
            var dg_phanloaikhac = null
            const dg_id_tieuchi = req.body.dg_id_tieuchi
            if (!dg_id_tieuchi) return functions.setError(res, 'Select a least Title')
            const checkThietLap = req.body.checkThietLap
            if (checkThietLap === 2) {
                dg_loai_macdinh = null
                dg_phanloaikhac = req.body.dg_phanloaikhac
            }

            const arrayResult = await DeDanhGia.updateOne({ dg_id: id }, {
                dg_ten,
                dg_ghichu,
                dg_loai_macdinh,
                dg_phanloaikhac,
                dg_id_tieuchi
            }, {
                new: true
            })
            if (arrayResult) result.arrayResult = arrayResult
            return functions.success(res, 'sucessfully repaired', {
                data: result
            })
        } catch (error) {
            return functions.setError(res, 'internall server', 500)
        }
    }
    // chi tiet
exports.desDeDG = async(req, res) => {

        try {
            let id = req.params.id
            const ThongTin = await DeDanhGia.findOne({ id }).lean()
            if (ThongTin === null) {
                return functions.setError(res, 'Not Found', 404)
            } else return functions.success(res, 'Show information', { data: ThongTin })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Not Found', 404)
        }
    }
    //xoa
exports.XoaDe = async(req, res) => {
    try {
        const id = req.query.id
        const deleteItem = await TblTieuChi.updateOne({ id }, { trangthai_xoa: 2 }, {
            new: true
        })
        if (!deleteItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        return functions.success(res, 'successfully deleted', {
            data: deleteItem
        })
    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Server Error', 500)
    }
}