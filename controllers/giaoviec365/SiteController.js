const StageMission = require('../../models/giaoviec365/stages_missions')
const Meeting = require('../../models/giaoviec365/meetings');
const Project = require('../../models/giaoviec365/projects');
const ProcessRoleStaff = require('../../models/giaoviec365/process_role_staffs')
const ProjectRoleStaff = require('../../models/giaoviec365/project_role_staffs')
const Process = require('../../models/giaoviec365/process');
const ConfigBackground = require('../../models/giaoviec365/config_background')
const Job = require('../../models/giaoviec365/jobs');
const Device = require('../../models/giaoviec365/devices')
const Dep = require('../../models/qlc/Deparment')
const User = require('../../models/Users');

const functions = require('../../services/functions');

class SiteController {

    //[GET] /
    async showHomePage(req, res) {
        try {

            return functions.success(res, 'Home Page')
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    //[GET] /huong-dan
    async howTo(req, res, next) {
        try {

            return functions.success(res, "SHOW HOW TO PAGE", {
                data: {}
            })
        } catch (error) {
            console.log(error);
            return functions.setError(res, error, 500)
        }
    }

    //[GET] /quan-ly-chung-cong-ty
    async quanLyChungCongTy(req, res, next) {
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

            // Users
            const tongNhanVien = await User.find({
                    type: 2,
                    // com_id,
                    'inForPerson.employee.com_id': com_id,
                }).count().lean() // Tổng nhân viên

            // Cuộc họp sắp tới
            let tongCuocHopSapToi = await Meeting.find({
                com_id,
                is_cancel: 0,
                $or: [{
                        date_start: { $gt: dayNow },
                    },
                    {
                        date_start: { $eq: dayNow },
                        time_start: { $gt: hourNow },
                    }
                ]
            }).count().lean()

            // Dự án 
            const project = await Project.find({
                com_id,
            }).count().lean()
            const process = await Process.find({
                com_id,
            }).count().lean()
            const tongDuAn = project + process

            const projectDoing = await Project.find({
                com_id,
                type: 0
            }).lean()
            let projectDangLam = 0
            projectDoing.forEach(value => {
                const timeEnd = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (timeEnd > now) projectDangLam++
            })
            const processDoing = await Process.find({
                com_id,
                process_status: 1
            }).lean()
            let processDangLam = 0
            processDoing.forEach(value => {
                const timeEnd = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (timeEnd > now) processDangLam++
            })
            const duAnDangLam = projectDangLam + processDangLam

            const projectDone = await Project.find({
                com_id,
                type: 0
            }).lean()
            let projectQuaHan = 0
            projectDone.forEach(value => {
                const timeEnd = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (timeEnd < now) projectQuaHan++
            })
            const processDone = await Process.find({
                com_id,
                process_status: 1
            }).lean()
            let processQuaHan = 0
            processDone.forEach(value => {
                const timeEnd = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (timeEnd < now) processQuaHan++
            })
            const duAnQuaHan = projectQuaHan + processQuaHan

            // Công việc
            const job = await Job.find({
                com_id,
            }).count().lean()
            const stageMission = await StageMission.find({
                com_id,
            }).count().lean()
            const tongCongViec = job + stageMission

            let jobDangLam = 0
            const jobDoing = await Job.find({
                com_id,
                status: 1,
            })
            jobDoing.forEach(value => {
                const overTime = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (overTime > now) jobDangLam++
            })
            const stageMissionDangLam = await StageMission.find({
                com_id,
                $and: [
                    { stage_id: { $ne: 111 } },
                    { stage_id: { $ne: 222 } },
                ]
            }).count().lean()
            const congViecDangLam = jobDangLam + stageMissionDangLam

            let congViecQuaHan = 0
            const jobOver = await Job.find({
                com_id,
                status: 1,
            })
            await jobOver.forEach((value) => {
                const overTime = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (overTime < now)
                    congViecQuaHan++
            })
            return functions.success(res, "Success", {
                data: {
                    tongNhanVien,
                    tongCuocHopSapToi,
                    tongDuAn,
                    duAnDangLam,
                    duAnQuaHan,
                    tongCongViec,
                    congViecDangLam,
                    congViecQuaHan,
                },
                listRole: req.listRole,
            });
        } catch (error) {
            console.log(error);
            return functions.setError(res, error, 500);
        }
    }

    //[GET] /quan-ly-chung-nhan-vien
    async quanLyChungNhanVien(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id.toString()
            const now = functions.getTimeNow()

            // Dự án
            const project = await Project.find({
                com_id,
                project_member: { $regex: user_id }
            })
            const process = await Process.find({
                com_id,
                process_member: { $regex: user_id }
            })
            const DuAnThamGia = project.length + process.length

            const projectHoanThanh = await Project.find({
                type: 1,
                com_id,
                project_member: { $regex: user_id }
            }).count().lean()
            const processHoanThanh = await Process.find({
                type: 1,
                com_id,
                process_member: { $regex: user_id }
            }).count().lean()
            const DuAnHoanThanh = projectHoanThanh + processHoanThanh

            let projectQuaHan = 0
            const projectOver = await Project.find({
                com_id,
                project_member: { $regex: user_id },
                type: 0,
            })
            projectOver.forEach((value) => {
                const overTime = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (overTime < now)
                    projectQuaHan++
            })
            let processQuaHan = 0
            const processOver = await Project.find({
                com_id,
                process_member: { $regex: user_id },
                process_status: 1,
            })
            processOver.forEach((value) => {
                const overTime = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (overTime < now)
                    processQuaHan++
            })
            const DuAnQuaHan = projectQuaHan + processQuaHan

            // Công việc
            const job = await Job.find({
                com_id,
                job_member: { $regex: user_id },
            })
            const stageMission = await StageMission.find({
                com_id,
                misssion_staff_id: { $regex: user_id },
            })
            const TongSoCongViec = job.length + stageMission.length

            const jobHoanThanh = await Job.find({
                com_id,
                job_member: { $regex: user_id },
                status: 2,
            }).count().lean()
            const stageMissionHoanThanh = await StageMission.find({
                com_id,
                misssion_staff_id: { $regex: user_id },
                stage_id: 111
            }).count().lean()
            const CongViecHoanThanh = jobHoanThanh + stageMissionHoanThanh

            let CongViecQuaHan = 0
            const jobOver = await Job.find({
                com_id,
                job_member: { $regex: user_id },
                status: 1,
            })
            await jobOver.forEach((value) => {
                const overTime = functions.replaceDay(value.date_end + ' ' + value.time_out).getTime() / 1000
                if (overTime < now)
                    CongViecQuaHan++
            })

            return functions.success(res, "Success", {
                data: {
                    DuAnThamGia,
                    DuAnHoanThanh,
                    DuAnQuaHan,
                    TongSoCongViec,
                    CongViecHoanThanh,
                    CongViecQuaHan,
                },
                listRole: req.listRole,
            })
        } catch (error) {
            console.log(error)
            return functions.setError(res, error, 500)
        }
    }

