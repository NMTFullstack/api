const Users = require('../../models/Users');
const Appoint = require('../../models/hr/personalChange/Appoint');
const QuitJobNew = require('../../models/hr/personalChange/QuitJobNew');
const TranferJob = require('../../models/hr/personalChange/TranferJob');
const functions = require('../../services/functions');
const RecruitmentNews = require('../../models/hr/RecruitmentNews')
const hr = require('../../services/hr/hrService');
const Candidates = require('../../models/hr/Candidates');
const GetJob = require('../../models/hr/GetJob');
const QuitJob = require('../../models/hr/personalChange/QuitJob');
const Salarys = require('../../models/Tinhluong/Tinhluong365SalaryBasic');
const Deparment = require('../../models/qlc/Deparment');
const Resign = require('../../models/hr/personalChange/Resign');
const User = require('../../models/Users');

// báo cáo nhân sự
exports.report = async(req, res, next) => {
    try {
        let comId = req.infoLogin.comId;
        const listOrganizeDetailId = req.body.listOrganizeDetailId
        if (listOrganizeDetailId)
            if (!Array.isArray(listOrganizeDetailId)) JSON.parse(listOrganizeDetailId)
        let from_date = req.body.from_date;
        let to_date = req.body.to_date;

        let searchItem = {
            idQLC: 1,
            userName: 1,
            birthday: '$inForPerson.account.birthday',
            gender: '$inForPerson.account.gender',
            organizeDetailName: '$organizeDetail.organizeDetailName',
            positionName: '$positions.positionName',
            chucvu: '$inForPerson.employee.position_id',
            married: '$inForPerson.account.married',
            emailContact: 1,
            phone: 1,
            start_working_time: '$inForPerson.employee.start_working_time',
            'quit.ep_id': 1,
            'quit.current_position': 1,
            'quit.created_at': 1
        };
        // tạo conditions
        let conditions = {};
        let subConditions = {};

        // điều kiện tìm kiếm 
        if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
        if (from_date) conditions['inForPerson.employee.start_working_time'] = { $gte: new Date(from_date).getTime() / 1000 }
        if (to_date) conditions['inForPerson.employee.start_working_time'] = { $lte: new Date(to_date).getTime() / 1000 }
        if (from_date && to_date)
            conditions['inForPerson.employee.start_working_time'] = {
                $gte: new Date(from_date).getTime() / 1000,
                $lte: new Date(to_date).getTime() / 1000
            }

        conditions['inForPerson.employee.com_id'] = comId;
        conditions['inForPerson.employee.ep_status'] = "Active";
        conditions.type = 2;
        // tổng số nhân viên thuộc công ty
        let countEmployee = await Users.aggregate([
            { $match: conditions },
            {
                $lookup: {
                    from: 'QLC_OrganizeDetail',
                    localField: 'inForPerson.employee.organizeDetailId',
                    foreignField: 'id',
                    pipeline: [{ $match: { comId: comId } }],
                    as: 'organizeDetail'
                }
            },
            { $unwind: { path: "$organizeDetail", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'QLC_Positions',
                    localField: 'inForPerson.employee.position_id',
                    foreignField: 'id',
                    pipeline: [{ $match: { comId: comId } }],
                    as: 'positions',

                }
            },
            { $unwind: { path: "$positions", preserveNullAndEmptyArrays: true } },
            { $project: searchItem }
        ])


        // tìm kiếm điều kiện là nhân viên nam
        conditions['inForPerson.account.gender'] = 1;
        let countEmployeeNam = await Users.countDocuments(conditions)

        // tìm kiếm với điều kiện là nhân viên nữ
        conditions['inForPerson.account.gender'] = 2;
        let countEmployeeNu = await Users.countDocuments(conditions)

        // xoá điều kiện 
        conditions = {};
        subConditions = {};

        // điều kiện tìm kiếm
        if (listOrganizeDetailId) subConditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
        if (from_date) conditions.created_at = { $gte: new Date(from_date) }
        if (to_date) conditions.created_at = { $lte: new Date(to_date) }
        if (from_date && to_date)
            conditions.created_at = { $gte: new Date(from_date), $lte: new Date(to_date) }

        subConditions['user.inForPerson.account.gender'] = 1;
        subConditions['user.inForPerson.employee.com_id'] = comId;
        subConditions['user.type'] = { $ne: 1 };
        // tìm kiếm nhân viên được bổ nhiệm là nam
        let dataBoNhiemNam = await Appoint.aggregate([
                { $match: conditions },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'ep_id',
                        foreignField: 'idQLC',
                        as: 'user'
                    }
                },
                { $unwind: "$user" },
                { $match: subConditions },
            ])
            // tìm kiếm với nhân viên được bổ nhiệm là nữ
        subConditions['user.inForPerson.account.gender'] = 2;
        let dataBoNhiemNu = await Appoint.aggregate([
            { $match: conditions },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'ep_id',
                    foreignField: 'idQLC',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            { $match: subConditions },
        ])

        // tìm kiếm nhân viên được bổ nhiệm
        delete subConditions['user.inForPerson.account.gender']
        let dataBoNhiem = await Appoint.aggregate([
            { $match: conditions },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'ep_id',
                    foreignField: 'idQLC',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            { $match: subConditions },
        ])

        // xoá điều kiện 
        conditions = {};
        subConditions = {};

        // điều kiện tìm kiếm
        if (listOrganizeDetailId) subConditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
        if (from_date) conditions.created_at = { $gte: new Date(from_date) }
        if (to_date) conditions.created_at = { $lte: new Date(to_date) }
        if (from_date && to_date)
            conditions.created_at = { $gte: new Date(from_date), $lte: new Date(to_date) }
        conditions.type = 1;
        conditions.com_id = comId;
        subConditions['user.type'] = 0
            // số lượng nhân viên giảm biên chế
        let giamBienChe = await Resign.aggregate([
            { $match: conditions },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'ep_id',
                    foreignField: 'idQLC',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            { $match: subConditions },
        ])

        conditions.type = 2;
        // số lượng nhân viên nghỉ việc
        let nghiViec = await Resign.aggregate([
            { $match: conditions },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'ep_id',
                    foreignField: 'idQLC',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            { $match: subConditions },
        ])

        // tổng số lượng nhân viên nghỉ việc
        delete conditions.type
        let countDataNghiViec = await Resign.aggregate([
            { $match: conditions },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'ep_id',
                    foreignField: 'idQLC',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            { $match: subConditions },
        ])

        // xoá điều kiện 
        conditions = {};
        subConditions = {};
        // tăng giảm lương
        if (from_date) conditions.sb_time_up = { $gte: new Date(from_date) }
        if (to_date) conditions.sb_time_up = { $lte: new Date(to_date) }
        if (from_date && to_date)
            conditions.sb_time_up = { $gte: new Date(from_date), $lte: new Date(to_date) }
        if (listOrganizeDetailId) subConditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
        conditions.sb_id_com = comId;
        let dataLuong = await Salarys.aggregate([
            { $match: conditions },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'sb_id_user',
                    foreignField: 'idQLC',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            { $match: subConditions },
        ])
        let tangLuong = 0;
        let giamLuong = 0;
        let arr = [];
        if (dataLuong.length !== 0) {
            for (let i = 0; i < dataLuong.length; i++) {
                conditions = {};
                conditions.sb_id_user = dataLuong[i].sb_id_user;
                conditions.sb_time_up = { $lt: new Date(dataLuong[i].sb_time_up) }
                checkTangGiam = await Salarys.findOne(conditions).sort({ sb_time_up: -1 }).lean()

                if (checkTangGiam) {
                    let tangGiam = dataLuong[i].sb_salary_basic - checkTangGiam.sb_salary_basic
                    checkTangGiam.tangGiam = tangGiam
                    if (dataLuong[i].sb_salary_basic - checkTangGiam.sb_salary_basic > 0) {
                        tangLuong++;
                        arr.push(checkTangGiam)
                    } else if (dataLuong[i].sb_salary_basic - checkTangGiam.sb_salary_basic < 0) {
                        giamLuong++;
                        arr.push(checkTangGiam)
                    }
                }
            }
        }

        let tangGiamLuong = 0;
        if (tangLuong !== 0) tangGiamLuong = tangLuong;
        if (giamLuong !== 0) tangGiamLuong = giamLuong;
        if (tangLuong !== 0 && giamLuong !== 0) tangGiamLuong = tangLuong + giamLuong;

        // xoá điều kiện 
        conditions = {};
        subConditions = {};

        // điều kiện tìm kiếm
        if (listOrganizeDetailId) subConditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
        if (from_date) conditions.created_at = { $gte: new Date(from_date) }
        if (to_date) conditions.created_at = { $lte: new Date(to_date) }
        if (from_date && to_date)
            conditions.created_at = { $gte: new Date(from_date), $lte: new Date(to_date) }


        subConditions['user.type'] = { $ne: 1 };
        conditions.com_id = comId;


        // Luân chuyển công tác
        let countDataLuanChuyen = await TranferJob.aggregate([
            { $match: conditions },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'ep_id',
                    foreignField: 'idQLC',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            { $match: subConditions },
        ])

        // nhân viên nam luân chuyển
        subConditions['user.inForPerson.account.gender'] = 1
        let countDataLuanChuyenNam = await TranferJob.aggregate([
            { $match: conditions },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'ep_id',
                    foreignField: 'idQLC',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            { $match: subConditions },
        ])

        // nhân viên nữ luân chuyển
        subConditions['user.inForPerson.account.gender'] = 2
        let countDataLuanChuyenNu = await TranferJob.aggregate([
            { $match: conditions },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'ep_id',
                    foreignField: 'idQLC',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            { $match: subConditions },
        ])


        let data = {};

        data.Employee = countEmployee.length;
        data.countEmployee = countEmployee;
        data.EmployeeNam = countEmployeeNam;
        data.EmployeeNu = countEmployeeNu;

        data.tongNghiViec = countDataNghiViec.length;
        data.giamBienChe = giamBienChe.length
        data.nghiViec = nghiViec.length

        data.boNhiem = dataBoNhiem.length
        data.boNhiemNam = dataBoNhiemNam.length
        data.boNhiemNu = dataBoNhiemNu.length

        data.tangGiamLuong = tangGiamLuong;
        data.tangLuong = tangLuong;
        data.giamLuong = giamLuong;

        data.luanChuyen = countDataLuanChuyen.length
        data.luanChuyenNam = countDataLuanChuyenNam.length
        data.luanChuyenNu = countDataLuanChuyenNu.length
        return functions.success(res, 'get data success', { data })
    } catch (error) {
        console.log("🚀 ~ file: report.js:637 ~ exports.report= ~ error:", error)
        return functions.setError(res, error)
    }
}

