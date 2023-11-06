const Cycle = require('../../models/qlc/Cycle')
const EmployeCycle = require('../../models/qlc/CalendarWorkEmployee')
const functions = require('../../services/functions')
const Users = require('../../models/Users')
const service = require('../../services/qlc/functions')
const BasicSal = require('../../models/Tinhluong/Tinhluong365SalaryBasic')
const TimeSheet = require('../../models/qlc/TimeSheets')
const moment = require('moment')
//Lấy danh sách toàn bộ lịch làm việc

exports.getAllCalendarCompany = async (req, res) => {
  try {
    const com_id = req.user.data.com_id,
      type = req.user.data.type
    let condition = { com_id: Number(com_id) }

    const year = req.body.year
    const month = req.body.month
    const endDate = new Date(year, month, 0)
    const startDate = new Date(year, Number(month) - 1, 0)
    console.log(startDate)
    console.log(endDate)
    if (year && month) {
      condition = {
        ...condition,
        apply_month: {
          $gte: startDate,
          $lte: endDate,
        },
      }
    }

    if (type == 1) {
      const cy_id = req.body.cy_id

      if (cy_id) condition.cy_id = cy_id
      const data = await Cycle.aggregate([
        {
          $match: condition,
        },
        {
          $project: {
            _id: 0,
          },
        },
      ])

      // lay tat ca epcy
      const epcyList = await EmployeCycle.aggregate([
        {
          $match: {
            update_time: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'ep_id',
            foreignField: 'idQLC',
            as: 'user',
            pipeline: [
              {
                $match: {
                  'inForPerson.employee.com_id': Number(com_id),
                  type: 2,
                },
              },
            ],
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            cy_id: 1,
            ep_id: 1,
          },
        },
      ])

      for (let i = 0; i < data.length; i++) {
        const element = data[i]
        if (element.cy_id == 2000434) console.log(epcyList)
        element.cy_detail = JSON.parse(element.cy_detail) || null
        element.ep_count = epcyList.filter(
          (item) => item.cy_id == element.cy_id
        ).length

        if (element.ep_count == 2)
          console.log(epcyList.filter((item) => item.cy_id == element.cy_id))
      }

      return functions.success(res, 'lấy thành công ', { data })
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message)
  }
}

//Tạo một lịch làm việc mới
exports.create = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    const type = req.user.data.type
    if (type == 1) {
      const { cy_name, apply_month, cy_detail, is_personal } = req.body
      if (cy_name && apply_month && cy_detail) {
        // Kiểm tra tên llv đã tồn tại hay chưa
        const check_cy_name = await Cycle.findOne({
          cy_name: cy_name,
          com_id: com_id,
          apply_month: apply_month,
        })
        if (!check_cy_name) {
          // Tạo mới
          const calendar_max = await Cycle.findOne({}, { cy_id: 1 })
            .sort({ cy_id: -1 })
            .lean()
          const calendar = new Cycle({
            cy_id: Number(calendar_max.cy_id) + 1,
            com_id: com_id,
            cy_name: cy_name,
            apply_month: apply_month,
            cy_detail: cy_detail,
            is_personal: is_personal,
          })
          await calendar.save()
          return functions.success(res, 'Lưu lịch làm việc thành công', {
            data: {
              cy_id: Number(calendar_max.cy_id) + 1,
              com_id: com_id,
              cy_name: cy_name,
              apply_month: apply_month,
              cy_detail: cy_detail,
              is_personal: is_personal,
            },
          })
        }
        return functions.setError(res, 'Lịch làm việc trong tháng đã tồn tại')
      }
      return functions.setError(
        res,
        'nhập thiếu tên lịch làm việc, tháng áp dụng, chi tiết'
      )
    }
    return functions.setError(res, 'Tài khoản không phải Công ty', 604)
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message)
  }
}

