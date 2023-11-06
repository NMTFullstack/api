const functions = require('../../services/functions');
const hrFunctions = require('../../services/hr/hrService');
const HR_DepartmentDetails = require('../../models/hr/DepartmentDetails');
const axios = require('axios');
const https = require('https');
const Users = require('../../models/Users');
const Deparment = require("../../models/qlc/Deparment")
const Group = require('../../models/qlc/Group');
const Team = require('../../models/qlc/Team');
const HR_NestDetails = require('../../models/hr/NestDetail');
const Tracking = require('../../models/qlc/TimeSheets');
const HR_DescPositions = require('../../models/hr/DescPositions');
const HR_SignatureImages = require('../../models/hr/SignatureImage');
const HR_InfoLeaders = require('../../models/hr/InfoLeaders');
const PositionStruct = require('../../models/hr/PositionStructs');
const LeaderAvatar = require('../../models/hr/LeaderAvatar');
const DeXuat = require('../../models/Vanthu/de_xuat');
const Shift = require('../../models/qlc/Shifts');
const CC365_TimeSheet = require('../../models/qlc/TimeSheets')
const CalendarWorkEmployee = require('../../models/qlc/CalendarWorkEmployee')
const CC365_Cycle = require('../../models/qlc/Cycle');
const Shifts = require('../../models/qlc/Shifts');
const positionNames = {
    19: 'Chủ tịch hội đồng quản trị',
    18: 'Phó chủ tịch hội đồng quản trị',
    17: 'Thành viên hội đồng quản trị',
    21: 'Tổng giám đốc tập đoàn',
    22: 'Phó tổng giám đốc tập đoàn',
    16: 'Tổng giám đốc',
    14: 'Phó tổng giám đốc',
    8: 'Giám đốc',
    7: 'Phó giám đốc',
    6: 'Trưởng phòng',
    5: 'Phó trưởng phòng',
    13: 'Tổ trưởng',
    12: 'Phó tổ trưởng',
    4: 'Trưởng nhóm',
    20: 'Nhóm Phó',
    11: 'Trưởng ban dự án',
    10: 'Phó ban dự án',
    3: 'Nhân viên chính thức',
    2: 'Nhân viên thử việc',
    9: 'Nhân viên Part time',
    1: 'Sinh viên thực tập'
};

let totalDD = async(res, condition) => {
    try {
        let empDD = await Users.aggregate([
            { $match: condition },
            {
                $lookup: {
                    from: "QLC_Time_sheets",
                    localField: "idQLC",
                    foreignField: "ep_id",
                    as: "Time_sheets"
                }
            },
            { $project: { Time_sheets: 1 } },
        ]);
        return empDD.length;
    } catch (e) {
        return functions.setError(res, e.message);
    }

}

