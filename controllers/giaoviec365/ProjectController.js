const Project = require('../../models/giaoviec365/projects');
const MyJobFileProject = require('../../models/giaoviec365/myjob_file_project')
const MyJobFileProcess = require('../../models/giaoviec365/myjob_file_process')
const Job = require('../../models/giaoviec365/jobs');
const JobGroup = require('../../models/giaoviec365/job_groups');
const JobOfJob = require('../../models/giaoviec365/job_of_job');
const Process = require('../../models/giaoviec365/process');
const JobRepeat = require('../../models/giaoviec365/jobs_repeat');
const ProcessStage = require('../../models/giaoviec365/process_stages');
const StageMission = require('../../models/giaoviec365/stages_missions')
const ProcessRoleStaff = require('../../models/giaoviec365/process_role_staffs')
const ProjectRoleStaff = require('../../models/giaoviec365/project_role_staffs')
const ProcessOption = require('../../models/giaoviec365/process_option')
const JobComment = require('../../models/giaoviec365/job_comments')
const MissionJob = require('../../models/giaoviec365/mission_job')
const MissionComment = require('../../models/giaoviec365/mission_comments')
const User = require('../../models/Users')
const TblFileTongQuan = require('../../models/giaoviec365/tbl_file_tongquan')
const StageOptions = require('../../models/giaoviec365/stage_option');
const functions = require('../../services/functions');
const gv = require('../../services/giaoviec365/gvService');

class ProjectController {

