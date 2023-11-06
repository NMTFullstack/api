const TblThangDiem = require('../../../models/DanhGiaNangLuc/TblThangDiem')
const DanhGia = require('../../../models/DanhGiaNangLuc/DeDanhGia')
const functions = require('../../../services/functions')
const Tool = require('./Tool')
const { findOne } = require('../../../models/Users')
const PhanQuyen = require('../../../models/DanhGiaNangLuc/TblPhanQuyen')
const TblPhanQuyen = require('../../../models/DanhGiaNangLuc/TblPhanQuyen')


// Api lay thang diem da tao dua vao com_id

exports.renderItem = async(req, res, next) => {
    try {
        const type = req.user.data.type

        const tokenData = { id_congty: 0 }; // Define usc_id as needed
        if (type === 1) {
            tokenData.id_congty = req.user.data.idQLC
        } else {
            tokenData.id_congty = req.user.data.com_id
        }


        const checkTd = Number(req.body.thangDiem)


        const option = {
            id: 1,
            thangdiem: 1,
            phanloai: 1,
            id_congty: 1
        }

        const ThangDiem = { query: 10 }
        if (checkTd) ThangDiem.query = checkTd

        const result = await TblThangDiem.findOne({ id_congty: tokenData.id_congty, thangdiem: ThangDiem.query }, option)


        // Nếu tìm thấy thang điểm trong database
        if (result) {

            const element = result.phanloai;
            const updateDay = functions.getTimeNow()
            if (element === null) return functions.success(res, 'Setting point', { data: result }) // chưa phân loại
            else {
                const changeData = {}
                changeData.array = Tool.ArrayPhanLoai(element)
                changeData.id_congty = result.id_congty
                changeData.thangdiem = result.thangdiem
                const capnhat = await TblThangDiem.updateOne({ id_congty: changeData.id_congty, thangdiem: changeData.thangdiem }, { update_at: updateDay }, { new: true })
                return functions.success(res, 'successfully updated', { data: capnhat })
            }
        } // Nếu không tìm thấy thì lưu thang điểm mới    
        else {
            const id = Number(await TblThangDiem.countDocuments()) + 1
            const update_at = functions.getTimeNow()
            const dataSave = await (
                new TblThangDiem({
                    id,
                    id_congty: tokenData.id_congty,
                    thangdiem: ThangDiem.query,
                    update_at
                })
            ).save()
            return functions.success(res, 'successfully', { data: dataSave })

        }

    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Server', 500)
    }
}

//// them phân loại đánh giá.
exports.addPhanLoai = async(req, res, next) => {
    try {
        const reqbody = req.body

        const arrayPl = reqbody.arrayPl
        const id = reqbody.id
        const thangdiem = Number(reqbody.thangdiem)
        const result = { checked: false }
        if (arrayPl) {
            const arrayFake = Tool.ArrayPhanLoai(arrayPl)
            const numlength = arrayFake.length
            if ((arrayFake[numlength - 1][1] !== thangdiem) || arrayFake[0][0] !== 0) result.checked = true
            else {
                for (let index = 1; index < arrayFake.length; index++) {
                    if (arrayFake[index][0] !== arrayFake[index - 1][1]) result.checked = true
                }

            }
            if (result.checked) return res.json({ error: 'Invalid input' })
            else {

                result.itemSave = await TblThangDiem.updateOne({ id }, { phanloai: arrayPl }, { new: true })
                return functions.success(res, 'successfully', { data: result })
            }
        } else {
            return res.json({ error: 'Invalid input' })
        }

    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Server', 500)
    }
}

// lay ra thang diem can set 

exports.ThangDiem = async(req, res, next) => {
    try {
        const type = req.user.data.type

        const tokenData = { id_congty: 0 }; // Define usc_id as needed
        if (type === 1) {
            tokenData.id_congty = req.user.data.idQLC
        } else {
            tokenData.id_congty = req.user.data.com_id
        }

        const result = await TblThangDiem.find({ id_congty: tokenData.id_congty }, { id: 1, thangdiem: 1, phanloai: 1 }).sort({ update_at: -1 }).limit(1)

        return functions.success(res, 'Successfully', { data: result })

    } catch (error) {
        console.log(error)
        return functions.setError(res, 'Internal Server', 500)
    }
}