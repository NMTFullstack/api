const functions = require("../../services/functions");
const OrganizeDetail = require("../../models/qlc/OrganizeDetail");
const SettingOrganize = require("../../models/qlc/SettingOrganize");
const SettingIPNew = require("../../models/qlc/SettingIPNew");
const Users = require("../../models/Users");
const Deparment = require("../../models/qlc/Deparment");
const Team = require("../../models/qlc/Team");
const Group = require("../../models/qlc/Group");
const CC365_TimeSheet = require("../../models/qlc/TimeSheets");
const CC365_Cycle = require("../../models/qlc/Cycle");

const groupData = (data, parentId = 0) => {
    const result = [];

    data.forEach((item) => {
        if (item.parentId === parentId) {
            const children = groupData(data, item.id);
            if (children.length > 0) {
                item.children = children;
            }
            result.push(item);
        }
    });

    return result;
};
const convertData = (data) => {
    const arr = [];
    const result = [];
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const obj = {};
            obj[key] = data[key];
            arr.push(obj);
        }
    }
    arr.map((e) => {
        for (const key in e) {
            if (e.hasOwnProperty(key)) {
                const value = e[key];
                result.push({
                    key: key,
                    value: value,
                });
            }
        }
    });
    return result;
};

const deleteParentAndChildren = async (parentId) => {
    try {
        // Xóa cha
        await OrganizeDetail.deleteOne({ id: parentId });

        // Tìm tất cả các con có parentId là parentId của cha
        const children = await OrganizeDetail.find({ parentId: parentId });

        // Duyệt qua từng con và tiếp tục xóa cha và con của con nếu có
        for (const child of children) {
            await deleteParentAndChildren(child.id);
        }
    } catch (error) {
        throw error;
    }
};

const updateSettingOrganize = async (comId, id, parentId, level) => {
    try {
        // update cha
        await SettingOrganize.updateOne(
            {
                id: id,
                comId: comId,
            },
            {
                parentId: parentId,
                level: level + 1,
            }
        );

        // Tìm tất cả các con có parentId là parentId của cha
        const children = await SettingOrganize.find({
            parentId: id,
            comId: comId,
        });

        // Duyệt qua từng con và tiếp tục xóa cha và con của con nếu có
        for (const child of children) {
            await updateSettingOrganize(comId, child.id, id, Number(level) + 1);
        }
    } catch (error) {
        throw error;
    }
};
const updateOrganizeDetail = async (
    comId,
    id,
    parentId,
    level,
    listOrganizeDetailIdNew
) => {
    try {
        // update cha
        const listOrganizeDetailId = [...listOrganizeDetailIdNew];
        listOrganizeDetailId.push({
            level: level + 1,
            organizeDetailId: id,
        });
        const listOrganizeDetailIdOld = listOrganizeDetailId.slice(
            0,
            listOrganizeDetailId.length - 1
        ); // Lấy từ phần tử 0 đến length - 2
        await Users.updateMany(
            {
                "inForPerson.employee.com_id": comId,
                "inForPerson.employee.listOrganizeDetailId": {
                    $size: listOrganizeDetailIdOld.length,
                    $all: listOrganizeDetailIdOld,
                },
            },
            {
                "inForPerson.employee.listOrganizeDetailId":
                    listOrganizeDetailId,
            },
            {
                multi: true,
            }
        );
        await OrganizeDetail.updateOne(
            {
                id: id,
                comId: comId,
            },
            {
                parentId: parentId,
                level: level + 1,
                listOrganizeDetailId: listOrganizeDetailId,
            }
        );

        // Tìm tất cả các con có parentId là parentId của cha
        const children = await OrganizeDetail.find({
            parentId: id,
            comId: comId,
        });

        // Duyệt qua từng con và tiếp tục xóa cha và con của con nếu có

        for (const child of children) {
            await updateOrganizeDetail(
                comId,
                child.id,
                id,
                Number(level) + 1,
                listOrganizeDetailId
            );
        }
    } catch (error) {
        throw error;
    }
};