//cơ cấu tổ chức công ty, công ty con và phòng ban
exports.detailInfoCompany = async(req, res, next) => {
    try {
        if (req.infoLogin) {
            // let com_id = req.infoLogin.comId
            // hiện đang ko dùng token để test, vì model user chưa có dữ liệu hoàn chỉnh
            let com_id = Number(req.infoLogin.comId);
            let shiftID = req.body.shiftID
            let CreateAt = req.body.CreateAt || true
            let inputNew = req.body.inputNew
            let inputOld = req.body.inputOld
            let result = {}
                //thông tin công ty cha
            result.infoCompany = {}
            let infoCompany = await Users.findOne({ idQLC: com_id, type: 1 }, { userName: 1 }).lean();
            if (infoCompany) {
                result.infoCompany.parent_com_id = com_id
                result.infoCompany.companyName = infoCompany.userName
                const listEmployee = await Users.find({ type: 2, "inForPerson.employee.com_id": com_id, 'inForPerson.employee.ep_status': 'Active' }, {
                    userName: 1,
                    idQLC: 1,
                    inForPerson: {
                        employee: {
                            com_id: 1,
                            position_id: 1,
                            dep_id: 1,
                            group_id: 1,
                            team_id: 1,
                        }
                    }
                }).lean();
                // const listEmpDD = await Tracking.find({ com_id: com_id }).lean();
                let listGiamDoc = listEmployee.filter(employee => {
                    if (
                        employee.inForPerson &&
                        employee.inForPerson.employee &&
                        employee.inForPerson.employee.position_id === 8
                    ) return true;
                    return false;
                });
                let listPhoGiamDoc = listEmployee.filter(employee => {
                    if (
                        employee.inForPerson &&
                        employee.inForPerson.employee &&
                        employee.inForPerson.employee.position_id === 7
                    ) return true;
                    return false;
                });

                let condition_sheet_total = {
                    ts_com_id: com_id,
                    is_success: 1,
                };
                let condition = {};
                let time = new Date();
                let year = time.getFullYear();
                let month = time.getMonth();
                let day = time.getDate();
                let today = new Date().toISOString().slice(0, 10);

                // Xử lý lấy nhân viên chấm công

                const qr_sheet_total = await hrFunctions.listEmployeeTimekeepers(com_id);
                let arr = [];
                qr_sheet_total.map(item => arr.push(item.ep_id));
                condition.idQLC = { $in: arr }
                condition.type = 2

                let countEmpDD = arr.length;
                result.infoCompany.parent_manager = listGiamDoc;
                result.infoCompany.parent_deputy = listPhoGiamDoc;
                result.infoCompany.tong_nv = listEmployee.length;
                result.infoCompany.tong_nv_da_diem_danh = countEmpDD

                //thông tin phòng ban cha
                let infoDepParent = await Deparment.find({ com_id: com_id }).lean();

                let listIdDepartment = [];
                for (let i = 0; i < infoDepParent.length; i++) {
                    listIdDepartment.push(infoDepParent[i].dep_id)
                };

                let list_infoTruongphong = await Users.find({
                    type: 2,
                    "inForPerson.employee.position_id": { $in: [5, 6] },
                    "inForPerson.employee.com_id": com_id,
                    "inForPerson.employee.dep_id": { $in: listIdDepartment },
                }, { inForPerson: 1, userName: 1, idQLC: 1 }).lean();

                let list_depInfo = await HR_DepartmentDetails.find({
                    comId: com_id,
                    depId: { $in: listIdDepartment }
                }).lean();

                // danh sách nhân viên trong công ty 
                let listUserInCom = await Users.find({
                    type: 2,
                    "inForPerson.employee.com_id": com_id,
                }, { type: 1, inForPerson: 1 }).lean();


                // dữ liệu team 
                let list_infoTeamParent = await Team.find({ com_id: com_id }).lean();

                // dữ liệu team mo ta 
                let list_infoTeamMota = await HR_NestDetails.find({ type: 0, comId: com_id }).lean()

                if (infoDepParent) {
                    result.infoCompany.infoDep = [];

                    for (let i = 0; i < infoDepParent.length; i++) {
                        let infoDep = { manager: [] };
                        infoDep.dep_id = infoDepParent[i].dep_id
                        infoDep.dep_name = infoDepParent[i].dep_name
                        let dep_id = infoDepParent[i].dep_id;
                        let infoTruongphong = list_infoTruongphong.find((e) =>
                            (e.dep_id == infoDepParent[i].dep_id) &&
                            (e.inForPerson.employee.position_id == 6)
                        )
                        if (infoTruongphong) {
                            infoDep.manager = infoTruongphong.userName
                        } else infoDep.manager = "chưa cập nhât"

                        let infoPhophong = list_infoTruongphong.find((e) =>
                            (e.dep_id == infoDepParent[i].dep_id) &&
                            (e.inForPerson.employee.position_id == 5)
                        )
                        if (infoPhophong) {
                            infoDep.deputy = infoPhophong.userName
                        } else infoDep.deputy = "chưa cập nhât"

                        let depInfo = list_depInfo.find((e) => e.depId == infoDepParent[i].dep_id);

                        if (depInfo && depInfo.description != null) {
                            infoDep.description = depInfo.description
                        } else infoDep.description = "chưa cập nhật"

                        let countEmpDep = listUserInCom.filter((e) => e.inForPerson.employee.dep_id == infoDepParent[i].dep_id).length;
                        infoDep.total_emp = countEmpDep;

                        const conditionDD = {
                            type: 2,
                            "inForPerson.employee.com_id": com_id,
                        }
                        let conditionDep = {...conditionDD, "inForPerson.employee.dep_id": infoDepParent[i].dep_id };

                        infoDep.tong_nv_da_diem_danh = qr_sheet_total.filter((e) => e.inForPerson.employee.dep_id == infoDepParent[i].dep_id).length;
                        result.infoCompany.infoDep.push(infoDep)

                        //thông tin tổ công ty cha
                        //let infoTeamParent = await Team.find({ dep_id: infoDepParent[i].dep_id }, { team_id: 1, teamName: 1 }).lean();
                        let infoTeamParent = list_infoTeamParent.filter((e) => e.dep_id == infoDepParent[i].dep_id);
                        result.infoCompany.infoDep[i].infoTeam = [];
                        for (let j = 0; j < infoTeamParent.length; j++) {
                            //let infoTeamMota = await HR_NestDetails.findOne({ grId: infoTeamParent[j].team_id, type: 0, comId: com_id }, { description: 1 }).lean()
                            let infoTeamMota = list_infoTeamMota.find((e) => e.grId == infoTeamParent[j].team_id);
                            infoTeam = {}
                            infoTeam.gr_id = infoTeamParent[j].team_id;
                            infoTeam.gr_name = infoTeamParent[j].team_name;
                            if (infoTeamMota && infoTeamMota.description != null) {
                                infoTeam.description = infoTeamMota.description
                            } else infoTeam.description = "chưa cập nhật"
                            let infoToTruong = await Users.findOne({
                                type: 2,
                                "inForPerson.employee.com_id": com_id,
                                "inForPerson.employee.dep_id": infoDepParent[i].dep_id,
                                "inForPerson.employee.position_id": 13,
                                "inForPerson.employee.team_id": infoTeamParent[j].team_id
                            }, { userName: 1 }).lean()
                            if (infoToTruong) {
                                infoTeam.to_truong = infoToTruong.userName
                            } else infoTeam.to_truong = "chưa cập nhật"

                            let infoPhoToTruong = await Users.findOne({
                                type: 2,
                                "inForPerson.employee.com_id": com_id,
                                "inForPerson.employee.dep_id": infoDepParent[i].dep_id,
                                "inForPerson.employee.position_id": 12,
                                "inForPerson.employee.team_id": infoTeamParent[j].team_id
                            }, { userName: 1 }).lean()
                            if (infoPhoToTruong) {
                                infoTeam.pho_to_truong = infoPhoToTruong.userName
                            } else infoTeam.pho_to_truong = "chưa cập nhật"

                            let countEmpTeam = await Users.countDocuments({
                                type: 2,
                                "inForPerson.employee.com_id": com_id,
                                "inForPerson.employee.dep_id": infoDepParent[i].dep_id,
                                "inForPerson.employee.team_id": infoTeamParent[j].team_id
                            })
                            infoTeam.tong_nv = countEmpTeam

                            let conditionTeam = {...condition, ...conditionDep, "inForPerson.employee.team_id": infoTeamParent[j].team_id };

                            infoTeam.tong_nv_da_diem_danh = await totalDD(res, conditionTeam);
                            result.infoCompany.infoDep[i].infoTeam.push(infoTeam)

                            //thông tin nhóm công ty cha
                            let infoGroupParent = await Group.find({ team_id: infoTeamParent[j].team_id, dep_id: infoDepParent[i].dep_id }, { gr_id: 1, gr_name: 1 }).lean()

                            result.infoCompany.infoDep[i].infoTeam[j].infoGroup = []
                            for (let k = 0; k < infoGroupParent.length; k++) {
                                let infoGroupMota = await HR_NestDetails.findOne({ grId: infoGroupParent[k].gr_id, type: 1, comId: com_id }, { description: 1 }).lean();
                                infoGroup = {}
                                infoGroup.gr_id = infoGroupParent[k].gr_id
                                infoGroup.gr_name = infoGroupParent[k].gr_name
                                if (infoGroupMota && infoGroupMota.description != null) {
                                    infoGroup.description = infoGroupMota.description
                                } else infoGroup.description = "chưa cập nhật"
                                let infoNhomTruong = await Users.findOne({
                                    type: 2,
                                    "inForPerson.employee.com_id": com_id,
                                    "inForPerson.employee.dep_id": infoDepParent[i].dep_id,
                                    "inForPerson.employee.position_id": 4,
                                    "inForPerson.employee.team_id": infoTeamParent[j].team_id,
                                    "inForPerson.employee.group_id": infoGroupParent[k].gr_id
                                }, { userName: 1 }).lean();
                                if (infoNhomTruong) {
                                    infoGroup.truong_nhom = infoNhomTruong.userName
                                } else infoGroup.truong_nhom = "chưa cập nhật"

                                let infoPhoNhomTruong = await Users.findOne({
                                    type: 2,
                                    "inForPerson.employee.com_id": com_id,
                                    "inForPerson.employee.dep_id": infoDepParent[i].dep_id,
                                    "inForPerson.employee.position_id": 20,
                                    "inForPerson.employee.team_id": infoTeamParent[j].team_id,
                                    "inForPerson.employee.group_id": infoGroupParent[k].gr_id
                                }, { userName: 1 })
                                if (infoPhoNhomTruong) {
                                    infoGroup.pho_truong_nhom = infoPhoNhomTruong.userName
                                } else infoGroup.pho_truong_nhom = "chưa cập nhật"

                                let countEmpGroup = await Users.countDocuments({
                                    type: 2,
                                    "inForPerson.employee.com_id": com_id,
                                    "inForPerson.employee.dep_id": infoDepParent[i].dep_id,
                                    "inForPerson.employee.team_id": infoTeamParent[j].team_id,
                                    "inForPerson.employee.group_id": infoGroupParent[k].gr_id
                                })
                                infoGroup.group_tong_nv = countEmpGroup
                                let conditionGroup = {...condition, ...conditionTeam, "inForPerson.employee.group_id": infoGroupParent[k].gr_id };
                                infoGroup.tong_nv_da_diem_danh = await totalDD(res, conditionGroup);
                                result.infoCompany.infoDep[i].infoTeam[j].infoGroup.push(infoGroup)

                            }
                        }
                    }
                }

                //thông tin công ty con
                let infoChildCompany = await Users.find({
                    type: 1,
                    "inForCompany.cds.com_parent_id": com_id
                }, { _id: 1, idQLC: 1, userName: 1 })

                if (infoChildCompany) {
                    result.infoCompany.infoChildCompany = []
                    for (let i = 0; i < infoChildCompany.length; i++) {
                        let infochild = {}
                        infochild.com_id = infoChildCompany[i].idQLC
                        let countChildEmp = await Users.countDocuments({
                            type: 2,
                            "inForPerson.employee.com_id": infoChildCompany[i].idQLC
                        })
                        infochild.com_name = infoChildCompany[i].userName
                        infochild.tong_nv = countChildEmp
                        let comId_child = infoChildCompany[i].idQLC;

                        let condition2 = {};
                        let condition = {};

                        const qr_sheet_total = await hrFunctions.listEmployeeTimekeepers(comId_child);
                        let arr = [];
                        qr_sheet_total.map(item => arr.push(item.ep_id));


                        condition.idQLC = { $in: arr }
                        condition.type = 2


                        infochild.tong_nv_da_diem_danh = arr.length

                        let infoChildGiamDoc = await Users.findOne({
                            type: 2,
                            "inForPerson.employee.com_id": infoChildCompany[i].idQLC,
                            "inForPerson.employee.position_id": 8
                        }, { userName: 1 })
                        let infoChildPhoGiamDoc = await Users.findOne({
                            type: 2,
                            "inForPerson.employee.com_id": infoChildCompany[i].idQLC,
                            "inForPerson.employee.position_id": 7
                        }, { userName: 1 })

                        if (infoChildGiamDoc) {
                            infochild.manager = infoChildGiamDoc.userName
                        } else infochild.manager = "Chưa cập nhật"
                        if (infoChildPhoGiamDoc) {
                            infochild.deputy = infoChildPhoGiamDoc.userName
                        } else infochild.deputy = "Chưa cập nhật"
                        result.infoCompany.infoChildCompany.push(infochild)

                        //thông tin phòng ban con
                        let infoDepChild = await Deparment.find({ com_id: infoChildCompany[i].idQLC })
                        if (infoDepChild) {
                            result.infoCompany.infoChildCompany[i].infoDep = []

                            for (let j = 0; j < infoDepChild.length; j++) {
                                let infoDep = {}
                                infoDep.dep_id = infoDepChild[j].dep_id
                                infoDep.dep_name = infoDepChild[j].dep_name
                                let infoTruongphong = await Users.findOne({
                                    type: 2,
                                    "inForPerson.employee.com_id": infoChildCompany[i].idQLC,
                                    "inForPerson.employee.dep_id": infoDepChild[j].dep_id,
                                    "inForPerson.employee.position_id": 6
                                }, { userName: 1 })

                                if (infoTruongphong) {
                                    infoDep.manager = infoTruongphong.userName
                                } else infoDep.manager = "chưa cập nhât"

                                let infoPhophong = await Users.findOne({
                                    type: 2,
                                    "inForPerson.employee.com_id": infoChildCompany[i].idQLC,
                                    "inForPerson.employee.dep_id": infoDepChild[j].dep_id,
                                    "inForPerson.employee.position_id": 5
                                }, { userName: 1 })

                                if (infoPhophong) {
                                    infoDep.deputy = infoPhophong.userName
                                } else infoDep.deputy = "chưa cập nhât"

                                let depInfo = await HR_DepartmentDetails.findOne({ comId: infoChildCompany[i].idQLC, depId: infoDepChild[j].dep_id })

                                if (depInfo && depInfo.description != null) {
                                    infoDep.description = depInfo.description

                                } else infoDep.description = "chưa cập nhật"

                                let countEmp = await Users.countDocuments({
                                    type: 2,
                                    "inForPerson.employee.com_id": infoChildCompany[i].idQLC,
                                    "inForPerson.employee.dep_id": infoDepChild[j].dep_id
                                })
                                infoDep.tong_nv = countEmp
                                const conditionDD2 = {
                                    type: 2,
                                    "inForPerson.employee.com_id": comId_child,
                                }
                                let conditionDep_child = {...condition, ...conditionDD2, "inForPerson.employee.dep_id": infoDepChild[j].dep_id };
                                infoDep.tong_nv_da_diem_danh = await totalDD(res, conditionDep_child);
                                result.infoCompany.infoChildCompany[i].infoDep.push(infoDep)

                                //thông tin tổ công ty con
                                let infoTeamChild = await Team.find({ dep_id: infoDepChild[j].dep_id });
                                result.infoCompany.infoChildCompany[i].infoDep[j].infoTeam = []
                                for (let k = 0; k < infoTeamChild.length; k++) {
                                    let infoTeamMota = await HR_NestDetails.findOne({
                                        grId: infoTeamChild[k].team_id,
                                        type: 0,
                                        comId: infoChildCompany[i].idQLC
                                    }, { description: 1 })
                                    infoTeam = {}
                                    infoTeam.gr_id = infoTeamChild[k].team_id
                                    infoTeam.gr_name = infoTeamChild[k].team_name
                                    if (infoTeamMota && infoTeamMota.description != null) {
                                        infoTeam.description = infoTeamMota.description
                                    } else infoTeam.description = "chưa cập nhật"

                                    let infoToTruong = await Users.findOne({
                                        type: 2,
                                        "inForPerson.employee.com_id": infoChildCompany[i].idQLC,
                                        "inForPerson.employee.dep_id": infoDepChild[j].dep_id,
                                        "inForPerson.employee.position_id": 13,
                                        "inForPerson.employee.team_id": infoTeamChild[k].team_id
                                    }, { userName: 1 })
                                    if (infoToTruong) {
                                        infoTeam.to_truong = infoToTruong.userName
                                    } else infoTeam.to_truong = "chưa cập nhật"

                                    let infoPhoToTruong = await Users.findOne({
                                        type: 2,
                                        "inForPerson.employee.com_id": infoChildCompany[i].idQLC,
                                        "inForPerson.employee.dep_id": infoDepChild[j].dep_id,
                                        "inForPerson.employee.position_id": 12,
                                        "inForPerson.employee.team_id": infoTeamChild[k].team_id
                                    }, { userName: 1 })
                                    if (infoPhoToTruong) {
                                        infoTeam.pho_to_truong = infoPhoToTruong.userName
                                    } else infoTeam.pho_to_truong = "chưa cập nhật"

                                    let countEmpTeam = await Users.countDocuments({
                                        type: 2,
                                        "inForPerson.employee.com_id": infoChildCompany[i].idQLC,
                                        "inForPerson.employee.dep_id": infoDepChild[j].dep_id,
                                        "inForPerson.employee.team_id": infoTeamChild[k].team_id
                                    })
                                    infoTeam.tong_nv = countEmpTeam

                                    let conditionTeam_child = {...condition, ...conditionDep_child, "inForPerson.employee.team_id": infoTeamChild[k].team_id };
                                    infoTeam.tong_nv_da_diem_danh = await totalDD(res, conditionTeam_child);

                                    result.infoCompany.infoChildCompany[i].infoDep[j].infoTeam.push(infoTeam)

                                    //thông tin nhóm công ty con
                                    let infoGroupChild = await Group.find({ team_id: infoTeamChild[k].team_id, dep_id: infoDepChild[j].dep_id })
                                    result.infoCompany.infoChildCompany[i].infoDep[j].infoTeam[k].infoGroup = []
                                    for (let l = 0; l < infoGroupChild.length; l++) {
                                        let infoGroupMota = await HR_NestDetails.findOne({ grId: infoGroupChild[k].gr_id, type: 1, comId: infoChildCompany[i].idQLC }, { description: 1 })
                                        infoGroup = {}
                                        infoGroup.gr_id = infoGroupChild[l].gr_id
                                        infoGroup.gr_name = infoGroupChild[l].gr_name
                                        if (infoGroupMota && infoGroupMota.description != null) {
                                            infoGroup.description = infoGroupMota.description
                                        } else infoGroup.description = "chưa cập nhật"
                                        let infoNhomTruong = await Users.findOne({
                                            type: 2,
                                            "inForPerson.employee.com_id": infoChildCompany[i].idQLC,
                                            "inForPerson.employee.dep_id": infoDepChild[j].dep_id,
                                            "inForPerson.employee.position_id": 4,
                                            "inForPerson.employee.team_id": infoTeamChild[k].team_id,
                                            "inForPerson.employee.group_id": infoGroupChild[l].gr_id
                                        }, { userName: 1 })
                                        if (infoNhomTruong) {
                                            infoGroup.truong_nhom = infoNhomTruong.userName
                                        } else infoGroup.truong_nhom = "chưa cập nhật"

                                        let infoPhoNhomTruong = await Users.findOne({
                                            type: 2,
                                            "inForPerson.employee.com_id": infoChildCompany[i].idQLC,
                                            "inForPerson.employee.dep_id": infoDepChild[j].dep_id,
                                            "inForPerson.employee.position_id": 20,
                                            "inForPerson.employee.team_id": infoTeamChild[k].team_id,
                                            "inForPerson.employee.group_id": infoGroupChild[l].gr_id
                                        }, { userName: 1 })
                                        if (infoPhoNhomTruong) {
                                            infoGroup.pho_truong_nhom = infoPhoNhomTruong.userName
                                        } else infoGroup.pho_truong_nhom = "chưa cập nhật"

                                        let countEmpGroup = await Users.countDocuments({
                                            type: 2,
                                            "inForPerson.employee.com_id": infoChildCompany[i].idQLC,
                                            "inForPerson.employee.dep_id": infoDepChild[j].dep_id,
                                            "inForPerson.employee.team_id": infoTeamChild[k].team_id,
                                            "inForPerson.employee.group_id": infoGroupChild[l].gr_id
                                        })
                                        infoGroup.group_tong_nv = countEmpGroup

                                        let conditionGroup_child = {...condition, ...conditionTeam_child, "inForPerson.employee.group_id": infoGroupChild[l].gr_id };
                                        infoGroup.tong_nv_da_diem_danh = await totalDD(res, conditionGroup_child);

                                        result.infoCompany.infoChildCompany[i].infoDep[j].infoTeam[k].infoGroup.push(infoGroup)
                                    }
                                }
                            }
                        }
                    }
                }
            } else return functions.setError(res, "không tìm thấy công ty này", 400);

            return functions.success(res, 'Lấy chi tiết công ty thành công', result);
        } else return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);


    } catch (e) {
        console.log("Đã có lỗi xảy ra khi lấy chi tiết công ty", e);
        return functions.setError(res, e.message);
    }
}

