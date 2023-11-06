const functions = require('../../services/functions')
const Users = require('../../models/Users')
const SettingWifi = require('../../models/qlc/SettingWifi')
const SettingTrackingQR = require('../../models/qlc/SettingTrackingQR')
const qrcode = require('qrcode')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

// danh sách
exports.list = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    if (com_id) {
      const conditions = { id_com: com_id }
      const { id_loc } = req.body
      if (id_loc) conditions.id_loc = id_loc
      const pageNumber = Number(req.body.pageNumber) || 1
      const pageSize = Number(req.body.pageSize) || 50
      const data = await SettingWifi.aggregate([
        {
          $match: conditions,
        },
        { $skip: (pageNumber - 1) * pageSize },
        { $limit: pageSize },
        {
          $lookup: {
            from: 'QLC_Location',
            localField: 'id_loc',
            foreignField: 'cor_id',
            pipeline: [
              {
                $match: {
                  id_com: com_id,
                },
              },
            ],
            as: 'location',
          },
        },
        { $unwind: { path: '$location', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            id: 1,
            id_com: 1,
            ip_access: 1,
            name_wifi: 1,
            id_loc: 1,
            cor_location_name: '$location.cor_location_name',
            cor_lat: '$location.cor_lat',
            cor_long: '$location.cor_long',
            cor_radius: '$location.cor_radius',
          },
        },
      ])
      const total = await SettingWifi.countDocuments(conditions)
      return functions.success(res, 'Danh sách wifi', { total, data })
    }
    return functions.setError(res, 'Thiếu thông tin')
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}

// tạo wifi mới
exports.create = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    if (type === 1 || isAdmin) {
      const { ip_access, name_wifi, id_loc } = req.body
      if (com_id && ip_access && name_wifi && id_loc) {
        const foundGateway = await SettingWifi.findOne({
          ip_access: ip_access,
          id_loc: id_loc,
          id_com: com_id,
        })
        if (foundGateway) return functions.setError(res, 'Bản ghi đã tồn tại')
        const maxId =
          (await SettingWifi.findOne(
            {},
            { id: 1 },
            { sort: { id: -1 } }
          ).lean()) || 0
        const id = Number(maxId.id) + 1 || 1
        const newData = new SettingWifi({
          id: id,
          id_com: com_id,
          ip_access: ip_access,
          name_wifi: name_wifi,
          id_loc: id_loc,
          created_time: functions.getTimeNow(),
          update_time: functions.getTimeNow(),
        })
        await newData.save()
        return functions.success(res, 'Thêm thành công', { data: newData })
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không có quyền')
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}
//sửa
exports.update = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    if (type === 1 || isAdmin) {
      const { id, ip_access, name_wifi, id_loc } = req.body
      if (com_id && id) {
        const foundGateway = await SettingWifi.findOne({ id: id })
        if (!foundGateway)
          return functions.setError(res, 'Bản ghi không tồn tại')
        const findSettingWifi = await SettingWifi.findOne({
          id: { $ne: id },
          ip_access: ip_access || foundGateway.ip_access,
          id_loc: id_loc || foundGateway.id_loc,
        })
        if (findSettingWifi)
          return functions.setError(res, 'Địa chỉ IP trong vị trí đã tồn tại')
        await SettingWifi.updateOne(
          {
            id: id,
          },
          {
            name_wifi: name_wifi || foundGateway.name_wifi,
            ip_access: ip_access || foundGateway.ip_access,
            id_loc: id_loc || foundGateway.id_loc,
          }
        )
        return functions.success(res, 'Sửa thành công')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không có quyền')
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}

// xóa
exports.delete = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    if (type === 1 || isAdmin) {
      const { id } = req.body
      if (com_id && id) {
        const foundGateway = await SettingWifi.findOne({ id: id })
        if (!foundGateway)
          return functions.setError(res, 'Bản ghi không tồn tại')
        await SettingWifi.deleteOne({ id: id })
        return functions.success(res, 'Xóa thành công')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không có quyền')
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}
