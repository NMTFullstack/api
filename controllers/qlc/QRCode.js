const functions = require('../../services/functions')
const Users = require('../../models/Users')
const QRCode = require('../../models/qlc/QRCode')
const SettingTrackingQR = require('../../models/qlc/SettingTrackingQR')
const SettingWifi = require('../../models/qlc/SettingWifi')
const Location = require('../../models/qlc/Location')
const qrcode = require('qrcode')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()
const CC365_Cycle = require('../../models/qlc/Cycle')
const Shifts = require('../../models/qlc/Shifts')
const TrackingQR = require('../../models/qlc/TrackingQR')

const TimeSheets = require('../../models/qlc/TimeSheets')
const Tracking = TimeSheets

const fs = require('fs')
// const Jimp = require('jimp');
// const pngjs = require('pngjs')
// const QrCodeReader = require('qrcode-reader');
const axios = require('axios')

const toRadians = (degrees) => {
  return (degrees * Math.PI) / 180
}
// tính khoảng cách
const calculateDistanceToCenter = (
  latitude,
  longtitude,
  centerLatitude,
  centerLongtitude
) => {
  // Chuyển đổi vị độ từ độ sang radian

  latitude = toRadians(latitude)
  longtitude = toRadians(longtitude)
  centerLatitude = toRadians(centerLatitude)
  centerLongtitude = toRadians(centerLongtitude)

  // Tính chênh lệch giữa các kinh độ và vĩ độ
  var dlatitude = latitude - centerLatitude
  var dlongtitude = longtitude - centerLongtitude

  // Áp dụng công thức haversine
  var a =
    Math.sin(dlatitude / 2) * Math.sin(dlatitude / 2) +
    Math.cos(latitude) *
      Math.cos(centerLatitude) *
      Math.sin(dlongtitude / 2) *
      Math.sin(dlongtitude / 2)

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // Bán kính trái đất (đơn vị km)
  var radius = 6371

  // Tính khoảng cách (m)
  var distance = radius * c * 1000

  return distance
}
// lưu QR
const saveImg = (img_url, com_id, inputDate) => {
  let pathnameSplit
  pathnameSplit = __dirname
    .split('/')
    .filter((item) => item !== '')
    .slice(0, -3)
  if (pathnameSplit && pathnameSplit.length === 0)
    pathnameSplit = __dirname
      .split('\\')
      .filter((item) => item !== '')
      .slice(0, -3)
  let pathname =
    '/' + pathnameSplit.join('/') + '/storage/base365/timviec365/QRCode'
  if (!fs.existsSync(pathname)) {
    fs.mkdirSync(pathname)
  }
  // pathname = pathnameSplit.join('/') + '/storage/base365/chamcong/QRCode'
  // if (!fs.existsSync(pathname)) {
  //     fs.mkdirSync(pathname)
  // }
  if (!fs.existsSync(pathname + '/' + com_id)) {
    fs.mkdirSync(pathname + '/' + com_id)
  }

  if (!fs.existsSync(pathname + '/' + com_id)) {
    fs.mkdirSync(pathname + '/' + com_id)
  }

  if (!fs.existsSync(pathname + '/' + com_id)) {
    fs.mkdirSync(pathname + '/' + com_id)
  }
  if (!fs.existsSync(pathname + '/' + com_id)) {
    fs.mkdirSync(pathname + '/' + com_id)
  }

  const date = new Date(inputDate)
  const curDay = date.toLocaleDateString('en-US').replaceAll('/', '-')
  if (!fs.existsSync(pathname + '/' + com_id + '/' + curDay)) {
    fs.mkdirSync(pathname + '/' + com_id + '/' + curDay)
  }

  // write to file
  const image = Buffer.from(img_url.split(',')[1], 'base64')
  const time = date.getTime()

  fs.writeFileSync(
    pathname + '/' + com_id + '/' + curDay + '/' + time + '.png',
    image
  )

  return `https://api.timviec365.vn/timviec365/QRCode/${com_id}/${curDay}/${time}.png`
}