    //[GET] /cai-dat-sau-dang-nhap-quan-ly
    async caiDatSauDangNhapQuanLy(req, res, next) {
        try {
            // const user = await User.findOne({idQLC: 1664, type: 1}).lean()
            // return functions.success(res, 'check', req.user)
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            const device = await Device.findOne({ user_id })
            const DanhSachThanhVien = await User.find({
                'inForPerson.employee.com_id': com_id,
                type: 2,
            }, {
                _id: 1,
                userName: 1,
                emailContact: 1,
                phone: 1,
                idQLC: 1,
                'inForPerson.employee.dep_id': 1,
                'inForPerson.employee.position_id': 1,
            })
            const ThongTinCongTy = await User.findOne({
                type: 1,
                idQLC: com_id,
            }, {
                userName: 1,
                'inForCompany.com_size': 1,
                emailContact: 1,
                phone: 1,
            })
            const listDep = await Dep.find({ com_id }).lean()
            return functions.success(res, "Action successfully", {
                listRole: req.listRole,
                data: {
                    device,
                    DanhSachThanhVien,
                    ThongTinCongTy,
                    listDep,
                },
            })
        } catch (error) {
            console.log(error);
            return functions.setError(res, error, 500)
        }
    }

    //[GET] /cai-dat-sau-dang-nhap-quan-ly/cap-nhat-thong-tin-cong-ty
    async capNhatThongTinCongTy(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            if (!req.body.userName || !req.body.address || !req.body.phone)
                return functions.setError(res, 'Vui lòng nhập đầy đủ thông tin', 401)
            const {
                userName,
                address,
                phone,
            } = req.body
            const user_id = req.user.data._id
            await User.updateOne({
                type: 1,
                idQLC: com_id,
            }, {
                userName,
                address,
                phone,
            })

            return functions.success(res, "Action successfully", { listRole: req.listRole })
        } catch (error) {
            console.log(error);
            return functions.setError(res, "Action failed", 500)
        }
    }

    //[GET] /cai-dat-sau-dang-nhap/sua-background
    async suaBackgroud(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            const user_id = req.user.data._id
            const background = req.body.background
            const type = req.body.type
            const configBackground = await ConfigBackground.findOne({ id_user: user_id })
            if (!configBackground) {
                const id = await functions.getMaxIdByField(ConfigBackground, 'id')
                await new ConfigBackground({
                    id,
                    id_user: user_id,
                    background,
                    type,
                }).save()
            } else {
                await ConfigBackground.updateOne({ id_user: user_id }, { background, type })
            }
            return functions.success(res, "Action successfully", {
                data: await ConfigBackground.findOne({ id_user: user_id }),
                listRole: req.listRole,
            })
        } catch (error) {
            console.log(error);
            return functions.setError(res, "Action failed", 500)
        }
    }

    //[GET] /cai-dat-sau-dang-nhap-nhan-vien
    async caiDatSauDangNhapNhanVien(req, res, next) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const user_id = req.user.data._id
            const device = await Device.findOne({ user_id })
            const ThongTinCaNhan = await User.find({ _id: user_id }, {
                _id: 1,
                userName: 1,
                emailContact: 1,
                phone: 1,
                avatarUser: 1,
                address: 1,
                idQLC: 1,
                'inForPerson.account.birthday': 1,
                'inForPerson.account.gender': 1,
                'inForPerson.account.married': 1,
                'inForPerson.account.education': 1,
                'inForPerson.employee.dep_id': 1,
                'inForPerson.employee.start_working_time': 1,
                'inForPerson.employee.position_id': 1,
            })
            const ThongTinCongTy = await User.findOne({
                type: 1,
                idQLC: com_id,
            }, {
                idQLC: 1,
                userName: 1,
                'inForCompany.com_size': 1,
                emailContact: 1,
                address: 1,
                phone: 1,
            })
            return functions.success(res, 'Action successfully', {
                listRole: req.listRole,
                data: {
                    device,
                    ThongTinCaNhan,
                    ThongTinCongTy,
                }
            })
        } catch (e) {
            console.log(e)
            return functions.setError(res, 'Action failed', 500)
        }
    }

    async showListDep(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const listDep = await Dep.find({ com_id }).lean()
            return functions.success(res, 'Action successfully', { listDep })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    async showConfigBackground(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const id_user = req.user.data._id
            let list = {}
            const config = await ConfigBackground.findOne({ id_user }).lean()
            if (!config) list.background = 'bgr_alt0'
            else list = config
            return functions.success(res, 'Action successfully', { list })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    async showRoleProject(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const listRole = await ProjectRoleStaff.find({ com_id }).lean()
            let result
            if (listRole.length) result = listRole
            else result = [{
                    permission_project: "1,2,3,4,5,6,7,8,9"
                },
                {
                    permission_project: ""
                }
            ]
            return functions.success(res, 'Action successfully', { result })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    async showRoleProcess(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            const listRole = await ProcessRoleStaff.find({ com_id }).lean()
            let result
            if (listRole.length) result = listRole
            else result = [{
                    permission_project: "1,2,3,4,5,6,7,8,9"
                },
                {
                    permission_project: ""
                }
            ]
            return functions.success(res, 'Action successfully', { result })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    async showListAllProject(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            let result = await Project.find({ com_id })
            return functions.success(res, 'Action successfully', { result })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }

    async showListAllProcess(req, res) {
        try {
            if (!req.user || !req.user.data || !req.user.data.idQLC || !req.user.data.type || !req.user.data._id)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if (type === 1) com_id = req.user.data.idQLC
            if (type === 2) com_id = req.user.data.com_id
            let result = await Process.find({ com_id })
            return functions.success(res, 'Action successfully', { result })
        } catch (error) {
            console.log(error);
            return functions.setError(res, 'Action failed', 500)
        }
    }
}



module.exports = new SiteController()