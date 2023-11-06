const TimeSheets = require('../../models/qlc/TimeSheets')
const CC365_Cycle = require('../../models/qlc/Cycle')
const functions = require('../../services/functions')
const calEmp = require('../../models/qlc/CalendarWorkEmployee')
const Users = require('../../models/Users')
const EmployeeDevice = require('../../models/qlc/EmployeeDevice')
const CompanyWebIP = require('../../models/qlc/CompanyWebIP')
const Tracking = TimeSheets
const moment = require('moment-timezone')
const Shifts = require('../../models/qlc/Shifts')
const SettingIP = require('../../models/qlc/SettingIP')
const OrganizeDetail = require('../../models/qlc/OrganizeDetail')
const Position = require('../../models/qlc/Positions')
const Location = require('../../models/qlc/Location')
const Wifi = require('../../models/qlc/TrackingWifi')
const EmployeeCycle = require('../../models/qlc/CalendarWorkEmployee')
const SettingWifi = require('../../models/qlc/SettingWifi')
const fs = require('fs')

//thêm chấm công
exports.CreateTracking = async (req, res) => {
  try {
    const user = req.user.data
    if (user.type == 2) {
      const ep_id = user.idQLC,
        com_id = user.com_id,
        {
          ts_image,
          device,
          uuid_device,
          name_device,
          ts_lat,
          ts_long,
          ts_location_name,
          wifi_name,
          wifi_ip,
          wifi_mac,
          shift_id,
          note,
          bluetooth_address,
          is_location_valid,
          from,
        } = req.body

      if (
        ts_image &&
        device &&
        ts_lat &&
        ts_long &&
        ts_location_name &&
        wifi_name &&
        wifi_ip &&
        wifi_mac &&
        shift_id &&
        bluetooth_address &&
        note
      ) {
        // Lấy thông tin công ty
        const company = await Users.findOne({
          idQLC: com_id,
          type: 1,
        })
          .select('inForCompany.cds.id_way_timekeeping')
          .lean()

        let is_success = 1,
          error = '',
          status = 1

        if (company) {
          if (is_location_valid) {
            error = 'Phạm vi bán kính không hợp lệ'
            is_success = 0
            if (from != 'cc365') {
              error = `${from}, Phạm vi bán kính không hợp lệ`
            }
          }

          if (uuid_device) {
            // Kiểm tra thiết bị lạ
            let type_device = 0
            const qr_device = await EmployeeDevice.findOne({
              ep_id: ep_id,
              type_device: type_device,
            })
            // Nếu đã có thiết bị trước đó lưu lại rồi thì kiểm tra
            if (qr_device) {
              const current_device = qr_device.current_device
              // Nếu thiết bị chấm công khác với thiết bị chấm công gần nhất được duyệt thì cập nhật
              if (current_device != uuid_device) {
                status = 2
                await EmployeeDevice.updateOne(
                  { ed_id: qr_device.ed_id },
                  {
                    $set: {
                      new_device: uuid_device,
                      new_device_name: name_device,
                    },
                  }
                )
              }
            }
            // Không thì lưu lại
            else {
              const MaxDevice = await EmployeeDevice.findOne({}, { ed_id: 1 })
                .sort({ ed_id: -1 })
                .limit(1)
                .lean()
              let ed_id = 1
              if (MaxDevice) ed_id = Number(MaxDevice.ed_id) + 1
              const NewEmployeeDevice = new EmployeeDevice({
                ed_id: ed_id,
                ep_id: ep_id,
                current_device: current_device,
                current_device_name: name_device,
                type_device: type_device,
              })
              await NewEmployeeDevice.save()
            }
          }

          // Lưu lại lịch sử điểm danh
          let sheet_id = 1
          let maxId = await Tracking.findOne({}, { sheet_id: 1 })
            .sort({ sheet_id: -1 })
            .limit(1)
            .lean()
          if (maxId) {
            sheet_id = Number(maxId.sheet_id) + 1
          }

          const tracking = new Tracking({
            sheet_id: sheet_id,
            ep_id: ep_id,
            ts_com_id: com_id,
            ts_image: ts_image,
            at_time: new Date(),
            device: device,
            ts_lat: ts_lat,
            ts_long: ts_long,
            ts_location_name: ts_location_name,
            wifi_name: wifi_name,
            wifi_ip: wifi_ip,
            wifi_mac: wifi_mac,
            shift_id: shift_id,
            status: status,
            bluetooth_address: bluetooth_address,
            ts_error: error,
            is_success: is_success,
            note: note,
          })
          await tracking.save()
          return functions.success(res, 'Điểm danh thành công', { tracking })
        }
        return functions.setError(res, 'Công ty không tồn tại')
      } else {
        return functions.setError(res, 'Chưa truyền đầy đủ thông tin')
      }
    }
    return functions.setError(res, 'Tài khoản không hợp lệ')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error)
  }
}

// Lưu lại lịch sử chấm công khi chấm công trên web
exports.SaveForWeb = async (req, res, date) => {
  try {
    const user = req.user.data
    if (user.type == 2) {
      const com_id = user.com_id
      const { ts_lat, ts_long, wifi_ip, shift_id, type } = req.body
      if (shift_id && type) {
        const qr_list = await CompanyWebIP.findOne({
          com_id: com_id,
          type: type,
          status: 1,
        }).lean()
        const qr_list_ip = await CompanyWebIP.findOne({
          com_id: com_id,
          type: type,
          ip_address: wifi_ip,
          status: 1,
        })
        const qr_fw = await Users.findOne(
          { idQLC: com_id, type: 1 },
          { 'inForCompany.cds.type_timekeeping': 1 }
        ).lean()
        let check_id_way_n
        const check_type = type == 1 ? 6 : 7
        if (qr_fw && qr_fw.inForCompany) {
          const id_way_n = qr_fw.inForCompany.cds.type_timekeeping
            .split(',')
            .map(Number)
          check_id_way_n = id_way_n.indexOf(check_type)
        }
        if (!qr_list || qr_list_ip || check_id_way_n == -1) {
          const max = await TimeSheets.findOne({}, { sheet_id: 1 })
            .sort({ sheet_id: -1 })
            .lean()
          const item = new TimeSheets({
            sheet_id: Number(max.sheet_id) + 1,
            ep_id: user.idQLC,
            at_time: Date.now(),
            device: 'web',
            ts_lat: ts_lat,
            ts_long: ts_long,
            wifi_ip: wifi_ip,
            shift_id: shift_id,
            is_success: 1,
            ts_error: '',
            ts_location_name: '',
            note: '',
            ts_com_id: com_id,
          })
          await item.save()
          return functions.success(res, 'Điểm danh thành công', {
            name: user.userName,
          })
        }
        return functions.setError(res, 'Địa chỉ IP điểm danh không hợp lệ')
      }
      return functions.setError(
        res,
        'Thiếu ca làm việc hoặc hình thức chấm công'
      )
    }
    return functions.setError(res, 'Tài khoản không phải tài khoản nhân viên')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error)
  }
}

const saveImg = (img_url, comp_id, idQLC, inputDate) => {
  const pathnameSplit = __dirname
    .split('/')
    .filter((item) => item !== '')
    .slice(0, -3)
  let pathname =
    '/' + pathnameSplit.join('/') + '/storage/base365/timviec365/time_keeping'

  // check folder exist if not create
  if (!fs.existsSync(pathname + '/' + comp_id)) {
    fs.mkdirSync(pathname + '/' + comp_id)
  }

  if (!fs.existsSync(pathname + '/' + comp_id + '/' + idQLC)) {
    fs.mkdirSync(pathname + '/' + comp_id + '/' + idQLC)
  }

  const date = new Date(inputDate)
  const curDay = date.toLocaleDateString('en-US').replaceAll('/', '-')
  if (!fs.existsSync(pathname + '/' + comp_id + '/' + idQLC + '/' + curDay)) {
    fs.mkdirSync(pathname + '/' + comp_id + '/' + idQLC + '/' + curDay)
  }

  // const buffer = fs.readFileSync("path-to-image.jpg");
  // // Pipes an image with "new-path.jpg" as the name.
  // fs.writeFileSync("new-path.jpg", buffer);

  // write to file
  const image = Buffer.from(img_url.split(',')[1], 'base64')
  const time = date.getTime()

  fs.writeFileSync(
    pathname + '/' + comp_id + '/' + idQLC + '/' + curDay + '/' + time + '.png',
    image
  )

  return `https://api.timviec365.vn/timviec365/time_keeping/${comp_id}/${idQLC}/${curDay}/${time}.png`
}

