const Project = require('../../models/giaoviec365/projects')
const Process = require('../../models/giaoviec365/process')
const Meeting = require('../../models/giaoviec365/meetings')
const File = require('../../models/giaoviec365/tbl_file_tongquan')
const MyJobFileProject = require('../../models/giaoviec365/myjob_file_project')
const MyJobFileProcess = require('../../models/giaoviec365/myjob_file_process')
const ProcessStage = require('../../models/giaoviec365/process_stages');
const StageMission = require('../../models/giaoviec365/stages_missions')
const ProcessOption = require('../../models/giaoviec365/process_option')
const MissionJob = require('../../models/giaoviec365/mission_job')
const JobRepeat = require('../../models/giaoviec365/jobs_repeat');
const JobGroup = require('../../models/giaoviec365/job_groups');
const JobOfJob = require('../../models/giaoviec365/job_of_job');
const Job = require('../../models/giaoviec365/jobs');

const sv = require('../../services/giaoviec365/gvService')
const fs = require('fs')
const functions = require('../../services/functions')
class DeletedDataController {

    //[GET] /deleted-data/quan-ly-du-lieu-da-xoa-gan-day
    async quanLyDuLieuDaXoaGanDay(req, res, next) {
            try {
                if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                    return functions.setError(res, 'Failed to get user data', 401)
                let com_id
                const type = req.user.data.type
                if (type === 1) com_id = req.user.data.idQLC
                if (type === 2) com_id = req.user.data.com_id
                const keywords = req.query.keywords
                const page = req.params.page
                let project = {}
                let process = {}
                let meeting = {}
                let file = {}
                let total = {
                    project: 0,
                    process: 0,
                    meeting: 0,
                    file: 0,
                }
                if (keywords) {
                    project = await sv.findByNameWithDeleted(-1, Project, 'project_name', keywords, { com_id, is_delete: 1 })
                    process = await sv.findByNameWithDeleted(-1, Process, 'process_name', keywords, { com_id, is_delete: 1 })
                    meeting = await sv.findByNameWithDeleted(-1, Meeting, 'name_meeting', keywords, { com_id, is_delete: 1 })
                    file = await sv.findByNameWithDeleted(-1, File, 'name_file', keywords, { com_id, is_delete: 1 })
                    total.project = project.length
                    total.process = process.length
                    total.meeting = meeting.length
                    total.file = file.length
                } else {
                    project = await Project.findWithDeleted({ com_id, is_delete: 1 }).lean()
                    process = await Process.findWithDeleted({ com_id, is_delete: 1 }).lean()
                    meeting = await Meeting.findWithDeleted({ com_id, is_delete: 1 }).lean()
                    file = await File.findWithDeleted({ com_id, is_delete: 1 }).lean()
                    total.project = project.length
                    total.process = process.length
                    total.meeting = meeting.length
                    total.file = file.length
                }
                return functions.success(res, 'Action successfully', {
                    listRole: req.listRole,
                    data: {
                        project,
                        process,
                        meeting,
                        file,
                        total,
                    }
                })
            } catch (err) {
                console.log(err)
                return functions.setError(res, 'Action failed', 501)
            }
        }
        //[GET] /deleted-data/quan-ly-cuoc-hop-da-xoa-gan-day
    async quanLyCuocHopDaXoaGanDay(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const keywords = req.query.keywords
            const page = req.params.page
            let meeting = {}
            let total
            if (keywords) {
                meeting = await sv.findByNameWithDeleted(-1, Meeting, 'name_meeting', keywords, { com_id, is_delete: 1 })
                total = meeting.length
            } else {
                meeting = await Meeting.findWithDeleted({ com_id, is_delete: 1 }).lean()
                total = meeting.length
            }
            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {
                    meeting,
                    total,
                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    //[PUT] /deleted-data/quan-ly-cuoc-hop-da-xoa-gan-day/restore
    async khoiPhucCuocHop(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const listId = JSON.parse(req.body.list_check)
            await Meeting.updateManyWithDeleted({
                com_id,
                id: { $in: listId },
                is_delete: 1,
            }, {
                deleted: false,
                is_delete: 0,
            })

            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {

                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    //[DELETE] /deleted-data/quan-ly-cuoc-hop-da-xoa-gan-day/force-delete
    async xoaVinhVienCuocHop(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const listId = JSON.parse(req.body.list_check)
            await Meeting.deleteMany({
                com_id,
                id: { $in: listId },
                is_delete: 1,
            })

            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {

                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    //[GET] /deleted-data/quan-ly-du-an-da-xoa-gan-day
    async quanLyDuAnDaXoaGanDay(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const keywords = req.query.keywords
            const page = req.params.page
            let project = {}
            let total
            if (keywords) {
                project = await sv.findByNameWithDeleted(-1, Project, 'project_name', keywords, { com_id, is_delete: 1 })
                total = project.length
            } else {
                project = await Project.findWithDeleted({ com_id, is_delete: 1 }).lean()
                total = project.length
            }
            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {
                    project,
                    total,
                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    //[PUT] /deleted-data/quan-ly-du-an-da-xoa-gan-day/restore
    async khoiPhucDuAn(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const listId = JSON.parse(req.body.list_check)
            await Project.updateManyWithDeleted({
                com_id,
                project_id: { $in: listId },
                is_delete: 1,
            }, {
                deleted: false,
                is_delete: 0,
            })

            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {

                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    //[DELETE] /deleted-data/quan-ly-du-an-da-xoa-gan-day/force-delete
    async xoaVinhVienDuAn(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const listId = JSON.parse(req.body.list_check)
            await Project.deleteMany({
                com_id,
                project_id: { $in: listId },
                is_delete: 1,
            })
            await JobRepeat.deleteMany({
                com_id,
                project_id: { $in: listId },
            })
            await JobGroup.deleteMany({
                com_id,
                project_id: { $in: listId },
            })
            await JobOfJob.deleteMany({
                com_id,
                project_id: { $in: listId },
            })
            await Job.deleteMany({
                com_id,
                project_id: { $in: listId },
            })


            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {

                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    //[GET] /deleted-data/quan-ly-quy-trinh-da-xoa-gan-day
    async quanLyQuyTrinhDaXoaGanDay(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const keywords = req.query.keywords
            const page = req.params.page
            let process = {}
            let total
            if (keywords) {
                process = await sv.findByNameWithDeleted(-1, Process, 'process_name', keywords, { com_id, is_delete: 1 })
                total = process.length
            } else {
                process = await Process.findWithDeleted({ com_id, is_delete: 1 }).lean()
                total = process.length
            }
            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {
                    process,
                    total,
                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    //[PUT] /deleted-data/quan-ly-quy-trinh-da-xoa-gan-day/restore
    async khoiPhucQuyTrinh(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const listId = JSON.parse(req.body.list_check)
            await Process.updateManyWithDeleted({
                com_id,
                process_id: { $in: listId },
                is_delete: 1,
            }, {
                deleted: false,
                is_delete: 0,
            })

            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {

                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    //[DELETE] /deleted-data/quan-ly-quy-trinh-da-xoa-gan-day/force-delete
    async xoaVinhVienQuyTrinh(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const listId = JSON.parse(req.body.list_check)
            await Process.deleteMany({
                com_id,
                process_id: { $in: listId },
                is_delete: 1,
            })
            await ProcessStage.deleteMany({
                com_id,
                process_id: { $in: listId },
            })
            await StageMission.deleteMany({
                com_id,
                process_id: { $in: listId },
            })
            await ProcessOption.deleteMany({
                com_id,
                process_id: { $in: listId },
            })
            await MissionJob.deleteMany({
                com_id,
                process_id: { $in: listId },
            })
            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {

                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    //[GET] /deleted-data/quan-ly-tai-lieu-da-xoa-gan-day
    async quanLyTaiLieuDaXoaGanDay(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const keywords = req.query.keywords
            const page = req.params.page
            let file = {}
            let total
            if (keywords) {
                file = await sv.findByNameWithDeleted(-1, File, 'name_file', keywords, { com_id, is_delete: 1 })
                total = file.length
            } else {
                file = await File.findWithDeleted({ com_id, is_delete: 1 }).lean()
                total = file.length
            }
            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {
                    file,
                    total,
                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    //[PUT] /deleted-data/quan-ly-tai-lieu-da-xoa-gan-day/restore
    async khoiPhucTaiLieu(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user || !req.user.data || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            const com_id = req.user.data.idQLC
            const listId = JSON.parse(req.body.list_check)
            await File.updateManyWithDeleted({
                com_id,
                id: { $in: listId },
                is_delete: 1,
            }, {
                deleted: false,
                is_delete: 0,
            })

            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {

                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    //[DELETE] /deleted-data/quan-ly-tai-lieu-da-xoa-gan-day/force-delete
    async xoaVinhVienTaiLieu(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user || !req.user.data || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            const com_id = req.user.data.idQLC
            const listId = JSON.parse(req.body.list_check)
            const file = await File.findWithDeleted({
                com_id,
                id: { $in: listId },
                is_delete: 1,
            }, {
                id: 1,
                type_project: 1,
                name_file: 1,
                _id: 0,
            })
            if (!file) return functions.setError(res, 'Không tìm thấy file', 404)
            file.forEach(async(value) => {
                if (value.type_project === 1) {
                    console.log('1')
                    const path = `../storage/base365/giaoviec365/Project/${value.name_file}`
                    try {
                        await fs.unlinkSync(path)
                    } catch (e) {
                        console.log(e)
                        return functions.setError(res, 'Không tìm thấy file', 404)
                    }
                    await MyJobFileProject.deleteOne({ id: value.id })
                } else
                if (value.type_project === 2) {
                    console.log('2')
                    const path = `../storage/base365/giaoviec365/Process/${value.name_file}`
                    try {
                        await fs.unlinkSync(path)
                    } catch (e) {
                        console.log(e)
                        return functions.setError(res, 'Không tìm thấy file', 404)
                    }
                    await MyJobFileProcess.deleteOne({ id: value.id })
                } else {
                    const path = `../storage/base365/giaoviec365/Job/${value.name_file}`
                    try {
                        await fs.unlinkSync(path)
                    } catch (e) {
                        console.log(e)
                        return functions.setError(res, 'Không tìm thấy file', 404)
                    }
                }
            })
            await File.deleteMany({
                com_id,
                id: { $in: listId },
                is_delete: 1,
            })

            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {

                }
            })
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Action failed', 501)
        }
    }

}

module.exports = new DeletedDataController()