const updateOrganizeEqualLevel = async (
    comId,
    id,
    level,
    listOrganizeDetailId,
    parentId
) => {
    try {
        level = level + 1;
        const listOrganizeDetailIdNew = [...listOrganizeDetailId];

        listOrganizeDetailIdNew.push({
            level: level,
            organizeDetailId: id,
        });

        const promises = [];
        promises.push(
            OrganizeDetail.updateOne(
                {
                    id: id,
                },
                {
                    parentId: parentId,
                    listOrganizeDetailId: listOrganizeDetailIdNew,
                    level: level,
                }
            )
        );
        promises.push(
            Users.updateMany(
                {
                    "inForPerson.employee.com_id": comId,
                    "inForPerson.employee.organizeDetailId": id,
                },
                {
                    "inForPerson.employee.listOrganizeDetailId":
                        listOrganizeDetailIdNew,
                },
                {
                    multi: true,
                }
            )
        );
        await Promise.all(promises);
        const children = await OrganizeDetail.find({ parentId: id });
        for (const child of children) {
            await updateOrganizeEqualLevel(
                comId,
                child.id,
                Number(level),
                listOrganizeDetailIdNew,
                id
            );
        }
    } catch (error) {
        throw error;
    }
};

const updateOrganizeEqualParent = async (comId, findStart, findEnd) => {
    try {
        await OrganizeDetail.updateOne(
            {
                id: Number(findStart.id),
                comId: comId,
            },
            {
                range: Number(findEnd.range),
            }
        );
        await OrganizeDetail.updateOne(
            {
                id: Number(findEnd.id),
                comId: comId,
            },
            {
                range: Number(findStart.range),
            }
        );
    } catch (error) {
        throw error;
    }
};

const updateUserDeleteOrganizeDetail = async (
    comId,
    foundGateway,
    listOrganizeDetailId,
    organizeDetailId
) => {
    await Users.updateMany(
        {
            "inForPerson.employee.com_id": comId,
            "inForPerson.employee.listOrganizeDetailId": {
                $all: foundGateway.listOrganizeDetailId,
            },
        },
        {
            "inForPerson.employee.listOrganizeDetailId": listOrganizeDetailId,
            "inForPerson.employee.organizeDetailId": organizeDetailId,
        },
        {
            multi: true,
        }
    );
};
// tạo tổ chức chi tiết
exports.create = async (req, res, next) => {
    try {
        const { organizeDetailName, content } = req.body;
        const parentId = Number(req.body.parentId) || 0;
        const comId = req.body.comId || req.user.data.com_id;
        const type = req.user.data.type;
        let { level } = req.body;
        const listOrganizeDetailId = req.body.listOrganizeDetailId || [];
        if (Number(type) === 1) {
            const maxId =
                (await OrganizeDetail.findOne(
                    {},
                    { id: 1 },
                    { sort: { id: -1 } }
                ).lean()) || 0;
            const id = Number(maxId.id) + 1 || 1;
            if ((comId, organizeDetailName, content)) {
                const foundGateway = await OrganizeDetail.findOne({
                    organizeDetailName: organizeDetailName,
                    comId: comId,
                    parentId: parentId,
                });
                if (foundGateway)
                    return functions.setError(
                        res,
                        "Tên tổ chức chi tiết đã tồn tại"
                    );

                if (!level || !Number(parentId)) level = 1;

                listOrganizeDetailId.push({
                    level: level,
                    organizeDetailId: id,
                });
                const newData = new OrganizeDetail({
                    id: id,
                    range: id,
                    comId: Number(comId),
                    parentId: Number(parentId) || 0,
                    organizeDetailName: organizeDetailName,
                    content: content,
                    level: level,
                    listOrganizeDetailId: listOrganizeDetailId,
                    created_time: functions.getTimeNow(),
                    update_time: functions.getTimeNow(),
                });
                await newData.save();
                return functions.success(res, "Tạo thành công", {
                    data: newData,
                });
            } else
                return functions.setError(
                    res,
                    "Không được để trống comId hoặc organizeName"
                );
        } else return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error);
        return functions.setError(res, error.message);
    }
};