exports.SaveForWebComp = async (req, res) => {
  try {
    const user = req.user.data
    if (user.type == 1) {
      const com_id = user.com_id
      let time = new Date()
      if (req.body.time) {
        time = new Date(req.body.time)
      }

      const { ts_lat, ts_long, wifi_ip, shift_id, type, idQLC, img_url } =
        req.body
      const max = await TimeSheets.findOne({}, { sheet_id: 1 })
        .sort({ sheet_id: -1 })
        .lean()

      // check ip hop le hay khong
      const foundIp = await SettingIP.aggregate([
        {
          $match: {
            ip_access: wifi_ip,
            id_com: Number(com_id),
          },
        },
        {
          $project: {
            id_acc: 1,
          },
        },
      ])
      if (foundIp && foundIp.length > 0) {
        const currentDate = new Date()
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
        const item = new TimeSheets({
          sheet_id: Number(max.sheet_id) + 1,
          ep_id: idQLC,
          at_time: time,
          device: 'web',
          ts_lat: ts_lat,
          ts_long: ts_long,
          wifi_ip: wifi_ip,
          shift_id: shift_id,
          is_success: 1,
          ts_error: '',
          ts_location_name: '',
          note: '',
          ts_com_id: com_id,
          type: type,
        })
        await item.save()

        // save image
        if (img_url) {
          saveImg(img_url, com_id, idQLC, time)
        }

        return functions.success(res, 'Điểm danh thành công', {
          name: user.userName,
        })
      } else {
        return functions.setError(res, 'Địa chỉ IP điểm danh không hợp lệ')
      }
      // }
      // return functions.setError(res, 'Địa chỉ IP điểm danh không hợp lệ')
      // }
      // return functions.setError(
      //     res,
      //     'Thiếu ca làm việc hoặc hình thức chấm công'
      // )
    }
    return functions.setError(res, 'Tài khoản không phải tài khoản công ty')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error)
  }
}

exports.EmployeeHome = async (req, res) => {
  try {
    const user = req.user.data
    let { begin_time, end_search_time, time_chart_begin, time_chart_end } =
      req.body
    if (begin_time && end_search_time) {
      const idQLC = Number(user.idQLC)
      const com_id = Number(user.com_id)

      /*
                        Xử lý lấy ra đi muộn
                        - Giả sử $start_date và $end_date là hai biến chứa ngày bắt đầu và ngày kết thúc
                        - Chuyển các chuỗi ngày thành đối tượng Date
                        */

      const begin = new Date(begin_time)
      const end = new Date(end_search_time)

      // Sử dụng vòng lặp while để thực hiện từng ngày từ start_date đến end_date
      const currentDate = new Date(begin)
      let is_enough_work, only_checkin, only_checkout
      let is_late, is_early, late, late_second, early, early_second
      let count_late = 0
      let time_keeping_not_invalid = 0
      let count_success = 0
      while (currentDate <= end) {
        // Thực hiện công việc với ngày hiện tại
        const list_child = await TimeSheets.aggregate([
          {
            $match: {
              ep_id: idQLC,
              ts_com_id: com_id,
              $and: [
                {
                  at_time: {
                    $gt: new Date(
                      `${moment(currentDate).format('YYYY-MM-D')}T00:00:00Z`
                    ),
                  },
                },
                {
                  at_time: {
                    $lt: new Date(
                      `${moment(currentDate).format('YYYY-MM-D')}T23:59:59Z`
                    ),
                  },
                },
              ],
            },
          },
          // { $sort: { at_time: -1, shift_id: -1 } },
          {
            $lookup: {
              from: 'QLC_Shifts',
              foreignField: 'shift_id',
              localField: 'shift_id',
              as: 'shift',
            },
          },
          { $unwind: '$shift' },
          {
            $project: {
              sheet_id: 1,
              at_time: 1,
              shift_id: '$shift.shift_id',
              shift_name: '$shift.shift_name',
              start_time: '$shift.start_time',
              end_time: '$shift.end_time',
              num_to_calculate: '$shift.num_to_calculate',
              is_overtime: '$shift.is_overtime',
              is_success: 1,
            },
          },
        ])
        let arr_by_shift_id = {}
        for (let index = 0; index < list_child.length; index++) {
          const element = list_child[index]
          const { shift_id } = element

          // Nếu shift_id đã tồn tại trong đối tượng arr_by_shift_id
          if (arr_by_shift_id.hasOwnProperty(shift_id)) {
            // Thêm phần tử vào mảng tương ứng với shift_id
            arr_by_shift_id[shift_id].push(element)
          } else {
            // Nếu shift_id chưa tồn tại, khởi tạo một mảng mới và thêm phần tử vào đó
            arr_by_shift_id[shift_id] = [element]
          }

          // Nếu điểm danh thành công thì cộng lên 1
          if (element.is_success == 1) count_success++
          else time_keeping_not_invalid++
        }
        arr_by_shift_id = Object.values(arr_by_shift_id)
        arr_by_shift_id.forEach((sheet) => {
          const start_time = sheet[0]['start_time']
          const end_time = sheet[0]['end_time']
          const date_check_in = new Date(sheet[0]['at_time'])
          // Lấy giờ, phút và giây từ đối tượng Date
          const hour = date_check_in.getHours().toString().padStart(2, '0')
          const minute = date_check_in.getMinutes().toString().padStart(2, '0')
          const second = date_check_in.getSeconds().toString().padStart(2, '0')
          // Kết hợp thành định dạng "h:i:s"
          const time_check_in = `${hour}:${minute}:${second}`

          const date_check_out = new Date(sheet[sheet.length - 1]['at_time'])
          // Lấy giờ, phút và giây từ đối tượng Date
          const hour_check_out = date_check_out
            .getHours()
            .toString()
            .padStart(2, '0')
          const minute_check_out = date_check_out
            .getMinutes()
            .toString()
            .padStart(2, '0')
          const second_check_out = date_check_out
            .getSeconds()
            .toString()
            .padStart(2, '0')
          // Kết hợp thành định dạng "h:i:s"
          const time_check_out = `${hour_check_out}:${minute_check_out}:${second_check_out}`

          is_enough_work = true
          only_checkin = false
          only_checkout = false

          if (sheet.length == 1) {
            is_enough_work = false
            if (
              Math.abs(time_check_in - start_time) <
              Math.abs(time_check_out - end_time)
            ) {
              only_checkin = true
            } else {
              only_checkout = true
            }
          }

          is_late = false
          is_early = false

          late = 0
          late_second = 0
          early = 0
          early_second = 0

          //Nếu đủ công check in và check out
          if (is_enough_work) {
            //Nhân viên đi muộn
            if (time_check_in > start_time) {
              late += Math.floor((time_check_in - start_time) / 60)
              late_second += time_check_in - start_time
              is_late = true
            }

            //NV về sớm
            if (time_check_out < end_time) {
              early += Math.floor((end_time - time_check_out) / 60)
              early_second += end_time - time_check_out
              is_early = true
            }
          } else {
            //Nhân ko đủ công và chỉ chấm 1 lần, nếu là chấm giờ gần với check in, thì là quên check out, thì lấy giờ check in và so sánh với start time xem có đi muộn không
            if (only_checkin) {
              if (time_check_in > start_time) {
                late += Math.floor((time_check_in - start_time) / 60)
                late_second += time_check_in - start_time
                is_late = true
              }
            } else {
              //Nếu chỉ check out
              //Kiểm tra NV về sớm
              if (time_check_out < end_time) {
                early += Math.floor((end_time - time_check_out) / 60)
                early_second += end_time - time_check_out
                is_early = true
              }
            }
          }

          if (is_late || is_early) {
            count_late++
          }
        })

        // Tăng ngày hiện tại lên 1 ngày
        currentDate.setDate(currentDate.getDate() + 1)
      }
      // Kết thúc xử lý đi muộn

      // Xử lý số lần chấm công trong tuần
      const chart_begin = new Date(time_chart_begin)
      const chart_end = new Date(time_chart_end)
      // Sử dụng vòng lặp while để thực hiện từng ngày từ start_date đến end_date
      const currentDateChart = new Date(chart_begin)
      const resultChart = []
      const history = []

      const list_time_sheet = await TimeSheets.aggregate([
        {
          $match: {
            ep_id: idQLC,
            ts_com_id: com_id,
          },
        },
        { $sort: { at_time: -1 } },
        { $limit: 100 },
        {
          $lookup: {
            from: 'QLC_Shifts',
            foreignField: 'shift_id',
            localField: 'shift_id',
            as: 'shift',
          },
        },
        { $unwind: '$shift' },
        {
          $project: {
            sheet_id: 1,
            at_time: 1,
            shift_name: '$shift.shift_name',
            is_success: 1,
          },
        },
        { $sort: { at_time: 1 } },
      ])

      // lay thong tin cho chart - long
      let date_today = new Date()
      let first_day_of_the_week = new Date(
        date_today.setDate(date_today.getDate() - date_today.getDay())
      )

      const temp_start = new Date(first_day_of_the_week.setHours(0, 0, 0, 0))
      const temp_end = new Date(new Date().setHours(23, 59, 59, 999))

      var loop = temp_start

      while (loop <= temp_end) {
        const start = new Date(loop.setHours(0, 0, 0, 0))
        const end = new Date(loop.setHours(23, 59, 59, 999))
        const count = await TimeSheets.countDocuments({
          ts_com_id: com_id,
          ep_id: idQLC,
          at_time: {
            $gte: start,
            $lte: end,
          },
        })
        const temp = {}
        // temp[new Date(loop)] = count
        resultChart.push(count)

        var newDate = loop.setDate(loop.getDate() + 1)
        loop = new Date(newDate)
      }

      return functions.success(res, 'Thành công', {
        count_late,
        time_keeping_not_invalid,
        count_success,
        resultChart: resultChart.length > 0 ? resultChart.slice(1) : [],
        history: list_time_sheet,
      })
    }
    return functions.setError(
      res,
      'Chưa truyền đầy đủ thông tin bắt đầu và kết thúc'
    )
  } catch (error) {
    console.log(error)
    return functions.setError(res, error)
  }
}

