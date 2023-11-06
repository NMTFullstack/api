const functions = require('../../services/functions')
const hrService = require('../../services/hr/hrService')
const Users = require('../../models/Users')
const Appoint = require('../../models/hr/personalChange/Appoint')
const TranferJob = require('../../models/hr/personalChange/TranferJob')
const QuitJob = require('../../models/hr/personalChange/QuitJob')
const QuitJobNew = require('../../models/hr/personalChange/QuitJobNew')
const Salary = require('../../models/Tinhluong/Tinhluong365SalaryBasic')
const Resign = require('../../models/hr/personalChange/Resign')
const EmployeeHistory = require('../../models/qlc/EmployeeHistory')
const Department = require('../../models/qlc/Deparment')
const Team = require('../../models/qlc/Team')
const Group = require('../../models/qlc/Group')
const Shifts = require('../../models/qlc/Shifts')
const HR_CrontabQuitJobs = require('../../models/hr/CrontabQuitJobs')

const OrganizeDetail = require('../../models/qlc/OrganizeDetail')
const Positions = require('../../models/qlc/Positions')

exports.getListEmployee = async(req, res, next) => {
    try {
        let com_id = req.infoLogin.comId
        let listEmployee = await Users.find({ 'inForPerson.employee.com_id': com_id }, { _id: 1, userName: 1 })
        const totalCount = await functions.findCount(Users, {
            'inForPerson.employee.com_id': com_id,
        })
        return functions.success(res, 'Get list appoint success', {
            totalCount: totalCount,
            listEmployee,
        })
    } catch (e) {
        console.log('Err from server', e)
        return functions.setError(res, e.message)
    }
}

// lay ra danh sach quy trinh dao tao
exports.getListAppoint = async(req, res, next) => {
    try {
        //check quyen
        let infoLogin = req.infoLogin
        let com_id = infoLogin.comId

        let {
            page,
            pageSize,
            appointId,
            ep_id,
            update_position_id,
            update_organizeDetailId,
            update_listOrganizeDetailId,
            fromDate,
            toDate,
        } = req.body
        if (!page) page = 1
        if (!pageSize) pageSize = 10
        page = Number(page)
        pageSize = Number(pageSize)
        const skip = (page - 1) * pageSize
        const limit = pageSize
        let listCondition = {
            com_id: com_id,
        }

        // dua dieu kien vao ob listCondition
        if (ep_id) listCondition.ep_id = Number(ep_id)
        if (fromDate && !toDate)
            listCondition.created_at = { $gte: new Date(fromDate) }
        if (toDate && !fromDate)
            listCondition.created_at = { $lte: new Date(toDate) }
        if (toDate && fromDate)
            listCondition.created_at = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate),
            }

        let listAppoint = await functions.pageFind(
            Appoint,
            listCondition, { id: -1 },
            skip,
            limit
        )

        let condition2 = { 'inForPerson.employee.com_id': com_id, type: 2 }
        if (update_organizeDetailId)
            condition2['inForPerson.employee.organizeDetailId'] = Number(
                update_organizeDetailId
            )
        if (update_position_id)
            condition2['inForPerson.employee.position_id'] =
            Number(update_position_id)
        if (update_listOrganizeDetailId)
            condition2['inForPerson.employee.listOrganizeDetailId'] = {
                $all: update_listOrganizeDetailId,
            }
        let listEmployee = await Users.find(condition2)

        let data = []
        for (let i = 0; i < listAppoint.length; i++) {
            let infoAppoint = {}

            let employee = listEmployee.filter((employee) => {
                if (employee.idQLC == listAppoint[i].ep_id && employee.type != 1)
                    return true
                return false
            })

            if (employee.length > 0) {
                employee = employee[0]
                infoAppoint.ep_id = employee.idQLC
                infoAppoint.ep_name = employee.userName
            } else {
                continue
            }

            infoAppoint.time = listAppoint[i].created_at
            infoAppoint.note = listAppoint[i].note
            infoAppoint.decision_id = listAppoint[i].decision_id
            const findOrganizeDetail = await OrganizeDetail.findOne({
                id: listAppoint[i].current_organizeDetailId,
            })
            if (findOrganizeDetail) {
                infoAppoint.old_organizeDetailId = findOrganizeDetail.id
                infoAppoint.old_listOrganizeDetailId =
                    findOrganizeDetail.listOrganizeDetailId
                infoAppoint.old_organizeDetailName =
                    findOrganizeDetail.organizeDetailName
            } else {
                infoAppoint.old_organizeDetailName = 'Chưa cập nhật'
            }
            let new_organizeDetailId = null
            let new_position_id = null
            if (employee && employee.inForPerson && employee.inForPerson.employee) {
                new_organizeDetailId = employee.inForPerson.employee.organizeDetailId
                new_position_id = employee.inForPerson.employee.position_id
            }
            if (new_organizeDetailId) {
                let infoNewOrganizeDetail = await OrganizeDetail.findOne({
                        id: Number(new_organizeDetailId),
                    })
                    // let infoNewDep = await Department.findOne({ dep_id: new_dep_id })
                if (infoNewOrganizeDetail) {
                    infoAppoint.new_organizeDetailId = infoNewOrganizeDetail.id
                    infoAppoint.new_listOrganizeDetailId =
                        infoNewOrganizeDetail.listOrganizeDetailId
                    infoAppoint.new_organizeDetailName =
                        infoNewOrganizeDetail.organizeDetailName
                } else {
                    infoAppoint.new_organizeDetailName = 'Chưa cập nhật'
                }
            } else infoAppoint.new_organizeDetailName = 'Chưa cập nhật'

            if (new_position_id) {
                const findNewPostion = await Positions.findOne({ id: new_position_id })

                if (findNewPostion) {
                    infoAppoint.new_positionName = findNewPostion.positionName
                    infoAppoint.new_position_id = new_position_id
                } else {
                    infoAppoint.new_position_name = 'Chưa cập nhật'
                }
            } else infoAppoint.new_position_name = 'Chưa cập nhật'

            let findOldPosition = await Positions.findOne({
                id: Number(listAppoint[i].current_position_id),
            })
            if (findOldPosition) {
                infoAppoint.old_positionName = findOldPosition.positionName
                infoAppoint.old_position_id = findOldPosition.id
            }
            data.push(infoAppoint)
        }
        let totalCount = data.length

        let winform = Number(req.body.winform)
        if (winform === 1) {
            let arr = []

            for (let i = 0; i < data.length; i++) {
                let obj = {}
                const element = data[i]
                obj.ep_id = element.ep_id
                obj.ep_name = element.ep_name
                obj.old_organizeDetailName = element.old_organizeDetailName
                obj.organizeDetailName = element.new_organizeDetailName
                obj.old_positionName = element.old_positionName
                obj.positionName = element.new_positionName
                obj.created_at = await hrService.getDate(element.time)
                obj.ep_name = element.ep_name
                obj.com_id = com_id
                arr.push(obj)
            }
            return res
                .status(200)
                .json({ data: { totalItems: totalCount, items: arr } })
        }
        return functions.success(res, 'Get list appoint success', {
            totalCount: totalCount,
            data: data,
        })
    } catch (e) {
        console.log(e.message)
        return functions.setError(res, e.message)
    }
}