//hiển thị mô tả chi tiết của phòng ban, tổ trong công ty
exports.description = async(req, res, next) => {
    try {
        if (req.infoLogin) {
            let comId = req.body.comId;
            if (!comId) comId = req.infoLogin.comId;
            let depId = Number(req.body.depId)
            let teamId = Number(req.body.teamId)
            let groupId = Number(req.body.groupId)
            let info = {};

            if (groupId) {
                info = await HR_NestDetails.findOne({ comId: comId, grId: groupId, type: 1 })
            }
            if (teamId && !groupId) {
                info = await HR_NestDetails.findOne({ comId: comId, grId: teamId, type: 0 })
            }
            if (depId && !teamId && !groupId) {

                info = await HR_DepartmentDetails.findOne({ comId: comId, depId: depId })
            }
            if (!info || info.description == null) {
                info = { description: "chưa cập nhật" }
            }
            return functions.success(res, 'Lấy chi tiết công ty thành công', { info });
        } else return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);


    } catch (e) {
        console.log("Đã có lỗi xảy ra khi lấy chi tiết công ty", e);
        return functions.setError(res, e.message);
    }

}

exports.updateDescription = async(req, res, next) => {
    try {
        if (req.infoLogin) {
            let comId = req.body.comId;
            if (!comId) comId = req.infoLogin.comId;
            let depId = Number(req.body.depId)
            let teamId = Number(req.body.teamId)
            let groupId = Number(req.body.groupId)
            let des = req.body.description
            let info

            if (groupId) {
                let group = await HR_NestDetails.findOne({ comId: comId, grId: groupId, type: 1 });
                let fields = { comId: comId, grId: groupId, type: 1, description: des };
                if (!group) fields.id = await functions.getMaxIdByField(HR_NestDetails, 'id');
                info = await HR_NestDetails.findOneAndUpdate({ comId: comId, grId: groupId, type: 1 }, fields, { new: true, upsert: true })
            }
            if (teamId && !groupId) {
                let team = await HR_NestDetails.findOne({ comId: comId, grId: teamId, type: 0 });
                let fields = { comId: comId, grId: teamId, type: 0, description: des };
                if (!team) fields.id = await functions.getMaxIdByField(HR_NestDetails, 'id');
                info = await HR_NestDetails.findOneAndUpdate({ comId: comId, grId: teamId, type: 0 }, fields, { new: true, upsert: true })
            }
            if (depId && !teamId && !groupId) {
                let dep = await HR_DepartmentDetails.findOne({ comId: comId, depId: depId });
                let fields = { comId: comId, depId: depId, description: des };
                if (!dep) fields.id = await functions.getMaxIdByField(HR_DepartmentDetails, 'id');
                info = await HR_DepartmentDetails.findOneAndUpdate({ comId: comId, depId: depId }, fields, { new: true, upsert: true })
            }
            if (info) {
                return functions.success(res, 'Cập nhật mô tả chi tiết thành công', { info });
            } else return functions.setError(res, "không tìm thấy thông tin", 400);
        } else return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);


    } catch (e) {
        console.log("Đã có lỗi xảy ra khi lấy chi tiết công ty", e);
        return functions.setError(res, e.message);
    }

}