// Set current date TimeStamp, eg: '1666512804163'
// TimeStamp: new Date().getTime().toString()

// Display saved TimeStamp, eg: '23/10/2022'
// new Date(parseInt(TimeStamp)).toLocaleDateString()

exports.getListUserTrackingSuccess = async (req, res) => {
  try {
    //const page = req.body.page || 1;
    //const pageSize = req.body.pageSize || 30;
    const request = req.body
    let com_id = request.com_id
    //shift_id = request.shift_id
    at_time = request.at_time || true
    let inputNew = new Date(request.inputNew)
    let inputOld = new Date(request.inputOld)

    if (com_id == undefined) {
      return functions.setError(res, 'lack of input')
    } else {
      const data = await Tracking.find(
        { ts_com_id: com_id, at_time: { $gte: inputOld, $lte: inputNew } },
        {
          sheet_id: 1,
          shift_id: 1,
          ep_id: 1,
          at_time: 1,
        }
      )
        .sort({ at_time: -1 })
        //.skip((page - 1) * pageSize)
        //.limit(pageSize)
        .lean()
      let listUserId = []
      let dataTimeSheet = []
      for (let i = 0; i < data.length; i++) {
        if (!listUserId.find((e) => e == data[i].ep_id)) {
          listUserId.push(data[i].ep_id)
        }
        if (!dataTimeSheet.find((e) => e.ep_id == data[i].ep_id)) {
          const shift = await Shifts.findOne({ shift_id: data[i].shift_id })

          dataTimeSheet.push({
            ep_id: data[i].ep_id,
            time: data[i].at_time,
            shift_id: data[i].shift_id,
            shift_name: shift ? shift.shift_name : 'Ca làm việc không tồn tại',
          })
        }
      }
      let listUser = await Users.find({
        idQLC: { $in: listUserId },
        type: 2,
      }).lean()

      if (data) {
        //lấy thành công danh sách NV đã chấm công
        return await functions.success(res, 'Lấy thành công', {
          dataTimeSheet,
          listUser,
        })
      }
      return functions.setError(res, 'Không có dữ liệu', 404)
    }
  } catch (err) {
    console.log(err)
    return functions.setError(res, err.message)
  }
}

function compareObjects(obj1, obj2) {
  return JSON.stringify(obj1.idQLC) === JSON.stringify(obj2.idQLC)
}

function removeSimilarElements(data, data2) {
  const newArray = data.filter(
    (item1) => !data2.some((item2) => compareObjects(item1, item2))
  )

  return newArray.concat(
    data2.filter((item2) => !data.some((item1) => compareObjects(item1, item2)))
  )
}

//LỌC PHẦN TỬ LẶP LẠI
function compare(personA, personB) {
  return (
    personA.idQLC === personB.idQLC && personA.shift_id === personB.shift_id
  )
}

// danh sách nhân viên chưa chấm công của ca đấy trong ngày hôm đấy
exports.getlistUserNoneHistoryOfTracking = async (req, res) => {
  const pageNumber = req.body.pageNumber || 1
  let at_time = req.body.at_time || true
  let inputNew = new Date(req.body.inputNew) || null
  let inputOld = new Date(req.body.inputOld) || null
  let com_id = Number(req.body.com_id)
  let shift_id = req.body.shift_id
  //ta tìm danh sách lịch sử nhân viên của công ty đã chấm công
  // xử lý thời gian => Lấy phổ rộng nhất có thể
  let start_date = new Date(inputNew.getFullYear(), inputNew.getMonth())
  start_date = new Date(start_date.setSeconds(start_date.getSeconds() - 1))
  let end_date = new Date(inputOld.getFullYear(), inputOld.getMonth() + 1, 1, 7)
  end_date = new Date(end_date.setSeconds(end_date.getSeconds() + 1))
  let list_ep = []
  let listEm = await Users.find(
    { 'inForPerson.employee.com_id': com_id },
    { idQLC: 1 }
  ).lean()
  for (let i = 0; i < listEm.length; i++) {
    list_ep.push(listEm[i].idQLC)
  }
  const data = await Tracking.find(
    {
      ts_com_id: com_id,
      shift_id: shift_id,
      at_time: { $gte: inputNew, $lte: inputOld },
    },
    {
      sheet_id: 1,
      shift_id: 1,
      ep_id: 1,
    }
  ).lean()
  //ta tìm danh sách nhân viên đã có lịch làm việc của công ty
  const data2 = await calEmp
    .find(
      { com_id: com_id, shift_id: shift_id },
      {
        sheet_id: 1,
        shift_id: 1,
        ep_id: 1,
      }
    )
    .lean()

  // dữ liệu lịch làm việc
  let list_cy_detail = await CC365_Cycle.aggregate([
    {
      $lookup: {
        from: 'CC365_EmployeCycle',
        localField: 'cy_id',
        foreignField: 'cy_id',
        as: 'CC365_EmployeCycle',
      },
    },
    {
      $match: {
        $and: [
          { 'CC365_EmployeCycle.ep_id': { $in: list_ep } },
          { apply_month: { $gte: start_date } },
          { apply_month: { $lte: end_date } },
          { com_id: com_id },
        ],
      },
    },
    {
      $project: {
        cy_id: 1,
        cy_detail: 1,
        apply_month: 1,
        'CC365_EmployeCycle.ep_id': 1,
      },
    },
  ])
  let list_detail = [] //thông tin ca của từng ngày
  for (let i = 0; i < list_cy_detail.length; i++) {
    let array = JSON.parse(list_cy_detail[i].cy_detail)
    for (let j = 0; j < array.length; j++) {
      if (array[j].shift_id) {
        let date = new Date(
          Number(array[j].date.split('-')[0]),
          Number(array[j].date.split('-')[1]) - 1,
          Number(array[j].date.split('-')[2]),
          7
        )
        if (array[j].shift_id.includes(',')) {
          let array_shift = array[j].shift_id.split(',')
          for (let k = 0; k < array_shift.length; k++) {
            list_detail.push({
              shift_id: Number(array_shift[k]),
              date,
              ep_id: list_cy_detail[i].CC365_EmployeCycle[0].ep_id,
            })
          }
        } else {
          list_detail.push({
            shift_id: Number(array[j].shift_id),
            date,
            ep_id: list_cy_detail[i].CC365_EmployeCycle[0].ep_id,
          })
        }
      }
    }
  }
  // dữ liệu lịch làm việc của ca trong ngày đó
  list_detail = list_detail.filter(
    (e) => e.date.getDate() == inputNew.getDate() && e.shift_id == shift_id
  )
  let listUserIdNoTimeSheet = []
  for (let i = 0; i < list_detail.length; i++) {
    let check = data.find((e) => e.ep_id == list_detail[i].ep_id)
    if (!check) {
      if (list_ep.find((e) => e == list_detail[i].ep_id)) {
        listUserIdNoTimeSheet.push(list_detail[i].ep_id)
      }
    }
  }
  let listUserNoTimeSheet = await Users.find(
    { idQLC: { $in: listUserIdNoTimeSheet } },
    { password: 0 }
  ).lean()
  return await functions.success(res, 'Lấy thành công', { listUserNoTimeSheet })

  // const ketQua = removeSimilarElements(data, data2);

  // let newData = functions.arrfil(ketQua, compare);

  // const pageSize = 20;
  // const startIndex = (pageNumber - 1) * pageSize;
  // const endIndex = pageNumber * pageSize;
  // const results = newData.slice(startIndex, endIndex);

  // if (newData) { //lấy thành công danh sách NV
  //     return await functions.success(res, 'Lấy thành công', { results, pageNumber });
  // }
  // return functions.setError(res, 'Không có dữ liệu', 404);
}

exports.getlist = async (req, res) => {
  try {
    // const com_id = req.user.data.com_id
    const pageNumber = req.body.pageNumber || 1
    const request = req.body
    let idQLC = request.idQLC
    com_id = Number(request.com_id)
    dep_id = Number(request.dep_id)
    inputNew = request.inputNew
    inputOld = request.inputOld
    let data = []
    let listCondition = {}

    if (com_id) listCondition.com_id = com_id
    if (idQLC) listCondition.idQLC = idQLC
    if (dep_id) listCondition.dep_id = dep_id
    if (inputNew && inputOld)
      listCondition['at_time'] = { $gte: inputOld, $lte: inputNew }
    // const data = await Tracking.find({com_id: com_id, at_time: { $gte: '2023-06-01', $lte: '2023-06-06' } }).select('_id idQLC ts_location_name at_time shift_id status  ').skip((pageNumber - 1) * 20).limit(20).sort({ at_time : -1});
    data = await Tracking.find(listCondition)
      .select('sheet_id ep_id ts_location_name at_time shift_id status  ')
      .skip((pageNumber - 1) * 20)
      .limit(20)
      .sort({ sheet_id: -1 })
    if (data) {
      return await functions.success(res, 'Lấy thành công', { data })
    }
    return functions.setError(res, 'Không có dữ liệu', 404)
  } catch (err) {
    functions.setError(res, err.message)
  }
}