exports.getAndCheckData = async(req, res, next) => {
    try {
        //check quyen
        let infoLogin = req.infoLogin
        let {
            ep_id,
            com_id,
            new_com_id,
            current_position,
            current_dep_id,
            update_position,
            update_dep_id,
            created_at,
            decision_id,
            note,
            mission,
        } = req.body
        if (!com_id) {
            com_id = infoLogin.comId
        }
        if (!ep_id || !created_at) {
            return functions.setError(res, 'Missing input value!', 404)
        }
        req.fields = {
            com_id,
            ep_id,
            current_position,
            current_dep_id,
            created_at,
            decision_id,
            note: note,
        }
        next()
    } catch (e) {
        console.log('Err from server', e)
        return functions.setError(res, e.message)
    }
}

exports.updateAppoint = async(req, res, next) => {
    try {
        let {
            ep_id,
            current_position_id,
            current_organizeDetailId,
            current_listOrganizeDetailId,
            created_at,
            decision_id,
            note,
            update_position_id,
            update_organizeDetailId,
            update_listOrganizeDetailId,
        } = req.body

        if (!update_position_id ||
            !update_organizeDetailId ||
            !update_listOrganizeDetailId
        ) {
            return functions.setError(res, 'Missing input value!', 405)
        }
        //lay ra id lon nhat
        let com_id = req.infoLogin.comId
        let employee = await Users.findOneAndUpdate({ idQLC: ep_id, 'inForPerson.employee.com_id': com_id }, {
            'inForPerson.employee.organizeDetailId': update_organizeDetailId,
            'inForPerson.employee.listOrganizeDetailId': update_listOrganizeDetailId,
            'inForPerson.employee.position_id': update_position_id,
        }, { new: true })
        if (employee) {
            let fields = {
                ep_id: ep_id,
                com_id: com_id,
                current_position_id: current_position_id,
                current_organizeDetailId: current_organizeDetailId,
                current_listOrganizeDetailId: current_listOrganizeDetailId,
                created_at: new Date(created_at),
                decision_id: decision_id,
                note: note,
            }
            let check = await Appoint.findOne({ ep_id: ep_id })
            if (!check) {
                let newIdAppoint = await functions.getMaxIdByField(Appoint, 'id')
                const newData = new Appoint({
                    id: newIdAppoint,
                    ep_id: ep_id,
                    com_id: com_id,
                    current_position_id: current_position_id,
                    current_organizeDetailId: current_organizeDetailId,
                    current_listOrganizeDetailId: current_listOrganizeDetailId,
                    created_at: new Date(created_at),
                    decision_id: decision_id,
                    note: note,
                })
                await newData.save()
                return functions.success(res, 'Update Appoint success!')
            }
            //neu chua co thi them moi

            await Appoint.updateOne({
                ep_id: ep_id,
                com_id: com_id,
            }, {
                $set: fields,
            })
            return functions.success(res, 'Update Appoint success!')
        }
        return functions.setError(res, 'Employee not found!')
    } catch (e) {
        return functions.setError(res, e.message)
    }
}

//xoa
exports.deleteAppoint = async(req, res, next) => {
    try {
        //check quyen
        let infoLogin = req.infoLogin
        let ep_id = Number(req.body.ep_id)
        if (!ep_id) {
            return functions.setError(res, 'Missing input value ep_id', 404)
        }
        let appoint = await functions.getDataDeleteOne(Appoint, { ep_id: ep_id })
        if (appoint.deletedCount === 1) {
            return functions.success(
                res,
                `Delete appoint with ep_id=${ep_id} success`
            )
        }
        return functions.setError(res, 'Appoint not found', 505)
    } catch (e) {
        return functions.setError(res, e.message)
    }
}

//----------------------------------------------luan chuye cong tac

