const Users = require('../../../models/Users');
const functions = require('../../../services/functions');
const service = require('../../../services/timviec365/candidate');
const Profile = require('../../../models/Timviec365/UserOnSite/Candicate/Profile');
const HistoryDeleteUser = require("../../../models/Timviec365/Admin/Candidate/HistoryDeleteUser");
const axios = require('axios');
const ApplyForJob = require('../../../models/Timviec365/UserOnSite/Candicate/ApplyForJob');
const SaveCvCandi = require('../../../models/Timviec365/UserOnSite/Candicate/SaveCvCandi');
const UserAddFail = require('../../../models/Timviec365/Admin/Candidate/UserAddFail');
const News = require('../../../models/Timviec365/UserOnSite/Company/New');

// Ứng viên bị kinh doanh ẩn 
exports.candi_hide_kd = async(req, res) => {
    try {
        const skip = Number(req.body.skip);
        const limit = Number(req.body.limit);
        let condition = [
            { type: { $ne: 1 } },
            { "inForPerson.candidate.use_show": 0 }
        ];
        if (req.body.start && req.body.end) {
            condition.push({ createdAt: { $gte: Number(req.body.start) } });
            condition.push({ createdAt: { $lte: Number(req.body.end) } });
        }
        let listUser = await Users.aggregate([{
                $match: {
                    $and: condition
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $project: {
                    password: 0,
                    configChat: 0
                }
            },

        ])
        return functions.success(res, "Danh sách", {
            data: {
                listUser
            }
        });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}
exports.candi_hide = async(req, res) => {
        try {
            const skip = Number(req.body.skip);
            const limit = Number(req.body.limit);
            let condition = [
                { type: { $ne: 1 } },
                {
                    $or: [
                        { "inForPerson.candidate.use_check": 0 },
                        { "inForPerson.candidate.cv_title": "" },
                        { userName: "" }
                    ]
                },
                {
                    idTimViec365: { $ne: 0 }
                }
            ];
            if (req.body.start && req.body.end) {
                condition.push({ createdAt: { $gte: Number(req.body.start) } });
                condition.push({ createdAt: { $lte: Number(req.body.end) } });
            }
            if (req.body.userName) {
                condition.push({
                    userName: { $regex: req.body.userName, $options: 'i' }
                })
            };
            if (req.body.phoneTK) {
                condition.push({
                    phoneTK: { $regex: req.body.phoneTK, $options: 'i' }
                })
            }
            if (req.body.email) {
                condition.push({
                    email: { $regex: req.body.email, $options: 'i' }
                })
            }

            let pipeline_add = [{
                    $skip: skip
                },
                {
                    $limit: limit
                },
                {
                    $project: {
                        password: 0,
                        configChat: 0
                    }
                }
            ]
            let pipeline = [{
                    $match: {
                        $and: condition
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $lookup: {
                        from: 'ApplyForJob',
                        localField: 'idTimViec365',
                        foreignField: 'nhs_use_id',
                        as: 'hoso'
                    }
                }
            ];
            if (Number(req.body.cv) == 2) {
                pipeline.push({
                    $lookup: {
                        from: 'SaveCvCandi',
                        localField: 'idTimViec365',
                        foreignField: 'uid',
                        as: 'cv'
                    }
                });
                pipeline.push({
                    $unwind: '$cv'
                })
            };
            for (let i = 0; i < pipeline_add.length; i++) {
                pipeline.push(pipeline_add[i])
            }
            let listUser = await Users.aggregate(
                pipeline
            );
            let listUserFinal = [];
            for (let i = 0; i < listUser.length; i++) {
                let obj = listUser[i];
                listUserFinal.push({
                    ...obj,
                    imagecdn: functions.getUrlLogoCompany(obj.createdAt, obj.avatarUser)
                })
            }
            let count = await Users.countDocuments({ $and: condition });
            return functions.success(res, "Danh sách", {
                data: {
                    listUserFinal,
                    count,
                    pipeline
                }
            });
        } catch (error) {
            console.log(error);
            return functions.setError(res, error);
        }
    }
    // Ứng viên ứng tuyển sai 
exports.candi_apply_wrong = async(req, res) => {
        try {
            const skip = Number(req.body.skip);
            const limit = Number(req.body.limit);
            let condition = { nhs_xn_uts: 1 }
            if (req.body.start && req.body.end) {
                let start_date = new Date(req.body.start).getTime() / 1000;
                let end_date = new Date(req.body.end).getTime() / 1000;
                condition = {
                    nhs_xn_uts: 1,
                    $and: [{
                            nhs_time: { $gte: start_date },
                        },
                        {
                            nhs_time: { $lte: end_date },
                        }
                    ]
                }
            }
            let listUser = await ApplyForJob.aggregate([{
                    $match: condition
                },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'nhs_use_id',
                        foreignField: 'idTimViec365',
                        as: 'user'
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                },
                {
                    $project: {
                        "user.password": 0,
                        "user.configChat": 0
                    }
                }
            ])
            return functions.success(res, "Danh sách", {
                data: {
                    listUser
                }
            });
        } catch (error) {
            console.log(error);
            return functions.setError(res, error);
        }
    }
    // Ứng viên đăng ký mới
exports.candi_register = async(req, res) => {
    try {
        let condition = {
            idTimViec365: { $ne: 0 },
            fromDevice: { $nin: [4, 7] },
            type: 0,
            $or: [{ fromWeb: "timviec365" }, { fromWeb: "dev.timviec365.vn" }],
            "inForPerson.candidate.percents": { $gte: 45 },
        };
        const page = Number(req.body.page) || 1;
        const pageSize = Number(req.body.pageSize) || 30;

        let {
            use_id,
            use_first_name,
            use_phone,
            use_email,
            use_phone_tk,
            cv_title,
            use_email_lh,
            time_start,
            time_end,
            register,
            category,
            city,
            authentic
        } = req.body;
        if (use_id) condition.idTimViec365 = Number(use_id); // Tìm theo id của ứng viên
        if (use_first_name) condition.use_first_name = { $regex: use_first_name, $options: 'i' }; // Tìm theo tên
        if (use_phone) condition.phone = { $regex: use_phone, $options: 'i' }; // Tìm theo sđt
        if (use_email) condition.email = { $regex: use_email, $options: 'i' }; // Tìm theo email đăng nhập
        if (use_phone_tk) condition.use_phone_tk = { $regex: use_phone_tk, $options: 'i' }; // Tìm theo sđt đăng nhập
        if (use_email_lh) condition.emailContact = { $regex: use_email_lh, $options: 'i' }; // Tìm theo email liên hệ
        if (cv_title) condition["inForPerson.candidate.cv_title"] = { $regex: cv_title, $options: 'i' }; // Tìm theo công việc
        // Tìm theo ngày bắt đầu đăng ký
        if (time_start && !time_end) {
            time_start = functions.convertTimestamp(time_start);
            condition.createdAt = { $gt: time_start };
        } else if (!time_start && time_end) {
            time_end = functions.convertTimestamp(time_end);
            condition.createdAt = { $lt: time_end };
        } else if (time_start && time_end) {
            time_start = functions.convertTimestamp(time_start);
            time_end = functions.convertTimestamp(time_end);
            condition.createdAt = { $gt: time_start, $lt: time_end };
        }

        if (register) condition.fromDevice = register; // Tìm theo nguồn đăng ký
        if (category) condition["inForPerson.candidate.cv_cate_id"] = { $all: [Number(category)] };
        if (city) condition["inForPerson.candidate.cv_city_id"] = { $all: [Number(city)] };
        if (authentic) condition.authentic = authentic;
        const list = await Users.aggregate([
            { $match: condition },
            { $sort: { createdAt: -1, idTimViec365: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
                $project: {
                    use_id: "$idTimViec365",
                    use_logo: "$avatarUser",
                    use_create_time: "$createdAt",
                    use_first_name: "$userName",
                    use_gioi_tinh: "$inForPerson.account.gender" || null,
                    use_phone: "$phone",
                    use_email: "$email",
                    cv_title: "$inForPerson.candidate.cv_title",
                    use_address: "$address",
                    dk: "$fromDevice",
                    use_view: "$inForPerson.candidate.use_view",
                    use_phone_tk: "$phoneTK",
                    user_xac_thuc: "$otp" || null,
                    use_authentic: "$authentic",
                }
            }
        ]);
        const count = await Users.countDocuments(condition);
        return functions.success(res, "Danh sách", {
            data: {
                list,
                count
            }
        });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// Ứng viên cập nhật hồ  sơ
exports.candi_update = async(req, res) => {
    try {
        let condition = {
            idTimViec365: { $ne: 0 },
            fromDevice: { $nin: [4, 7] },
            type: 0,
            $or: [{ fromWeb: "timviec365" }, { fromWeb: "dev.timviec365.vn" }],
        };
        const page = Number(req.body.page) || 1;
        const pageSize = Number(req.body.pageSize) || 30;

        let {
            use_id,
            use_first_name,
            use_phone,
            use_email,
            use_phone_tk,
            cv_title,
            use_email_lh,
            time_start,
            time_end,
            register,
            category,
            city,
            authentic
        } = req.body;
        if (use_first_name) condition.use_first_name = { $regex: use_first_name, $options: 'i' }; // Tìm theo tên
        if (use_phone) condition.phone = { $regex: use_phone, $options: 'i' }; // Tìm theo sđt
        if (use_email) condition.email = { $regex: use_email, $options: 'i' }; // Tìm theo email đăng nhập
        if (use_phone_tk) condition.use_phone_tk = { $regex: use_phone_tk, $options: 'i' }; // Tìm theo sđt đăng nhập
        if (use_email_lh) condition.emailContact = { $regex: use_email_lh, $options: 'i' }; // Tìm theo email liên hệ
        // Tìm theo ngày bắt đầu đăng ký
        if (time_start && !time_end) {
            time_start = functions.convertTimestamp(time_start);
            condition.updatedAt = { $gt: time_start };
        } else if (!time_start && time_end) {
            time_end = functions.convertTimestamp(time_end);
            condition.updatedAt = { $lt: time_end };
        } else if (time_start && time_end) {
            time_start = functions.convertTimestamp(time_start);
            time_end = functions.convertTimestamp(time_end);
            condition.updatedAt = { $gt: time_start, $lt: time_end };
        }

        if (register) condition.fromDevice = register; // Tìm theo nguồn đăng ký
        if (category) condition["inForPerson.candidate.cv_cate_id"] = { $all: [Number(category)] };
        if (city) condition["inForPerson.candidate.cv_city_id"] = { $all: [Number(city)] };
        if (authentic) condition.authentic = authentic;

        const list = await Users.aggregate([
            { $match: condition },
            { $sort: { updatedAt: -1, idTimViec365: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
                $project: {
                    use_id: "$idTimViec365",
                    use_logo: "$avatarUser",
                    use_create_time: "$createdAt",
                    use_update_time: "$updatedAt",
                    use_first_name: "$userName",
                    use_gioi_tinh: "$inForPerson.account.gender" || null,
                    use_phone: "$phone",
                    use_email: "$email",
                    cv_title: "$inForPerson.candidate.cv_title",
                    use_address: "$address",
                    dk: "$fromDevice",
                    use_view: "$inForPerson.candidate.use_view",
                    use_phone_tk: "$phoneTK",
                    user_xac_thuc: "$otp" || null,
                    use_authentic: "$authentic",
                }
            }
        ]);
        const count = await Users.countDocuments(condition);
        return functions.success(res, "Danh sách", {
            data: {
                list,
                count
            }
        });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// Ứng viên cập nhật hồ  sơ
exports.candi_login = async(req, res) => {
    try {
        let now = new Date().getTime() / 1000 - 24 * 3600;
        let skip = 0;
        let limit = 10;
        if (req.body.limit) {
            limit = Number(req.body.limit)
        };
        if (req.body.skip) {
            skip = Number(req.body.skip);
        }
        let condition = [
            { idTimViec365: { $ne: 0 } },
            { type: { $ne: 1 } },
            { updatedAt: { $gte: now } }
        ]
        if (req.body.userName) {
            condition.push({
                userName: { $regex: req.body.userName, $options: 'i' }
            })
        };
        if (req.body.phoneTK) {
            condition.push({
                phoneTK: { $regex: req.body.phoneTK, $options: 'i' }
            })
        }
        if (req.body.email) {
            condition.push({
                email: { $regex: req.body.email, $options: 'i' }
            })
        }

        const count = await Users.countDocuments({ $and: condition });
        let list = await Users.find({ $and: condition }, { password: 0, configChat: 0, inforRN365: 0, "inForPerson.employee": 0 }).skip(skip).limit(limit).lean()
        return functions.success(res, "Danh sách", {
            data: {
                list,
                count
            }
        });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// Ứng viên tải cv từ máy tính cá nhân
exports.checkProfile = async(req, res) => {
    try {
        const page = req.body.page || 1,
            pageSize = req.body.pageSize || 30;
        const use_check = req.body.use_check || 0;

        const list = await Profile.aggregate([{
                $match: {
                    hs_link: { $ne: "" }
                }
            },
            { $sort: { hs_create_time: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: 30 },
            {
                $lookup: {
                    from: "Users",
                    localField: "hs_use_id",
                    foreignField: "idTimViec365",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $match: {
                    "user.type": 0,
                    "user.inForPerson.candidate.use_check": Number(use_check)
                }
            },
            {
                $project: {
                    use_id: "$user.idTimViec365",
                    use_logo: "$user.avatarUser",
                    use_create_time: "$user.createdAt",
                    use_first_name: "$user.userName",
                    use_phone: "$user.phone",
                    use_email: "$user.email",
                    use_gioi_tinh: "$user.inForPerson.account.gender",
                    hs_create_time: 1,
                    hs_link: 1,
                }
            }
        ]);

        for (let i = 0; i < list.length; i++) {
            const element = list[i];
            element.hs_link = service.getUrlProfile(element.hs_create_time, element.hs_link);
        }

        const countProfile = await Profile.aggregate([{
                $match: {
                    hs_link: { $ne: "" }
                }
            },
            { $skip: (page - 1) * pageSize },
            { $limit: 30 },
            {
                $lookup: {
                    from: "Users",
                    localField: "hs_use_id",
                    foreignField: "idTimViec365",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $match: {
                    "user.type": 0,
                    "user.inForPerson.candidate.use_check": use_check
                }
            },
            {
                $count: "total"
            }
        ]);

        return functions.success(res, "Danh sách", {
            data: {
                list,
                count: countProfile.length > 0 ? countProfile[0].total : 0
            }
        });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// Active hồ sơ ứng viên tải lên
exports.activeProfile = async(req, res) => {
    try {
        let { use_id } = req.body;

        if (use_id) {
            const user = await Users.findOne({ idTimViec365: use_id, type: 0 });
            if (user) {
                await Users.updateOne({ idTimViec365: use_id, type: 0 }, {
                    $set: { "inForPerson.candidate.use_check": 1 }
                });
                return functions.success(res, "Duyệt hồ sơ thành công");
            }
            return functions.setError(res, "Ứng viên không tồn tại");
        }
        return functions.setError(res, "Thông tin truyền lên chưa đầy đủ");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// Xóa ứng viên
exports.delete = async(req, res) => {
    try {
        const { use_id } = req.body;
        if (use_id) {
            const user = await Users.findOne({ idTimViec365: use_id, type: 0 });
            if (user) {
                // Xóa hồ sơ
                await Users.deleteOne({ _id: user._id });
                const profile = await Profile.findOne({ hs_use_id: user.idTimViec365 });
                let item = new HistoryDeleteUser({
                    user_id: user.idTimViec365,
                    use_email: user.email,
                    use_phone_tk: user.phoneTK,
                    use_first_name: user.userName,
                    use_pass: user.password,
                    use_type: user.inForPerson.candidate.use_type,
                    use_create_time: user.createdAt,
                    use_update_time: user.updatedAt,
                    user_reset_time: user.inForPerson.candidate.user_reset_time,
                    use_logo: user.avatarUser,
                    use_phone: user.phone,
                    use_gioi_tinh: user.inForPerson.account.gender,
                    use_birth_day: user.inForPerson.account.birthday,
                    use_city: user.city,
                    use_quanhuyen: user.district,
                    use_address: user.address,
                    use_hon_nhan: user.inForPerson.account.married,
                    use_view: user.inForPerson.candidate.use_view,
                    use_noti: user.inForPerson.candidate.use_noti,
                    use_show: user.inForPerson.candidate.use_show,
                    use_show_cv: user.inForPerson.candidate.use_show_cv,
                    use_active: user.inForPerson.candidate.use_active,
                    use_authentic: user.inForPerson.candidate.use_authentic,
                    use_lat: user.latitude,
                    use_long: user.longtitude,
                    use_td: user.inForPerson.candidate.use_td,
                    usc_mail_app: user.inForPerson.candidate.usc_mail_app,
                    use_check: user.inForPerson.candidate.use_check,
                    user_xac_thuc: user.authentic,
                    dk: user.fromDevice,
                    chat365_id: user._id,
                    chat365_secret: user.chat365_secret,
                    cv_title: user.inForPerson.candidate.cv_title,
                    cv_hocvan: user.inForPerson.candidate.cv_hocvan,
                    cv_exp: user.inForPerson.account.experience,
                    cv_muctieu: user.inForPerson.candidate.cv_muctieu,
                    cv_cate_id: user.inForPerson.candidate.cv_cate_id.toString(),
                    cv_city_id: user.inForPerson.candidate.cv_city_id.toString(),
                    cv_capbac_id: user.inForPerson.candidate.cv_capbac_id,
                    cv_money_id: user.inForPerson.candidate.cv_money_id,
                    cv_loaihinh_id: user.inForPerson.candidate.cv_loaihinh_id,
                    cv_time: user.inForPerson.candidate.cv_time,
                    cv_time_dl: user.inForPerson.candidate.cv_time_dl,
                    cv_kynang: user.inForPerson.candidate.cv_kynang,
                    cv_tc_name: user.inForPerson.candidate.cv_tc_name,
                    cv_tc_cv: user.inForPerson.candidate.cv_tc_cv,
                    cv_tc_dc: user.inForPerson.candidate.cv_tc_dc,
                    cv_tc_phone: user.inForPerson.candidate.cv_tc_phone,
                    cv_tc_email: user.inForPerson.candidate.cv_tc_email,
                    cv_tc_company: user.inForPerson.candidate.cv_tc_company,
                    cv_video: user.inForPerson.candidate.cv_video,
                    cv_video_type: user.inForPerson.candidate.cv_video_type,
                    cv_video_active: user.inForPerson.candidate.cv_video_active,
                    delete_time: functions.getTimeNow()
                });
                if (profile) {
                    item.hs_create_time = profile.hs_create_time;
                    item.hs_link = profile.hs_link;
                    item.hs_name = profile.hs_name;
                }
                await item.save();
                return functions.success(res, "Xóa ứng viên thành công");
            }
            return functions.setError(res, "Ứng viên không tồn tại");
        }
        return functions.setError(res, "Thông tin truyền lên chưa đầy đủ");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// Ứng viên có điểm hồ sơ < 45
exports.percents = async(req, res) => {
    try {
        const page = req.body.page || 1,
            pageSize = req.body.pageSize || 30;
        const list = await Users.aggregate([{
                $match: {
                    idTimViec365: { $ne: 0 },
                    fromDevice: { $nin: [4, 7] },
                    type: 0,
                    $or: [{ fromWeb: "timviec365" }, { fromWeb: "dev.timviec365.vn" }],
                    "inForPerson.candidate.percents": { $lt: 45 }
                }
            },
            { $sort: { createdAt: -1, idTimViec365: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
                $project: {
                    use_id: "$idTimViec365",
                    use_logo: "$avatarUser",
                    use_create_time: "$createdAt",
                    use_first_name: "$userName",
                    use_gioi_tinh: "$inForPerson.account.gender" || null,
                    use_phone: "$phone",
                    use_email: "$email",
                    cv_title: "$inForPerson.candidate.cv_title",
                    use_address: "$address",
                    dk: "$fromDevice",
                    use_view: "$inForPerson.candidate.use_view",
                    use_show: "$inForPerson.candidate.use_show",
                    use_phone_tk: "$phoneTK",
                    user_xac_thuc: "$otp" || null,
                    use_authentic: "$authentic",
                    percents: "$inForPerson.candidate.percents"
                }
            }
        ]);
        const count = await Users.countDocuments({
            idTimViec365: { $ne: 0 },
            fromDevice: { $nin: [4, 7] },
            type: 0,
            $or: [{ fromWeb: "timviec365" }, { fromWeb: "dev.timviec365.vn" }],
            "inForPerson.candidate.percents": { $lt: 45 }
        });
        return functions.success(res, "Danh sách ứng viên", { list, count });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// ứng viên ứng tuyển nhà tuyển dụng
exports.listApply = async(req, res) => {
    try {
        const page = req.body.page || 1,
            pageSize = req.body.pageSize || 30;

        const list = await ApplyForJob.aggregate([
            { $sort: { nhs_time: -1 } },
            { $limit: pageSize },
            {
                $lookup: {
                    from: "Users",
                    localField: "nhs_use_id",
                    foreignField: "idTimViec365",
                    as: "candidate",
                }
            },
            { $unwind: "$candidate" },
            { $match: { "candidate.type": 0 } },
            {
                $lookup: {
                    from: "Users",
                    localField: "nhs_com_id",
                    foreignField: "idTimViec365",
                    as: "company",
                }
            },
            { $unwind: "$company" },
            { $match: { "company.type": 1 } },
            {
                $lookup: {
                    from: "NewTV365",
                    localField: "nhs_new_id",
                    foreignField: "new_id",
                    as: "new",
                }
            },
            { $unwind: "$new" },
            {
                $project: {
                    nhs_kq: 1,
                    nhs_xn_uts: 1,
                    use_id: "$candidate.idTimViec365",
                    use_logo: "$candidate.avatarUser",
                    use_create_time: "$candidate.createdAt",
                    use_first_name: "$candidate.userName",
                    use_phone: "$candidate.phone",
                    use_phone_tk: "$candidate.phoneTK",
                    new_id: "$new.new_id",
                    new_title: "$new.new_title",
                    new_han_nop: "$new.new_han_nop",
                    usc_phone: "$company.phone",
                    usc_email: "$company.email",
                    nhs_time: 1,
                }
            }
        ]);
        // const count = await ApplyForJob.aggregate([{
        //         $lookup: {
        //             from: "Users",
        //             localField: "nhs_use_id",
        //             foreignField: "idTimViec365",
        //             as: "candidate",
        //         }
        //     },
        //     { $unwind: "$candidate" },
        //     { $match: { "candidate.type": 0 } },
        //     {
        //         $lookup: {
        //             from: "Users",
        //             localField: "nhs_com_id",
        //             foreignField: "idTimViec365",
        //             as: "company",
        //         }
        //     },
        //     { $unwind: "$company" },
        //     { $match: { "company.type": 1 } },
        //     {
        //         $lookup: {
        //             from: "NewTV365",
        //             localField: "nhs_new_id",
        //             foreignField: "new_id",
        //             as: "new",
        //         }
        //     },
        // { $unwind: "$new" },
        //     {
        //         $count: "total"
        //     }
        // ]);
        const count = 0;
        return functions.success(res, "Danh sách ứng viên ứng tuyển", {
            list,
            count: count.length > 0 ? count[0].total : 0
        });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// ứng viên chưa hoàn thiện hồ sơ
exports.listAuthentic = async(req, res) => {
    try {
        const page = req.body.page || 1,
            pageSize = req.body.pageSize || 30;
        const condition = {
            idTimViec365: { $ne: 0 },
            type: 0,
            $or: [{ fromWeb: "timviec365" }, { fromWeb: "dev.timviec365.vn" }],
            authentic: 0
        };
        const list = await Users.aggregate([{
                $match: condition
            },
            { $sort: { createdAt: -1, idTimViec365: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
                $project: {
                    use_id: "$idTimViec365",
                    use_logo: "$avatarUser",
                    use_create_time: "$createdAt",
                    use_first_name: "$userName",
                    use_gioi_tinh: "$inForPerson.account.gender" || null,
                    use_phone: "$phone",
                    use_email: "$email",
                    cv_title: "$inForPerson.candidate.cv_title",
                    use_address: "$address",
                    dk: "$fromDevice",
                    use_view: "$inForPerson.candidate.use_view",
                    use_phone_tk: "$phoneTK",
                    user_xac_thuc: "$otp" || null,
                    use_authentic: "$authentic",
                    percents: "$inForPerson.candidate.percents",
                    use_authentic: "$authentic"
                }
            }
        ]);
        const count = await Users.countDocuments(condition);
        return functions.success(res, "Danh sách ứng viên", { list, count });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// ứng viên cv
exports.listCandiSaveCv = async(req, res) => {
    try {
        const page = req.body.page || 1,
            pageSize = req.body.pageSize || 30;
        const list = await SaveCvCandi.aggregate([{
                $sort: { time_edit: -1 }
            },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
                $lookup: {
                    from: "Users",
                    localField: "uid",
                    foreignField: "idTimViec365",
                    as: "user",
                }
            },
            { $unwind: "$user" },
            {
                $match: {
                    "user.type": 0
                }
            },
            {
                $project: {
                    use_id: "$user.idTimViec365",
                    use_first_name: "$user.userName",
                    use_phone: "$user.phone",
                    use_email: "$user.email",
                    time_edit: 1,
                    html: 1
                }
            }
        ]);
        return functions.success(res, "Danh sách ứng viên", { list, count: 0 });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// ứng viên đã xóa
exports.listDeleted = async(req, res) => {
    try {
        const page = req.body.page || 1,
            pageSize = req.body.pageSize || 30;

        const list = await HistoryDeleteUser.find()
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .sort({ delete_time: -1 })
            .lean();
        const count = await HistoryDeleteUser.countDocuments();
        return functions.success(res, "Danh sách ứng viên", { list, count });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// UserAddFails
exports.takeListUserAddFail = async(req, res) => {
    try {
        let condition = [];
        if (req.body.start) {
            condition.push({ uf_time: { $gte: new Date(req.body.start) } });
        };
        if (req.body.end) {
            condition.push({ uf_time: { $lte: new Date(req.body.end) } });
        };
        if (req.body.email) {
            condition.push({ uf_email: new RegExp(req.body.email, 'i') });
        }
        if (req.body.phone) {
            condition.push({ uf_phone: new RegExp(req.body.phone, 'i') });
        }
        let skip = Number(req.body.skip);
        let limit = Number(req.body.limit);
        let listData = await UserAddFail.find({
            $or: condition,
        }).skip(skip).limit(limit).lean();
        let count = await UserAddFail.countDocuments({
            $or: condition,
        })
        return functions.success(res, "Danh sách", {
            data: {
                listData,
                count
            }
        });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}
exports.refreshCandi = async(req, res) => {
    try {
        const userId = req.body.use_id;
        if (userId) {
            let checkUser = await Users.findOne({ idTimViec365: userId, type: { $ne: 1 } }).lean();
            if (checkUser) {
                await Users.updateOne({ _id: checkUser._id }, {
                    $set: {
                        updatedAt: functions.getTimeNow()
                    }
                })
                return functions.success(res, "Làm mới ứng viên thành công");
            }
            return functions.setError(res, "Tài khoản không tồn tại");
        }
        return functions.setError(res, "Thông tin truyền lên không đầy đủ");
    } catch (e) {
        console.log(e);
        return functions.setError(res, e);
    }
}