//tách dòng chấm công
exports.splitTimeKeeping = async (req, res) => {
  try {
    let ep_id = Number(req.body.ep_id)
    let fromDate = req.body.fromDate
    let toDate = req.body.toDate
    let tokenTinhLuong = req.body.tokenTinhLuong
    let fromDateObject = new Date(fromDate)
    let toDateObject = new Date(toDate)
    let month = fromDateObject.getMonth() + 1
    let year = fromDateObject.getFullYear()

    let findUser = await Users.findOne(
      { _id: ep_id },
      { idQLC: 1, 'inForPerson.employee.com_id': 1, type: 1 }
    ).lean()

    let com_id = findUser.inForPerson.employee.com_id

    if (findUser && findUser.type == 2) {
      //1: Không tách dòng
      //2:  Theo công chuẩn: Nếu 1 tháng nhân sự áp dụng nhiều mức công chuẩn khác nhau thì bảng chấm công sẽ tách dòng của nhân sự đó
      //(hiện tại cty chưa có luồng một tháng áp dụng nhiều công chuẩn, bên tính lương sẽ tính công chuẩn được cập nhật cuối cùng)
      //3:  Theo vị trí, phòng ban: Khi vị trí hoặc phòng ban của nhân sự thay đổi trong tháng thì bảng chấm công sẽ tách dòng của nhân sự đó
      //4:  Theo lương vị trí: Trong 1 tháng nhân sự được thay đổi mức lương theo vị trí thì bảng chấm công sẽ tách dòng của nhân sự đó
      //5:  Lương phụ cấp: Trong 1 tháng nhân sự được thay đổi mức phụ cấp thì bảng chấm công sẽ tách dòng của nhân sự đó
      //6:  Theo hợp đồng lao động: Trong 1 tháng nhân sự thay đổi loại hợp đồng thì bảng chấm công sẽ tách dòng của nhân sự đó
      let timeSheet = await axios.post(
        'https://tinhluong.timviec365.vn/api_app/company/tbl_timekeeping_manager.php',
        qs.stringify({
          token: tokenTinhLuong,
          id_comp: com_id,
          id_emp: findUser.idQLC,
          month: month,
          year: year,
        })
      )

      const type = req.body.type
      if (type == 1) {
        return await functions.success(res, 'Lấy thành công', {
          timeSheet: timeSheet.data.data,
        })
      } else if (type == 2) {
        return await functions.success(
          res,
          'Chưa có luồng nhiều công chuẩn trong 1 tháng',
          { timeSheet: timeSheet.data.data }
        )
      } else if (type == 3) {
        let listCondition = {}
        if (ep_id) listCondition.ep_id = Number(ep_id)
        if (fromDate && !toDate)
          listCondition.created_at = { $gte: new Date(fromDate) }
        if (toDate && !fromDate)
          listCondition.created_at = { $lte: new Date(toDate) }
        if (toDate && fromDate)
          listCondition.created_at = {
            $gte: new Date(fromDate),
            $lte: new Date(toDate),
          }

        let listAppoint = await Appoint.find(listCondition)

        let arrChange = []
        for (let i = 0; i < listAppoint.length; i++) {
          arrChange.push(listAppoint[i].created_at)
        }

        return await functions.success(res, 'Lấy thành công', {
          timeSheet: timeSheet.data.data,
          data: arrChange,
        })
      } else if (type == 4) {
        let condition = { sb_id_com: com_id }
        if (findUser.idQLC) condition.sb_id_user = findUser.idQLC
        if (fromDate && !toDate)
          condition.sb_time_up = { $gte: new Date(fromDate) }
        if (toDate && !fromDate)
          condition.sb_time_up = { $lte: new Date(toDate) }
        if (fromDate && toDate)
          condition.sb_time_up = {
            $gte: new Date(fromDate),
            $lte: new Date(toDate),
          }

        let dataLuong = await Salary.find(condition).sort({ sb_time_up: -1 })

        let arrChange = []
        for (let i = 0; i < dataLuong.length; i++) {
          arrChange.push(dataLuong[i].sb_time_up)
        }

        return await functions.success(res, 'Lấy thành công', {
          timeSheet: timeSheet.data.data,
          data: arrChange,
        })
      } else if (type == 5) {
        return await functions.success(res, 'Chưa có luồng thay đổi phụ cấp', {
          timeSheet: timeSheet.data.data,
        })
      } else if (type == 6) {
        // thời điểm lớn hơn thời điểm bắt đầu hợp đồng
        const time = new Date(toDate)

        let data_contract = await Tinhluong365Contract.find(
          {
            con_id_user: findUser.idQLC,
            con_time_end: { $lte: toDateObject },
          },
          {
            con_time_up: 1,
            con_time_end: 1,
          }
        )
          .sort({ con_time_up: -1 })
          .lean()
        let arrChange = []
        for (let i = 0; i < data_contract.length; i++) {
          let ojb = {}
          ;(ojb.startTime = data_contract[i].con_time_up),
            (ojb.endTime = data_contract[i].con_time_end),
            arrChange.push(ojb)
        }

        return await functions.success(res, 'Lấy thành công', {
          timeSheet: timeSheet.data.data,
          data: arrChange,
        })
      }
      return functions.setError(res, 'Không đúng type')
    } else
      return functions.setError(
        res,
        'không có user này hoặc user ko phải là nhân viên'
      )
  } catch (error) {
    return functions.setError(res, error)
  }
}

exports.get_history_time_keeping_by_company = async (req, res) => {
  try {
    const user = req.user.data
    const page = req.body.page || 1,
      pageSize = Number(req.body.pageSize) || 30
    const type = req.body.type
    const ep_id = req.body.ep_id
    const start_date = req.body.start_date
    const end_date = req.body.end_date
    const com_id = Number(user.com_id)
    const status = req.body.status

    let match = {
      ts_com_id: com_id,
    }
    if (ep_id) {
      match.ep_id = Number(ep_id)
    }

    if (start_date && !end_date)
      match.at_time = { $gte: new Date(`${start_date} 00:00:00`) }
    if (!start_date && end_date)
      match.at_time = { $lte: new Date(`${end_date} 23:59:59`) }
    if (start_date && end_date)
      match.at_time = {
        $gte: new Date(`${start_date} 00:00:00`),
        $lte: new Date(`${end_date} 23:59:59`),
      }
    if (status) match.status = status

    if (type == 'timekeeping_qr') {
      match.ts_image = ''
    }

    const list = await TimeSheets.aggregate([
      {
        $match: match,
      },
      { $sort: { at_time: -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      {
        $lookup: {
          from: 'Users',
          foreignField: 'idQLC',
          localField: 'ep_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.type': { $ne: 1 } } },
      {
        $lookup: {
          from: 'QLC_Shifts',
          localField: 'shift_id',
          foreignField: 'shift_id',
          as: 'shift',
        },
      },
      { $unwind: '$shift' },
      {
        $project: {
          _id: 0,
          sheet_id: 1,
          ep_id: 1,
          ts_image: 1,
          at_time: 1,
          device: 1,
          ts_location_name: 1,
          wifi_name: 1,
          wifi_ip: 1,
          wifi_mac: 1,
          shift_id: 1,
          ts_com_id: 1,
          note: 1,
          bluetooth_address: 1,
          status: 1,
          ts_error: 1,
          is_success: 1,
          ep_name: '$user.userName',
          ep_gender: '$user.inForPerson.account.gender',
          shift_name: '$shift.shift_name',
        },
      },
    ])
    let total = 0
    if (list.length > 0) {
      const countTimeSheet = await TimeSheets.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: '$ep_id',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'Users',
            foreignField: 'idQLC',
            localField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $match: { 'user.type': { $ne: 1 } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$count' },
          },
        },
      ])
      total = countTimeSheet[0].total
    }
    return functions.success(res, 'Danh sách chấm công khuôn mặt', {
      totalItems: total,
      items: list,
    })
  } catch (error) {
    console.log(error)
    return functions.setError(res, error)
  }
}

//Lich su diểm danh công ty

const formatAtTime = (atTime) => {
  if (atTime) {
    const date = new Date(atTime)

    return date.toLocaleDateString('en-US').replaceAll('/', '-')
  }
  return ''
}