// lay ra danh sach luan chuyen cong tac
exports.getListTranferJob = async(req, res, next) => {
    try {
        //check quyen
        let infoLogin = req.infoLogin
        let com_id = infoLogin.comId
        let {
            page,
            pageSize,
            ep_id,
            update_position_id,
            update_organizeDetailId,
            update_listOrganizeDetailId,
            fromDate,
            toDate,
        } = req.body
        if (!page) page = 1
        if (!pageSize) pageSize = 10
        page = Number(page)
        pageSize = Number(pageSize)
        const skip = (page - 1) * pageSize
        const limit = pageSize
        let listCondition = { com_id: com_id }
        let condition2 = {}
            // dua dieu kien vao ob listCondition
        if (update_position_id)
            condition2['user.inForPerson.employee.position_id'] =
            Number(update_position_id)
        if (update_organizeDetailId)
            condition2['user.inForPerson.employee.organizeDetailId'] = Number(
                update_organizeDetailId
            )
        if (update_listOrganizeDetailId)
            condition2['user.inForPerson.employee.listOrganizeDetailId'] = {
                $all: update_listOrganizeDetailId,
            }
        if (ep_id) listCondition.ep_id = Number(ep_id)
        if (fromDate && !toDate)
            listCondition.created_at = { $gte: new Date(fromDate) }
        if (toDate && !fromDate)
            listCondition.created_at = { $lte: new Date(toDate) }
        if (fromDate && toDate)
            listCondition.created_at = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate),
            }

        let listTranferJob = await functions.pageFind(
            TranferJob,
            listCondition, { _id: -1 },
            skip,
            limit
        )

        const total = await TranferJob.aggregate([
            { $match: listCondition },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'ep_id',
                    foreignField: 'idQLC',
                    pipeline: [{ $match: { type: { $ne: 1 } } }],
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            { $match: condition2 },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                },
            },
        ])
        const totalCount = total.length > 0 ? total[0].total : 0

        let dataTranferJob = []
            //lay thong tin chi tiet
        for (let i = 0; i < listTranferJob.length; i++) {
            let infoTransfer = {}
            let ep_id = listTranferJob[i].ep_id
            let infoUser = await Users.findOne({ idQLC: ep_id, type: { $ne: 1 } })

            infoTransfer._id = listTranferJob[i]._id
            infoTransfer.ep_id = listTranferJob[i].ep_id
            infoTransfer.created_at = listTranferJob[i].created_at
            infoTransfer.note = listTranferJob[i].note
            infoTransfer.mission = listTranferJob[i].mission

            if (infoUser && infoUser.inForPerson && infoUser.inForPerson.employee) {
                infoTransfer.userName = infoUser.userName

                let new_com_id = infoUser.inForPerson.employee.com_id
                let new_organizeDetailId =
                    infoUser.inForPerson.employee.organizeDetailId
                let new_listOrganizeDetailId =
                    infoUser.inForPerson.employee.listOrganizeDetailId
                let new_position_id = infoUser.inForPerson.employee.position_id
                    //tim theo phong ban
                if (
                    update_organizeDetailId &&
                    new_organizeDetailId != update_organizeDetailId
                )
                    continue
                    // lấy ra công ty cũ

                let inForOldCompany = await Users.findOne({ idQLC: com_id, type: 1 })
                if (inForOldCompany)
                    infoTransfer.old_com_name = inForOldCompany.userName
                else infoTransfer.old_com_name = 'Chưa cập nhật'
                infoTransfer.old_com_id = listTranferJob[i].com_id
                    //lay ra phong ban cu
                let oldOrganizeDetailId = await OrganizeDetail.findOne({
                    comId: listTranferJob[i].com_id,
                    id: listTranferJob[i].organizeDetailId,
                })
                if (oldOrganizeDetailId)
                    infoTransfer.old_organizeDetailName =
                    oldOrganizeDetailId.organizeDetailName
                else infoTransfer.old_organizeDetailName = 'Chưa cập nhật'
                infoTransfer.old_organizeDetailId = listTranferJob[i].organizeDetailId
                infoTransfer.old_listOrganizeDetailId =
                    listTranferJob[i].listOrganizeDetailId
                    //lay ra vi tri cu

                const old_position = await Positions.findOne({
                    comId: listTranferJob[i].com_id,
                    id: listTranferJob[i].position_id,
                })
                if (old_position)
                    infoTransfer.old_positionName = old_position.positionName
                else {
                    infoTransfer.old_positionName = 'Chưa cập nhật'
                }
                infoTransfer.old_position_id = listTranferJob[i].position_id
                    //lay ra ten cong tymới
                let inForCompany = await Users.findOne({ idQLC: new_com_id, type: 1 })
                if (inForCompany) infoTransfer.new_com_name = inForCompany.userName
                else infoTransfer.new_com_name = 'Chưa cập nhật'
                infoTransfer.new_com_id = new_com_id
                    //lay ra ten phong ban mới
                const infoOrganizeDetailId = await OrganizeDetail.findOne({
                    comId: new_com_id,
                    id: new_organizeDetailId,
                })
                if (infoOrganizeDetailId)
                    infoTransfer.new_organizeDetailName =
                    infoOrganizeDetailId.organizeDetailName
                else infoTransfer.new_dep_name = 'Chưa cập nhật'
                infoTransfer.new_organizeDetailId = new_organizeDetailId
                infoTransfer.new_listOrganizeDetailId = new_listOrganizeDetailId
                    //lay ra vi tri moi
                const new_position = await Positions.findOne({
                    comId: new_com_id,
                    id: new_position_id,
                })
                if (new_position) {
                    infoTransfer.new_positionName = new_position.positionName
                    infoTransfer.new_position_id = new_position.id
                } else {
                    infoTransfer.new_positionName = 'Chưa cập nhật'
                }
                infoTransfer.new_position_id = new_position_id

                infoTransfer.decision_id = listTranferJob[i].decision_id
                dataTranferJob.push(infoTransfer)
            }
        }

        let winform = Number(req.body.winform)
        if (winform === 1) {
            let old_com_name = ''
            let arr = []
            for (let i = 0; i < dataTranferJob.length; i++) {
                let obj = {}
                const element = dataTranferJob[i]
                    // let check = await Users.findOne({ idQLC: element.old_com_id, type: 1 });
                    // if (check) old_com_name = check.userName;
                obj.ep_id = element.ep_id
                obj.ep_name = element.userName
                obj.old_com_name = element.old_com_name
                obj.old_com_id = element.old_com_id
                obj.old_organizeDetailName = element.old_organizeDetailName
                obj.old_organizeDetailId = element.old_organizeDetailId
                obj.old_listOrganizeDetailId = element.old_listOrganizeDetailId
                obj.old_positionName = element.old_positionName
                obj.old_position_id = element.old_position_id
                obj.com_name = element.new_com_name
                obj.com_id = element.new_com_id
                obj.organizeDetailName = element.new_organizeDetailName
                obj.organizeDetailId = element.new_organizeDetailId
                obj.listOrganizeDetailId = element.new_listOrganizeDetailId
                obj.positionName = element.new_positionName
                obj.position_id = element.position_id
                obj.create_time = await hrService.getDate(element.created_at)
                obj.decision_id = element.decision_id
                obj.note = element.note
                obj.mission = element.mission
                arr.push(obj)
            }
            return res
                .status(200)
                .json({ data: { totalItems: totalCount, items: arr }, error: null })
        }
        return functions.success(res, 'Get list appoint success', {
            totalCount: totalCount,
            data: dataTranferJob,
        })
    } catch (e) {
        console.log(
            '🚀 ~ file: personalChangeController.js:353 ~ exports.getListTranferJob= ~ e:',
            e
        )
        return functions.setError(res, e.message)
    }
}

