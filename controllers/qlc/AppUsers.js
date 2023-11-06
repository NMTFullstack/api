const AppUsers = require("../../models/qlc/AppUsers")
const Positions = require("../../models/qlc/Positions")
const Users = require("../../models/Users")
const functions = require("../../services/functions")
const fnc = require("../../services/functions")

const app = [{
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

// danh sách tất cả phần mềm
exports.getlist = async(req, res) => {
        try {
            const com_id = req.user.data.com_id;
            const type = req.user.data.type;
            if (type == 1) {
                return functions.success(res, "Danh sách tất cả phần mềm", { data: app });
            }
            return functions.setError(res, "Không phải tài khoản công ty");
        } catch (error) {
            console.log(error)
            return functions.setError(res, error.message)
        }
    }
    // giới hạn phần mềm cho nhân viên

exports.create = async(req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        if (type == 1) {
            const { listApp, ep_id } = req.body
            const foundGateway = await AppUsers.findOne({ ep_id: ep_id })
            if (!foundGateway) {
                const maxId = await AppUsers.findOne({}, { id: 1 }, { sort: { id: -1 } }).lean() || 0;
                const id = Number(maxId.id) + 1 || 1;
                const data = new AppUsers({
                    id: id,
                    ep_id: ep_id,
                    app_id: listApp,
                    com_id: com_id,
                    create_time: functions.getTimeNow(),
                    update_time: functions.getTimeNow()
                })
                data.save()
            } else {
                await AppUsers.updateOne({
                    id: foundGateway.id
                }, {
                    app_id: listApp,
                    update_time: functions.getTimeNow()
                })
            }
            return functions.success(res, "Giới hạn phần phầm cho người dùng thành công");
        }
        return functions.setError(res, "Không phải tài khoản công ty");
    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}

// danh sách phần mềm nhân viên được truy cập

exports.listAppOfUsers = async(req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        if (type == 1) {
            const { ep_id } = req.body
            const foundGateway = await AppUsers.findOne({ ep_id: ep_id })
            if (!foundGateway) return functions.success(res, "Danh sách phần mềm", { data: [] });
            const listApp = []
            foundGateway.app_id.map(e => {
                listApp.push({
                    app_id: e,
                    app_name: app[e - 1].app_name,
                    app_type: app[e - 1].app_type,
                    type_name: app[e - 1].type_name,
                })
            })
            delete foundGateway.app_id
            foundGateway.listApp = listApp
            return functions.success(res, "Danh sách phần mềm", { data: listApp });
        }
        return functions.setError(res, "Không phải tài khoản công ty");
    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}

// danh sách phần mềm + số lượng nhân viên truy cập
exports.getlistAppCountMember = async(req, res) => {
    try {
        let listApp = app
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        const conditions = {}
        const { app_id } = req.body

        if (type == 1) {
            await Promise.all(
                listApp.map(async(e, index) => {
                    const count = await AppUsers.find({
                        app_id: {
                            $in: [Number(e.app_id)]

                        }
                    }).countDocuments
                    listApp[index].total_employee = count
                })
            )

            return functions.success(res, "Danh sách tất cả phần mềm", { data: listApp });
        }
        return functions.setError(res, "Không phải tài khoản công ty");
    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}

// xóa 1 phần mềm khỏi danh sách truy cập của nhân viên

exports.delete = async(req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type;
        if (type == 1) {
            const { ep_id, app_id } = req.body
            const foundGateway = await AppUsers.findOne({ ep_id: ep_id })
            if (foundGateway) {
                const listApp = foundGateway.app_id.filter(e => Number(e) !== Number(app_id))
                await AppUsers.updateOne({ id: foundGateway.id }, {
                    app_id: listApp
                })
                return functions.success(res, "Xóa thành công");
            }
            return functions.setError(res, "Không tồn tại nhân viên");
        }
        return functions.setError(res, "Không phải tài khoản công ty");
    } catch (error) {
        console.log(error)
        return functions.setError(res, error.message)
    }
}

// danh sách phần mềm + số lượng nhân viên được truy cập