exports.getCompHistoryCheckin = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    const type = req.user.data.type
    const { start_time, end_time, ep_id, dep_id } = req.body
    const start = new Date(start_time)
    const end = new Date(end_time)
    const final_start = new Date(start.setHours(0, 0, 0, 0))
    const final_end = new Date(end.setHours(23, 59, 59, 999))

    let condition = {
      ts_com_id: com_id,
      at_time: {
        $gte: final_start,
        $lte: final_end,
      },
    }

    if (ep_id) {
      condition = {
        ...condition,
        ep_id: ep_id,
      }
    }
    let lookupCondition = {}
    if (dep_id) {
      lookupCondition = {
        'user.inForPerson.dep_id': dep_id,
      }
    }

    if (type === 1) {
      const curPage = req.body.curPage || 1
      const RECORD_PER_PAGE = 10
      let project = {
        ep_id: 1,
        userName: '$user.userName',
        dep_id: '$user.inForPerson.employee.dep_id',
        at_time: 1,
        // dep_name: '$department.dep_name',
        dep: '$dep',
        shift_id: 1,
        shift_name: '$shift.shift_name',
        sheet_id: 1,
        device: 1,
        ts_location_name: 1,
      }

      if (req.body.call_api_from && req.body.call_api_from == 'winform') {
        project = {
          ep_id: 1,
          ep_name: '$user.userName',
          ep_gender: '$user.inForPerson.account',
          ep_image: 1,
          ts_date: 1,
          lst_time: 1,
        }
      }

      const listData = await TimeSheets.aggregate([
        {
          $match: condition,
        },
        {
          $sort: {
            at_time: -1,
          },
        },
        {
          $skip: RECORD_PER_PAGE * (curPage - 1),
        },
        {
          $limit: RECORD_PER_PAGE,
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'ep_id',
            foreignField: 'idQLC',
            pipeline: [
              {
                $match: {
                  type: 2,
                },
              },
            ],
            as: 'user',
          },
        },
        {
          $match: lookupCondition,
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'QLC_OrganizeDetail',
            localField: 'user.inForPerson.employee.organizeDetailId',
            foreignField: 'id',
            pipeline: [
              {
                $match: {
                  comId: Number(com_id),
                },
              },
            ],
            as: 'dep',
          },
        },
        {
          $unwind: {
            path: '$dep',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'QLC_Shifts',
            localField: 'shift_id',
            foreignField: 'shift_id',
            as: 'shift',
          },
        },
        {
          $unwind: {
            path: '$shift',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: project,
        },
      ])

      const temp = []
      if (listData) {
        listData.forEach((item) => {
          const timeEpoch = new Date(item.at_time)
          const img = `time_keeping/${com_id}/${item.ep_id}/${formatAtTime(
            item.at_time
          )}/${timeEpoch.getTime()}.png`

          temp.push({
            ...item,
            image: img,
          })
        })
      }

      // lay tong so ban ghi
      const count = await TimeSheets.countDocuments(condition)

      return functions.success(res, 'Lấy thành công', {
        data: temp,
        total: count,
      })
    }
    return functions.setError(
      res,
      'Tài khoản không phải tài khoản công ty',
      500
    )
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.messsage, 500)
  }
}

exports.getListEmpSimple = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    const type = req.user.data.type

    if (type === 1) {
      const list = await Users.aggregate([
        {
          $match: {
            'inForPerson.employee.com_id': com_id,
            'inForPerson.employee.ep_status': 'Active',
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $project: {
            idQLC: 1,
            userName: 1,
          },
        },
      ])

      return functions.success(res, 'Lấy thành công', {
        data: list,
      })
    }

    return functions.setError(res, 'Tài khoản không phải tài khoản công ty')
  } catch (err) {
    console.log(err)
    return functions.setError(res, error.message, 500)
  }
}

// Lịch sử chaassm công cá nhân
exports.getHistoryTrackingEmp = async (req, res) => {
  try {
    const ep_id = req.user.data.idQLC
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    const curPage = req.body.curPage || 1
    const RECORD_PER_PAGE = 10

    const startTime = req.body.startTime
    const endTime = req.body.endTime
    const start = new Date(new Date(startTime).setHours(0, 0, 0, 0))
    const end = new Date(new Date(endTime).setHours(23, 59, 59, 999))

    if (type === 2) {
      const condition = {
        ts_com_id: com_id,
        ep_id: ep_id,
        at_time: {
          $gte: start,
          $lte: end,
        },
      }

      if (ep_id && com_id) {
        const data = await TimeSheets.aggregate([
          {
            $match: condition,
          },
          {
            $sort: {
              at_time: -1,
            },
          },
          // {
          //     $skip: RECORD_PER_PAGE * (curPage - 1)
          // },
          // {
          //     $limit: RECORD_PER_PAGE
          // },
          {
            $lookup: {
              from: 'QLC_Shifts',
              localField: 'shift_id',
              foreignField: 'shift_id',
              as: 'shift',
              pipeline: [
                {
                  $match: {
                    com_id: com_id,
                  },
                },
              ],
            },
          },
          {
            $unwind: {
              path: '$shift',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              ep_id: 1,
              shift_id: 1,
              at_time: 1,
              wifi_ip: 1,
              shift_name: '$shift.shift_name',
              start_time: '$shift.start_time',
              start_time_latest: '$shift.start_time_latest',
              end_time: '$shift.end_time',
              end_time_earliest: '$end_time_earliest',
              device: 1,
              _id: '$dexuat._id',
            },
          },
        ])

        // lấy ảnh chấm công
        const temp = []
        if (data) {
          data.forEach((item) => {
            const timeEpoch = new Date(item.at_time)
            const img = `time_keeping/${com_id}/${item.ep_id}/${formatAtTime(
              item.at_time
            )}/${timeEpoch.getTime()}.png`

            temp.push({
              ...item,
              image: img,
            })
          })
        }

        // lấy tổng sô bản ghi
        const count = await TimeSheets.countDocuments(condition)

        return functions.success(res, 'Lấy thành công', {
          data: temp,
          total: count,
        })
      }

      return functions.setError(res, 'Token không hợp lệ')
    }

    return functions.setError(res, 'Tài khoản không phải tài khoản nhân viên')
  } catch (error) {
    console.log(error)
    return functions.setError(res, res.message, 500)
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

// Hàm lấy danh sách ca nhân viên
const getListShiftEmp = async (id_com, id_use, time) => {
  try {
    const date = new Date(time)
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
      // console.log("Nhân viên ok", user[0]);
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
      // console.log("Lịch làm việc", db_cycle);
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
        // console.log(arr_shift)

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

// insert dữ liệu chấm công
const insertTimeKeeping = async (
  com_id,
  idQLC,
  time,
  ts_lat,
  ts_long,
  wifi_ip,
  shift_id,
  img_url,
  device = 'winform'
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
    let imgLink = saveImg(img_url, com_id, idQLC, time)

    return {
      success: true,
      message: 'Điểm danh thành công',
      data: { image: imgLink },
    }
  } catch (error) {
    console.log(error)

    return {
      success: false,
      message: error.message,
    }
  }
}

// chấm công cho winform
exports.saveHisForWinform = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    if (type == 1 && com_id) {
      const listIds = req.body.listIds
      const img = req.body.img
      const lat = req.body.lat
      const long = req.body.long
      const ip = req.body.ip
      const time = req.body.time
      console.log('listIds')
      console.log(listIds)

      if (listIds && img && ip && time) {
        // check ip
        const ipComp = await SettingIP.aggregate([
          {
            $match: {
              id_com: Number(com_id),
            },
          },
          {
            $project: {
              _id: 0,
              ip_access: 1,
            },
          },
        ])

        const found = ipComp.find((item) => item.ip_access == ip)

        if (found) {
          // lấy danh sách ids
          const idArr = listIds.split(',').map((item) => Number(item))
          const listEmp = []
          for (let i = 0; i < idArr.length; i++) {
            const idQLC = idArr[i]
            // lấy thông tin ca nhân viên
            const shiftInfo = await getListShiftEmp(com_id, idQLC, time)
            if (shiftInfo.success) {
              // nếu không tồn tại ca -> vẫn chấm công
              if (shiftInfo.shift.length == 0) {
                const noShift = await insertTimeKeeping(
                  com_id,
                  idQLC,
                  time,
                  lat,
                  long,
                  ip,
                  0,
                  img,
                  'web'
                )
                // return noShift.success ? functions.success(res, 'Chấm công thành công ( Ca không tồn tại)', {}) : functions.setError(res, noShift.message, 500)
                if (noShift.success) {
                  listEmp.push({
                    name: shiftInfo.ep_name,
                    image: noShift.data.image,
                  })
                } else {
                  console.log(shiftInfo.message)
                }
              }
              // tồn tại 1 ca
              else if (shiftInfo.shift.length == 1) {
                const oneShift = await insertTimeKeeping(
                  com_id,
                  idQLC,
                  time,
                  lat,
                  long,
                  ip,
                  shiftInfo.shift[0].shift_id,
                  img,
                  'web'
                )
                console.log('-----------------------------------------')
                console.log(oneShift)
                // return oneShift.success ? functions.success(res, 'Chấm công thành công', {
                //     ep_name: oneShift.ep_name,
                //     shift: oneShift.shift,
                // }) : functions.setError(res, oneShift.message, 500)
                if (oneShift.success) {
                  listEmp.push({
                    name: shiftInfo.ep_name,
                    image: oneShift.data.image,
                  })
                } else {
                  console.log(oneShift.message)
                }
              }
              // tồn tại 2 ca 1 luc
              else if (shiftInfo.shift.length == 2) {
                let success = 0
                for (let i = 0; i < shiftInfo.shift.length; i++) {
                  const temp_shift_id = shiftInfo.shift[i].shift_id
                  console.log(temp_shift_id)
                  const tempShift = await insertTimeKeeping(
                    com_id,
                    idQLC,
                    time,
                    lat,
                    long,
                    ip,
                    temp_shift_id,
                    img,
                    'web'
                  )
                  console.log(tempShift)
                  if (tempShift.success) success++
                }

                if (success == 2) {
                  // return functions.success(res, 'Điểm danh thành công', {})
                  listEmp.push({ name: shiftInfo.ep_name })
                }
                // return functions.setError(res, 'Điểm danh 2 ca lỗi', 500)
                else {
                  console.log('Điểm danh 2 ca lỗi')
                }
              }

              // return functions.setError(res, 'Điểm danh lỗi', 500)
            }

            // return functions.setError(res, shiftInfo.message, 500)
          }

          return functions.success(res, 'Diem danh thanh cong', {
            listEmp: listEmp,
          })
        }

        return functions.setError(
          res,
          'Địa chỉ IP không được phép chấm công',
          500
        )
      }

      return functions.setError(
        res,
        'Thiếu 1 trong số các trường listIds, img, IP, time',
        500
      )
    }

    return functions.setError(res, 'Tài khoản không phải tài khoản công ty')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message, 500)
  }
}