exports.updateTranferJob = async(req, res, next) => {
    try {
        let infoLogin = req.infoLogin
        let com_id = infoLogin.comId
        let {
            ep_id,
            position_id,
            listOrganizeDetailId,
            organizeDetailId,
            created_at,
            decision_id,
            note,
            update_position_id,
            update_organizeDetailId,
            update_listOrganizeDetailId,
            mission,
            new_com_id,
        } = req.body
        if (!com_id ||
            !ep_id ||
            !update_position_id ||
            !update_organizeDetailId ||
            !update_listOrganizeDetailId ||
            !mission ||
            !new_com_id
        ) {
            return functions.setError(res, 'Missing input value!', 405)
        }

        let fields = {
                ep_id: ep_id,
                com_id: com_id,
                organizeDetailId: organizeDetailId,
                listOrganizeDetailId: listOrganizeDetailId,
                position_id: position_id,
                created_at: created_at,
                decision_id: decision_id,
                note: note,
                mission: mission,
            }
            //update nhan vien
        let company = await Users.findOne({ idQLC: new_com_id, type: 1 })
        if (!company) {
            return functions.setError(res, 'New company not found!', 405)
        }
        let oldCompany = await Users.findOne({ idQLC: com_id, type: 1 })
        if (!oldCompany) {
            return functions.setError(res, 'Old company not found!', 406)
        }
        let employee = await Users.findOneAndUpdate({ idQLC: ep_id, type: { $ne: 1 } }, {
            'inForPerson.employee.com_id': new_com_id,
            'inForPerson.employee.listOrganizeDetailId': update_listOrganizeDetailId,
            'inForPerson.employee.organizeDetailId': update_organizeDetailId,
            'inForPerson.employee.position_id': update_position_id,
        }, { new: true })
        if (!employee) {
            return functions.setError(res, 'Employee not found!', 408)
        }

        let check = await TranferJob.findOne({ com_id: com_id, ep_id: ep_id })
        if (!check) {
            let newIdTranferJob = await functions.getMaxIdByField(TranferJob, '_id')
            const newData = new TranferJob({
                _id: newIdTranferJob,
                ep_id: ep_id,
                com_id: com_id,
                organizeDetailId: organizeDetailId,
                listOrganizeDetailId: listOrganizeDetailId,
                position_id: position_id,
                created_at: created_at,
                decision_id: decision_id,
                note: note,
                mission: mission,
            })
            await newData.save()
        } else {
            await TranferJob.updateOne({
                com_id: com_id,
                ep_id: ep_id,
            }, {
                $set: fields,
            })
        }
        return functions.success(res, 'Update TranferJob success!')
    } catch (e) {
        console.log('Error from server', e)
        return functions.setError(res, e.message)
    }
}

//xoa
exports.deleteTranferJob = async(req, res, next) => {
    try {
        //check quyen
        let infoLogin = req.infoLogin
        let ep_id = req.body.ep_id
        if (!ep_id) {
            return functions.setError(res, 'Missing input value ep_id', 404)
        }
        let tranferJob = await functions.getDataDeleteOne(TranferJob, {
            ep_id: ep_id,
        })
        if (tranferJob.deletedCount === 1) {
            return functions.success(
                res,
                `Delete appoint with ep_id=${ep_id} success`
            )
        }
        return functions.setError(res, 'TranferJob not found', 505)
    } catch (e) {
        return functions.setError(res, e.message)
    }
}

//----------------------------------------------giam bien che