// lấy danh sách đã nhóm tổ chức chi tiết

exports.list = async (req, res, next) => {
    try {
        const comId = req.user.data.com_id;
        const type = req.user.data.type;
        const { id, level, parentId } = req.body;
        const conditions = {
            comId: comId,
        };
        if (id) conditions.id = Number(id);
        if (level) conditions.level = Number(level);
        if (parentId) conditions.parentId = Number(parentId);

        if (comId) {
            const data = await OrganizeDetail.aggregate([
                {
                    $match: conditions,
                },
                {
                    $sort: { parentId: 1, range: 1 },
                },
                {
                    $lookup: {
                        from: "Users",
                        localField: "comId",
                        foreignField: "idQLC",
                        let: { type: "$type" },
                        pipeline: [{ $match: { type: 1 } }],
                        as: "comInfo",
                    },
                },
                {
                    $unwind: "$comInfo",
                },

                {
                    $project: {
                        _id: 0,
                        id: 1,
                        parentId: 1,
                        name: "$organizeDetailName",
                        comId: 1,
                        comName: "$comInfo.userName",
                        content: 1,
                        level: 1,
                        listOrganizeDetailId: 1,
                    },
                },
            ]);
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                element.key = element.id;
            }
            // thống kê chấm công
            let condition2 = {};
            let time = new Date();
            let year = time.getFullYear();
            let month = time.getMonth();
            let day = time.getDate();

            let time_k1_start = new Date(year, month, day).getTime() / 1000;
            let time_k1_end = time_k1_start + 46800;
            // k1 : tính từ 0h đến 13h
            let time12h = time_k1_start + 86400;
            // tính từ 0h đến 24h

            condition2.ts_com_id = comId;
            if (
                time_k1_start < time.getTime() / 1000 &&
                time.getTime() / 1000 < time_k1_end
            ) {
                condition2.is_success = 1;
                condition2.at_time = {
                    $gt: new Date(time_k1_start * 1000),
                    $lt: new Date(time_k1_end * 1000),
                };
            } else {
                condition2.is_success = 1;
                condition2.at_time = {
                    $gt: new Date(time_k1_end * 1000),
                    $lt: new Date(time12h * 1000),
                };
            }

            await Promise.all(
                data.map(async (value, index) => {
                    // số lượng nhân viên
                    const ep_num = await Users.countDocuments({
                        "inForPerson.employee.com_id": comId,
                        "inForPerson.employee.listOrganizeDetailId": {
                            $all: value.listOrganizeDetailId,
                        },
                        "inForPerson.employee.ep_status": "Active",
                    });
                    data[index].ep_num = ep_num;
                    // tìm số lượng đi làm/nghỉ
                    let listTimeSheet = await CC365_TimeSheet.find(condition2, {
                        ep_id: 1,
                    }).lean();
                    let listUsers = [];
                    listTimeSheet.map((e) => listUsers.push(Number(e.ep_id))); // danh sách nhân viên chấm công
                    const nv_di_lam = await Users.countDocuments({
                        idQLC: { $in: listUsers },
                        "inForPerson.employee.com_id": comId,
                        "inForPerson.employee.listOrganizeDetailId": {
                            $all: value.listOrganizeDetailId,
                        },
                        "inForPerson.employee.ep_status": "Active",
                    });
                    data[index].nv_di_lam = nv_di_lam;
                    nv_nghi = Number(ep_num) - Number(nv_di_lam);
                    data[index].nv_nghi = nv_nghi;
                    // tìm quản lý
                    const manager = await Users.aggregate([
                        {
                            $match: {
                                "inForPerson.employee.com_id": comId,
                                "inForPerson.employee.listOrganizeDetailId": {
                                    $all: value.listOrganizeDetailId,
                                },
                                "inForPerson.employee.ep_status": "Active",
                            },
                        },
                        {
                            $lookup: {
                                from: "QLC_Positions",
                                localField: "inForPerson.employee.position_id",
                                foreignField: "id",
                                let: { comId: "$comId" },
                                pipeline: [{ $match: { comId: comId } }],
                                as: "positions",
                            },
                        },
                        {
                            $unwind: "$positions",
                        },
                        {
                            $sort: {
                                "positions.level": 1,
                            },
                        },
                        {
                            $skip: 0,
                        },
                        {
                            $limit: 2,
                        },
                        {
                            $project: {
                                _id: 0,
                                userName: 1,
                                idQLC: 1,
                                position_id:
                                    "$inForPerson.employee.position_id",
                            },
                        },
                    ]);
                    if (manager && Number(manager.length) === 2) {
                        if (
                            Number(manager[0].position_id) !==
                            Number(manager[1].position_id)
                        ) {
                            data[index].manager = manager[0].userName;
                            data[index].managerId = manager[0].idQLC;
                        }
                    } else if (manager && Number(manager.length) === 1) {
                        data[index].manager = manager[0].userName;
                        data[index].managerId = manager[0].idQLC;
                    }
                })
            );

            // end

            const finalResult = groupData(data);

            return functions.success(res, "Danh sách tổ chức", {
                data: {
                    name: "Sơ đồ tổ chức chi tiết",
                    children: finalResult,
                },
            });
        } else
            return functions.setError(
                res,
                "Không được để trống comId hoặc organizeName"
            );
    } catch (error) {
        console.log("error", error);
        return functions.setError(res, error.message);
    }
};

