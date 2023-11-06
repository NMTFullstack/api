const Process = require('../../models/giaoviec365/process');
const ProcessStages = require('../../models/giaoviec365/process_stages');
const Project = require('../../models/giaoviec365/projects');
const Job = require('../../models/giaoviec365/jobs');
const StageOptions = require('../../models/giaoviec365/stage_option');
const ProcessStage = require('../../models/giaoviec365/process_stages');
const JobGroup = require('../../models/giaoviec365/job_groups');
const MissionJob = require('../../models/giaoviec365/mission_job')
const StageMission = require('../../models/giaoviec365/stages_missions')
const MyJobFileProject = require('../../models/giaoviec365/myjob_file_project')
const MyJobFileProcess = require('../../models/giaoviec365/myjob_file_process')
const JobOfJob = require('../../models/giaoviec365/job_of_job');
const ProcessOption = require('../../models/giaoviec365/process_option')
const TblFileTongQuan = require('../../models/giaoviec365/tbl_file_tongquan')
const JobComment = require('../../models/giaoviec365/job_comments')
const MissionComment = require('../../models/giaoviec365/mission_comments')
const User = require('../../models/Users')
const Position = require('../../models/qlc/Positions')
const functions = require('../../services/functions');
const gv = require('../../services/giaoviec365/gvService')

class MeController {

