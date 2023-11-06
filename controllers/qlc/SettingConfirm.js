const functions = require('../../services/functions')
const SettingConfirm = require('../../models/qlc/SettingConfirm')
const SettingPropose = require('../../models/qlc/SettingPropose')
const Positions = require('../../models/qlc/Positions')
const Users = require('../../models/Users')
const _ = require('lodash')

// danh sách nhân viên theo hình thức duyệt, cấp độ duyệt
exports.listUser = async (req, res, next) => {
  try {
    const com_id = req.user.data.com_id
    const type = req.user.data.type
    const {
      id,
      ep_id,
      listOrganizeDetailId,
      position_id,
      userName,
      confirm_level,
      confirm_type,
    } = req.body
    const pageNumber = Number(req.body.pageNumber) || 1
    const pageSize = Number(req.body.pageSize) || 50

    if (com_id) {
      const conditions = {
        'inForPerson.employee.com_id': com_id,
        'inForPerson.employee.ep_status': 'Active',
      }
      const conditionsSettingConfirm = {}
      if (listOrganizeDetailId)
        conditions['inForPerson.employee.listOrganizeDetailId'] = {
          $all: listOrganizeDetailId,
        }
      if (ep_id) conditions['idQLC'] = Number(ep_id)
      if (listOrganizeDetailId)
        conditions['inForPerson.employee.listOrganizeDetailId'] = {
          $all: listOrganizeDetailId,
        }
      if (position_id)
        conditions['inForPerson.employee.position_id'] = position_id
      if (userName) conditions['userName'] = { $regex: userName, $options: 'i' }
      if (id) conditionsSettingConfirm['id'] = Number(id)

      const [listUser, total] = await Promise.all([
        await Users.aggregate([
          {
            $match: conditions,
          },
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
              let: { comId: '$comId' },
              pipeline: [{ $match: { comId: com_id } }],
              as: 'organizeDetail',
            },
          },
          {
            $lookup: {
              from: 'QLC_SettingConfirm',
              localField: 'idQLC',
              foreignField: 'ep_id',
              pipeline: [
                {
                  $match: conditionsSettingConfirm,
                },
              ],
              as: 'settingConfirm',
            },
          },
          {
            $unwind: '$settingConfirm',
          },
          { $skip: (pageNumber - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              _id: 0,
              ep_id: '$idQLC',
              userName: '$userName',
              phone: 1,
              avatarUser: 1,
              organizeDetailName: '$organizeDetail.organizeDetailName',
              positionName: '$positions.positionName',
              listPrivateLevel: '$settingConfirm.listPrivateLevel',
              listPrivateType: '$settingConfirm.listPrivateType',
              listPrivateTime: '$settingConfirm.listPrivateTime',
            },
          },
        ]),
        await Users.countDocuments(conditions),
      ])
      listUser.map((e) => {
        e.positionName = e.positionName.toString()
        e.organizeDetailName = e.organizeDetailName.toString()
      })
      return functions.success(res, 'Danh sách nhân viên', {
        total: total[0]?.total || 0,
        data: listUser,
      })
    } else return functions.setError(res, 'Thiếu thông tin')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message)
  }
}
// cài đặt, xóa cấp độ duyệt cho nhiều nhân viên