// lay ra danh giam bien che
exports.getListQuitJob = async(req, res, next) => {
    try {
        //check quyen
        let infoLogin = req.infoLogin;
        let com_id = infoLogin.comId;
        let { page, pageSize, ep_id, current_organizeDetailId, current_listOrganizeDetailId, current_position_id, fromDate, toDate } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let listCondition = { hs_com_id: com_id };

        // dua dieu kien vao ob listCondition
        if (ep_id) listCondition.hs_ep_id = Number(ep_id);
        if (current_organizeDetailId) listCondition.hs_organizeDetailId = Number(current_organizeDetailId);
        if (current_listOrganizeDetailId) listCondition.hs_listOrganizeDetailId = { $all: current_listOrganizeDetailId }
        if (current_position_id) listCondition.hs_position_id = Number(current_position_id);
        if (fromDate && !toDate) listCondition.hs_time_end = { $gte: new Date(fromDate) };
        if (toDate && !fromDate) listCondition.hs_time_end = { $lte: new Date(toDate) };
        if (fromDate && toDate) listCondition.hs_time_end = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        let listQuitJob = await functions.pageFind(EmployeeHistory, listCondition, { hs_id: -1 });


        let listResign = [];
        let index = 0;
        for (let i = 0; i < listQuitJob.length; i++) {

            let infoQuitJob = {};
            let quitJob = await QuitJob.findOne({ ep_id: listQuitJob[i].hs_ep_id }).lean();
            if (quitJob) continue;
            infoQuitJob.ep_id = listQuitJob[i].hs_ep_id;
            index++;

            //lay ra ten
            let infoUser = await Users.findOne({ idQLC: listQuitJob[i].hs_ep_id, type: { $ne: 1 } }).lean();
            if (infoUser) infoQuitJob.ep_name = infoUser.userName;

            //lay ra ten tổ chức
            const infoOrganizeDetail = await OrganizeDetail.findOne({ id: listQuitJob[i].hs_organizeDetailId, comId: com_id }).lean()
            if (infoOrganizeDetail) infoQuitJob.organizeDetailName = infoOrganizeDetail.organizeDetailName;
            else infoQuitJob.organizeDetailName = "Chưa cập nhật";

            //lay ra chuc vu
            if (infoUser && infoUser.inForPerson && infoUser.inForPerson.employee) {
                const findPosition = await Positions.findOne({ id: listQuitJob[i].hs_position_id, comId: com_id })
                if (findPosition) infoQuitJob.positionName = findPosition.positionName;
                else infoQuitJob.positionName = "Chưa cập nhật";
            } else {
                infoQuitJob.positionName = "Chưa cập nhật";
            }

            // lay ra ca nghi
            let infoResign = await Resign.findOne({ ep_id: listQuitJob[i].hs_ep_id, com_id: listQuitJob[i].hs_com_id }).lean();

            if (infoResign) {
                let infoShift = await Shifts.findOne({ shift_id: infoResign.shift_id }).lean();

                if (infoShift) infoQuitJob.shift_name = infoShift.shift_name;
                else infoQuitJob.shift_name = "Chưa cập nhật";
                infoQuitJob.type = infoResign.type;
                infoQuitJob.note = infoResign.note;
                infoQuitJob.shift_id = infoResign.shift_id;
                infoQuitJob.decision_id = infoResign.decision_id;
                infoQuitJob.organizeDetailId = listQuitJob[i].hs_organizeDetailId
                infoQuitJob.listOrganizeDetailId = listQuitJob[i].hs_listOrganizeDetailId
                infoQuitJob.position_id = listQuitJob[i].hs_position_id
            } else {
                continue;
            }

            infoQuitJob.time = new Date(listQuitJob[i].hs_time_end).toISOString().slice(0, 10).split('-').reverse().join('/');


            if (skip && index > skip) {
                listResign.push(infoQuitJob);
            } else if (skip === 0) {
                listResign.push(infoQuitJob);
            }
            if (listResign.length === limit) break;
        };

        const total = await EmployeeHistory.aggregate([
            { $match: listCondition },
            {
                $lookup: {
                    from: "HR_QuitJobs",
                    localField: "hs_ep_id",
                    foreignField: "ep_id",
                    as: "quitJob"
                }
            },
            { $match: { quitJob: { $eq: [] } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 }
                }
            }
        ]);
        const totalCount = total.length > 0 ? total[0].total : 0;

        let winform = Number(req.body.winform);
        if (winform == 1) {
            let com_name = '';
            let check = await Users.findOne({ idQLC: com_id, type: 1 }).lean();
            if (check) com_name = check.userName;
            let arr = [];
            for (let i = 0; i < listResign.length; i++) {
                let obj = {};
                const element = listResign[i];
                obj.com_name = com_name;
                obj.com_id = com_id;
                obj.ep_name = element.ep_name;
                obj.ep_id = element.ep_id;
                obj.shift_name = element.shift_name;
                obj.organizeDetailName = element.organizeDetailName;
                obj.organizeDetailId = element.organizeDetailId;
                obj.listOrganizeDetailId = element.listOrganizeDetailId;
                obj.positionName = element.positionName;
                obj.position_id = element.position_id;
                obj.created_at = element.time;
                obj.note = element.note;
                obj.type = element.type;
                obj.shift_id = element.shift_id;
                obj.decision_id = element.decision_id;
                arr.push(obj);
            }
            return res.status(200).json({ data: { totalItems: totalCount, items: arr }, error: null })
        }

        return functions.success(res, "Get list appoint success", { totalCount: totalCount, data: listResign });
    } catch (e) {
        return functions.setError(res, e.message);
    }
}

