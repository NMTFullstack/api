const PermissionNotify = require('../../models/Timviec365/PermissionNotify');
const Users = require('../../models/Users');
const functions = require('../../services/functions');

exports.list = async(req, res) => {
    const user = req.user.data;
    let condition = { pn_usc_id: user.idTimViec365 };
    const { pn_id_new, pn_type } = req.body;
    if (pn_id_new) {
        condition.pn_id_new = Number(pn_id_new);
    }
    if (pn_type) {
        condition.pn_type = Number(pn_type);
    }

    const list = await PermissionNotify.find(condition);
    const list_id = [];
    for (let i = 0; i < list.length; i++) {
        const element = list[i];
        list_id.push(element.pn_id_chat);
    }
    const listUserInfo = await Users.aggregate([{
        $match: {
            _id: { $in: list_id }
        }
    }, {
        $project: {
            _id: 0,
            id: "$_id",
            type365: "$type",
            email: "$email",
            phoneTK: "$phoneTK",
            userName: "$userName",
            avatarUser: "$avatarUser"
        }
    }]);
    return functions.success(res, "Danh sách quyền", { list, listUserInfo });
}

exports.getUserByIdChat = async(req, res) => {
    try {
        const Infor = req.body.Infor;
        if (Infor) {
            const listUser = await Users.aggregate([{
                    $match: {
                        $or: [{ email: Infor }, { phoneTK: Infor }]
                    }
                }, {
                    $project: {
                        _id: 1,
                        "type365": "$type",
                        userName: 1,
                    }
                }

            ]);
            return functions.success(res, "Danh sách thông tin", { listUser });
        }
        return functions.setError(res, "Thiếu thông tin truyền lên");
    } catch (error) {
        return functions.setError(res, error);
    }
}

exports.getListPermissionByUser = async(req, res) => {
    try {
        const idTimViec365 = req.user.data.idTimViec365;
        const type = req.body.type || 1;
        let list_type_noti;
        let list = [];

        // Luồng nhà tuyển dụng phân quyền
        if (type == 1) {
            list_type_noti = await PermissionNotify.distinct('pn_type_noti', {
                pn_usc_id: idTimViec365,
                pn_id_new: 0
            }).lean();
            for (let i = 0; i < list_type_noti.length; i++) {
                const pn_type_noti = list_type_noti[i];

                const rs_usc = await PermissionNotify.aggregate([{
                        $match: {
                            pn_usc_id: idTimViec365,
                            pn_id_new: 0,
                            pn_type_noti: pn_type_noti
                        }
                    },
                    {
                        $lookup: {
                            from: "Users",
                            localField: "pn_id_chat",
                            foreignField: "_id",
                            as: "user",
                        }
                    },
                    { $unwind: "$user" },
                    {
                        $project: {
                            id: "$user._id",
                            type365: "$user.type",
                            email: "$user.email",
                            phoneTK: "$user.phoneTK"
                        }
                    }
                ]);
                list.push({
                    pn_type_noti: pn_type_noti,
                    rs_usc: rs_usc
                });
            }
        }
        // Luồng ứng viên phân quyền
        else {
            list_type_noti = await PermissionNotify.distinct('pn_type_noti', {
                pn_use_id: idTimViec365,
                pn_id_new: 0
            }).lean();
            for (let i = 0; i < list_type_noti.length; i++) {
                const pn_type_noti = list_type_noti[i];

                const rs_usc = await PermissionNotify.aggregate([{
                        $match: {
                            pn_use_id: idTimViec365,
                            pn_id_new: 0,
                            pn_type_noti: pn_type_noti
                        }
                    },
                    {
                        $lookup: {
                            from: "Users",
                            localField: "pn_id_chat",
                            foreignField: "_id",
                            as: "user",
                        }
                    },
                    { $unwind: "$user" },
                    {
                        $project: {
                            id: "$user._id",
                            type365: "$user.type",
                            email: "$user.email",
                            phoneTK: "$user.phoneTK"
                        }
                    }
                ]);
                list.push({
                    pn_type_noti: pn_type_noti,
                    rs_usc: rs_usc
                });
            }
        }
        return functions.success(res, "Danh sách thông tin", { items: list });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}