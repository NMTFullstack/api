const functions = require("../../services/functions");
const SettingIPApp = require("../../models/qlc/SettingIPApp");
const Users = require("../../models/Users");


const app = [
    {
        app_id: 1,
        app_name: "Chấm công",
        app_type: 1,
        type_name: "Quản lý nhân sự"
    },
    {
        app_id: 2,
        app_name: "Chat 365",
        app_type: 1,
        type_name: "Quản lý nhân sự"
    },
    {
        app_id: 3,
        app_name: "Tính lương",
        app_type: 1,
        type_name: "Quản lý nhân sự"
    },
    {
        app_id: 4,
        app_name: "Quản trị nhân sự",
        app_type: 1,
        type_name: "Quản lý nhân sự"
    },
    {
        app_id: 5,
        app_name: "Đánh giá năng lực nhân viên",
        app_type: 1,
        type_name: "Quản lý nhân sự"
    },

    // Quản lý công việc / giao việc
    {
        app_id: 6,
        app_name: "Quản lý KPI",
        app_type: 2,
        type_name: "Quản lý công việc"
    },
    {
        app_id: 7,
        app_name: "Phần mềm quản lý lịch biểu",
        app_type: 2,
        type_name: "Quản lý công việc"
    },
    {
        app_id: 8,
        app_name: "Phần mềm giao việc",
        app_type: 2,
        type_name: "Quản lý công việc"
    },

    // Quản lý nội bộ
    {
        app_id: 9,
        app_name: "Văn thư lưu trữ",
        app_type: 3,
        type_name: "Quản lý nội bộ"
    },
    {
        app_id: 10,
        app_name: "Truyền thông văn hóa",
        app_type: 3,
        type_name: "Quản lý nội bộ"
    },
    {
        app_id: 11,
        app_name: "Chuyển văn bản thành giọng nói",
        app_type: 3,
        type_name: "Quản lý nội bộ"
    },
    {
        app_id: 12,
        app_name: "Quản lý tài sản",
        app_type: 3,
        type_name: "Quản lý nội bộ"
    },
    {
        app_id: 13,
        app_name: "Phần mềm phiên dịch",
        app_type: 3,
        type_name: "Quản lý nội bộ"
    },
    {
        app_id: 14,
        app_name: "Số hóa tài liệu",
        app_type: 3,
        type_name: "Quản lý nội bộ"
    },
    {
        app_id: 15,
        app_name: "Quản lý tài sản",
        app_type: 3,
        type_name: "Quản lý nội bộ"
    },

    // Quản lý bán hàng
    {
        app_id: 16,
        app_name: "Phần mềm CRM",
        app_type: 4,
        type_name: "Quản lý bán hàng"
    },
    {
        app_id: 17,
        app_name: "Phần mềm quản lý hệ thống phân phối - DMS",
        app_type: 4,
        type_name: "Quản lý bán hàng"
    },
    {
        app_id: 18,
        app_name: "SMARTID365",
        app_type: 4,
        type_name: "Quản lý bán hàng"
    },
    {
        app_id: 19,
        app_name: "Phần mềm quản lý Gara ô tô",
        app_type: 4,
        type_name: "Quản lý bán hàng"
    },
    {
        app_id: 20,
        app_name: "Phần mềm quản lý kho vật tư xây dựng",
        app_type: 4,
        type_name: "Quản lý bán hàng"
    },
    {
        app_id: 21,
        app_name: "Phần mềm Loyalty",
        app_type: 4,
        type_name: "Quản lý bán hàng"
    },
    {
        app_id: 22,
        app_name: "Phần mềm quản lý vận tải",
        app_type: 4,
        type_name: "Quản lý bán hàng"
    },
    {
        app_id: 23,
        app_name: "Phần mềm quản lý cung ứng",
        app_type: 4,
        type_name: "Quản lý bán hàng"
    },
    {
        app_id: 24,
        app_name: "Phần mềm quản lý kho 365",
        app_type: 4,
        type_name: "Quản lý bán hàng"
    },
    {
        app_id: 25,
        app_name: "Phần mềm quản lý quy trình sản xuất",
        app_type: 4,
        type_name: "Quản lý bán hàng"
    },

    // Phần mềm theo ngành nghề
    {
        app_id: 26,
        app_name: "Phần mềm quản lý đầu tư xây dựng",
        app_type: 5,
        type_name: "Phần mềm theo ngành nghề"
    },
    {
        app_id: 27,
        app_name: "Phần mềm quản lý tài chính công trình",
        app_type: 5,
        type_name: "Phần mềm theo ngành nghề"
    },
]

// danh sách phần mềm

