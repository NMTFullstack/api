const functions = require("../../services/functions")
const SettingOrganize = require("../../models/qlc/SettingOrganize")
const SettingIPNew = require("../../models/qlc/SettingIPNew")
const Users = require('../../models/Users');
const Deparment = require("../../models/qlc/Deparment")
const Team = require('../../models/qlc/Team');
const Group = require('../../models/qlc/Group')
const OrganizeDetail = require("../../models/qlc/OrganizeDetail")

const groupData = (data, parentId = 0) => {
    const result = [];
    data.forEach(item => {
        if (item.parentId === parentId) {
            const children = groupData(data, item.id);
            //if (children.length > 0) {
            item.children = children;
            //}
            //else 
            result.push(item);
        }
    });

    return result;
}

const deleteParentAndChildren = async (parentId) => {
    try {
        // Xóa cha
        await OrganizeDetail.deleteOne({ id: parentId });

        // Tìm tất cả các con có parentId là parentId của cha
        const children = await OrganizeDetail.find({ parentId });

        // Duyệt qua từng con và tiếp tục xóa cha và con của con nếu có
        for (const child of children) {
            await deleteParentAndChildren(child.id);
        }

    } catch (error) {
        throw error
    }
}
const deleteSettingOrganizeParentAndChildren = async (parentId, com_id) => {
    try {
        // Xóa cha
        await SettingOrganize.deleteOne({ id: parentId, comId: com_id });

        // Tìm tất cả các con có parentId là parentId của cha
        const children = await SettingOrganize.find({ parentId, comId: com_id });

        // Duyệt qua từng con và tiếp tục xóa cha và con của con nếu có
        for (const child of children) {
            await deleteSettingOrganizeParentAndChildren(child.id, com_id);
        }

    } catch (error) {
        throw error
    }
}

const updateSettingOrganize = async (comId, id, parentId, level) => {
    try {
        // update cha
        await SettingOrganize.updateOne(
            {
                id: id,
                comId: comId
            },
            {
                parentId: parentId,
                level: level + 1
            }
        )

        // Tìm tất cả các con có parentId là parentId của cha
        const children = await SettingOrganize.find({ parentId: id, comId: comId });

        // Duyệt qua từng con và tiếp tục xóa cha và con của con nếu có
        for (const child of children) {
            await updateSettingOrganize(comId, child.id, id, Number(level) + 1);
        }

    } catch (error) {
        throw error
    }
}
const updateOrganizeDetail = async (comId, id, parentId, level, listOrganizeDetailIdNew) => {
    try {
        // update cha
        const listOrganizeDetailId = [...listOrganizeDetailIdNew]
        listOrganizeDetailId.push({
            level: level + 1,
            organizeDetailId: id
        })
        const listOrganizeDetailIdOld = listOrganizeDetailId.slice(0, listOrganizeDetailId.length - 1); // Lấy từ phần tử 0 đến length - 2
        await Users.updateMany(
            {
                "inForPerson.employee.com_id": comId,
                "inForPerson.employee.listOrganizeDetailId": {
                    $size: listOrganizeDetailIdOld.length,
                    $all: listOrganizeDetailIdOld,
                }
            },
            {
                "inForPerson.employee.listOrganizeDetailId": listOrganizeDetailId
            },
            {
                multi: true
            }
        )
        await OrganizeDetail.updateOne(
            {
                id: id,
                comId: comId
            },
            {
                parentId: parentId,
                level: level + 1,
                listOrganizeDetailId: listOrganizeDetailId
            }
        )

        // Tìm tất cả các con có parentId là parentId của cha
        const children = await OrganizeDetail.find({ parentId: id, comId: comId });

        // Duyệt qua từng con và tiếp tục xóa cha và con của con nếu có

        for (const child of children) {
            await updateOrganizeDetail(comId, child.id, id, Number(level) + 1, listOrganizeDetailId);
        }

    } catch (error) {
        throw error
    }
}