// chi tiết báo cáo nhân sự
exports.reportDetail = async(req, res, next) => {
    try {
        // Biến nhập từ winform
        let comId = req.infoLogin.comId;
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let link = req.body.link;
        let gender = Number(req.body.gender);
        let positionId = Number(req.body.positionId);
        let organizeDetailId = Number(req.body.organizeDetailId)
        let listOrganizeDetailId = req.body.listOrganizeDetailId
        if (listOrganizeDetailId)
            if (!Array.isArray(listOrganizeDetailId)) JSON.parse(listOrganizeDetailId)
        let birthday = req.body.birthday;
        let married = Number(req.body.married);
        let seniority = Number(req.body.seniority);
        let old = Number(req.body.old);
        let from_date = req.body.from_date;
        let to_date = req.body.to_date;
        let type = Number(req.body.type);

        let limit = pageSize;
        let skip = (page - 1) * limit;
        let searchItem = {
            idQLC: 1,
            userName: 1,
            birthday: '$inForPerson.account.birthday',
            gender: '$inForPerson.account.gender',
            organizeDetailName: '$organizeDetail.organizeDetailName',
            chucvu: '$position.positionName',
            married: '$inForPerson.account.married',
            emailContact: 1,
            phone: 1,
            start_working_time: '$inForPerson.employee.start_working_time',
            'quit.ep_id': 1,
            'quit.current_position': 1,
            'quit.created_at': 1,
            luongmoi: '$HR_Salarys.sb_salary_basic',
            sb_id_user: '$HR_Salarys.sb_id_user',
            sb_time_up: '$HR_Salarys.sb_time_up',
            sb_quyetdinh: '$HR_Salarys.sb_quyetdinh',
            address: 1,
            experience: '$inForPerson.account.experience',

        };

        let searchItem2 = {
            'idQLC': '$user.idQLC',
            'userName': '$user.userName',
            'birthday': '$user.inForPerson.account.birthday',
            'gender': '$user.inForPerson.account.gender',
            'organizeDetailName': '$organizeDetail.organizeDetailName',
            'chucvu': '$positions.positionName',
            'married': '$user.inForPerson.account.married',
            'emailContact': '$user.emailContact',
            'phone': '$user.phone',
            'start_working_time': '$user.inForPerson.employee.start_working_time',
            'quit.ep_id': 1,
            'quit.current_position': 1,
            'quit.created_at': 1,
            'luongmoi': '$sb_salary_basic',
            'sb_id_user': '$sb_id_user',
            'sb_time_up': '$sb_time_up',
            'sb_quyetdinh': '$sb_quyetdinh',
            'address': '$user.address',
            'experience': '$user.inForPerson.account.experience',
            'organizeDetailId': '$organizeDetail.id',
            'listOrganizeDetailId': '$organizeDetail.listOrganizeDetailId'
        };
        let conditions = {};
        let data = {};
        let subConditions = {};



        if (link === 'bieu-do-danh-sach-nhan-vien.html') {
            conditions.type = 2;
            conditions['inForPerson.employee.com_id'] = comId;
            conditions['inForPerson.employee.ep_status'] = 'Active';
            if (gender) conditions['inForPerson.account.gender'] = gender;
            if (positionId) conditions['inForPerson.employee.position_id'] = positionId;
            if (organizeDetailId) conditions['inForPerson.employee.organizeDetailId'] = organizeDetailId;
            if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
            if (birthday) conditions['inForPerson.account.birthday'] = { $regex: `.*${birthday}*.` };
            if (married) conditions['inForPerson.account.married'] = married;
            if (seniority) conditions['inForPerson.account.experience'] = seniority;
            if (birthday) {
                var dauNam = new Date(birthday, 0, 1).getTime() / 1000;
                var cuoiNam = new Date(birthday, 11, 31).getTime() / 1000;
                conditions['inForPerson.account.birthday'] = {
                    $gt: dauNam,
                    $lt: cuoiNam
                };
            }

            data = await Users.aggregate([
                { $match: conditions },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'organizeDetail'
                    }
                },
                { $unwind: { path: "$organizeDetail", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'QLC_Positions',
                        localField: 'inForPerson.employee.position_id',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'positions',

                    }
                },
                { $unwind: { path: "$positions", preserveNullAndEmptyArrays: true } },

                { $project: searchItem }
            ])
            let soluong = data.length;
            let total = await Users.countDocuments(conditions)

            let winform = Number(req.body.winform);
            if (winform == 1) {
                let arr = [];

                for (let i = 0; i < data.length; i++) {
                    let obj = {};
                    const element = data[i];
                    obj.position_name = element.chucvu;
                    obj.ep_name = element.userName;
                    arr.push(obj);
                }
                return res.status(200).json({ data: { totalItems: soluong, items: arr } })
            }
            return functions.success(res, 'get data success', { total, soluong, data })
        } else if (link === 'bieu-do-danh-sach-nhan-vien-nghi-viec.html') {
            conditions.com_id = comId;
            if (type) conditions.type = type;

            if (gender) subConditions['user.inForPerson.account.gender'] = gender;
            if (organizeDetailId) conditions['inForPerson.employee.organizeDetailId'] = organizeDetailId;
            if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
            if (positionId) subConditions['user.inForPerson.employee.position_id'] = positionId;
            if (birthday) subConditions['user.inForPerson.account.birthday'] = { $regex: `.*${birthday}*.` };
            if (married) subConditions['user.inForPerson.account.married'] = married;
            if (seniority) subConditions['user.inForPerson.account.experience'] = seniority;
            if (birthday) {
                var dauNam = new Date(birthday, 1, 1).getTime() / 1000;
                var cuoiNam = new Date(birthday, 12, 31).getTime() / 1000;
                subConditions['user.inForPerson.account.birthday'] = {
                    $gt: dauNam,
                    $lt: cuoiNam
                };
            }
            subConditions['user.type'] = 0;

            data = await Resign.aggregate([
                { $match: conditions },
                { $skip: skip },
                { $limit: limit },


                {
                    $lookup: {
                        from: 'Users',
                        localField: 'ep_id',
                        foreignField: 'idQLC',
                        as: 'user'
                    }
                },
                { $unwind: "$user" },


                { $match: subConditions },


                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'organizeDetail'
                    }
                },
                { $unwind: { path: "$organizeDetail", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'QLC_Positions',
                        localField: 'inForPerson.employee.position_id',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'positions',

                    }
                },
                { $unwind: { path: "$positions", preserveNullAndEmptyArrays: true } },
                { $project: searchItem2 }
            ]);
            let soluong = data.length
            let total = await Resign.aggregate([
                { $match: conditions },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'ep_id',
                        foreignField: 'idQLC',
                        as: 'user'
                    }
                },
                { $unwind: "$user" },
                { $match: subConditions },
            ]);
            total = total.length;
            return functions.success(res, 'get data success', { total, soluong, data })
        } else if (link === 'bieu-do-danh-sach-nhan-vien-bo-nhiem.html') {
            conditions.type = { $ne: 1 }
            conditions['inForPerson.employee.com_id'] = comId;

            if (gender) conditions['inForPerson.account.gender'] = gender;
            if (positionId) conditions['inForPerson.employee.position_id'] = positionId;
            if (organizeDetailId) conditions['inForPerson.employee.organizeDetailId'] = organizeDetailId;
            if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
            if (birthday) conditions['inForPerson.account.birthday'] = { $regex: `.*${birthday}*.` };
            if (married) conditions['inForPerson.account.married'] = married;
            if (seniority) conditions['inForPerson.account.experience'] = seniority;
            if (birthday) {
                var dauNam = new Date(birthday, 1, 1).getTime() / 1000;
                var cuoiNam = new Date(birthday, 12, 31).getTime() / 1000;
                conditions['inForPerson.account.birthday'] = {
                    $gt: dauNam,
                    $lt: cuoiNam
                };
            }

            data = await Users.aggregate([
                { $match: conditions },
                {
                    $lookup: {
                        from: 'HR_Appoints',
                        localField: 'idQLC',
                        foreignField: 'ep_id',
                        as: 'Appoints'
                    }
                },
                { $unwind: "$Appoints" },
                { $skip: skip },
                { $limit: limit },

                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'organizeDetail'
                    }
                },
                { $unwind: { path: "$organizeDetail", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'QLC_Positions',
                        localField: 'inForPerson.employee.position_id',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'positions',

                    }
                },
                { $unwind: { path: "$positions", preserveNullAndEmptyArrays: true } },

                { $project: searchItem }

            ])
            let total = await Users.aggregate([
                { $match: conditions },
                {
                    $lookup: {
                        from: 'HR_Appoints',
                        localField: 'idQLC',
                        foreignField: 'ep_id',
                        as: 'Appoints'
                    }
                },
                { $unwind: "$Appoints" },
            ]);
            let soluong = data.length
            total = total.length

            return functions.success(res, 'get data success', { total, soluong, data })
        } else if (link === 'bieu-do-danh-sach-nhan-vien-chuyen-cong-tac.html') {

            if (gender) subConditions['user.inForPerson.account.gender'] = gender;
            if (positionId) subConditions['user.inForPerson.employee.position_id'] = positionId;
            if (organizeDetailId) conditions['inForPerson.employee.organizeDetailId'] = organizeDetailId;
            if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
            if (birthday) subConditions['user.inForPerson.account.birthday'] = { $regex: `.*${birthday}*.` };
            if (married) subConditions['user.inForPerson.account.married'] = married;
            if (seniority) subConditions['user.inForPerson.account.experience'] = seniority;
            if (birthday) {
                var dauNam = new Date(birthday, 1, 1).getTime() / 1000;
                var cuoiNam = new Date(birthday, 12, 31).getTime() / 1000;
                subConditions['user.inForPerson.account.birthday'] = {
                    $gt: dauNam,
                    $lt: cuoiNam
                };
            }
            subConditions['user.type'] = { $ne: 1 }
            conditions.com_id = comId

            data = await TranferJob.aggregate([
                { $match: conditions },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'ep_id',
                        foreignField: 'idQLC',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                { $match: subConditions },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'organizeDetail'
                    }
                },
                { $unwind: { path: "$organizeDetail", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'QLC_Positions',
                        localField: 'inForPerson.employee.position_id',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'positions',

                    }
                },
                { $unwind: { path: "$positions", preserveNullAndEmptyArrays: true } },

                { $project: searchItem2 }

            ]);
            let total = await TranferJob.aggregate([
                { $match: conditions },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'ep_id',
                        foreignField: 'idQLC',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                { $match: subConditions },
                { $project: searchItem2 }
            ]);

            total = total.length;
            let soluong = data.length
            return functions.success(res, 'get data success', { total, soluong, data })
        } else if (link === 'bieu-do-danh-sach-nhan-vien-tang-giam-luong.html') {

            if (from_date) conditions.sb_time_up = { $gte: new Date(from_date) }
            if (to_date) conditions.sb_time_up = { $lte: new Date(to_date) }
            if (from_date && to_date)
                conditions.sb_time_up = { $gte: new Date(from_date), $lte: new Date(to_date) }
            let idnv = Number(req.body.idnv);
            if (idnv) subConditions['user.idQLC'] = idnv;
            subConditions['user.type'] = { $ne: 1 }

            if (gender) subConditions['user.inForPerson.account.gender'] = gender;
            if (positionId) subConditions['user.inForPerson.employee.position_id'] = positionId;
            if (organizeDetailId) conditions['inForPerson.employee.organizeDetailId'] = organizeDetailId;
            if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
            if (birthday) subConditions['user.inForPerson.account.birthday'] = { $regex: `.*${birthday}*.` };
            if (married) subConditions['user.inForPerson.account.married'] = married;
            if (seniority) subConditions['user.inForPerson.account.experience'] = seniority;
            if (birthday) {
                var dauNam = new Date(birthday, 1, 1).getTime() / 1000;
                var cuoiNam = new Date(birthday, 12, 31).getTime() / 1000;
                subConditions['user.inForPerson.account.birthday'] = {
                    $gt: dauNam,
                    $lt: cuoiNam
                };
            }

            conditions.sb_id_com = comId;
            conditions.sb_first = { $ne: 1 };

            data = await Salarys.aggregate([
                { $match: conditions },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'sb_id_user',
                        foreignField: 'idQLC',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                { $match: subConditions },
                { $sort: { sb_time_up: -1 } },
                { $skip: skip },
                { $limit: limit },

                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'user.inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'organizeDetail'
                    }
                },
                { $unwind: { path: "$organizeDetail", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'QLC_Positions',
                        localField: 'user.inForPerson.employee.position_id',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'positions',

                    }
                },
                { $unwind: { path: "$positions", preserveNullAndEmptyArrays: true } },

                { $project: searchItem2 }
            ])

            let subData = [];
            for (let i = 0; i < data.length; i++) {
                let element = data[i];
                conditions = {};
                conditions.sb_id_user = element.sb_id_user;
                conditions.sb_time_up = { $lt: new Date(element.sb_time_up) }
                let luongcu = await Salarys.findOne(conditions).sort({ sb_time_up: -1 }).lean();

                if (luongcu && type === 1) {
                    if (luongcu.sb_salary_basic > element.luongmoi) {
                        element.giamLuong = luongcu.sb_salary_basic - element.luongmoi;
                        element.tangLuong = 0;
                        element.luonghientai = luongcu.sb_salary_basic
                        subData.push(element);
                    }
                } else if (luongcu && type === 2) {
                    if (luongcu.sb_salary_basic < element.luongmoi) {
                        element.tangLuong = element.luongmoi - luongcu.sb_salary_basic;
                        element.luonghientai = luongcu.sb_salary_basic
                        element.giamLuong = 0;
                        subData.push(element);
                    }
                } else if (luongcu && !type) {
                    if (luongcu.sb_salary_basic > element.luongmoi) {
                        element.giamLuong = luongcu.sb_salary_basic - element.luongmoi;
                        element.luonghientai = luongcu.sb_salary_basic
                        element.tangLuong = 0;
                        subData.push(element);

                    } else if (luongcu.sb_salary_basic < element.luongmoi) {
                        element.tangLuong = element.luongmoi - luongcu.sb_salary_basic;
                        element.luonghientai = luongcu.sb_salary_basic
                        element.giamLuong = 0;
                        subData.push(element);
                    }
                }
            }
            let soluong = subData.length

            conditions = {}

            if (gender) subConditions['user.inForPerson.account.gender'] = gender;
            if (positionId) subConditions['user.inForPerson.employee.position_id'] = positionId;
            if (organizeDetailId) conditions['inForPerson.employee.organizeDetailId'] = organizeDetailId;
            if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
            if (birthday) subConditions['user.inForPerson.account.birthday'] = { $regex: `.*${birthday}*.` };
            if (married) subConditions['user.inForPerson.account.married'] = married;
            if (seniority) subConditions['user.inForPerson.account.experience'] = seniority;
            if (birthday) {
                var dauNam = new Date(birthday, 1, 1).getTime() / 1000;
                var cuoiNam = new Date(birthday, 12, 31).getTime() / 1000;
                subConditions['user.inForPerson.account.birthday'] = {
                    $gt: dauNam,
                    $lt: cuoiNam
                };
            }
            if (from_date) conditions.sb_time_up = { $gte: new Date(from_date) }
            if (to_date) conditions.sb_time_up = { $lte: new Date(to_date) }
            if (from_date && to_date)
                conditions.sb_time_up = { $gte: new Date(from_date), $lte: new Date(to_date) }
            if (idnv) subConditions['user.idQLC'] = idnv;
            subConditions['user.type'] = { $ne: 1 }
            conditions.sb_id_com = comId;
            conditions.sb_first = { $ne: 1 };

            let dataLuong = await Salarys.aggregate([
                { $match: conditions },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'sb_id_user',
                        foreignField: 'idQLC',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                { $match: subConditions },
                { $sort: { sb_time_up: -1 } },
                { $project: searchItem2 }
            ]);
            let tangLuong = 0;
            let giamLuong = 0;
            if (dataLuong.length !== 0) {
                for (let i = 0; i < dataLuong.length; i++) {
                    let element = dataLuong[i];
                    conditions = {};
                    conditions.sb_id_user = element.sb_id_user;
                    conditions.sb_time_up = { $lt: new Date(element.sb_time_up) }
                    checkTangGiam = await Salarys.findOne(conditions).sort({ sb_time_up: -1 }).lean()

                    if (checkTangGiam) {
                        if (type === 2) {
                            if (element.luongmoi > checkTangGiam.sb_salary_basic) {

                                tangLuong++;
                            }
                        } else if (type === 1) {
                            if (element.luongmoi < checkTangGiam.sb_salary_basic) {
                                giamLuong++;
                            }
                        } else if (!type) {
                            if (element.luongmoi > checkTangGiam.sb_salary_basic) {
                                tangLuong++;

                            } else if (element.luongmoi < checkTangGiam.sb_salary_basic) {
                                giamLuong++;
                            }
                        }
                    }
                }
            }
            let tangGiamLuong = 0;
            if (tangLuong !== 0) tangGiamLuong = tangLuong;
            if (giamLuong !== 0) tangGiamLuong = giamLuong;
            if (tangLuong !== 0 && giamLuong !== 0) tangGiamLuong = tangLuong + giamLuong;

            // logic đổi đầu ra cho winform
            let winform = Number(req.body.winform);
            if (winform === 1) {

                let arr = [];
                for (let i = 0; i < subData.length; i++) {
                    let obj = {};
                    const element = subData[i];
                    obj.sb_id_user = element.sb_id_user;
                    obj.sb_ep_name = element.userName;
                    obj.sb_organizeDetailId = element.organizeDetailId;
                    obj.sb_listOrganizeDetailId = element.listOrganizeDetailId;
                    obj.sb_organizeDetailName = element.organizeDetailName;
                    obj.sb_salary_basic = element.luongmoi;
                    obj.sb_time_up = await hr.getTime(element.sb_time_up);
                    obj.sb_quyetdinh = element.sb_quyetdinh;
                    obj.sb_tanggiam = element.luongmoi - element.luonghientai;
                    obj.salary_up = obj.sb_tanggiam > 0 ? obj.sb_tanggiam : 0;
                    obj.salary_down = obj.sb_tanggiam > 0 ? 0 : obj.sb_tanggiam;
                    obj.position_name = element.chucvu;
                    arr.push(obj);
                }
                return res.status(200).json({ status: true, message: "thành công", data: arr, totalRecord: tangGiamLuong })
            }
            return functions.success(res, 'get data success', { tongsoluong: tangGiamLuong, soluong, data: subData })
        } else if (link === 'bieu-do-danh-sach-nhan-vien-theo-do-tuoi.html') {
            let tuoi = 0;
            let list = [];
            conditions.type = { $ne: 1 };
            conditions['inForPerson.employee.com_id'] = comId;
            conditions['inForPerson.employee.ep_status'] = 'Active';
            if (gender) conditions['inForPerson.account.gender'] = gender;
            if (positionId) conditions['inForPerson.employee.position_id'] = positionId;
            if (organizeDetailId) conditions['inForPerson.employee.organizeDetailId'] = organizeDetailId;
            if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
            if (birthday) conditions['inForPerson.account.birthday'] = { $regex: `.*${birthday}*.` };
            if (married) conditions['inForPerson.account.married'] = married;

            if (seniority) conditions['inForPerson.account.experience'] = seniority;
            if (birthday) {
                var dauNam = new Date(birthday, 0, 1).getTime() / 1000;
                var cuoiNam = new Date(birthday, 11, 31).getTime() / 1000;
                conditions['inForPerson.account.birthday'] = {
                    $gt: dauNam,
                    $lt: cuoiNam
                };
            }

            let check = await Users.aggregate([
                { $match: conditions },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'organizeDetail'
                    }
                },
                { $unwind: { path: "$organizeDetail", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'QLC_Positions',
                        localField: 'inForPerson.employee.position_id',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'positions',

                    }
                },
                { $unwind: { path: "$positions", preserveNullAndEmptyArrays: true } },
                { $project: searchItem }

            ]);
            for (let i = 0; i < check.length; i++) {
                let element = check[i];
                let sinhnhat = new Date(element.birthday * 1000).getFullYear()
                let namhientai = new Date().getFullYear();
                tuoi = namhientai - sinhnhat;
                if (old === 1 && tuoi < 30) {
                    list.push(element)
                } else if (old === 2 && tuoi > 30 && tuoi < 44) {
                    list.push(element)
                } else if (old === 3 && tuoi > 45 && tuoi < 59) {
                    list.push(element)
                } else if (old === 4 && tuoi > 60) {
                    list.push(element)
                } else if (!old) {
                    list.push(element)
                }
            }
            let soluong = list.length
            let tongsoluong = await Users.aggregate([
                { $match: conditions },
                { $project: searchItem }
            ]);
            let listTotal = [];
            for (let i = 0; i < tongsoluong.length; i++) {
                let element = tongsoluong[i];
                let sinhnhat = new Date(element.birthday * 1000).getFullYear()
                let namhientai = new Date().getFullYear();
                tuoi = namhientai - sinhnhat;
                if (old === 1 && tuoi < 30) {
                    listTotal.push(element)
                } else if (old === 2 && tuoi > 30 && tuoi < 44) {
                    listTotal.push(element)
                } else if (old === 3 && tuoi > 45 && tuoi < 59) {
                    listTotal.push(element)
                } else if (old === 4 && tuoi > 60) {
                    listTotal.push(element)
                } else if (!old) {
                    listTotal.push(element)
                }
            }
            tongsoluong = listTotal.length
            return functions.success(res, 'get data success', { tongsoluong, soluong, data: list })
        } else if (link === 'bieu-do-danh-sach-nhan-vien-theo-tham-nien-cong-tac.html') {
            conditions.type = { $ne: 1 };
            conditions['inForPerson.employee.com_id'] = comId;
            conditions['inForPerson.employee.ep_status'] = 'Active';
            if (gender) conditions['inForPerson.account.gender'] = gender;
            if (positionId) conditions['inForPerson.employee.position_id'] = positionId;
            if (organizeDetailId) conditions['inForPerson.employee.organizeDetailId'] = organizeDetailId;
            if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
            if (birthday) conditions['inForPerson.account.birthday'] = { $regex: `.*${birthday}*.` };
            if (married) conditions['inForPerson.account.married'] = married;
            if (seniority) conditions['inForPerson.account.experience'] = seniority;
            if (birthday) {
                var dauNam = new Date(birthday, 1, 1).getTime() / 1000;
                var cuoiNam = new Date(birthday, 12, 31).getTime() / 1000;
                conditions['inForPerson.account.birthday'] = {
                    $gt: dauNam,
                    $lt: cuoiNam
                };
            }
            if (type === 1)
                conditions['inForPerson.employee.start_working_time'] = { $gt: new Date().getTime() / 1000 - 3 * 30 * 24 * 60 * 60 }
            if (type === 2)
                conditions['inForPerson.employee.start_working_time'] = {
                    $lte: new Date().getTime() / 1000 - 3 * 30 * 24 * 60 * 60,
                    $gt: new Date().getTime() / 1000 - 365 * 24 * 60 * 60
                }
            if (type === 3)
                conditions['inForPerson.employee.start_working_time'] = {
                    $lte: new Date().getTime() / 1000 - 365 * 24 * 60 * 60,
                    $gt: new Date().getTime() / 1000 - 3 * 365 * 24 * 60 * 60
                }
            if (type === 4)
                conditions['inForPerson.employee.start_working_time'] = {
                    $lte: new Date().getTime() / 1000 - 3 * 365 * 24 * 60 * 60,
                    $gt: new Date().getTime() / 1000 - 5 * 365 * 24 * 60 * 60
                }
            if (type === 5)
                conditions['inForPerson.employee.start_working_time'] = { $lte: new Date().getTime() / 1000 - 5 * 365 * 24 * 60 * 60 }


            let data = await Users.aggregate([
                { $match: conditions },
                { $skip: skip },
                { $limit: limit },

                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'organizeDetail'
                    }
                },
                { $unwind: { path: "$organizeDetail", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'QLC_Positions',
                        localField: 'inForPerson.employee.position_id',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'positions',

                    }
                },
                { $unwind: { path: "$positions", preserveNullAndEmptyArrays: true } },

                { $project: searchItem }

            ]);
            let datatotal = await Users.countDocuments(conditions);
            let soluong = data.length
            let tongsoluong = datatotal
            return functions.success(res, 'get data success', { tongsoluong, soluong, data })
        } else if (link === 'bieu-do-danh-sach-nhan-vien-theo-chuc-vu.html') {
            conditions.type = { $ne: 1 };
            conditions['inForPerson.employee.com_id'] = comId;
            conditions['inForPerson.employee.ep_status'] = 'Active';
            if (gender) conditions['inForPerson.account.gender'] = gender;
            if (positionId) conditions['inForPerson.employee.position_id'] = positionId;
            if (organizeDetailId) conditions['inForPerson.employee.organizeDetailId'] = organizeDetailId;
            if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
            if (birthday) conditions['inForPerson.account.birthday'] = { $regex: `.*${birthday}*.` };
            if (married) conditions['inForPerson.account.married'] = married;
            if (seniority) conditions['inForPerson.account.experience'] = seniority;
            if (birthday) {
                var dauNam = new Date(birthday, 1, 1).getTime() / 1000;
                var cuoiNam = new Date(birthday, 12, 31).getTime() / 1000;
                conditions['inForPerson.account.birthday'] = {
                    $gt: dauNam,
                    $lt: cuoiNam
                };
            }
            if (type === 1) conditions['inForPerson.employee.position_id'] = 1;
            if (type === 2) conditions['inForPerson.employee.position_id'] = 9;
            if (type === 3) conditions['inForPerson.employee.position_id'] = 2;
            if (type === 4) conditions['inForPerson.employee.position_id'] = 3;


            let data = await Users.aggregate([
                { $match: conditions },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'organizeDetail'
                    }
                },
                { $unwind: { path: "$organizeDetail", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'QLC_Positions',
                        localField: 'inForPerson.employee.position_id',
                        foreignField: 'id',
                        pipeline: [{ $match: { comId: comId } }],
                        as: 'positions',

                    }
                },
                { $unwind: { path: "$positions", preserveNullAndEmptyArrays: true } },

                { $project: searchItem }
            ]);

            let datatotal = await Users.aggregate([
                { $match: conditions },
                { $skip: skip },
                { $limit: limit }
            ]);
            let tongsoluong = datatotal.length
            let soluong = data.length
            return functions.success(res, 'get data success', { tongsoluong, soluong, data })
        }

    } catch (error) {
        console.log("🚀 ~ file: report.js:985 ~ exports.reportChart= ~ error:", error)
        return functions.setError(res, error.message)
    }
}