// tien long
const toDateWithOutTimeZone = (date) => {
  console.log(date)
  if (date) {
    let tempTime = date.split(':')
    let dt = new Date()
    dt.setHours(Number(tempTime[0]) || 0)
    dt.setMinutes(Number(tempTime[1]) || 0)
    dt.setSeconds(Number(tempTime[2]) || 0)
    return dt
  } else {
    return null
  }
}

// Chấm công cho app
exports.saveHisForApp = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    let device = 'app'
    if (com_id) {
      const idQLC = req.body.idQLC
      const img = req.body.img
      const lat = req.body.lat
      const long = req.body.long
      const ip = req.body.ip
      const time = req.body.time
      console.log(
        '----------------------idQLC-------------------------------------'
      )
      console.log(idQLC)
      if (idQLC && img && ip && time) {
        //lấy thông tin nhân viên
        const user = await Users.findOne({
          idQLC: Number(idQLC),
          type: 2,
          'inForPerson.employee.com_id': Number(com_id),
        }).lean()

        console.log('------------------------------------------')
        console.log(user)

        console.log('------------------------------------------')
        if (!user) {
          console.log(
            '---------------------NO EMP -----------------------------'
          )
          return functions.setError(res, 'Không tìm thấy nhân viên')
        }
        // lấy thông tin cài đặt chấm công

        const now = new Date(time)
        const settings = await SettingTimesheet.find({
          com_id: Number(com_id),
          start_time: { $lte: now },
          end_time: { $gte: now },
        })

        // check thông tin có được chấm công hay không
        // đối với web chỉ cần check phòng ban, vị trí, idqlc, ca, ip, thiết bị
        // danh sách thiết bị:     'web', 'app', 'qrchat'
        // lấy các thông tin

        // thông tin ca ngày hôm đó

        if (settings.length > 0) {
          let firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
          let lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          const llv = await EmployeeCycle.aggregate([
            {
              $match: {
                ep_id: Number(idQLC),
              },
            },
            {
              $lookup: {
                from: 'CC365_Cycle',
                localField: 'cy_id',
                foreignField: 'cy_id',
                pipeline: [
                  {
                    $match: {
                      apply_month: { $lte: lastDay, $gte: firstDay },
                      com_id: Number(com_id),
                    },
                  },
                ],
                as: 'cycle',
              },
            },
            {
              $unwind: '$cycle',
            },
          ])
          const shifts = await Shifts.find({ com_id: Number(com_id) }).lean()
          const wifi = await SettingWifi.find({ id_com: Number(com_id) }).lean()
          // console.log(shifts)
          console.log(llv)
          if (llv.length < 1)
            return functions.setError(
              res,
              'Nhân viên không tồn tại lịch làm việc',
              500
            )

          const cy_detail = llv[0].cycle.cy_detail

          const json = JSON.parse(cy_detail)
          const nowString = formatDate(now)
          const listShiftToday = []
          for (let i = 0; i < json.length; i++) {
            const date = json[i].date
            // const dateNow = now.toISOString()
            if (date == nowString) {
              const shiftList = json[i].shift_id.split(',')
              for (j = 0; j < shiftList.length; j++) {
                listShiftToday.push(
                  shifts.find((item) => item.shift_id == shiftList[j])
                )
              }
            }
          }

          // lay shift hien tai
          const temp = await getListShiftEmp(com_id, idQLC, time)
          // const curShift = temp.shift[0]
          console.log(
            '------------------------------------------------------------------'
          )
          console.log(temp)
          console.log(
            '------------------------------------------------------------------'
          )
          // console.log(listShiftToday)
          const orgId = user.inForPerson.employee.organizeDetailId
          const posId = user.inForPerson.employee.position_id
          let fail = 0
          console.log(settings.length)
          for (let i = 0; i < settings.length; i++) {
            let flag = true
            const setting = settings[i]
            console.log(setting)
            const listDevice = setting.list_device
            const listOrg = setting.list_org
            const list_pos = setting.list_pos
            const list_emps = setting.list_emps
            const list_shifts = setting.list_shifts
            const list_wifi = setting.list_wifi
            // check device
            if (listDevice.length > 0 && !listDevice.includes(device)) {
              console.log(
                '--------------------------Vi phạm  listDevice----------------------------------------'
              )
              console.log('-------------------HERER DEVICEs-------------------')
              flag = false
            }

            // check org id
            // if (listOrg.length > 0 && !listOrg.includes(orgId)) {
            //   console.log('-------------------HERER ORG-------------------')
            //   console.log(
            //     '--------------------------Vi phạm  listOrg----------------------------------------'
            //   )
            //   flag = false
            // }
            // check pos id
            if (list_pos.length > 0 && !list_pos.includes(posId)) {
              console.log('-------------------HERER POS-------------------')
              console.log(
                '--------------------------Vi phạm  vitri----------------------------------------'
              )
              flag = false
            }
            // check id nhân viên
            if (list_emps.length > 0 && !list_emps.includes(idQLC)) {
              console.log('-------------------HERER EMPS-------------------')
              console.log(idQLC)
              console.log(list_emps)
              console.log(
                '--------------------------Vi phạm list_emps----------------------------------------'
              )
              flag = false
            }
            // check ca
            if (list_shifts.length > 0) {
              const tempShift = list_shifts.map((item) => item.id)

              // for (let j = 0; j < listShiftToday.length; j++) {
              //   const shift = listShiftToday[j]
              for (let j = 0; j < temp.shift.length; j++) {
                const idShift = temp.shift[j].shift_id
                if (!tempShift.includes(idShift)) {
                  console.log(
                    '-------------------HERER SHIFT-------------------'
                  )
                  flag = false
                }
              }
              // }
            }
            // check ip
            const curIpId = wifi.find((item) => item.ip_access == ip)
            console.log('--------------------------------')
            console.log(ip)
            console.log(curIpId)
            console.log('--------------------------------')
            let id_acc = curIpId ? curIpId.id : 0
            if (list_wifi.length > 0 && !list_wifi.includes(Number(id_acc))) {
              console.log('-------------------HERER IP-------------------')
              flag = false
            }

            // end
            console.log('----------------------------------------------')
            console.log(flag)
            console.log('----------------------------------------------')
            if (flag) {
              console.log(
                'sucessssssssssssssssssssssssssssssssssssssssssssssssss'
              )
              break
            } else fail++
          }
          console.log(fail)
          if (fail == settings.length) {
            console.log(
              '--------------------------Vi phạm điều kiện cài đặt chấm công----------------------------------------'
            )
            return functions.setError(
              res,
              'Vi phạm điều kiện cài đặt chấm công',
              500
            )
          }
        }
        console.log(
          '--------------------------BAT DAU CHAM CONG----------------------------------------'
        )
        // lấy thông tin ca nhân viên
        const shiftInfo = await getListShiftEmp(com_id, idQLC, time)
        if (shiftInfo.success) {
          // nếu không tồn tại ca -> vẫn chấm công
          if (shiftInfo.shift.length == 0) {
            console.log(
              '----------------------NO SHIFT START------------------------------'
            )
            const noShift = await insertTimeKeeping(
              com_id,
              idQLC,
              time,
              lat,
              long,
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
            console.log(
              '----------------------1 SHIFT START------------------------------'
            )
            const oneShift = await insertTimeKeeping(
              com_id,
              idQLC,
              time,
              lat,
              long,
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
            console.log(
              '----------------------2 SHIFT START------------------------------'
            )
            let image = null
            let success = 0

            for (let i = 0; i < shiftInfo.shift.length; i++) {
              const temp_shift_id = shiftInfo.shift[i].shift_id
              const tempShift = await insertTimeKeeping(
                com_id,
                idQLC,
                time,
                lat,
                long,
                ip,
                temp_shift_id,
                img
              )
              if (!image) image = tempShift.data.image
              if (tempShift.success) success++
            }

            if (success == 2) {
              return functions.success(res, 'Điểm danh thành công', { image })
            }
            console.log('Điểm danh 2 ca lỗi')
            return functions.setError(res, 'Điểm danh 2 ca lỗi', 500)
          }

          console.log('Điểm danh lỗi')
          return functions.setError(res, 'Điểm danh lỗi', 500)
        }
        console.log(shiftInfo.message)
        return functions.setError(res, shiftInfo.message, 500)
      }
      console.log(
        '--------------------THIEU TRUONG-------------------------------'
      )
      return functions.setError(
        res,
        'Thiếu 1 trong số các trường idQLC, img, IP, time',
        500
      )
    }

    return functions.setError(res, 'Token khong hop le')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message, 500)
  }
}