// danh sách tổ chức trong công ty
exports.listAll = async (req, res, next) => {
    try {
        const comId = Number(req.body.com_id);
        const { id, level, parentId } = req.body;
        const conditions = {
            comId: comId,
        };
        if (id) conditions.id = Number(id);
        if (level) conditions.level = Number(level);
        if (parentId) conditions.parentId = Number(parentId);

        if (comId) {
            const data = await OrganizeDetail.aggregate([
                {
                    $match: conditions,
                },
                {
                    $sort: { level: 1 },
                },
                {
                    $lookup: {
                        from: "Users",
                        localField: "comId",
                        foreignField: "idQLC",
                        let: { type: "$type" },
                        pipeline: [{ $match: { type: 1 } }],
                        as: "comInfo",
                    },
                },
                {
                    $unwind: "$comInfo",
                },

                {
                    $project: {
                        _id: 0,
                        id: 1,
                        parentId: 1,
                        organizeDetailName: 1,
                        comId: 1,
                        comName: "$comInfo.userName",
                        content: 1,
                        level: 1,
                        listOrganizeDetailId: 1,
                    },
                },
            ]);

            return functions.success(res, "Danh sách chi tiết công ty", {
                data,
            });
        } else return functions.setError(res, "Không được để trống id công ty");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error.message);
    }
};

// thêm  1 nhân viên vào

exports.addListUser = async (req, res, next) => {
    try {
        const comId = req.user.data.com_id;
        const type = req.user.data.type;
        const { listUsers, listOrganizeDetailId, organizeDetailId } = req.body;
        if (Number(type) === 1) {
            await Users.updateMany(
                {
                    type: 2,
                    "inForPerson.employee.com_id": comId,
                    idQLC: {
                        $in: listUsers,
                    },
                },
                {
                    "inForPerson.employee.listOrganizeDetailId":
                        listOrganizeDetailId,
                    "inForPerson.employee.organizeDetailId": organizeDetailId,
                }
            );

            return functions.success(res, "Thêm thành công");
        } else return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error);
        return functions.setError(res, error.message);
    }
};