// biểu đồ báo cáo nhân sự
exports.reportChart = async(req, res, next) => {
    try {
        let comId = req.infoLogin.comId;

        const listOrganizeDetailId = req.body.listOrganizeDetailId
        if (listOrganizeDetailId)
            if (!Array.isArray(listOrganizeDetailId)) JSON.parse(listOrganizeDetailId)
        let from_date = req.body.from_date;
        let to_date = req.body.to_date;
        let type = Number(req.body.type) || 3;
        //Biểu đồ thống kê số nhân viên mới
        let chartEmployee = [];
        let chartDaketHon = [];
        let chartDocThan = [];
        let chartHocVanTrenDH = [];
        let chartHocVanDH = [];
        let chartHocVanCD = [];
        let chartHocVanTC = [];
        let chartHocVanNghe = [];
        let chartHocVanDuoiTHPT = [];
        let chartDuoi30tuoi = [];
        let chart30den44tuoi = [];
        let chart45den59tuoi = [];
        let chartTren60tuoi = [];
        let songay = hr.thoigian(from_date, to_date, type);
        conditions = {};
        conditions['inForPerson.employee.com_id'] = comId;
        conditions['inForPerson.employee.ep_status'] = "Active";
        if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
        for (let i = 0; i < songay; i++) {
            to_date ? to_date = new Date(to_date) : to_date = new Date();

            if (type === 3 && !from_date) from_date = new Date(to_date.getTime() - 15 * 24 * 60 * 60 * 1000)

            let from = 0;
            let to = 0;
            if (type === 3) {
                from = new Date(from_date).getTime() + i * 24 * 60 * 60 * 1000;
                to = from + 24 * 60 * 60 * 1000;
            } else if (type === 2) {
                from = new Date(from_date).getTime() + i * 30 * 24 * 60 * 60 * 1000;
                to = from + 30 * 24 * 60 * 60 * 1000;
            } else {
                from = new Date(from_date).getTime() + i * 365 * 24 * 60 * 60 * 1000;
                to = from + 365 * 24 * 60 * 60 * 1000;
            }

            conditions['inForPerson.employee.start_working_time'] = {
                    $gte: new Date(from).getTime() / 1000,
                    $lt: new Date(to).getTime() / 1000
                }
                // console.log(conditions)
            let datachart = await Users.aggregate([
                { $match: conditions },
                {
                    $project: {
                        inForPerson: 1
                    }
                }
            ]);
            chartEmployee.push(datachart.length)

            // Biểu đồ thống kê tình trạng hôn nhân
            let chartDaketHon1 = datachart.filter(item => item.inForPerson.account.married == 1)
            chartDaketHon.push(chartDaketHon1.length);

            // Biểu đồ thống kê tình trạng hôn nhân
            let chartDocThan1 = datachart.filter(item => item.inForPerson.account.married == 2)
            chartDocThan.push(chartDocThan1.length);

            // Biểu đồ thống kê tình độ học vấn

            let chartHocVanTrenDH1 = datachart.filter(item => item.inForPerson.account.education == 1)
            chartHocVanTrenDH.push(chartHocVanTrenDH1.length);


            let chartHocVanDH1 = datachart.filter(item => item.inForPerson.account.education == 2)
            chartHocVanDH.push(chartHocVanDH1.length);


            let chartHocVanCD1 = datachart.filter(item => item.inForPerson.account.education == 3)
            chartHocVanCD.push(chartHocVanCD1.length);


            let chartHocVanTC1 = datachart.filter(item => item.inForPerson.account.education == 4)
            chartHocVanTC.push(chartHocVanTC1.length);


            let chartHocVanNghe1 = datachart.filter(item => item.inForPerson.account.education == 5)
            chartHocVanNghe.push(chartHocVanNghe1.length);

            let chartHocVanDuoiTHPT1 = datachart.filter(item => item.inForPerson.account.education > 5)
            chartHocVanDuoiTHPT.push(chartHocVanDuoiTHPT1.length);

            //Biểu đồ thống kê độ tuổi
            let chartDuoi30tuoi1 = datachart.filter(item =>
                item.inForPerson.account.birthday >= new Date().getTime() / 1000 - 30 * 365 * 24 * 60 * 60)
            chartDuoi30tuoi.push(chartDuoi30tuoi1.length);

            let chart30den44tuoi1 = datachart.filter(item =>
                item.inForPerson.account.birthday <= new Date().getTime() / 1000 - 30 * 365 * 24 * 60 * 60 &&
                item.inForPerson.account.birthday >= new Date().getTime() / 1000 - 44 * 365 * 24 * 60 * 60)
            chart30den44tuoi.push(chart30den44tuoi1.length);

            let chart45den59tuoi1 = datachart.filter(item =>
                item.inForPerson.account.birthday <= new Date().getTime() / 1000 - 45 * 365 * 24 * 60 * 60 &&
                item.inForPerson.account.birthday >= new Date().getTime() / 1000 - 59 * 365 * 24 * 60 * 60)
            chart45den59tuoi.push(chart45den59tuoi1.length);

            let chartTren60tuoi1 = datachart.filter(item =>
                item.inForPerson.account.birthday <= new Date().getTime() / 1000 - 60 * 365 * 24 * 60 * 60)
            chartTren60tuoi.push(chartTren60tuoi1.length);
        }

        // Biểu đồ thống kê nhân viên nghỉ việc / giảm biên chế
        let chartNghiViec = [];
        let chartGiamBienChe = [];
        for (let i = 0; i < songay; i++) {
            to_date ? to_date = new Date(to_date) : to_date = new Date();
            if (type === 3 && !from_date) from_date = new Date(to_date.getTime() - 15 * 24 * 60 * 60 * 1000)
            let from = 0;
            let to = 0;
            if (type === 3) {
                from = new Date(from_date).getTime() + i * 24 * 60 * 60 * 1000;
                to = from + 24 * 60 * 60 * 1000;
            } else if (type === 2) {
                from = new Date(from_date).getTime() + i * 30 * 24 * 60 * 60 * 1000;
                to = from + 30 * 24 * 60 * 60 * 1000;
            } else {
                from = new Date(from_date).getTime() + i * 365 * 24 * 60 * 60 * 1000;
                to = from + 365 * 24 * 60 * 60 * 1000;
            }
            let datachart1 = await Resign.countDocuments({ created_at: { $gte: new Date(from), $lt: new Date(to) }, com_id: comId, type: 1 })
            let datachart2 = await Resign.countDocuments({ created_at: { $gte: new Date(from), $lt: new Date(to) }, com_id: comId, type: 2 })
            chartNghiViec.push(datachart2)
            chartGiamBienChe.push(datachart1)
        }

        //Biểu đồ thống kê bổ nhiệm, quy hoạch
        let chartBoNhiem = [];
        conditions = {};
        subConditions = {};
        if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
        conditions.type = { $ne: 1 }
        for (let i = 0; i < songay; i++) {
            to_date ? to_date = new Date(to_date) : to_date = new Date();
            if (type === 3 && !from_date) from_date = new Date(to_date.getTime() - 15 * 24 * 60 * 60 * 1000)
            let from = 0;
            let to = 0;
            if (type === 3) {
                from = new Date(from_date).getTime() + i * 24 * 60 * 60 * 1000;
                to = from + 24 * 60 * 60 * 1000;
            } else if (type === 2) {
                from = new Date(from_date).getTime() + i * 30 * 24 * 60 * 60 * 1000;
                to = from + 30 * 24 * 60 * 60 * 1000;
            } else {
                from = new Date(from_date).getTime() + i * 365 * 24 * 60 * 60 * 1000;
                to = from + 365 * 24 * 60 * 60 * 1000;
            }
            conditions['inForPerson.employee.com_id'] = comId;
            subConditions['Appoints.created_at'] = { $gte: new Date(from), $lt: new Date(to) }
            let data = await Users.aggregate([
                { $match: conditions },
                {
                    $lookup: {
                        from: 'HR_Appoints',
                        localField: 'idQLC',
                        foreignField: 'ep_id',
                        as: 'Appoints'
                    }
                },
                { $unwind: "$Appoints" },
                { $match: subConditions }
            ])
            chartBoNhiem.push(data.length)
        }
        // Biểu đồ thống kê tăng, giảm lương
        let chartTangGiamLuong = [];
        conditions = {};
        subConditions = {};
        for (let i = 0; i < songay; i++) {
            to_date ? to_date = new Date(to_date) : to_date = new Date();
            if (type === 3 && !from_date) from_date = new Date(to_date.getTime() - 15 * 24 * 60 * 60 * 1000)
            let from = 0;
            let to = 0;
            if (type === 3) {
                from = new Date(from_date).getTime() + i * 24 * 60 * 60 * 1000;
                to = from + 24 * 60 * 60 * 1000;
            } else if (type === 2) {
                from = new Date(from_date).getTime() + i * 30 * 24 * 60 * 60 * 1000;
                to = from + 30 * 24 * 60 * 60 * 1000;
            } else {
                from = new Date(from_date).getTime() + i * 365 * 24 * 60 * 60 * 1000;
                to = from + 365 * 24 * 60 * 60 * 1000;
            }

            let dataLuong = await Salarys.find({
                sb_id_com: comId,
                sb_first: { $ne: 1 },
                sb_time_up: {
                    $gte: new Date(from),
                    $lt: new Date(to)
                }
            }).sort({ sb_time_up: -1 });
            let tanggiam = 0;
            if (dataLuong.length !== 0) {
                for (let j = 0; j < dataLuong.length; j++) {
                    conditions.sb_id_user = dataLuong[j].sb_id_user;
                    conditions.sb_time_up = { $lt: dataLuong[j].sb_time_up }
                    checkTangGiam = await Salarys.findOne(conditions).sort({ sb_time_up: -1 }).lean()
                    if (checkTangGiam) {
                        if (dataLuong[j].sb_salary_basic != checkTangGiam.sb_salary_basic) {
                            tanggiam++;
                        }
                    }
                }
            }
            chartTangGiamLuong.push(tanggiam);

        }
        // ----------------------------------------------------------------------------------------------------------

        // Biểu đồ thống luân chuyển công tác
        let chartLuanChuyen = [];
        conditions = {};
        subConditions = {};
        if (listOrganizeDetailId) conditions['inForPerson.employee.listOrganizeDetailId'] = { $all: listOrganizeDetailId };
        subConditions.type = { $ne: 1 }
        for (let i = 0; i < songay; i++) {
            to_date ? to_date = new Date(to_date) : to_date = new Date();
            if (type === 3 && !from_date) from_date = new Date(to_date.getTime() - 15 * 24 * 60 * 60 * 1000)
            let from = 0;
            let to = 0;
            if (type === 3) {
                from = new Date(from_date).getTime() + i * 24 * 60 * 60 * 1000;
                to = from + 24 * 60 * 60 * 1000;
            } else if (type === 2) {
                from = new Date(from_date).getTime() + i * 30 * 24 * 60 * 60 * 1000;
                to = from + 30 * 24 * 60 * 60 * 1000;
            } else {
                from = new Date(from_date).getTime() + i * 365 * 24 * 60 * 60 * 1000;
                to = from + 365 * 24 * 60 * 60 * 1000;
            }
            conditions.created_at = { $gte: new Date(from), $lt: new Date(to) }
            conditions.com_id = comId;
            let data = await TranferJob.aggregate([
                { $match: conditions },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'ep_id',
                        foreignField: 'idQLC',
                        as: 'user'
                    }
                },
                { $unwind: "$user" },
                { $match: subConditions },
            ])

            chartLuanChuyen.push(data.length)
        }
        let data = {};
        data.chartEmployee = chartEmployee;
        data.chartNghiViec = chartNghiViec;
        data.chartGiamBienChe = chartGiamBienChe;
        data.chartBoNhiem = chartBoNhiem;
        data.chartLuanChuyen = chartLuanChuyen;
        // data.chartTangGiamLuong = arr;
        data.chartDaketHon = chartDaketHon;
        data.chartDocThan = chartDocThan;
        data.chartHocVanTrenDH = chartHocVanTrenDH;
        data.chartHocVanDH = chartHocVanDH;
        data.chartHocVanCD = chartHocVanCD;
        data.chartHocVanTC = chartHocVanTC;
        data.chartHocVanNghe = chartHocVanNghe;
        data.chartHocVanDuoiTHPT = chartHocVanDuoiTHPT;
        data.chartDuoi30tuoi = chartDuoi30tuoi;
        data.chart30den44tuoi = chart30den44tuoi;
        data.chart45den59tuoi = chart45den59tuoi;
        data.chartTren60tuoi = chartTren60tuoi;
        data.chartTangGiamLuong = chartTangGiamLuong;
        return functions.success(res, 'get data success', { data })
    } catch (error) {
        return functions.setError(res, error.message)
    }
}