// tạo tổ chức mới
exports.create = async (req, res, next) => {
    try {
        const { parentId, organizeName } = req.body
        let { level } = req.body
        const comId = req.body.comId || req.user.data.com_id
        const type = req.user.data.type
        if (Number(type) === 1) {
            const maxId = await SettingOrganize.findOne({}, { id: 1 }, { sort: { id: -1 } }).lean() || 0;
            const id = Number(maxId.id) + 1 || 1;
            if (comId, organizeName) {
                const foundGateway = await SettingOrganize.findOne({ organizeName: organizeName, comId: comId })
                if (foundGateway) return functions.setError(res, "Tên tổ chức đã tồn tại");
                if (!level || !Number(parentId)) level = 1

                const newData = new SettingOrganize({
                    id: id,
                    comId: Number(comId),
                    parentId: Number(parentId) || 0,
                    organizeName: organizeName,
                    level: level,
                    created_time: functions.getTimeNow(),
                    update_time: functions.getTimeNow()
                })
                await newData.save();
                return functions.success(res, "Tạo thành công", { data: newData })
            }
            else return functions.setError(res, "Không được để trống comId hoặc organizeName");
        }
        else return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}

// lấy danh sách đã nhóm tổ chức

exports.list = async (req, res, next) => {
    try {

        const comId = req.user.data.com_id
        const type = req.user.data.type
        const { id, level, parentId } = req.body
        const conditions = {
            comId: comId
        }
        if (id) conditions.id = Number(id)
        if (level) conditions.level = Number(level)
        if (parentId) conditions.parentId = Number(parentId)
        if (comId) {

            const data = await SettingOrganize.aggregate([
                {
                    $match: conditions
                },
                {
                    $sort: { parentId: 1 }
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
                        'parentId': 1,
                        'name': '$organizeName',
                        'comId': 1,
                        "level": 1,
                        'comName': "$comInfo.userName"
                    }
                }
            ])
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                element.key = element.id
            }

            await Promise.all(
                data.map(async (value, index) => {
                    const organizeDetail_num = await OrganizeDetail.countDocuments({
                        comId: comId,
                        settingOrganizeId: value.id
                    })
                    data[index].organizeDetail_num = organizeDetail_num
                })
            )

            const finalResult = groupData(data)
            return functions.success(res, "Danh sách tổ chức",

                {
                    data: {
                        name: "Sơ đồ tổ chức tổng quan",
                        children: finalResult || []

                    }
                }

            )

        }
        else return functions.setError(res, "Không được để trống comId hoặc organizeName");

    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}

// danh sách tổ chức trong công ty (lấy theo com_id token)
exports.listAll = async (req, res, next) => {
    try {

        const comId = Number(req.body.com_id)

        const { id, level, parentId, parentLevel, parentChil } = req.body
        const conditions = {
            comId: comId
        }
        if (id) conditions.id = Number(id)
        if (level) conditions.level = Number(level)
        if (parentId) conditions.parentId = Number(parentId)
        else if (parentLevel) conditions.parentId = { $lt: parentLevel }
        else if (parentChil) conditions.parentId = { $gt: parentChil }

        if (comId) {

            const data = await SettingOrganize.aggregate([
                {
                    $match: conditions
                },
                {
                    $sort: { parentId: 1 }
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
                        'parentId': 1,
                        'organizeName': 1,
                        'comId': 1,
                        "level": 1,
                        'comName': "$comInfo.userName"
                    }
                }
            ])
            return functions.success(res, "Danh sách tổ chức", { data })
        }
        else return functions.setError(res, "Không được để trống id công ty");

    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}

