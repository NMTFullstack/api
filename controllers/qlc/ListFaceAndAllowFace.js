const Users = require('../../models/Users')
const functions = require('../../services/functions')
const fnc = require('../../services/qlc/functions')

//lấy danh sách nhân viên cần cập nhật khuôn mặt
exports.getlist = async (req, res) => {
  try {
    const pageNumber = req.body.pageNumber || 1
    const type = req.user.data.type
    let com_id = req.user.data.com_id
    let is_update = req.body.is_update
    let dep_id = req.body.dep_id
    let idQLC = req.body.idQLC
    if (type == 1) {
      let condition = {
        'inForPerson.employee.allow_update_face': 0,
        'inForPerson.employee.ep_status': 'Active',
        'inForPerson.employee.com_id': Number(com_id),
      }
      if (is_update) condition['inForPerson.employee.allow_update_face'] = 1

      if (dep_id) {
        if (!Array.isArray(dep_id)) {
          dep_id = JSON.parse(dep_id)
        }
        condition['inForPerson.employee.listOrganizeDetailId'] = {
          $all: dep_id,
        }
      }

      if (idQLC) condition.idQLC = Number(idQLC)
      // if (findbyNameUser) condition["userName"] = { $regex: findbyNameUser }; //tìm kiếm theo tên

      let data = await Users.aggregate([
        { $match: condition },
        { $sort: { _id: -1 } },
        { $skip: (pageNumber - 1) * 10 },
        { $limit: 10 },
        // {
        //     $lookup: {
        //         from: "QLC_Deparments",
        //         localField: "inForPerson.employee.dep_id",
        //         foreignField: "dep_id",
        //         as: "deparment"
        //     }
        // },
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
            userName: '$userName',
            dep_id: '$inForPerson.employee.dep_id',
            com_id: '$inForPerson.employee.com_id',
            allow_update_face: '$inForPerson.employee.allow_update_face',
            position_id: '$inForPerson.employee.position_id',
            phoneTK: '$phoneTK',
            avatarUser: '$avatarUser',
            email: '$email',
            idQLC: '$idQLC',
            dep_name: '$deparment.dep_name',
            detail: '$organizeDetail',
          },
        },
      ])
      //   for (let index = 0; index < data.length; index++) {
      //     const element = data[index]
      //     element.avatarUser = await fnc.createLinkFileEmpQLC(
      //       data[0].idQLC,
      //       data[0].avatarUser
      //     )
      //     // element.dep_name = element.dep_name.toString()
      //   }

      // get total pages
      const count = await Users.countDocuments(condition)

      return functions.success(res, 'Lấy thành công', { data, count })
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (err) {
    console.log(err)
    return functions.setError(res, err.message)
  }
}

// Gửi yêu cầu cập nhật khuôn mặt
exports.request = async (req, res) => {
  try {
    const user = req.user.data
    if (user.type == 2) {
      const infor = await Users.findOne(
        { _id: user._id },
        {
          'inForPerson.employee.allow_update_face': 1,
          'inForPerson.employee.ep_featured_recognition': 1,
        }
      )
      if (infor.inForPerson && infor.inForPerson.employee) {
        if (infor.inForPerson.employee.allow_update_face == 0) {
          await Users.updateOne(
            { _id: user._id },
            {
              $set: {
                'inForPerson.employee.allow_update_face': 1,
                'inForPerson.employee.ep_featured_recognition': 1,
              },
            }
          )
        } else {
          await Users.updateOne(
            { _id: user._id },
            {
              $set: { 'inForPerson.employee.allow_update_face': 0 },
            }
          )
        }
        return functions.success(res, 'Cập nhật thành công')
      }
    }
    return functions.setError(res, 'Tài khoản không phải tài khoản công ty')
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message)
  }
}

//duyệt
exports.add = async (req, res) => {
  try {
    let list_id = req.body.list_id
    if (list_id) {
      const array = list_id.split(',').map(Number)
      for (let index = 0; index < array.length; index++) {
        const idQLC = array[index]

        const user = await Users.findOne({ idQLC: idQLC, type: 2 }).select(
          'inForPerson.employee.allow_update_face'
        )
        const allow_update_face = user.inForPerson.employee.allow_update_face

        await Users.updateOne(
          { idQLC: idQLC, type: 2 },
          {
            $set: {
              'inForPerson.employee.allow_update_face': 1,
            },
          }
        )
      }
      return functions.success(res, 'cập nhật thành công ')
    }
    return functions.setError(res, 'Chưa truyền id nhân viên cần duyệt')
  } catch (err) {
    console.log(err)
    return functions.setError(res, err.message)
  }
}

// cập nhật khuôn mặt
exports.update_ep_featured_recognition = async (req, res) => {
  try {
    const user = req.user.data
    const ep_featured_recognition = String(req.body.ep_featured_recognition)
    if (user.type == 2) {
      const infor = await Users.findOne(
        { _id: user._id, 'inForPerson.employee.allow_update_face': 1 },
        { password: 0 }
      ).lean()
      if (infor.inForPerson && infor.inForPerson.employee) {
        await Users.updateOne(
          { _id: user._id },
          {
            $set: {
              'inForPerson.employee.ep_featured_recognition':
                ep_featured_recognition,
            },
          }
        )
        return functions.success(res, 'Cập nhật thành công', {
          data: await Users.findOne({ _id: user._id }, { password: 0 }).lean(),
        })
      } else {
        return functions.setError(res, 'Tài khoản chưa được cấp quyền')
      }
    } else {
      return functions.setError(res, 'Tài khoản không phải tài khoản nhân viên')
    }
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message)
  }
}

// reset all
exports.reset_all_update_face = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    const type = req.user.data.type

    if (type == 1) {
      const result = await Users.updateMany(
        { 'inForPerson.employee.com_id': com_id },
        {
          $set: {
            'inForPerson.employee.allow_update_face': 0,
          },
        }
      )

      if (result.modifiedCount > 0) {
        return functions.success(res, 'Reset Thành công')
      }

      return functions.setError(res, 'Có lỗi khi reset', 500)
    }
    return functions.setError(res, 'Không phải tài khoản công ty', 500)
  } catch (err) {
    console.log(err)
    return functions.setError(res, err.message, 500)
  }
}