//danh sách chức vụ
//danh sách chức vụ
exports.listPosition = async(req, res, next) => {
    try {

        let comId = req.infoLogin.comId;

        //tìm kiếm những chức vụ của công ty đó trong bảng hr
        let arrPosition = [19, 18, 17, 21, 22, 16, 14, 8, 7, 6, 5, 13, 12, 4, 20, 11, 10, 3, 2, 9, 1];

        //nhung chuc vu bi an
        let positionStruct = await PositionStruct.find({ com_id: comId }).lean();
        for (let i = 0; i < positionStruct.length; i++) {
            const index = arrPosition.indexOf(positionStruct[i].position_id);
            if (index > -1) {
                arrPosition.splice(index, 1);
            }
        }


        let listPosition = [];
        //21 chuc vu
        let findUser = await Users.find({
            "inForPerson.employee.com_id": comId
        }, { idQLC: 1, userName: 1, inForPerson: { employee: { position_id: 1 } } });

        let position = await HR_DescPositions.find({ comId: comId });
        const conditionNV = { type: 2, "inForPerson.employee.com_id": comId };
        for (let i = 0; i < arrPosition.length; i++) {
            listPosition.push({
                positionId: arrPosition[i],
                positionName: positionNames[arrPosition[i]],
                mission: 'Chưa cập nhật',
                users: [],
            });
            for (let j = 0; j < position.length; j++) {
                if (position[j] && position[j].positionId == arrPosition[i]) {
                    listPosition[i].mission = position[j].description;
                }
            }

            let users = [];
            for (let j = 0; j < findUser.length; j++) {
                if (findUser[j] && findUser[j].inForPerson && findUser[j].inForPerson.employee && findUser[j].inForPerson.employee.position_id == arrPosition[i]) {
                    users.push(findUser[j].userName);
                }
            }

            if (i >= arrPosition.length - 4) {
                let conditionDNV = {...conditionNV, "inForPerson.employee.position_id": arrPosition[i] };
                let tong_nv = await functions.findCount(Users, conditionDNV);
                listPosition[i].tong_nv = tong_nv;
            }
            listPosition[i].users = users;
        }
        let index = listPosition.length - 4;
        let data = listPosition;
        // let data = listPosition.slice(0, index);
        // let listPositionEmployee = listPosition.slice(index);
        // data.push(listPositionEmployee);
        return functions.success(res, 'Lấy chi tiết công ty thành công', { data });
    } catch (e) {
        console.log("Đã có lỗi xảy ra khi lấy chi tiết công ty", e);
        return functions.setError(res, e.message);
    }
}