// cho nhân viên nghỉ việc / giảm biên chế
exports.updateQuitJob = async(req, res, next) => {
    try {
        let infoLogin = req.infoLogin;
        let com_id = infoLogin.comId;
        let { ep_id, created_at, decision_id, note, type, shift_id } = req.body;
        if (ep_id && created_at && type && com_id) {
            let employee = await Users.findOne({ idQLC: ep_id, type: { $ne: 1 } });
            if (employee) {
                if (new Date().getTime() >= new Date(created_at).getTime()) {
                    await Users.findOneAndUpdate({ idQLC: ep_id, type: { $ne: 1 } }, {
                        role: 3,
                        type: 0,
                        inForPerson: {
                            employee: {
                                com_id: 0,
                                position_id: 0,
                                listOrganizeDetailId: [],
                                organizeDetailId: 0,
                                ep_status: "Deny",
                                time_quit_job: functions.convertTimestamp(created_at)
                            }
                        }
                    });
                } else {
                    await Users.findOneAndUpdate({ idQLC: ep_id, type: { $ne: 1 } }, {
                        updatedAt: new Date(created_at).getTime() / 1000,
                        'inForPerson.employee.time_quit_job': functions.convertTimestamp(created_at)
                    }, );
                }
                let fieldsResign = {
                    ep_id: ep_id,
                    com_id: com_id,
                    created_at: created_at,
                    decision_id: decision_id,
                    note: note,
                    shift_id: shift_id,
                    type: type
                }
                let resign = await Resign.findOne({ id: decision_id });
                if (!resign) {
                    let maxIdResign = await functions.getMaxIdByField(Resign, 'id');
                    fieldsResign.id = maxIdResign;
                }

                resign = await Resign.findOneAndUpdate({ ep_id: ep_id }, fieldsResign, { new: true, upsert: true });
                if (resign) {
                    let employee_hs = await EmployeeHistory.findOne({ hs_ep_id: ep_id, hs_com_id: com_id });
                    let hs_time_end = new Date(created_at);
                    let hs_time_start = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.start_working_time : 0;
                    let hs_organizeDetailId = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.organizeDetailId : 0;
                    let hs_listOrganizeDetailId = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.listOrganizeDetailId : [];
                    let hs_position_id = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.position_id : 0;
                    let resign = await Resign.findOne({ ep_id, com_id });
                    let hs_resign_id = 0;
                    if (resign) hs_resign_id = resign.id;
                    if (employee_hs) {
                        employee_hs = await EmployeeHistory.updateOne({ ep_id: ep_id, com_id: com_id }, {
                            hs_time_end,
                            hs_time_start,
                            hs_organizeDetailId,
                            hs_listOrganizeDetailId,
                            hs_position_id,
                            hs_resign_id,
                        });
                    } else {
                        let hs_id = await functions.getMaxIdByField(EmployeeHistory, 'hs_id')
                        employee_hs = new EmployeeHistory({
                            hs_id,
                            hs_com_id: com_id,
                            hs_ep_id: ep_id,
                            hs_time_end,
                            hs_time_start,
                            hs_organizeDetailId,
                            hs_listOrganizeDetailId,
                            hs_position_id,
                            hs_resign_id
                        });
                        employee_hs = await employee_hs.save();
                    }
                    return functions.success(res, "Cho nhan vien nghi viec thanh cong!");
                }
                return functions.setError(res, "Update or Create resign fail!");
            }
            return functions.setError(res, "Employee not found!", 404);
        }
        return functions.setError(res, "Missing input value!", 404);
    } catch (e) {
        console.log("Error from server", e);
        return functions.setError(res, e.message);
    }
}

// cho nhân viên nghỉ việc / giảm biên chế
// exports.updateQuitJob = async (req, res, next) => {
//     try {
//         let comId = req.infoLogin.comId;
//         let ep_id = Number(req.body.ep_id);
//         let current_position = Number(req.body.current_position);
//         let current_dep_id = Number(req.body.current_dep_id);
//         let created_at = new Date(req.body.created_at);
//         let shift_id = Number(req.body.shift_id);
//         let type = Number(req.body.type);
//         let decision_id = Number(req.body.decision_id);
//         let note = req.body.note;
//         let status = req.infoLogin.type;
//         let date = new Date();
//         let year = date.getFullYear().toString();

//         let month = date.getMonth().toString();

//         let day = date.getDate().toString();

//         let dateNow = new Date(year, month, day);

//         if (ep_id && current_position && current_dep_id && created_at && type) {
//             // cho nghỉ vào giờ đang làm.
//             if (created_at.getTime() == dateNow.getTime() && shift_id !== 0) {
//                 let data = await Shifts.findById(shift_id).lean();
//                 if (data) {
//                     let start_time = new Date(data.start_time).getTime();
//                     let end_time = new Date(data.end_time).getTime();
//                     if (start_time < new Date().getTime() && new Date().getTime() < end_time) {
//                         let checkQuitJob = await QuitJobNew.findOne({ ep_id, com_id: comId }).lean();
//                         if (checkQuitJob) {
//                             return functions.setError(res, 'Nhân viên đã được cho nghỉ việc', 400)
//                         } else {
//                             await HR_CrontabQuitJobs.create({
//                                 epID:ep_id,
//                                 comId,
//                                 current_position,
//                                 current_dep_id,
//                                 created_at,

//                             })
//                         }
//                     }
//                 }
//                 return functions.setError(res, 'Không tìm thấy ca làm việc', 404)
//             }
//         }
//         return functions.setError(res, 'Missing data', 400)
//     } catch (error) {
//         return functions.setError(res, error.message)
//     }
// }
//xoa
exports.deleteQuitJob = async(req, res, next) => {
    try {
        //check quyen
        let infoLogin = req.infoLogin
        let ep_id = req.body.ep_id
        if (!ep_id) {
            return functions.setError(res, 'Missing input value ep_id', 404)
        }
        let quitJob = await functions.getDataDeleteOne(EmployeeHistory, {
            hs_ep_id: ep_id,
        })
        if (quitJob.deletedCount === 1) {
            return functions.success(
                res,
                `Delete appoint with ep_id=${ep_id} success`
            )
        }
        return functions.setError(res, 'QuitJob not found', 505)
    } catch (e) {
        console.log('Error from server', e)
        return functions.setError(res, e.message)
    }
}

//----------------------------------------------nghi sai quy dinh