    //[GET] /me/cong-viec-cua-toi
    async congViecCuaToi(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const page = req.params.page
            const user_id = req.user.data._id.toString()
            let job = []
            let stageMission = []
            const keywords = req.query.keywords
            stageMission = await StageMission.aggregate([{
                    $match: {
                        com_id,
                        misssion_staff_id: { $regex: user_id },
                        name_misssion: { $regex: keywords },
                    }
                },
                {
                    $sort: { created_at: -1 }
                },
                {
                    $lookup: {
                        from: 'gv365processes',
                        let: { process_id: '$process_id' },
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$process_id', '$$process_id'] },
                                        { $eq: ['$deleted', false] }
                                    ]
                                }
                            }
                        }],
                        as: 'process'
                    }
                },
                { $unwind: '$process' },
                { $project: { process: 0 } }
            ])
            job = await Job.aggregate([{
                        $match: {
                            com_id,
                            job_member: { $regex: user_id },
                            job_name: { $regex: keywords },
                        }
                    },
                    {
                        $sort: { created_at: -1 }
                    },
                    {
                        $lookup: {
                            from: 'gv365projects',
                            let: { project_id: '$project_id' },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$project_id', '$$project_id'] },
                                            { $eq: ['$deleted', false] }
                                        ]
                                    }
                                }
                            }],
                            as: 'project'
                        }
                    },
                    { $unwind: '$project' },
                    { $project: { project: 0 } }
                ])
                // if(keywords){
                // 	job = await gv.findByName(-1, Job, 'job_name', keywords, {
                // 		com_id,
                // 		job_member: {$regex: user_id}
                // 	},{},'created_at')
                // 	stageMission = await gv.findByName(-1, StageMission, 'name_misssion', keywords, {
                // 		com_id,
                // 		misssion_staff_id: {$regex: user_id}
                // 	},{},'created_at')
                // }
                // else{
                //     job = await Job.find({
                //         com_id,
                // 		job_member: {$regex: user_id}
                //     }).sort({created_at: -1}).lean()
                // 	stageMission = await StageMission.find({
                // 		com_id,
                // 		misssion_staff_id: {$regex: user_id}
                // 	}).sort({created_at: -1}).lean()
                // }
            job.forEach(value => {
                value.type = 1
            })
            stageMission.forEach(value => {
                value.type = 2
            })
            const list = [...job, ...stageMission]
            const total = list.length
            const listEp = await User.find({
                // com_id,
                'inForPerson.employee.com_id': com_id,
                type: 2,
            }, {
                _id: 1,
                userName: 1,
            })
            return functions.success(res, "Action successfully", {
                listRole: req.listRole,
                data: {
                    list,
                    total,
                    listEp,
                }
            })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed", 500)
        }
    }

    //[GET] /me/chi-tiet-cong-viec-cua-toi/project/:id
    async chiTietCongViecProject(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            const user_id = req.user.data._id
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            if (!req.params.id) return functions.setError(res, 'Do not found job_id')
            const job_id = Number(req.params.id)
            const job = await Job.findOne({
                com_id,
                job_id,
                job_member: { $regex: user_id }
            }, {
                project_id: 1,
                job_name: 1,
                job_description: 1,
                job_member: 1,
                job_follow: 1,
                date_start: 1,
                date_end: 1,
                time_in: 1,
                time_out: 1,
                process_percent: 1,
                nhanvien_danhgia: 1,
                quanli_danhgia: 1,
                id_giaoviec: 1,
                _id: 0,
            }).lean()
            if (!job) return functions.setError(res, 'Do not found job');
            let project_management
            let project_name = ''
            const project_id = job.project_id ? job.project_id : null
            if (project_id) {
                const project = await Project.findOne({ project_id })
                project_management = project.project_management
                project_name = project.project_name
            } else {
                const project = await Project.findOne({ project_id: job_id }, 'project_management')
                project_management = project.project_management
            }

            const managementData = project_management ? project_management.split(',') : []
            for (let i = 0; i < managementData.length; i++) {
                managementData[i] = await User.findOne({ _id: Number(managementData[i]) }, {
                    _id: 1,
                    userName: 1,
                    'inForPerson.employee.position_id': 1
                }).lean()
                if (managementData[i]) {
                    const position = await Position.findOne({ id: managementData[i].inForPerson.employee.position_id })
                    if (position) managementData[i].inForPerson.employee.position_id = position.positionName
                    else managementData[i].inForPerson.employee.position_id = 'Trống'
                }
            }

            const id_member = job.job_member ? job.job_member : null
            const memberData = User.findOne({ _id: id_member }).lean()

            let jobDetail = {}

            const jobOfJobData = JobOfJob.aggregate([{
                    $match: { job_id, com_id }
                },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'staff_id',
                        foreignField: '_id',
                        as: 'staff',
                    }
                }, { $unwind: '$staff' },
                {
                    $project: {
                        'id': '$id',
                        'job_name_job': '$job_name_job',
                        'staff_id': '$staff_id',
                        'staff_name': '$staff.userName',
                        'status': '$status',
                        'date_limit': '$date_limit',
                        'hour_limit': '$hour_limit',
                    }
                }
            ])

            const jobFileData = MyJobFileProject.find({ job_id }, {
                _id: 0,
                id: 1,
                name_file: 1,
            }).lean()

            const jobCommentData = JobComment.aggregate([{
                    $match: { job_id, com_id }
                },
                {
                    $addFields: { staff_id_num: { $toInt: '$staff_id' } }
                },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'staff_id_num',
                        foreignField: '_id',
                        as: 'staff',
                    }
                }, { $unwind: '$staff' },
                {
                    $project: {
                        'id': '$id',
                        'conent': '$conent',
                        'staff_id': '$staff_id',
                        'staff_name': '$staff.userName',
                        'position': '$staff.inForPerson.employee.position_id',
                        'com_id': '$com_id',
                        'created_at': '$created_at',
                        'updated_at': '$updated_at',
                    }
                }
            ])

            const [
                jobOfJob,
                jobFile,
                jobComment,
                member,
            ] = await Promise.all([
                jobOfJobData,
                jobFileData,
                jobCommentData,
                memberData,
            ])
            if (member) {
                const position = await Position.findOne({ id: member.inForPerson.employee.position_id })
                if (position) member.inForPerson.employee.position_id = position.positionName
                else member.inForPerson.employee.position_id = 'Trống'
            }
            if (jobComment) {
                for (let i = 0; i < jobComment.length; i++) {
                    const position = await Position.findOne({ id: jobComment.position })
                    if (position) jobComment.position = position.positionName
                    else jobComment.position = 'Trống'
                }
            }
            jobDetail = {
                ...job,
                project_name,
                project_management: managementData,
                job_member: {
                    id: member._id,
                    name: member.userName,
                    position: member.inForPerson.employee.position_id
                },
                project_id,
                jobOfJob,
                jobFile,
                jobComment,
            }
            return functions.success(res, "Action successfully", {
                listRole: req.listRole,
                data: {
                    jobDetail
                }
            })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failure!!", 501)
        }
    }

    // [POST] /projects/chi-tiet-du-an/:id/add-file
    async themFileCongViec(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const upload_by = req.user.data._id
            if (req.files.length) {
                const job_id = req.params.id
                const job = await Job.findOne({ job_id }, {
                    _id: 0,
                    project_id: 1,
                    job_group_id: 1,
                })
                if (!job) return functions.setError(res, "Failed to get data", 401)
                const project_id = job.project_id
                const job_group_id = job.job_group_id
                const now = functions.getTimeNow()
                const filesNum = req.files.length
                for (let i = 0; i < filesNum; i++) {
                    let myJobFileMaxId = await functions.getMaxIdByFieldWithDeleted(MyJobFileProject, 'id')
                    let fileTongQuanMaxId = await functions.getMaxIdByFieldWithDeleted(TblFileTongQuan, 'id')
                    const maxId = myJobFileMaxId >= fileTongQuanMaxId ? myJobFileMaxId : fileTongQuanMaxId

                    const myJobFileProject = new MyJobFileProject({
                        id: maxId,
                        job_id,
                        project_id,
                        job_group_id,
                        created_at: now,
                        name_file: req.files[i].filename,
                        upload_by,
                    })
                    await myJobFileProject.save()

                    const tblFileTongQuan = new TblFileTongQuan({
                        id: maxId,
                        name_file: req.files[i].filename,
                        size_file: req.files[i].size,
                        com_id,
                        created_id: upload_by,
                        created_by: type,
                        created_at: now,
                        type_project: 1
                    })
                    await tblFileTongQuan.save()
                }
            } else return functions.setError(res, "Invalid files")
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [DELETE] /me/chi-tiet-cong-viec-cua-toi/project/:id/delete-file/:fileId
    async xoaFileCongViec(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const id = req.params.fileId
            const job_id = req.params.id
            await MyJobFileProject.updateOneWithDeleted({ id, job_id }, {
                is_delete: 1,
            })
            await MyJobFileProject.delete({ id, job_id })
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [GET] /me/chi-tiet-cong-viec-cua-toi/project/:id/download-file/:fileId
    async taiFileCongViec(req, res, next) {
        try {
            const job_id = req.params.id
            const id = req.params.fileId
            const file = await MyJobFileProject.findOne({ id, job_id }, { _id: 0, name_file: 1 })
            if (!file) return functions.setError(res, 'Không tìm thấy file', 404)
            else {
                const nameFile = file.name_file
                return res.download(`../storage/base365/giaoviec365/Project/${nameFile}`)
            }
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Action failed!!', 501)
        }
    }

    // [POST] /me/chi-tiet-cong-viec-cua-toi/project/:id/add-comment
    async themBinhLuanCongViec(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const staff_id = req.user.data._id
            const job_id = req.params.id
            const id = await functions.getMaxIdByFieldWithDeleted(JobComment, 'id')
            const now = functions.getTimeNow()
            if (!req.body.content)
                return functions.setError(res, 'Bình luận không hợp lệ', 400)
            const conent = req.body.content
            const jobComment = new JobComment({
                id,
                job_id,
                staff_id,
                com_id,
                conent,
                created_at: now,
            })
            await jobComment.save()
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [DELETE] /me/chi-tiet-cong-viec-cua-toi/project/:id/:commentId
    async xoaBinhLuanCongViec(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const job_id = req.params.id
            const now = functions.getTimeNow()
            const id = req.params.commentId
            await JobComment.updateOneWithDeleted({ id, job_id }, {
                deleted_at: now,

            })
            await JobComment.delete({ com_id, id })
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    //[put] /me/chi-tiet-cong-viec-cua-toi/project/:id/cap-nhap-danh-gia
    async CapNhapDanhGiaDuAn(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            const job_id = req.params.id;
            const managerEvaluate = req.body.managerEvaluate;
            const employeeEvaluate = req.body.employeeEvaluate;
            await Job.updateOne({
                job_id,
            }, {
                ...(managerEvaluate ?
                    {
                        quanli_danhgia: managerEvaluate,
                    } :
                    {}),
                ...(employeeEvaluate ?
                    {
                        nhanvien_danhgia: employeeEvaluate,
                    } :
                    {}),
            });
            return functions.success(
                res,
                'Update evaluate in the Job is successfully', { listRole: req.listRole, }
            );
        } catch (e) {
            return functions.setError(res, e.message);
        }
    }

    //[put] /me/chi-tiet-cong-viec-cua-toi/project/:id/chinh-sua-ket-qua
    async thayDoiKetQuaDuAn(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            const type = req.user.data.type
            let com_id
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const job_id = req.params.id;
            const percentComplete = req.body.percentComplete;
            let isComplete = false;
            if (percentComplete == 100) isComplete = true;
            if (!isComplete) {
                await Job.updateOne({
                    job_id,
                }, {
                    process_percent: percentComplete,
                });
            } else {
                await Job.updateOne({
                    job_id,
                }, {
                    process_percent: percentComplete,
                    status: 2,
                    status_or_late: 2,
                });
            }
            return functions.success(res, 'Updated data is successfully', { listRole: req.listRole, });
        } catch (e) {
            return functions.setError(res, e.message);
        }
    }

    // [POST] /me/chi-tiet-cong-viec-cua-toi/project/:id/add-job-of-job
    async themJobOfJob(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const congty_or_nhanvien = req.user.data.type
            const id_giaoviec = req.user.data._id
            const job_id = req.params.id
            if (!req.body.job_name_job || !req.body.staff_id || !req.body.date_limit || !req.body.hour_limit)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                job_name_job,
                date_limit,
                hour_limit,
            } = req.body
            const job = await Job.findOne({
                job_id,
                com_id,
            }, {
                date_start: 1,
                date_end: 1,
                time_in: 1,
                time_out: 1,
                job_member: 1,
                project_id: 1,
                _id: 0
            })
            const timeLimit = functions.replaceDay(date_limit + ' ' + hour_limit).getTime() / 1000
            const timeLimitStart = functions.replaceDay(job.date_start + ' ' + job.time_in).getTime() / 1000
            const timeLimitEnd = functions.replaceDay(job.date_end + ' ' + job.time_out).getTime() / 1000
            if (timeLimit <= timeLimitStart || timeLimit >= timeLimitEnd)
                return functions.setError(res,
                    `Vui lòng nhập vào thời gian trong khoảng từ ${job.date_start+ ' ' + job.time_in} đến ${job.date_end+ ' ' + job.time_out}`,
                )
            const project_id = job.project_id
            const staff_id = Number(job.job_member)
            const id = await functions.getMaxIdByField(JobOfJob, 'id')
            const jobOfJob = new JobOfJob({
                job_name_job,
                date_limit,
                hour_limit,
                com_id,
                project_id,
                staff_id,
                job_id,
                id,
                congty_or_nhanvien,
                id_giaoviec,
            })
            await jobOfJob.save()
            return functions.success(res, "Action successfully", {
                listRole: req.listRole,
                data: {
                    jobOfJob
                }
            })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [PUT] /me/chi-tiet-cong-viec-cua-toi/project/:id/edit-job-of-job/:jojId
    async suaJobOfJob(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const id = req.params.jojId
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const job_id = req.params.id
            if (!req.body.job_name_job || !req.body.staff_id || !req.body.date_limit || !req.body.hour_limit)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                job_name_job,
                date_limit,
                hour_limit,
            } = req.body
            const job = await Job.findOne({
                job_id,
                com_id,
            }, {
                date_start: 1,
                date_end: 1,
                time_in: 1,
                time_out: 1,
                job_member: 1,
                project_id: 1,
                _id: 0
            })
            const timeLimit = functions.replaceDay(date_limit + ' ' + hour_limit).getTime() / 1000
            const timeLimitStart = functions.replaceDay(job.date_start + ' ' + job.time_in).getTime() / 1000
            const timeLimitEnd = functions.replaceDay(job.date_end + ' ' + job.time_out).getTime() / 1000
            if (timeLimit <= timeLimitStart || timeLimit >= timeLimitEnd)
                return functions.setError(res,
                    `Vui lòng nhập vào thời gian trong khoảng từ ${job.date_start+ ' ' + job.time_in} đến ${job.date_end+ ' ' + job.time_out}`,
                )
            await JobOfJob.updateOne({ id, com_id }, {
                job_name_job,
                date_limit,
                hour_limit,
            })
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [PUT] /me/chi-tiet-cong-viec-cua-toi/project/:id/delete-job-of-job/:jojId
    async xoaJobOfJob(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const id = req.params.jojId
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            await JobOfJob.deleteOne({ id, com_id })
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [PUT] /me/chi-tiet-cong-viec-cua-toi/project/:id/switch-job-of-job/:jojId
    async switchJobOfJob(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const id = req.params.jojId
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const job = await JobOfJob.findOne({ id, com_id })
            if (job) {
                if (job.status === 1)
                    await JobOfJob.updateOne({ id, com_id }, { status: 0 })
                if (job.status === 0)
                    await JobOfJob.updateOne({ id, com_id }, { status: 1 })
            }
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [GET] /me/chi-tiet-cong-viec-cua-toi/process/:id
    async chiTietCongViecProcess(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const user_id = req.user.data._id.toString()
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const mission_id = Number(req.params.id);
            if (!mission_id) return functions.setError(res, 'Do not found mission id');
            const mission = await StageMission.aggregate([{
                    $match: {
                        id: mission_id,
                        com_id,
                        misssion_staff_id: { $regex: user_id },
                    }
                },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'id_giaovien',
                        foreignField: '_id',
                        as: 'manager'
                    }
                },
                { $unwind: { path: '$manager', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        'id': '$id',
                        'stage_id': '$stage_id',
                        'process_id': '$process_id',
                        'name_misssion': '$name_misssion',
                        'card': '$card',
                        'misssion_description': '$misssion_description',
                        'misssion_staff_id': '$misssion_staff_id',
                        'misssion_repeat': '$misssion_repeat',
                        'is_delete': '$is_delete',
                        'deleted_at': '$deleted_at',
                        'created_at': '$created_at',
                        'updated_at': '$updated_at',
                        'change_stage_at': '$change_stage_at',
                        'hour_complete': '$hour_complete',
                        'quanli_danhgia': '$quanli_danhgia',
                        'nhanvien_danhgia': '$nhanvien_danhgia',
                        'com_id': '$com_id',
                        'first_member': '$first_member',
                        'failed_reason': '$failed_reason',
                        'result_job': '$result_job',
                        'id_giaoviec': '$id_giaovien',
                        'name_giaoviec': '$manager.userName',
                        'congty_or_nhanvien': '$congty_or_nhanvien',
                    }
                }
            ])
            if (!mission.length) return functions.setError(res, 'Do not found mission');
            let process_management
            let process_name = ''
            let date_start, date_end, time_in, time_out
            const process_id = mission[0] ? mission[0].process_id : null;
            const stageId = mission ? mission.stage_id : null;
            if (process_id) {
                const process = await Process.findOne({ process_id })
                if (!process) return functions.setError(res, 'Do not found process')
                process_management = process.process_management
                process_name = process.process_name
                date_start = process.date_start
                date_end = process.date_end
                time_in = process.time_in
                time_out = process.time_out
            }
            const managementData = process_management ? process_management.split(',') : []
            for (let i = 0; i < managementData.length; i++) {
                managementData[i] = await User.findOne({ _id: Number(managementData[i]) }, {
                    _id: 1,
                    userName: 1,
                    'inForPerson.employee.position_id': 1
                }).lean()
            }
            // const id_management = process_management?process_management:null
            // const managementData = User.findOne({_id: id_management}).lean()
            const id_member = mission[0] ? mission[0].misssion_staff_id : null
            const memberData = User.findOne({ _id: id_member }).lean()

            let missionDetail = {}
            const missionJobData = MissionJob.aggregate([{
                    $match: { mission_id, com_id }
                },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'staff_id',
                        foreignField: '_id',
                        as: 'staff',
                    }
                }, { $unwind: '$staff' },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'id_giaoviec',
                        foreignField: '_id',
                        as: 'management',
                    }
                }, { $unwind: '$management' },
                {
                    $project: {
                        'id': '$id',
                        'process_id': '$process_id',
                        'mission_id': '$mission_id',
                        'job_name': '$job_name',
                        'staff_id': '$staff_id',
                        'staff_name': '$staff.userName',
                        'status': '$status',
                        'date_limit': '$date_limit',
                        'hour_limit': '$hour_limit',
                        'id_giaoviec': '$id_giaoviec',
                        'name_giaoviec': '$management.userName',
                        'congty_or_nhanvien': '$congty_or_nhanvien',
                        'nhanvien_danhgia': '$nhanvien_danhgia',
                        'quanli_danhgia': '$quanli_danhgia',
                        'process_percent': '$process_percent',
                        'status_or_late': '$status_or_late',
                        'com_id': '$com_id',
                        'hoanthanhluc': '$hoanthanhluc',
                        'created_at': '$created_at',
                        'card_job': '$card_job',
                    }
                }
            ])

            const missionFileData = MyJobFileProcess.find({ mission_id }, {
                _id: 0,
                id: 1,
                name_file: 1,
            }).lean()

            const missionCommentData = MissionComment.aggregate([{
                    $match: { mission_id, com_id }
                },
                {
                    $addFields: { staff_id_num: { $toInt: '$staff_id' } }
                },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'staff_id_num',
                        foreignField: '_id',
                        as: 'staff',
                    }
                }, { $unwind: '$staff' },
                {
                    $project: {
                        'id': '$id',
                        'content': '$content',
                        'staff_id': '$staff_id',
                        'staff_name': '$staff.userName',
                        'com_id': '$com_id',
                        'created_at': '$created_at'
                    }
                }
            ])

            const [
                missionJob,
                missionFile,
                missionComment,
                member,
            ] = await Promise.all([
                missionJobData,
                missionFileData,
                missionCommentData,
                memberData,
            ])
            missionDetail = {
                date_start,
                date_end,
                time_in,
                time_out,
                ...mission[0],
                process_name,
                // process_management: {
                //     id: management._id,
                //     name: management.userName,
                //     position: management.inForPerson.employee.position_id
                // },
                process_management: managementData,
                misssion_staff_id: {
                    id: member._id,
                    name: member.userName,
                    position: member.inForPerson.employee.position_id
                },
                process_id,
                missionJob,
                missionFile,
                missionComment,
            }

            return functions.success(res, 'Get successfully the data', {
                listRole: req.listRole,
                missionDetail,
            });
        } catch (err) {
            console.log(err)
            return functions.setError(res, 'Cannot get the data', 403);
        }
    }

    //[put] /me/chi-tiet-cong-viec-cua-toi/process/:id/chinh-sua-ket-qua
    async thayDoiKetQuaNhiemVu(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const missionId = req.params.id;
            const percentComplete = req.body.percentComplete;
            let isComplete = false;
            if (percentComplete == 100) isComplete = true;
            if (!isComplete) {
                await StageMission.updateOne({
                    id: missionId,
                }, {
                    result_job: percentComplete,
                });
            } else {
                await StageMission.updateOne({
                    id: missionId,
                }, {
                    result_job: percentComplete,
                    stage_id: 111,
                });
            }
            return functions.success(res, 'Updated data is successfully', { listRole: req.listRole, });
        } catch (e) {
            return functions.setError(res, e.message);
        }
    }

    // [POST] /me/chi-tiet-cong-viec-cua-toi/process/:id/add-mission-job
    async themMissionJob(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const congty_or_nhanvien = req.user.data.type
            const id_giaoviec = req.user.data._id
            const mission_id = req.params.id
            if (!req.body.job_name || !req.body.date_limit || !req.body.hour_limit)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                job_name,
                date_limit,
                hour_limit,
            } = req.body
            const stageMission = await StageMission.findOne({
                id: mission_id,
                com_id,
            }, {
                hour_complete: 1,
                misssion_staff_id: 1,
                process_id: 1,
                _id: 0
            })
            const now = functions.getTimeNow()
            const timeLimit = functions.replaceDay(date_limit + ' ' + hour_limit).getTime() / 1000
            const hour_complete = stageMission ? stageMission.hour_complete : 0
            if (timeLimit > hour_complete)
                return functions.setError(res,
                    `Vui lòng nhập vào thời gian hợp lệ`,
                )
            const process_id = stageMission ? stageMission.process_id : 0
            const staff_id = stageMission ? Number(stageMission.misssion_staff_id) : 0
            const id = await functions.getMaxIdByField(MissionJob, 'id')
            const missionJob = new MissionJob({
                job_name,
                date_limit,
                hour_limit,
                com_id,
                process_id,
                staff_id,
                mission_id,
                id,
                congty_or_nhanvien,
                created_at: now,
                id_giaoviec,
            })
            await missionJob.save()
            return functions.success(res, "Action successfully", {
                listRole: req.listRole,
                data: {
                    missionJob
                }
            })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [POST] /me/chi-tiet-cong-viec-cua-toi/process/:id/edit-mission-job/:missionJobId
    async suaMissionJob(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const mission_id = req.params.id
            if (!req.body.job_name || !req.body.date_limit || !req.body.hour_limit)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const id = req.params.missionJobId
            const {
                job_name,
                date_limit,
                hour_limit,
            } = req.body
            const stageMission = await StageMission.findOne({
                id: mission_id,
                com_id,
            }, {
                hour_complete: 1,
                misssion_staff_id: 1,
                process_id: 1,
                _id: 0
            })
            const process_id = stageMission ? stageMission.process_id : 0
            const now = functions.getTimeNow()
            const timeLimit = functions.replaceDay(date_limit + ' ' + hour_limit).getTime() / 1000
            const hour_complete = stageMission ? stageMission.hour_complete : 0
            if (timeLimit > hour_complete)
                return functions.setError(res,
                    `Vui lòng nhập vào thời gian hợp lệ`,
                )
            await MissionJob.updateOne({
                id,
                process_id,
            }, {
                job_name,
                date_limit,
                hour_limit,
            })
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    //[delete] /me/chi-tiet-cong-viec-cua-toi/process/:id/delete-mission-job/:missionJobId
    async xoaMissionJob(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const mission_id = req.params.id
            const id = req.params.missionJobId;
            await MissionJob.deleteOne({
                id,
                mission_id
            });
            return functions.success(
                res,
                'Delete SubJob in the Mission is successfully', { listRole: req.listRole, }
            );
        } catch (e) {
            return functions.setError(res, e.message);
        }
    }

    //[put] /me/chi-tiet-cong-viec-cua-toi/process/:id/cap-nhap-danh-gia
    async CapNhapDanhGia(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            const missionId = req.params.id;
            const managerEvaluate = req.body.managerEvaluate;
            const employeeEvaluate = req.body.employeeEvaluate;
            await StageMission.updateOne({
                id: missionId,
            }, {
                ...(managerEvaluate ?
                    {
                        quanli_danhgia: managerEvaluate,
                    } :
                    {}),
                ...(employeeEvaluate ?
                    {
                        nhanvien_danhgia: employeeEvaluate,
                    } :
                    {}),
            });
            return functions.success(
                res,
                'Update evaluate in the Mission is successfully', { listRole: req.listRole, }
            );
        } catch (e) {
            return functions.setError(res, e.message);
        }
    }

    //[post] /me/chi-tiet-cong-viec-cua-toi/process/:id/them-comment
    async themBinhLuanNhiemVu(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const missionId = req.params.id;
            if (!req.body.content)
                return functions.setError(res, 'Bình luận không hợp lệ')
            const content = req.body.content;
            const maxId = await functions.getMaxIdByField(MissionComment, 'id');
            const staff_id = req.user.data._id;
            const timeNow = functions.getTimeNow();
            await new MissionComment({
                id: maxId,
                mission_id: missionId,
                content: content,
                staff_id,
                com_id,
                created_at: timeNow,
            }).save();
            return functions.success(
                res,
                'Add new comment in the MissionComment is successfully', { listRole: req.listRole, }
            );
        } catch (e) {
            return functions.setError(res, e.message);
        }
    }

    //[put] /me/chi-tiet-cong-viec-cua-toi/process/:id/sua-comment/:commentId
    async suaBinhLuanNhiemVu(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            const commentId = req.params.commentId;
            const mission_id = req.params.id
            const commentMessage = req.body.commentMessage;
            await MissionComment.updateOne({
                id: commentId,
                mission_id,
            }, {
                content: commentMessage,
            });
            return functions.success(
                res,
                'Edit commnet in the MissionComment is successfully', { listRole: req.listRole, }
            );
        } catch (e) {
            return functions.setError(res, e.message);
        }
    }

    //[delete] /me/chi-tiet-cong-viec-cua-toi/process/:id/xoa-comment/:commentId
    async xoaBinhLuanNhiemVu(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            const commentId = req.params.commentId;
            const mission_id = req.params.id
            await MissionComment.deleteOne({
                id: commentId,
                mission_id,
            });
            return functions.success(
                res,
                'Deleted comment in the MissionComment is successfully', { listRole: req.listRole, }
            );
        } catch (e) {
            return functions.setError(res, e.message);
        }
    }

    // [POST] /me/chi-tiet-cong-viec-cua-toi/process/:id/add-file
    async themFileNhiemVu(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const upload_by = req.user.data._id
            if (req.files.length) {
                const mission_id = req.params.id
                const stageMission = await StageMission.findOne({ id: mission_id }, {
                    _id: 0,
                    process_id: 1,
                    stage_id: 1,
                })
                if (!stageMission) return functions.setError(res, "Failed to get data", 401)
                const process_id = stageMission.process_id
                const stage_id = stageMission.stage_id
                const now = functions.getTimeNow()
                const filesNum = req.files.length
                for (let i = 0; i < filesNum; i++) {
                    let myJobFileMaxId = await functions.getMaxIdByFieldWithDeleted(MyJobFileProcess, 'id')
                    let fileTongQuanMaxId = await functions.getMaxIdByFieldWithDeleted(TblFileTongQuan, 'id')
                    const maxId = myJobFileMaxId >= fileTongQuanMaxId ? myJobFileMaxId : fileTongQuanMaxId

                    const myJobFileProcess = new MyJobFileProcess({
                        id: maxId,
                        mission_id,
                        process_id,
                        stage_id,
                        created_at: now,
                        name_file: req.files[i].filename,
                        upload_by,
                    })
                    await myJobFileProcess.save()

                    const tblFileTongQuan = new TblFileTongQuan({
                        id: maxId,
                        name_file: req.files[i].filename,
                        size_file: req.files[i].size,
                        com_id,
                        created_id: upload_by,
                        created_by: type,
                        created_at: now,
                        type_project: 2
                    })
                    await tblFileTongQuan.save()
                }
            } else return functions.setError(res, "Invalid files")
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [DELETE] /me/chi-tiet-cong-viec-cua-toi/process/:id/delete-file/:fileId
    async xoaFileNhiemVu(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const id = req.params.fileId
            const mission_id = req.params.id
            await MyJobFileProcess.updateOneWithDeleted({ id, mission_id }, {
                is_delete: 1,
            })
            await MyJobFileProcess.delete({ id, mission_id })
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [GET] /me/chi-tiet-cong-viec-cua-toi/process/:id/download-file/:fileId
    async taiFileNhiemVu(req, res, next) {
        try {
            const mission_id = req.params.id
            const id = req.params.fileId
            const file = await MyJobFileProcess.findOne({ id, mission_id }, { _id: 0, name_file: 1 })
            if (!file) return functions.setError(res, 'Không tìm thấy file', 404)
            else {
                const nameFile = file.name_file
                return res.download(`../storage/base365/giaoviec365/Process/${nameFile}`)
            }
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Action failed!!', 501)
        }
    }

    //[GET] /me/quan-ly-bao-cao-quy-trinh-nhan-vien
    async quanLyBaoCaoQuyTrinhNhanVien(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id

            const now = functions.getTimeNow()

            const resultProcess = await Process.aggregate([
                { $match: { com_id } }, // Lọc các documents dựa trên điều kiện com_id
                {
                    $group: {
                        _id: null, // Nhóm tất cả các documents vào một nhóm duy nhất
                        doneProcessCount: {
                            $sum: {
                                $cond: [{ $eq: ["$process_status", 2] }, 1, 0] // Tính tổng số lượng documents có process_status = 2
                            }
                        },
                        failureProcessCount: {
                            $sum: {
                                $cond: [{ $eq: ["$process_status", 3] }, 1, 0] // Tính tổng số lượng documents có process_status = 3
                            }
                        }
                    }
                }
            ]);

            const doneProcessCount = resultProcess.length > 0 ? resultProcess[0].doneProcessCount : 0;
            const failureProcessCount = resultProcess.length > 0 ? resultProcess[0].failureProcessCount : 0;

            let overTimeProcessCount = 0 // Số quy trình quá hạn
            let doingProcessCount = 0 // Số quy trình đang thực hiện
            const process = await Process.find({
                com_id,
                process_status: 1
            })
            process.forEach((value, index) => {
                const timeStart = functions.replaceDay(value.date_start + ' ' + value.time_in).getTime() / 1000
                const timeEnd = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (timeStart < now && timeEnd > now) doingProcessCount++
                    if (timeEnd < now) overTimeProcessCount++
            })

            const result = await ProcessStages.aggregate([
                { $match: { com_id } }, // Lọc các documents dựa trên điều kiện com_id
                {
                    $group: {
                        _id: null, // Nhóm tất cả các documents vào một nhóm duy nhất
                        RuiRoCao: {
                            $sum: {
                                $cond: [{ $eq: ["$result", 1] }, 1, 0] // Tính tổng số lượng documents có result = 1
                            }
                        },
                        HoanThanhTot: {
                            $sum: {
                                $cond: [{ $eq: ["$result", 2] }, 1, 0] // Tính tổng số lượng documents có result = 2
                            }
                        },
                        ChamTre: {
                            $sum: {
                                $cond: [{ $eq: ["$result", 3] }, 1, 0] // Tính tổng số lượng documents có result = 3
                            }
                        },
                        DangTangToc: {
                            $sum: {
                                $cond: [{ $eq: ["$result", 4] }, 1, 0] // Tính tổng số lượng documents có result = 4
                            }
                        }
                    }
                }
            ]);

            const RuiRoCao = result.length > 0 ? result[0].RuiRoCao : 0;
            const HoanThanhTot = result.length > 0 ? result[0].HoanThanhTot : 0;
            const ChamTre = result.length > 0 ? result[0].ChamTre : 0;
            const DangTangToc = result.length > 0 ? result[0].DangTangToc : 0;

            // Nhiệm vụ
            let countDangLam = 0
            let countHoanThanhDungHan = 0
            let countHoanThanhMuon = 0
            let countQuaHan = 0
            let countThatBai = 0
            const NhiemVu = await StageMission.find({
                com_id,
            })
            if (NhiemVu) {
                NhiemVu.forEach(value => {
                    if (value['stage_id'] === 111 && value['hour_complete'] > now) countHoanThanhDungHan++
                        if (value['stage_id'] === 111 && value['hour_complete'] < now) countHoanThanhMuon++
                            if (value['stage_id'] !== 111 && value['stage_id'] !== 222 && value['hour_complete'] > now) countDangLam++
                                if (value['stage_id'] !== 111 && value['stage_id'] !== 222 && value['hour_complete'] < now) countQuaHan++
                                    if (value['stage_id'] === 222) countThatBai++
                })
            }

            // Nhân viên còn nhiều việc nhất
            let NhanVienConNhieuViecNhat = []
            const ArrIdNvDangLam = await StageMission.aggregate([{
                    $match: {
                        com_id: 1,
                        $and: [
                            { stage_id: { $ne: 111 } },
                            { stage_id: { $ne: 222 } },
                        ],
                        hour_complete: { $gt: now },
                    },
                },
                {
                    $group: {
                        _id: "$misssion_staff_id",
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { count: -1 },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: "$count" },
                        employees: { $push: { staff_id: "$_id", count: "$count" } },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        employees: {
                            $filter: {
                                input: "$employees",
                                as: "employee",
                                cond: { $eq: ["$$employee.count", "$maxCount"] },
                            },
                        },
                    },
                },
            ]);
            const NvDangLam = ArrIdNvDangLam[0] ? ArrIdNvDangLam[0].employees : []
            for (let i = 0; i < NvDangLam.length; i++) {
                const staff_id = Number(NvDangLam[i].staff_id)
                const soCongViec = NvDangLam[i].count
                const tongCongViec = await StageMission.find({ misssion_staff_id: NvDangLam[i].staff_id }).count().lean()
                const staff = await User.findOne({
                    type: 2,
                    'inForPerson.employee.com_id': com_id,
                    _id: staff_id,
                }, 'userName').lean()
                NhanVienConNhieuViecNhat[i] = {
                    ...staff,
                    soCongViec,
                    tongCongViec
                }
            }

            // Nhân viên Hoàn thành muộn nhiều nhất
            let NhanVienHoanThanhMuonNhieuNhat = []
            const ArrIdNvHoanThanhMuonNhieuNhat = await StageMission.aggregate([{
                    $match: {
                        com_id: 1,
                        stage_id: { $eq: 111 },
                        hour_complete: { $lt: now },
                    },
                },
                {
                    $group: {
                        _id: "$misssion_staff_id",
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { count: -1 },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: "$count" },
                        employees: { $push: { staff_id: "$_id", count: "$count" } },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        employees: {
                            $filter: {
                                input: "$employees",
                                as: "employee",
                                cond: { $eq: ["$$employee.count", "$maxCount"] },
                            },
                        },
                    },
                },
            ]);
            const NvHoanThanhMuonNhieuNhat = ArrIdNvHoanThanhMuonNhieuNhat[0] ? ArrIdNvHoanThanhMuonNhieuNhat[0].employees : []
            for (let i = 0; i < NvHoanThanhMuonNhieuNhat.length; i++) {
                const staff_id = Number(NvHoanThanhMuonNhieuNhat[i].staff_id)
                const soCongViec = NvHoanThanhMuonNhieuNhat[i].count
                const tongCongViec = await StageMission.find({ misssion_staff_id: NvHoanThanhMuonNhieuNhat[i].staff_id }).count().lean()
                const staff = await User.findOne({
                    type: 2,
                    'inForPerson.employee.com_id': com_id,
                    _id: staff_id,
                }, 'userName').lean()
                NhanVienHoanThanhMuonNhieuNhat[i] = {
                    ...staff,
                    soCongViec,
                    tongCongViec
                }
            }

            // Nhân viên Hoàn thành xuất sắc nhất
            let NhanVienHoanThanhXuatSacNhat = []
            const ArrIdNvHoanThanhXuatSacNhat = await StageMission.aggregate([{
                    $match: {
                        com_id: 1,
                        stage_id: { $eq: 111 },
                        hour_complete: { $gt: now },
                    },
                },
                {
                    $group: {
                        _id: "$misssion_staff_id",
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { count: -1 },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: "$count" },
                        employees: { $push: { staff_id: "$_id", count: "$count" } },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        employees: {
                            $filter: {
                                input: "$employees",
                                as: "employee",
                                cond: { $eq: ["$$employee.count", "$maxCount"] },
                            },
                        },
                    },
                },
            ]);
            const NvHoanThanhXuatSacNhat = ArrIdNvHoanThanhXuatSacNhat[0] ? ArrIdNvHoanThanhXuatSacNhat[0].employees : []
            for (let i = 0; i < NvHoanThanhXuatSacNhat.length; i++) {
                const staff_id = Number(NvHoanThanhXuatSacNhat[i].staff_id)
                const soCongViec = NvHoanThanhXuatSacNhat[i].count
                const tongCongViec = await StageMission.find({ misssion_staff_id: NvHoanThanhXuatSacNhat[i].staff_id }).count().lean()
                const staff = await User.findOne({
                    type: 2,
                    'inForPerson.employee.com_id': com_id,
                    _id: staff_id,
                }, 'userName').lean()
                NhanVienHoanThanhXuatSacNhat[i] = {
                    ...staff,
                    soCongViec,
                    tongCongViec
                }
            }

            const processReport = await Process.aggregate([{
                    $match: {
                        com_id,
                    }
                },
                { $sort: { process_id: -1 } },
                {
                    $lookup: {
                        from: 'gv365processstages',
                        let: { process_id: '$process_id' },
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$process_id', '$$process_id'] }
                                    ]
                                }
                            }
                        }, ],
                        as: 'stages',
                    }
                },
                {
                    $lookup: {
                        from: 'gv365stagesmissions',
                        let: { process_id: '$process_id' },
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$process_id', '$$process_id'] },
                                    ]
                                }
                            }
                        }, ],
                        as: 'missions',
                    }
                },
                {
                    $lookup: {
                        from: 'gv365stagesmissions',
                        let: { process_id: '$process_id' },
                        pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$process_id', '$$process_id'] },
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: 'process_id',
                                    count: {
                                        $sum: {
                                            $cond: [{
                                                $and: [
                                                    { $eq: ['$stage_id', 111] }
                                                ]
                                            }, 1, 0],
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'missionDone',
                    }
                },
                { $unwind: { path: '$missionDone', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'gv365stagesmissions',
                        let: { process_id: '$process_id' },
                        pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$process_id', '$$process_id'] },
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: 'process_id',
                                    count: {
                                        $sum: {
                                            $cond: [{
                                                $and: [
                                                    { $eq: ['$stage_id', 222] }
                                                ]
                                            }, 1, 0],
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'missionFailed',
                    }
                },
                { $unwind: { path: '$missionFailed', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'gv365stagesmissions',
                        let: { process_id: '$process_id' },
                        pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$process_id', '$$process_id'] },
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: 'process_id',
                                    count: {
                                        $sum: {
                                            $cond: [{
                                                $and: [
                                                    { $ne: ['$stage_id', 111] },
                                                    { $ne: ['$stage_id', 222] },
                                                    { $lte: ['$hour_complete', now] },
                                                ]
                                            }, 1, 0],
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'missionDoing',
                    }
                },
                { $unwind: { path: '$missionDoing', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'gv365stagesmissions',
                        let: { process_id: '$process_id' },
                        pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$process_id', '$$process_id'] },
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: 'process_id',
                                    count: {
                                        $sum: {
                                            $cond: [{
                                                $and: [
                                                    { $ne: ['$stage_id', 111] },
                                                    { $ne: ['$stage_id', 222] },
                                                    { $gte: ['$hour_complete', now] },
                                                ]
                                            }, 1, 0],
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'missionDue',
                    }
                },
                { $unwind: { path: '$missionDue', preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        user_id: {
                            $map: {
                                input: { $split: ["$process_member", ","] },
                                in: {
                                    $cond: {
                                        if: { $ne: ["$$this", ""] },
                                        then: { $toInt: "$$this" },
                                        else: null
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "Users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        'process_id': '$process_id',
                        'process_name': '$process_name',
                        'process_member': '$process_member',
                        'detail_process_member': '$user',
                        'process_status': '$process_status',
                        'missionDone': '$missionDone.count',
                        'missionFailed': '$missionFailed.count',
                        'missionDoing': '$missionDoing.count',
                        'missionDue': '$missionDue.count',
                        'totalMissions': { $sum: { $size: { $ifNull: ['$missions', []] } } },
                        'totalStages': { $sum: { $size: { $ifNull: ['$stages', []] } } },
                    }
                }
            ])
            return functions.success(res, 'Get process report successfully', {
                listRole: req.listRole,
                data: {
                    Process: {
                        doneProcessCount,
                        failureProcessCount,
                        doingProcessCount,
                        overTimeProcessCount,
                    },
                    Stage: {
                        RuiRoCao,
                        HoanThanhTot,
                        ChamTre,
                        DangTangToc,
                    },
                    Mission: {
                        countDangLam,
                        countHoanThanhDungHan,
                        countHoanThanhMuon,
                        countQuaHan,
                        countThatBai,
                    },
                    NhanVienConNhieuViecNhat,
                    NhanVienHoanThanhMuonNhieuNhat,
                    NhanVienHoanThanhXuatSacNhat,
                    ProcessReport: processReport
                }
            })
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Failed to get process report', 500)
        }
    }

    //[GET] /me/quan-ly-bao-cao-du-an-nhan-vien
    async QuanLyBaoCaoDuAnNhanVien(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id

            const now = functions.getTimeNow()
            const dayNow = functions.convertDateOtherType(now, true)
            const hourNow = functions.getHourNow()
            const dateNow = dayNow + " " + hourNow
                // Dự án
            const countDuAnHoanThanh = await Project.find({
                com_id,
                type: 1,
                project_type: 0,
            }).lean().count()

            let countDuAnDangLam = 0
            const DuAnDangLam = await Project.find({
                com_id,
                type: 0,
                project_type: 0,
                open_or_close: 1,
            }).lean()
            DuAnDangLam.forEach((value) => {
                const timeStart = functions.replaceDay(value.date_start + ' ' + value.time_in).getTime() / 1000
                const timeEnd = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (timeStart < now && timeEnd > now) countDuAnDangLam++
            })

            let countDuAnQuaHan = 0
            const DuAnQuaHan = await Project.find({
                com_id,
                type: 0,
                project_type: 0,
                open_or_close: 1,
            })
            DuAnQuaHan.forEach((value) => {
                const timeEnd = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (timeEnd < now) countDuAnQuaHan++
            })

            const countDuAnThatBai = await Project.find({
                com_id,
                type: 0,
                project_type: 0,
                open_or_close: 2,
            }).count()

            // Nhóm công việc
            const countNhomCongViecHoanThanh = await JobGroup.find({
                com_id,
                is_delete: 0,
                job_group_status: 1,
                quanli_danhgia: { $in: [2, 3] },
            }).count()

            let countNhomCongViecDangLam = 0
            const NhomCongViecDangLam = await JobGroup.find({
                com_id,
                is_delete: 0,
                job_group_status: 0,
            })
            NhomCongViecDangLam.forEach((value) => {
                const timeStart = functions.replaceDay(value.date_start + ' ' + value.time_in).getTime() / 1000
                const timeEnd = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (timeStart < now && timeEnd > now) countNhomCongViecDangLam++
            })

            const NhomCongViecQuaHan = await JobGroup.find({
                com_id,
                is_delete: 0,
                job_group_status: 0,
            })
            let countNhomCongViecQuaHan = 0
            NhomCongViecQuaHan.forEach((value) => {
                const timeEnd = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (timeEnd < now) countNhomCongViecQuaHan++
            })

            const countNhomCongViecThatBai = await JobGroup.find({
                com_id,
                is_delete: 0,
                quanli_danhgia: { $in: [4, 5] },
            }).count()

            // Công việc
            const countCvHoanThanhDungHan = await Job.find({
                com_id,
                status: 2,
                status_or_late: 2,
            }).count()

            const countCvHoanThanhMuon = await Job.find({
                com_id,
                status: 2,
                status_or_late: 3,
            }).count()

            let countCvDangLam = 0
            const CvDangLam = await Job.find({
                com_id,
                status: 1,
                status_or_late: 1,
            })
            CvDangLam.forEach((value) => {
                const timeStart = functions.replaceDay(value.date_start + ' ' + value.time_in).getTime() / 1000
                const timeEnd = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (timeStart < now && timeEnd > now) {
                    countCvDangLam++
                }
            })

            const CvQuaHan = await Job.find({
                com_id,
                status: 1,
                status_or_late: 1,
            })
            let countCvQuaHan = 0
            CvQuaHan.forEach((value) => {
                const timeEnd = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (timeEnd < now) countCvQuaHan++
            })

            // Nhân viên còn nhiều việc nhất
            let NhanVienConNhieuViecNhat = []
            const ArrIdNvDangLam = await Job.aggregate([{
                    $match: {
                        com_id,
                        $and: [
                            { status: { $eq: 1 } },
                            { status_or_late: { $eq: 1 } },
                        ],
                    },
                },
                {
                    $group: {
                        _id: "$job_member",
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { count: -1 },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: "$count" },
                        employees: { $push: { staff_id: "$_id", count: "$count" } },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        employees: {
                            $filter: {
                                input: "$employees",
                                as: "employee",
                                cond: { $eq: ["$$employee.count", "$maxCount"] },
                            },
                        },
                    },
                },
            ]);
            const NvDangLam = ArrIdNvDangLam[0] ? ArrIdNvDangLam[0].employees : []
            for (let i = 0; i < NvDangLam.length; i++) {
                const staff_id = Number(NvDangLam[i].staff_id)
                const soCongViec = NvDangLam[i].count
                const tongCongViec = await Job.find({ job_member: NvDangLam[i].staff_id }).count().lean()
                const staff = await User.findOne({
                    type: 2,
                    'inForPerson.employee.com_id': com_id,
                    _id: staff_id,
                }, 'userName').lean()
                NhanVienConNhieuViecNhat[i] = {
                    ...staff,
                    soCongViec,
                    tongCongViec
                }
            }

            // Nhân viên hoàn thành muộn nhiều nhất
            let NhanVienHoanThanhMuonNhieuNhat = []
            const ArrIdNvHoanThanhMuon = await Job.aggregate([{
                    $match: {
                        com_id,
                        $and: [
                            { status: { $eq: 2 } },
                            { status_or_late: { $eq: 3 } },
                        ],
                    },
                },
                {
                    $group: {
                        _id: "$job_member",
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { count: -1 },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: "$count" },
                        employees: { $push: { staff_id: "$_id", count: "$count" } },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        employees: {
                            $filter: {
                                input: "$employees",
                                as: "employee",
                                cond: { $eq: ["$$employee.count", "$maxCount"] },
                            },
                        },
                    },
                },
            ]);
            const NvHoanThanhMuon = ArrIdNvHoanThanhMuon[0] ? ArrIdNvHoanThanhMuon[0].employees : []
            for (let i = 0; i < NvHoanThanhMuon.length; i++) {
                const staff_id = Number(NvHoanThanhMuon[i].staff_id)
                const soCongViec = NvHoanThanhMuon[i].count
                const tongCongViec = await Job.find({ job_member: NvHoanThanhMuon[i].staff_id }).count().lean()
                const staff = await User.findOne({
                    type: 2,
                    'inForPerson.employee.com_id': com_id,
                    _id: staff_id,
                }, 'userName').lean()
                NhanVienHoanThanhMuonNhieuNhat[i] = {
                    ...staff,
                    soCongViec,
                    tongCongViec
                }
            }

            // Nhân viên hoàn thành xuất sắc nhất
            let NhanVienHoanThanhXuatSac = []
            const ArrIdNvHoanThanhXuatSac = await Job.aggregate([{
                    $match: {
                        com_id,
                        $and: [
                            { status: { $eq: 2 } },
                            { status_or_late: { $eq: 2 } },
                        ],
                    },
                },
                {
                    $group: {
                        _id: "$job_member",
                        count: { $sum: 1 },
                    },
                },
                {
                    $sort: { count: -1 },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: "$count" },
                        employees: { $push: { staff_id: "$_id", count: "$count" } },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        employees: {
                            $filter: {
                                input: "$employees",
                                as: "employee",
                                cond: { $eq: ["$$employee.count", "$maxCount"] },
                            },
                        },
                    },
                },
            ]);
            const NvHoanThanhXuatSac = ArrIdNvHoanThanhXuatSac[0] ? ArrIdNvHoanThanhXuatSac[0].employees : []
            for (let i = 0; i < NvHoanThanhXuatSac.length; i++) {
                const staff_id = Number(NvHoanThanhXuatSac[i].staff_id)
                const soCongViec = NvHoanThanhXuatSac[i].count
                const tongCongViec = await Job.find({ job_member: NvHoanThanhXuatSac[i].staff_id }).count().lean()
                const staff = await User.findOne({
                    type: 2,
                    'inForPerson.employee.com_id': com_id,
                    _id: staff_id,
                }, 'userName').lean()
                NhanVienHoanThanhXuatSac[i] = {
                    ...staff,
                    soCongViec,
                    tongCongViec
                }
            }

            const projectReport = await Project.aggregate([{
                    $match: {
                        com_id,
                    }
                },
                { $sort: { project_id: -1 } },
                {
                    $lookup: {
                        from: 'gv365jobgroups',
                        let: { project_id: '$project_id' },
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$project_id', '$$project_id'] }
                                    ]
                                }
                            }
                        }, ],
                        as: 'groups',
                    }
                },
                {
                    $lookup: {
                        from: 'gv365jobs',
                        let: { project_id: '$project_id' },
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$project_id', '$$project_id'] },
                                    ]
                                }
                            }
                        }, ],
                        as: 'jobs',
                    }
                },
                {
                    $lookup: {
                        from: 'gv365jobgroups',
                        let: { project_id: '$project_id' },
                        pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$project_id', '$$project_id'] },
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: 'project_id',
                                    count: {
                                        $sum: {
                                            $cond: [{
                                                $and: [
                                                    { $eq: ['$job_group_status', 1] },
                                                    { $in: ['$quanli_danhgia', [2, 3]] },
                                                ]
                                            }, 1, 0],
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'groupDone',
                    }
                },
                { $unwind: { path: '$groupDone', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'gv365jobgroups',
                        let: { project_id: '$project_id' },
                        pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$project_id', '$$project_id'] },
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: 'project_id',
                                    count: {
                                        $sum: {
                                            $cond: [{
                                                $and: [
                                                    { $in: ['$quanli_danhgia', [4, 5]] },
                                                ]
                                            }, 1, 0],
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'groupFailed',
                    }
                },
                { $unwind: { path: '$groupFailed', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'gv365jobgroups',
                        let: { project_id: '$project_id' },
                        pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$project_id', '$$project_id'] },
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: 'project_id',
                                    count: {
                                        $sum: {
                                            $cond: [{
                                                $and: [
                                                    { $eq: ['$job_group_status', 0] },
                                                    {
                                                        $lt: [{
                                                                $toString: {
                                                                    $dateFromString: {
                                                                        dateString: {
                                                                            $concat: [
                                                                                { $substr: ["$date_end", 6, 4] },
                                                                                "-",
                                                                                { $substr: ["$date_end", 3, 2] },
                                                                                "-",
                                                                                { $substr: ["$date_end", 0, 2] },
                                                                                " ",
                                                                                "$time_out"
                                                                            ]
                                                                        }
                                                                    }
                                                                }
                                                            },
                                                            dateNow
                                                        ]
                                                    }
                                                ]
                                            }, 1, 0],
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'groupDue',
                    }
                },
                { $unwind: { path: '$groupDue', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'gv365jobgroups',
                        let: { project_id: '$project_id' },
                        pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$project_id', '$$project_id'] },
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: 'project_id',
                                    count: {
                                        $sum: {
                                            $cond: [{
                                                $and: [
                                                    { $eq: ['$job_group_status', 0] },
                                                    {
                                                        $gt: [
                                                            { $toString: { $dateFromString: { dateString: { $concat: [{ $substr: ["$date_end", 6, 4] }, "-", { $substr: ["$date_end", 3, 2] }, "-", { $substr: ["$date_end", 0, 2] }, " ", "$time_out"] } } } },
                                                            dateNow
                                                        ]
                                                    },
                                                    {
                                                        $lt: [
                                                            { $toString: { $dateFromString: { dateString: { $concat: [{ $substr: ["$date_start", 6, 4] }, "-", { $substr: ["$date_start", 3, 2] }, "-", { $substr: ["$date_start", 0, 2] }, " ", "$time_in"] } } } },
                                                            dateNow
                                                        ]
                                                    }
                                                ]
                                            }, 1, 0],
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'groupDoing',
                    }
                },
                { $unwind: { path: '$groupDoing', preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        user_id: {
                            $map: {
                                input: { $split: ["$project_member", ","] },
                                in: {
                                    $cond: {
                                        if: { $ne: ["$$this", ""] },
                                        then: { $toInt: "$$this" },
                                        else: null
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "Users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        'project_id': '$project_id',
                        'project_name': '$project_name',
                        'project_member': '$project_member',
                        'type': '$type',
                        'detail_project_member': '$user',
                        'groupDone': '$groupDone.count',
                        'groupFailed': '$groupFailed.count',
                        'groupDoing': '$groupDoing.count',
                        'groupDue': '$groupDue.count',
                        'totalJob': { $sum: { $size: { $ifNull: ['$jobs', []] } } },
                        'totalJobGroup': { $sum: { $size: { $ifNull: ['$groups', []] } } },
                    }
                }
            ])
            return functions.success(res, 'Get project report successfully', {
                listRole: req.listRole,
                data: {
                    Project: {
                        countDuAnHoanThanh,
                        countDuAnDangLam,
                        countDuAnQuaHan,
                        countDuAnThatBai,
                    },
                    JobGroup: {
                        countNhomCongViecHoanThanh,
                        countNhomCongViecDangLam,
                        countNhomCongViecQuaHan,
                        countNhomCongViecThatBai,
                    },
                    Job: {
                        countCvHoanThanhDungHan,
                        countCvHoanThanhMuon,
                        countCvDangLam,
                        countCvQuaHan,
                    },
                    NhanVienConNhieuViecNhat: NhanVienConNhieuViecNhat,
                    NhanVienHoanThanhMuonNhieuNhat: NhanVienHoanThanhMuonNhieuNhat,
                    NhanVienHoanThanhXuatSacNhat: NhanVienHoanThanhXuatSac,
                    ProjectReport: projectReport,

                }
            })
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Failed to get project report', 500)
        }
    }

    //[GET] /me/quan-ly-bao-cao-quy-trinh-nhan-vien-chi-tiet/:id
    async quanLyBaoCaoQuyTrinhNhanVienChiTiet(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let comId
            const type = req.user.data.type
            if (type === 1) comId = req.user.data.idQLC
            if (type === 2) comId = req.user.data.com_id
            const id = req.user.data._id;

            const processId = Number(req.params.id);
            if (!processId) return functions.setError(res, 'Do not found process id');
            //lấy ra thông tin quy trình
            const process = await Process.findOne({
                process_id: processId,
                com_id: comId,
                is_delete: { $ne: 1 },
                // // ...(id
                // // 	? {
                // 			$or: [
                // 				{ process_member: { $regex: id, $options: 'i' } },
                // 				{ process_manager: { $regex: id, $options: 'i' } },
                // 				{ process_evaluate: { $regex: id, $options: 'i' } },
                // 				{ process_follow: { $regex: id, $options: 'i' } },
                // 			],
                // 	  }
                // 	: {}),
            });
            //lấy ra thông tin nhân viên
            const listMember = await StageMission.aggregate([{
                    $match: {
                        // is_deleted: 0,
                        process_id: processId,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        misssion_staff_id: 1,
                    },
                },
                {
                    $group: {
                        _id: '$misssion_staff_id',
                    },
                },
                {
                    $lookup: {
                        from: 'Users',
                        let: { id: { $toInt: "$_id" } },
                        pipeline: [{
                            $match: { $expr: { $eq: ['$_id', '$$id'] } }
                        }],
                        as: 'user',
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $project: {
                        "_id": "$user._id",
                        "userName": "$user.userName",
                        "position": "$user.inForPerson.employee.position_id",
                        "avatarUser": "$user.avatarUser",
                    }
                }
            ]);
            //toàn bộ nhóm công việc
            const listMission = await StageMission.find({
                com_id: comId,
                process_id: processId,
                is_delete: { $ne: 1 },
            });
            //nhóm công việc theo dự án
            // const listJob = StageMission.find({
            // 	process_id: processId,
            // });

            //nhân viên còn nhiều việc nhất
            const listEpMostTask = await StageMission.aggregate([{
                    $match: {
                        com_id: comId,
                        process_id: processId,
                    },
                },
                {
                    $group: {
                        _id: '$misssion_staff_id',
                        tongsocongviec: { $sum: 1 }, // Tính tổng số công việc cho mỗi mission_staff_id
                        solan: {
                            $sum: {
                                $cond: [{
                                        $and: [
                                            { $ne: ['$stage_id', 111] },
                                            { $ne: ['$stage_id', 222] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: '$solan' },
                        results: {
                            $push: {
                                mission_staff_id: '$_id',
                                solan: '$solan',
                                tongsocongviec: '$tongsocongviec',
                            },
                        },
                    },
                },
                {
                    $unwind: '$results',
                },
                {
                    $match: {
                        $expr: { $eq: ['$results.solan', '$maxCount'] },
                        'results.solan': { $gt: 0 },
                        // Sử dụng $expr và $eq
                    },
                },
                {
                    $replaceRoot: { newRoot: '$results' },
                },
                {
                    $lookup: {
                        from: 'Users',
                        let: { id: { $toInt: "$mission_staff_id" } },
                        pipeline: [{
                            $match: { $expr: { $eq: ['$_id', '$$id'] } }
                        }],
                        as: 'user',
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $project: {
                        "soCongViec": "$solan",
                        "tongCongViec": "$tongsocongviec",
                        "userName": "$user.userName",
                        "position": "$user.inForPerson.employee.position_id",
                        "avatarUser": "$user.avatarUser",
                    }
                }
            ]);

            //nhân viên hoàn thành nhiệm vụ muộn nhiều nhất
            const epMostDueTask = await StageMission.aggregate([{
                    $match: {
                        com_id: comId,
                        process_id: processId,
                    },
                },
                {
                    $group: {
                        _id: '$misssion_staff_id',
                        tongsocongviec: { $sum: 1 }, // Tính tổng số công việc cho mỗi mission_staff_id
                        solan: {
                            $sum: {
                                $cond: [{
                                        $and: [
                                            { $eq: ['$stage_id', 111] },
                                            { $gt: ['$change_stage_at', '$hour_complete'] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: '$solan' },
                        results: {
                            $push: {
                                mission_staff_id: '$_id',
                                solan: '$solan',
                                tongsocongviec: '$tongsocongviec',
                            },
                        },
                    },
                },
                {
                    $unwind: '$results',
                },
                {
                    $match: {
                        $expr: { $eq: ['$results.solan', '$maxCount'] },
                        'results.solan': { $gt: 0 },
                        // Sử dụng $expr và $eq
                    },
                },
                {
                    $replaceRoot: { newRoot: '$results' },
                },
                {
                    $lookup: {
                        from: 'Users',
                        let: { id: { $toInt: "$mission_staff_id" } },
                        pipeline: [{
                            $match: { $expr: { $eq: ['$_id', '$$id'] } }
                        }],
                        as: 'user',
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $project: {
                        "soCongViec": "$solan",
                        "tongCongViec": "$tongsocongviec",
                        "userName": "$user.userName",
                        "position": "$user.inForPerson.employee.position_id",
                        "avatarUser": "$user.avatarUser",
                    }
                }
            ]);
            //hoàn thành ss nhiều nhất
            const listEpSuccesslyMostTash = await StageMission.aggregate([{
                    $match: {
                        com_id: comId,
                        process_id: processId,
                    },
                },
                {
                    $group: {
                        _id: '$misssion_staff_id',
                        tongsocongviec: { $sum: 1 }, // Tính tổng số công việc cho mỗi mission_staff_id
                        solan: {
                            $sum: {
                                $cond: [{
                                        $and: [
                                            { $eq: ['$stage_id', 111] },
                                            { $lt: ['$change_stage_at', '$hour_complete'] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: '$solan' },
                        results: {
                            $push: {
                                mission_staff_id: '$_id',
                                solan: '$solan',
                                tongsocongviec: '$tongsocongviec',
                            },
                        },
                    },
                },
                {
                    $unwind: '$results',
                },
                {
                    $match: {
                        $expr: { $eq: ['$results.solan', '$maxCount'] },
                        'results.solan': { $gt: 0 },
                        // Sử dụng $expr và $eq
                    },
                },
                {
                    $lookup: {
                        from: 'Users',
                        let: { id: { $toInt: "$mission_staff_id" } },
                        pipeline: [{
                            $match: { $expr: { $eq: ['$_id', '$$id'] } }
                        }],
                        as: 'user',
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $project: {
                        "soCongViec": "$solan",
                        "tongCongViec": "$tongsocongviec",
                        "userName": "$user.userName",
                        "position": "$user.inForPerson.employee.position_id",
                        "avatarUser": "$user.avatarUser",
                    }
                }
            ]);
            const timeNow = functions.getTimeNow();

            //đếm số kiểu dự án cho mỗi người dùng

            listMember.forEach((value, index) => {
                let countMission = 0;
                let countMissionHoanThanhMuon = 0;
                let timeHoanThanh = 0;
                let countMissionHoanThanh = 0;
                let countMissionQuaHan = 0;
                let countMissionThucHien = 0;
                listMission.forEach((mission) => {
                    if (mission['misssion_staff_id'] == value._id) {
                        countMission++;
                        timeHoanThanh += Math.floor(
                            (mission['hour_complete'] - mission['created_at']) / 3600
                        );
                        if (mission['stage_id'] == 111) {
                            countMissionHoanThanh++;
                        }
                        if (
                            mission['stage_id'] == 111 &&
                            mission['change_stage_at'] > mission['hour_complete']
                        )
                            countMissionHoanThanhMuon++;
                        if (mission['stage_id'] != 111 && mission['stage_id'] != 222)
                            countMissionThucHien++;
                        if (
                            mission['stage_id'] !== 111 &&
                            mission['hour_complete'] < timeNow &&
                            mission['stage_id'] != 222
                        )
                            countMissionQuaHan++;
                    }
                });
                listMember[index] = {
                    ...value,
                    countCV: countMission,
                    countCvHoanThanhMuon: countMissionHoanThanhMuon,
                    countCVHoanThanh: countMissionHoanThanh,
                    countCvQuaHan: countMissionQuaHan,
                    countCVThucHien: countMissionThucHien,
                    timeTB: countMission != 0 ? timeHoanThanh / countMission : 0,
                };
            });

            //đếm số kiểu của từng dạng công việc
            let tongcongviec = 0;
            let tonghoanthanh = 0;
            let nhomquantrong = 0;
            let nhomkhancap = 0;
            let nhomquantrong_ht = 0;
            let nhomkhancap_ht = 0;
            let nhomquahan = 0;
            listMission.forEach((Mission) => {
                tongcongviec++;
                const card = Mission['card'] ? Mission['card'].split(',') : '';
                if (card.includes('2')) nhomkhancap++;
                else if (card.includes('1')) nhomquantrong++;
                if (Mission['stage_id'] == 111) {
                    tonghoanthanh++;
                    if (card.includes('2')) nhomkhancap_ht++;
                    else if (card.includes('1')) nhomquantrong_ht++;
                } else if (
                    Mission['stage_id'] != 222 &&
                    Mission['hour_complete'] < timeNow
                )
                    nhomquahan++;
            });

            return functions.success(res, 'Get successfully the data', {
                listRole: req.listRole,
                data: {
                    process,
                    // roleList,
                    jobGroup: {
                        countNhomCongViec: {
                            tongso: tongcongviec,
                            hoanthanh: tonghoanthanh,
                        },
                        countNhomCongViecQuanTrong: {
                            hoanthanh: nhomquantrong_ht,
                            tongso: nhomquantrong,
                        },
                        countNhomCongViecKhanCap: {
                            hoanthanh: nhomkhancap_ht,
                            tongso: nhomkhancap,
                        },
                        countNhomCongViecQuaHan: nhomquahan,
                    },
                    listMember,
                    nvConNhieuViecNhat: listEpMostTask,
                    nvHoanThanhMuonNhieuNhat: epMostDueTask,
                    nvHoanThanhXuatSacNhat: listEpSuccesslyMostTash,
                },
            });
        } catch (e) {
            console.log(e)
            functions.setError(res, 'failure to get data', 400);
        }
    }

    //[GET] /me/quan-ly-bao-cao-du-an-nhan-vien-chi-tiet/:id
    async quanLyBaoCaoDuAnNhanVienChiTiet(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let comId
            const type = req.user.data.type
            if (type === 1) comId = req.user.data.idQLC
            if (type === 2) comId = req.user.data.com_id
            const id = req.user.data._id
            const projectId = Number(req.params.id);
            if (!projectId)
                return functions.setError(res, 'Do not found a project id');
            const info = await Project.findOne({
                project_id: projectId,
                com_id: comId,
                is_delete: 0,
                project_type: 0,
                // ...(id
                // 	? {
                // 			$or: [
                // 				{ process_member: { $regex: id, $options: 'i' } },
                // 				{ process_manager: { $regex: id, $options: 'i' } },
                // 				{ process_evaluate: { $regex: id, $options: 'i' } },
                // 				{ process_follow: { $regex: id, $options: 'i' } },
                // 			],
                // 	  }
                // 	: {}),
            });

            //danh sach nhóm công việc

            ///danh sach cong viec voi thon tin cua project
            const listGroupJobs = await JobGroup.aggregate([{
                $match: {
                    'com_id': comId,
                    project_id: projectId,
                    is_delete: 0,
                },
            }, ]);
            //danh sach cong việc theo project
            const listMember = await Job.aggregate([{
                    $match: {
                        is_deleted: 0,
                        project_id: projectId,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        job_member: 1,
                    },
                },
                {
                    $group: {
                        _id: '$job_member',
                    },
                },
                {
                    $lookup: {
                        from: 'Users',
                        let: { id: { $toInt: "$_id" } },
                        pipeline: [{
                            $match: { $expr: { $eq: ['$_id', '$$id'] } }
                        }],
                        as: 'user',
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $project: {
                        "_id": "$user._id",
                        "userName": "$user.userName",
                        "position": "$user.inForPerson.employee.position_id",
                        "avatarUser": "$user.avatarUser",
                    }
                }
            ]);
            //danh sach cong viec theo nhom
            const listJob = await Job.find({
                // job_group_id: 0,
                is_deleted: { $ne: 1 },
                project_id: projectId,
            });
            const timeNow = functions.getTimeNow();
            //danh sách người liên quan dự án
            //đếm số kiểu dự án cho mỗi người dùng
            listMember.forEach((value, index) => {
                let countJob = 0;
                let countJobHoanThanhMuon = 0;
                let timeHoanThanh = 0;
                let countJobHoanThanh = 0;
                let countJobQuaHan = 0;
                let countJobThucHien = 0;
                listJob.forEach((job) => {
                    if (job['job_member'] == value._id) {
                        countJob++;
                        const timeStart =
                            functions
                            .replaceDay(job['date_start'] + ' ' + job['time_in'])
                            .getTime() / 1000;
                        const timeEnd =
                            functions
                            .replaceDay(job['date_end'] + ' ' + job['time_out'])
                            .getTime() / 1000;
                        const hourComplete = Math.floor((timeEnd - timeStart) / 3600);
                        timeHoanThanh += hourComplete;
                        if (job['status'] == 2) countJobHoanThanh++;
                        if (job['status_or_late'] == 3) countJobHoanThanhMuon++;
                        if (job['status'] == 1 && timeEnd > timeNow) countJobThucHien++;
                        if (
                            job['status'] == 1 &&
                            timeEnd < timeNow &&
                            job['quanli_danhgia'] != 5
                        )
                            countJobQuaHan++;
                    }
                });
                listMember[index] = {
                    ...value,
                    countCV: countJob,
                    countCvHoanThanhMuon: countJobHoanThanhMuon,
                    countCVHoanThanh: countJobHoanThanh,
                    countCvQuaHan: countJobQuaHan,
                    countCVThucHien: countJobThucHien,
                    timeTB: countJob != 0 ? timeHoanThanh / countJob : 0,
                };
            });
            //những người có nhiều nhiệm vụ nhất
            const listEpMostTask = await Job.aggregate([{
                    $match: {
                        project_id: projectId,
                    },
                },
                {
                    $group: {
                        _id: '$job_member',
                        tongsocongviec: { $sum: 1 }, // Tính tổng số công việc cho mỗi job_member
                        solan: { $sum: { $cond: [{ $eq: ['$status_or_late', 1] }, 1, 0] } },
                    },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: '$solan' },
                        results: {
                            $push: {
                                job_member: '$_id',
                                solan: '$solan',
                                tongsocongviec: '$tongsocongviec',
                            },
                        },
                    },
                },
                {
                    $unwind: '$results',
                },
                {
                    $match: {
                        $expr: { $eq: ['$results.solan', '$maxCount'] },
                        'results.solan': { $gt: 0 },
                        // Sử dụng $expr và $eq
                    },
                },
                {
                    $replaceRoot: { newRoot: '$results' },
                },
                {
                    $lookup: {
                        from: 'Users',
                        let: { id: { $toInt: "$job_member" } },
                        pipeline: [{
                            $match: { $expr: { $eq: ['$_id', '$$id'] } }
                        }],
                        as: 'user',
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $project: {
                        "soCongViec": "$solan",
                        "tongCongViec": "$tongsocongviec",
                        "userName": "$user.userName",
                        "position": "$user.inForPerson.employee.position_id",
                        "avatarUser": "$user.avatarUser",
                    }
                }
            ]);
            //nhân viên hoàn thành nhiệm vụ muộn nhiều nhất
            const epMostDueTask = await Job.aggregate([{
                    $match: {
                        project_id: projectId,
                    },
                },
                {
                    $group: {
                        _id: '$job_member',
                        tongsocongviec: { $sum: 1 }, // Tính tổng số công việc cho mỗi job_member
                        solan: { $sum: { $cond: [{ $eq: ['$status_or_late', 3] }, 1, 0] } },
                    },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: '$solan' },
                        results: {
                            $push: {
                                job_member: '$_id',
                                solan: '$solan',
                                tongsocongviec: '$tongsocongviec',
                            },
                        },
                    },
                },
                {
                    $unwind: '$results',
                },
                {
                    $match: {
                        $expr: { $eq: ['$results.solan', '$maxCount'] }, // Sử dụng $expr và $eq
                        'results.solan': { $gt: 0 },
                    },
                },
                {
                    $replaceRoot: { newRoot: '$results' },
                },
                {
                    $lookup: {
                        from: 'Users',
                        let: { id: { $toInt: "$job_member" } },
                        pipeline: [{
                            $match: { $expr: { $eq: ['$_id', '$$id'] } }
                        }],
                        as: 'user',
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $project: {
                        "soCongViec": "$solan",
                        "tongCongViec": "$tongsocongviec",
                        "userName": "$user.userName",
                        "position": "$user.inForPerson.employee.position_id",
                        "avatarUser": "$user.avatarUser",
                    }
                }
            ]);
            //hoàn thành ss nhiều nhất
            const listEpSuccesslyMostTash = await Job.aggregate([{
                    $match: {
                        project_id: projectId,
                    },
                },
                {
                    $group: {
                        _id: '$job_member',
                        tongsocongviec: { $sum: 1 }, // Tính tổng số công việc cho mỗi job_member
                        solan: { $sum: { $cond: [{ $eq: ['$status_or_late', 2] }, 1, 0] } },
                    },
                },
                {
                    $group: {
                        _id: null,
                        maxCount: { $max: '$solan' },
                        results: {
                            $push: {
                                job_member: '$_id',
                                solan: '$solan',
                                tongsocongviec: '$tongsocongviec',
                            },
                        },
                    },
                },
                {
                    $unwind: '$results',
                },
                {
                    $match: {
                        $expr: { $eq: ['$results.solan', '$maxCount'] }, // Sử dụng $expr và $eq
                        'results.solan': { $gt: 0 },
                    },
                },
                {
                    $replaceRoot: { newRoot: '$results' },
                },
                {
                    $lookup: {
                        from: 'Users',
                        let: { id: { $toInt: "$job_member" } },
                        pipeline: [{
                            $match: { $expr: { $eq: ['$_id', '$$id'] } }
                        }],
                        as: 'user',
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $project: {
                        "soCongViec": "$solan",
                        "tongCongViec": "$tongsocongviec",
                        "userName": "$user.userName",
                        "position": "$user.inForPerson.employee.position_id",
                        "avatarUser": "$user.avatarUser",
                    }
                }
            ]);

            //đếm số kiểu công việc
            let tongcongviec = 0;
            let tonghoanthanh = 0;
            let nhomquantrong = 0;
            let nhomkhancap = 0;
            let nhomquantrong_ht = 0;
            let nhomkhancap_ht = 0;
            let nhomquahan = 0;
            listGroupJobs.forEach((job) => {
                tongcongviec++;
                const timeEnd =
                    functions
                    .replaceDay(job['date_end'] + ' ' + job['time_out'])
                    .getTime() / 1000;

                const card = job['card'] ? job['card'].split(',') : '';
                if (card.includes('2')) nhomkhancap++;
                else if (card.includes('1')) nhomquantrong++;
                if (job['job_group_status'] == 1) {
                    tonghoanthanh++;
                    if (card.includes('2')) nhomkhancap_ht++;
                    else if (card.includes('1')) nhomquantrong_ht++;
                } else if (
                    job['job_group_status'] == 0 &&
                    timeEnd < timeNow &&
                    job['quanli_danhgia'] != 5
                )
                    nhomquahan++;
            });

            return functions.success(res, 'Get successfully the data', {
                listRole: req.listRole,
                data: {
                    project: info,
                    // roleList,
                    jobGroup: {
                        countNhomCongViec: {
                            tongso: tongcongviec,
                            hoanthanh: tonghoanthanh,
                        },
                        countNhomCongViecQuanTrong: {
                            hoanthanh: nhomquantrong_ht,
                            tongso: nhomquantrong,
                        },
                        countNhomCongViecKhanCap: {
                            hoanthanh: nhomkhancap_ht,
                            tongso: nhomkhancap,
                        },
                        countNhomCongViecQuaHan: nhomquahan,
                    },
                    listMember,
                    nvConNhieuViecNhat: listEpMostTask,
                    nvHoanThanhMuonNhieuNhat: epMostDueTask,
                    nvHoanThanhXuatSacNhat: listEpSuccesslyMostTash,
                },
            });
        } catch (e) {
            console.log(e)
            functions.setError(res, 'failure to get data', 400);
        }
    }

    // [PUT] /me/chi-tiet-cong-viec-cua-toi/project/:id/switch-mission-job/:missionJobIdd
    async switchMissionJob(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const id = req.params.missionJobId
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const missionJob = await MissionJob.findOne({ id, com_id })
            if (missionJob) {
                if (missionJob.status === 1)
                    await MissionJob.updateOne({ id, com_id }, { status: 0 })
                if (missionJob.status === 0)
                    await MissionJob.updateOne({ id, com_id }, { status: 1 })
            }
            return functions.success(res, "Action successfully", { listRole: req.listRole, })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

}

module.exports = new MeController()