// cập nhật thông tin
exports.update = async (req, res, next) => {
    try {
        const { id, parentId, organizeDetailName, content } = req.body;
        const type = req.user.data.type;
        if (Number(type) === 1) {
            if (id) {
                const foundGateway = await OrganizeDetail.findOne({ id: id });
                if (!foundGateway)
                    return functions.setError(res, "Không tồn tại tổ chức");
                const checkName = await OrganizeDetail.findOne({
                    organizeDetailName:
                        organizeDetailName || foundGateway.organizeDetailName,
                    parentId: parentId || foundGateway.parentId,
                    id: { $ne: id },
                });
                if (checkName)
                    return functions.setError(res, "Tên tổ chức đã tồn tại");
                const data = {};
                if (parentId) data.parentId = Number(parentId);
                if (organizeDetailName)
                    data.organizeDetailName = organizeDetailName;
                if (content) data.content = content;
                await OrganizeDetail.updateOne(
                    { id: id },
                    {
                        $set: data,
                    }
                );
                return functions.success(res, "Cập nhật thành công");
            } else
                return functions.setError(
                    res,
                    "Bắt buộc phải truyền id tổ chức"
                );
        } else return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error);
        return functions.setError(res, error.message);
    }
};

// danh sách nhân viên thuộc hàng cơ cấu cây

exports.listUser = async (req, res, next) => {
    try {
        const comId = req.user.data.com_id;
        const type = req.user.data.type;
        // parentLevel
        const organizeDetailId = Number(req.body.organizeDetailId);
        if (Number(type) === 1) {
            if (comId) {
                const foundGateway = await OrganizeDetail.findOne({
                    id: organizeDetailId,
                });

                if (!foundGateway)
                    return functions.setError(res, "Tổ chức không tồn tại");

                const listUser = await Users.aggregate([
                    {
                        $match: {
                            $and: [
                                {
                                    "inForPerson.employee.listOrganizeDetailId":
                                        { $exists: true },
                                }, // Đảm bảo tồn tại trường listOrganizeDetailId
                                {
                                    "inForPerson.employee.listOrganizeDetailId":
                                        { $ne: [] },
                                }, // Loại bỏ mảng rỗng
                                {
                                    "inForPerson.employee.listOrganizeDetailId":
                                        {
                                            $not: {
                                                $elemMatch: {
                                                    $nin: foundGateway.listOrganizeDetailId.map(
                                                        (item) => ({
                                                            level: item.level,
                                                            organizeDetailId:
                                                                item.organizeDetailId,
                                                        })
                                                    ),
                                                },
                                            },
                                        },
                                },
                            ],
                        },
                    },
                    {
                        $lookup: {
                            from: "QLC_Positions",
                            localField: "inForPerson.employee.position_id",
                            foreignField: "id",
                            let: { comId: "$comId" },
                            pipeline: [{ $match: { comId: comId } }],
                            as: "positions",
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            ep_id: "$idQLC",
                            userName: "$userName",
                            // "phoneTK": 1,
                            // "phone": 1,
                            // "avatarUser": 1,
                            // "city": 1,
                            // "district": 1,
                            // "address": 1,
                            // birthday: "$inForPerson.account.birthday",
                            // start_working_time: "$inForPerson.employee.start_working_time",
                            organizeDetailName: foundGateway.organizeDetailName,
                            "inForPerson.employee.listOrganizeDetailId": 1,
                            positionName: "$positions.positionName",
                        },
                    },
                ]);

                for (let index = 0; index < listUser.length; index++) {
                    const element = listUser[index];
                    element.positionName = element.positionName.toString();
                }
                return functions.success(res, "Danh sách nhân viên", {
                    total: listUser.length,
                    data: listUser,
                });
            } else return functions.setError(res, "Thiếu thông tin");
        } else return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error);
        return functions.setError(res, error.message);
    }
};

// xóa tổ chức