// báo cáo tuyển dụng
exports.reportRecruitment = async(req, res, next) => {
    try {
        let comId = req.infoLogin.comId;
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        //  Tổng số tin
        let tongSoTinTuyenDung = await RecruitmentNews.countDocuments({ isDelete: 0, comId })

        // // Tổng số hồ sơ
        let tongSoHoSo = await Candidates.countDocuments({ isDelete: 0, comId }, { id: 1 })

        // Tổng số ứng viên cần tuyển
        let tongSoUngVienCanTuyen = await RecruitmentNews.aggregate([{
                    $match: { isDelete: 0, comId }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$number" }
                    }
                }
            ])
            // Số ứng viên đến phỏng vấn
        let tongSoUngVienDenPhongVan = await Candidates.aggregate([{
                    $match: { comId }
                },
                {
                    $lookup: {
                        from: 'HR_ScheduleInterviews',
                        localField: 'id',
                        foreignField: 'canId',
                        as: 'lichPv'
                    }
                },
                { $match: { 'lichPv.isSwitch': 0 } },
                { $count: 'SL' }
            ])
            // Số ứng viên qua phỏng vấn
        let tongSoUngVienQuaPhongVan = await Candidates.aggregate([{
                    $match: { comId }
                },
                {
                    $lookup: {
                        from: 'HR_GetJobs',
                        localField: 'id',
                        foreignField: 'canId',
                        as: 'getJob'
                    }
                },
                { $match: { 'getJob.isSwitch': 0 } },
                { $count: 'SL' }
            ])
            // Số ứng viên nhận việc, thử việc
        let tongSoUngVienHuyNhanViec = await Candidates.aggregate([{
                    $match: { comId, isDelete: 0 }
                },
                {
                    $lookup: {
                        from: 'HR_CancelJobs',
                        localField: 'id',
                        foreignField: 'canId',
                        as: 'CancelJobs'
                    }
                },
                { $match: { 'CancelJobs.isSwitch': 0 } },
                { $count: 'SL' }
            ])
            // Báo cáo chi tiết theo tin tuyển dụng
        let tongso1 = await RecruitmentNews.countDocuments({ comId });
        let query = await RecruitmentNews.find({ comId }).skip(skip).limit(limit);
        let mangThongTin = [];
        if (query.length !== 0) {
            for (let i = 0; i < query.length; i++) {
                let tongSoUngVien = await Candidates.countDocuments({ comId, recruitmentNewsId: query[i].id })
                let tongSoUngVienDenPhongVan = await Candidates.aggregate([{
                        $match: { comId, 'lichPv.isSwitch': 0, recruitmentNewsId: query[i].id }
                    },
                    {
                        $lookup: {
                            from: 'HR_ScheduleInterviews',
                            localField: 'id',
                            foreignField: 'canId',
                            as: 'lichPv'
                        }
                    },
                    { $match: { 'lichPv.isSwitch': 0 } },
                    { $count: 'SL' }
                ])
                let tongSoUngVienNhanViec = await Candidates.aggregate([{
                        $match: { comId, recruitmentNewsId: query[i].id }
                    },
                    {
                        $lookup: {
                            from: 'HR_GetJobs',
                            localField: 'id',
                            foreignField: 'canId',
                            as: 'getJob'
                        }
                    },
                    { $match: { 'getJob.isSwitch': 0 } },
                    { $count: 'SL' }
                ])
                let tongSoUngVienHuy = await Candidates.aggregate([{
                        $match: { comId, isDelete: 0, recruitmentNewsId: query[i].id }
                    },
                    {
                        $lookup: {
                            from: 'HR_CancelJobs',
                            localField: 'id',
                            foreignField: 'canId',
                            as: 'CancelJobs'
                        }
                    },
                    { $match: { 'CancelJobs.isSwitch': 0 } },
                    { $count: 'SL' }
                ])
                let thongTin = {};
                thongTin.id = query[i].id;
                thongTin.tongSoUngVien = tongSoUngVien;
                if (tongSoUngVienDenPhongVan.length !== 0) {
                    thongTin.tongSoUngVienDenPhongVan = tongSoUngVienDenPhongVan[0].SL;
                } else {
                    thongTin.tongSoUngVienDenPhongVan = 0
                }
                if (tongSoUngVienNhanViec.length !== 0) {
                    thongTin.tongSoUngVienNhanViec = tongSoUngVienNhanViec[0].SL;
                } else {
                    thongTin.tongSoUngVienNhanViec = 0
                }
                if (tongSoUngVienHuy.length !== 0) {
                    thongTin.tongSoUngVienHuy = tongSoUngVienHuy[0].SL;
                } else {
                    thongTin.tongSoUngVienHuy = 0
                }
                mangThongTin.push(thongTin)
            }
        }
        // Thống kê xếp hạng nhân viên tuyển dụng
        let tongso2 = await RecruitmentNews.countDocuments({ comId })
        let thongKeNhanVienTuyenDung = await RecruitmentNews.aggregate([
            { $match: { comId } },
            { $skip: skip },
            { $limit: limit },
            {
                $group: {
                    _id: "$hrName",
                    total: { $sum: 1 },
                }
            },
        ]);
        if (thongKeNhanVienTuyenDung.length !== 0) {
            for (let i = 0; i < thongKeNhanVienTuyenDung.length; i++) {
                let nameHr = await Users.findOne({ type: { $ne: 1 }, 'idQLC': thongKeNhanVienTuyenDung[i]._id }, { userName: 1 })
                if (nameHr)
                    thongKeNhanVienTuyenDung[i].nameHr = nameHr.userName;
            }
        }

        //Báo cáo chi tiết theo nhân viên giới thiệu ứng viên và tiền thưởng trực tiếp
        let gioiThieuUngVien = await Candidates.aggregate([
            { $match: { comId } },
            { $skip: skip },
            { $limit: limit },
            {
                $group: {
                    _id: "$userRecommend",
                    total: { $sum: 1 },
                }
            },
        ]);
        let tongso3 = await Candidates.countDocuments({ comId })
        if (gioiThieuUngVien.length !== 0) {
            for (let i = 0; i < gioiThieuUngVien.length; i++) {
                let nameHr = await Users.findOne({ type: { $ne: 1 }, 'idQLC': gioiThieuUngVien[i]._id }, { userName: 1 })
                if (nameHr)
                    gioiThieuUngVien[i].nameHr = nameHr.userName;

            }
        }
        let data = {};
        let total_new = tongSoTinTuyenDung;
        let total_candidate = tongSoHoSo;
        let total_interview = 0;
        let total_interview_pass = 0;
        let total_cancel = 0;
        let total_candidate_number = 0;

        tongSoUngVienCanTuyen.length !== 0 ? total_candidate_number = tongSoUngVienCanTuyen[0].total : total_candidate_number = 0
        tongSoUngVienDenPhongVan.length !== 0 ? total_interview = tongSoUngVienDenPhongVan[0].SL : total_interview = 0
        tongSoUngVienQuaPhongVan.length !== 0 ? total_interview_pass = tongSoUngVienQuaPhongVan[0].SL : total_interview_pass = 0
        tongSoUngVienHuyNhanViec.length !== 0 ? total_cancel = tongSoUngVienHuyNhanViec[0].SL : total_cancel = 0

        data.mangThongTin = mangThongTin;
        data.thongKeNhanVienTuyenDung = thongKeNhanVienTuyenDung;
        data.gioiThieuUngVien = gioiThieuUngVien;
        return hr.success(res, 'get data success', { total_new, total_candidate, total_interview, total_interview_pass, total_cancel, total_candidate_number })
    } catch (error) {
        return hr.setError(res, error.message)
    }
}

