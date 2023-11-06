const Users = require('../../models/Users')
const functions = require('../../services/functions')
const service = require('../../services/qlc/functions')
const md5 = require('md5')
const AppUsers = require('../../models/qlc/AppUsers')
const OrganizeDetail = require('../../models/qlc/OrganizeDetail')
const { default: axios } = require('axios')
const CC365_TimeSheet = require('../../models/qlc/TimeSheets')
const CC365_Cycle = require('../../models/qlc/Cycle')
const Shift = require('../../models/qlc/Shifts')
const DeXuat = require('../../models/Vanthu/de_xuat')
const Tinhluong365SalaryBasic = require('../../models/Tinhluong/Tinhluong365SalaryBasic')
const Tinhluong365Contract = require('../../models/Tinhluong/Tinhluong365Contract')

//tìm danh sách
exports.getlistAdmin = async (req, res) => {
  try {
    const pageNumber = Number(req.body.pageNumber) || 1
    const pageSize = Number(req.body.pageSize) || 10
    const type = req.user.data.type
    let com_id = req.user.data.com_id
    let userName = req.body.userName
    let dep_id = req.body.dep_id
    const experience = Number(req.body.experience)
    const education = Number(req.body.education)
    const position_id = Number(req.body.position_id)
    const team_id = Number(req.body.team_id)
    const group_id = Number(req.body.group_id)
    const ep_id = Number(req.body.ep_id)
    const ep_status = req.body.ep_status || 'Active'
    let condition = {
      'inForPerson.employee.ep_status': ep_status,
      'inForPerson.employee.com_id': Number(com_id),
    }

    if (education) condition['inForPerson.account.education'] = education
    if (position_id) condition['inForPerson.employee.position_id'] = position_id
    if (team_id) condition['inForPerson.employee.team_id'] = team_id
    if (group_id) condition['inForPerson.employee.group_id'] = group_id
    if (userName) condition['userName'] = { $regex: userName } //tìm kiếm theo tên
    if (dep_id) condition['inForPerson.employee.dep_id'] = Number(dep_id) //tìmm kiếm theo tên phòng ban
    if (ep_id) condition['idQLC'] = Number(ep_id) //tìmm kiếm theo tên phòng ban
    let data = await Users.aggregate([
      { $match: condition },
      { $sort: { ep_id: -1 } },
      { $skip: (pageNumber - 1) * pageSize },
      { $limit: pageSize },
      {
        $lookup: {
          from: 'QLC_Deparments',
          localField: 'inForPerson.employee.dep_id',
          foreignField: 'dep_id',
          as: 'deparment',
        },
      },
      {
        $lookup: {
          from: 'QLC_Groups',
          localField: 'inForPerson.employee.group_id',
          foreignField: 'gr_id',
          as: 'Groups',
        },
      },

      {
        $project: {
          _id: 1,
          ep_id: '$idQLC',
          ep_email: '$email',
          ep_email_lh: '$emailContact',
          ep_phone_tk: '$phoneTK',
          ep_name: '$userName',
          ep_education: '$inForPerson.account.education',
          ep_exp: '$inForPerson.account.experience',
          ep_phone: '$phone',
          ep_image: '$avatarUser',
          ep_address: '$address',
          ep_gender: '$inForPerson.account.gender',
          ep_married: '$inForPerson.account.married',
          ep_birth_day: '$inForPerson.account.birthday',
          ep_description: '$inForPerson.employee.ep_description',
          create_time: '$createdAt',
          role_id: '$role',
          group_id: '$inForPerson.employee.group_id',
          start_working_time: '$inForPerson.employee.start_working_time',
          position_id: '$inForPerson.employee.position_id',
          ep_status: '$inForPerson.employee.ep_status',
          allow_update_face: '$inForPerson.employee.allow_update_face',
          com_id: '$inForPerson.employee.com_id',
          dep_id: '$inForPerson.employee.dep_id',
          dep_name: '$deparment.dep_name',
          gr_name: '$Groups.gr_name',
        },
      },
    ])
    const count = await Users.countDocuments(condition)
    for (let index = 0; index < data.length; index++) {
      const element = data[index]
      element.dep_name = element.dep_name.toString()
      element.gr_name = element.gr_name.toString()
    }

    return functions.success(res, 'Lấy thành công', {
      totalItems: count,
      items: data,
    })
  } catch (err) {
    console.log(err)
    functions.setError(res, err.message)
  }
}