// danh sách ca
const getListShiftEmp = async (id_com, id_use) => {
  try {
    const date = new Date()
    const y = date.getFullYear()
    let m = date.getMonth() + 1
    m = m < 10 ? '0' + m : m
    const dateNow = functions.convertDate(null, true).replaceAll('/', '-')
    const user = await Users.aggregate([
      {
        $match: {
          idQLC: Number(id_use),
          type: 2,
          'inForPerson.employee.com_id': Number(id_com),
          'inForPerson.employee.ep_status': 'Active',
        },
      },
      {
        $project: {
          ep_name: '$userName',
        },
      },
    ])
    if (user.length == 1) {
      const candidate = user[0]
      const db_cycle = await CC365_Cycle.aggregate([
        {
          $lookup: {
            from: 'CC365_EmployeCycle',
            localField: 'cy_id',
            foreignField: 'cy_id',
            as: 'employee_cycle',
          },
        },
        { $unwind: '$employee_cycle' },
        {
          $match: {
            'employee_cycle.ep_id': Number(id_use),
            apply_month: {
              $gte: new Date(`${y}-${m}-01 00:00:00`),
              $lte: new Date(`${dateNow} 23:59:59`),
            },
          },
        },
        {
          $sort: { 'employee_cycle.update_time': -1 },
        },
        { $limit: 1 },
      ])

      let arr_shift_id = ''
      let arr_shift = []
      if (db_cycle.length > 0) {
        const cycle = db_cycle[0]
        const detail_cy = JSON.parse(cycle.cy_detail)
        for (let i = 0; i < detail_cy.length; i++) {
          const element = detail_cy[i]

          if (element.date == dateNow) {
            arr_shift_id = element.shift_id
            break
          }
        }

        let list_shift = []
        if (arr_shift_id != '') {
          list_shift = await Shifts.find({
            shift_id: { $in: arr_shift_id.split(',').map(Number) },
          }).lean()
        }
        let hour = date.getHours(),
          minute = date.getMinutes(),
          second = date.getSeconds()
        hour = hour >= 10 ? hour : `0${hour}`
        minute = minute >= 10 ? minute : `0${minute}`
        second = second >= 10 ? second : `0${second}`
        const hourNow = `${hour}:${minute}:${second}`

        for (let j = 0; j < list_shift.length; j++) {
          const element = list_shift[j]
          if (
            (element.start_time_latest <= hourNow &&
              element.end_time_earliest >= hourNow) ||
            element.start_time_latest == null ||
            element.end_time_earliest == null ||
            element.start_time_latest == '00:00:00' ||
            element.start_time_latest == '00:00:00'
          ) {
            const type = await getDataInOut(id_use, id_com)

            arr_shift.push({
              ...element,
              type: type === 1 ? 'Ca vào' : 'Ca ra',
            })
          }
        }

        return {
          success: true,
          ep_name: candidate.ep_name,
          shift: arr_shift,
          cycle: db_cycle,
        }
      } else {
        return { success: true, ep_name: candidate.ep_name, shift: [] }
      }
    }
    return {
      success: false,
      message: 'Nhân viên không tồn tại hoặc chưa được duyệt',
    }
  } catch (error) {
    console.log(error)
    return { success: false, message: error.message }
  }
}
// lưu data chấm công
const insertTimeKeeping = async (
  com_id,
  idQLC,
  time,
  ts_lat,
  ts_long,
  wifi_ip,
  shift_id,
  img_url,
  device = 'app'
) => {
  try {
    // tìm data xem ca trước là loại gì - vào/ ra
    const timeSheetLatest = await TimeSheets.aggregate([
      {
        $match: {
          ep_id: Number(idQLC),
          ts_com_id: Number(com_id),
        },
      },
      {
        $sort: {
          at_time: -1,
        },
      },
      {
        $limit: 1,
      },
      {
        $project: {
          type: { $ifNull: ['$type', null] },
          at_time: 1,
          ep_id: 1,
          sheet_id: 1,
          shift_id: 1,
        },
      },
    ])
    let type
    if (timeSheetLatest && timeSheetLatest.length > 0) {
      const ts = timeSheetLatest[0]
      const tempType = ts.type

      if (!tempType) {
        type = 1
      } else {
        type = tempType == 1 ? 2 : 1
      }
      // if (tempType)
    } else {
      type = 1
    }

    // lấy max id
    const max = await TimeSheets.findOne({}, { sheet_id: 1 })
      .sort({ sheet_id: -1 })
      .lean()

    // insert
    const item = new TimeSheets({
      sheet_id: Number(max.sheet_id) + 1,
      ep_id: Number(idQLC),
      at_time: time,
      device: device,
      ts_lat: ts_lat,
      ts_long: ts_long,
      wifi_ip: wifi_ip,
      shift_id: shift_id,
      is_success: 1,
      ts_error: '',
      ts_location_name: '',
      note: '',
      ts_com_id: Number(com_id),
      type: type,
    })
    await item.save()

    // save image

    return {
      success: true,
      message: 'Điểm danh thành công',
      data: { data: item },
    }
  } catch (error) {
    console.log(error)

    return {
      success: false,
      message: error.message,
    }
  }
}