// Chi tiết
exports.detail = async (req, res) => {
  try {
    const user = req.user.data
    const id_ep = req.body.id_ep
    if (id_ep) {
      const employee = await Users.findOne({
        idQLC: id_ep,
        type: 2,
        'inForPerson.employee.com_id': user.com_id,
      }).lean()

      if (employee) {
        //const employee_cycle = await EmployeCycle.find({ ep_id: Number(id_ep) });
        //let item = {};
        // if (employee_cycle) {
        //     const cycle = await Cycle.findOne({ cy_id:employee_cycle[0] });
        // return functions.success(cycle , 'Lay thanh cong')
        //}
        //return functions.setError(res, "Kh�ng t�m th?y lich lam viec");
      }
      return functions.setError(res, 'Kh�ng t�m th?y nh�n vi�n')
    }
    return functions.setError(res, 'Thiếu ID nhân viên')
  } catch (error) {}
}

//Chỉnh sửa một lịch làm việc đã có sẵn
exports.edit = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    const type = req.user.data.type
    if (type == 1) {
      const { cy_id, cy_name, status, apply_month, is_personal, cy_detail } =
        req.body
      if (cy_id && cy_name && apply_month && cy_detail) {
        const calendar = await functions.getDatafindOne(Cycle, { cy_id: cy_id })
        if (calendar) {
          // Kiểm tra tên llv đã tồn tại hay chưa
          const check_cy_name = await Cycle.findOne({
            cy_name: cy_name,
            com_id: com_id,
            apply_month: apply_month,
            cy_id: { $ne: cy_id },
          })
          if (!check_cy_name) {
            await Cycle.updateOne(
              { cy_id: cy_id },
              {
                $set: {
                  cy_name: cy_name,
                  apply_month: apply_month,
                  is_personal: is_personal,
                  cy_detail: cy_detail,
                },
              }
            )
            return functions.success(res, 'Sửa thành công')
          }
          return functions.setError(res, 'Lịch làm việc trong tháng đã tồn tại')
        }
        return functions.setError(res, 'lịch không tồn tại')
      }
      return functions.setError(
        res,
        'nhập thiếu tên lịch làm việc, tháng áp dụng, chi tiết'
      )
    }
    return functions.setError(res, 'Tài khoản không phải Công ty', 604)
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