// Chấm công cá nhân web
const PersonalSetting = require('../../models/qlc/PersonalSettingIP')

exports.saveHisWebEmp = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    const idQLC = req.user.data.idQLC

    if (type == 2) {
      // lay setting personal
      const personal = await PersonalSetting.aggregate([
        {
          $match: {
            com_id: Number(com_id),
            user_id: Number(idQLC),
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ])
      if (personal) {
        const { img, lat, long, ip, time } = req.body
        if (img && lat && long && ip && time) {
          // lay ca
          const shiftInfo = await getListShiftEmp(com_id, idQLC, time)
          // console.log(shiftInfo);
          if (shiftInfo.success) {
            // lap cac ca -> tim thong tin personal
            const listShift = shiftInfo.shift
            if (listShift) {
              for (let i = 0; i < listShift.length; i++) {
                const shift_id = listShift[i].shift_id

                // tim trong personal
                const found = personal.find((item) => item.shift_id == shift_id)

                if (found) {
                  const listIps = found.ip_access.arr_ip.split(',')
                  // const listLocation = found.loc_access
                  // check ip
                  const foundIp = listIps.find((item) => item == ip)
                  // check time

                  const timeStart = new Date(found.time_start)
                  const timeEnd = new Date(found.time_end)

                  const timeCheckin = new Date(time)

                  // if (!(timeStart < timeCheckin) || !(timeCheckin < timeEnd)) {
                  //     console.log('thoi gian k hop le')
                  //     return functions.setError(res, 'Thoi gian khong hop le', 503)
                  // }
                  if (!foundIp) {
                    console.log('IP k hop le')
                    return functions.setError(res, 'IP khong hop le', 503)
                  }

                  // cham cong

                  // nếu không tồn tại ca -> vẫn chấm công
                  console.log(shiftInfo)
                  if (shiftInfo.shift.length == 0) {
                    const noShift = await insertTimeKeeping(
                      com_id,
                      idQLC,
                      time,
                      lat,
                      long,
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
                    console.log(8888888888888888888)
                    console.log(shiftInfo)
                    const oneShift = await insertTimeKeeping(
                      com_id,
                      idQLC,
                      time,
                      lat,
                      long,
                      ip,
                      shiftInfo.shift[0].shift_id,
                      img
                    )
                    console.log(8888888888888888888)
                    console.log(oneShift)
                    return oneShift.success
                      ? functions.success(res, 'Chấm công thành công', {
                          ep_name: shiftInfo.ep_name,
                          shift: shiftInfo.shift,
                          image: oneShift.data.image,
                        })
                      : functions.setError(res, oneShift.message, 503)
                  }
                  // tồn tại 2 ca 1 luc
                  else if (shiftInfo.shift.length == 2) {
                    let image = null
                    let ep_name
                    console.log(shiftInfo)
                    for (let i = 0; i < shiftInfo.shift.length; i++) {
                      let success = 0
                      const temp_shift_id = shiftInfo.shift[i]
                      const tempShift = await insertTimeKeeping(
                        com_id,
                        idQLC,
                        time,
                        lat,
                        long,
                        ip,
                        temp_shift_id,
                        img
                      )
                      if (!image) image = tempShift.data.image
                      ep_name = tempShift.ep_name
                      if (tempShift.success) success++
                    }

                    if (success == 2) {
                      return functions.success(res, 'Điểm danh thành công', {
                        ep_name: ep_name,
                        shift: shiftInfo.shift,
                        image: img,
                      })
                    }
                    console.log('Điểm danh 2 ca lỗi')
                    return functions.setError(res, 'Điểm danh 2 ca lỗi', 503)
                  }

                  console.log('Điểm danh lỗi')
                  return functions.setError(res, 'Điểm danh lỗi', 503)
                }
              }
            }
            console.log('ca k hop le', com_id, idQLC)
            return functions.setError(res, 'Ca lam viec khong hop le', 503)
          }
          return functions.setError(res, shiftInfo.message, 500)
        }
        return functions.setError(res, 'Thieu truong truyen len', 500)
      }
      console.log(123123123123)
      return functions.setError(res, 'Khong ton tai cai dat ca nhan', 503)
    }
    return functions.setError(
      res,
      'Tai khoan khong phai tai khoan nhan vien',
      500
    )
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message)
  }
}

// lấy thông tin chấm công latest -> ra hay vào
exports.getLatestInOutUser = async (req, res) => {
  try {
    const TYPE_IN = 'Ca vào'
    const TYPE_OUT = 'Ca ra'
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    const idQLC = req.user.data.idQLC
    if (type == 2) {
      // const { idQLC } = req.body
      if (idQLC) {
        // lấy thông tin timesheet gần nhất
        const timesheetLatest = await TimeSheets.aggregate([
          {
            $match: {
              ts_com_id: Number(com_id),
              ep_id: Number(idQLC),
            },
          },
          {
            $sort: {
              at_time: -1,
            },
          },
          { $limit: 1 },
          {
            $project: {
              _id: 0,
            },
          },
        ])

        let finalData = {}

        if (timesheetLatest.length > 0) {
          const temp = timesheetLatest[0]
          // lay data shift
          const shiftData = await Shifts.aggregate([
            {
              $match: {
                shift_id: Number(temp.shift_id),
                com_id: Number(com_id),
              },
            },
            {
              $project: {
                _id: 0,
              },
            },
          ])
          let shift_type_name = ''
          if (shiftData.length > 0) {
            const shift = shiftData[0]
            let startShift = shift.start_time
            let endShift = shift.end_time
            let startTimeLatest = shift.start_time_latest
            let endTimeEarliest = shift.end_time_earliest
            const date = new Date(temp.at_time)
            let hour = date.getHours(),
              minute = date.getMinutes(),
              second = date.getSeconds()
            hour = hour >= 10 ? hour : `0${hour}`
            minute = minute >= 10 ? minute : `0${minute}`
            second = second >= 10 ? second : `0${second}`
            const hourNow = `${hour}:${minute}:${second}`

            if (
              startTimeLatest &&
              hourNow >= startTimeLatest &&
              hourNow < endShift
            ) {
              shift_type_name = TYPE_IN
            } else if (
              endTimeEarliest &&
              hourNow < endTimeEarliest &&
              hourNow > endShift
            ) {
              shift_type_name = TYPE_OUT
            } else if (
              !startTimeLatest &&
              hourNow >= startShift &&
              hourNow < endShift
            ) {
              shift_type_name = TYPE_IN
            } else if (!endTimeEarliest && hourNow > endShift) {
              shift_type_name = TYPE_OUT
            }
          }

          finalData = {
            ...temp,
            shift_type_name: shift_type_name,
          }
        }

        return functions.success(res, 'Lấy thành công', { data: finalData })
      }

      return functions.setError(res, 'Truyền thiếu trường idQLC')
    }

    return functions.setError(res, 'Không phải tài khoản nhan vien')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message)
  }
}