// Báo cáo thống kê theo nhân viên tuyển dụng
exports.reportHr = async(req, res, next) => {
    try {
        let comId = req.infoLogin.comId;
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        let total = await RecruitmentNews.aggregate([
            { $match: { comId } },
            {
                $group: {
                    _id: "$hrName",
                    total: { $sum: 1 },
                }
            },
        ]);
        total = total.length;
        let thongKeNhanVienTuyenDung = await RecruitmentNews.aggregate([
            { $match: { comId } },
            {
                $group: {
                    _id: "$hrName",
                    sotintheodoi: { $sum: 1 },
                }
            },
            { $skip: skip },
            { $limit: limit },
        ]);
        if (thongKeNhanVienTuyenDung.length !== 0) {
            for (let i = 0; i < thongKeNhanVienTuyenDung.length; i++) {
                let nameHr = await Users.findOne({ type: { $ne: 1 }, 'idQLC': thongKeNhanVienTuyenDung[i]._id }, { userName: 1 })
                if (nameHr)
                    thongKeNhanVienTuyenDung[i].hr_name = nameHr.userName;
            }
        }
        return hr.success(res, 'get data success', { total, data: thongKeNhanVienTuyenDung })
    } catch (error) {
        console.log("🚀 ~ file: report.js:1742 ~ exports.reportHr= ~ error:", error)
        return hr.setError(res, error.message)
    }
}