// laasy thong tin ca vao ra
const getDataInOut = async (id_use, id_com) => {
  const latestTimeSheetData = await TimeSheets.aggregate([
    {
      $match: {
        ep_id: id_use,
        ts_com_id: id_com,
      },
    },
    {
      $sort: {
        at_time: -1,
      },
    },
    {
      $limit: 1,
    },
    {
      $project: {
        type: { $ifNull: ['$type', null] },
      },
    },
  ])

  let type
  if (latestTimeSheetData && latestTimeSheetData.length > 0) {
    const ts = latestTimeSheetData[0]
    const tempType = ts.type

    if (!tempType) {
      type = 1
    } else {
      type = tempType == 1 ? 2 : 1
    }
    // if (tempType)
  } else {
    type = 1
  }

  return type
}

// tạo mới 1 mã QR
exports.create = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    if (type === 1 || isAdmin) {
      const { QRCodeName } = req.body
      if ((com_id, QRCodeName)) {
        const foundGateway = await QRCode.findOne({
          QRCodeName: QRCodeName,
          comId: com_id,
        })
        if (foundGateway) return functions.setError(res, 'Tên mã QR đã tồn tại')
        const maxId =
          (await QRCode.findOne({}, { id: 1 }, { sort: { id: -1 } }).lean()) ||
          0
        const id = Number(maxId.id) + 1 || 1
        const token = await jwt.sign(
          { com_id, id: id },
          process.env.NODE_SERCET
        )
        const qrCodeUrl = await qrcode.toDataURL(token)
        const imgUrl = saveImg(qrCodeUrl, com_id, new Date())

        const newQrCode = new QRCode({
          id: id,
          comId: com_id,
          QRCodeName: QRCodeName,
          QRCodeUrl: imgUrl,
          QRstatus: 1,
          created_time: functions.getTimeNow(),
          update_time: functions.getTimeNow(),
        })
        await newQrCode.save()
        return functions.success(res, 'Tạo thành công', { data: newQrCode })
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không có quyền')
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}
// danh sách mã QR công ty
exports.listAll = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    if (type === 1 || isAdmin) {
      if (com_id) {
        const QRstatus = Number(req.body.QRstatus)
        const conditions = {
          comId: com_id,
        }
        if (QRstatus) conditions.QRstatus = QRstatus
        const result = await QRCode.find(conditions)
        return functions.success(res, 'Danh sách', { data: result })
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không có quyền')
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}

//
// Tắt/mở sử dụng 1 mã QR, đổi tên
exports.update = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    if (type === 1 || isAdmin) {
      const { id, QRCodeName, QRstatus } = req.body
      if (com_id && id) {
        const foundGateway = await QRCode.findOne({ id: Number(id) })
        if (!foundGateway)
          return functions.setError(res, 'Bản ghi không tồn tại')
        const checkQRCode = await QRCode.findOne({
          id: { $ne: Number(id) },
          QRCodeName: QRCodeName || foundGateway.QRCodeName,
          QRstatus: QRstatus || foundGateway.QRstatus,
          comId: com_id,
        })
        if (checkQRCode) return functions.setError(res, 'Tên mã QR đã tồn tại')
        await QRCode.updateOne(
          {
            id: Number(id),
          },
          {
            QRCodeName: QRCodeName || foundGateway.QRCodeName,
            QRstatus: QRstatus || foundGateway.QRstatus,
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

// xóa mã QR

exports.delete = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    if (type === 1 || isAdmin) {
      const { id } = req.body
      if (com_id && id) {
        const foundGateway = await QRCode.findOne({ id: Number(id) })
        if (!foundGateway)
          return functions.setError(res, 'Bản ghi không tồn tại')
        await QRCode.deleteOne({ id: Number(id) })
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

// tạo cài đặt chấm công bằng QR
exports.SettingTrackingQR = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    const {
      listUsers,
      list_org,
      list_pos,
      list_shifts,
      list_ip,
      list_device,
      QRCode_id,
      location_id,
      name,
    } = req.body
    if (listUsers && !Array.isArray(listUsers)) JSON.parse(listUsers)
    if (list_org && !Array.isArray(list_org)) JSON.parse(list_org)
    if (list_pos && !Array.isArray(list_pos)) JSON.parse(list_pos)
    if (list_shifts && !Array.isArray(list_shifts)) JSON.parse(list_shifts)
    const start_time = new Date(req.body.start_time)
    const end_time = new Date(req.body.end_time)
    if (type === 1 || isAdmin) {
      if ((location_id, QRCode_id, start_time, end_time, name)) {
        if (start_time.getTime() / 1000 > end_time.getTime() / 1000)
          return functions.setError(
            res,
            'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'
          )
        const maxId =
          (await SettingTrackingQR.findOne(
            {},
            { id: 1 },
            { sort: { id: -1 } }
          ).lean()) || 0
        const id = Number(maxId.id) + 1 || 1
        const foundGateway = await SettingTrackingQR.findOne({})
        const newData = new SettingTrackingQR({
          id: id,
          name: name,
          com_id: com_id,
          list_org: list_org,
          list_pos: list_pos,
          list_shifts: list_shifts,
          listUsers: listUsers || [],
          list_ip: list_ip || [],
          list_device: list_device || [],
          QRCode_id: QRCode_id,
          location_id: location_id,
          start_time: start_time,
          end_time: end_time,
        })
        await newData.save()
        return functions.success(res, 'Tạo thành công')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không có quyền')
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

exports.createUserTrackingQR = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    const { listUsers, id } = req.body
    if (listUsers && !Array.isArray(listUsers)) JSON.parse(listUsers)
    if (type === 1 || isAdmin) {
      if (com_id && listUsers && id) {
        const foundGateway = await SettingTrackingQR.findOne({ id: Number(id) })
        if (!foundGateway)
          return functions.setError(res, 'Bản ghi không tồn tại')
        const dataUsers = foundGateway.listUsers
        listUsers.map((e) => {
          if (!dataUsers.includes(e)) dataUsers.push(e)
        })

        await SettingTrackingQR.updateOne(
          {
            id: Number(id),
          },
          {
            $set: {
              listUsers: dataUsers,
            },
          }
        )
        return functions.success(res, 'Thêm thành công')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không có quyền')
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

exports.deleteUserTrackingQR = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    const { listUsers, id } = req.body
    if (listUsers && !Array.isArray(listUsers)) JSON.parse(listUsers)
    if (type === 1 || isAdmin) {
      if (com_id && listUsers && id) {
        const foundGateway = await SettingTrackingQR.findOne({ id: Number(id) })
        if (!foundGateway)
          return functions.setError(res, 'Bản ghi không tồn tại')
        const dataUsers = foundGateway.listUsers
        listUsers.map((e) => {
          if (dataUsers.indexOf(e) !== -1)
            dataUsers.splice(dataUsers.indexOf(e), 1)
        })
        await SettingTrackingQR.updateOne(
          {
            id: Number(id),
          },
          {
            $set: {
              listUsers: dataUsers,
            },
          }
        )
        return functions.success(res, 'Xóa thành công')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không có quyền')
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

// danh sách cài đặt
exports.listSettingTrackingQR = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    if (type === 1 || isAdmin) {
      if (com_id) {
        const result = await SettingTrackingQR.aggregate([
          {
            $match: {
              com_id: com_id,
            },
          },
          {
            $lookup: {
              from: 'QLC_SettingWifi', // Tên của bảng Học sinh
              localField: 'list_ip', // Trường trong bảng Class
              foreignField: 'id', // Trường trong bảng Students là ID của học sinh
              as: 'settingWifi', // Tên của trường kết quả trong mảng mới
            },
          },
          {
            $lookup: {
              from: 'QLC_Location', // Tên của bảng Học sinh
              localField: 'location_id', // Trường trong bảng Class
              foreignField: 'cor_id', // Trường trong bảng Students là ID của học sinh
              as: 'location', // Tên của trường kết quả trong mảng mới
            },
          },

          { $unwind: { path: '$location', preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: 'QRCode', // Tên của bảng Học sinh
              localField: 'QRCode_id', // Trường trong bảng Class
              foreignField: 'id', // Trường trong bảng Students là ID của học sinh
              as: 'qRCode', // Tên của trường kết quả trong mảng mới
            },
          },

          { $unwind: { path: '$qRCode', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: -1,
              id: 1,
              name: 1,
              com_id: 1,
              listUsers: 1,
              list_org: 1,
              list_pos: 1,
              list_shifts: 1,
              list_device: 1,
              location_id: '$location.cor_id',
              cor_location_name: '$location.cor_location_name',
              cor_radius: '$location.cor_radius',
              list_ip: '$settingWifi.ip_access',
              list_name_wifi: '$settingWifi.name_wifi',
              QRCodeUrl: '$qRCode.QRCodeUrl',
              QRstatus: '$qRCode.QRstatus',
              QRCodeName: '$qRCode.QRCodeName',
              start_time: 1,
              end_time: 1,
            },
          },
        ])
        result.map(async (e) => {
          e.ep_num = e.listUsers ? e.listUsers.length : null
          e.org_num = e.list_org ? e.list_org.length : null
          e.pos_num = e.list_pos ? e.list_pos.length : null
          e.shift_num = e.list_shifts ? e.list_shifts.length : null
        })
        return functions.success(res, 'Danh sách cài đặt', { data: result })
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

// sửa cài đặt
exports.updateSettingTrackingQR = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    if (type === 1 || isAdmin) {
      const {
        id,
        listUsers,
        list_org,
        list_pos,
        list_shifts,
        list_ip,
        list_device,
        QRCode_id,
        location_id,
        start_time,
        end_time,
        name,
      } = req.body
      if (id && com_id) {
        const foundGateway = await SettingTrackingQR.findOne({ id: Number(id) })
        if (!foundGateway)
          return functions.setError(res, 'Bản ghi không tồn tại')
        await SettingTrackingQR.updateOne(
          {
            id: Number(id),
          },
          {
            $set: {
              name: name || foundGateway.name,
              list_org: list_org || foundGateway.list_org,
              list_pos: list_pos || foundGateway.list_pos,
              list_shifts: list_shifts || foundGateway.list_shifts,
              listUsers: listUsers || foundGateway.listUsers,
              list_ip: list_ip || foundGateway.list_ip,
              list_device: list_device || foundGateway.list_device,
              QRCode_id: QRCode_id || foundGateway.QRCode_id,
              location_id: location_id || foundGateway.location_id,
              start_time:
                new Date(start_time) || new Date(foundGateway.start_time),
              end_time: new Date(end_time) || new Date(foundGateway.end_time),
            },
          }
        )
        return functions.success(res, 'Cập nhật thành công')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không có quyền')
  } catch (error) {
    return functions.setError(res, error.message)
  }
}
// xóa cài đặt
exports.deleteSettingTrackingQR = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    const type = Number(req.user.data.type)
    const isAdmin = Number(req.user.data.isAdmin)
    if (type === 1 || isAdmin) {
      const id = Number(req.body.id)
      if (com_id && id) {
        const foundGateway = await SettingTrackingQR.findOne({ id })
        if (!foundGateway)
          return functions.setError(res, 'Bản ghi không tồn tại')
        await SettingTrackingQR.deleteOne({ id })
        return functions.setError(res, 'Xóa thành công')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không có quyền')
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

// chấm công
exports.saveHisForApp = async (req, res) => {
  try {
    // const base64QRImage = req.body.base64QRImage
    const type = Number(req.user.data.type)
    const com_id = Number(req.user.data.com_id)
    const idQLC = Number(req.user.data.idQLC)
    const token = req.body.token
    const img = req.body.img
    const latitude = Number(req.body.latitude)
    const longtitude = Number(req.body.longtitude)
    const ip = req.body.ip
    // const ip = await functions.getPublicIP()
    // const ip = req.ip
    console.log(ip + '---------------------s')
    const time = req.body.time

    let listFindSettingQR
    if (com_id && token && idQLC && ip && time && latitude && longtitude) {
      // kiểm tra mã QR
      if (true) {
        const dataToken = await jwt.verify(token, process.env.NODE_SERCET)

        if (dataToken) {
          const QRCode_id = Number(dataToken.id)
          const currentDate = new Date()
          if (Number(dataToken.com_id) !== com_id)
            return functions.setError(res, 'QR Code không chính xác')
          listFindSettingQR = await SettingTrackingQR.find({
            com_id: com_id,
            QRCode_id: QRCode_id,
            start_time: { $lte: currentDate },
            end_time: { $gte: currentDate },
          })

          let checkTracking = false
          if (listFindSettingQR.length > 0) {
            for (let i = 0; i < listFindSettingQR.length; i++) {
              let checkAll = true
              let findSettingQR = listFindSettingQR[i]
              if (true) {
                const findUser = await Users.findOne(
                  { idQLC: idQLC, 'inForPerson.employee.com_id': com_id },
                  { idQLC: 1 }
                )
                if (!findUser) checkAll = false

                if (!findSettingQR.listUsers.includes(idQLC)) checkAll = false
              }

              // kiểm tra vị trí

              if (true) {
                const findLocation = await Location.findOne({
                  cor_id: findSettingQR.location_id,
                })
                if (!findLocation) checkAll = false

                const distance = calculateDistanceToCenter(
                  latitude,
                  longtitude,
                  findLocation.cor_lat,
                  findLocation.cor_long
                )

                if (distance > findLocation.radius) checkAll = false
              }
              // kiểm tra ip
              if (true) {
                let dataListIP = await SettingWifi.find(
                  {
                    id: {
                      $in: findSettingQR.list_ip,
                    },
                  },
                  { ip_access: 1 }
                )
                const list_ip = []
                dataListIP.map((e) => list_ip.push(e.ip_access))

                if (!list_ip.includes(ip)) checkAll = false
              }
              if (checkAll) {
                checkTracking = true
                break
              }
            }
            if (!checkTracking)
              return functions.setError(
                res,
                'Chấm công không thành công - Cài đặt QR không chính xác'
              )
            // lấy thông tin ca nhân viên
            const shiftInfo = await getListShiftEmp(com_id, idQLC)
            if (shiftInfo.success) {
              // nếu không tồn tại ca -> vẫn chấm công
              if (shiftInfo.shift.length == 0) {
                const noShift = await insertTimeKeeping(
                  com_id,
                  idQLC,
                  time,
                  latitude,
                  longtitude,
                  ip,
                  0,
                  img
                )
                return noShift.success
                  ? functions.success(
                      res,
                      'Chấm công thành công ( Ca không tồn tại)',
                      {}
                    )
                  : functions.setError(res, noShift.message, 500)
              }
              // tồn tại 1 ca
              else if (shiftInfo.shift.length == 1) {
                const oneShift = await insertTimeKeeping(
                  com_id,
                  idQLC,
                  time,
                  latitude,
                  longtitude,
                  ip,
                  shiftInfo.shift[0].shift_id,
                  img
                )
                return oneShift.success
                  ? functions.success(res, 'Chấm công thành công', {
                      ep_name: oneShift.ep_name,
                      shift: oneShift.shift,
                      image: oneShift.data.image,
                    })
                  : functions.setError(res, oneShift.message, 500)
              }
              // tồn tại 2 ca 1 luc
              else if (shiftInfo.shift.length == 2) {
                let image = null
                for (let i = 0; i < shiftInfo.shift.length; i++) {
                  let success = 0
                  const temp_shift_id = shiftInfo.shift[i]
                  const tempShift = await insertTimeKeeping(
                    com_id,
                    idQLC,
                    time,
                    latitude,
                    long,
                    ip,
                    temp_shift_id,
                    img
                  )
                  if (!image) image = tempShift.data.image
                  if (tempShift.success) success++
                }

                if (success == 2) {
                  return functions.success(res, 'Điểm danh thành công')
                }
                console.log('Điểm danh 2 ca lỗi')
                return functions.setError(res, 'Điểm danh 2 ca lỗi', 500)
              }

              console.log('Điểm danh lỗi')
              return functions.setError(res, 'Điểm danh lỗi', 500)
            }

            return functions.setError(res, shiftInfo.message, 500)
          }
          return functions.setError(res, 'QR Code không chính xác')
        } else return functions.setError(res, 'QR Code không chính xác')
      }

      // kiểm tra xem nhân viên có được chấm = QR
    }

    return functions.setError(res, 'Thiếu thông tin')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message, 500)
  }
}