exports.updateAllSettingConfirmLevel = async (req, res, next) => {
  try {
    const comId = req.user.data.com_id
    const type = req.user.data.type
    const isAdmin = req.user.data.isAdmin
    const listUsers = req.body.listUsers || []
    const confirm_level = Number(req.body.confirm_level) || 0
    if (Number(type) === 1 || isAdmin) {
      if (comId && listUsers && listUsers.length > 0) {
        await SettingConfirm.updateMany(
          {
            ep_id: { $in: listUsers },
          },
          {
            $set: {
              confirm_level: confirm_level,
            },
          },
          {
            multi: true,
          }
        )
        return functions.success(res, 'Cập nhật thành công')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message)
  }
}

// ------------------ Cài đặt hình thức duyệt cho nhân viên

// cài đặt, xóa hình thức duyệt cho nhiều nhân viên
exports.updateAllSettingConfirmType = async (req, res, next) => {
  try {
    const comId = req.user.data.com_id
    const type = req.user.data.type
    const isAdmin = req.user.data.isAdmin
    const listUsers = req.body.listUsers || []
    const confirm_type = req.body.confirm_type
    if (Number(type) === 1 || isAdmin) {
      if (comId && listUsers && listUsers.length > 0) {
        await SettingConfirm.updateMany(
          {
            ep_id: { $in: listUsers },
          },
          {
            $set: {
              confirm_type: confirm_type,
            },
          },
          {
            multi: true,
          }
        )
        return functions.success(res, 'Cập nhật thành công')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message)
  }
}

// cài đặt riêng từng nhân viên

// cấp
exports.updatePrivateLevel = async (req, res, next) => {
  try {
    const comId = req.user.data.com_id
    const type = req.user.data.type
    const isAdmin = req.user.data.isAdmin
    const listUsers = req.body.listUsers || []
    const listConfirm = req.body.listConfirm || []
    const confirm_level = Number(req.body.confirm_level)
    if (Number(type) === 1 || isAdmin) {
      if (confirm_level || confirm_level === 0) {
        if (listConfirm && Number(listConfirm.length > 0)) {
          const listPrivate = []
          listConfirm.map((e) => {
            listPrivate.push({
              dexuat_id: Number(e),
              confirm_level: Number(confirm_level),
            })
          })
          if (comId && listUsers && listUsers.length > 0) {
            await Promise.all(
              listUsers.map(async (e) => {
                const foundGateway = await SettingConfirm.findOne({
                  ep_id: Number(e),
                })
                if (foundGateway) {
                  if (foundGateway.listPrivateLevel) {
                    if (foundGateway.listPrivateLevel.length > 0) {
                      const listPrivateCurrent = [
                        ...foundGateway.listPrivateLevel,
                      ]
                      listPrivate.map((element) => {
                        const find = listPrivateCurrent.find(
                          (value) => value.dexuat_id === element.dexuat_id
                        )
                        if (find) {
                          find.confirm_level = element.confirm_level
                        } else
                          listPrivateCurrent.push({
                            dexuat_id: element.dexuat_id,
                            confirm_level: element.confirm_level,
                          })
                      })
                      await SettingConfirm.updateOne(
                        {
                          ep_id: Number(e),
                        },
                        {
                          $set: {
                            listPrivateLevel: listPrivateCurrent,
                          },
                        }
                      )
                    } else
                      await SettingConfirm.updateOne(
                        {
                          ep_id: Number(e),
                        },
                        {
                          $set: {
                            listPrivateLevel: listPrivate,
                          },
                        }
                      )
                  } else {
                    await SettingConfirm.updateOne(
                      {
                        ep_id: Number(e),
                      },
                      {
                        $set: {
                          listPrivateLevel: listPrivate,
                        },
                      }
                    )
                  }
                }
              })
            )
            return functions.success(res, 'Cập nhật thành công')
          }
          return functions.setError(res, 'Thiếu thông tin')
        }
        return functions.setError(res, 'Danh sách đề xuất không được để trống')
      }
      return functions.setError(res, 'Cập nhật thành công')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message)
  }
}
// hình thức
exports.updatePrivateType = async (req, res, next) => {
  try {
    const comId = req.user.data.com_id
    const type = req.user.data.type
    const isAdmin = req.user.data.isAdmin
    const listUsers = req.body.listUsers || []
    const listConfirm = req.body.listConfirm || []
    const confirm_type = Number(req.body.confirm_type)
    if (Number(type) === 1 || isAdmin) {
      if (confirm_type || confirm_type === 0) {
        if (listConfirm && Number(listConfirm.length > 0)) {
          const listPrivate = []
          listConfirm.map((e) => {
            listPrivate.push({
              dexuat_id: Number(e),
              confirm_type: Number(confirm_type),
            })
          })
          if (comId && listUsers && listUsers.length > 0) {
            await Promise.all(
              listUsers.map(async (e) => {
                const foundGateway = await SettingConfirm.findOne({
                  ep_id: Number(e),
                })
                if (foundGateway) {
                  if (foundGateway.listPrivateType) {
                    if (foundGateway.listPrivateType.length > 0) {
                      const listPrivateCurrent = [
                        ...foundGateway.listPrivateType,
                      ]
                      listPrivate.map((element) => {
                        const find = listPrivateCurrent.find(
                          (value) => value.dexuat_id === element.dexuat_id
                        )
                        if (find) {
                          find.confirm_type = element.confirm_type
                        } else
                          listPrivateCurrent.push({
                            dexuat_id: element.dexuat_id,
                            confirm_type: element.confirm_type,
                          })
                      })
                      await SettingConfirm.updateOne(
                        {
                          ep_id: Number(e),
                        },
                        {
                          $set: {
                            listPrivateType: listPrivateCurrent,
                          },
                        }
                      )
                    } else
                      await SettingConfirm.updateOne(
                        {
                          ep_id: Number(e),
                        },
                        {
                          $set: {
                            listPrivateType: listPrivate,
                          },
                        }
                      )
                  } else {
                    await SettingConfirm.updateOne(
                      {
                        ep_id: Number(e),
                      },
                      {
                        $set: {
                          listPrivateType: listPrivate,
                        },
                      }
                    )
                  }
                }
              })
            )
            return functions.success(res, 'Cập nhật thành công')
          }
          return functions.setError(res, 'Thiếu thông tin')
        }
        return functions.setError(res, 'Danh sách đề xuất không được để trống')
      }
      return functions.success(res, 'Cập nhật thành công')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message)
  }
}
// thời gian

exports.updatePrivateTime = async (req, res, next) => {
  try {
    const comId = req.user.data.com_id
    const type = req.user.data.type
    const isAdmin = req.user.data.isAdmin
    const listUsers = req.body.listUsers || []
    const listConfirm = req.body.listConfirm || []
    const confirm_time = Number(req.body.confirm_time)
    const typeUpdate = Number(req.body.typeUpdate)
    if (Number(type) === 1 || isAdmin) {
      if (confirm_time || confirm_time === 0) {
        if (listConfirm && Number(listConfirm.length > 0)) {
          const listPrivate = []
          listConfirm.map((e) => {
            listPrivate.push({
              dexuat_id: Number(e),
              confirm_time: Number(confirm_time),
            })
          })
          if (comId && listUsers && listUsers.length > 0) {
            await Promise.all(
              listUsers.map(async (e) => {
                const foundGateway = await SettingConfirm.findOne({
                  ep_id: Number(e),
                })
                if (foundGateway) {
                  if (foundGateway.listPrivateTime) {
                    if (foundGateway.listPrivateTime.length > 0) {
                      const listPrivateCurrent = [
                        ...foundGateway.listPrivateTime,
                      ]
                      listPrivate.map((element) => {
                        const find = listPrivateCurrent.find(
                          (value) => value.dexuat_id === element.dexuat_id
                        )
                        if (find) {
                          find.confirm_time = element.confirm_time
                        } else
                          listPrivateCurrent.push({
                            dexuat_id: element.dexuat_id,
                            confirm_time: element.confirm_time,
                          })
                      })
                      await SettingConfirm.updateOne(
                        {
                          ep_id: Number(e),
                        },
                        {
                          $set: {
                            listPrivateTime: listPrivateCurrent,
                          },
                        }
                      )
                    } else
                      await SettingConfirm.updateOne(
                        {
                          ep_id: Number(e),
                        },
                        {
                          $set: {
                            listPrivateTime: listPrivate,
                          },
                        }
                      )
                  } else {
                    await SettingConfirm.updateOne(
                      {
                        ep_id: Number(e),
                      },
                      {
                        $set: {
                          listPrivateTime: listPrivate,
                        },
                      }
                    )
                  }
                }
              })
            )
            return functions.success(res, 'Cập nhật thành công')
          }
          return functions.setError(res, 'Thiếu thông tin')
        }
        return functions.setError(res, 'Danh sách đề xuất không được để trống')
      }
      return functions.success(res, 'Cập nhật thành công')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message)
  }
}

// --------------------------- mới

// thêm list đề xuất với công ty chưa có

exports.settingProposeDefault = async (req, res, next) => {
  try {
    const comId = req.user.data.com_id
    const type = req.user.data.type
    const isAdmin = req.user.data.isAdmin
    if (Number(type) === 1 || isAdmin) {
      if (comId) {
        const list_de_xuat = [
          {
            id: 1,
            dexuat_id: 1,
            dexuat_name: 'Đơn xin nghỉ phép',
            comId: comId,
          },
          {
            id: 2,
            dexuat_id: 2,
            dexuat_name: 'Đơn xin đổi ca',
            comId: comId,
          },
          {
            id: 3,
            dexuat_id: 3,
            dexuat_name: 'Đơn tạm ứng ',
            comId: comId,
          },
          {
            id: 4,
            dexuat_id: 4,
            dexuat_name: 'Đơn xin cấp phát tài sản',

            comId: comId,
          },
          {
            id: 5,
            dexuat_id: 5,
            dexuat_name: 'Đơn xin thôi việc',

            comId: comId,
          },
          {
            id: 6,
            dexuat_id: 6,
            dexuat_name: 'Đề xuất tăng lương',

            comId: comId,
          },
          {
            id: 7,
            dexuat_id: 7,
            dexuat_name: 'Đề xuất bổ nhiệm',
            comId: comId,
          },
          {
            id: 8,
            dexuat_id: 8,
            dexuat_name: 'Đề xuất luân chuyển công tác',
            comId: comId,
          },
          {
            id: 9,
            dexuat_id: 9,
            dexuat_name: 'Đề xuất tham gia dự án',
            comId: comId,
          },
          {
            id: 10,
            dexuat_id: 10,
            dexuat_name: 'Đề xuất xin tăng ca',
            comId: comId,
          },
          {
            id: 11,
            dexuat_id: 11,
            dexuat_name: 'Đề xuất xin nghỉ chế độ thai sản',
            comId: comId,
          },
          {
            id: 12,
            dexuat_id: 12,
            dexuat_name: 'Đề xuất đăng ký sử dụng phòng họp',
            comId: comId,
          },
          {
            id: 13,
            dexuat_id: 13,
            dexuat_name: 'Đề xuất đăng ký sử dụng xe công',
            comId: comId,
          },
          {
            id: 14,
            dexuat_id: 14,
            dexuat_name: 'Đề xuất sửa chữa cơ sở vật chất',
            comId: comId,
          },
          {
            id: 15,
            dexuat_id: 15,
            dexuat_name: 'Đề xuất thanh toán',
            comId: comId,
          },
          {
            id: 16,
            dexuat_id: 16,
            dexuat_name: 'Đề xuất khiếu nại',
            comId: comId,
          },
          {
            id: 17,
            dexuat_id: 17,
            dexuat_name: 'Đề xuất cộng công',
            comId: comId,
          },
          {
            id: 18,
            dexuat_id: 18,
            dexuat_name: 'Đề xuất lịch làm việc',
            comId: comId,
          },
          {
            id: 19,
            dexuat_id: 19,
            dexuat_name: 'Đề xuất thưởng phạt',
            comId: comId,
          },
          {
            id: 20,
            dexuat_id: 20,
            dexuat_name: 'Đề xuất hoa hồng doanh thu',
            comId: comId,
          },
          {
            id: 21,
            dexuat_id: 21,
            dexuat_name: 'Đề xuất Đi sớm về muộn',
            comId: comId,
          },
          {
            id: 22,
            dexuat_id: 22,
            dexuat_name: 'Đơn xin nghỉ phép ra ngoài',
            comId: comId,
          },
          {
            id: 23,
            dexuat_id: 23,
            dexuat_name: 'Đề xuất nhập ngày nhận lương',
            comId: comId,
          },
          {
            id: 24,
            dexuat_id: 24,
            dexuat_name: 'Đề xuất xin tải tài liệu',
            comId: comId,
          },
        ]
        const data = await SettingPropose.find({ comId })
        if (data && data.length === 0) {
          await SettingPropose.insertMany(list_de_xuat)
        }

        return functions.success(res, 'Cập nhật thành công')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message)
  }
}
// cài đặt chung từng đề xuất

exports.settingPropose = async (req, res, next) => {
  try {
    const comId = req.user.data.com_id
    const type = req.user.data.type
    const isAdmin = req.user.data.isAdmin
    const list_SettingPropose = req.body.list_SettingPropose || []
    const confirm_level = Number(req.body.confirm_level) || 0
    const confirm_type = Number(req.body.confirm_type) || 0
    const confirm_time = Number(req.body.confirm_time) || 0
    if (Number(type) === 1 || isAdmin) {
      if (comId && list_SettingPropose && list_SettingPropose.length > 0) {
        await SettingPropose.updateMany(
          {
            id: { $in: list_SettingPropose },
            comId: comId,
          },
          {
            $set: {
              confirm_level: confirm_level,
              confirm_type: confirm_type,
              confirm_time: confirm_time,
            },
          },
          {
            multi: true,
          }
        )
        return functions.success(res, 'Cập nhật thành công')
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message)
  }
}

// danh sách đề xuất

exports.listSettingPropose = async (req, res, next) => {
  try {
    const comId = req.user.data.com_id
    const type = req.user.data.type
    const isAdmin = req.user.data.isAdmin
    if (Number(type) === 1 || isAdmin) {
      if (comId) {
        const pageNumber = Number(req.body.pageNumber) || 1
        const pageSize = Number(req.body.pageSize) || 50
        const id = Number(req.body.id)
        const conditions = {
          comId: comId,
        }
        if (id) conditions.id = id
        const skip = (pageNumber - 1) * pageSize
        const limit = pageSize
        const data = await SettingPropose.find(conditions)
          .skip(skip)
          .limit(limit)
        const total = await SettingPropose.countDocuments(conditions)
        return functions.success(res, 'Danh sách', { total, data })
      }
      return functions.setError(res, 'Thiếu thông tin')
    }
    return functions.setError(res, 'Tài khoản không phải Công ty')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message)
  }
}

// xem chi tiết đề xuất từng nhân viên

exports.detailUser = async (req, res, next) => {
  try {
    const com_id = req.user.data.com_id
    const type = req.user.data.type
    const { ep_id } = req.body

    if (com_id) {
      const conditions = {
        comId: com_id,
      }

      const listPropose = await SettingPropose.find(conditions).lean()
      const dataPrivate = await SettingConfirm.findOne({ ep_id: Number(ep_id) })
      if (!dataPrivate) return functions.setError(res, 'Bản ghi không tồn tại')
      const listPrivateLevel = dataPrivate.listPrivateLevel
      const listPrivateType = dataPrivate.listPrivateType
      const listPrivateTime = dataPrivate.listPrivateTime
      listPrivateLevel.map((e) => {
        const find = listPropose.find(
          (value) => Number(value.dexuat_id) === Number(e.dexuat_id)
        )
        if (find) find.confirm_level = e.confirm_level
      })
      listPrivateType.map((e) => {
        const find = listPropose.find(
          (value) => Number(value.dexuat_id) === Number(e.dexuat_id)
        )
        if (find) find.confirm_type = e.confirm_type
      })
      listPrivateTime.map((e) => {
        const find = listPropose.find(
          (value) => Number(value.dexuat_id) === Number(e.dexuat_id)
        )
        if (find) find.confirm_time = e.confirm_time
      })
      listPropose.forEach((e) => {
        if (e.confirm_type === 2) e.confirmTypeName = 'Duyệt lần lượt'
        if (e.confirm_type === 1) e.confirmTypeName = 'Duyệt đồng thời'
        if (e.confirm_type === 3)
          e.confirmTypeName = 'Duyệt lần lượt và Duyệt đồng thời'
      })

      return functions.success(res, 'Danh sách', { data: listPropose })
    }
    return functions.setError(res, 'Thiếu thông tin')
  } catch (error) {
    console.log('error', error)
    return functions.setError(res, error.message)
  }
}