exports.updatePosition = async(req, res, next) => {
    try {
        let position_id = req.body.position_id;
        let com_id = req.infoLogin.comId;
        if (!position_id) return functions.setError(res, "Missing input position_id!", 404);
        let fields = { com_id: com_id, position_id: position_id };
        let position = await PositionStruct.findOne(fields);
        if (!position) {
            let id = await functions.getMaxIdByField(PositionStruct, 'id');
            fields.id = id;
            let insert_position = new PositionStruct(fields);
            insert_position = await insert_position.save();
            if (insert_position) {
                return functions.success(res, "Them vi tri thanh cong!");
            }
            return functions.setError(res, "Them vi tri that bai!", 506);
        }
        return functions.setError(res, "Vi tri da duoc them!", 505);
    } catch (e) {
        return functions.setError(res, e.message);
    }
}

//chi tiết nhiệm vụ mỗi chức vụ
exports.missionDetail = async(req, res, next) => {
    try {
        if (req.infoLogin) {
            let comId = req.infoLogin.comId;

            let positionId = req.body.positionId
            let mission = await HR_DescPositions.findOne({ comId: comId, positionId: positionId }, { description: 1 })
            if (mission) {
                if (mission.description != null) {
                    return functions.success(res, 'Lấy chi tiết công ty thành công', { mission });
                } else {
                    mission.description = "chưa cập nhật"
                    return functions.success(res, 'Lấy chi tiết công ty thành công', { mission });
                }
            } else return functions.setError(res, "chưa cập nhật nhiệm vụ", 400);
        } else return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);


    } catch (e) {
        console.log("Đã có lỗi xảy ra khi lấy chi tiết công ty", e);
        return functions.setError(res, e.message);
    }
}


//cập nhật chi tiết nhiệm vụ mỗi
exports.updateMission = async(req, res, next) => {
    try {
        let comId = req.infoLogin.comId;

        let positionId = req.body.positionId
        let description = req.body.description
        if (!positionId || !description) {
            return functions.setError(res, "Missing input value!", 404);
        }
        let mission = await HR_DescPositions.findOne({ comId: comId, positionId: positionId });
        if (mission) {
            mission = await HR_DescPositions.updateOne({ comId: comId, positionId: positionId }, { description: description }, { new: true });
            if (mission) {
                return functions.success(res, 'cập nhật chi tiết nhiệm vụ thành công', { mission });
            }
        } else {
            let maxId = await functions.getMaxIdByField(HR_DescPositions, 'id');
            mission = new HR_DescPositions({
                id: maxId,
                comId: comId,
                positionId: positionId,
                description: description
            });
            mission = await mission.save();
            if (mission) {
                return functions.success(res, 'cập nhật chi tiết nhiệm vụ thành công', { mission });
            }
        }
        return functions.setError(res, "Update mission fail!", 505);
    } catch (e) {
        console.log("Đã có lỗi xảy ra khi lấy chi tiết công ty", e);
        return functions.setError(res, e.message);
    }

}

//tải lên chữ ký
exports.uploadSignature = async(req, res, next) => {
    try {
        if (req.infoLogin) {
            let empId = req.body.empId
            let file = req.files.signature;
            if (!empId) return functions.setError(res, "Missing input empId!", 404);
            if (!req.files || !file) {
                return functions.setError(res, "Missing signature image!", 504);
            }
            if (!await functions.checkImage(file.path)) {
                return functions.setError(res, "Anh khong dung dinh dang hoac qua kich thuoc!", 505);
            }
            let nameFile = await hrFunctions.uploadFileSignature(file);
            let checkSig = await HR_SignatureImages.findOne({ empId: empId })
            let fields = { imgName: nameFile };
            if (!checkSig) {
                let idMax = await functions.getMaxIdByField(HR_SignatureImages, 'id');
                fields.id = idMax;
                fields.empId = empId;
                fields.createdAt = new Date(Date.now());
            }
            let upload = await HR_SignatureImages.findOneAndUpdate({ empId: empId }, fields, { new: true, upsert: true });
            if (upload) {
                return functions.success(res, 'Tải chữ ký thành công');
            }
            return functions.setError(res, "Tai chu ky that bai", 400);
        } else {
            return functions.setError(res, "Token không hợp lệ hoặc thông tin truyền lên không đầy đủ", 400);
        }
    } catch (e) {
        console.log("Đã có lỗi xảy ra khi tải lên hồ sơ", e);
        return functions.setError(res, e.message);
    }
}

//xóa chữ kí đã tải lên
exports.deleteSignature = async(req, res, next) => {
    try {
        if (req.infoLogin) {
            let empId = req.body.empId
            let deleteSig = await HR_SignatureImages.findOneAndUpdate({ empId: empId }, { isDelete: 1, deletedAt: new Date(Date.now()) })

            if (deleteSig) {
                return functions.success(res, 'Xóa chữ ký thành công');
            }
            return functions.setError(res, "Employee not found!");
        } else {
            return functions.setError(res, "Token không hợp lệ hoặc thông tin truyền lên không đầy đủ", 400);
        }
    } catch (e) {
        console.log("Đã có lỗi xảy ra khi tải lên hồ sơ", e);
        return functions.setError(res, e.message);
    }
}

//danh sách, tìm kiếm lãnh đạo
exports.listInfoLeader = async(req, res, next) => {
    try {
        if (req.infoLogin) {
            let { keyword, page, pageSize } = req.body;
            let comId = req.infoLogin.comId
            if (!page) page = 1;
            if (!pageSize) pageSize = 5;
            page = Number(page);
            pageSize = Number(pageSize);
            const skip = (page - 1) * pageSize;
            const limit = pageSize;
            let listPositionId = [4, 20, 13, 12, 11, 10, 6, 5, 8, 7, 16, 14, 21, 22, 19, 18, 17]
            let condition = { "inForPerson.employee.com_id": comId, "inForPerson.employee.position_id": { $in: listPositionId }, "inForPerson.employee.ep_status": "Active" };
            if (keyword) condition.userName = new RegExp(keyword, 'i');
            let total = await Users.countDocuments(condition);

            let infoLeader = await Users.find(condition, {
                idQLC: 1,
                avatarUser: 1,
                userName: 1,
                "inForPerson.employee.position_id": 1,
                "inForPerson.employee.dep_id": 1,
                "inForPerson.employee.team_id": 1,
                "inForPerson.employee.group_id": 1,
            }).sort({ idQLC: -1 }).skip(skip).limit(limit)

            let infoLeaderAfter = []
            for (let i = 0; i < infoLeader.length; i++) {
                let info = {}
                if (infoLeader[i].inForPerson && infoLeader[i].inForPerson.employee) {
                    info._id = infoLeader[i].idQLC
                    info.userName = infoLeader[i].userName
                    if (infoLeader[i].avatarUser) info.avatarUser = `${process.env.hostFile}${infoLeader[i].avatarUser}`;
                    else info.avatarUser = '';

                    info.namePosition = positionNames[infoLeader[i].inForPerson.employee.position_id];
                    if (infoLeader[i].inForPerson.employee.dep_id) {
                        let infoDep = await Deparment.findOne({ dep_id: infoLeader[i].inForPerson.employee.dep_id, com_id: comId })

                        if (infoDep) info.dep_name = infoDep.dep_name;
                        else info.dep_name = 'Chưa cập nhật';
                        if (infoLeader[i].inForPerson.employee.team_id) {
                            let infoTeam = await Team.findOne({
                                team_id: infoLeader[i].inForPerson.employee.team_id,
                                com_id: comId,
                                dep_id: infoLeader[i].inForPerson.employee.dep_id,
                            })
                            if (infoTeam) info.team_name = infoTeam.team_name;
                            else info.team_name = 'Chưa cập nhật';

                            if (infoLeader[i].inForPerson.employee.group_id) {
                                let infoGroup = await Group.findOne({
                                    gr_id: infoLeader[i].inForPerson.employee.group_id,
                                    com_id: comId,
                                    dep_id: infoLeader[i].inForPerson.employee.dep_id,
                                    team_id: infoLeader[i].inForPerson.employee.team_id
                                })
                                if (infoGroup) info.group_name = infoGroup.gr_name;
                                else info.group_name = 'Chưa cập nhật';
                            } else info.group_name = "Chưa cập nhật"

                        } else {
                            info.team_name = "Chưa cập nhật"
                            info.group_name = "Chưa cập nhật"
                        }

                    } else {
                        info.dep_name = "Chưa cập nhật"
                        info.team_name = "Chưa cập nhật"
                        info.group_name = "Chưa cập nhật"
                    }
                    infoLeaderAfter.push(info)
                }
            }

            if (infoLeader) {
                let winform = Number(req.body.winform);
                if (winform === 1) {

                    let arr = [];
                    for (let i = 0; i < infoLeaderAfter.length; i++) {
                        let obj = {};
                        const element = infoLeaderAfter[i];
                        obj.Url_image = element.avatarUser;
                        obj.ep_name = element.userName;
                        obj.position_name = element.namePosition;
                        obj.dep_name = element.dep_name;
                        obj.ep_id = element._id;
                        arr.push(obj);
                    }
                    return res.status(200).json({ data: { totalItems: total, items: arr } })
                }

                return functions.success(res, 'hiển thị danh sách lãnh đạo thành công', { total, page, pageSize, infoLeaderAfter });
            }
        } else {
            return functions.setError(res, "Token không hợp lệ hoặc thông tin truyền lên không đầy đủ", 400);
        }
    } catch (e) {
        console.log("Đã có lỗi xảy ra khi tải lên hồ sơ", e);
        return functions.setError(res, e.message);
    }
}

