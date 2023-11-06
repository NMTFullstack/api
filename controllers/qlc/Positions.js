const functions = require("../../services/functions")
const Positions = require("../../models/qlc/Positions")
const Users = require('../../models/Users');
const _ = require('lodash');

const groupData = (data) => {

    try {
        const tree = [];
        const nodeMap = {};

        data.forEach((item) => {
            const { id, comId, level, positionName, comName, isManager } = item;
            const node = {
                id,
                comId,
                parentId: 0, // Giả sử tất cả là con trực tiếp của gốc (0)
                level,
                name: positionName,
                comName: comName, // Thay thế bằng tên công ty thật
                isManager: isManager,
                children: [],
            };

            if (level > 1) {
                const parentLevel = level - 1;
                const parent = nodeMap[parentLevel][nodeMap[parentLevel].length - 1];
                node.parentId = parent.id;
                parent.children.push(node);
            } else {
                tree.push(node);
            }

            if (!nodeMap[level]) {
                nodeMap[level] = [];
            }
            nodeMap[level].push(node);
        });

        return tree;
    }
    catch (e) {
        return []
    }
}

// tạo chức vụ
exports.create = async (req, res, next) => {
    try {
        const { positionName, typeAdd, isManager } = req.body
        // typeAdd : 1 : Trên, 2:Dưới, 3:Bằng cấp
        const comId = req.body.comId || req.user.data.com_id
        const type = req.user.data.type
        let { level } = req.body
        if (Number(type) === 1) {
            if (comId && positionName) {
                const maxId = await Positions.findOne({ comId: comId }, { id: 1 }, { sort: { id: -1 } }).lean() || 0;
                const id = Number(maxId.id) + 1 || 1;
                // trên
                if (Number(typeAdd) === 1) {

                    const findUpdateLevel = await Positions.find({ level: { $gte: level }, comId: comId })

                    await Promise.all(
                        findUpdateLevel.map(async e => {
                            await Positions.updateOne({ id: e.id, comId: comId }, {
                                level: Number(e.level) + 1
                            })
                        })
                    )

                    level = level
                }
                // dưới
                if (Number(typeAdd) === 2) {

                    const findUpdateLevel = await Positions.find({ level: { $gt: level }, comId: comId })

                    await Promise.all(
                        findUpdateLevel.map(async e => {
                            await Positions.updateOne({ id: e.id, comId: comId }, {
                                level: Number(e.level) + 1
                            })
                        })
                    )
                    level = level + 1
                }
                if (!Number(level)) level = 1
                const newData = new Positions({
                    id: id,
                    comId: comId,
                    positionName: positionName,
                    level: level,
                    isManager: isManager || 0,
                    created_time: functions.getTimeNow(),
                    update_time: functions.getTimeNow()
                })
                newData.save()

                return functions.success(res, "Tạo thành công", { data: newData })
            }
            return functions.setError(res, "Thiếu thông tin");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}

// lấy danh sách chức vụ ()

exports.list = async (req, res, next) => {
    try {

        const comId = req.user.data.com_id
        const type = req.user.data.type
        const { id, level } = req.body
        const conditions = {
            comId: comId
        }
        if (id) conditions.id = Number(id)
        if (level) conditions.level = Number(level)

        if (comId) {
            let data = await Positions.aggregate([
                {
                    $match: conditions
                },
                {
                    $sort: { level: 1 }
                },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'comId',
                        foreignField: 'idQLC',
                        let: { "type": "$type" },
                        pipeline: [{ $match: { type: 1 } }],
                        as: 'comInfo'
                    }
                },
                {
                    $unwind: '$comInfo'
                },
                {
                    $project: {
                        '_id': 0,
                        'id': 1,
                        'positionName': 1,
                        'level': 1,
                        'comId': 1,
                        'comName': "$comInfo.userName",
                        "isManager": 1

                    }
                }
            ])

            if (data && data.length > 0)
                data = groupData(data)
            else data = []
            return functions.success(res, "Danh sách chức vụ", {
                data: {
                    name: "Sơ đồ chức vụ",
                    children: data

                }
            })
        }
        else return functions.setError(res, "Không được để trống comId hoặc organizeName");

    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}

// danh sách chức vụ trong công ty (lấy theo com_id token)
exports.listAll = async (req, res, next) => {
    try {
        const comId = Number(req.body.com_id)
        const { id, level } = req.body
        const conditions = {
            comId: comId
        }
        if (id) conditions.id = Number(id)
        if (level) conditions.level = Number(level)

        if (comId) {
            const data = await Positions.find(conditions, {}).sort({ level: 1 })
            return functions.success(res, "Danh sách chức vụ", { data })
        }
        else return functions.setError(res, "Không được để trống id công ty");

    } catch (error) {

        return functions.setError(res, error.message)
    }
}

// thêm chức vụ cho list users

// [
//     {
//         ep_id: 1,
//         idQLC: 2
//     }
// ]
exports.createUsersPositions = async (req, res, next) => {
    try {
        const { listUsersPositions } = req.body
        const comId = req.body.comId || req.user.data.com_id
        const type = req.user.data.type
        if (Number(type) === 1) {
            if (comId) {
                if (listUsersPositions && listUsersPositions.length > 0) {
                    await Promise.all(
                        listUsersPositions.map(async e => {
                            await Users.updateOne({ idQLC: e.ep_id, type: 2 }, {
                                "inForPerson.employee.position_id": e.position_id
                            })
                        })
                    )
                }
                return functions.success(res, "Thêm thành công")
            }
            return functions.setError(res, "Thiếu thông tin");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}

// xóa chức vụ
exports.delete = async (req, res, next) => {
    try {
        const comId = req.body.comId || req.user.data.com_id
        const type = req.user.data.type
        if (Number(type) === 1) {
            const { id } = req.body
            if (id, comId) {
                const foundGateway = await Positions.findOne({ id: id, comId: comId })
                if (!foundGateway) return functions.setError(res, "Chức vụ không tồn tại");
                await Positions.deleteOne({ id: id, comId: comId })
                const findUpdateLevel = await Positions.find({ level: { $gt: foundGateway.level }, comId: comId })
                if (findUpdateLevel && findUpdateLevel.length > 0) {
                    await Promise.all(
                        findUpdateLevel.map(async e => {
                            await Positions.updateOne({ id: e.id, comId: comId }, {
                                level: Number(e.level) - 1
                            })
                        })
                    )
                }
                return functions.success(res, "Xóa thành công");
            }
            return functions.setError(res, "Thiếu thông tin");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}

// exports.delete = async (req, res, next) => {
//     try {
//         const comId = req.body.comId || req.user.data.com_id
//         const type = req.user.data.type
//         if (Number(type) === 1) {
//             const { id } = req.body
//             if (id) {
//                 const foundGateway = await Positions.findOne({ id: id })
//                 if (!foundGateway) return functions.setError(res, "Chức vụ không tồn tại");
//                 await Positions.deleteOne({ id: id })
//                 return functions.success(res, "Thiếu thông tin");
//             }
//             return functions.setError(res, "Thiếu thông tin");
//         }
//         return functions.setError(res, "Tài khoản không phải Công ty");
//     } catch (error) {
//         console.log("error", error)
//         return functions.setError(res, error.message)
//     }
// }

// cập nhật tên

exports.update = async (req, res, next) => {
    try {
        const { id, positionName, isManager } = req.body
        // typeAdd : 1 : Trên, 2:Dưới, 3:Bằng cấp
        const comId = req.body.comId || req.user.data.com_id
        const type = req.user.data.type
        let { level } = req.body
        if (Number(type) === 1) {
            let updateIsManager = undefined;

            if (id, comId) {
                const foundGateway = await Positions.findOne({ id: id })
                if (!foundGateway) return functions.setError(res, "chức vụ không tồn tại");
                if (!Number(isManager)) updateIsManager = foundGateway.isManager
                if (Number(isManager) || Number(isManager) === 0) updateIsManager = Number(isManager)
                const checkName = await Positions.findOne({
                    comId: comId,
                    positionName: positionName || foundGateway.positionName,
                    id: { $ne: id }
                })
                const update = {

                }
                if (positionName) update.positionName = positionName
                if (updateIsManager || Number(updateIsManager) === 0) update.isManager = updateIsManager
                if (checkName) return functions.setError(res, "Tên tổ chức đã tồn tại")
                await Positions.updateOne({ id: id, comId: comId }, {
                    $set: update
                })
                return functions.success(res, "Sửa thành công")
            }
            return functions.setError(res, "Thiếu thông tin");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}

exports.InitNewPostions = async (req, res) => {
    const { com_id } = req.body;
    const pos = [
        { level: 21, value: '1', label: 'SINH VIÊN THỰC TẬP', },
        { level: 20, value: '9', label: 'NHÂN VIÊN PART TIME', },
        { level: 19, value: '2', label: 'NHÂN VIÊN THỬ VIỆC', },
        { level: 18, value: '3', label: 'NHÂN VIÊN CHÍNH THỨC', },
        { level: 17, value: '20', label: 'NHÓM PHÓ', },
        { level: 16, value: '4', label: 'TRƯỞNG NHÓM', },
        { level: 15, value: '12', label: 'PHÓ TỔ TRƯỞNG', },
        { level: 14, value: '13', label: 'TỔ TRƯỞNG', },
        { level: 13, value: '10', label: 'PHÓ BAN DỰ ÁN', },
        { level: 12, value: '11', label: 'TRƯỞNG BAN DỰ ÁN', },
        { level: 11, value: '5', label: 'PHÓ TRƯỞNG PHÒNG', },
        { level: 10, value: '6', label: 'TRƯỞNG PHÒNG', },
        { level: 9, value: '7', label: 'PHÓ GIÁM ĐỐC', },
        { level: 8, value: '8', label: 'GIÁM ĐỐC', },
        { level: 7, value: '14', label: 'PHÓ TỔNG GIÁM ĐỐC', },
        { level: 6, value: '16', label: 'TỔNG GIÁM ĐỐC', },
        { level: 5, value: '22', label: 'PHÓ TỔNG GIÁM ĐỐC TẬP ĐOÀN', },
        { level: 4, value: '21', label: 'TỔNG GIÁM ĐỐC TẬP ĐOÀN', },
        { level: 3, value: '17', label: 'THÀNH VIÊN HỘI ĐỒNG QUẢN TRỊ', },
        { level: 2, value: '18', label: 'PHÓ CHỦ TỊCH HỘI ĐỒNG QUẢN TRỊ', },
        { level: 1, value: '19', label: 'CHỦ TỊCH HỘI ĐỒNG QUẢN TRỊ', },
    ]
    const pos_in_com = pos.map(pos => {
        let isManager = 0;
        if (pos.level <= 9) {
            isManager = 1;
        }
        return {
            id: Number(pos.value),
            comId: com_id,
            positionName: pos.label,
            level: pos.level,
            isManager: isManager,
            created_time: Math.round(new Date().getTime() / 1000),
        }
    })
    const update = await Positions.insertMany(pos_in_com)
    return res.status(200).json({ update });
}

exports.swap = async (req, res, next) => {
    try {

        const comId = req.body.comId || req.user.data.com_id
        const type = req.user.data.type
        const isAdmin = req.user.data.isAdmin;
        if (Number(type) === 1) {
            const start_id = Number(req.body.start_id)
            const end_id = Number(req.body.end_id)
            if (comId, start_id, end_id) {
                const findStart = await Positions.findOne({
                    comId: comId,
                    id: start_id
                })
                if (!findStart) return functions.setError(res, "Chức vụ đầu không tồn tại");
                const findEnd = await Positions.findOne({
                    comId: comId,
                    id: end_id
                })
                if (!findEnd) return functions.setError(res, "Chức vụ  cuối không tồn tại");

                await Positions.updateOne(
                    {
                        id: start_id,
                        comId: comId
                    },
                    {
                        $set: {
                            level: findEnd.level
                        }
                    }
                )
                await Positions.updateOne(
                    {
                        id: end_id,
                        comId: comId
                    },
                    {
                        $set: {
                            level: findStart.level
                        }
                    }
                )
                return functions.success(res, "Di chuyển thành công")
            }
            return functions.setError(res, "Thiếu thông tin");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}