// Báo cáo chi tiết theo tin tuyển dụng
exports.reportDetailRecruitment = async(req, res, next) => {
    try {
        let comId = req.infoLogin.comId;
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        let total = await RecruitmentNews.countDocuments({ comId });
        let query = await RecruitmentNews.find({ comId }).skip(skip).limit(limit).lean();
        let mangThongTin = [];
        if (query.length !== 0) {
            for (let i = 0; i < query.length; i++) {
                let tongSoUngVien = await Candidates.countDocuments({ comId, recruitmentNewsId: query[i].id })
                let tongSoUngVienDenPhongVan = await Candidates.aggregate([{
                        $match: { comId, recruitmentNewsId: query[i].id }
                    },
                    {
                        $lookup: {
                            from: 'HR_ScheduleInterviews',
                            localField: 'id',
                            foreignField: 'canId',
                            as: 'lichPv'
                        }
                    },
                    { $match: { 'lichPv.isSwitch': 0 } },
                    { $count: 'SL' }
                ]);
                let tongSoUngVienNhanViec = await Candidates.aggregate([{
                        $match: { comId, recruitmentNewsId: query[i].id }
                    },
                    {
                        $lookup: {
                            from: 'HR_GetJobs',
                            localField: 'id',
                            foreignField: 'canId',
                            as: 'getJob'
                        }
                    },
                    { $match: { 'getJob.isSwitch': 0 } },
                    { $count: 'SL' }
                ]);
                let tongSoUngVienHuy = await Candidates.aggregate([{
                        $match: { comId, isDelete: 0, recruitmentNewsId: query[i].id }
                    },
                    {
                        $lookup: {
                            from: 'HR_CancelJobs',
                            localField: 'id',
                            foreignField: 'canId',
                            as: 'CancelJobs'
                        }
                    },
                    { $match: { 'CancelJobs.isSwitch': 0 } },
                    { $count: 'SL' }
                ]);
                let thongTin = {};
                let element = query[i];

                thongTin.id = element.id;
                thongTin.title = element.title;
                thongTin.cit_id = element.cityId;
                thongTin.address = element.address;
                thongTin.salary_id = element.salaryId;
                thongTin.recruitment_time = await hr.getDate(element.timeStart);
                thongTin.recruitment_time_to = await hr.getDate(element.timeEnd);
                thongTin.woking_form = element.wokingForm;
                thongTin.hr_name = element.hrName;
                let check_name = await User.findOne({ idQLC: element.hrName, type: { $ne: 1 } }, { userName: 1 }).lean();
                if (check_name) thongTin.hr_name_full = check_name.userName;
                thongTin.sohoso = tongSoUngVien;
                thongTin.henphongvan = tongSoUngVienDenPhongVan.length !== 0 ? tongSoUngVienDenPhongVan[0].SL : 0;
                thongTin.quaphongvan = tongSoUngVienNhanViec.length !== 0 ? tongSoUngVienNhanViec[0].SL : 0;
                thongTin.huyphongvan = tongSoUngVienHuy.length !== 0 ? tongSoUngVienHuy[0].SL : 0;
                mangThongTin.push(thongTin)
            }
        }
        return hr.success(res, 'get data success', { total, data: mangThongTin })
    } catch (error) {
        console.log("🚀 ~ file: report.js:1742 ~ exports.reportHr= ~ error:", error)
        return hr.setError(res, error.message)
    }
};

