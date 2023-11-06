const functions = require("../../services/functions");
const SettingIP = require("../../models/qlc/SettingIP");
const SettingIPNew = require("../../models/qlc/SettingIPNew");
const Users = require("../../models/Users");
const Deparment = require("../../models/qlc/Deparment");
const Team = require("../../models/qlc/Team");
const Group = require("../../models/qlc/Group");
const PersonalSettingIP = require("../../models/qlc/PersonalSettingIP");
const Shifts = require('../../models/qlc/Shifts');

//lấy danh sách
exports.getListByID = async(req, res) => {
    try {
        const com_id = req.user.data.com_id
            // const com_id = req.body.com_id;

        const type = req.user.data.type;
        if (type == 1) {
            const id_acc = req.body.id_acc;
            let condition = { id_com: com_id };
            if (id_acc) condition.id_acc = id_acc;
            const data = await SettingIP.find(condition)
                .select("id_acc from_site ip_access created_time update_time")
                .sort({ id_acc: -1 })
                .lean();
            if (data) {
                return functions.success(res, "lấy thành công ", { data });
            }
            return functions.setError(res, "không tìm thấy cài đặt IP");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        functions.setError(res, error.message);
    }
};

exports.getList = async(req, res) => {
    try {
        // const com_id = req.user.data.com_id
        const type = req.user.data.type;
        if (type == 1) {
            let page = Number(req.body.page) || 1;
            let pageSize = Number(req.body.pageSize) || 10;
            const skip = (page - 1) * pageSize;
            const limit = pageSize;
            const com_id = req.body.com_id || req.user.data.com_id;
            const id_acc = req.body.id_acc;
            const dep_id = req.body.dep_id;
            const team_id = req.body.team_id;
            const gr_id = req.body.gr_id;
            const comName = req.body.comName;
            const posision_id = req.body.posision_id;
            let condition = {};
            let cond2 = {};
            if (com_id) condition["id_com"] = Number(com_id);
            if (id_acc) condition.id_acc = Number(id_acc);

            if (dep_id) condition.dep_id = { $all: [Number(dep_id)] };
            if (team_id) condition.team_id = { $all: [Number(team_id)] };
            if (gr_id) condition.gr_id = { $all: [Number(gr_id)] };
            if (posision_id) cond2.position_id = Number(posision_id);
            if (comName) cond2.comName = { $regex: comName, $options: "i" };
            const result = await SettingIPNew.aggregate([
                { $match: condition },
                { $sort: { id_acc: -1 } },
                {
                    $lookup: {
                        from: "Users",
                        localField: "id_com",
                        foreignField: "idQLC",
                        pipeline: [{
                            $match: {
                                $and: [
                                    { type: 1 },
                                    { idQLC: { $ne: 0 } },
                                    { idQLC: { $ne: 1 } },
                                ],
                            },
                        }, ],
                        as: "infoCom",
                    },
                },
                { $unwind: { path: "$infoCom", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        id_acc: 1,
                        ip_access: 1,
                        id_com: 1,
                        dep_id: 1,
                        team_id: 1,
                        gr_id: 1,
                        user_id: 1,
                        comName: "$infoCom.userName",
                    },
                },
                { $match: cond2 },

                {
                    $facet: {
                        paginatedResults: [{ $skip: skip }, { $limit: limit }],
                        totalCount: [{
                            $count: "count",
                        }, ],
                    },
                },
            ]);

            if (result[0].totalCount.length > 0) {
                const data = result[0].paginatedResults;
                const totalCount = result[0].totalCount[0].count;

                await Promise.all(
                    data.map(async(e, index) => {
                        data[index].deparments = [];
                        data[index].teams = [];
                        data[index].groups = [];
                        data[index].users = [];

                        // phòng ban
                        await Promise.all(
                            e.dep_id.map(async(element) => {
                                const foundGateway = await Deparment.findOne({
                                    dep_id: element,
                                    com_id: e.id_com,
                                });

                                if (foundGateway) {
                                    data[index].deparments.push({
                                        dep_id: element,
                                        dep_name: foundGateway.dep_name,
                                    });
                                }
                            })
                        );
                        // nhóm
                        await Promise.all(
                            e.gr_id.map(async(element) => {
                                const foundGateway = await Group.findOne({
                                    gr_id: element,
                                    com_id: e.id_com,
                                });

                                if (foundGateway) {
                                    data[index].groups.push({
                                        gr_id: element,
                                        gr_name: foundGateway.gr_name,
                                    });
                                }
                            })
                        );
                        // tổ
                        await Promise.all(
                            e.team_id.map(async(element) => {
                                const foundGateway = await Team.findOne({
                                    team_id: element,
                                    com_id: e.id_com,
                                });

                                if (foundGateway) {
                                    data[index].teams.push({
                                        team_id: element,
                                        team_name: foundGateway.team_name,
                                    });
                                }
                            })
                        );
                        // nhân viên

                        await Promise.all(
                            e.user_id.map(async(element) => {
                                const foundGateway = await Users.aggregate([{
                                        $match: {
                                            idQLC: element,
                                            "inForPerson.employee.com_id": e.id_com,
                                            type: 2,
                                            "inForPerson.employee.ep_status": "Active",
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: "QLC_Deparments",
                                            localField: "inForPerson.employee.dep_id",
                                            foreignField: "dep_id",
                                            as: "Department",
                                        },
                                    },
                                    {
                                        $unwind: {
                                            path: "$Department",
                                            preserveNullAndEmptyArrays: true,
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: "QLC_Groups",
                                            localField: "inForPerson.employee.group_id",
                                            foreignField: "gr_id",
                                            as: "Groups",
                                        },
                                    },
                                    {
                                        $unwind: {
                                            path: "$Groups",
                                            preserveNullAndEmptyArrays: true,
                                        },
                                    },
                                ]);

                                if (foundGateway && foundGateway.length > 0) {
                                    data[index].users.push({
                                        ep_id: element,
                                        name: foundGateway[0].userName,
                                        phone: foundGateway[0].phone || foundGateway[0].phoneTK,
                                        dep_id: foundGateway[0].inForPerson.employee.dep_id,
                                        com_id: foundGateway[0].inForPerson.employee.com_id,
                                        position_id: foundGateway[0].inForPerson.employee.position_id,
                                        group_id: foundGateway[0].inForPerson.employee.group_id,
                                        dep_name: foundGateway[0].Department.dep_name,
                                        group_name: foundGateway[0].Groups.gr_name,
                                    });
                                }
                            })
                        );

                        delete data[index].dep_id;
                        delete data[index].team_id;
                        delete data[index].gr_id;
                        delete data[index].user_id;
                    })
                );

                return functions.success(res, "lấy thành công", { data, totalCount });
            }
            return functions.setError(res, "khong tim thay du lieu");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
};

exports.getListPersonalAccess = async(req, res) => {
    try {
        // const com_id = req.user.data.com_id
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        if (type == 1) {
            let condition = { com_id: Number(com_id) };
            const dataPersonalSettingIP = await PersonalSettingIP.find(condition)
                .sort({ person_access_id: -1 })
                .lean();

            if (dataPersonalSettingIP) {
                let sendData = []
                await Promise.all(dataPersonalSettingIP.map(async(item, index) => {
                    dataPersonalSettingIP[index].infoPerson = {};
                    dataPersonalSettingIP[index].infoShift = {};

                    // Lấy dữ liệu người dùng
                    const foundGateway = await Users.aggregate([{
                            $match: {
                                idQLC: Number(item.user_id),
                                "inForPerson.employee.com_id": Number(com_id),
                                type: 2,
                                "inForPerson.employee.ep_status": "Active",
                            },
                        },
                        {
                            $lookup: {
                                from: "QLC_Deparments",
                                localField: "inForPerson.employee.dep_id",
                                foreignField: "dep_id",
                                pipeline: [{
                                    $match: {
                                        com_id: Number(com_id)
                                    },
                                }, ],
                                as: "Department",
                            },
                        },
                        {
                            $unwind: {
                                path: "$Department",
                                preserveNullAndEmptyArrays: true,
                            },
                        }
                    ]);

                    if (foundGateway && foundGateway.length > 0) {
                        dataPersonalSettingIP[index].infoPerson = {
                            // ep_id: item.user_id,
                            name: foundGateway[0].userName,
                            // phone: foundGateway[0].phone || foundGateway[0].phoneTK,
                            dep_id: foundGateway[0].inForPerson.employee.dep_id,
                            position_id: foundGateway[0].inForPerson.employee.position_id,
                            // group_id: foundGateway[0].inForPerson.employee.group_id || "Chưa cập nhật",
                            dep_name: foundGateway[0].Department.dep_name || "Chưa cập nhật",
                            // group_name: foundGateway[0].Groups.gr_name || "Chưa cập nhật",
                        };
                    }

                    // Lấy dữ liệu ca làm việc
                    const dataShift = await Shifts.findOne({ com_id: Number(com_id), shift_id: Number(item.shift_id) }).select("shift_name").lean()
                    dataPersonalSettingIP[index].infoShift = dataShift
                    sendData.push(dataPersonalSettingIP[index])
                }))

                return functions.success(res, "lấy thành công ", { data: sendData });
            }
            return functions.setError(res, "Công ty chưa cài đặt Vị trí/IP/Wifi");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        functions.setError(res, error.message);
    }
}

// lấy thông tin chi tiết 1 cài đặt IP cá nhân
exports.getDetailPersonalIPAcc = async(req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        if (type == 1) {
            const { user_id, shift_id } = req.body
            let condition = { com_id: Number(com_id) };
            if (user_id && shift_id) {
                condition = {...condition, user_id: Number(user_id), shift_id: Number(shift_id) }
                const data = await PersonalSettingIP.findOne(condition).lean();
                if (data) {
                    const dataShift = await Shifts.findOne({ com_id: Number(com_id), shift_id: Number(data.shift_id) }).select("shift_name start_time end_time").lean()
                    let sendData = {...data, infoShift: dataShift }
                    return functions.success(res, "lấy thành công", { data: sendData });
                } else {
                    return functions.setError(res, "Không tìm thấy thông tin của người dùng này");
                }

            }
            return functions.setError(res, "Thiếu thông tin người dùng và ca làm việc");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (e) {
        functions.setError(res, e.message)
    }
}

//tạo 1 thiết lập Ip
exports.createIP = async(req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        if (type == 1) {
            // const list = req.body;
            // if (list) {
            // for (let index = 0; index < list.length; index++) {
            // const element = list[index];
            const maxId = await SettingIP.findOne({}, { id_acc: 1 }, { sort: { id_acc: -1 } }).lean();
            const id_acc = Number(maxId.id_acc) + 1;
            const newData = new SettingIP({
                id_acc: id_acc,
                id_com: com_id,
                ip_access: req.body.ip_access,
                from_site: req.body.from_site,
                created_time: functions.getTimeNow(),
            });
            await newData.save();
            // }
            return functions.success(res, "Thành công");
            // }
            return functions.setError(res, "thiếu thông tin IP hoặc from_site ");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
};
//tạo 1 thiết lập Ip theo giao diện mới
exports.create1IP = async(req, res) => {
    try {
        let { com_id, ip_access, user_id, dep_id, team_id, gr_id, from_site } =
        req.body;
        const type = req.user.data.type;
        const addNew = 1;
        if (type == 1) {
            const maxId =
                (await SettingIPNew.findOne({}, { id_acc: 1 }, { sort: { id_acc: -1 } }).lean()) || 0;
            const id_acc = Number(maxId.id_acc) + 1 || 1;

            if (ip_access) {
                if (!Array.isArray(ip_access)) ip_access = JSON.parse(ip_access);
                if (!Array.isArray(ip_access))
                    return functions.setError(res, "Cần truyền lên một mảng IP");
            } else return functions.setError(res, "thiếu thông tin truyền lên ");

            if (com_id && ip_access.length > 0) {
                const foundGateway = await SettingIPNew.find({
                    ip_access: { $all: ip_access },
                    id_com: com_id,
                });

                if (foundGateway && foundGateway.length > 0) {
                    let findIP = foundGateway.filter((value) => {
                        return value.ip_access.length === ip_access.length;
                    });

                    if (findIP && findIP.length > 0) {
                        findIP = findIP[0];
                        if (dep_id) {
                            if (!findIP.dep_id.includes(Number(dep_id)))
                                findIP.dep_id.push(dep_id);
                        }
                        if (team_id) {
                            if (!findIP.team_id.includes(Number(team_id)))
                                findIP.team_id.push(team_id);
                        }
                        if (gr_id) {
                            if (!findIP.gr_id.includes(Number(gr_id)))
                                findIP.gr_id.push(gr_id);
                        }
                        if (user_id) {
                            if (!findIP.user_id.includes(Number(user_id)))
                                findIP.user_id.push(user_id);
                        }
                        await SettingIPNew.updateOne({
                                id_acc: findIP.id_acc,
                            },
                            findIP
                        );
                    } else {
                        const newData = new SettingIPNew({
                            id_acc: id_acc,
                            id_com: com_id, //id cong ty con
                            dep_id: [Number(dep_id)], // id phòng ban
                            team_id: [Number(team_id)], // id tổ
                            gr_id: [Number(gr_id)], // id nhóm
                            ip_access: ip_access, // mảng up được sử dụng
                            user_id: [Number(user_id)], // id nhân viên
                            created_time: functions.getTimeNow(),
                            from_site: from_site,
                        });
                        await newData.save();
                    }
                } else {
                    const newData = new SettingIPNew({
                        id_acc: id_acc,
                        id_com: com_id, //id cong ty con
                        dep_id: dep_id, // id phòng ban
                        team_id: team_id, // id tổ
                        gr_id: gr_id, // id nhóm
                        ip_access: ip_access, // mảng up được sử dụng
                        user_id: user_id, // id nhân viên
                        created_time: functions.getTimeNow(),
                    });
                    await newData.save();
                }
                return functions.success(res, "Thành công");
            }
            return functions.setError(res, "thiếu thông tin truyền lên ");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
};
// tạo thiết lập cho mảng nhân viên
exports.createPersonalIPAcc = async(req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        if (type == 1) {
            // mảng thông tin cần thêm
            const list = req.body;
            if (list) {
                let userIds = []
                if (!Array.isArray(list.userIds)) {
                    userIds = JSON.parse(list.userIds)
                } else {
                    userIds = list.userIds
                }
                let loc_access = []
                if (!Array.isArray(list.loc_access)) {
                    loc_access = JSON.parse(list.loc_access)
                } else {
                    loc_access = list.loc_access
                }
                const { wifi_access, ip_access, time_start, time_end, shift_id } = list
                if (userIds.length > 0) {
                    for (let index = 0; index < userIds.length; index++) {
                        const user_id = userIds[index];

                        const maxId = await PersonalSettingIP.findOne({}, { person_access_id: 1 }, { sort: { person_access_id: -1 } }).lean();
                        let person_access_id = -1
                        if (maxId) {
                            person_access_id = Number(maxId.person_access_id) + 1;
                        } else {
                            person_access_id = 1
                        }
                        const personalIPExist = await PersonalSettingIP.findOne({ com_id: Number(com_id), user_id: Number(user_id), shift_id: Number(shift_id) })
                        if (!personalIPExist) {
                            const newData = new PersonalSettingIP({
                                person_access_id: person_access_id,
                                user_id: Number(user_id),
                                com_id: Number(com_id),
                                shift_id: Number(shift_id),
                                wifi_access: { arr_wifi_name: wifi_access },
                                loc_access: loc_access,
                                ip_access: { arr_ip: ip_access },
                                time_start: time_start || functions.getTimeNow(),
                                time_end: time_end || functions.getTimeNow(),
                                created_time: functions.getTimeNow(),
                            });
                            await newData.save();
                        }
                    }
                    return functions.success(res, "Thành công");
                } else {
                    return functions.setError(res, "Thiếu thông tin dữ liệu người dùng");
                }
            } else {
                return functions.setError(res, "Thiếu thông tin dữ liệu");
            }
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

// thêm IP theo thiết lập IP đã có sẵn
exports.addIP = async(req, res) => {
    try {
        let { com_id, id_acc, ip_access } = req.body;
        const type = req.user.data.type;
        const addNew = 1;
        if (type == 1) {
            if (ip_access) {
                if (!Array.isArray(ip_access)) ip_access = JSON.parse(ip_access);
                if (!Array.isArray(ip_access))
                    return functions.setError(res, "Cần truyền lên một mảng IP");
            } else return functions.setError(res, "Thiếu thông tin truyền lên ");

            if (id_acc && ip_access.length > 0) {
                const foundGateway = await SettingIPNew.findOne({
                    id_acc,
                });
                if (!foundGateway)
                    return functions.setError(res, "Không tồn tại thiết lập IP đã có");
                else {
                    const countIP = foundGateway.ip_access.length;
                    ip_access.map((value) => {
                        if (!foundGateway.ip_access.includes(value))
                            foundGateway.ip_access.push(value);
                    });

                    if (countIP !== foundGateway.ip_access.length)
                        await SettingIPNew.updateOne({
                                id_acc: id_acc,
                            },
                            foundGateway
                        );
                }
                return functions.success(res, "Thành công");
            }
            return functions.setError(res, "Thiếu thông tin truyền lên ");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
};

exports.editsettingIP = async(req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const cid = req.body.com_id;
        const type = req.user.data.type;
        let id = 0;
        if (type == 1) {
            if (cid) {
                id = Number(cid);
            } else {
                id = com_id;
            }
            const { id_acc, ip_access, from_site } = req.body;
            if (ip_access && com_id) {
                const settingIP = await functions.getDatafindOne(SettingIP, {
                    id_com: id,
                    id_acc: id_acc,
                });
                if (settingIP) {
                    await functions.getDatafindOneAndUpdate(
                        SettingIP, { id_com: id, id_acc: id_acc }, {
                            from_site: from_site,
                            ip_access: ip_access,
                            update_time: new Date(),
                        }
                    );
                    return functions.success(res, " sửa thành công ");
                }
                return functions.setError(res, "IP không tồn tại!");
            }
            return functions.setError(res, "thiếu thông tin");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
};

exports.editsettingIPNew = async(req, res) => {
    try {
        const com_id = req.body.com_id || req.user.data.com_id;
        const type = req.user.data.type;
        let id = 0;
        if (type == 1) {
            let { id_acc, ip_access } = req.body;
            if (ip_access) {
                if (!Array.isArray(ip_access)) ip_access = JSON.parse(ip_access);
                if (!Array.isArray(ip_access))
                    return functions.setError(res, "Cần truyền lên một mảng IP");
            } else return functions.setError(res, "thiếu thông tin truyền lên ");
            if (ip_access.length > 0 && id_acc) {
                const foundGateway = await SettingIPNew.findOne({ id_acc: id_acc });
                if (foundGateway) {
                    await SettingIPNew.updateOne({ id_acc: id_acc }, {
                        ip_access: ip_access,
                        update_time: functions.getTimeNow(),
                    });
                    return functions.success(res, " Sửa thành công ");
                }
                return functions.setError(res, "Thiết lập IP không tồn tại!");
            }
            return functions.setError(res, "Thiếu thông tin");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
};

// chỉnh sửa thông tin cài đặt IP cá nhân
exports.editPersonalSettingIP = async(req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        if (type == 1) {
            const { user_id, shift_id, time_start, time_end, wifi_access, loc_access, ip_access } = req.body;
            if (user_id && shift_id) {
                let condition = {
                    com_id: Number(com_id),
                    user_id: Number(user_id),
                    shift_id: Number(shift_id),
                }
                const personalSettingIP = await PersonalSettingIP.findOne(condition);
                if (personalSettingIP) {
                    let loc_access_parse = []
                    if (!Array.isArray(loc_access)) {
                        loc_access_parse = JSON.parse(loc_access)
                    } else {
                        loc_access_parse = loc_access
                    }
                    await PersonalSettingIP.findOneAndUpdate(condition, {
                        time_start: time_start,
                        time_end: time_end,
                        wifi_access: { arr_wifi_name: wifi_access },
                        loc_access: loc_access_parse,
                        ip_access: { arr_ip: ip_access },
                        update_time: functions.getTimeNow(),
                    });
                    return functions.success(res, "Sửa thành công");
                }
                return functions.setError(res, "Người dùng này chưa cài đặt IP cá nhân cho ca làm việc này");
            }
            return functions.setError(res, "Thiếu thông tin người dùng và ca làm việc");
        }
        return functions.setError(res, "Tài khoản không phải công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
};

// xóa thiết lập IP
exports.deleteSettingIPNew = async(req, res) => {
    try {
        const com_id = req.body.com_id || req.user.data.com_id;
        const type = req.user.data.type;
        let id = 0;
        if (type == 1) {
            let { id_acc } = req.body;
            if (id_acc) {
                const foundGateway = await SettingIPNew.findOne({ id_acc: id_acc });
                if (foundGateway) {
                    await SettingIPNew.deleteOne({ id_acc: id_acc });
                    return functions.success(res, " Xóa thành công ");
                }
                return functions.setError(res, "Thiết lập IP không tồn tại!");
            }
            return functions.setError(res, "Thiếu thông tin");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
};

exports.deleteSetIpByID = async(req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        if (type == 1) {
            const id_acc = req.body.id_acc;

            if (com_id && id_acc) {
                const settingIp = await functions.getDatafind(SettingIP, {
                    id_com: com_id,
                    id_acc: id_acc,
                });
                if (settingIp) {
                    await functions.getDataDeleteOne(SettingIP, {
                        id_com: com_id,
                        id_acc: id_acc,
                    });
                    return functions.success(res, "xóa thành công");
                }
                return functions.setError(res, "không tìm thấy IP");
            }
            return functions.setError(res, "nhập id_acc cần xóa");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
};

exports.deletePersonal = async(req, res) => {
    try {
        const com_id = req.body.com_id || req.user.data.com_id;
        const type = req.user.data.type;
        let id = 0;
        if (type == 1) {
            let { user_id, shift_id } = req.body;
            if (user_id && shift_id) {
                let condition = { com_id: Number(com_id), user_id: Number(user_id), shift_id: Number(shift_id) }
                const foundGateway = await PersonalSettingIP.findOne(condition);
                if (foundGateway) {
                    await PersonalSettingIP.deleteOne(condition);
                    return functions.success(res, " Xóa thành công ");
                }
                return functions.setError(res, "Thiết lập IP cho cá nhân này không tồn tại!");
            }
            return functions.setError(res, "Thiếu dữ liệu người dùng và ca làm việc");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
};