// Cập nhật thông tin
exports.update = async (req, res, next) => {
    try {
        const { id, parentId, organizeName } = req.body
        const type = req.user.data.type
        if (Number(type) === 1) {
            if (id) {
                const foundGateway = await SettingOrganize.findOne({ id: id })
                if (!foundGateway) return functions.setError(res, "Không tồn tại tổ chức");
                const checkName = await SettingOrganize.findOne({
                    organizeName: organizeName || foundGateway.organizeName,
                    parentId: parentId || foundGateway.parentId,
                    id: { $ne: id }
                })
                if (checkName) return functions.setError(res, "Tên tổ chức đã tồn tại");
                const data = {}
                if (parentId) data.parentId = Number(parentId)
                if (organizeName) data.organizeName = organizeName
                await SettingOrganize.updateOne({ id: id }, {
                    $set: data
                })
                return functions.success(res, "Cập nhật thành công")
            }
            else return functions.setError(res, "Thiếu thông tin");
        }
        else return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}

// xóa tổ chức

exports.delete = async (req, res, next) => {
    try {
        const { id } = req.body
        const com_id = req.user.data.com_id
        const type = req.user.data.type
        if (Number(type) === 1) {
            if (id, com_id) {
                const foundGateway = await SettingOrganize.findOne({ id: id, comId: com_id })
                if (!foundGateway) return functions.setError(res, "Không tồn tại tổ chức");
                await deleteSettingOrganizeParentAndChildren(id, com_id)
                const findOrganizeDetail = await OrganizeDetail.find({ comId: com_id, settingOrganizeId: id })
                if (findOrganizeDetail && findOrganizeDetail.length > 0) {
                    await Promise.all(
                        findOrganizeDetail.map(async e => {
                            await deleteParentAndChildren(e.id)
                        })
                    )
                }
                return functions.success(res, "Xóa thành công");
            }
            else return functions.setError(res, "Thiếu thông tin");
        }
        else return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}
// danh sách tổ chức  có thể chọn
exports.listAllChoose = async (req, res, next) => {
    try {

        const comId = req.user.data.com_id
        const type = req.user.data.type
        const conditions = {
            comId: comId
        }
        if (comId) {
            const result = await SettingOrganize.find({ comId: comId })
            const finalResult = []
            await Promise.all(
                result.map(async e => {
                    if (Number(e.level) !== 1 && Number(e.parentId) !== 0) {
                        const foundGateway = await OrganizeDetail.findOne({ settingOrganizeId: e.parentId })
                        if (foundGateway) finalResult.push(e)
                    } else if (Number(e.level) === 1 && Number(e.parentId) === 0) finalResult.push(e)
                })
            )
            return functions.success(res, "Danh sách cơ cấu", { data: finalResult });
        }
        else return functions.setError(res, "Thiếu thông tin");

    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}

//  di chuyển

exports.swap = async (req, res, next) => {
    try {
        const { start_id, end_id, organizeDetailId } = req.body
        const type = req.user.data.type
        const comId = req.user.data.com_id
        if (Number(type) === 1) {
            if (start_id, end_id, comId) {
                const findStart = await SettingOrganize.findOne({
                    id: Number(start_id),
                    comId: comId
                })

                if (!findStart) return functions.setError(res, "Tổ chức đầu không tồn tại");
                const findEnd = await SettingOrganize.findOne({
                    id: Number(end_id),
                    comId: comId
                })
                if (!findStart) return functions.setError(res, "Tổ chức thứ hai không tồn tại");
                let findOrganizeDetail
                if (organizeDetailId) {
                    findOrganizeDetail = await OrganizeDetail.findOne({
                        id: organizeDetailId,
                        comId: comId
                    })
                }
                else {
                    findOrganizeDetail = await OrganizeDetail.findOne({
                        settingOrganizeId: end_id,
                        comId: comId
                    })
                }
                if (Number(findStart.level) > Number(findEnd.level)) {
                    await updateSettingOrganize(comId, findStart.id, findEnd.id, findEnd.level)
                    const list = await OrganizeDetail.find({
                        settingOrganizeId: findStart.id,
                        comId: comId
                    })
                    await Promise.all(
                        list.map(async e => {
                            updateOrganizeDetail(comId, e.id, findOrganizeDetail.id, findOrganizeDetail.level, findOrganizeDetail.listOrganizeDetailId)
                        })
                    )
                }

                return functions.success(res, "Cập nhật thành công")
            }
            else return functions.setError(res, "Thiếu thông tin");
        }
        else return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}