//Báo cáo chi tiết theo nhân viên giới thiệu ứng viên và tiền thưởng trực tiếp
exports.reportDetailHRAndAchievements = async(req, res, next) => {
    try {
        let comId = req.infoLogin.comId;
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let skip = (page - 1) * pageSize;
        let limit = pageSize;

        let gioiThieuUngVien = await Candidates.aggregate([
            { $match: { comId } },
            {
                $group: {
                    _id: "$userRecommend",
                    soungvien: { $sum: 1 },
                }
            },
            { $skip: skip },
            { $limit: limit },
        ]);
        let total = await Candidates.aggregate([
            { $match: { comId } },
            {
                $group: {
                    _id: "$userRecommend",
                    soungvien: { $sum: 1 },
                }
            },
        ]);
        total = total.length;
        if (gioiThieuUngVien.length !== 0) {
            for (let i = 0; i < gioiThieuUngVien.length; i++) {
                let nameHr = await Users.findOne({ type: { $ne: 1 }, 'idQLC': gioiThieuUngVien[i]._id }, { userName: 1 }).lean();
                if (nameHr) gioiThieuUngVien[i].hr_name_full = nameHr.userName;
                gioiThieuUngVien[i].user_recommend = gioiThieuUngVien[i]._id
                delete gioiThieuUngVien[i]._id;
            }
        }

        return hr.success(res, 'get data success', { total, data: gioiThieuUngVien })
    } catch (error) {
        console.log("🚀 ~ file: report.js:1742 ~ exports.reportHr= ~ error:", error)
        return hr.setError(res, error.message)
    }
};