//chi tiết lãnh đạo
exports.leaderDetail = async(req, res, next) => {
    try {
        if (req.infoLogin && req.body.empId) {
            let empId = req.body.empId
            let description = req.body.description
            let result = {}
            let infoUser = await Users.findOne({ idQLC: empId, type: 2 })

            if (infoUser) {
                if (infoUser && infoUser.inForPerson && infoUser.inForPerson.employee && infoUser.inForPerson.account) {
                    let infoUserHr = await HR_InfoLeaders.findOne({ epId: empId });
                    let infoAvatar = await LeaderAvatar.findOne({ ep_id: empId });
                    let nameAvatar = ""
                    if (infoAvatar) nameAvatar = infoAvatar.avatar;
                    if (infoUserHr) {
                        result.ep_name = infoUser.userName;
                        result.namePosition = positionNames[infoUser.inForPerson.employee.position_id];
                        if (nameAvatar != "") result.avatarUser = `${process.env.DOMAIN_HR}/base365/hr/ep_leader/${nameAvatar}`
                        else result.avatarUser = '';
                        result.description = infoUserHr.description

                        if (result) {
                            return functions.success(res, 'hiển thị danh sách lãnh đạo thành công', { result });
                        }
                    } else {
                        const maxID = await HR_InfoLeaders.findOne({}, { id: 1 }).sort({ id: -1 }).limit(1).lean();
                        if (maxID) {
                            newIDMax = Number(maxID.id) + 1;
                        } else newIDMax = 1
                        let desPosition = infoUser.inForPerson.employee.position_id;
                        let insertUser = new HR_InfoLeaders({
                            id: newIDMax,
                            epId: empId,
                            avatar: nameAvatar,
                            description: description,
                            desPosition: desPosition,
                            created_at: new Date(Date.now())
                        })
                        insertUser = insertUser.save()

                        if (insertUser) {
                            let detailLeader = { userName: infoUser.userName, avatarUser: nameAvatar, birthday: infoUser.inForPerson.account.birthday };
                            return functions.success(res, 'cập nhật chi tiết lãnh đạo thành công', detailLeader);
                        } else {
                            return functions.setError(res, 'update info leader fail!');
                        }
                    }
                }
                return functions.setError(res, "Thong tin user khong day du", 404);
            } else functions.setError(res, "không tìm thấy thông tin user", 400);

        } else {
            return functions.setError(res, "Token không hợp lệ hoặc thông tin truyền lên không đầy đủ", 400);
        }
    } catch (e) {
        console.log("Đã có lỗi xảy ra khi tải lên hồ sơ", e);
        return functions.setError(res, e.message);
    }
}

//cập nhật chi tiết lãnh đạo
exports.updateLeaderDetail = async(req, res, next) => {
    try {
        if (req.infoLogin && req.body.empId) {
            let empId = req.body.empId
            let description = req.body.description
            if (!description) {
                return functions.setError(res, "Missing input description!");
            }

            let updateUserHr = await HR_InfoLeaders.findOneAndUpdate({ epId: empId }, { description: description, updated_at: new Date(Date.now()) }, { new: true })

            if (updateUserHr) {
                return functions.success(res, 'cập nhật chi tiết lãnh đạo thành công', { updateUserHr });
            }
            return functions.setError(res, "Lanh dao not found!", 405);
        } else {
            return functions.setError(res, "Token không hợp lệ hoặc thông tin truyền lên không đầy đủ", 400);
        }
    } catch (e) {
        console.log("Đã có lỗi xảy ra khi tải lên hồ sơ", e);
        return functions.setError(res, e.message);
    }
}

//cap nhat avatar lanh dao
exports.updateAvatarLeader = async(req, res, next) => {
    try {
        if (req.infoLogin && req.body.empId) {
            let empId = req.body.empId
            if (req.files && req.files.logo) {
                let logo = req.files.logo;
                if (logo && await hrFunctions.checkFile(logo.path)) {
                    let nameAvatar = await hrFunctions.uploadFileNameRandom("ep_leader", logo);
                    let id = await functions.getMaxIdByField(LeaderAvatar, 'id');
                    let fields = {
                        ep_id: empId,
                        avatar: nameAvatar,
                        created_at: Date.now()
                    }
                    let leaderAvatar = await LeaderAvatar.findOne({ ep_id: empId });
                    if (!leaderAvatar) {
                        fields.id = id;
                    }
                    leaderAvatar = await LeaderAvatar.findOneAndUpdate({ ep_id: empId }, fields, { new: true, upsert: true });
                    if (leaderAvatar) {
                        return functions.success(res, "Update avatar leader thanh cong!");
                    }
                    return functions.setError(res, "Update avatar leader that bai!", 407);
                }
                return functions.setError(res, "Anh sai dinh dang hoac qua kich thuoc!", 406);
            }
            return functions.setError(res, "Truyen thieu anh!", 405);
        } else {
            return functions.setError(res, "Token không hợp lệ hoặc thông tin truyền lên không đầy đủ", 400);
        }
    } catch (e) {
        return functions.setError(res, e.message);
    }
}

//Thêm mới nhân viên sử dụng con dấu
exports.updateEmpUseSignature = async(req, res, next) => {
    try {
        if (req.infoLogin && req.body.empId) {
            let comId = req.infoLogin.comId;
            let empId = req.body.empId
            let depId = req.body.depId
            let positionId = req.body.positionId

            let query = {
                idQLC: empId,
                type: 2,
                "inForPerson.employee.com_id": comId
            }
            if (depId) {
                query = {
                    idQLC: empId,
                    type: 2,
                    "inForPerson.employee.com_id": comId,
                    "inForPerson.employee.dep_id": depId
                }

            }
            if (positionId) {
                query = {
                    idQLC: empId,
                    type: 2,
                    "inForPerson.employee.com_id": comId,
                    "inForPerson.employee.dep_id": depId,
                    "inForPerson.employee.position_id": position_id
                }
            }

            if (depId && positionId) {
                query = {
                    idQLC: empId,
                    type: 2,
                    "inForPerson.employee.com_id": comId,
                    "inForPerson.employee.dep_id": depId,
                    "inForPerson.employee.position_id": position_id,
                    "inForPerson.employee.dep_id": depId
                }
            }
            let updateUserHr = await Users.findOneAndUpdate(query, {
                "inForPerson.employee.ep_signature": 1,
                updatedAt: new Date(Date.now())
            }, { new: true })

            if (updateUserHr) {
                return functions.success(res, 'cập nhật người sử dụng con dấu thành công');
            }
            return functions.setError(res, "Employee not found!", 405);
        } else {
            return functions.setError(res, "Token không hợp lệ hoặc thông tin truyền lên không đầy đủ", 400);
        }
    } catch (e) {
        console.log("Đã có lỗi xảy ra", e);
        return functions.setError(res, e.message);
    }
}