// lọc thông tin
exports.filterCompData = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    const type = req.user.data.type

    if (type == 1) {
      const { orgId, posId, idQLC, shiftId, wfId, loId, ipId } = req.body

      // lay thong tin
      let userCondition = {
        'inForPerson.employee.com_id': Number(com_id),
        type: 2,
        'inForPerson.employee.ep_status': 'Active',
        authentic: 1,
      }
      if (orgId && orgId.length > 0)
        userCondition = {
          ...userCondition,
          'inForPerson.employee.listOrganizeDetailId': { $all: orgId },
        }
      if (posId && posId.length > 0)
        userCondition = {
          ...userCondition,
          'inForPerson.employee.position_id': { $in: posId },
        }
      const promiseData = await Promise.all([
        // phong ban
        OrganizeDetail.aggregate([
          {
            $match: {
              comId: Number(com_id),
            },
          },
        ]),
        //
        Position.aggregate([{ $match: { comId: Number(com_id) } }]),
        Users.aggregate([
          { $match: userCondition },
          {
            $lookup: {
              from: 'QLC_OrganizeDetail',
              localField: 'inForPerson.employee.organizeDetailId',
              foreignField: 'id',
              pipeline: [
                {
                  $match: {
                    comId: Number(com_id),
                  },
                },
              ],
              as: 'dep',
            },
          },

          {
            $project: {
              userName: 1,
              idQLC: 1,
              dep: '$dep',
              posId: '$inForPerson.employee.position_id',
            },
          },
        ]),
        Shifts.aggregate([{ $match: { com_id: Number(com_id) } }]),
        SettingWifi.aggregate([{ $match: { id_com: Number(com_id) } }]),
        Location.aggregate([{ $match: { id_com: Number(com_id) } }]),
        // Wifi.aggregate([{ $match: { com_id: Number(com_id) } }]),
      ])

      const listOrg = promiseData[0] || []
      const listPos = promiseData[1] || []
      const listUsers = promiseData[2] || []
      let listShifts = promiseData[3] || []
      // const listIp = promiseData[4] || []
      const listLoc = promiseData[5] || []
      const listWifi = promiseData[4] || []
      let tempDataShift = []
      if (
        idQLC &&
        idQLC.length > 0 &&
        idQLC.length < 10 &&
        !idQLC.includes('all')
      ) {
        // lay list llv
        const now = new Date()
        let firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        let lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const listId = idQLC.map((item) => Number(item))
        const shiftDocs = await Shifts.find({ com_id: Number(com_id) })
        const listllv = await EmployeeCycle.aggregate([
          {
            $match: {
              ep_id: { $in: listId },
            },
          },
          {
            $lookup: {
              from: 'CC365_Cycle',
              localField: 'cy_id',
              foreignField: 'cy_id',
              pipeline: [
                {
                  $match: {
                    apply_month: {
                      $gte: firstDay,
                      $lte: lastDay,
                    },
                    com_id: Number(com_id),
                  },
                },
              ],
              as: 'cycle',
            },
          },
          {
            $unwind: '$cycle',
          },
        ])
        const listShifId = []
        for (let i = 0; i < listllv.length; i++) {
          const detail = listllv[i].cycle.cy_detail
          const json = JSON.parse(detail)

          for (let j = 0; j < json.length; j++) {
            const item = json[j]
            item.shift_id.split(',').forEach((item) => {
              if (!listShifId.includes(item) && item) {
                // const shiftData = shiftDocs.find(s => s.shift_id == item)
                listShifId.push(item)
              }
            })
          }
        }

        const tempShifts = listShifId.map((item) =>
          listShifts.find((s) => s.shift_id == item)
        )

        tempDataShift = tempShifts
      } else {
        tempDataShift = listShifts
      }
      console.log(tempDataShift)

      // loc shift theo ca vao - ra
      let tempShift = []
      tempDataShift.forEach((item) => {
        console.log(item)
        tempShift.push({
          ...item,
          type: 1,
        })

        tempShift.push({
          ...item,
          type: 2,
        })
      })
      console.log(tempShift)
      return functions.success(res, 'Lay thanh cong', {
        listOrg: listOrg,
        listPos: listPos,
        listUsers: listUsers,
        listShifts: tempShift,
        // listIp: listIp,
        listLoc: listLoc,
        listWifi: listWifi,
      })
    }

    return functions.setError(res, 'Không phải tài khoản công ty')
  } catch (err) {
    console.log(err)
    return functions.setError(res, err.message)
  }
}

// chấm công web áp dụng cài đặt mới

const formatDate = (d) =>
  [
    d.getFullYear(),
    (d.getMonth() + 1).toString().padStart(2, '0'),
    d.getDate().toString().padStart(2, '0'),
  ].join('-')

const SettingTimesheet = require('../../models/qlc/SettingTimesheet')
exports.saveHisForWebNew = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    if (com_id && type == 1) {
      const idQLC = req.body.idQLC
      const img = req.body.img
      const lat = req.body.lat
      const long = req.body.long
      const ip = req.body.ip
      const time = req.body.time
      const device = req.body.device

      if (idQLC && img && ip && time && device) {
        //lấy thông tin nhân viên
        const user = await Users.findOne({
          idQLC: Number(idQLC),
          type: 2,
          'inForPerson.employee.com_id': Number(com_id),
        }).lean()
        if (!user) return functions.setError(res, 'Không tìm thấy nhân viên')
        // lấy thông tin cài đặt chấm công
        const now = new Date(time)
        const settings = await SettingTimesheet.find({
          com_id: Number(com_id),
          start_time: { $lte: now },
          end_time: { $gte: now },
        })
        console.log(settings)

        // check thông tin có được chấm công hay không
        // đối với web chỉ cần check phòng ban, vị trí, idqlc, ca, ip, thiết bị
        // danh sách thiết bị:     'web', 'app', 'qrchat'
        // lấy các thông tin

        // thông tin ca ngày hôm đó

        let firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        let lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const llv = await EmployeeCycle.aggregate([
          {
            $match: {
              ep_id: Number(idQLC),
            },
          },
          {
            $lookup: {
              from: 'CC365_Cycle',
              localField: 'cy_id',
              foreignField: 'cy_id',
              pipeline: [
                {
                  $match: {
                    apply_month: { $lte: lastDay, $gte: firstDay },
                    com_id: Number(com_id),
                  },
                },
              ],
              as: 'cycle',
            },
          },
          {
            $unwind: '$cycle',
          },
        ])
        const shifts = await Shifts.find({ com_id: Number(com_id) }).lean()
        const ips = await SettingIP.find({ id_com: Number(com_id) }).lean()
        // console.log(shifts)
        if (llv.length < 1)
          return functions.setError(
            res,
            'Nhân viên không tồn tại lịch làm việc',
            500
          )

        const cy_detail = llv[0].cycle.cy_detail

        const json = JSON.parse(cy_detail)
        const nowString = formatDate(now)
        const listShiftToday = []
        for (let i = 0; i < json.length; i++) {
          const date = json[i].date
          // const dateNow = now.toISOString()
          if (date == nowString) {
            const shiftList = json[i].shift_id.split(',')
            for (j = 0; j < shiftList.length; j++) {
              listShiftToday.push(
                shifts.find((item) => item.shift_id == shiftList[j])
              )
            }
          }
        }
        console.log(listShiftToday)
        const orgId = user.inForPerson.employee.organizeDetailId
        const posId = user.inForPerson.employee.position_id

        for (let i = 0; i < settings.length; i++) {
          let flag = true
          const setting = settings[i]
          const listDevice = setting.list_device
          const listOrg = setting.list_org
          const list_pos = setting.list_pos
          const list_emps = setting.list_emps
          const list_shifts = setting.list_shifts
          const list_ip = setting.list_ip
          // check device
          if (listDevice.length > 0 && !listDevice.includes(device))
            flag = false
          // check org id
          if (listOrg.length > 0 && !listOrg.includes(orgId)) flag = false
          // check pos id
          if (list_pos.length > 0 && !list_pos.includes(posId)) flag = false
          // check id nhân viên
          if (list_emps.length > 0 && !list_emps.includes(idQLC)) flag = false
          // check ca
          if (list_shifts.length > 0) {
            for (let j = 0; j < listShiftToday.length; j++) {
              const shift = listShiftToday[j]
              if (!list_shifts.includes(shift.shift_id)) {
                flag = false
              }
            }
          }
          // check ip
          const curIpId = ips.find((item) => item.ip_access == ip).id_acc

          if (list_ip.length > 0 && !list_ip.includes(curIpId)) {
            flag = false
          }

          // end
          if (flag) break
        }
        console.log(
          'Bat dau cham cong---------------------------------------------------------'
        )
        const shiftInfo = await getListShiftEmp(com_id, idQLC, time)
        console.log(shiftInfo)
        if (shiftInfo.success) {
          // nếu không tồn tại ca -> vẫn chấm công
          if (shiftInfo.shift.length == 0) {
            const noShift = await insertTimeKeeping(
              com_id,
              idQLC,
              time,
              lat,
              long,
              ip,
              0,
              img
            )
            console.log(
              'ket thuc cham cong 0 shift-----------------------------------------------------'
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
              lat,
              long,
              ip,
              shiftInfo.shift[0].shift_id,
              img
            )
            console.log(
              'ket thuc cham cong 1 shift -----------------------------------------------------'
            )
            return oneShift.success
              ? functions.success(res, 'Chấm công thành công', {
                  idQLC: idQLC,
                  ep_name: shiftInfo.ep_name,
                  shift: shiftInfo.shift,
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
                lat,
                long,
                ip,
                temp_shift_id,
                img
              )
              if (!image) image = tempShift.data.image
              if (tempShift.success) success++
            }

            if (success == 2) {
              console.log(
                'ket thuc cham cong 2 shift-----------------------------------------------------'
              )
              return functions.success(res, 'Điểm danh thành công', { image })
            }
            console.log('Điểm danh 2 ca lỗi')
            return functions.setError(res, 'Điểm danh 2 ca lỗi', 500)
          }

          console.log('Điểm danh lỗi')
          return functions.setError(res, 'Điểm danh lỗi', 500)
        }
        console.log(shiftInfo.message)
        return functions.setError(res, shiftInfo.message, 500)
      }
      return functions.setError(
        res,
        'Thiếu 1 trong số các trường idQLC, img, IP, time, device',
        500
      )
    }

    return functions.setError(res, 'Tài khoản không phải tài khoản công ty')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message, 500)
  }
}