//Copy một lịch làm việc đã có sẵn
exports.copyCalendar = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    // const com_id = req.body.com_id
    const type = req.user.data.type
    const cy_id = req.body.cy_id
    if (type == 1) {
      const calendar = await functions.getDatafindOne(Cycle, {
        com_id: com_id,
        cy_id: cy_id,
      })
      if (calendar) {
        let maxId =
          (await Cycle.findOne({}, {}, { sort: { cy_id: -1 } }).lean()) || 0
        const newId = Number(maxId.cy_id) + 1
        const newCalendar = new Cycle({
          ...calendar,
          _id: undefined,
          cy_id: newId,
        })
        await newCalendar.save()
        return functions.success(res, 'copy thành công', { newCalendar })
      }
      return functions.setError(res, 'lịch không tồn tại')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

//copy list
const formatDate = (date) => {
  var getYear = date.toLocaleString('default', { year: 'numeric' })
  var getMonth = date.toLocaleString('default', { month: '2-digit' })
  var getDay = date.toLocaleString('default', { day: '2-digit' })

  return getYear + '-' + getMonth + '-' + getDay
}

exports.copyListCalendars = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    // const com_id = req.body.com_id
    const type = req.user.data.type
    const list = req.body.listIds
    const month = req.body.month
    const now = new Date(month)
    console.log(now)
    if (type == 1) {
      const arr = list.split(',')
      for (let i = 0; i < arr.length; i++) {
        const cy_id = arr[i]
        const calendar = await functions.getDatafindOne(Cycle, {
          com_id: Number(com_id),
          cy_id: Number(cy_id),
        })
        if (calendar) {
          let maxId =
            (await Cycle.findOne({}, {}, { sort: { cy_id: -1 } }).lean()) || 0
          const newId = Number(maxId.cy_id) + 1

          let newCyDetail = []
          const curCyDetail = JSON.parse(calendar.cy_detail)
          const shift_id = curCyDetail[0].shift_id
          // for (let i = 0; i < curCyDetail.length; i++) {
          const inputMonth = now.getMonth()
          const inputYear = now.getFullYear()
          const lastDateOfMonth = new Date(
            Number(inputYear),
            Number(inputMonth) + 1,
            0
          )
          const lastDayOfMonth = lastDateOfMonth.getDate()

          // loop
          for (let i = 1; i <= lastDayOfMonth; i++) {
            const day = new Date(Number(inputYear), Number(inputMonth), i)
            const newDate = formatDate(day)
            const dayInWeek = day.getDay()
            if (dayInWeek != 0)
              newCyDetail.push({ date: newDate, shift_id: shift_id })
            // }
          }

          // console.log(newCyDetail)
          const newCalendar = new Cycle({
            ...calendar,
            cy_name: 'Bản sao của ' + calendar.cy_name,
            cy_detail: JSON.stringify(newCyDetail),
            _id: undefined,
            apply_month: now,
            cy_id: newId,
          })
          await newCalendar.save()
        }
      }

      return functions.success(res, 'copy thành công', {})
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

//Xóa một lịch làm việc đã có sẵn
exports.deleteCalendar = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    // const com_id = req.body.com_id
    const type = req.user.data.type
    const cy_id = req.body.cy_id
    if (type == 1) {
      const calendar = await functions.getDatafindOne(Cycle, {
        com_id: com_id,
        cy_id: cy_id,
      })
      if (calendar) {
        await functions.getDataDeleteOne(Cycle, {
          com_id: com_id,
          cy_id: cy_id,
        })

        // xóa kết nối với nhân viên
        await EmployeCycle.deleteMany({ cy_id: Number(cy_id) })

        return functions.success(res, 'xóa thành công', { calendar })
      }
      return functions.setError(res, 'lịch làm việc không tồn tại')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

//Xóa toàn bộ lịch làm việc của một công ty
exports.deleteCompanyCalendar = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    // const com_id = req.body.com_id
    const type = req.user.data.type
    if (type == 1) {
      const calendars = await functions.getDatafind(Cycle, { com_id: com_id })
      if (calendars) {
        await Cycle.deleteMany({ com_id: com_id })
        return functions.success(res, 'xóa thành công')
      }
      return functions.setError(res, 'lịch làm việc không tồn tại')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty', 604)
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

// Thêm nhân viên
exports.add_employee = async (req, res) => {
  try {
    const list_id = req.body.list_id
    const cy_id = req.body.cy_id
    const curMonth = req.body.curMonth
    const start = new Date(`${curMonth}-01`)
    const year = curMonth.split('-')[0]
    const month = curMonth.split('-')[1]
    const com_id = req.user.data.com_id
    const end = new Date(year, Number(month), 0)
    console.log('start')
    console.log(start)
    console.log('end')
    console.log(end)

    if (list_id && cy_id) {
      const array = list_id.split(',').map(Number)
      console.log(array)

      // lay data cy moi
      // const cyData = await Cycle.aggregate([{
      //         $match: {
      //             com_id: Number(com_id),
      //             cy_id: Number(cy_id)
      //         }
      //     },
      //     {
      //         $project: {
      //             _id: 0
      //         }
      //     }
      // ])
      // const inputCycleData = cyData[0]
      for (let index = 0; index < array.length; index++) {
        const ep_id = array[index]

        // check nhân viên đã có llv trước chưa
        const listLLV = await EmployeCycle.aggregate([
          {
            $match: {
              ep_id: ep_id,
            },
          },
          {
            $lookup: {
              from: 'CC365_Cycle',
              foreignField: 'cy_id',
              localField: 'cy_id',
              as: 'cycle',
              pipeline: [
                {
                  $match: {
                    apply_month: {
                      $gte: start,
                      $lte: end,
                    },
                  },
                },
              ],
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ])

        console.log(listLLV)
        // nếu còn llv từ trước -> xóa llv đó
        // if (listLLV.length > 0 && listLLV[0].cycle.length > 0) {
        //   // console.log(listLLV)
        //   // return functions.setError(res, 'Nhân viên đã tồn tại lịch làm việc')
        //   for (let i = 0; i < listLLV.length; i++) {
        //     const epcy_id = listLLV[i].epcy_id

        //     const delRes = await EmployeCycle.findOneAndDelete({
        //       epcy_id: epcy_id,
        //     })

        //     if (delRes) {
        //       console.log('Xóa thành công llv nhân viên ID: ' + epcy_id)
        //     }
        //   }
        // }
        //
        // sửa lịch sử chấm công -> nếu không có lịch làm việc
        // else {
        //     //lấy ngày bắt đầu tính lương
        //     const startTl = await BasicSal.aggregate([{
        //             $match: {
        //                 sb_id_com: Number(com_id),
        //                 sb_id_user: Number(ep_id)
        //             }
        //         },
        //         {
        //             $sort: {
        //                 sb_time_created: -1
        //             }
        //         },
        //         {
        //             $project: {
        //                 sb_time_up: 1
        //             }
        //         }
        //     ])

        //     if (startTl.length > 0) {
        //         const dateTl = new Date(startTl[0])

        //         // lấy data chấm công từ ngày bắt đầu tính lương đến now
        //         const year = dateTl.getFullYear()
        //         const month = dateTl.getMonth() + 1
        //         const endDate = new Date(year, month, 0)
        //         console.log(endDate)

        //         // lay du lieu cham cong
        //         const dataCCNoShift = await TimeSheet.aggregate([{
        //                 $match: {
        //                     ts_com_id: Number(com_id),
        //                     ep_id: Number(ep_id),
        //                     at_time: {
        //                         $gte: dateTl,
        //                         $lte: endDate
        //                     },
        //                     shift_id: 0
        //                 }
        //             },
        //             {
        //                 $project: {
        //                     sheet_id: 1,
        //                     shift_id: 1
        //                 }
        //             }
        //         ])

        //         if (dataCCNoShift) {

        //         }

        //     }
        // }

        const max = await EmployeCycle.findOne({}, { epcy_id: 1 })
          .sort({ epcy_id: -1 })
          .lean()

        // lay data llv
        const tempLLv = await Cycle.findOne({
          cy_id: Number(cy_id),
          com_id: Number(com_id),
        }).lean()
        console.log(tempLLv)

        const updateTime = new Date(tempLLv.apply_month + '-01')

        console.log(updateTime)

        const item = new EmployeCycle({
          epcy_id: Number(max.epcy_id) + 1,
          ep_id: ep_id,
          cy_id: cy_id,
          update_time: updateTime,
        })
        await item.save()
      }
      return functions.success(res, 'Thêm thành công')
    }
    return functions.setError(res, 'Chưa truyền id nhân viên')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error)
  }
}

// Loại bỏ nhân viên khỏi llv
exports.delete_employee = async (req, res) => {
  try {
    const { cy_id, ep_id } = req.body
    if (cy_id && ep_id) {
      const check = await EmployeCycle.findOne({
        cy_id: cy_id,
        ep_id: ep_id,
      })
      if (check) {
        await EmployeCycle.deleteOne({ epcy_id: check.epcy_id })
        return functions.success(res, 'Xóa thành công')
      }
      return functions.setError(res, 'Không tồn tại dữ liệu trùng khớp')
    }
    return functions.setError(res, 'Chưa truyền id nhân viên và id llv')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error)
  }
}

exports.list_employee = async (req, res) => {
  try {
    const { cy_id } = req.body
    const com_id = Number(req.user.data.com_id)
    if (cy_id) {
      // const page = req.body.page || 1,
      // pageSize = req.body.pageSize || 3
      const list = await EmployeCycle.aggregate([
        { $match: { cy_id: Number(cy_id) } },
        //{ $skip: (page - 1) * pageSize },
        //{ $limit: pageSize },
        {
          $lookup: {
            from: 'Users',
            foreignField: 'idQLC',
            localField: 'ep_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $match: {
            'user.type': 2,
            'user.idQLC': { $ne: 0 },
            'user.inForPerson.employee.com_id': com_id,
          },
        },
        {
          $lookup: {
            from: 'QLC_OrganizeDetail',
            localField: 'user.inForPerson.employee.organizeDetailId',
            foreignField: 'id',
            as: 'organizeDetail',
          },
        },
        {
          $unwind: {
            path: '$organizeDetail',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            ep_id: 1,
            ep_name: '$user.userName',
            dep_id: '$user.inForPerson.employee.dep_id',
            phone: '$user.phone',
            email: '$user.email',
            avatarUser: '$user.avatarUser',
            dep_name: '$organizeDetail.organizeDetailName',
          },
        },
      ])
      // const count = await EmployeCycle.countDocuments({ cy_id: Number(cy_id) });
      console.log('list')
      console.log(list)
      const count = list.length || 0
      console.log(count)
      for (let index = 0; index < list.length; index++) {
        const element = list[index]
        // element.dep_name = element.dep_name.toString()
        element.avatarUser = service.createLinkFileEmpQLC(
          element.idQLC,
          element.avatarUser
        )
      }

      return functions.success(res, 'Danh sách', { list, count })
    }
    return functions.setError(res, 'Chưa truyền id llv')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error)
  }
}

exports.list_not_in_cycle = async (req, res) => {
  try {
    const user = req.user.data
    const { apply_month, organizeDetailId } = req.body
    if (apply_month) {
      console.log(apply_month)
      const month = apply_month.split('-')[1]
      const year = apply_month.split('-')[0]
      console.log(Number(month) + 1)
      console.log(Number(year))
      const lastOfMonth = new Date(Number(year), Number(month), 0)
      console.log('lastOfMonth')
      console.log(lastOfMonth)
      const list_id = await Cycle.aggregate([
        {
          $match: {
            com_id: Number(user.com_id),
            apply_month: {
              $gte: new Date(`${apply_month}-01 00:00:00`),
              $lte: new Date(lastOfMonth),
            },
          },
        },
        {
          $lookup: {
            from: 'CC365_EmployeCycle',
            foreignField: 'cy_id',
            localField: 'cy_id',
            as: 'EmployeCycle',
          },
        },
        { $unwind: '$EmployeCycle' },
        {
          $project: {
            _id: 0,
            ep_id: '$EmployeCycle.ep_id',
          },
        },
      ])

      let list_in_cycle = []
      for (let i = 0; i < list_id.length; i++) {
        const element = list_id[i]
        list_in_cycle.push(element.ep_id)
      }

      // const page = req.body.page || 1,
      //     pageSize = Number(req.body.pageSize) || 20;
      let condition = {
        idQLC: { $nin: list_in_cycle },
        type: 2,
        'inForPerson.employee.ep_status': 'Active',
        'inForPerson.employee.com_id': Number(user.com_id),
      }

      if (organizeDetailId)
        condition = {
          ...condition,
          'inForPerson.employee.listOrganizeDetailId': {
            $all: organizeDetailId,
          },
        }

      const list_not_in_cycle = await Users.aggregate([
        {
          $match: condition,
        },
        { $sort: { ep_id: -1 } },
        // { $skip: (page - 1) * pageSize },
        // { $limit: pageSize },
        {
          $lookup: {
            from: 'QLC_OrganizeDetail',
            localField: 'inForPerson.employee.organizeDetailId',
            foreignField: 'id',
            as: 'organizeDetail',
          },
        },
        {
          $unwind: {
            path: '$organizeDetail',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            ep_id: '$idQLC',
            // ep_email: "$email",
            ep_name: '$userName',
            // ep_phone: "$phone",
            // ep_image: "$avatarUser",
            // ep_address: "$address",
            // ep_gender: "$inForPerson.account.gender",
            // position_id: "$inForPerson.employee.position_id",
            // ep_status: "$inForPerson.employee.ep_status",
            // com_id: "$inForPerson.employee.com_id",
            dep_id: '$organizeDetail.organizeDetailId',
            dep_name: '$organizeDetail.organizeDetailName',
            listOrganizeDetailId: '$inForPerson.employee.listOrganizeDetailId',
          },
        },
      ])
      // for (let j = 0; j < list_not_in_cycle.length; j++) {
      //     const element = list_not_in_cycle[j];
      //     // element.dep_id = element.dep_id.toString();
      //     element.dep_name = element.dep_name.toString();
      // }

      return functions.success(
        res,
        'Danh sách nhân viên chưa có lịch làm việc',
        { totalItems: list_not_in_cycle.length, items: list_not_in_cycle }
      )
    }
    return functions.setError(res, 'Chưa truyền ngày tháng năm')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message)
  }
}