//Danh sách nhân viên sử dụng con dấu (có tìm kiếm)
exports.listEmpUseSignature = async(req, res, next) => {
    try {
        let comId = req.infoLogin.comId;
        let { key, dep_id, page, pageSize } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 5;
        page = Number(page)
        pageSize = Number(pageSize)
        const skip = (page - 1) * pageSize;
        let condition = { "inForPerson.employee.com_id": comId, "inForPerson.employee.ep_signature": 1, "inForPerson.employee.ep_status": "Active" };
        if (key) {
            if (!isNaN(parseFloat(key)) && isFinite(key)) condition.idQLC = Number(key);
            else condition.userName = new RegExp(key, 'i');
        }
        if (dep_id) condition["inForPerson.employee.dep_id"] = dep_id;
        let fields = { idQLC: 1, avatarUser: 1, userName: 1, "inForPerson.employee.position_id": 1, "inForPerson.employee.dep_id": 1 };
        let total = await Users.countDocuments(condition);
        let listEmployee = await functions.pageFindWithFields(Users, condition, fields, { idQLC: -1 }, skip, pageSize);
        let listEmpUseSignature = [];
        for (let i = 0; i < listEmployee.length; i++) {
            let info = {};
            if (listEmployee[i].inForPerson && listEmployee[i].inForPerson.employee) {
                info._id = listEmployee[i].idQLC
                info.userName = listEmployee[i].userName
                info.namePosition = positionNames[listEmployee[i].inForPerson.employee.position_id];
                info.depId = listEmployee[i].inForPerson.employee.dep_id;

                if (listEmployee[i].inForPerson.employee.dep_id) {
                    let infoDep = await Deparment.findOne({ dep_id: listEmployee[i].inForPerson.employee.dep_id, com_id: comId })
                    if (infoDep) info.dep_name = infoDep.dep_name
                    else info.dep_name = "Chưa cập nhật"
                } else {
                    info.dep_name = "Chưa cập nhật"
                }
                listEmpUseSignature.push(info);
            }
        }
        return functions.success(res, "Get list employee signature success!", { total, page, pageSize, listEmpUseSignature });
    } catch (e) {
        console.log("Err from server get list employee signature!", e);
        return functions.setError(res, e.message);
    }
}

//Xóa nhân viên sử dụng con dấu
exports.deleteEmpUseSignature = async(req, res, next) => {
    try {
        if (req.infoLogin && req.body.empId) {
            let comId = req.infoLogin.comId;
            let empId = req.body.empId;

            let updateUserHr = await Users.findOneAndUpdate({
                idQLC: empId,
                type: 2,
                "inForPerson.employee.com_id": comId
            }, {
                "inForPerson.employee.ep_signature": 0,
                updatedAt: new Date(Date.now())
            }, { new: true })

            if (updateUserHr) {
                return functions.success(res, 'xóa người sử dụng con dấu thành công');
            } else {
                return functions.setError(res, "Emplyee not found!", 505);
            }
        } else {
            return functions.setError(res, "Token không hợp lệ hoặc thông tin truyền lên không đầy đủ", 400);
        }
    } catch (e) {
        console.log("Đã có lỗi xảy ra", e);
        return functions.setError(res, e.message);
    }
}

//danh sách, tìm kiếm chữ ký lãnh đạo
exports.listSignatureLeader = async(req, res, next) => {
    try {
        if (req.infoLogin) {
            let { key, dep_id, page, pageSize } = req.body;
            let comId = req.infoLogin.comId
            if (!page) page = 1;
            if (!pageSize) pageSize = 5;
            page = Number(page)
            pageSize = Number(pageSize)
            const skip = (page - 1) * pageSize;
            const limit = pageSize;
            let listPositionId = [4, 20, 13, 12, 11, 10, 6, 5, 8, 7, 16, 14, 21, 22, 19, 18, 17]

            let condition = { "inForPerson.employee.com_id": comId, "inForPerson.employee.position_id": { $in: listPositionId }, "inForPerson.employee.ep_status": "Active" };
            if (key) {
                if (!isNaN(parseFloat(key)) && isFinite(key)) condition.idQLC = Number(key);
                else condition.userName = new RegExp(key, 'i');
            }
            if (dep_id) condition["inForPerson.employee.dep_id"] = dep_id;
            let fields = { idQLC: 1, avatarUser: 1, userName: 1, "inForPerson.employee.position_id": 1, "inForPerson.employee.dep_id": 1 };
            let total = await Users.countDocuments(condition);
            let infoLeader = await functions.pageFindWithFields(Users, condition, fields, { idQLC: -1 }, skip, pageSize);

            if (infoLeader) {
                let infoLeaderAfter = []
                for (let i = 0; i < infoLeader.length; i++) {
                    let info = {}
                    if (infoLeader[i].inForPerson && infoLeader[i].inForPerson.employee) {
                        info._id = infoLeader[i].idQLC
                        info.userName = infoLeader[i].userName
                        info.namePosition = positionNames[infoLeader[i].inForPerson.employee.position_id];

                        if (infoLeader[i].inForPerson.employee.dep_id) {
                            let infoDep = await Deparment.findOne({ dep_id: infoLeader[i].inForPerson.employee.dep_id, com_id: comId })
                            if (infoDep) info.dep_name = infoDep.dep_name
                            else info.dep_name = "Chưa cập nhật"
                        } else {
                            info.dep_name = "Chưa cập nhật"
                        }

                        let infoSig = await HR_SignatureImages.findOne({ empId: infoLeader[i].idQLC, isDelete: 0 }, { imgName: 1 })
                        if (infoSig) {
                            info.linkSignature = `${process.env.hostFile}base365/hr/upload/signature/${infoSig.imgName}`
                        } else info.linkSignature = "Chưa cập nhật"
                        infoLeaderAfter.push(info)
                    }
                }
                return functions.success(res, 'hiển thị danh sách lãnh đạo thành công', { total, page, pageSize, infoLeaderAfter });
            }
            return functions.setError(res, "không tìm thấy lãnh đạo nào", 400);
        } else {
            return functions.setError(res, "Token không hợp lệ hoặc thông tin truyền lên không đầy đủ", 400);
        }
    } catch (e) {
        console.log("Đã có lỗi xảy ra khi tải lên hồ sơ", e);
        return functions.setError(res, e.message);
    }
}