exports.delete = async (req, res, next) => {
    try {
        const { id } = req.body;
        const type = req.user.data.type;
        const comId = req.user.data.com_id;
        if (Number(type) === 1) {
            if (id) {
                const foundGateway = await OrganizeDetail.findOne({ id: id });
                if (!foundGateway)
                    return functions.setError(res, "Không tồn tại tổ chức");
                await deleteParentAndChildren(id);
                // xóa nhân viên
                const listOrganizeDetailId = [
                    ...foundGateway.listOrganizeDetailId,
                ];
                listOrganizeDetailId.pop();
                let organizeDetailId;
                if (listOrganizeDetailId && listOrganizeDetailId.length > 0)
                    organizeDetailId =
                        listOrganizeDetailId[listOrganizeDetailId.length - 1]
                            .organizeDetailId;
                else organizeDetailId = 0;
                updateUserDeleteOrganizeDetail(
                    comId,
                    foundGateway,
                    listOrganizeDetailId,
                    organizeDetailId
                );
                return functions.success(res, "Xóa thành công");
            } else
                return functions.setError(
                    res,
                    "Bắt buộc phải truyền id tổ chức"
                );
        } else return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error);
        return functions.setError(res, error.message);
    }
};

// di chuyển

exports.swap = async (req, res, next) => {
    try {
        const { start_id, end_id, settingOrganizeId, level } = req.body;
        const type = req.user.data.type;
        const comId = req.user.data.com_id;
        if (Number(type) === 1) {
            if ((start_id, end_id, comId)) {
                if (Number(start_id) !== Number(end_id)) {
                    const findStart = await OrganizeDetail.findOne({
                        id: Number(start_id),
                        comId: comId,
                    });

                    if (!findStart)
                        return functions.setError(
                            res,
                            "Tổ chức đầu không tồn tại"
                        );
                    const findEnd = await OrganizeDetail.findOne({
                        id: Number(end_id),
                        comId: comId,
                    });
                    const findParentStart = await OrganizeDetail.findOne({
                        id: Number(findStart.parentId),
                        comId: comId,
                    });

                    if (!findEnd)
                        return functions.setError(
                            res,
                            "Tổ chức thứ hai không tồn tại"
                        );
                    if (Number(findStart.level) < Number(findEnd.level)) {
                        return functions.success(res, "Cập nhật thành công");
                    }
                    // cùng cha
                    else {
                        if (
                            Number(findStart.parentId) ===
                            Number(findEnd.parentId)
                        ) {
                            await updateOrganizeEqualParent(
                                comId,
                                findStart,
                                findEnd
                            );
                        }
                        // cùng level
                        else if (
                            Number(findStart.level) === Number(findEnd.level)
                        ) {
                            const listOrganizeDetailIdStart = [
                                ...findEnd.listOrganizeDetailId,
                            ];
                            listOrganizeDetailIdStart.pop();

                            const listOrganizeDetailIdEnd = [
                                ...findStart.listOrganizeDetailId,
                            ];
                            listOrganizeDetailIdEnd.pop();

                            const promises = [];
                            promises.push(
                                await OrganizeDetail.updateOne(
                                    {
                                        id: Number(start_id),
                                    },
                                    { range: Number(findEnd.range) }
                                )
                            );
                            promises.push(
                                await OrganizeDetail.updateOne(
                                    {
                                        id: Number(end_id),
                                    },
                                    { range: Number(findStart.range) }
                                )
                            );
                            promises.push(
                                updateOrganizeEqualLevel(
                                    comId,
                                    Number(findStart.id),
                                    Number(findStart.level) - 1,
                                    listOrganizeDetailIdStart,
                                    findEnd.parentId
                                )
                            );
                            promises.push(
                                updateOrganizeEqualLevel(
                                    comId,
                                    Number(findEnd.id),
                                    Number(findEnd.level) - 1,
                                    listOrganizeDetailIdEnd,
                                    findStart.parentId
                                )
                            );
                            await Promise.all(promises);
                        }
                        // từ dưới lên
                        else {
                            const listOrganizeDetailIdStart = [
                                ...findEnd.listOrganizeDetailId,
                            ];
                            await updateOrganizeEqualLevel(
                                comId,
                                Number(findStart.id),
                                Number(findEnd.level),
                                listOrganizeDetailIdStart,
                                findEnd.id
                            );
                        }
                    }
                    // // cha của start cùng loại với end
                    // else if (findParentStart && Number(findParentStart.settingOrganizeId) === Number(findEnd.settingOrganizeId)) {

                    //     const listOrganizeDetailIdStart = [...findEnd.listOrganizeDetailId]
                    //     await updateOrganizeEqualLevel(comId, Number(findStart.id), Number(findStart.level), listOrganizeDetailIdStart, findEnd.id)
                    // }
                    // // cùng loại tổ chức
                    // else if (Number(findStart.settingOrganizeId) === Number(findEnd.settingOrganizeId)) {

                    //     const listOrganizeDetailIdStart = [...findEnd.listOrganizeDetailId]
                    //     listOrganizeDetailIdStart.pop()

                    //     const listOrganizeDetailIdEnd = [...findStart.listOrganizeDetailId]
                    //     listOrganizeDetailIdEnd.pop()

                    //     const promises = []
                    //     promises.push(updateOrganizeEqualLevel(comId, Number(findStart.id), Number(findStart.level), listOrganizeDetailIdStart, findEnd.parentId))
                    //     promises.push(updateOrganizeEqualLevel(comId, Number(findEnd.id), Number(findEnd.level), listOrganizeDetailIdEnd, findStart.parentId))
                    //     await Promise.all(promises)
                    // }
                    // // kéo từ trên xuống dưới - không update
                    // else if (Number(findStart.level) < Number(findEnd.level)) {

                    //     return functions.success(res, "Cập nhật thành công")
                    // }
                    // // kéo từ dưới lên trên
                    // else if (Number(findStart.level) >= Number(findEnd.level)) {

                    //     const list = await OrganizeDetail.find({
                    //         settingOrganizeId: findStart.settingOrganizeId,
                    //         comId: comId
                    //     }, { id: 1 })

                    //     await Promise.all(
                    //         list.map(async e => {

                    //             await updateOrganizeDetail(comId, e.id, findEnd.id, findEnd.level, findEnd.listOrganizeDetailId)
                    //         })
                    //     )
                    //     await updateSettingOrganize(comId, findStart.settingOrganizeId, findEnd.settingOrganizeId, findEnd.level)
                    // }
                }
                return functions.success(res, "Cập nhật thành công");
            } else return functions.setError(res, "Thiếu thông tin");
        } else return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        console.log("error", error);
        return functions.setError(res, error.message);
    }
};

// đồng bộ trường range
exports.updatebyRange = async (req, res, next) => {
    try {
        const comId = Number(req.body.comId) || 0;
        if (comId) {
            const list = await OrganizeDetail.find(
                {
                    comId: comId,
                },
                { id: 1 }
            );
            await Promise.all(
                list.map((e) => {
                    return OrganizeDetail.updateOne(
                        {
                            comId: comId,
                            id: e.id,
                        },
                        {
                            $set: {
                                range: e.id,
                            },
                        }
                    );
                })
            );
            return functions.success(res, "Đồng bộ xong", { data: list });
        }
        return functions.setError(res, "Id công ty là bắt buộc");
    } catch (error) {
        console.log("error", error);
        return functions.setError(res, error.message);
    }
};

// check cấp cao nhất

exports.check = async (req, res, next) => {
    try {
        const type = req.user.data.type;
        const comId = req.user.data.com_id;
        const foundGateway = await OrganizeDetail.findOne({
            comId: comId,
            parentId: 0,
            level: 1,
        });
        if (foundGateway) {
            return functions.success(res, "Được tạo mới");
        } else functions.setError(res, "Chưa tạo cấp cao nhất");
    } catch (error) {
        console.log("error", error);
        return functions.setError(res, error.message);
    }
};