// lay ra danh nghi viec sai quy dinh
exports.getListIllegalQuitJob = async(req, res, next) => {
    try {
        let infoLogin = req.infoLogin;
        let com_id = infoLogin.comId;
        let { page, pageSize, ep_id, current_organizeDetailId, current_listOrganizeDetailId, current_position_id, fromDate, toDate } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let listCondition = { hs_com_id: com_id };

        // dua dieu kien vao ob listCondition
        if (ep_id) listCondition.hs_ep_id = Number(ep_id);
        if (current_organizeDetailId) listCondition.hs_organizeDetailId = Number(current_organizeDetailId);
        if (current_listOrganizeDetailId) listCondition.hs_listOrganizeDetailId = { $all: current_listOrganizeDetailId }
        if (current_position_id) listCondition.hs_position_id = Number(current_position_id);
        if (fromDate && !toDate) listCondition.hs_time_end = { $gte: new Date(fromDate) };
        if (toDate && !fromDate) listCondition.hs_time_end = { $lte: new Date(toDate) };
        if (fromDate && toDate) listCondition.hs_time_end = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        // let listQuitJob = await functions.pageFind(EmployeeHistory, listCondition, { hs_ep_id: -1 }, skip, limit);
        let listQuitJob = await functions.pageFind(EmployeeHistory, listCondition, { hs_ep_id: -1 });
        let data = [];
        let index = 0;
        for (let i = 0; i < listQuitJob.length; i++) {
            infoQuitJob = {};
            let quitJob = await QuitJob.findOne({ ep_id: listQuitJob[i].hs_ep_id });
            if (!quitJob) continue;
            const employee = await Users.findOne({ idQLC: listQuitJob[i].hs_ep_id, type: { $ne: 1 } });
            if (employee) {
                index++;
                infoQuitJob.note = quitJob.note;
                infoQuitJob.ep_id = employee.idQLC;
                infoQuitJob.ep_name = employee.userName;

                //lay ra ten tổ chức
                const infoOrganizeDetail = await OrganizeDetail.findOne({ id: listQuitJob[i].hs_organizeDetailId, comId: com_id }).lean()
                if (infoOrganizeDetail) infoQuitJob.organizeDetailName = infoOrganizeDetail.organizeDetailName;
                else infoQuitJob.organizeDetailName = "Chưa cập nhật";

                //lay ra chuc vu
                if (employee && employee.inForPerson && employee.inForPerson.employee) {
                    const findPosition = await Positions.findOne({ id: listQuitJob[i].hs_position_id, comId: com_id })
                    if (findPosition) infoQuitJob.positionName = findPosition.positionName;
                    else infoQuitJob.positionName = "Chưa cập nhật";
                } else {
                    infoQuitJob.positionName = "Chưa cập nhật";
                }

                infoQuitJob.time = new Date(listQuitJob[i].hs_time_end).toISOString().slice(0, 10).split('-').reverse().join('/');


                if (skip && index > skip) {
                    data.push(infoQuitJob)
                } else if (skip === 0) {
                    data.push(infoQuitJob)
                }
                if (data.length === limit) break;
            }
        }
        const total = await EmployeeHistory.aggregate([
            { $match: listCondition },
            {
                $lookup: {
                    from: "HR_QuitJobs",
                    localField: "hs_ep_id",
                    foreignField: "ep_id",
                    as: "quitJob"
                }
            },
            { $unwind: "$quitJob" },
            {
                $lookup: {
                    from: "Users",
                    localField: "hs_ep_id",
                    foreignField: "idQLC",
                    pipeline: [
                        { $match: { type: { $ne: 1 } } }
                    ],
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 }
                }
            }
        ]);
        const totalCount = total.length > 0 ? total[0].total : 0;
        let winform = Number(req.body.winform);
        if (winform == 1) {

            let arr = [];
            for (let i = 0; i < data.length; i++) {
                let obj = {};
                const element = data[i];
                obj.id_com = com_id;
                obj.ep_name = element.ep_name;
                obj.ep_id = element.ep_id;
                obj.organizeDetailName = element.organizeDetailName;
                obj.organizeDetailId = element.organizeDetailId;
                obj.listOrganizeDetailId = element.listOrganizeDetailId;
                obj.positionName = element.positionName;
                obj.position_id = element.position_id;
                obj.created_at = await hrService.getDate(element.time);
                obj.note = element.note;
                arr.push(obj);
            }
            return res.status(200).json({ data: { totalItems: totalCount, items: arr }, error: null, })
        }
        return functions.success(res, "Get list appoint success", { totalCount: totalCount, data: data });
    } catch (e) {
        console.log(e)
        return functions.setError(res, e.message);
    }
}

//them moi nghi viec sai quy dinh
exports.updateIllegalQuitJob = async(req, res, next) => {
    try {
        let { com_id, ep_id, note, created_at } = req.body;
        if (!com_id) com_id = req.infoLogin.comId;
        if (ep_id && created_at) {
            let employee = await Users.findOne({ idQLC: ep_id });
            if (!employee) return functions.setError(res, "Employee not found!", 405);

            let fields = {
                ep_id: ep_id,
                note: note,
                created_at: created_at
            };
            let check = await QuitJob.findOne({ ep_id: ep_id });
            if (!check) {
                let newIdQuitJobNew = await functions.getMaxIdByField(QuitJob, 'id');
                fields.id = newIdQuitJobNew;
            }

            let quitJob = await QuitJob.findOneAndUpdate({ ep_id: ep_id }, fields, { new: true, upsert: true });
            if (quitJob) {
                await Users.findOneAndUpdate({ idQLC: ep_id }, {
                    role: 3,
                    type: 0,
                    inForPerson: {
                        employee: {
                            com_id: 0,
                            position_id: 0,
                            listOrganizeDetailId: [],
                            organizeDetailId: 0,
                            ep_status: "Deny",
                            time_quit_job: functions.convertTimestamp(created_at)
                        }
                    }
                });

                let employee_hs = await EmployeeHistory.findOne({ hs_ep_id: ep_id, hs_com_id: com_id });

                let hs_time_end = new Date(created_at);
                let hs_time_start = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.start_working_time : 0;
                let hs_organizeDetailId = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.organizeDetailId : 0;
                let hs_listOrganizeDetailId = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.listOrganizeDetailId : [];
                let hs_position_id = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.position_id : 0;
                let resign = await Resign.findOne({ ep_id, com_id });
                let hs_resign_id = 0;
                if (resign) hs_resign_id = resign.id;
                if (employee_hs) {
                    employee_hs = await EmployeeHistory.updateOne({ ep_id: ep_id, com_id: com_id }, {
                        hs_time_end,
                        hs_time_start,
                        hs_organizeDetailId,
                        hs_listOrganizeDetailId,
                        hs_position_id,
                        hs_resign_id,
                    });
                } else {
                    let hs_id = await functions.getMaxIdByField(EmployeeHistory, 'hs_id')
                    employee_hs = new EmployeeHistory({
                        hs_id,
                        hs_com_id: com_id,
                        hs_ep_id: ep_id,
                        hs_time_end,
                        hs_time_start,
                        hs_organizeDetailId,
                        hs_listOrganizeDetailId,
                        hs_position_id,
                        hs_resign_id
                    });
                    employee_hs = await employee_hs.save();
                }
                return functions.success(res, "Update QuitJob success!");
            }
            return functions.setError(res, "QuitJobN not found!", 405);
        }
        return functions.setError(res, "Missing input ep_id or create_at!", 404);

    } catch (e) {
        return functions.setError(res, e.message);
    }
}