exports.getlistAllApp = async (req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        return functions.success(res, "Danh sách tất cả phần mềm", { data: app });
    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}

// Giới hạn IP, phần mềm cho list nhân viên

exports.setting = async (req, res) => {
    try {
        const comId = req.user.data.com_id;
        const type = req.user.data.type;
        const isAdmin = req.user.data.isAdmin;
        if (Number(type) === 1 || isAdmin) {
            const { listUsers, listIps, listApps, start_date, end_date } = req.body
            console.log(listApps)
            if (listUsers && listUsers.length > 0) {

                await SettingIPApp.updateMany(
                    {
                        comId: comId,
                        ep_id: {
                            $in: listUsers
                        }
                    },
                    {
                        $set: {
                            ip: listIps || [],
                            app: listApps || [],
                            start_date: Date.parse(start_date) / 1000 || 0,
                            end_date: Date.parse(end_date) / 1000 || 0
                        }
                    },
                    {
                        multi: true
                    }
                )

                return functions.success(res, "Cài đặt thành công");
            }
            return functions.setError(res, "Phải chọn ít nhất 1 nhân viên");
        }
        return functions.setError(res, "Tài khoản không phải Công ty");
    } catch (error) {
        return functions.setError(res, error.message);
    }
};

// danh sách nhân viên đã được cài đặt

exports.listUser = async (req, res, next) => {
    try {

        const com_id = req.user.data.com_id
        const type = req.user.data.type
        const { listOrganizeDetailId, position_id, userName, listIPs } = req.body
        const pageNumber = Number(req.body.pageNumber) || 1;
        const pageSize = Number(req.body.pageSize) || 50

        if (com_id) {
            const conditions = {
                "inForPerson.employee.com_id": com_id,
                "inForPerson.employee.ep_status": "Active"
            }
            const conditionsSettingConfirm = {}
            if (listOrganizeDetailId) conditions["inForPerson.employee.listOrganizeDetailId"] = { $all: listOrganizeDetailId }
            if (position_id) conditions["inForPerson.employee.position_id"] = position_id
            if (userName) conditions["userName"] = { $regex: userName };


            const listUser = await Users.aggregate([
                {
                    $match: conditions
                },
                { $skip: (pageNumber - 1) * pageSize },
                { $limit: pageSize },

                {
                    $lookup: {
                        from: 'QLC_Positions',
                        localField: 'inForPerson.employee.position_id',
                        foreignField: 'id',
                        let: { "comId": "$comId" },
                        pipeline: [{ $match: { comId: com_id } }],
                        as: 'positions'
                    }
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        let: { "comId": "$comId" },
                        pipeline: [{ $match: { comId: com_id } }],
                        as: 'organizeDetail'
                    }
                },
                {
                    $lookup: {
                        from: 'QLC_SettingIPApp',
                        localField: 'idQLC',
                        foreignField: 'ep_id',
                        as: 'settingIPApp'
                    }
                },
                {
                    $unwind: '$settingIPApp'
                },
                {
                    $project: {
                        "_id": 0,
                        ep_id: "$idQLC",
                        userName: "$userName",
                        "phone": 1,
                        "avatarUser": 1,
                        organizeDetailName: "$organizeDetail.organizeDetailName",
                        positionName: "$positions.positionName",
                        listIPs: "$settingIPApp.ip",
                        listApps: "$settingIPApp.app",
                        start_date: "$settingIPApp.start_date",
                        end_date: "$settingIPApp.end_date"
                    }
                }
            ])
            const total = await Users.aggregate([
                {
                    $match: conditions
                },
                {
                    $lookup: {
                        from: 'QLC_SettingIPApp',
                        localField: 'idQLC',
                        foreignField: 'ep_id',
                        as: 'settingIPApp'
                    }
                },
                {
                    $unwind: '$settingIPApp'
                },
                {
                    $count: 'total'
                }

            ])
            listUser.map(e => {
                e.positionName = e.positionName.toString()
                e.organizeDetailName = e.organizeDetailName.toString()
                e.app_num = e.listApps.length
            })

            return functions.success(res, "Danh sách nhân viên", { total: total[0]?.total || 0, data: listUser });
        }
        else return functions.setError(res, "Thiếu thông tin");
    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error.message)
    }
}

// xem danh sách phần mềm

exports.getlistApp = async (req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        if (com_id) {
            const { listApps } = req.body
            const data = []
            listApps.map(e => {
                data.push(app[e - 1])
            })
            return functions.success(res, "Danh sách tất cả phần mềm", { data: data });
        }
        functions.setError(res, "Thiếu thông tin")

    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}