// danh sách nhân viên chưa chấm công hoặc đã chấm công
exports.listEmUntimed = async(req, res, next) => {
    try {
        let { emp_id, com_id, dep_id, position_id, group_id, team_id, birthday, gender, married, page, pageSize } = req.body;
        if (!com_id) com_id = req.infoLogin.comId;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        let condition = { "inForPerson.employee.com_id": com_id, type: 2 };

        if (dep_id) condition["inForPerson.employee.dep_id"] = Number(dep_id);
        if (group_id) condition["inForPerson.employee.group_id"] = Number(group_id);
        if (team_id) condition["inForPerson.employee.team_id"] = Number(team_id);
        if (position_id) condition["inForPerson.employee.position_id"] = Number(position_id);

        if (gender) condition["inForPerson.account.gender"] = Number(gender);
        if (married) condition["inForPerson.account.married"] = Number(married);
        if (birthday) {
            birthday = Number(birthday);
            let startOfYear = new Date(birthday, 0, 1); // Tháng đếm từ 0, nên tháng 0 là tháng 1
            let endOfYear = new Date(birthday, 11, 31); // Tháng 11 là tháng 12 trong đếm tháng
            startOfYear = functions.convertTimestamp(startOfYear);
            endOfYear = functions.convertTimestamp(endOfYear);
            condition["inForPerson.account.birthday"] = { $gt: startOfYear, $lte: endOfYear };
        }
        let company = await Users.findOne({ idQLC: com_id, type: 1 }, { userName: 1, idQLC: 1 });

        // chấm công hoặc chưa chấm công
        let type_timekeep = Number(req.body.type_timekeep);
        let condition2 = {};

        let today = new Date().toISOString().slice(0, 10);

        // Xử lý lấy nhân viên chấm công
        const qr_sheet_total = await hrFunctions.listEmployeeTimekeepers(com_id);
        let arr = [];
        qr_sheet_total.map(item => arr.push(item.ep_id));
        if (type_timekeep == 1) {
            condition.idQLC = { $in: arr }
        } else if (type_timekeep == 2) {
            condition.idQLC = { $nin: arr }
        }
        if (emp_id) condition.idQLC = Number(emp_id);

        let listEmployee = await Users.aggregate([
            { $match: condition },
            { $sort: { idQLC: -1 } },
            { $skip: skip },
            { $limit: pageSize },
            {
                $lookup: {
                    from: "QLC_Deparments",
                    localField: "inForPerson.employee.dep_id",
                    foreignField: "dep_id",
                    as: "Department"
                }
            },
            { $unwind: { path: "$Department", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "QLC_Teams",
                    localField: "inForPerson.employee.team_id",
                    foreignField: "team_id",
                    as: "Team"
                }
            },
            { $unwind: { path: "$Team", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "QLC_Groups",
                    localField: "inForPerson.employee.group_id",
                    foreignField: "gr_id",
                    as: "Group"
                }
            },
            { $unwind: { path: "$Group", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "Users",
                    localField: "inForPerson.employee.com_id",
                    foreignField: "idQLC",
                    pipeline: [
                        { $match: { type: 1 } },
                    ],
                    as: "Company"
                }
            },
            { $unwind: { path: "$Company", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'idQLC': '$idQLC',
                    'userName': '$userName',
                    'phone': '$phone',
                    'phoneTK': '$phoneTK',
                    'email': '$email',
                    'address': '$address',
                    'birthday': '$inForPerson.account.birthday',
                    'gender': '$inForPerson.account.gender',
                    'married': '$inForPerson.account.married',
                    'experience': '$inForPerson.account.experience',
                    'education': '$inForPerson.account.education',
                    'com_id': '$inForPerson.employee.com_id',
                    'Company': '$Company.userName',
                    'dep_id': '$inForPerson.employee.dep_id',
                    'Department': '$Department.dep_name',
                    'group_id': '$inForPerson.employee.group_id',
                    'Group': '$Group.gr_name',
                    'team_id': '$inForPerson.employee.team_id',
                    'Team': '$Team.team_name',
                    'position_id': '$inForPerson.employee.position_id',
                    'start_working_time': '$inForPerson.employee.start_working_time',
                }
            },
        ]);
        if (type_timekeep == 2) {
            let checkCycleMonth = today.slice(0, 7);
            const getTimeHours = functions.getTimeHours();
            checkCycleMonth = `${checkCycleMonth}-01`;
            let getListCycleEmployee = await CC365_Cycle.aggregate([{
                    $match: {
                        com_id: Number(com_id),
                        apply_month: {
                            $gte: new Date(`${checkCycleMonth} 00:00:00`),
                            $lte: new Date(`${functions.convertDate(null, true).replaceAll('/', '-')} 23:59:59`)
                        },
                    }
                },
                {
                    $lookup: {
                        from: 'CC365_EmployeCycle',
                        localField: 'cy_id',
                        foreignField: 'cy_id',
                        as: 'employe_cycle'
                    }
                },
                { $unwind: "$employe_cycle" },
                {
                    $project: {
                        _id: 0,
                        cy_id: 1,
                        ep_id: "$employe_cycle.ep_id",
                        cy_detail: 1
                    }
                }
            ]);

            for (let i = 0; i < listEmployee.length; i++) {
                const employee = listEmployee[i];
                let ly_do_nghi = "";

                const cycle = getListCycleEmployee.find(item => item.ep_id == employee.idQLC);
                if (cycle) {
                    let cy_detail = cycle.cy_detail;

                    cy_detail = JSON.parse(cy_detail);

                    let check = cy_detail.find(item => item.date == today);

                    if (check && check.shift_id != '') {
                        let shift_id = check.shift_id.split(',');
                        const listShifts = await Shift.find({ shift_id: { $in: shift_id } })

                        for (let i = 0; i < listShifts.length; i++) {
                            const shift = listShifts[i];

                            if (getTimeHours >= shift.start_time && getTimeHours <= shift.end_time) {
                                let check_de_xuat = await DeXuat.find({
                                    type_dx: 1,
                                    id_user: employee.idQLC,
                                    type_duyet: 5,
                                }, { noi_dung: 1 }).sort({ _id: -1 });

                                if (check_de_xuat.length > 0) {
                                    for (let j = 0; j < check_de_xuat.length; j++) {
                                        const de_xuat = check_de_xuat[j];
                                        if (de_xuat.noi_dung && de_xuat.noi_dung.nghi_phep && de_xuat.noi_dung.nghi_phep.nd) {
                                            let noidung = de_xuat.noi_dung.nghi_phep.nd;
                                            const itemND = noidung.find(item => item.kt_nghi == today);
                                            if (itemND) {
                                                ly_do_nghi = de_xuat.noi_dung.nghi_phep.ly_do;
                                                employee.link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${de_xuat._id}`;
                                                break;
                                            }
                                        }
                                    }
                                } else {
                                    ly_do_nghi = 'Nghỉ sai quy định';
                                }
                                break;
                            } else {
                                ly_do_nghi = 'Nghỉ theo lịch làm việc';
                            }
                        }
                    } else {
                        ly_do_nghi = 'Nghỉ theo lịch làm việc';
                    }
                } else {
                    ly_do_nghi = 'Chưa tạo lịch làm việc';
                }
                employee.ly_do_nghi = ly_do_nghi;
            }
        }

        let total = await Users.countDocuments(condition)

        let winform = Number(req.body.winform);
        if (winform == 1) {
            let arr = [];

            for (let i = 0; i < listEmployee.length; i++) {
                const element = listEmployee[i];
                let obj = {};
                obj.ep_id = element.idQLC
                obj.ep_name = element.userName
                obj.dep_name = element.Department
                obj.com_name = element.Company
                obj.position_name = hrFunctions.positionNames[element.position_id]
                obj.ep_gender = element.gender
                obj.ep_birth_day = element.birthday
                obj.ep_married = element.married
                obj.ep_email = element.email
                obj.ep_phone = element.phone
                obj.ep_address = element.address
                obj.ep_education = element.education
                obj.ep_exp = element.experience
                obj.position_id = element.position_id
                obj.noi_dung = element.ly_do_nghi
                arr.push(obj)
            };
            let totalItems = arr.length
            return res.status(200).json({ data: { totalItems, items: arr } })
        }

        return functions.success(res, 'get data success', { totalCount: total, company, listEmployee })
    } catch (error) {
        console.log("🚀 ~ file: organizationalStructure.js:1553 ~ exports.listEmUntimed= ~ error:", error)
        return functions.setError(res, error.message, 500);
    }
};