    // [GET] /projects/quan-ly-du-an-theo-danh-sach-cong-viec/:page
    async quanLyDuAnTheoDanhSachCongViec(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const page = req.params.page?Number(req.params.page):1
            let projectData = []
            let totalData = []
            let listEpData = []
            const keywords = req.query.keywords
            if (type === 1){
                projectData = Project.aggregate([
                    {
                        $match: {
                            com_id,
                            'project_name': {
                                $regex: keywords,
                                $options: 'i'
                            }
                        }
                    },
                    {
                        $sort: {'project_id': -1},
                    },
                    {
                        $skip: (10*page - 10)
                    },
                    {
                        $limit: 10
                    }
                ])
                totalData = Project.find({
                    com_id,
                    project_name: {$regex: keywords, $options: 'i'},
                }).count()
                listEpData = User.find({
                    // com_id,
                    'inForPerson.employee.com_id': com_id,
                    type: 2,
                }, {
                    _id: 1,
                    userName: 1,
                    'inForPerson.employee.position_id': 1,
                })
            }
            if (type === 2){
                const user_id = req.user.data._id
                const stringId = user_id.toString()
                projectData = Project.find({
                    com_id,
                    project_name: {$regex: keywords, $options: 'i'},
                    $text: {$search: stringId},
                }).sort({project_id: -1}).skip(10*page - 10).limit(10).lean()
                totalData = Project.find({
                    com_id,
                    project_name: {$regex: keywords, $options: 'i'},
                    $text: {$search: stringId},
                }).count()
                listEpData = User.find({
                    // com_id,
                    'inForPerson.employee.com_id': com_id,
                    type: 2,
                }, {
                    _id: 1,
                    userName: 1,
                    'inForPerson.employee.position_id': 1,
                })
            }
            const [project, total, listEp] = await Promise.all([projectData, totalData, listEpData])
            return functions.success(res, "Get projects successfully", {listRole: req.listRole,data: {
                project,
                total,
                listEp,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, "Failed to get projects", 500)
        }
    }

    // [POST] /projects/quan-ly-du-an-theo-danh-sach-cong-viec/them-du-an
    async themDuAn(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            if (!req.body.project_name || !req.body.project_management|| !req.body.project_member  || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                project_name,
                project_description,
                time_in,
                time_out,
                date_start,
                date_end,
                project_card,
                project_management,
                project_member,
                project_evaluate,
                project_follow,
                description,
                is_khancap,
             } = req.body
            const timeStart = functions.replaceDay(req.body.date_start + ' ' + req.body.time_in).getTime()/1000
            const timeEnd = functions.replaceDay(req.body.date_end + ' ' + req.body.time_out).getTime()/1000
            const now = functions.getTimeNow();
            if(timeStart > timeEnd || timeEnd < now || timeStart < now)
                return functions.setError(res, 'Vui lòng nhập vào thời gian hợp lệ', 400)
            const project_id = await functions.getMaxIdByFieldWithDeleted(Project, 'project_id')
            const project = new Project({
                project_id,
                com_id,
                created_at: now,
                created_by: type,
                project_name,
                project_description,
                time_in,
                time_out,
                date_start,
                date_end,
                project_card,
                project_management,
                project_member,
                project_evaluate,
                project_follow,
                project_type: 0,
                description,
                created_id: user_id,
                open_or_close: 1,
                is_khancap,
            })
            await project.save()
            return functions.success(res, "Add successfully!!", {listRole: req.listRole,data: {
                project,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }

    // [POST] /projects/quan-ly-du-an-theo-danh-sach-cong-viec/them-cong-viec
    async themCongViec(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            if (!req.body.job_name || !req.body.job_member  || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400) 
            const {
                job_name,
                job_card,
                job_description,
                job_member,
                job_follow,
                date_start,
                date_end,
                time_in,
                time_out,
                content,
                project_id,
                job_group_id,
            } = req.body
            const timeStart = functions.replaceDay(req.body.date_start + ' ' + req.body.time_in).getTime()/1000
            const timeEnd = functions.replaceDay(req.body.date_end + ' ' + req.body.time_out).getTime()/1000
            const now = functions.getTimeNow();
            if(timeStart > timeEnd || timeEnd < now || timeStart < now)
                return functions.setError(res, 'Vui lòng nhập vào thời gian hợp lệ', 400)
            const job_id = await functions.getMaxIdByFieldWithDeleted(Job, 'job_id')
            const prjMaxId = await functions.getMaxIdByFieldWithDeleted(Project, 'project_id')
            const id = job_id >= prjMaxId ? job_id : prjMaxId
            let job = new Job({
                project_id,
                job_group_id,
                job_name,
                job_card,
                job_description,
                job_member,
                job_follow,
                date_start,
                date_end,
                time_in,
                time_out,
                content,
                job_id: id,
                com_id,
                is_delete: 0,
                id_giaoviec: user_id,
                congty_or_nhanvien: type,
                created_at: now,
            })
            if(!project_id){      
                const project = new Project({
                    project_id: id,
                    com_id,
                    project_name: job_name,
                    project_description: job_description,
                    project_card: job_card,
                    project_type: 1,
                    project_member: job_member,
                    project_management: user_id,
                    created_id: user_id,
                    date_start,
                    date_end,
                    time_in,
                    time_out,
                    created_at: now
                })
                await project.save()
            }
            await job.save()
            return functions.success(res,"Action success", {listRole: req.listRole,data:{
                job,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }

    // [PUT] /projects/chi-tiet-du-an/:id/edit-cong-viec
    async suaCongViec(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            const job_id = req.params.id
            if (!req.body.job_name || !req.body.job_member  || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400) 
            const {
                job_name,
                job_card,
                job_description,
                job_member,
                job_follow,
                date_start,
                date_end,
                time_in,
                time_out,
                project_id,
                job_group_id,
            } = req.body
            const timeStart = functions.replaceDay(req.body.date_start + ' ' + req.body.time_in).getTime()/1000
            const timeEnd = functions.replaceDay(req.body.date_end + ' ' + req.body.time_out).getTime()/1000
            const now = functions.getTimeNow();
            if(timeStart > timeEnd || timeEnd < now || timeStart < now)
                return functions.setError(res, 'Vui lòng nhập vào thời gian hợp lệ', 400)
            const job = await Job.findOne({
                com_id,
                job_id
            },{
                job_group_id: 1,
                project_id: 1,
                _id: 0,
            })
            if(!job) return functions.setError(res, 'Do not found Job')
            let project_id_job = job.project_id
            let job_group_id_job = job.job_group_id
            project_id_job = project_id_job ? project_id_job : 0
            job_group_id_job = job_group_id_job ? job_group_id_job : 0
            if(job_group_id_job){
                const jobGroup = await JobGroup.findOne({id: job_group_id_job},
                    {
                        date_start: 1,
                        date_end: 1,
                        time_in: 1,
                        time_out: 1,
                        _id: 0,
                    }
                )
                const timeStart = functions.replaceDay(date_start+ ' ' + time_in).getTime()/1000
                const timeEnd = functions.replaceDay(date_end+ ' ' + time_out).getTime()/1000
                const timeLimitStart = functions.replaceDay(jobGroup.date_start+ ' ' + jobGroup.time_in).getTime()/1000
                const timeLimitEnd = functions.replaceDay(jobGroup.date_end+ ' ' + jobGroup.time_out).getTime()/1000
                if(timeStart <= timeLimitStart || timeEnd >= timeLimitEnd)
                    return functions.setError(res,
                    `Vui lòng nhập vào thời gian trong khoảng từ ${jobGroup.date_start+ ' ' + jobGroup.time_in} đến ${jobGroup.date_end+ ' ' + jobGroup.time_out}`,
                    )
            }
            else if(project_id_job){
                const project = await Project.findOne({project_id: project_id_job},
                    {
                        date_start: 1,
                        date_end: 1,
                        time_in: 1,
                        time_out: 1,
                        _id: 0,
                    }
                )
                const timeStart = functions.replaceDay(date_start+ ' ' + time_in).getTime()/1000
                const timeEnd = functions.replaceDay(date_end+ ' ' + time_out).getTime()/1000
                const timeLimitStart = functions.replaceDay(project.date_start+ ' ' + project.time_in).getTime()/1000
                const timeLimitEnd = functions.replaceDay(project.date_end+ ' ' + project.time_out).getTime()/1000
                if(timeStart <= timeLimitStart || timeEnd >= timeLimitEnd)
                    return functions.setError(res,
                    `Vui lòng nhập vào thời gian trong khoảng từ ${project.date_start+ ' ' + project.time_in} đến ${project.date_end+ ' ' + project.time_out}`,
                )
            }
            if(!project_id){
                await Project.updateOne({
                    com_id,
                    project_id: job_id,
                },
                {
                    project_name: job_name,
                    project_description: job_description,
                    project_card: job_card,
                    project_member: job_member,
                    updated_at: now
                })
            }else {
                await Project.deleteOne({
                    com_id,
                    project_id: job_id,
                })
            }
            await Job.updateOne({
                com_id,
                job_id
            },
            {
                project_id,
                job_group_id,
                job_name,
                job_card,
                job_description,
                job_member,
                job_follow,
                date_start,
                date_end,
                time_in,
                time_out,
                updated_at: now
            })
            return functions.success(res,"Action success", {listRole: req.listRole,data:{
                job: await Job.findOne({com_id, job_id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }
    // [DELETE] /projects/chi-tiet-du-an/:id/delete-cong-viec
    async xoaCongViec(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            const job_id = req.params.id
            const now = functions.getTimeNow()
            const job = await Job.findOne({com_id, job_id}, {
                _id: 0,
                project_id: 1
            })
            if(job && !job.project_id){
                await Project.updateOneWithDeleted({com_id ,project_id: job_id,}, {
                    is_delete: 1,
                    deleted_at: now,
                    deleted: true,
                })
            }
            await Job.updateOneWithDeleted({com_id ,job_id,}, {
                is_deleted: 1,
                deleted_at: now,
                deleted: true,
            })
            
            return functions.success(res, "Delete successfully", {listRole: req.listRole,})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Delete failure!!",501)
        }
    }

    // [POST] /projects/quan-ly-du-an-theo-danh-sach-cong-viec/thiet-lap-cong-viec-lap-lai
    async thietLapCongViecLapLai(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const id_giaoviec = req.user.data._id
            const congty_or_nhanvien = req.user.data.type
            const project_id = 0
            const job_group_id = 0
            if (!req.body.job_name || !req.body.job_member  || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out || !req.body.type_repeat || (!req.body.date_repeat && !req.body.day_repeat))
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400) 
            const {
                job_name,
                job_member,
                date_start,
                date_end,
                time_in,
                time_out,
                type_repeat,
                day_repeat,
                date_repeat,
            } = req.body
            const timeStart = functions.replaceDay(req.body.date_start + ' ' + req.body.time_in).getTime()/1000
            const timeEnd = functions.replaceDay(req.body.date_end + ' ' + req.body.time_out).getTime()/1000
            const now = functions.getTimeNow();
            if(timeStart > timeEnd || timeEnd < now || timeStart < now)
                return functions.setError(res, 'Vui lòng nhập vào thời gian hợp lệ', 400)
            const jobMaxId = await JobRepeat.findOneWithDeleted({}, {}, { sort: { job_id: -1 } }).lean() || 0
            let maxId = jobMaxId.job_id
            if(!maxId) maxId = 0
            const job_id = Number(maxId) + 1
            let job = new JobRepeat({
                project_id,
                job_group_id,
                job_name,
                job_member,
                date_start,
                date_end,
                time_in,
                time_out,
                type_repeat,
                day_repeat,
                date_repeat,
                job_id,
                com_id,
                id_giaoviec,
                congty_or_nhanvien,
                created_at: now,
            })
            await job.save()
            return functions.success(res,"Action success", {listRole: req.listRole,data:{
                job
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }

    // [GET] /projects/quan-ly-du-an-theo-danh-sach-quy-trinh
    async quanLyDuAnTheoQuyTrinh(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const page = req.params.page
            const keywords = req.query.keywords
            let process = []
            if(keywords){
                process = await gv.findByName(page, Process, 'process_name', keywords, {com_id})
            }else {
                process = await Process.find({
                    com_id
                }).skip(10*page - 10).limit(10).lean()
            }
            const listEp = await User.find({
                // com_id,
                'inForPerson.employee.com_id': com_id,
                type: 2,
            }, {
                _id: 1,
                userName: 1,
            })
            return functions.success(res, "Get processes successfully", {listRole: req.listRole,data: {
                process,
                listEp,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, "Failed to get processes", 500)
        }
    }

    // [POST] /projects/quan-ly-du-an-theo-quy-trinh/them-quy-trinh
    async themQuyTrinh(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const created_id = req.user.data._id
            const created_by = req.user.data.type
            if (!req.body.process_name || !req.body.process_management|| !req.body.process_member  || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out || !req.body.process_failure)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                process_card,
                process_name,
                process_management,
                process_member,
                process_evaluate,
                process_follow,
                process_description,
                process_failure,
                time_in,
                time_out,
                date_start,
                date_end,
                process_status,
                process_open_close,
            } = req.body
            const timeStart = functions.replaceDay(req.body.date_start + ' ' + req.body.time_in).getTime()/1000
            const timeEnd = functions.replaceDay(req.body.date_end + ' ' + req.body.time_out).getTime()/1000
            const now = functions.getTimeNow();
            if(timeStart > timeEnd || timeEnd < now || timeStart < now)
                return functions.setError(res, 'Vui lòng nhập vào thời gian hợp lệ', 400)
            const process_id = await functions.getMaxIdByFieldWithDeleted(Process, 'process_id')
            let process = new Process({
                process_card,
                process_name,
                process_management,
                process_member,
                process_evaluate,
                process_follow,
                process_description,
                process_failure,
                time_in,
                time_out,
                date_start,
                date_end,
                process_status: 1,
                process_open_close: 1,
                created_by,
                created_id,
                process_id,
                com_id,
                created_at: now,
            })
            await process.save()
            return functions.success(res,"Action success", {listRole: req.listRole,data:{
                process
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }

    // [PUT] /projects/chi-tiet-du-an-theo-quy-trinh/:id/edit
    async suaQuyTrinh(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const timeStart = functions.replaceDay(req.body.date_start + ' ' + req.body.time_in).getTime()/1000
            const timeEnd = functions.replaceDay(req.body.date_end + ' ' + req.body.time_out).getTime()/1000
            const now = functions.getTimeNow();
            if(timeStart > timeEnd || timeEnd < now || timeStart < now)
                return functions.setError(res, 'Vui lòng nhập vào thời gian hợp lệ', 400)
            const {
                process_card,
                process_name,
                process_management,
                process_member,
                process_evaluate,
                process_follow,
                process_description,
                process_failure,
                option,
                time_in,
                time_out,
                date_start,
                date_end,
            } = req.body
            await Process.updateOne(
                {
                    process_id: req.params.id,
                    com_id
                },
                {
                    process_card,
                    process_name,
                    process_management,
                    process_member,
                    process_evaluate,
                    process_follow,
                    process_description,
                    process_failure,
                    option,
                    time_in,
                    time_out,
                    date_start,
                    date_end,
                    updated_at: now
                }
            )
            return functions.success(res,"Edit success", {listRole: req.listRole,data:{
                newProcess: await Process.findOne({
                    process_id: req.params.id,
                    com_id
                })
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Edit failure!!", 501)
        }  
    }

    // [DELETE] /projects/chi-tiet-du-an-theo-quy-trinh/:id/delete
    async xoaQuyTrinh(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const now = functions.getTimeNow()
            const process_id = req.params.id
            await Process.updateOneWithDeleted({com_id ,process_id}, {
                is_delete: 1,
                deleted_at: now,
            })
            await Process.delete({com_id, process_id})
            return functions.success(res, "Delete successfully", { listRole: req.listRole,data: {
                process: await Process.findOneWithDeleted({process_id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Delete failure!!",501)
        }
    }

    // [PUT] /projects/chi-tiet-du-an-theo-quy-trinh/:id/switch
    async switchQuyTrinh(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const process = await Process.findOne({com_id ,process_id: req.params.id})
            if(process.process_open_close){
                const process_status = req.body.process_status
                await Process.updateOne(
                    {
                        com_id,
                        process_id: req.params.id,
                    },
                    {
                        process_open_close: 0,
                        process_status,
                    })
            }
            else {
                await Process.updateOne(
                    {
                        com_id,
                        process_id: req.params.id,
                    },
                    {
                        process_open_close: 1,
                    })
            }
            
            return functions.success(res, 'Action successfully', { listRole: req.listRole,data: {
                process
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    // [PUT] /projects/chi-tiet-du-an-theo-quy-trinh/role
    async suaQuyenQuyTrinh(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            await ProcessRoleStaff.deleteMany({com_id})
            const id = await functions.getMaxIdByField(ProcessRoleStaff, 'id')
            const managementProcessRole = new ProcessRoleStaff({
                id,
                role_id: 1,
                com_id,
                permission_process: req.body.checked_management,
            })
            const employeeProcessRole = new ProcessRoleStaff({
                id: id+1,
                role_id: 2,
                com_id,
                permission_process: req.body.checked_ep,
            })
            await managementProcessRole.save()
            await employeeProcessRole.save()
            return functions.success(res, 'Action successfully', { listRole: req.listRole,data: {
                managementProcessRole,
                employeeProcessRole,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    // [PUT] /projects/chi-tiet-du-an-theo-quy-trinh/:id/edit-follow
    async chinhSuaTheoDoi(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const now = functions.getTimeNow()
            const process_follow = req.body.process_follow?req.body.process_follow:''
            const process_id = req.params.id
            await Process.updateOne({
                com_id,
                process_id,
            },{
                process_follow,
                updated_at: now,
            })
            return functions.success(res, 'Action successfully', { listRole: req.listRole,data: {
                process: await Process.findOne({process_id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    // [GET] /projects/chi-tiet-du-an-theo-quy-trinh/:id/option
    async dsOption(req, res){
        try{
            const process_id = req.params.id
            const processOption = await ProcessOption.find({process_id})
            return functions.success(res, 'Option successfully', { listRole: req.listRole,data: {
                processOption
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    // [POST] /projects/chi-tiet-du-an-theo-quy-trinh/:id/add-option
    async themOption(req, res){
        try{
            if (!req.body.type_option || !req.body.name_option|| !req.body.des_option  || !req.body.with_stage)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            let {
                type_option,
                name_option,
                des_option,
                is_required,
                with_stage,
                list_dropdown,
            } = req.body    
            const id = await functions.getMaxIdByField(ProcessOption, 'id')
            const process_id = req.params.id
            const processOption = new ProcessOption({
                id,
                process_id,
                type_option,
                name_option,
                des_option,
                is_required,
                with_stage,
                list_dropdown,
            })
            await processOption.save()
            return functions.success(res, 'Action successfully', { listRole: req.listRole,data: {
                processOption
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    // [PUT] /projects/chi-tiet-du-an-theo-quy-trinh/edit-option/:id
    async suaOption(req, res){
        try{
            if (!req.body.type_option || !req.body.name_option|| !req.body.des_option  || !req.body.with_stage)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                type_option,
                name_option,
                des_option,
                is_required,
                with_stage,
                list_dropdown,
            } = req.body    
            await ProcessOption.updateOne({id:req.params.id},{
                type_option,
                name_option,
                des_option,
                is_required,
                with_stage,
                list_dropdown,
            })
            return functions.success(res, 'Action successfully', { listRole: req.listRole,data: {
                processOption: await ProcessOption.findOne({id:req.params.id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    // [DELETE] /projects/chi-tiet-du-an-theo-quy-trinh/delete-option/:id
    async xoaOption(req, res){
        try {
            await ProcessOption.deleteOne({id:req.params.id})
            return functions.success(res, 'Action successfully', { listRole: req.listRole,data: {
            }})
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    // [GET] /projects/chi-tiet-du-an-theo-danh-sach-cong-viec/:id
    async chiTietDuAnTheoDanhSachCongViec(req, res, next){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const project_id = req.params.id
            const project = await Project.findOne({project_id,com_id}).lean()
            const jobGroup = await JobGroup.find(
                {
                    com_id,
                    project_id,
                },{_id: 0}
            ).lean()
            let jobDetail = []
            const countJobGroup = jobGroup.length
            for(let i = 0; i < countJobGroup; i++){
                const job = await Job.find(
                    {
                        com_id,
                        project_id,
                        job_group_id : jobGroup[i].id
                    },
                    {
                        _id: 0,
                    }
                )
                jobDetail[i] = {
                    ...jobGroup[i],
                    job,
                }
            }

            // Danh sách người theo dõi
            let listFollow = []
            const follow = await Project.findOne({project_id}, {
                project_follow: 1,
                _id: 0,
            })
            const string = follow && follow.project_follow ? follow.project_follow : ''
            const listId = string.split(',')
            const count = listId.length
            for (let i = 0; i < count; i++) {
                const user = await User.findOne({_id: Number(listId[i])}, 'userName')
                if(user){
                    listFollow[i] = {
                        userName: user.userName,
                        _id: Number(listId[i]),
                    }
                } 
            }
            const listEp = await User.find({
                // com_id,
                'inForPerson.employee.com_id': com_id,
                type: 2,
            }, {
                userName: 1,
                _id: 1,
            })

            return functions.success(res, 'Action successfuly', {listRole: req.listRole,data: {
                project,
                jobDetail,
                listFollow,
                listEp,
            }})
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Action failed', 501)            
        }
    }

    // [POST] /projects/chi-tiet-du-an-theo-danh-sach-cong-viec/:id/thiet-lap-cong-viec-lap-lai
    async thietLapCongViecLapLaiChiTiet(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            if (!req.body.job_name || !req.body.job_member  || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out || !req.body.type_repeat || (!req.body.date_repeat && !req.body.day_repeat))
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            let com_id
            const type = req.user.data.type
            const user_id = req.user.data._id
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const project_id = req.params.id
            const {
                job_group_id,
                job_name,
                job_member,
                date_start,
                date_end,
                time_in,
                time_out,
                type_repeat,
                day_repeat,
                date_repeat,
            } = req.body
            const timeStart = functions.replaceDay(req.body.date_start + ' ' + req.body.time_in).getTime()/1000
            const timeEnd = functions.replaceDay(req.body.date_end + ' ' + req.body.time_out).getTime()/1000
            const now = functions.getTimeNow();
            if(timeStart > timeEnd || timeEnd < now || timeStart < now)
                return functions.setError(res, 'Vui lòng nhập vào thời gian hợp lệ', 400)
            const jobMaxId = await JobRepeat.findOneWithDeleted({}, {}, { sort: { job_id: -1 } }).lean() || 0
            let maxId = jobMaxId.job_id
            if(!maxId) maxId = 0
            const job_id = Number(maxId) + 1
            let job = new JobRepeat({
                project_id,
                job_group_id,
                job_name,
                job_member,
                date_start,
                date_end,
                time_in,
                time_out,
                type_repeat,
                day_repeat,
                date_repeat,
                job_id,
                com_id,
                id_giaoviec: user_id,
                congty_or_nhanvien: type,
                created_at: now,
            })
            await job.save()
            return functions.success(res,"Action success", {listRole: req.listRole,data:{
                job
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }

    // [GET] /projects/danh-sach-lap-lai
    async danhSachLapLai(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const per = req.params.page
            const keywords = req.query.keywords
            let jobRepeat
            if(keywords){
                jobRepeat = await gv.findByName(per, JobRepeat, ['job_name'], keywords, com_id)
            }else {
                jobRepeat = await JobRepeat.find({com_id}).skip(10*per - 10).limit(10).lean()
            }
            
            return functions.success(res,"Action success", {listRole: req.listRole,data:{
                jobRepeat
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }

    // [PUT] /projects/danh-sach-lap-lai/:id/edit
    async chinhSuaCongViecLapLai(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            if (!req.body.job_name || !req.body.job_member  || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out || !req.body.type_repeat || (!req.body.date_repeat && !req.body.day_repeat))
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const job_id = req.params.id
            const {
                job_name,
                job_member,
                date_start,
                date_end,
                time_in,
                time_out,
                type_repeat,
                day_repeat,
                date_repeat,
            } = req.body
            const timeStart = functions.replaceDay(req.body.date_start + ' ' + req.body.time_in).getTime()/1000
            const timeEnd = functions.replaceDay(req.body.date_end + ' ' + req.body.time_out).getTime()/1000
            const now = functions.getTimeNow();
            if(timeStart > timeEnd || timeEnd < now || timeStart < now)
                return functions.setError(res, 'Vui lòng nhập vào thời gian hợp lệ', 400)
            await JobRepeat.updateOne({com_id, job_id},{
                job_name,
                job_member,
                date_start,
                date_end,
                time_in,
                time_out,
                type_repeat,
                day_repeat,
                date_repeat,
            })
            return functions.success(res,"Action success", {listRole: req.listRole,data:{
                job: await JobRepeat.findOne({com_id, job_id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }

    // [DELETE] /projects/danh-sach-lap-lai/:id/delete
    async xoaCongViecLapLai(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            await JobRepeat.delete({job_id: req.params.id})
            return functions.success(res, "Delete successfully", { listRole: req.listRole,data: {
                jobRepeat: await JobRepeat.findOneWithDeleted({project_id: req.params.id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Delete failure!!",501)
        }
    }

    // [POST] /projects/chi-tiet-du-an-theo-danh-sach-cong-viec/:id/add-cong-viec
    async themCongViecChiTiet(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const id_giaoviec = req.user.data._id
            const congty_or_nhanvien = req.user.data.type
            if (!req.body.job_name || !req.body.job_member  || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out)
            return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400) 
            const {
                job_group_id,
                job_name,
                job_card,
                job_description,
                job_member,
                job_follow,
                content,
                date_start,
                date_end,
                time_in,
                time_out,
            } = req.body
            if(job_group_id){
                const jobGroup = await JobGroup.findOne({id: job_group_id},
                    {
                        date_start: 1,
                        date_end: 1,
                        time_in: 1,
                        time_out: 1,
                        _id: 0,
                    })
                const timeStart = functions.replaceDay(date_start+ ' ' + time_in).getTime()/1000
                const timeEnd = functions.replaceDay(date_end+ ' ' + time_out).getTime()/1000
                const timeLimitStart = functions.replaceDay(jobGroup.date_start+ ' ' + jobGroup.time_in).getTime()/1000
                const timeLimitEnd = functions.replaceDay(jobGroup.date_end+ ' ' + jobGroup.time_out).getTime()/1000
                if(timeStart <= timeLimitStart || timeEnd >= timeLimitEnd)
                    return functions.setError(res,
                    `Vui lòng nhập vào thời gian trong khoảng từ ${jobGroup.date_start+ ' ' + jobGroup.time_in} đến ${jobGroup.date_end+ ' ' + jobGroup.time_out}`,
                    )
            }
            const timeStart = functions.replaceDay(req.body.date_start + ' ' + req.body.time_in).getTime()/1000
            const timeEnd = functions.replaceDay(req.body.date_end + ' ' + req.body.time_out).getTime()/1000
            const now = functions.getTimeNow();
            if(timeStart > timeEnd || timeEnd < now || timeStart < now)
                return functions.setError(res, 'Vui lòng nhập vào thời gian hợp lệ', 400)
            const jobMaxId = await Job.findOneWithDeleted({}, {}, { sort: { job_id: -1 } }).lean() || 0
            let maxId = jobMaxId.job_id
            if(!maxId) maxId = 0
            const job_id = Number(maxId) + 1
            const project_id = req.params.id
            let job = new Job({
                project_id,
                job_group_id,
                job_name,
                job_card,
                job_description,
                job_member,
                job_follow,
                date_start,
                date_end,
                time_in,
                time_out,
                content,
                id_giaoviec,
                congty_or_nhanvien,
                job_id,
                com_id,
                created_at: now,
            })
            await job.save()
            return functions.success(res,"Action success", {listRole: req.listRole,data:{
                job
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }

    // [POST] /projects/chi-tiet-du-an-theo-danh-sach-cong-viec/:id/add-nhom-cong-viec
    async themNhomCongViec(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if(!req.body.name || !req.body.project_manager || !req.body.project_member || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                name,
                card,
                description,
                project_manager,
                project_member,
                date_start,
                date_end,
                time_in,
                time_out,
            } = req.body
            const now = functions.getTimeNow();
            const id = await functions.getMaxIdByFieldWithDeleted(JobGroup, 'id')
            const project_id = req.params.id
            const project = await Project.findOne({project_id},
                {
                    date_start: 1,
                    date_end: 1,
                    time_in: 1,
                    time_out: 1,
                    _id: 0,
                })
            const timeStart = functions.replaceDay(date_start+ ' ' + time_in).getTime()/1000
            const timeEnd = functions.replaceDay(date_end+ ' ' + time_out).getTime()/1000
            const timeLimitStart = functions.replaceDay(project.date_start+ ' ' + project.time_in).getTime()/1000
            const timeLimitEnd = functions.replaceDay(project.date_end+ ' ' + project.time_out).getTime()/1000
            if(timeStart <= timeLimitStart || timeEnd >= timeLimitEnd)
                return functions.setError(res,
                `Vui lòng nhập vào thời gian trong khoảng từ ${project.date_start+ ' ' + project.time_in} đến ${project.date_end+ ' ' + project.time_out}`,
                )
            let jobGroup = new JobGroup({
                project_id,
                name,
                card,
                description,
                project_manager,
                project_member,
                date_start,
                date_end,
                time_in,
                time_out,
                com_id,
                id,
                created_at: now,
            })
            await jobGroup.save()
            return functions.success(res,"Action success", {listRole: req.listRole,data:{
                jobGroup
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }


    // [PUT] /projects/chi-tiet-du-an-theo-danh-sach-cong-viec/:id/edit-nhom-cong-viec/:groupId
    async suaNhomCongViec(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if(!req.body.name || !req.body.project_manager || !req.body.project_member || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                name,
                card,
                description,
                project_manager,
                project_member,
                date_start,
                date_end,
                time_in,
                time_out,
            } = req.body
            const id = req.params.groupId
            const project_id = req.params.id
            const project = await Project.findOne({project_id},
                {
                    date_start: 1,
                    date_end: 1,
                    time_in: 1,
                    time_out: 1,
                    _id: 0,
                })
            const timeStart = functions.replaceDay(date_start+ ' ' + time_in).getTime()/1000
            const timeEnd = functions.replaceDay(date_end+ ' ' + time_out).getTime()/1000
            const timeLimitStart = functions.replaceDay(project.date_start+ ' ' + project.time_in).getTime()/1000
            const timeLimitEnd = functions.replaceDay(project.date_end+ ' ' + project.time_out).getTime()/1000
            if(timeStart <= timeLimitStart || timeEnd >= timeLimitEnd)
                return functions.setError(res,
                `Vui lòng nhập vào thời gian trong khoảng từ ${project.date_start+ ' ' + project.time_in} đến ${project.date_end+ ' ' + project.time_out}`,
                )
            const now = functions.getTimeNow()
            await JobGroup.updateOne({com_id, id, project_id}, {
                name,
                card,
                description,
                project_manager,
                project_member,
                date_start,
                date_end,
                time_in,
                time_out,
                updated_at: now
            })
            return functions.success(res,"Action success", {listRole: req.listRole,data:{
                jobGroup: await JobGroup.findOneWithDeleted({com_id, id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }

    // [DELETE] /projects/chi-tiet-du-an-theo-danh-sach-cong-viec/:id/delete-nhom-cong-viec/:groupId
    async xoaNhomCongViec(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            const now = functions.getTimeNow()
            const id = req.params.groupId
            await JobGroup.updateOneWithDeleted({id}, {
                is_delete: 1,
                deleted_at: now
            })
            await JobGroup.delete({id})
            return functions.success(res, "Delete successfully", { listRole: req.listRole,data: {
                jobGroup: await JobGroup.findOneWithDeleted({id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Delete failure!!",501)
        }
    }

    // [POST] /projects/chi-tiet-du-an-theo-danh-sach-cong-viec/:id/edit-du-an
    async suaDuAn(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if (!req.body.project_name || !req.body.project_management|| !req.body.project_member  || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                project_name,
                project_description,
                time_in,
                time_out,
                date_start,
                date_end,
                project_card,
                project_management,
                project_member,
                project_evaluate,
                project_follow,
            } = req.body
            const timeStart = functions.replaceDay(req.body.date_start + ' ' + req.body.time_in).getTime()/1000
            const timeEnd = functions.replaceDay(req.body.date_end + ' ' + req.body.time_out).getTime()/1000
            const now = functions.getTimeNow();
            if(timeStart > timeEnd || timeEnd < now || timeStart < now)
                return functions.setError(res, 'Vui lòng nhập vào thời gian hợp lệ', 400)
            await Project.updateOne(
                {
                    project_id: req.params.id,
                   com_id
                },
                {
                    project_name,
                    project_description,
                    time_in,
                    time_out,
                    date_start,
                    date_end,
                    project_card,
                    project_management,
                    project_member,
                    project_evaluate,
                    project_follow,
                    updated_at: now
                }
            )
            return functions.success(res,"Edit success", {listRole: req.listRole,data:{
                newProject: await Project.findOne({
                    project_id: req.params.id,
                })
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Edit failure!!", 501)
        }  
    }

    // [DELETE] /projects/chi-tiet-du-an-theo-danh-sach-cong-viec/:id/delete-du-an
    async xoaDuAn(req, res){
        try {
            const now = functions.getTimeNow()
            await Project.updateOneWithDeleted({project_id: req.params.id}, {
                is_delete: 1,
                deleted_at: now
            })
            await Project.delete({project_id: req.params.id})
            return functions.success(res, "Delete successfully", { listRole: req.listRole,data: {
                project: await Project.findOneWithDeleted({project_id: req.params.id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Delete failure!!",501)
        }
    }

    // [PUT] /projects/chi-tiet-du-an-theo-danh-sach-cong-viec/:id/switch
    async switchDuAn(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const project = await Project.findOne({project_id: req.params.id})
            if(!project) return functions.setError(res, 'Không tìm thấy project' )
            if(project.open_or_close === 1){
                const type1 = req.body.type
                await Project.updateOne(
                    {
                        com_id,
                        project_id: req.params.id,
                    },
                    {
                        open_or_close: 0,
                        type: type1,
                    })
            }
            else {
                await Project.updateOne(
                    {
                        com_id,
                        project_id: req.params.id
                    },
                    {
                        open_or_close: 1
                    })
            }
            
            return functions.success(res, 'Action successfully', { listRole: req.listRole,data: {
                project: await Project.findOne({project_id: req.params.id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    // [PUT] /projects/chi-tiet-du-an-theo-danh-sach-cong-viec/role
    async suaQuyenDuAn(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            await ProjectRoleStaff.deleteMany({com_id})
            const id = await functions.getMaxIdByField(ProjectRoleStaff, 'id')
            const id2 = id + 1
            const managementProjectRole = new ProjectRoleStaff({
                id: id,
                role_id: 1,
                com_id,
                permission_project: req.body.checked_management,
            })
            const employeeProjectRole = new ProjectRoleStaff({
                id: id2,
                role_id: 2,
                com_id,
                permission_project: req.body.checked_ep,
            })
            await Promise.all([
                managementProjectRole.save(),
                employeeProjectRole.save(),
            ])

            return functions.success(res, 'Action successfully', { listRole: req.listRole,data: {
                managementProjectRole,
                employeeProjectRole,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

     // [PUT] /projects/chi-tiet-du-an-theo-danh-sach-cong-viec/:id/edit-follow
    async chinhSuaTheoDoiDuAn(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const now = functions.getTimeNow()
            const project_follow = req.body.project_follow
            const project_id = req.params.id
            await Project.updateOne({
                com_id,
                project_id,
            },{
                project_follow,
                updated_at: now,
            })
            return functions.success(res, 'Action successfully', { listRole: req.listRole,data: {
                project: await Project.findOne({project_id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    // 

    // [GET] /projects/chi-tiet-du-an-theo-quy-trinh/:id
    async chiTietDuAnTheoQuyTrinh(req, res, next){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if(!req.params.id) return functions.setErroe(res, 'Do not found process_id')
            const process_id = Number(req.params.id)
            let processStage = await ProcessStage.find(
                {
                    com_id,
                    process_id,
                },
            )
            const countProcessStage = processStage.length
            for(let i = 0; i < countProcessStage; i++){
                // const stageMission = await StageMission.find({
                //     process_id,
                //     stage_id: processStage[i].id,
                // })
                const stageMission = await StageMission.aggregate([
                    {
                        $match: {
                            process_id,
                            stage_id: processStage[i].id,
                        }
                    },
                    {
                        $lookup: {
                            from: 'Users',
                            let: {id: {$toInt: '$misssion_staff_id'}},
                            pipeline: [
                                {
                                    $match: {$expr: {$eq: ['$_id', '$$id']}}
                                }
                            ],
                            as: 'user',
                        }
                    },
                    {$unwind: '$user'},
                    {
                        $project: {
                            'id':'$id',
                            'stage_id':'$stage_id',
                            'process_id':'$process_id',
                            'name_misssion':'$name_misssion',
                            'card':'$card',
                            'misssion_description':'$misssion_description',
                            'misssion_staff_id':'$misssion_staff_id',
                            'misssion_staff_name':'$user.userName',
                            'misssion_repeat':'$misssion_repeat',
                            'is_delete':'$is_delete',
                            'deleted_at':'$deleted_at',
                            'created_at':'$created_at',
                            'updated_at':'$updated_at',
                            'change_stage_at':'$change_stage_at',
                            'hour_complete':'$hour_complete',
                            'quanli_danhgia':'$quanli_danhgia',
                            'nhanvien_danhgia':'$nhanvien_danhgia',
                            'com_id':'$com_id',
                            'first_member':'$first_member',
                            'failed_reason':'$failed_reason',
                            'result_job':'$result_job',
                            'id_giaovien':'$id_giaovien',
                            'congty_or_nhanvien':'$congty_or_nhanvien',
                            'deleted':'$deleted',
                        }
                    }
                ])
                const {
                    id,
                    name,
                    stage_management,
                    stage_member,
                    stage_evaluate,
                    completion_time,
                    status_completion_time,
                    locations,
                    result,
                    is_delete,
                    deleted_at,
                    created_at,
                    updated_at,
                    com_id,
                } = processStage[i]
                processStage[i] = {
                    id,
                    process_id,
                    name,
                    stage_management,
                    stage_member,
                    stage_evaluate,
                    completion_time,
                    status_completion_time,
                    locations,
                    result,
                    is_delete,
                    deleted_at,
                    created_at,
                    updated_at,
                    com_id,
                    stageMission,
                }
            }

            const listMissionSuccess = await StageMission.aggregate([
                {
                    $match: {
                        com_id, process_id, stage_id: 111
                    }
                },
                {
                    $lookup: {
                        from: 'Users',
                        let: {id: {$toInt: '$misssion_staff_id'}},
                        pipeline: [
                            {
                                $match: {$expr: {$eq: ['$_id', '$$id']}}
                            }
                        ],
                        as: 'user',
                    }
                },
                {$unwind: '$user'},
                {
                    $project: {
                        'id':'$id',
                        'stage_id':'$stage_id',
                        'process_id':'$process_id',
                        'name_misssion':'$name_misssion',
                        'card':'$card',
                        'misssion_description':'$misssion_description',
                        'misssion_staff_id':'$misssion_staff_id',
                        'misssion_staff_name':'$user.userName',
                        'misssion_repeat':'$misssion_repeat',
                        'is_delete':'$is_delete',
                        'deleted_at':'$deleted_at',
                        'created_at':'$created_at',
                        'updated_at':'$updated_at',
                        'change_stage_at':'$change_stage_at',
                        'hour_complete':'$hour_complete',
                        'quanli_danhgia':'$quanli_danhgia',
                        'nhanvien_danhgia':'$nhanvien_danhgia',
                        'com_id':'$com_id',
                        'first_member':'$first_member',
                        'failed_reason':'$failed_reason',
                        'result_job':'$result_job',
                        'id_giaovien':'$id_giaovien',
                        'congty_or_nhanvien':'$congty_or_nhanvien',
                        'deleted':'$deleted',
                    }
                }
            ])
            processStage.push({
                id: 111,
                stageMission: listMissionSuccess
            })

            const listMissionFail = await StageMission.aggregate([
                {
                    $match: {
                        com_id, process_id, stage_id: 222
                    }
                },
                {
                    $lookup: {
                        from: 'Users',
                        let: {id: {$toInt: '$misssion_staff_id'}},
                        pipeline: [
                            {
                                $match: {$expr: {$eq: ['$_id', '$$id']}}
                            }
                        ],
                        as: 'user',
                    }
                },
                {$unwind: '$user'},
                {
                    $project: {
                        'id':'$id',
                        'stage_id':'$stage_id',
                        'process_id':'$process_id',
                        'name_misssion':'$name_misssion',
                        'card':'$card',
                        'misssion_description':'$misssion_description',
                        'misssion_staff_id':'$misssion_staff_id',
                        'misssion_staff_name':'$user.userName',
                        'misssion_repeat':'$misssion_repeat',
                        'is_delete':'$is_delete',
                        'deleted_at':'$deleted_at',
                        'created_at':'$created_at',
                        'updated_at':'$updated_at',
                        'change_stage_at':'$change_stage_at',
                        'hour_complete':'$hour_complete',
                        'quanli_danhgia':'$quanli_danhgia',
                        'nhanvien_danhgia':'$nhanvien_danhgia',
                        'com_id':'$com_id',
                        'first_member':'$first_member',
                        'failed_reason':'$failed_reason',
                        'result_job':'$result_job',
                        'id_giaovien':'$id_giaovien',
                        'congty_or_nhanvien':'$congty_or_nhanvien',
                        'deleted':'$deleted',
                    }
                }
            ])
            processStage.push({
                id: 222,
                stageMission: listMissionFail
            })

            // Danh sách người theo dõi
            let listFollow = []
            const follow = await Process.findOne({process_id}, {
                _id: 0,
            }).lean()
            const string = follow && follow.process_follow ? follow.process_follow : ''
            const listId = string?string.split(','):[]
            
            const count = listId.length
            for (let i = 0; i < count; i++) {
                const user = await User.findOne({_id: Number(listId[i])}, 'userName')
                if(user){
                    listFollow[i] = {
                        userName: user.userName,
                        _id: Number(listId[i]),
                    }
                }
            }
            const listEp = await User.find({
                type: 2,
                'inForPerson.employee.com_id': com_id,
            }, 'userName')
            return functions.success(res, 'Get the data successfully', { listRole: req.listRole,data: {
                process: follow,
                processStage,
                listFollow,
                listEp,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Failed to get process detail', 500)
        }
    }

    // [POST] /projects/chi-tiet-du-an-theo-quy-trinh/chuyen-giai-doan/:id
    async chuyenGiaiDoan(req, res){
        try {
            const id = req.params.id
            const now = functions.getTimeNow()
            const {
                stage_id,
                misssion_staff_id,
                hour_complete,
            } = req.body
            await StageMission.updateOne({id}, {
                change_stage_at: now,
                stage_id,
                misssion_staff_id,
                hour_complete,
            })
            return functions.success(res, 'Acion successfuly', {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Action failed', 501)
        }
    }

    // [POST] /projects/chi-tiet-du-an-theo-quy-trinh/:id/add-mission
    async themNhiemVu(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            const user_id = req.user.data._id
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if (!req.body.name_misssion || !req.body.misssion_staff_id)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                name_misssion,
                card,
                misssion_description,
                misssion_staff_id,
            } = req.body
            const now = functions.getTimeNow()
            const id = await functions.getMaxIdByFieldWithDeleted(StageMission, 'id')
            const process_id = req.params.id
            const process = await Process.findOne({com_id, process_id}, {
                _id: 0,
                date_start: 1,
                time_in: 1,
            })
            const timeStart = functions.replaceDay(process.date_start+ ' ' + process.time_in).getTime()/1000
            const processStage = await ProcessStage.findOne({
                com_id,
                process_id: req.params.id,
            }).sort({locations: 1})
            const stage_id = processStage.id
            const hour_complete = processStage.completion_time*3600 + timeStart
            const stageMission = new StageMission({
                id,
                process_id,
                stage_id,
                name_misssion,
                card,
                misssion_description,
                misssion_staff_id,
                created_at: now,
                congty_or_nhanvien: type,
                id_giaovien: user_id,
                com_id,
                hour_complete,
            })
            await stageMission.save()
            return functions.success(res, 'Add mission successfully', { listRole: req.listRole,data: {
                stageMission
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Failed to add mission', 500)
        }
    }

    // [PUT] /projects/chi-tiet-du-an-theo-quy-trinh/edit-mission/:id
    async suaNhiemVu(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if (!req.body.name_misssion || !req.body.misssion_staff_id)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const now = functions.getTimeNow()
            const {
                name_misssion,
                card,
                misssion_description,
                misssion_staff_id,
            } = req.body
            await StageMission.updateOne(
                {
                    id: req.params.id,
                    com_id
                },
                {
                    name_misssion,
                    card,
                    misssion_description,
                    misssion_staff_id,
                    updated_at: now
                }
            )
            return functions.success(res,"Edit success", {listRole: req.listRole,data:{
                newProcess: await StageMission.findOne({
                    id: req.params.id,
                    com_id
                })
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Edit failure!!", 501)
        }
    }

    // [DELETE] /projects/chi-tiet-du-an-theo-quy-trinh/:id/delete-mission
    async xoaNhiemVu(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const now = functions.getTimeNow()
            await StageMission.updateOneWithDeleted({id: req.params.id, com_id}, {
                is_delete: 1,
                deleted_at: now
            })
            await StageMission.delete({id: req.params.id})
            return functions.success(res, "Delete successfully", { listRole: req.listRole,data: {
                stageMission: await StageMission.findOneWithDeleted({id: req.params.id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Delete failure!!",501)
        }
    }

    // [POST] /projects/chi-tiet-du-an-theo-quy-trinh/:id/add-stage
    async themGiaiDoan(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if (!req.body.name || !req.body.stage_management || !req.body.stage_member || !req.body.stage_evaluate || !req.body.completion_time)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const {
                name,
                stage_management,
                stage_member,
                stage_evaluate,
                completion_time,
                status_completion_time,
            } = req.body
            let is_delete = req.body.is_delete
            if(!is_delete) is_delete = 0
            const now = functions.getTimeNow()
            let id = await functions.getMaxIdByFieldWithDeleted(ProcessStage, 'id')
            if(id === 111 || id === 222) id++
            const process_id = req.params.id
            const locations = await ProcessStage.find({process_id}).count() + 1
            const processStages = new ProcessStage({
                id,
                process_id,
                name,
                stage_management,
                stage_member,
                stage_evaluate,
                completion_time,
                status_completion_time,
                locations,
                is_delete,
                created_at: now,
                com_id,
            })
            await processStages.save()
            return functions.success(res, 'Add stage successfully', { listRole: req.listRole,data: {
                processStages
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Failed to add stage', 500)
        }
    }

    // [PUT] /projects/chi-tiet-du-an-theo-quy-trinh/edit-stage/:id
    async suaGiaiDoan(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if (!req.body.name || !req.body.stage_management || !req.body.stage_member || !req.body.stage_evaluate || !req.body.completion_time)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400)
            const now = functions.getTimeNow()
            const {
                name,
                stage_management,
                stage_member,
                stage_evaluate,
                completion_time,
                status_completion_time,
            } = req.body
            await ProcessStage.updateOne(
                {
                    id: req.params.id,
                    com_id
                },
                {
                    name,
                    stage_management,
                    stage_member,
                    stage_evaluate,
                    completion_time,
                    status_completion_time,
                    updated_at: now,
                }
            )
            return functions.success(res,"Action success", {listRole: req.listRole,data:{
                newProcess: await ProcessStage.findOne({
                    id: req.params.id,
                    com_id
                })
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!", 501)
        }
    }

    // [DELETE] /projects/chi-tiet-du-an-theo-quy-trinh/:id/delete-stage
    async xoaGiaiDoan(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const now = functions.getTimeNow()
            const deletedStage = await ProcessStage.findOneWithDeleted({id: req.params.id},{
                _id: 0,
                process_id: 1,
                locations: 1,
            })
            const process_id = deletedStage.process_id
            const locations = deletedStage.locations
            const processStage = await ProcessStage.find({
                process_id,
                com_id,
            }).count()
            for(let i = locations+1; i <= processStage; i++){
                await ProcessStage.updateOne({
                    process_id,
                    com_id,
                    locations: i,
                },{
                    locations: i-1
                })
            }
            await ProcessStage.updateOneWithDeleted({id: req.params.id}, {
                is_delete: 1,
                deleted_at: now
            })
            await ProcessStage.delete({id: req.params.id})
            return functions.success(res, "Delete successfully", { listRole: req.listRole,data: {
                processStage: await ProcessStage.findOneWithDeleted({id: req.params.id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Delete failure!!",501)
        }
    }

    // [GET] /projects/chi-tiet-du-an/:id
    async chiTietDuAn(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if(!req.params.id) return functions.setError(res, 'Not enough data', 401)
            const job_id = Number(req.params.id)
            const job = await Job.findOne({
                com_id, 
                job_id
            },{
                project_id : 1,
                job_name : 1,
                job_description : 1,
                job_member : 1,
                job_follow : 1,
                date_start : 1,
                date_end : 1,
                time_in : 1,
                time_out : 1,
                process_percent : 1,
                nhanvien_danhgia : 1,
                quanli_danhgia : 1,
                id_giaoviec : 1,
                _id: 0,
            })
            let project_management
            if(!job) return functions.setError(res, 'invalid job') 
            const project_id = job.project_id ? job.project_id : 0
            if(project_id){
                const project = await Project.findOne({project_id}, 'project_management')
                project_management = project.project_management
            } else {
                const project = await Project.findOne({project_id: job_id}, 'project_management')
                project_management = project.project_management
            }
            let jobDetail = {}
            const jobOfJob = await JobOfJob.aggregate([
                {
                    $match: {
                        job_id,
                        com_id
                    }
                },
                {
                    $lookup: {
                        from: 'Users',
                        localField: 'staff_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {$unwind: '$user'},
                {
                    $project: {
                        'id': '$id',
                        'job_name_job': '$job_name_job',
                        'staff_id': '$staff_id',
                        'staff_name': '$user.userName',
                        'status': '$status',
                        'date_limit': '$date_limit',
                        'hour_limit': '$hour_limit',
                    }
                }
            ])
            const jobFile = await MyJobFileProject.find({job_id}, {
                _id: 0,
                id: 1,
                name_file: 1,
            }).lean()
            let MyJobFileProjects = []
            jobFile.forEach((value, index) => {
                const pathToFile = `../storage/base365/giaoviec365/Project/${value.name_file}`
                MyJobFileProjects[index] = {
                    ...value,
                    pathToFile,
                }
            })
            const jobComment = await JobComment.find({job_id}, {
                _id: 0,
                id: 1,
                conent: 1,
                staff_id: 1,
                com_id: 1,
            })
            const {
                job_name,
                job_description,
                job_member,
                job_follow,
                date_start,
                date_end,
                time_in,
                time_out,
                process_percent,
                nhanvien_danhgia,
                quanli_danhgia,
                id_giaoviec,
            } = job
            jobDetail = {
                project_management,
                project_id,
                job_name,
                job_description,
                job_member,
                job_follow,
                date_start,
                date_end,
                time_in,
                time_out,
                process_percent,
                nhanvien_danhgia,
                quanli_danhgia,
                id_giaoviec,
                jobOfJob,
                MyJobFileProjects,
                jobComment,
            }
            return functions.success(res, "Action successfully", { listRole: req.listRole,data: {
                jobDetail
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res,"Action failure!!",501)
        }
    }

     //[put] /projects/chi-tiet-du-an/:id/chinh-sua-nhan-vien
	async chinhSuaNhanVienDuAn(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
			const id = req.params.id;
            const job = await Job.findOne({job_id: id}, {
                project_id: 1,
                _id: 0,
            })
            if(!job) return functions.setError(res, 'invalid job') 
            const project_id = job ? job.project_id : 0
			const projectMember = req.body.projectMember;
			const projectManager = req.body.projectManager;
			const projectFollower = req.body.projectFollower;
			const projectEvaluator = req.body.projectEvaluator;
			await Project.updateOne(
				{
					project_id,
				},
				{
					...(projectMember
						? {
								project_member: projectMember,
						  }
						: {}),
					...(projectManager
						? {
								project_management: projectManager,
						  }
						: {}),
					...(projectFollower
						? {
								project_follow: projectFollower,
						  }
						: {}),
					...(projectEvaluator
						? {
								project_evaluate: projectEvaluator,
						  }
						: {}),
				}
			);
			return functions.success(
				res,
				'Update info employeeID of each type in the Mission is successfully',
                {listRole: req.listRole,}
			);
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

    // [POST] /projects/chi-tiet-du-an/:id/add-job-of-job
    async themJobOfJob(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
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
            if(!job) return functions.setError(res, 'invalid job') 
            const timeLimit = functions.replaceDay(date_limit+ ' ' + hour_limit).getTime()/1000
            const timeLimitStart = functions.replaceDay(job.date_start+ ' ' + job.time_in).getTime()/1000
            const timeLimitEnd = functions.replaceDay(job.date_end+ ' ' + job.time_out).getTime()/1000
            if(timeLimit <= timeLimitStart || timeLimit >= timeLimitEnd)
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
            return functions.success(res, "Action successfully", { listRole: req.listRole,data: {
                jobOfJob
            }})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [POST] /projects/chi-tiet-du-an/:id/edit-cong-viec-chi-tiet
    async suaCongViecChiTiet(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if (!req.body.job_name || !req.body.job_member  || !req.body.date_start || !req.body.time_in || !req.body.date_end || !req.body.time_out)
                return functions.setError(res, 'Vui lòng điền đẩy đủ thông tin', 400) 
            const {
                job_description,
                job_member,
                job_follow,
                result,
                nhanvien_danhgia,
                quanli_danhgia,
                project_management,
            } = req.body
            const job_id = req.params.id
            const job = await Job.findOne({
                com_id, 
                job_id
            },{
                project_id : 1,
                _id: 0,
            })
            if(!job) return functions.setError(res, 'invalid job') 
            const project_id = job.project_id ? job.project_id : 0
            await Project.updateOne({project_id}, {project_management})
            await Job.updateOne({job_id},{
                job_description,
                job_member,
                job_follow,
                result,
                nhanvien_danhgia,
                quanli_danhgia,
            })
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e){
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [POST] /projects/chi-tiet-du-an/:id/add-file
    async themFileCongViec(req, res, next){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const upload_by = req.user.data._id
            if(req.files.length){
                const job_id = req.params.id
                const job = await Job.findOne({job_id}, {
                    _id: 0,
                    project_id: 1,
                    job_group_id: 1,
                })
                if(!job) return functions.setError(res, "Failed to get data", 401)
                const project_id = job.project_id
                const job_group_id = job.job_group_id
                const now = functions.getTimeNow()
                const filesNum = req.files.length
                for (let i = 0; i < filesNum; i++){
                    let myJobFileMaxId = await functions.getMaxIdByFieldWithDeleted(MyJobFileProject, 'id')
                    let fileTongQuanMaxId = await functions.getMaxIdByFieldWithDeleted(TblFileTongQuan, 'id' )
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
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [DELETE] /projects/chi-tiet-du-an/:id/delete-file/:fileId
    async xoaFileCongViec(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const id = req.params.fileId
            const job_id = req.params.id
            await MyJobFileProject.updateOneWithDeleted({id, job_id}, {
                is_delete: 1,
            })
            await MyJobFileProject.delete({id, job_id})
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [GET] /projects/chi-tiet-du-an/:id/download-file/:fileId
    async taiFileCongViec (req, res, next){
        try{
            const job_id = req.params.id
            const id = req.params.fileId
            const file = await MyJobFileProject.findOne({id, job_id}, {_id: 0, name_file: 1})
            if(!file) return functions.setError(res, 'Không tìm thấy file', 404)
            else{
                const nameFile = file.name_file
                return res.download(`../storage/base365/giaoviec365/Project/${nameFile}`)
            }
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    // [POST] /projects/chi-tiet-du-an/:id/add-comment
    async themBinhLuanCongViec(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const staff_id = req.user.data._id
            const job_id = req.params.id
            const id = await functions.getMaxIdByFieldWithDeleted(JobComment,'id')
            const now = functions.getTimeNow()
            if(!req.body.content) 
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
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [DELETE] /projects/chi-tiet-du-an/:id/delete-comment/:commentId
    async xoaBinhLuanCongViec(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const job_id = req.params.id
            const now = functions.getTimeNow()
            const id = req.params.commentId
            await JobComment.updateOneWithDeleted({id, job_id}, {
                deleted_at: now,

            })
            await JobComment.delete({com_id, id})
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [GET] /projects/chi-tiet-nhiem-vu/:id
    async chiTietNhiemVu(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
			const id = req.user.data._id
			const missionId = Number(req.params.id);
			if (!missionId) return functions.setError(res, 'Do not found mission id');
			const mission = await StageMission.findOne({
				id: missionId,
				com_id,
			});
			const processId = mission ? mission.process_id : null;
			const stageId = mission ? mission.stage_id : null;
			const process = await Process.findOne({
				process_id: processId,
				com_id,
				is_delete: 0,
			});
			let members;
			let managers;
			let evaluators;
			let follower;
			if (process) {
				members = process['process_member']
					? process['process_member'].split(',')
					: [];
				managers = process['process_management']
					? process['process_management'].split(',')
					: [];
				evaluators = process['process_evaluate']
					? process['process_evaluate'].split(',')
					: [];
				follower = process['process_follow']
					? process['process_follow'].split(',')
					: [];
			}
			//người giao việc
			const jobAssignor = managers
				? await User.find({
						_id: {
							$in: managers,
						},
				  }, 'userName')
				: [];
			//người thực hiện
			const jobExecutor = members
				? await User.find({
						_id: {
							$in: members,
						},
				  }, 'userName')
				: [];

			//người theo dõi
			const jobFollower = follower
				? await User.find({
						_id: {
							$in: follower,
						},
				  }, {
                    _id: 1,
                    userName: 1,
                  })
				: [];

			//lấy giai đoạn hiện tại
			const stageByMission = await ProcessStage.findOne({
				id: stageId,
				process_id: processId,
			});
			//lấy danh sách các giai đoạn
			const listStage = await ProcessStage.find({
				process_id: processId,
			}).sort({
				locations: 1,
			});

			//tùy chọn keo ngược giai đoạn hiện tại
			const stageOptionMission = await StageOptions.findOne({
				stage_id: stageId,
				process_id: processId,
			});
			const location = stageOptionMission ? stageOptionMission.locations : null;
			//giao doan truoc giai doan hien tai
			const stageByMissionBefore = await ProcessStage.findOne({
				process_id: processId,
				...(location ? { locations: location - 1 } : {}),
			});

			//giai doan sau giai doan hien tai
			const stageByMissionAfter = await ProcessStage.findOne({
				process_id: processId,
				...(location ? { locations: location + 1 } : {}),
			});
			
			//danh sách tùy chỉnh
			const listOptions = await ProcessOption.find({
				proces_id: processId,
			});

			//danh sách tài liệu đính kèm
			const listDoc = await MyJobFileProcess.find({
				mission_id: missionId,
				is_delete: 0,
			});
			//lấy giai đoạn đầu tiên
			const firstStageArray = await ProcessStage.find({
				process_id: processId,
				is_delete: 0,
			})
				.sort({
					locations: 1,
				})
				.limit(1);

			const firstStage = firstStageArray ? firstStageArray[0] : {};
			//lấy giai đoạn cuối cùng
			const lastStageArray = await ProcessStage.find({
				process_id: processId,
				is_delete: 0,
			})
				.sort({
					locations: -1,
				})
				.limit(1);
			const lastStage = lastStageArray ? lastStageArray[0] : {};
			//danh sách công việc con
			const listSubJob = await MissionJob.find({
				process_id: processId,
				mission_id: missionId,
			}).sort({
				staff_id: -1,
			});

            const listFiles = await MyJobFileProcess.find({
                mission_id: missionId,
            })

			//Comment thảo luận
			const listComment = await MissionComment.find({
				mission_id: missionId,
			}).sort({
				id: -1,
			});
			return functions.success(res, 'Get successfully the data', {
				listRole: req.listRole,data: {
					mission,
					evaluators,
					jobAssignor,
					jobExecutor,
					jobFollower,
					process,
					stageByMission,
					listStage,
					stageOptionMission,
					stageByMissionBefore,
					stageByMissionAfter,
					// countEpBymember,
					listOptions,
					listDoc,
					firstStage,
					lastStage,
					listSubJob,
					listComment,
                    listFiles,
				},
			});
		} catch (err) {
            console.log(err)
			return functions.setError(res, 'Cannot get the data', 403);
		}
    }

    // /projects/chi-tiet-nhiem-vu/:id/cap-nhap-giai-doan-cho-nhiem-vu
    async chuyenTiepGiaiDoan(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
			const id = req.user.data._id;
			const timeNow = functions.getTimeNow();
			const missionId = req.params.id;
			const missionStaffId = req.body.missionStaffId;
			const stageId = req.body.stageId;
			const hourComplete = req.body.time * 3600 + timeNow;
			const processOptionUpdate = JSON.parse(req.body.processOptionUpdate);
			//cap nhap giai doan
			await StageMission.updateOne(
				{
					id: missionId,
					com_id,
				},
				{
					misssion_staff_id: missionStaffId,
					stage_id: stageId,
					hour_complete: hourComplete,
					change_stage_at: timeNow,
				}
			)

			processOptionUpdate.forEach(async (value) => {
				const optionId = value.optionId;
				const valueInput = value.input;
				await ProcessOption.updateOne(
					{
						id: optionId,
					},
					{
						value_nhap: valueInput,
					}
				);
			});
			return functions.success(res, 'Updated is successfully', {listRole: req.listRole,});
		} catch (err) {
			console.log(err);
			return functions.setError(res, 'Failed to get data');
		}
	}

    //[put] /projects/chi-tiet-nhiem-vu/:id/cap-nhap-ly-do-that-bai
	async capNhatLyDoThatBai(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
			const missionId = req.params.id;
			const textReason = req.body.textReason;

			await StageMission.updateOne(
				{
					id: missionId,
					com_id
				},
				{
					failed_reason: textReason,
					stage_id: 222,
				}
			);
			return functions.success(res, 'Updated data is successfully', {listRole: req.listRole,});
		} catch (err) {
			return functions.setError(res, err.message);
		}
	}

    //[put] /projects/chi-tiet-nhiem-vu/:id/chinh-sua-thoi-han
	async chinhSuaThoiHan(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
			const missionId = req.params.id;
			const dayDue = req.body.dayDue;
			const hourDue = req.body.hourDue;
			const hourComplete =
            functions.replaceDay(dayDue + ' ' + hourDue).getTime() / 1000;
            const now = functions.getTimeNow()
            if(hourComplete < now)
            return functions.setError(res, 'Vui lòng nhập vào thời gian hợp lệ', 400)
			await StageMission.updateOne(
				{
					id: missionId,
				},
				{
					hour_complete: hourComplete,
				}
			);
			return functions.success(res, 'Updated data is successfully', {listRole: req.listRole,});
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

    //[put] /projects/chi-tiet-nhiem-vu/:id/chinh-sua-ket-qua
	async thayDoiKetQuaNhiemVu(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
			const missionId = req.params.id;
			const percentComplete = req.body.percentComplete;
			let isComplete = false;
			if (percentComplete == 100) isComplete = true;
			if (!isComplete) {
				await StageMission.updateOne(
					{
						id: missionId,
					},
					{
						result_job: percentComplete,
					}
				);
			} else {
				await StageMission.updateOne(
					{
						id: missionId,
					},
					{
						result_job: percentComplete,
						stage_id: 111,
					}
				);
			}
			return functions.success(res, 'Updated data is successfully', {listRole: req.listRole,});
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

    // [POST] /projects/chi-tiet-nhiem-vu/:id/add-mission-job
    async themMissionJob(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
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
            const timeLimit = functions.replaceDay(date_limit+ ' ' + hour_limit).getTime()/1000
            const hour_complete = stageMission ? stageMission.hour_complete : 0
            if(timeLimit > hour_complete)
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
            return functions.success(res, "Action successfully", { listRole: req.listRole,data: {
                missionJob
            }})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [POST] /projects/chi-tiet-nhiem-vu/:id/edit-mission-job/:missionJobId
    async suaMissionJob(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
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
            const timeLimit = functions.replaceDay(date_limit+ ' ' + hour_limit).getTime()/1000
            const hour_complete = stageMission ? stageMission.hour_complete : 0
            if(timeLimit > hour_complete)
                return functions.setError(res,
             `Vui lòng nhập vào thời gian hợp lệ`,
                )
            await MissionJob.updateOne({
                id,
                process_id,
            },
            {
                job_name,
                date_limit,
                hour_limit,
            })
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    //[delete] /projects/chi-tiet-nhiem-vu/:id/delete-mission-job/:missionJobId
	async xoaMissionJob(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const mission_id = req.params.id
			const id = req.params.missionJobId;
			await MissionJob.deleteOne({
				id,
                mission_id
			});
			return functions.success(
				res,
				'Delete SubJob in the Mission is successfully',
                {listRole: req.listRole,}
			);
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

    //[put] /projects/chi-tiet-nhiem-vu/:id/cap-nhap-danh-gia
	async CapNhapDanhGia(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
			const missionId = req.params.id;
			const managerEvaluate = req.body.managerEvaluate;
			const employeeEvaluate = req.body.employeeEvaluate;
			await StageMission.updateOne(
				{
					id: missionId,
				},
				{
					...(managerEvaluate
						? {
								quanli_danhgia: managerEvaluate,
						  }
						: {}),
					...(employeeEvaluate
						? {
								nhanvien_danhgia: employeeEvaluate,
						  }
						: {}),
				}
			);
			return functions.success(
				res,
				'Update evaluate in the Mission is successfully',
                {listRole: req.listRole,}
			);
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

    async ChinhSuaMoTaNhiemVu(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
			const missionId = req.params.id;
			const misssion_description = req.body.misssion_description;
			await StageMission.updateOne(
				{
					id: missionId,
				},
				{
					misssion_description,
				}
			);
			return functions.success(
				res,
				'Update successfully',
                {listRole: req.listRole,}
			);
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

    async ChinhSuaMoTaCongViec(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
			const job_id = req.params.id;
			const job_description = req.body.job_description;
			await Job.updateOne(
				{
					job_id
				},
				{
					job_description,
				}
			);
			return functions.success(
				res,
				'Update successfully',
                {listRole: req.listRole,}
			);
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

    //[post] /projects/chi-tiet-nhiem-vu/:id/them-comment
	async themBinhLuanNhiemVu(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
			const missionId = req.params.id;
            if(!req.body.commentMessage)
                return functions.setError(res, 'Bình luận không hợp lệ')
			const commentMessage = req.body.commentMessage;
			const maxId = await functions.getMaxIdByField(MissionComment, 'id');
			const staff_id = req.user.data._id;
			const timeNow = functions.getTimeNow();
			await new MissionComment({
				id: maxId,
				mission_id: missionId,
				content: commentMessage,
				staff_id,
				com_id,
				created_at: timeNow,
			}).save();
			return functions.success(
				res,
				'Add new comment in the MissionComment is successfully',
                {listRole: req.listRole,}
			);
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

	//[put] /projects/chi-tiet-nhiem-vu/:id/sua-comment/:commentId
	async suaBinhLuanNhiemVu(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
			const commentId = req.params.commentId;
            const mission_id = req.params.id
			const commentMessage = req.body.commentMessage;
			await MissionComment.updateOne(
				{
					id: commentId,
                    mission_id,
				},
				{
					content: commentMessage,
				}
			);
			return functions.success(
				res,
				'Edit commnet in the MissionComment is successfully',
                {listRole: req.listRole,}
			);
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

	//[delete] /projects/chi-tiet-nhiem-vu/:id/xoa-comment/:commentId
	async xoaBinhLuanNhiemVu(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
			const commentId = req.params.commentId;
            const mission_id = req.params.id
			await MissionComment.deleteOne({
				id: commentId,
                mission_id,
			});
			return functions.success(
				res,
				'Deleted comment in the MissionComment is successfully',
                {listRole: req.listRole,}
			);
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

    //[put] /projects/chi-tiet-nhiem-vu/:id/chinh-sua-nhan-vien
	async chinhSuaNhanVienQuyTrinh(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
			const id = req.params.id;
            const stageMission = await StageMission.findOne({id}, {
                process_id: 1,
                _id: 0,
            })
            const process_id = stageMission ? stageMission.process_id : 0
			const processMember = req.body.processMember;
			const processManager = req.body.processManager;
			const processFollower = req.body.processFollower;
			const processEvaluator = req.body.processEvaluator;
			await Process.updateOne(
				{
					process_id,
				},
				{
					...(processMember
						? {
								process_member: processMember,
						  }
						: {}),
					...(processManager
						? {
								process_management: processManager,
						  }
						: {}),
					...(processFollower
						? {
								process_follow: processFollower,
						  }
						: {}),
					...(processEvaluator
						? {
								process_evaluate: processEvaluator,
						  }
						: {}),
				}
			);
			return functions.success(
				res,
				'Update info employeeID of each type in the Mission is successfully',
                {listRole: req.listRole,}
			);
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

    // [POST] /projects/chi-tiet-nhiem-vu/:id/add-file
    async themFileNhiemVu(req, res, next){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const upload_by = req.user.data._id
            if(req.files.length){
                const mission_id = req.params.id
                const stageMission = await StageMission.findOne({id: mission_id}, {
                    _id: 0,
                    process_id: 1,
                    stage_id: 1,
                })
                if(!stageMission) return functions.setError(res, "Failed to get data", 401)
                const process_id = stageMission.process_id
                const stage_id = stageMission.stage_id
                const now = functions.getTimeNow()
                const filesNum = req.files.length
                for (let i = 0; i < filesNum; i++){
                    let myJobFileMaxId = await functions.getMaxIdByFieldWithDeleted(MyJobFileProcess, 'id')
                    let fileTongQuanMaxId = await functions.getMaxIdByFieldWithDeleted(TblFileTongQuan, 'id' )
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
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [DELETE] /projects/chi-tiet-nhiem-vu/:id/delete-file/:fileId
    async xoaFileNhiemVu(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const id = req.params.fileId
            const mission_id = req.params.id
            await MyJobFileProcess.updateOneWithDeleted({id, mission_id}, {
                is_delete: 1,
            })
            await MyJobFileProcess.delete({id, mission_id})
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [GET] /projects/chi-tiet-nhiem-vu/:id/download-file/:fileId
    async taiFileNhiemVu (req, res, next){
        try{
            const mission_id = req.params.id
            const id = req.params.fileId
            const file = await MyJobFileProcess.findOne({id, mission_id}, {_id: 0, name_file: 1})
            if(!file) return functions.setError(res, 'Không tìm thấy file', 404)
            else{
                const nameFile = file.name_file
                return res.download(`../storage/base365/giaoviec365/Process/${nameFile}`)
            }
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    //[put] /projects/chi-tiet-du-an/:id/chinh-sua-ket-qua
	async thayDoiKetQuaDuAn(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
			const job_id = req.params.id;
			const percentComplete = req.body.percentComplete;
			let isComplete = false;
			if (percentComplete == 100) isComplete = true;
			if (!isComplete) {
				await Job.updateOne(
					{
						job_id,
					},
					{
						process_percent: percentComplete,
					}
				);
			} else {
				await Job.updateOne(
					{
						job_id,
					},
					{
						process_percent: percentComplete,
						status: 2,
                        status_or_late: 2,
					}
				);
			}
			return functions.success(res, 'Updated data is successfully', {listRole: req.listRole,});
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

    //[put] /projects/chi-tiet-du-an/:id/cap-nhap-danh-gia
	async CapNhapDanhGiaDuAn(req, res, next) {
		try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
			const job_id = req.params.id;
			const managerEvaluate = req.body.managerEvaluate;
			const employeeEvaluate = req.body.employeeEvaluate;
			await Job.updateOne(
				{
					job_id,
				},
				{
					...(managerEvaluate
						? {
								quanli_danhgia: managerEvaluate,
						  }
						: {}),
					...(employeeEvaluate
						? {
								nhanvien_danhgia: employeeEvaluate,
						  }
						: {}),
				}
			);
			return functions.success(
				res,
				'Update evaluate in the Job is successfully',
                {listRole: req.listRole,}
			);
		} catch (e) {
			return functions.setError(res, e.message);
		}
	}

    // [PUT] /projects/chi-tiet-nhiem-vu/:id/switch-mission-job/:missionJobIdd
	async switchMissionJob(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
			const id = req.params.missionJobId
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const missionJob = await MissionJob.findOne({id, com_id})
			if(missionJob){
				if(missionJob.status === 1)
					await MissionJob.updateOne({id, com_id}, {status: 0})
				if(missionJob.status === 0)
					await MissionJob.updateOne({id, com_id}, {status: 1})
			}
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [PUT] /projects/chi-tiet-du-an/:id/switch-job-of-job/:jojId
	async switchJobOfJob(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
			const id = req.params.jojId
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const job = await JobOfJob.findOne({id, com_id})
            console.log(job)
			if(job){
				if(job.status === 1)
					await JobOfJob.updateOne({id, com_id}, {status: 0})
				if(job.status === 0)
					await JobOfJob.updateOne({id, com_id}, {status: 1})
			}
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    // [PUT] /projects/chi-tiet-du-an/:id/edit-job-of-job/:jojId
	async suaJobOfJob(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
			const id = req.params.jojId
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
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
            const timeLimit = functions.replaceDay(date_limit+ ' ' + hour_limit).getTime()/1000
            const timeLimitStart = functions.replaceDay(job.date_start+ ' ' + job.time_in).getTime()/1000
            const timeLimitEnd = functions.replaceDay(job.date_end+ ' ' + job.time_out).getTime()/1000
            if(timeLimit <= timeLimitStart || timeLimit >= timeLimitEnd)
                return functions.setError(res,
             `Vui lòng nhập vào thời gian trong khoảng từ ${job.date_start+ ' ' + job.time_in} đến ${job.date_end+ ' ' + job.time_out}`,
                )
            await JobOfJob.updateOne({id, com_id},{
                job_name_job,
                date_limit,
                hour_limit,
            })
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

	// [PUT] /me/chi-tiet-cong-viec-cua-toi/project/:id/delete-job-of-job/:jojId
	async xoaJobOfJob(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
			const id = req.params.jojId
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            await JobOfJob.deleteOne({id, com_id})
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    async themQuyTrinhTheoMau(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const now = functions.getTimeNow()
            const user_id = req.user.data._id
            if(
                !req.body.id
                || !req.body.stage_mission
                || !req.body.management
                || !req.body.member
                || !req.body.evaluate
                || !req.body.follow
                || !req.body.process_name
            ) return functions.setError(res, 'Not enough data')
            const process_id = Number(req.body.id)
            const stage_mission = req.body.stage_mission
            const management = req.body.management
            const member = req.body.member
            const evaluate = req.body.evaluate
            const follow = req.body.follow

            const process_name = req.body.process_name
            const process_card = req.body.process_card
            const process_management = req.body.process_management
            const process_member = req.body.process_member
            const process_evaluate = req.body.process_evaluate
            const process_follow = req.body.process_follow

            const processData =  Process.findOne({ com_id, process_id,}, {_id: 0, __v: 0}).lean()
            const stageData =  ProcessStage.find({ com_id, process_id, }, {_id: 0, __v: 0}).lean()
            const missionData =  StageMission.find({ com_id, process_id,}, {_id: 0, __v: 0}).lean()
            const idProcessData = functions.getMaxIdByFieldWithDeleted(Process, 'process_id')
            const idStageData = functions.getMaxIdByFieldWithDeleted(ProcessStage, 'id')
            const idMissionData = functions.getMaxIdByFieldWithDeleted(StageMission, 'id')
            const [process, stage, mission, idProcess, idStage, idMission] 
            = await Promise.all
            ([processData, stageData, missionData, idProcessData, idStageData, idMissionData])
            let dataProcess = {
                ...process,
                process_name,
                process_card,
                process_id: idProcess,
                created_at: now,
                deleted_at: null,
                updated_at: null,
                is_delete: 0,
                created_by: type,
                created_id: user_id,
                process_status: 1,
                process_open_close: 1,
                option: null,
            }

            if(management == 0) dataProcess = {...dataProcess, process_management}
            if(member == 0) dataProcess = {...dataProcess, process_member}
            if(evaluate == 0) dataProcess = {...dataProcess, process_evaluate}
            if(follow == 0) dataProcess = {...dataProcess, process_follow}
            await new Process(dataProcess).save()
            let dataStage = []
            let dataMission = []
            if(stage_mission == 1) {
                for(let i = 0; i<stage.length; i++) {
                    dataStage[i] = {
                        ...stage[i],
                        id: idStage + i,
                        process_id: idProcess,
                        locations: i+1,
                        result: null,
                        deleted_at: null,
                        created_at: now,
                        updated_at: null,
                        is_delete: 0,
                    }
                    await new ProcessStage(dataStage[i]).save()
                }
            }
            if(stage_mission == 2){
                for(let i = 0; i<stage.length; i++) {
                    dataStage[i] = {
                        ...stage[i],
                        id: idStage + i,
                        process_id: idProcess,
                        is_delete: 0,
                        deleted_at: null,
                        created_at: now,
                        updated_at: null,
                        change_stage_at: null,
                        quanli_danhgia: 1,
                        nhanvien_danhgia: 1,
                        failed_reason: null,
                        result_job: 0,
                        id_giaoviec: user_id,
                        congty_or_nhanvien: type,
                    }
                    await new ProcessStage(dataStage[i]).save()
                }
                for(let i = 0; i<mission.length; i++) {
                    dataMission[i] = {
                        ...mission[i],
                        id: idMission + i,
                        process_id: idProcess,
                        stage_id: idStage,
                        is_delete: 0,
                        deleted_at: null,
                        created_at: now,
                        updated_at: null,
                        change_stage_at: null,
                        quanli_danhgia: 1,
                        nhanvien_danhgia: 1,
                        failed_reason: null,
                        result_job: 0,
                        id_giaoviec: user_id,
                        congty_or_nhanvien: type,
                    }
                    await new StageMission(dataMission[i]).save()
                }
            }
            return functions.success(res, 'Action successfully', {dataProcess, dataStage, dataMission})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Action failed!!',501)
        }
    }

    async themDuAnTheoMau(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const now = functions.getTimeNow()
            const user_id = req.user.data._id
            if(!req.body.id || !req.body.project_name || !req.body.job_groupJob || !req.body.project_management || !req.body.project_member)
                return functions.setError(res, 'Not enough data')
			const id = Number(req.body.id)
            const project_name = req.body.project_name
            const project_card = req.body.project_card
            const job_groupJob = req.body.job_groupJob
            const project_management = req.body.project_management
            const project_member = req.body.project_member
            const project_evaluate = req.body.project_evaluate
            const project_follow = req.body.project_follow
            const projectData = Project.findOne({project_id: id, project_type: 0}, {_id: 0, __v: 0}).lean()
            const groupData = JobGroup.find({project_id: id}, {_id: 0, __v: 0}).sort({id: 1}).lean()
            const jobData = Job.find({project_id: id}, {_id: 0, __v: 0}).sort({job_group_id: 1}).lean()
            const id_projectData = functions.getMaxIdByFieldWithDeleted(Project, 'project_id')
            const id_groupData = functions.getMaxIdByFieldWithDeleted(JobGroup, 'id')
            const id_jobData = functions.getMaxIdByFieldWithDeleted(Job, 'job_id')
            const [project, group, job, id_project, id_group, id_job] 
            = await Promise.all
            ([projectData, groupData, jobData, id_projectData, id_groupData, id_jobData])
            const dataProject = {
                ...project,
                project_id: id_project,
                project_name,
                project_card,
                project_management,
                project_member,
                project_evaluate,
                project_follow,
                type: 0,
                is_delete: 0,
                deleted_at: null,
                created_at: now,
                created_by: type,
                updated_at: null,
                created_id: user_id,
                open_or_close: 1,
            }
            await new Project(dataProject).save()
            let dataGroup = [], dataJob = []
            let count = 0
            if(job_groupJob == 1){
                for(let i = 0; i < group.length; i++) {
                    dataGroup[i] = {
                        ...group[i],
                        id: id_group + i,
                        project_id: id_project,
                        is_delete: 0,
                        deleted_at: null,
                        created_at: now,
                        updated_at: null,
                        process_percent: null,
                        nhanvien_danhgia: 1,
                        quanli_danhgia: 1,
                        job_group_status: 0,
                    }
                    await new JobGroup(dataGroup[i]).save()
                    for(let j = 0; j < job.length; j++) {
                        if(group[i].id === job[j].job_group_id) {
                            dataJob[count] = {
                                ...job[j],
                                job_id: id_job + count,
                                project_id: id_project,
                                job_group_id: dataGroup[i].id,
                                result: null,
                                job_parent: null,
                                is_deleted: 0,
                                process_percent: 0,
                                content: '',
                                deleted_at: null,
                                created_at: now,
                                upNumberd_at: null,
                                nhanvien_danhgia: 1,
                                quanly_danhgia: 1,
                                status: 1,
                                status_or_late: 1,
                                hoanthanhluc: null,
                                id_giaoviec: user_id,
                                congty_or_nhanvien: type,
                            }
                            await new Job(dataJob[count]).save()
                            count++
                        }
                    }
                }
            }
            return functions.success(res, "Action successfully", {
                id_project,
                id_group,
                id_job,
                dataProject,
                dataGroup,
                dataJob,
            })
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }

    async danhGiaNhomCongViec(req, res){
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            if(!req.body.quanli_danhgia) return functions.setError(res, 'not enough data')
            let com_id
			const id = req.params.groupId
            const type = req.user.data.type
            const quanli_danhgia = Number(req.body.quanli_danhgia)
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const jobGroup = await JobGroup.findOne({com_id, id})
            if(!jobGroup) return functions.setError(res, "Jobgroup not found")
            await JobGroup.updateOne({com_id, id}, {quanli_danhgia})
            return functions.success(res, "Action successfully", {listRole: req.listRole,})
        } catch (e) {
            console.log(e)
            return functions.setError(res, "Action failed")
        }
    }
}



module.exports = new ProjectController()