// lấy ds nhân viên cả chưa duyệt
exports.getlistAdminAll = async (req, res) => {
  try {
    const pageNumber = req.body.pageNumber || 1
    const type = req.user.data.type
    let com_id = req.body.com_id
    let userName = req.body.userName
    let dep_id = req.body.dep_id

    if (type == 1) {
      let condition = {
        // "inForPerson.employee.ep_status": "Active",
        'inForPerson.employee.com_id': Number(com_id),
      }

      if (com_id) {
        if (userName) condition['userName'] = { $regex: userName } //tìm kiếm theo tên
        if (dep_id) condition['inForPerson.employee.dep_id'] = Number(dep_id) //tìmm kiếm theo tên phòng ban

        let data = await Users.aggregate([
          { $match: condition },
          { $sort: { _id: -1 } },
          { $skip: (pageNumber - 1) * 10 },
          { $limit: 10 },
          {
            $lookup: {
              from: 'QLC_Deparments',
              localField: 'inForPerson.employee.dep_id',
              foreignField: 'dep_id',
              as: 'deparment',
            },
          },
          {
            $project: {
              userName: '$userName',
              dep_id: '$inForPerson.employee.dep_id',
              com_id: '$inForPerson.employee.com_id',
              position_id: '$inForPerson.employee.position_id',
              phoneTK: '$phoneTK',
              email: '$email',
              emailContact: '$emailContact',
              idQLC: '$idQLC',
              nameDeparment: '$deparment.dep_name',
              gender: '$inForPerson.employee.gender',
              married: '$inForPerson.employee.married',
              address: '$address',
              position_id: '$inForPerson.employee.position_id',
              ep_status: '$inForPerson.employee.ep_status',
              avatarUser: '$avatarUser',
            },
          },
        ])
        const count = await Users.countDocuments(condition)
        for (let index = 0; index < data.length; index++) {
          const element = data[index]
          element.nameDeparment = element.nameDeparment.toString()
        }
        return await functions.success(res, 'Lấy thành công', {
          data,
          count,
        })
      }
      return functions.setError(res, 'thiếu com_id')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (err) {
    console.log(err)
    functions.setError(res, err.message)
  }
}

//tao nv
exports.createUser = async (req, res) => {
  try {
    const type = req.user.data.type,
      com_id = req.body.com_id
    const {
      userName,
      phoneTK,
      emailContact,
      password,
      role,
      address,
      birthday,
      dep_id,
      group_id,
      team_id,
      position_id,
      gender,
      education,
      married,
      experience,
      start_working_time,
    } = req.body
    if (type == 1) {
      if (
        com_id &&
        userName &&
        password &&
        role &&
        address &&
        position_id &&
        gender
      ) {
        //Kiểm tra tên nhân viên khác null

        const manager = await functions.getDatafindOne(Users, {
          phoneTK: phoneTK,
          type: { $ne: 1 },
        })
        if (!manager) {
          //Lấy ID kế tiếp, nếu chưa có giá trị nào thì bằng 0 có giá trị max thì bằng max + 1
          let maxID = await functions.getMaxUserID()
          const ManagerUser = new Users({
            _id: maxID._id,
            idQLC: maxID._idQLC,
            idTimViec365: maxID._idTV365,
            idRaoNhanh365: maxID._idRN365,
            'inForPerson.employee.com_id': com_id,
            userName: userName,
            phoneTK: phoneTK,
            emailContact: emailContact,
            password: md5(password),
            address: address,
            role: role,
            'inForPerson.account.gender': gender,
            'inForPerson.account.birthday': Date.parse(birthday) / 1000,
            'inForPerson.account.education': education,
            'inForPerson.account.married': married,
            'inForPerson.account.experience': experience,
            'inForPerson.employee.start_working_time':
              Date.parse(start_working_time) / 1000,
            'inForPerson.employee.dep_id': dep_id,
            'inForPerson.employee.position_id': position_id,
            'inForPerson.employee.group_id': group_id,
            'inForPerson.employee.team_id': team_id,
            'inForPerson.employee.ep_status': 'Active',
            fromWeb: 'quanlychung',
            type: 2,
            createdAt: functions.getTimeNow(),
            chat365_secret: functions.chat365_secret(maxID._id),
          })

          await ManagerUser.save()

          const listApp = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
            20, 21, 22, 23, 24, 25, 26, 27,
          ]
          const maxId =
            (await AppUsers.findOne(
              {},
              { id: 1 },
              { sort: { id: -1 } }
            ).lean()) || 0
          const id = Number(maxId.id) + 1 || 1
          const data = new AppUsers({
            id: id,
            ep_id: ManagerUser.idQLC,
            app_id: listApp,
            com_id: com_id,
            create_time: functions.getTimeNow(),
            update_time: functions.getTimeNow(),
          })

          await data.save()
          return functions.success(res, 'user created successfully')
        }
        return functions.setError(res, 'Tài khoản đã tồn tại!')
      }
      return functions.setError(res, 'Cần nhập đủ thông tin')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

// chỉnh sửa
exports.editUser = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    const {
      ep_name,
      phoneTK,
      emailContact,
      password,
      role,
      address,
      ep_birth_day,
      dep_id,
      group_id,
      team_id,
      position_id,
      ep_gender,
      education,
      married,
      experience,
      ep_id,
      start_working_time,
    } = req.body

    console.log(req.body)

    if (type == 1) {
      //Kiểm tra tên nhân viên khác null

      const manager = await Users.findOne({
        idQLC: ep_id,
        type: 2,
        'inForPerson.employee.com_id': Number(com_id),
      })
      console.log(new Date(ep_birth_day))
      if (manager) {
        let data = {
          userName: ep_name || manager.userName,
          emailContact: emailContact || manager.emailContact,
          address: address || manager.address,
          role: role || manager.role,
          'inForPerson.account.gender':
            Number(ep_gender) || manager.inForPerson.account.gender,
          'inForPerson.account.birthday':
            new Date(ep_birth_day / 1000) ||
            manager.inForPerson.account.birthday,
          'inForPerson.account.education':
            Number(education) || manager.inForPerson.account.education,
          'inForPerson.account.married':
            Number(married) || manager.inForPerson.account.married,
          'inForPerson.account.experience':
            Number(experience) || manager.inForPerson.account.experience,
          'inForPerson.employee.position_id':
            Number(position_id) || manager.inForPerson.employee.position_id,
          'inForPerson.employee.dep_id':
            Number(dep_id) || manager.inForPerson.employee.dep_id,
          'inForPerson.employee.group_id':
            Number(group_id) || manager.inForPerson.employee.group_id,
          'inForPerson.employee.team_id':
            Number(team_id) || manager.inForPerson.employee.team_id,
          'inForPerson.employee.start_working_time':
            new Date(start_working_time / 1000) ||
            manager.inForPerson.employee.start_working_time,
        }

        if (password) {
          data.password = md5(password)
        }
        await Users.updateOne(
          { idQLC: ep_id, type: 2 },
          {
            $set: data,
          }
        )
        return functions.success(res, 'Sửa thành công')
      }
      return functions.setError(res, 'người dùng không tồn tại')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

exports.verifyListUsers = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    const listUsers = req.body.listUsers
    if (type == 1) {
      if (listUsers) {
        const listIds = listUsers.split(',').map((item) => Number(item))
        if (listIds.length >= 1) {
          await Users.updateMany(
            {
              idQLC: { $in: listIds },
              'inForPerson.employee.com_id': Number(com_id),
            },
            {
              $set: {
                'inForPerson.employee.ep_status': 'Active',
                'inForPerson.employee.allow_update_face': 1,
                authentic: 1,
              },
            },
            { multi: true }
          )

          return functions.success(res, 'Duyệt thành công')
        }
      }
      return functions.setError(
        res,
        'Danh sách nhân viên cần duyệt không được trống'
      )
    }

    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

// xóa nhân viên khỏi công ty(update)
exports.deleteUser = async (req, res) => {
  try {
    //tạo biến đọc idQLC
    const type = req.user.data.type
    let com_id = Number(req.user.data.idQLC)

    const idQLC = req.body.idQLC
    if (type == 1) {
      const manager = await Users.findOne({
        'inForPerson.employee.com_id': com_id,
        idQLC: idQLC,
        type: 2,
      }).lean()

      if (manager) {
        //nếu biến manager không tìm thấy  trả ra fnc lỗi
        await Users.updateOne(
          {
            'inForPerson.employee.com_id': com_id,
            idQLC: idQLC,
            type: 2,
          },
          {
            $set: {
              type: 0,
              'inForPerson.employee.com_id': 0,
              'inForPerson.employee.dep_id': 0,
              'inForPerson.employee.team_id': 0,
              'inForPerson.employee.group_id': 0,
              'inForPerson.employee.position_id': 0,
              'inForPerson.employee.listOrganizeDetailId': [],
              'inForPerson.employee.organizeDetailId': 0,
            },
          }
        )
        return functions.success(res, 'Xóa thành công')
      }
      return functions.setError(res, 'người dùng không tồn tại!', 510)
    }
    return functions.setError(res, 'Tài khoản không phải Công ty', 604)
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

// xóa nhân viên khỏi phòng ban
exports.deleteUser_Deparment = async (req, res) => {
  try {
    //tạo biến đọc idQLC
    const type = req.user.data.type
    const com_id = Number(req.user.data.com_id)
    const { _id } = req.body

    if (type == 1) {
      const manager = await Users.findOne({
        'inForPerson.employee.com_id': com_id,
        _id: _id,
        type: 2,
      }).lean()
      if (manager) {
        //nếu biến manager không tìm thấy  trả ra fnc lỗi
        await Users.updateOne(
          {
            'inForPerson.employee.com_id': com_id,
            _id: _id,
            type: 2,
          },
          {
            'inForPerson.employee.dep_id': 0,
            'inForPerson.employee.team_id': 0,
            'inForPerson.employee.group_id': 0,
          }
        )
        return functions.success(res, 'Xóa khỏi phòng ban thành công!')
      }
      return functions.setError(res, 'Người dùng không tồn tại!', 510)
    }
    return functions.setError(res, 'Tài khoản không phải Công ty', 604)
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

// Lấy tất cả nhân viên không phân trang
exports.listAll = async (req, res) => {
  try {
    const com_id = Number(req.user.data.com_id)
    let data = await Users.aggregate([
      {
        $match: {
          'inForPerson.employee.ep_status': 'Active',
          'inForPerson.employee.com_id': com_id,
        },
      },
      { $sort: { userName: -1 } },
      // {
      //     $lookup: {
      //         from: 'QLC_Deparments',
      //         localField: 'inForPerson.employee.dep_id',
      //         foreignField: 'dep_id',
      //         as: 'deparment',
      //     },
      // },
      {
        $project: {
          ep_id: '$idQLC',
          ep_email: '$email',
          ep_phone: '$phone',
          ep_name: '$userName',
          ep_image: '$avatarUser',
          role_id: '$role',
          // dep_name: '$deparment.dep_name',
          allow_update_face: '$inForPerson.employee.allow_update_face',
          ep_education: '$inForPerson.account.education',
          ep_exp: '$inForPerson.account.experience',
          ep_address: '$address',
          ep_gender: '$inForPerson.account.gender',
          ep_married: '$inForPerson.account.married',
          ep_education: '$inForPerson.account.education',
          ep_birth_day: '$inForPerson.account.birthday',
          group_id: '$inForPerson.employee.group_id',
          start_working_time: '$inForPerson.employee.start_working_time',
          position_id: '$inForPerson.employee.position_id',
          com_id: '$inForPerson.employee.com_id',
          dep_id: '$inForPerson.employee.dep_id',
        },
      },
    ])
    for (let index = 0; index < data.length; index++) {
      const element = data[index]
      // element.dep_name = element.dep_name.toString()
      element.ep_image = service.createLinkFileEmpQLC(
        element.ep_id,
        element.ep_image
      )
    }
    const totalItems = await Users.countDocuments({
      'inForPerson.employee.ep_status': 'Active',
      'inForPerson.employee.com_id': com_id,
    })
    return await functions.success(res, 'Lấy thành công', {
      totalItems,
      items: data,
    })
  } catch (error) {
    console.log(error)
    functions.setError(res, error.message)
  }
}

// Check authentic
exports.checkAuthen = async (req, res) => {
  try {
    const idQLC = req.user.data.idQLC
    const type = req.user.data.type
    if (idQLC) {
      const user = await Users.findOne({
        idQLC: Number(idQLC),
        type: Number(type),
      }).lean()
      console.log(user)
      if (user) {
        return functions.success(res, 'Lay thanh cong', {
          data: {
            idQLC: idQLC,
            authentic: user.authentic,
            role: user.role,
            type: user.type,
          },
        })
      }
      return functions.setError(res, 'User không tồn tại')
    }
    return functions.setError(res, 'TOken không hợp lệ')
  } catch (err) {
    console.log(err)
    return functions.setError(res, err.message)
  }
}

// Xóa danh sashc nhân viên -> xóa mềm
exports.delListUsers = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    const type = req.user.data.type
    const listIds = req.body.listIds

    if (type == 1) {
      if (listIds) {
        const list = listIds.split(',')
        const updateRes = await Users.updateMany(
          { idQLC: { $in: list } },
          {
            $set: {
              'inForPerson.employee.ep_status': 'Deny',
              // 'inForPerson..employee.com_id': 0,
              // 'inForPerson.employee.dep_id': 0,
              // 'inForPerson.employee.group_id': 0,
              // 'inForPerson.employee.position_id': 0,
              // 'inForPerson.employee.team_id': 0,
              type: 0,
            },
          },
          { multi: true }
        )

        if (updateRes.modifiedCount > 0) {
          return functions.success(res, 'Xóa thành công', {})
        }

        return functions.setError(res, 'Có lỗi trong quá trình xóa', 500)
      }
      return functions.setError(res, 'Thiếu danh sách id truyền lên', 500)
    }

    return functions.setError(
      res,
      'Tài khoản không phải tài khoản công ty',
      500
    )
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message, 500)
  }
}

// duyệt người dùng
exports.acceptEmployee = async (req, res) => {
  try {
    const type = req.user.data.type
    const { ep_id } = req.body
    if (type == 1) {
      const manager = await Users.findOne({ idQLC: ep_id, type: 2 })
      if (manager) {
        let data = {
          'inForPerson.employee.ep_status': 'Active',
          'inForPerson.employee.start_working_time':
            manager.inForPerson.employee.start_working_time ||
            functions.getTimeNow(),
        }
        await Users.updateOne(
          { idQLC: ep_id, type: 2 },
          {
            $set: data,
          }
        )
        return functions.success(res, 'Duyệt người dùng thành công')
      }
      return functions.setError(res, 'Người dùng không tồn tại')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

// thay đổi phòng ban, tổ, nhóm, vị trí

exports.changeDepartment = async (req, res) => {
  try {
    const type = req.user.data.type
    const { dep_id, team_id, group_id, position_id } = req.body
    const { ep_id } = req.body
    if (type == 1) {
      const manager = await Users.findOne({ idQLC: ep_id, type: 2 })
      if (manager) {
        let data = {
          'inForPerson.employee.dep_id': Number(dep_id) || 0,
          'inForPerson.employee.team_id': Number(team_id) || 0,
          'inForPerson.employee.group_id': Number(group_id) || 0,
          // "inForPerson.employee.position_id": Number(position_id) || 0
        }
        await Users.updateOne(
          { idQLC: ep_id, type: 2 },
          {
            $set: data,
          }
        )
        return functions.success(res, 'Chuyển phòng ban thành công')
      }
      return functions.setError(res, 'Người dùng không tồn tại')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

exports.listEmpPending = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    const typeUser = req.user.data.type

    let condition = {
      'inForPerson.employee.com_id': Number(com_id),
      'inForPerson.employee.ep_status': 'Pending',
      authentic: 0,
    }

    const ep_id = req.body.ep_id
    const organizeDetailId = req.body.organizeDetailId
    const type = req.body.type

    if (organizeDetailId)
      condition['organizeDetailId'] = { $all: organizeDetailId }
    if (ep_id) condition['idQLC'] = Number(ep_id)

    if (typeUser === 1) {
      if (type == 1) condition = { ...condition, authentic: 1 }

      if (type == 2) condition = { ...condition, authentic: 0 }

      if (type == 3)
        condition = {
          ...condition,
          phone: { $eq: '' },
          'inForPerson.employee.position_id': { $eq: 0 },
        }

      const list = await Users.aggregate([
        {
          $match: condition,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
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
            _id: 0,
            ep_id: '$idQLC',
            ep_name: '$userName',
            ep_phone: '$phone',
            ep_phoneTK: '$phoneTK',
            ep_email: '$email',
            ep_emailContact: '$emailContact',
            position_id: '$inForPerson.employee.position_id',
            dep_id: '$organizeDetail.organizeDetailId',
            dep_name: '$organizeDetail.organizeDetailName',
          },
        },
      ])

      return functions.success(res, 'Lấy thành công', {
        items: list,
      })
    }

    return functions.setError(res, 'Không phải tài khoản công ty', 500)
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message, 500)
  }
}

exports.listAllActive = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    const typeUser = req.user.data.type
    const PAGE_SIZE = req.body.pageSize || 10
    const curPage = req.body.curPage || 1
    let total

    let condition = {
      'inForPerson.employee.com_id': Number(com_id),
      'inForPerson.employee.ep_status': 'Active',
    }

    const ep_id = req.body.ep_id
    const listOrganizeDetailId = req.body.listOrganizeDetailId
    const type = req.body.type

    if (ep_id) {
      condition = {
        ...condition,
        idQLC: ep_id,
      }
    }

    if (listOrganizeDetailId) {
      condition = {
        ...condition,
        'inForPerson.employee.listOrganizeDetailId': {
          $all: listOrganizeDetailId,
        },
      }
    }

    let subcondition = {}
    // nhan vien chua cap nhat luong co ban
    if (type == 1) {
      subcondition = {
        $or: [
          {
            'basicSal.sb_salary_basic': {
              $eq: 0,
            },
          },
          { basicSal: [] },
        ],
      }
    }

    // nhan vien chua cap nhat khuon mat
    if (type == 2) {
      condition = {
        ...condition,
        'inForPerson.employee.allow_update_face': 0,
      }
    }

    if (type == 4) {
      condition = {
        ...condition,
        'inForPerson.employee.listOrganizeDetailId': [],
        'inForPerson.employee.organizeId': 0,
      }
    }

    if (typeUser === 1) {
      let list = []

      // loc tai khoan trung
      if (type == 3) {
        const listIds = await Users.aggregate([
          {
            $match: {
              'inForPerson.employee.com_id': Number(com_id),
            },
          },
          {
            $group: {
              _id: '$userName',
              count: { $sum: 1 },
              data: {
                $push: {
                  ep_id: '$idQLC',
                },
              },
            },
          },
          {
            $match: {
              count: {
                $gte: 2,
              },
            },
          },
        ])

        //  total users
        const users = await Users.aggregate([
          {
            $match: {
              // idQLC: data[j].ep_id,
              'inForPerson.employee.com_id': Number(com_id),
              'inForPerson.employee.ep_status': 'Active',
            },
          },

          {
            $lookup: {
              from: 'QLC_Deparments',
              foreignField: 'dep_id',
              localField: 'inForPerson.employee.dep_id',
              pipeline: [
                {
                  $match: {
                    com_id: Number(com_id),
                  },
                },
              ],
              as: 'department',
            },
          },
          {
            $unwind: {
              path: '$department',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 0,
              ep_id: '$idQLC',
              ep_name: '$userName',
              ep_phone: '$phoneTK',
              ep_phoneTK: '$phoneTK',
              ep_email: '$email',
              ep_emailContact: '$emailContact',
              position_id: '$inForPerson.employee.position_id',
              dep_id: '$department.dep_id',
              team_id: '$inForPerson.employee.team_id',
              group_id: '$inForPerson.employee.group_id',
              dep_name: '$department.dep_name',
              ep_address: '$address',
              com_id: '$inForPerson.employee.com_id',
              ep_birth_day: '$inForPerson.account.birthday',
              ep_gender: '$inForPerson.account.gender',
              ep_education: '$inForPerson.account.education',
              ep_married: '$inForPerson.account.married',
              ep_exp: '$inForPerson.account.experience',
              start_working_time: '$inForPerson.employee.start_working_time',
            },
          },
        ])

        for (let i = 0; i < listIds.length; i++) {
          const data = listIds[i].data

          for (let j = 0; j < data.length; j++) {
            // if (user && user.length >= 1) {
            //   list.push(user[0])
            // }
            const temp = users.find((item) => item.idQLC == data[j].ep_id)
            if (temp) {
              list.push(temp)
            }
          }
        }
      } else {
        list = await Users.aggregate([
          {
            $match: condition,
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $skip: (curPage - 1) * PAGE_SIZE,
          },
          {
            $limit: PAGE_SIZE,
          },
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
            $lookup: {
              from: 'Tinhluong365SalaryBasic',
              foreignField: 'sb_id_user',
              localField: 'idQLC',
              pipeline: [
                {
                  $match: {
                    sb_id_com: Number(com_id),
                  },
                },
              ],
              as: 'basicSal',
            },
          },
          {
            $unwind: {
              path: '$basicSal',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: subcondition,
          },
          {
            $project: {
              _id: 0,
              ep_id: '$idQLC',
              ep_name: '$userName',
              ep_phone: '$phoneTK',
              ep_phoneTK: '$phoneTK',
              ep_email: '$email',
              ep_emailContact: '$emailContact',
              com_id: '$inForPerson.employee.com_id',
              position_id: '$inForPerson.employee.position_id',
              dep_id: '$organizeDetail.listOrganizeDetailId',
              team_id: '$inForPerson.employee.team_id',
              group_id: '$inForPerson.employee.group_id',
              dep_name: '$organizeDetail.organizeDetailName',
              ep_address: '$address',
              ep_birth_day: '$inForPerson.account.birthday',
              ep_gender: '$inForPerson.account.gender',
              ep_education: '$inForPerson.account.education',
              ep_married: '$inForPerson.account.married',
              ep_exp: '$inForPerson.account.experience',
              start_working_time: '$inForPerson.employee.start_working_time',
            },
          },
        ])

        total = await Users.countDocuments(condition)
      }

      return functions.success(res, 'Lấy thành công', {
        items: list,
        total: total,
      })
    }

    return functions.setError(res, 'Không phải tài khoản công ty', 500)
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message, 500)
  }
}

// verify captcha - Tien Long
exports.verifyCaptcha = async (req, res) => {
  try {
    const captchaResponse = req.body.captchaResponse

    if (captchaResponse) {
      const SECRET_KEY = process.env.CAPTCHA_SECRET_KEY
      console.log(SECRET_KEY)
      const verifyRes = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          secret: SECRET_KEY,
          response: captchaResponse,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
      if (verifyRes.status == 200) {
        const isVerified = verifyRes.data.success
        if (isVerified) {
          return functions.success(res, 'Xác thực CAPTCHA', {
            success: isVerified,
          })
        }
        return functions.setError(
          res,
          String(verifyRes.data['error-codes']),
          500
        )
      }
      return functions.setError(res, res.response.data.error)
    }

    return functions.setError(res, 'Thiếu trường Token CAPTCHA')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message, 500)
  }
}

// ------------------------------ Mới --------------------------------

// đổi loại tài khoản (từ công ty A sang B)
exports.changeCompany = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.body.com_id
    const { ep_id } = req.body
    if (type == 1) {
      //Kiểm tra tên nhân viên khác null

      const manager = await Users.findOne({ idQLC: ep_id, type: 2 })
      if (manager) {
        let data = {
          'inForPerson.employee.com_id': com_id,
          'inForPerson.employee.start_working_time': 0,
          'inForPerson.employee.listOrganizeDetailId': [],
          'inForPerson.employee.organizeDetailId': 0,
          'inForPerson.employee.ep_status': 'Pending',
        }
        await Users.updateOne(
          { idQLC: ep_id, type: 2 },
          {
            $set: data,
          }
        )
        return functions.success(
          res,
          'Chuyển đổi tài khoản sang công ty khác thành công'
        )
      }
      return functions.setError(res, 'Người dùng không tồn tại')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

// Thêm người dùng với cơ cấu tổ chức mới
exports.createUserNew = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    const {
      userName,
      phone,
      district_id,
      city_id,
      address,
      gender,
      birthday,
      phoneTK,
      listOrganizeDetailId,
      position_id,
      start_working_time,
      education,
      married,
      experience,
      organizeDetailId,
      isAdmin,
      email,
    } = req.body
    if (type == 1) {
      if (
        userName &&
        phone
        // district_id,
        // city_id,
        // address,
        // gender,
        // birthday,
        // phoneTK,
        // listOrganizeDetailId,
        // organizeDetailId,
        // position_id,
        // start_working_time,
        // education,
        // married,
        // experience
      ) {
        console.log(birthday)
        console.log(new Date(birthday))
        //Kiểm tra tên nhân viên khác null
        const foundGateway = await Users.findOne({
          phoneTK: phoneTK,
          type: { $ne: 1 },
        })
        if (!foundGateway) {
          const password = 'hungha365'
          //Lấy ID kế tiếp, nếu chưa có giá trị nào thì bằng 0 có giá trị max thì bằng max + 1
          let maxID = await functions.getMaxUserID()
          const newUser = new Users({
            _id: maxID._id,
            idQLC: maxID._idQLC,
            authentic: 1,
            idTimViec365: maxID._idTV365,
            idRaoNhanh365: maxID._idRN365,
            'inForPerson.employee.com_id': com_id,
            userName: userName,
            phone: phone,
            district: district_id,
            city: city_id,
            address: address,
            phoneTK: phoneTK,
            emailContact: email,
            email: email,
            password: md5(password),
            role: 2,
            'inForPerson.account.gender': gender,
            'inForPerson.account.birthday':
              Date.parse(new Date(birthday)) / 1000,
            'inForPerson.account.education': education,
            'inForPerson.account.married': married,
            'inForPerson.account.experience': experience,
            'inForPerson.employee.start_working_time': start_working_time
              ? Date.parse(new Date(start_working_time)) / 1000
              : new Date() / 1000,
            'inForPerson.employee.listOrganizeDetailId': listOrganizeDetailId,
            'inForPerson.employee.organizeDetailId': organizeDetailId,
            'inForPerson.employee.position_id': position_id,
            'inForPerson.employee.ep_status': 'Active',
            'inForPerson.employee.allow_update_face': 1,
            fromWeb: 'hungha365',
            type: 2,
            isAdmin: isAdmin || 0,
            createdAt: functions.getTimeNow(),
            chat365_secret: functions.chat365_secret(maxID._id),
          })

          await newUser.save()
          // ----------------- Cài đặt đề xuất
          service.settingConfirm(newUser)
          service.settingIPApp(newUser)
          return functions.success(res, 'Thêm nhân viên thành công')
        }
        return functions.setError(res, 'Tài khoản đã tồn tại!')
      }
      return functions.setError(res, 'Cần nhập đủ thông tin')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

// thay đổi tổ chức của nhân viên (update)

exports.changeOrganizeDetail = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    const isAdmin = req.user.data.isAdmin
    const { listOrganizeDetailId, ep_id, organizeDetailId, position_id } =
      req.body
    if (Number(type) === 1 || isAdmin) {
      if (ep_id) {
        const foundGateway = await Users.findOne({
          idQLC: ep_id,
          type: 2,
          'inForPerson.employee.com_id': com_id,
        })
        if (foundGateway) {
          let data = {
            'inForPerson.employee.listOrganizeDetailId':
              listOrganizeDetailId ||
              foundGateway.inForPerson.employee.listOrganizeDetailId,
            'inForPerson.employee.organizeDetailId':
              organizeDetailId ||
              foundGateway.inForPerson.employee.organizeDetailId,
            'inForPerson.employee.position_id':
              position_id || foundGateway.inForPerson.employee.position_id,
          }
          await Users.updateOne(
            {
              idQLC: ep_id,
              type: 2,
              'inForPerson.employee.com_id': com_id,
            },
            {
              $set: data,
            }
          )
          return functions.success(res, 'Cập nhật thành công')
        }
        return functions.setError(res, 'Người dùng không tồn tại')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

// xóa 1 nhân viên khỏi tổ chức

exports.deleteUserNew = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    const { ep_id } = req.body
    if (type == 1) {
      if (ep_id) {
        const foundGateway = await Users.findOne({
          idQLC: ep_id,
          type: 2,
          'inForPerson.employee.com_id': com_id,
        })
        if (foundGateway) {
          await Users.updateOne(
            {
              idQLC: ep_id,
              type: 2,
              'inForPerson.employee.com_id': com_id,
            },
            {
              $set: {
                'inForPerson.employee.listOrganizeDetailId': [],
              },
            }
          )
          return functions.success(res, 'Xóa nhân viên khỏi tổ chức thành công')
        }
        return functions.setError(res, 'Người dùng không tồn tại')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

//  build  danh sách nhân viên với điều kiện cơ cấu mới
exports.listUser = async (req, res, next) => {
  try {
    const com_id = req.user.data.com_id
    const type = req.user.data.type
    const {
      listOrganizeDetailId,
      position_id,
      userName,
      ep_status,
      isAdmin,
      list_ep,
      not_list_ep,
    } = req.body
    const pageNumber = Number(req.body.pageNumber) || 1
    const pageSize = Number(req.body.pageSize) || 50

    if (com_id) {
      const conditions = {
        'inForPerson.employee.com_id': com_id,
      }
      if (listOrganizeDetailId)
        conditions['inForPerson.employee.listOrganizeDetailId'] = {
          $all: listOrganizeDetailId,
        }
      if (position_id)
        conditions['inForPerson.employee.position_id'] = position_id
      if (userName) conditions['userName'] = { $regex: userName, $options: 'i' }
      if (ep_status) conditions['inForPerson.employee.ep_status'] = ep_status
      if (isAdmin) conditions.isAdmin = isAdmin
      if (list_ep) conditions['idQLC'] = { $in: list_ep }
      if (not_list_ep) conditions['idQLC'] = { $nin: not_list_ep }

      const listUser = await Users.aggregate([
        {
          $match: conditions,
        },
        { $skip: (pageNumber - 1) * pageSize },
        { $limit: pageSize },

        {
          $lookup: {
            from: 'QLC_Positions',
            localField: 'inForPerson.employee.position_id',
            foreignField: 'id',
            let: { comId: '$comId' },
            pipeline: [{ $match: { comId: com_id } }],
            as: 'positions',
          },
        },
        {
          $lookup: {
            from: 'QLC_OrganizeDetail',
            localField: 'inForPerson.employee.organizeDetailId',
            foreignField: 'id',
            as: 'organizeDetail',
          },
        },
        {
          $project: {
            _id: 1,
            ep_id: '$idQLC',
            userName: '$userName',
            phone: 1,
            avatarUser: 1,
            organizeDetailName: '$organizeDetail.organizeDetailName',
            positionName: '$positions.positionName',
            position_id: '$inForPerson.employee.position_id',
            organizeDetailId: '$inForPerson.employee.organizeDetailId',
            listOrganizeDetailId: '$inForPerson.employee.listOrganizeDetailId',
            gender: '$inForPerson.account.gender',
            married: '$inForPerson.account.married',
            experience: '$inForPerson.account.experience',
            birthday: '$inForPerson.account.birthday',
            education: '$inForPerson.account.education',
            address: '$address',
            start_working_time: '$inForPerson.employee.start_working_time',
            email: '$email',
          },
        },
      ])
      const total = await Users.countDocuments(conditions)
      listUser.map((e) => {
        e.positionName = e.positionName.toString()
        e.organizeDetailName = e.organizeDetailName.toString()
      })

      return functions.success(res, 'Danh sách nhân viên', {
        total: total,
        data: listUser,
      })
    } else return functions.setError(res, 'Thiếu thông tin')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message)
  }
}

exports.deleteCompany = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.body.com_id
    const { ep_id } = req.body
    if (type == 1) {
      //Kiểm tra tên nhân viên khác null

      const manager = await Users.findOne({ idQLC: ep_id, type: 2 })
      if (manager) {
        let data = {
          'inForPerson.employee.ep_status': 'Deny',
          'inForPerson.employee.allow_update_face': 0,
        }
        await Users.updateOne(
          { idQLC: ep_id, type: 2 },
          {
            $set: data,
          }
        )
        return functions.success(res, 'Xóa khỏi công ty thành công')
      }
      return functions.setError(res, 'Người dùng không tồn tại')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

// build
exports.updateAdmin = async (req, res) => {
  try {
    const type = req.user.data.type
    const isAdmin = req.user.data.isAdmin
    const { listUsers, newIsAdmin } = req.body
    if (type == 1 || isAdmin) {
      if (listUsers && listUsers.length > 0) {
        let data = {
          isAdmin: Number(newIsAdmin) || 0,
        }
        await Users.updateMany(
          {
            idQLC: {
              $in: listUsers,
            },
            type: 2,
          },
          {
            $set: data,
          }
        )
        return functions.success(res, 'Phân quyền thành công')
      }
      return functions.setError(res, 'Phải chọn ít nhất 1 nhân viên')
    }
    return functions.setError(res, 'Tài khoản không có quyền')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

// từ chối nhiều thành viên (update)

exports.rejectListUsers = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.body.com_id
    const listUsers = req.body.listUsers
    if (type == 1) {
      if (listUsers) {
        if (listUsers.length >= 1) {
          await Users.updateMany(
            { idQLC: { $in: listUsers }, type: 2 },
            {
              $set: {
                'inForPerson.employee.com_id': 0,
                'inForPerson.employee.listOrganizeDetailId': [],
                'inForPerson.employee.organizeDetailId': 0,
                'inForPerson.employee.position_id': 0,
                'inForPerson.employee.ep_status': 'Deny',
              },
            },
            { multi: true }
          )

          return functions.success(res, 'Hủy duyệt thành công')
        }
      }
      return functions.setError(
        res,
        'Danh sách nhân viên cần duyệt không được trống'
      )
    }

    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    return functions.setError(res, error.message)
  }
}

exports.verifyListUsersNew = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.body.com_id
    const listUsers = req.body.listUsers
    if (type == 1) {
      if (listUsers) {
        if (listUsers.length >= 1) {
          await Users.updateMany(
            { idQLC: { $in: listUsers }, type: 2 },
            {
              $set: {
                'inForPerson.employee.ep_status': 'Active',
                'inForPerson.employee.allow_update_face': 1,
                authentic: 1,
              },
            },
            { multi: true }
          )

          return functions.success(res, 'Duyệt thành công')
        }
      }
      return functions.setError(
        res,
        'Danh sách nhân viên cần duyệt không được trống'
      )
    }

    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    return functions.setError(res, error.message)
  }
}
// lấy thông tin công ty từ req.body

exports.infoCompany = async (req, res) => {
  try {
    const com_id = Number(req.body.com_id)
    const foundGateway = await Users.findOne(
      {
        idQLC: com_id,
        type: 1,
      },
      { idQLC: 1, userName: 1 }
    )
    if (foundGateway)
      return functions.success(res, 'Thông tin công ty', {
        data: foundGateway,
      })
    return functions.setError(res, 'Công ty không tồn tại')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

// danh sách nhân viên chưa chấm công hoặc đã chấm công
exports.listEmUntimed = async (req, res, next) => {
  try {
    const type = Number(req.user.data.type)
    const com_id = Number(req.user.data.com_id)
    const isAdmin = Number(req.user.data.isAdmin)
    const ep_id = Number(req.body.ep_id)
    const position_id = Number(req.body.position_id)
    const listOrganizeDetailId = req.body.listOrganizeDetailId
    const pageNumber = Number(req.body.pageNumber) || 1
    const pageSize = Number(req.body.pageSize) || 50
    const userName = req.body.userName
    const skip = (pageNumber - 1) * pageSize
    if (com_id) {
      const conditions = {
        'inForPerson.employee.com_id': com_id,
        'inForPerson.employee.ep_status': 'Active',
      }
      if (userName) conditions['userName'] = { $regex: userName, $options: 'i' }
      if (listOrganizeDetailId)
        conditions['inForPerson.employee.listOrganizeDetailId'] = {
          $all: listOrganizeDetailId,
        }
      if (position_id)
        conditions['inForPerson.employee.position_id'] = position_id
      let company = await Users.findOne(
        { idQLC: com_id, type: 1 },
        { userName: 1, idQLC: 1 }
      )

      // chấm công hoặc chưa chấm công (1:có, 2:không)
      let type_timekeep = Number(req.body.type_timekeep)
      let condition2 = {}

      let time = new Date()
      let year = time.getFullYear()
      let month = time.getMonth()
      let day = time.getDate()

      let time_k1_start = new Date(year, month, day).getTime() / 1000
      let time_k1_end = time_k1_start + 46800
      // k1 : tính từ 0h đến 13h
      let time12h = time_k1_start + 86400
      // tính từ 0h đến 24h

      condition2.ts_com_id = com_id
      if (
        time_k1_start < time.getTime() / 1000 &&
        time.getTime() / 1000 < time_k1_end
      ) {
        condition2.is_success = 1
        condition2.at_time = {
          $gt: new Date(time_k1_start * 1000),
          $lt: new Date(time_k1_end * 1000),
        }
      } else {
        condition2.is_success = 1
        condition2.at_time = {
          $gt: new Date(time_k1_end * 1000),
          $lt: new Date(time12h * 1000),
        }
      }

      let listTimeSheet = await CC365_TimeSheet.find(condition2, {
        ep_id: 1,
      }).lean()
      let listUsers = []
      listTimeSheet.map((e) => listUsers.push(Number(e.ep_id))) // danh sách nhân viên chấm công
      if (type_timekeep === 1) {
        // đã chấm công
        conditions.idQLC = { $in: listUsers }
        conditions.type = 2
      } else {
        // chưa chấm công
        conditions.idQLC = { $nin: listUsers }
        conditions['inForPerson.employee.com_id'] = com_id
        conditions.type = 2
      }

      const listEmployee = await Users.aggregate([
        { $match: conditions },
        { $sort: { idQLC: -1 } },
        { $skip: (pageNumber - 1) * pageSize },
        { $limit: pageSize },

        {
          $lookup: {
            from: 'QLC_OrganizeDetail',
            localField: 'inForPerson.employee.organizeDetailId',
            foreignField: 'id',
            pipeline: [{ $match: { comId: com_id } }],
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
          $lookup: {
            from: 'QLC_Positions',
            localField: 'inForPerson.employee.position_id',
            foreignField: 'id',
            pipeline: [{ $match: { comId: com_id } }],
            as: 'positions',
          },
        },
        {
          $unwind: {
            path: '$positions',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'inForPerson.employee.com_id',
            foreignField: 'idQLC',
            pipeline: [{ $match: { type: 1 } }],
            as: 'Company',
          },
        },
        {
          $unwind: {
            path: '$Company',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            idQLC: '$idQLC',
            userName: '$userName',
            phone: '$phone',
            phoneTK: '$phoneTK',
            email: '$email',
            address: '$address',
            birthday: '$inForPerson.account.birthday',
            gender: '$inForPerson.account.gender',
            married: '$inForPerson.account.married',
            experience: '$inForPerson.account.experience',
            education: '$inForPerson.account.education',
            com_id: '$inForPerson.employee.com_id',
            comName: '$Company.userName',
            organizeDetailId: '$organizeDetail.id',
            listOrganizeDetailId: '$organizeDetail.listOrganizeDetailId',
            organizeDetailName: '$organizeDetail.organizeDetailName',
            position_id: '$inForPerson.employee.position_id',
            positionName: '$positions.positionName',
            start_working_time: '$inForPerson.employee.start_working_time',
          },
        },
      ])
      if (type_timekeep === 2) {
        for (let i = 0; i < listEmployee.length; i++) {
          let ly_do_nghi = ''
          let ly_do_nghi_phep = ''
          let type_nghi = 0
          let today = new Date().toISOString().slice(0, 10)
          let checkCycleMonth = today.slice(0, 7)
          checkCycleMonth = checkCycleMonth + '-01T00:00:00.000+00:00'
          // kiem tra nhan vien co lich lam viec trong thang hay khong
          let check_lich_lam_viec = await CC365_Cycle.aggregate([
            {
              $match: {
                com_id: com_id,
                apply_month: new Date(checkCycleMonth),
              },
            },
            {
              $lookup: {
                from: 'CC365_EmployeCycle',
                localField: 'cy_id',
                foreignField: 'cy_id',
                pipeline: [
                  {
                    $match: {
                      ep_id: Number(listEmployee[i].idQLC),
                    },
                  },
                ],
                as: 'CC365_EmployeCycle',
              },
            },
            {
              $unwind: '$CC365_EmployeCycle',
            },
          ])

          if (check_lich_lam_viec.length !== 0) {
            let cy_detail = check_lich_lam_viec[0].cy_detail

            cy_detail = JSON.parse(cy_detail)

            let check = cy_detail.find((item) => item.date == today)
            if (check) {
              let shift_id = check.shift_id.split(',')

              const listShifts = await Shift.find({
                shift_id: { $in: shift_id },
              })

              const getTimeHours = functions.getTimeHours()

              for (let h = 0; h < listShifts.length; h++) {
                const element = listShifts[h]
                if (
                  getTimeHours >= element.start_time &&
                  getTimeHours <= element.end_time
                ) {
                  let check_de_xuat = await DeXuat.find(
                    {
                      type_dx: 1,
                      id_user: listEmployee[i].idQLC,
                      type_duyet: 5,
                    },
                    { noi_dung: 1 }
                  ).sort({ _id: -1 })

                  if (check_de_xuat.length > 0) {
                    for (let j = 0; j < check_de_xuat.length; j++) {
                      let checkAll = false
                      const de_xuat = check_de_xuat[j]
                      if (
                        de_xuat.noi_dung &&
                        de_xuat.noi_dung.nghi_phep &&
                        de_xuat.noi_dung.nghi_phep.nd &&
                        de_xuat.noi_dung.nghi_phep.nd.length > 0
                      ) {
                        let check = false
                        let noidung = de_xuat.noi_dung.nghi_phep.nd
                        for (let t = 0; t < noidung.length; t++) {
                          const itemND = noidung[t]
                          let bd_nghi = new Date(itemND.bd_nghi)
                          bd_nghi.setHours(0, 0, 0, 0)
                          const kt_nghi = new Date(itemND.kt_nghi)
                          kt_nghi.setHours(23, 59, 59, 999)
                          if (bd_nghi <= new Date() && kt_nghi >= new Date()) {
                            if (!itemND.ca_nghi) {
                              if (
                                Number(de_xuat.noi_dung.nghi_phep.loai_np) === 2
                              )
                                ly_do_nghi = 'Nghỉ phép đột xuất'
                              if (
                                Number(de_xuat.noi_dung.nghi_phep.loai_np) === 1
                              )
                                ly_do_nghi = 'Nghỉ phép có kế hoạch'
                              ly_do_nghi_phep = de_xuat.noi_dung.nghi_phep.ly_do
                              link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${de_xuat._id}`
                              check = true
                              checkAll = true
                              type_nghi = 4
                              break
                            } else {
                              const findShift = await Shift.findOne({
                                shift_id: Number(itemND.ca_nghi),
                              })
                              if (findShift) {
                                if (
                                  new Date(findShift.start_time) < new Date() &&
                                  new Date(findShift.end_time) > new Date()
                                ) {
                                  if (
                                    Number(
                                      de_xuat.noi_dung.nghi_phep.loai_np
                                    ) === 2
                                  )
                                    ly_do_nghi = 'Nghỉ phép đột xuất'
                                  if (
                                    Number(
                                      de_xuat.noi_dung.nghi_phep.loai_np
                                    ) === 1
                                  )
                                    ly_do_nghi = 'Nghỉ phép có kế hoạch'
                                  ly_do_nghi_phep =
                                    de_xuat.noi_dung.nghi_phep.ly_do
                                  link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${de_xuat._id}`
                                  type_nghi = 4
                                  check = true
                                  checkAll = true
                                  break
                                } else {
                                  ly_do_nghi = 'Nghỉ sai quy định'
                                  type_nghi = 1
                                }
                              }
                            }
                          }
                          if (check) break
                        }
                      }
                      if (checkAll) break
                    }
                  } else {
                    ly_do_nghi = 'Nghỉ sai quy định'
                    type_nghi = 1
                  }
                } else {
                  ly_do_nghi = 'Nghỉ theo lịch làm việc'
                  type_nghi = 2
                }
              }
            } else {
              ly_do_nghi = 'Nghỉ theo lịch làm việc'
              type_nghi = 2
            }
          } else {
            ly_do_nghi = 'Chưa tạo lịch làm việc'
            type_nghi = 3
          }
          listEmployee[i].ly_do_nghi = ly_do_nghi
          listEmployee[i].ly_do_nghi_phep = ly_do_nghi_phep
          listEmployee[i].type_nghi = type_nghi
        }
      }

      let total = await Users.countDocuments(conditions)

      return functions.success(res, 'Danh sách nhân viên', {
        totalCount: total,
        data: listEmployee,
      })
    }
    return functions.setError(res, 'Thiếu ID công ty')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message, 500)
  }
}

// thêm mới nhân viên + lương

exports.createUserAndSalary = async (req, res) => {
  try {
    const type = req.user.data.type
    const com_id = req.user.data.com_id
    const isAdmin = req.user.data.com_id
    if (type === 1 || isAdmin) {
      const { userName, phoneTK, sb_salary_basic, con_salary_persent } =
        req.body

      //Kiểm tra số điện thoại
      const foundGateway = await functions.getDatafindOne(Users, {
        phoneTK: phoneTK,
        type: { $ne: 1 },
      })
      if (!foundGateway) {
        //Lấy ID kế tiếp, nếu chưa có giá trị nào thì bằng 0 có giá trị max thì bằng max + 1
        let maxID = await functions.getMaxUserID()
        const newUser = new Users({
          authentic: 1,
          _id: maxID._id,
          idQLC: maxID._idQLC,
          idTimViec365: maxID._idTV365,
          idRaoNhanh365: maxID._idRN365,
          'inForPerson.employee.com_id': com_id,
          'inForPerson.employee.ep_status': 'Active',
          userName: userName,
          phone: phoneTK,
          phoneTK: phoneTK,
          password: md5(phoneTK),
          role: 2,
          type: 2,
          isAdmin: 0,
          createdAt: functions.getTimeNow(),
          chat365_secret: functions.chat365_secret(maxID._id),
        })
        // Tinhluong365SalaryBasic
        // Tinhluong365Contract

        // thêm lương cơ bản
        let sb_id = 0
        let maxIdSalary = await Tinhluong365SalaryBasic.find({}, { sb_id: 1 })
          .sort({ sb_id: -1 })
          .limit(1)
        if (maxIdSalary.length) {
          sb_id = maxIdSalary[0].sb_id + 1
        }
        const newSalary = new Tinhluong365SalaryBasic({
          sb_id,
          sb_id_user: maxID._idQLC,
          sb_id_com: com_id,
          sb_salary_basic: Number(sb_salary_basic),
        })
        // thêm hợp đồng - % lương
        let con_id = 0
        let maxIdContract = await Tinhluong365Contract.find({}, { con_id: 1 })
          .sort({ con_id: -1 })
          .limit(1)
        if (maxIdContract.length) {
          con_id = maxIdSalary[0].sb_id + 1
        }
        const newContract = new Tinhluong365Contract({
          con_id: con_id,
          con_id_user: maxID._idQLC,
          con_salary_persent: con_salary_persent,
          con_time_created: new Date(),
        })
        await Promise.all([
          await newUser.save(),
          await newSalary.save(),
          await newContract.save(),
        ])
        // ----------------- Cài đặt đề xuất
        service.settingConfirm(newUser)
        service.settingIPApp(newUser)
        // service.settingConfirmTimeSheet(newUser)
        return functions.success(res, 'Thêm nhân viên thành công', {
          user: {
            _id: newUser._id,
            idQLC: newUser.idQLC,
            phoneTK: newUser.phoneTK,
            userName: newUser.userName,
          },
          salary: newSalary,
          contract: newContract,
        })
      }

      return functions.setError(res, 'Tài khoản đã tồn tại!')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (e) {
    return functions.setError(res, e.message)
  }
}
