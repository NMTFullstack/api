const functions = require('../../../services/functions')
const DanhSachCH = require('../../../models/DanhGiaNangLuc/DanhSachCauHoi')


// filter + render item

exports.listQues = async(req, res, next) => {
    try {
        /// lay id cong ty
        const type = req.user.data.type



        const filter = { trangthai_xoa: 1 }
        if (type === 1) {
            filter.id_congty = req.user.data.idQLC
        } else {
            filter.id_congty = req.user.data.com_id
        }
        const result = { hienThi: 5, skipped: 0 }
            // req dk filter
        const id = req.body.id
        const loai = req.body.loai
        const hinhthuc = req.body.hinhthuc
        if (id) filter.id = id
        if (loai) filter.loai = loai
        if (hinhthuc) filter.hinhthuc = hinhthuc

        // phan trang
        const hienThi = req.body.hienThi
        const skipped = req.body.skipped
        if (hienThi) result.hienThi = hienThi
        if (skipped) result.skipped = result.hienThi * Number(skipped)

        // dem ban ghi
        const countItem = await DanhSachCH.find(filter).countDocuments()
        if (countItem === 0) return functions.setError(res, 'Not found data', 404)
            // filter render
        const arrayResult = await DanhSachCH.find(filter).skip(result.skipped).limit(result.hienThi)


        result.countItem = countItem
        result.arrayResult = arrayResult

        return functions.success(res, 'successfully', { data: result })
    } catch (error) {
        return functions.setError(res, 'Internal Error', 500)
    }
}

// search theo ten 
exports.searchCH = async(req, res, next) => {
    try {
        const filter = { trangthai_xoa: 1 }
        const id = req.body.id
        const option = [
            'id',
            'cauhoi'
        ]
        if (id) filter.id = id
        const result = await DanhSachCH.find(filter, option).sort({ id: -1 }).limit(12)
        return functions.success(res, 'successfully', { data: result })
    } catch (error) {
        return functions.setError(res, 'Internal Error', 500)
    }
}

// add Quess

exports.addQues = async(req, res, next) => {
    try {

        const type = req.user.data.type
        const id_congty = (type === 1) ? req.user.data.idQLC : req.user.data.com_id
        const id = await DanhSachCH.countDocuments({ id_congty }, { id }) + 1
        const cauhoi = req.body.hinhthuc
        const hinhthuc = req.body.hinhthuc
        const loai = req.body.loai
        const sodiem = req.body.sodiem
        const thoigian_thuchien = req.body.thoigian_thuchien
        const img_cauhoi = req.body.img_cauhoi
        const dap_an = req.body.dap_an
        const created_at = functions.getTimeNow()
        if (!cauhoi || !hinhthuc || !loai || !sodiem || !thoigian_thuchien || !dap_an)
            return functions.setError(res, 'Error input', 400)
        const filter = {
            id,
            cauhoi,
            hinhthuc,
            loai,
            sodiem,
            thoigian_thuchien,
            img_cauhoi,
            id_congty,
            dap_an,
            nguoi_capnhat: req.user.data.idQLC,
            trangthai_xoa: 1,
            congty_or_nv: type,
            created_at,
            updated_at: null
        }
        const addOb = await (
            new DanhSachCH(filter)
        ).save()

        return functions.success(res, 'successfully', { data: addOb })
    } catch (error) {
        return functions.setError(res, 'Internal server', 500)
    }
}

// chi tiet cauhoi
exports.detailQues = async(req, res, next) => {
    try {
        const id = req.params.id
        console.log(id)
        const result = await DanhSachCH.aggregate(
            [

                {
                    $match: { id: Number(id) }

                },
                {
                    $lookup: {
                        from: "DGNL_LoaiCauHoi",
                        localField: "loai",
                        foreignField: "id",
                        as: "deCh"
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

// chinh sua danh sach cau hoi 

exports.changeQues = async(req, res, next) => {
        try {
            const result = {}

            const id = req.body.id
            const hinhthuc = req.body.hinhthuc
            const loai = req.body.loai
            const sodiem = req.body.sodiem
            const thoigian_thuchien = req.body.thoigian_thuchien
            const cauhoi = req.body.cauhoi
            const dap_an = req.body.dap_an
            const img_cauhoi = req.body.img_cauhoi
            const updated_at = functions.getTimeNow()

            if (!hinhthuc || !loai || !sodiem || !thoigian_thuchien || !cauhoi || !dap_an || !created_at)
                return functions.setError(res, 'Error input', 400)
            const filter = {
                hinhthuc,
                loai,
                sodiem,
                thoigian_thuchien,
                cauhoi,
                dap_an,
                img_cauhoi,
                updated_at
            }
            result.arrayResult = await DanhSachCH.updateOne({ id }, filter, {
                new: true
            })
            return functions.success(res, 'successfully', {
                data: result
            })
        } catch (error) {
            console.log(error)
            return functions.setError(res, 'Internal server', 500)
        }
    }
    // xoas du lieu
exports.deleteQues = async(req, res, next) => {
    try {
        const result = {}
        const id = req.params.id

        result.arrayResult = await DanhSachCH.updateOne({ id }, { trangthai_xoa: 2 }, {
            new: true
        })
        return functions.success(res, 'successfully', {
            data: result
        })
    } catch (error) {
        return functions.setError(res, 'Internal error', 500)
    }
}

/// api luu anh vao storage

exports.uploadMutiple = async(req, res, next) => {
    const { files } = req;
    if (!files || files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }
    return res.send('Files uploaded successfully.');
}