//xoa
exports.deleteQuitJobNew = async(req, res, next) => {
    try {
        //check quyen
        let infoLogin = req.infoLogin
        let ep_id = req.body.ep_id
        if (!ep_id) {
            return functions.setError(res, 'Missing input value ep_id', 404)
        }
        let quitJob = await functions.getDataDeleteOne(EmployeeHistory, {
            hs_ep_id: ep_id,
        })
        if (quitJob.deletedCount === 1) {
            return functions.success(
                res,
                `Delete appoint with ep_id=${ep_id} success`
            )
        }
        return functions.setError(res, 'QuitJobNew not found', 505)
    } catch (e) {
        console.log('Error from server', e)
        return functions.setError(res, e.message)
    }
}

exports.getListSalary = async(req, res, next) => {
    try {
        let infoLogin = req.infoLogin
        let { ep_id, fromDate, toDate, page, pageSize } = req.body
        if (!page) page = 1
        if (!pageSize) pageSize = 10
        page = Number(page)
        pageSize = Number(pageSize)

        let condition = { sb_id_com: infoLogin.comId }
        if (ep_id) condition.sb_id_user = ep_id
        if (fromDate && !toDate) condition.sb_time_up = { $gte: new Date(fromDate) }
        if (toDate && !fromDate) condition.sb_time_up = { $lte: new Date(toDate) }
        if (fromDate && toDate)
            condition.sb_time_up = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate),
            }

        let dataLuong = await Salary.find(condition).sort({ sb_time_up: -1 })
        let tangLuong = 0
        let giamLuong = 0
        let arr = []
        if (dataLuong.length !== 0) {
            for (let i = 0; i < dataLuong.length; i++) {
                condition.sb_id_user = dataLuong[i].sb_id_user
                condition.sb_time_up = { $lt: dataLuong[i].sb_time_up }

                checkTangGiam = await Salary.findOne(condition)
                if (
                    checkTangGiam &&
                    dataLuong[i].sb_salary_basic - checkTangGiam.sb_salary_basic > 0
                ) {
                    tangLuong++
                } else if (
                    checkTangGiam &&
                    dataLuong[i].sb_salary_basic - checkTangGiam.sb_salary_basic < 0
                ) {
                    giamLuong++
                }
                if (checkTangGiam) {
                    let tangGiam =
                        dataLuong[i].sb_salary_basic - checkTangGiam.sb_salary_basic
                    checkTangGiam.tangGiam = tangGiam
                    arr.push(checkTangGiam)
                }
            }
        }
        let total = arr.length
        return functions.success(res, 'Get list salary success!', {
            total,
            listSalary: arr,
        })
    } catch (e) {
        console.log('Error from server', e)
        return functions.setError(res, e.message)
    }
}

// crontab quit job
exports.crontabQuitJob = async(req, res, next) => {
    try {
        let checkExists = await Resign.find({
            created_at: { $lte: new Date() },
        }).lean()
        if (checkExists.length > 0) {
            let arr = []
            checkExists.map((item) => {
                arr.push(item.ep_id)
            })
            let check = await Users.updateMany({ idQLC: { $in: arr } }, {
                role: 3,
                type: 0,
                inForPerson: {
                    employee: {
                        com_id: 0,
                        dep_id: 0,
                        group_id: 0,
                        team_id: 0,
                        ep_status: 'Deny',
                    },
                },
            })
            if (check) {
                let Update = check.modifiedCount
                return functions.success(res, 'Thực hiện thành công', {
                    update: Update,
                })
            }
            return functions.setError(
                res,
                'Có lỗi xảy ra trong quá trình cập nhật',
                400
            )
        }
        return functions.setError(res, 'Không có dữ liệu', 404)
    } catch (error) {
        return functions.setError(res, error.message)
    }
}

// danh sách nhân viên giảm biên chế/ Nghỉ việc
exports.getEmResign = async(req, res, next) => {
    try {
        let infoLogin = req.infoLogin
        let com_id = infoLogin.comId
        let data = await Resign.aggregate([
            { $match: { com_id } },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'ep_id',
                    foreignField: 'idQLC',
                    pipeline: [{ $match: { type: { $ne: 1 } } }],
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $lookup: {
                    from: 'QLC_EmployeeHistories',
                    localField: 'id',
                    foreignField: 'hs_resign_id',
                    as: 'QLC_EmployeeHistories',
                },
            },
            {
                $unwind: {
                    path: '$QLC_EmployeeHistories',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'QLC_Deparments',
                    localField: 'QLC_EmployeeHistories.hs_dep_id',
                    foreignField: 'dep_id',
                    as: 'dep',
                },
            },
            { $unwind: { path: '$dep', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    ep_id: 1,
                    ep_name: '$user.userName',
                    dep_name: '$dep.dep_name',
                },
            },
        ])

        let total = data.length
        return res.status(200).json({ data: { totalItems: total, items: data } })
    } catch (error) {
        return functions.setError(res, error.message)
    }
}