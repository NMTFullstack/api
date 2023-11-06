const De_Xuat = require('../../../models/Vanthu/de_xuat')
const functions = require('../../../services/vanthu')
    // const multer = require('multer');
const path = require('path')
const thongBao = require('../../../models/Vanthu365/tl_thong_bao')
const ThongBao = require('../../../models/Vanthu365/tl_thong_bao')
const DeXuat = require('../../../models/Vanthu/de_xuat')
const User = require('../../../models/Users')
const SettingD = require('../../../models/Vanthu/setting_dx')
const fnc = require('../../../services/qlc/functions')
const Cycle = require('../../../models/qlc/Cycle')
const EmployeCycle = require('../../../models/qlc/CalendarWorkEmployee')
const Shifts = require('../../../models/qlc/Shifts')
const TinhluongThietLap = require('../../../../tinhluong/models/Tinhluong/TinhluongThietLap')
const MeetingRoom = require('../../../models/giaoviec365/qly_phonghop')
const Meeting = require('../../../models/giaoviec365/meetings')
const Positions = require('../../../models/qlc/Positions')
const SettingConfirm = require('../../../models/qlc/SettingConfirm')
const Users = require('../../../models/Users')
const TaiSan = require('../../../models/QuanLyTaiSan/TaiSan')
const Project = require('../../../models/giaoviec365/projects')
const SettingPropose = require('../../../models/qlc/SettingPropose')
const TaiSanDangSuDung = require('../../../models/QuanLyTaiSan/TaiSanDangSuDung');

//đề xuất xin nghỉ ok
exports.de_xuat_xin_nghi = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            type_time,
            noi_dung,
            loai_np,
            ly_do,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let listLyDo = JSON.parse(noi_dung).nghi_phep
            const data = [] // Mảng chứa thông tin của từng ngày nghỉ
            for (let i = 0; i < listLyDo.length; i++) {
                let bd_nghi = listLyDo[i][0]
                let kt_nghi = listLyDo[i][1]
                let ca_nghi = listLyDo[i][2]
                if (bd_nghi && kt_nghi) {
                    let dates = functions.getDatesFromRange(bd_nghi, kt_nghi)
                    dates.forEach((date) => {
                        let formattedDate = functions.formatDate(date)
                        data.push({
                            ca_nghi,
                            bd_nghi: formattedDate,
                            kt_nghi: formattedDate,
                        })
                    })
                } else if (bd_nghi) {
                    let formattedDate = functions.formatDate(bd_nghi)
                    data.push({ ca_nghi, bd_nghi: formattedDate, kt_nghi: formattedDate })
                }
            }
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 1,
                noi_dung: {
                    nghi_phep: {
                        nd: data,
                        loai_np: loai_np,
                        ly_do: ly_do,
                    },
                },
                type_time: type_time,
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                kieu_duyet: kieu_duyet,
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let saveDX = await new_de_xuat.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }`

            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link,file_kem

            const tb =
                (await ThongBao.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0

            let idTB = 0
            if (tb) {
                idTB = Number(tb._id) + 1
            }
            // Tiếp tục tạo các bản ghi mới với idTB mới tăng dần
            const id_user_nhan_arr = id_user_duyet.split(',')
            let createTBs = []

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])
                let createTB = new ThongBao({
                    _id: idTB + i,
                    id_user: id_user,
                    id_user_nhan: id_user_nhan,
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: Math.floor(Date.now() / 1000),
                })

                createTBs.push(createTB)
            }

            // Chèn các bản ghi mới vào collection ThongBao
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Xin nghỉ phép',
                link,
                saveDX.file_kem
            )
            return functions.success(res, 'get data success', {
                saveDX,
                saveCreateTb,
            })
        }
    } catch (e) {
        return functions.setError(res, e.message)
    }
}

//đề xuất bổ nhiệm
exports.de_xuat_xin_bo_nhiem = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            ly_do,
            thanhviendc_bn,
            chucvu_hientai,
            chucvu_dx_bn,
            organizeDetailId,
            new_organizeDetailId,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }

        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 7,
                noi_dung: {
                    bo_nhiem: {
                        ly_do: ly_do,
                        thanhviendc_bn: thanhviendc_bn,
                        chucvu_hientai: chucvu_hientai,
                        chucvu_dx_bn: chucvu_dx_bn,
                        organizeDetailId: organizeDetailId,
                        new_organizeDetailId: new_organizeDetailId,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                kieu_duyet: kieu_duyet,
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let saveDX = await new_de_xuat.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }`
            const tb =
                (await thongBao.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            let idTB = 0
            if (tb) {
                idTB = Number(tb._id) + 1
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất bổ nhệm ',
                link,
                saveDX.file_kem
            )
            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: Math.floor(Date.now() / 1000),
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                saveDX,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất cấp phát tài sản
exports.de_xuat_xin_cap_phat_tai_san = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            ly_do,
            cap_phat_taisan,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }

        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 4,
                noi_dung: {
                    cap_phat_tai_san: {
                        ly_do: ly_do,
                        cap_phat_taisan: cap_phat_taisan,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                kieu_duyet: kieu_duyet,
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })
            let saveDX = await new_de_xuat.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }`

            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link,file_kem
            const tb =
                (await thongBao.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            let idTB = 0
            if (tb) {
                idTB = Number(tb._id) + 1
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất cấp phát tài sản',
                link,
                saveDX.file_kem
            )
            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])
                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: Math.floor(Date.now() / 1000),
                })
                createTBs.push(createTB)
            }
            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                saveDX,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất đổi ca
exports.de_xuat_doi_ca = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            ly_do,
            ngay_can_doi,
            ca_can_doi,
            ngay_muon_doi,
            ca_muon_doi,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }

        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 2,
                noi_dung: {
                    doi_ca: {
                        ngay_can_doi: ngay_can_doi,
                        ca_can_doi: ca_can_doi,
                        ngay_muon_doi: ngay_muon_doi,
                        ca_muon_doi: ca_muon_doi,
                        ly_do: ly_do,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                kieu_duyet: kieu_duyet,
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let saveDX = await new_de_xuat.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }`
                // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link,file_kem
            const tb =
                (await thongBao.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            let idTB = 0
            if (tb) {
                idTB = Number(tb._id) + 1
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Xin đổi ca',
                link,
                saveDX.file_kem
            )
            let createTBs = [] // Mảng chứa các đối tượng ThongBao
            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: Math.floor(Date.now() / 1000),
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                saveDX,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất luân chuyển công tác
exports.de_xuat_luan_chuyen_cong_tac = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            ly_do,
            cv_nguoi_lc,
            pb_nguoi_lc,
            noi_cong_tac,
            noi_chuyen_den,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }

        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 8,
                noi_dung: {
                    luan_chuyen_cong_tac: {
                        cv_nguoi_lc: cv_nguoi_lc,
                        pb_nguoi_lc: pb_nguoi_lc,
                        ly_do: ly_do,
                        noi_cong_tac: noi_cong_tac,
                        noi_chuyen_den: noi_chuyen_den,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })
            let saveDX = await new_de_xuat.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }`

            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link,file_kem
            const tb =
                (await thongBao.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            let idTB = 0
            if (tb) {
                idTB = Number(tb._id) + 1
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất luân chuyển công tác',
                link,
                saveDX.file_kem
            )
            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: Math.floor(Date.now() / 1000),
                })

                createTBs.push(createTB)
            }
            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                saveDX,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất tăng lương
exports.de_xuat_tang_luong = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            ly_do,
            mucluong_ht,
            mucluong_tang,
            date_tang_luong,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }

        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 6,
                noi_dung: {
                    tang_luong: {
                        mucluong_ht: mucluong_ht,
                        mucluong_tang: mucluong_tang,
                        date_tang_luong: date_tang_luong,
                        ly_do: ly_do,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                type_time: 0,
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let saveDX = await new_de_xuat.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }`

            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link,file_kem
            const tb =
                (await thongBao.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            let idTB = 0
            if (tb) {
                idTB = Number(tb._id) + 1
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất tăng lương',
                link,
                saveDX.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: Math.floor(Date.now() / 1000),
                })
                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                saveDX,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đè xuất tham gia dự ấn
exports.de_xuat_tham_gia_du_an = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            ly_do,
            cv_nguoi_da,
            pb_nguoi_da,
            dx_da,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0

            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 9,
                noi_dung: {
                    tham_gia_du_an: {
                        ly_do: ly_do,
                        cv_nguoi_da: cv_nguoi_da,
                        pb_nguoi_da: pb_nguoi_da,
                        dx_da: dx_da,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                kieu_duyet: 0,
                type_duyet: 0,
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })
            let saveDX = await new_de_xuat.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }`

            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link,file_kem
            const tb =
                (await thongBao.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            let idTB = 0
            if (tb) {
                idTB = Number(tb._id) + 1
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất tham gia dự án',
                link,
                saveDX.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])
                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: Math.floor(Date.now() / 1000),
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                saveDX,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất xin tạm ứng lương
exports.de_xuat_xin_tam_ung = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            ly_do,
            type_time,
            tien_tam_ung,
            ngay_tam_ung,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 3,
                noi_dung: {
                    tam_ung: {
                        ly_do: ly_do,
                        sotien_tam_ung: tien_tam_ung,
                        ngay_tam_ung: ngay_tam_ung,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                kieu_duyet: 0,
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let saveDX = await new_de_xuat.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }`

            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link,file_kem
            const tb =
                (await thongBao.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            let idTB = 0
            if (tb) {
                idTB = Number(tb._id) + 1
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất tạm ứng',
                link,
                saveDX.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: Math.floor(Date.now() / 1000),
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                saveDX,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất thôi việc
exports.de_xuat_xin_thoi_Viec = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            ly_do,
            type_time,
            ngaybatdau_tv,
            ca_bdnghi,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }

        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 5,
                noi_dung: {
                    thoi_viec: {
                        ly_do: ly_do,
                        ngaybatdau_tv: ngaybatdau_tv,
                        ca_bdnghi: ca_bdnghi,
                    },
                },
                type_time: type_time,
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })
            let saveDX = await new_de_xuat.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }` // đường dẫn chi tiết đề xuất

            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link,file_kem
            const tb =
                (await thongBao.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            let idTB = 0
            if (tb) {
                idTB = Number(tb._id) + 1
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất thôi việc',
                link,
                saveDX.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: Math.floor(Date.now() / 1000),
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                saveDX,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất lịch làm việc
exports.lich_lam_viec = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            ly_do,
            lich_lam_viec,
            thang_ap_dung,
            ngay_bat_dau,
            ca_lam_viec,
            ngay_lam_viec,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!id_user || !id_user_duyet || !id_user_theo_doi) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 18,
                noi_dung: {
                    lich_lam_viec: {
                        ly_do: ly_do,
                        lich_lam_viec: lich_lam_viec,
                        thang_ap_dung: thang_ap_dung,
                        ngay_bat_dau: ngay_bat_dau,
                        ca_la_viec: ca_lam_viec,
                        ngay_lam_viec: ngay_lam_viec,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let saveDX = await new_de_xuat.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }`

            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link,file_kem
            const tb =
                (await thongBao.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
            let idTB = 0
            if (tb) {
                idTB = Number(tb._id) + 1
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất lịch làm việc',
                link
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])
                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: Math.floor(Date.now() / 1000),
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                saveDX,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất cộng công
exports.dxCong = async(req, res) => {
    try {
        let {
            name_dx,
            noi_dung,
            kieu_duyet,
            id_user_duyet,
            id_user_theo_doi,
            ca_xnc,
            time_vao_ca,
            time_het_ca,
            id_ca_xnc,
            time_xnc,
            ly_do,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let createDXC = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 17,
                noi_dung: {
                    xac_nhan_cong: {
                        time_vao_ca: time_vao_ca,
                        time_het_ca: time_het_ca,
                        id_ca_xnc: id_ca_xnc,
                        time_xnc: time_xnc,
                        ca_xnc: ca_xnc,
                        ly_do: ly_do,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })
            let savedDXC = await createDXC.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = savedDXC.id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất cộng công',
                link,
                savedDXC.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: savedDXC._id,
                    type: 2,
                    view: 0,
                    created_date: Math.floor(Date.now() / 1000),
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                savedDXC,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất sửa chữa cơ sở vật chất
exports.dxCoSoVatChat = async(req, res) => {
    try {
        let {
            name_dx,
            tai_san,
            so_luong,
            so_tien,
            ngay_sc,
            kieu_duyet,
            id_user_duyet,
            id_user_theo_doi,
            time_start_out,
            ly_do,
            type_time,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let createDate = Math.floor(Date.now() / 1000)
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let createDXCSVC = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 14,
                noi_dung: {
                    sua_chua_co_so_vat_chat: {
                        tai_san: tai_san,
                        so_luong: so_luong,
                        ngay_sc: ngay_sc,
                        so_tien: so_tien,
                        ly_do: ly_do,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                time_start_out: time_start_out,
                time_create: createDate,
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })
            let savedDXCSVC = await createDXCSVC.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất cơ sở vật chất',
                link,
                savedDXCSVC.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: savedDXCSVC._id,
                    type: 2,
                    view: 0,
                    created_date: createDate,
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                savedDXCSVC,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất đăng kí sử dụng xe
exports.dxDangKiSuDungXe = async(req, res) => {
    try {
        let {
            name_dx,
            noi_dung,
            kieu_duyet,
            id_user_duyet,
            id_user_theo_doi,
            type_duyet,
            bd_xe,
            end_xe,
            soluong_xe,
            local_di,
            local_den,
            ly_do,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let createDate = Math.floor(Date.now() / 1000)
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let createDXXe = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 13,
                noi_dung: {
                    su_dung_xe_cong: {
                        bd_xe: bd_xe,
                        end_xe: end_xe,
                        soluong_xe: soluong_xe,
                        local_di: local_di,
                        local_den: local_den,
                        ly_do: ly_do,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                type_duyet: type_duyet,
                time_create: createDate,
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let savedDXXe = await createDXXe.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất đăng kí sử dụng xe',
                link,
                savedDXXe.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: savedDXXe._id,
                    type: 2,
                    view: 0,
                    created_date: createDate,
                })

                createTBs.push(createTB)
            }
            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                savedDXXe,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất hoa hồng
exports.dxHoaHong = async(req, res) => {
    try {
        let {
            name_dx,
            noi_dung,
            kieu_duyet,
            id_user_duyet,
            id_user_theo_doi,
            type_duyet,
            chu_ky,
            type_time,
            item_mdt_date,
            dt_money,
            ly_do,
            name_dt,
            time_hh,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let createDate = Math.floor(Date.now() / 1000)
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let createDXHH = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 20,
                noi_dung: {
                    hoa_hong: {
                        chu_ky: chu_ky,
                        time_hh: time_hh,
                        item_mdt_date: item_mdt_date,
                        dt_money: dt_money,
                        name_dt: name_dt,
                        ly_do: ly_do,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                type_duyet: type_duyet,
                time_create: createDate,
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let savedDXHH = await createDXHH.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = savedDXHH.id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất hoa hồng',
                link,
                savedDXHH.file_kem
            )
            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: savedDXHH._id,
                    type: 2,
                    view: 0,
                    created_date: createDate,
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                savedDXHH,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất khiếu nại
exports.dxKhieuNai = async(req, res) => {
    try {
        let {
            name_dx,
            noi_dung,
            kieu_duyet,
            id_user_duyet,
            id_user_theo_doi,
            type_duyet,
            ly_do,
            type_time,
            link,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let createDate = Math.floor(Date.now() / 1000)
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let createDXKN = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 16,
                noi_dung: {
                    khieu_nai: {
                        ly_do: ly_do,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                type_duyet: type_duyet,
                time_create: createDate,
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let savedDXKN = await createDXKN.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = savedDXKN.id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất khiếu nại',
                link,
                savedDXKN.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: savedDXKN._id,
                    type: 2,
                    view: 0,
                    created_date: createDate,
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                savedDXKN,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất xử dụng phòng họp
exports.dxPhongHop = async(req, res) => {
    try {
        let {
            name_dx,
            noi_dung,
            kieu_duyet,
            id_user_duyet,
            id_user_theo_doi,
            type_duyet,
            bd_hop,
            type_time,
            end_hop,
            phong_hop,
            ly_do,
        } = req.body
        let createDate = Math.floor(Date.now() / 1000)
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let createDXPH = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 12,
                noi_dung: {
                    su_dung_phong_hop: {
                        bd_hop: bd_hop,
                        end_hop: end_hop,
                        ly_do: ly_do,
                        phong_hop: phong_hop,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                type_duyet: type_duyet,
                time_create: createDate,
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let savedDXPH = await createDXPH.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = savedDXPH.id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất sử dụng phòng họp',
                link,
                savedDXPH.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: savedDXPH._id,
                    type: 2,
                    view: 0,
                    created_date: createDate,
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                savedDXPH,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất tăng ca
exports.dxTangCa = async(req, res) => {
    try {
        let {
            name_dx,
            noi_dung,
            kieu_duyet,
            id_user_duyet,
            id_user_theo_doi,
            type_duyet,
            ly_do,
            type_time,
            time_tc,
            shift_id,
        } = req.body
        let createDate = Math.floor(Date.now() / 1000)
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let createDXTC = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 10,
                noi_dung: {
                    tang_ca: {
                        ly_do: ly_do,
                        time_tc: time_tc,
                        shift_id: shift_id,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                type_duyet: type_duyet,
                time_create: createDate,
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let savedDXTC = await createDXTC.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = savedDXTC.id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất tăng ca',
                link,
                savedDXTC.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: savedDXTC._id,
                    type: 2,
                    view: 0,
                    created_date: createDate,
                })

                createTBs.push(createTB)
            }
            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                savedDXTC,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất nghỉ thai sản
exports.dxThaiSan = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet,
            id_user_duyet,
            id_user_theo_doi,
            type_duyet,
            ngaybatdau_nghi_ts,
            ngayketthuc_nghi_ts,
            ly_do,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let createDate = Math.floor(Date.now() / 1000)
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let createDXTS = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 11,
                noi_dung: {
                    nghi_thai_san: {
                        ngaybatdau_nghi_ts: ngaybatdau_nghi_ts,
                        ngayketthuc_nghi_ts: ngayketthuc_nghi_ts,
                        ly_do: ly_do,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                type_duyet: type_duyet,
                time_create: createDate,
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let savedDXTS = await createDXTS.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = savedDXTS.id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất nghỉ thai sản',
                savedDXTS.file_kem,
                link
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: savedDXTS._id,
                    type: 2,
                    view: 0,
                    created_date: createDate,
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                savedDXTS,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất thanh toán
exports.dxThanhToan = async(req, res) => {
    try {
        let {
            name_dx,
            noi_dung,
            kieu_duyet,
            id_user_duyet,
            id_user_theo_doi,
            type_duyet,
            type_time,
            so_tien_tt,
            ly_do,
        } = req.body
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let createDate = Math.floor(Date.now() / 1000)
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let createDXTT = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 15,
                noi_dung: {
                    thanh_toan: {
                        so_tien_tt: so_tien_tt,
                        ly_do: ly_do,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                type_duyet: type_duyet,
                time_create: createDate,
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let savedDXTT = await createDXTT.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = savedDXTT.id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất thanh toán',
                link,
                savedDXTT.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: savedDXTT._id,
                    type: 2,
                    view: 0,
                    created_date: createDate,
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                savedDXTT,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất thưởng phạt
exports.dxThuongPhat = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet,
            id_user_duyet,
            id_user_theo_doi,
            type_duyet,
            type_tp,
            so_tien_tp,
            nguoi_phat_tp,
            id_nguoi_tp,
            time_tp,
            ly_do,
        } = req.body
        let createDate = Math.floor(Date.now() / 1000)
        let id_user = ''
        let com_id = ''
        let name_user = ''
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id
            name_user = req.user.data.userName
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let file_kem = req.files.file_kem
        if (type_tp == 1) {
            nguoi_tp = id_nguoi_tp
        } else {
            nguoi_tp = nguoi_phat_tp
        }
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return functions.setError(res, 'không thể thực thi', 400)
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let createDXTP = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 19,
                noi_dung: {
                    thuong_phat: {
                        so_tien_tp: so_tien_tp,
                        nguoi_tp: nguoi_tp,
                        time_tp: time_tp,
                        type_tp: type_tp,
                        ly_do: ly_do,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                type_duyet: type_duyet,
                time_create: createDate,
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let savedDXTP = await createDXTP.save()
            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = savedDXTP.id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất thưởng phạt',
                link,
                savedDXTP.file_kem
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: savedDXTP._id,
                    type: 2,
                    view: 0,
                    created_date: createDate,
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return functions.success(res, 'get data success', {
                savedDXTP,
                saveCreateTb,
            })
        }
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error)
    }
}

//đề xuất đi muộn về sớm
exports.dxDiMuonVeSom = async(req, res) => {
    try {
        let {
            name_dx,
            type_dx,
            kieu_duyet,
            id_user_duyet,
            id_user_theo_doi,
            type_duyet,
            ngay_di_muon_ve_som,
            time_batdau,
            // time_batdau_tomorrow,
            time_ketthuc,
            // time_ketthuc_tomorrow,
            ca_lam_viec,
            ly_do,
        } = req.body
        let id_user = req.user.data.idQLC
        let com_id = -1
        if (req.user.data.com_id) {
            com_id = req.user.data.com_id
        }
        let name_user = req.user.data.userName
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return res.status(404).json('bad request')
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let createDXDMVS = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 21,
                noi_dung: {
                    di_muon_ve_som: {
                        loai_de_xuat: type_dx,
                        ngay_di_muon_ve_som: ngay_di_muon_ve_som,
                        time_batdau: time_batdau,
                        // time_batdau_tomorrow: time_batdau_tomorrow,
                        time_ketthuc: time_ketthuc,
                        // time_ketthuc_tomorrow: time_ketthuc_tomorrow,
                        ca_lam_viec: ca_lam_viec,
                        ly_do: ly_do,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                type_duyet: type_duyet,
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let savedDXDMVS = await createDXDMVS.save()

            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = savedDXDMVS.id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất đi muộn về sớm',
                link
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao
            let createDate = Math.floor(Date.now() / 1000)
            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: savedDXDMVS._id,
                    type: 2,
                    view: 0,
                    created_date: createDate,
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)

            res.status(200).json({ savedDXDMVS: savedDXDMVS, saveCreateTb })
        }
    } catch (error) {
        console.error('Failed to add', error)
        res.status(500).json({ error: 'Failed to add' })
    }
}

//đề xuất xin nghỉ phép ra ngoài
exports.dxXinNghiRaNgoai = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            phong_ban,
            type_dx,
            ly_do,
            bd_nghi,
            kt_nghi,
            time_bd_nghi,
            time_kt_nghi,
            ca_nghi,
            type_duyet,
        } = req.body
        let id_user = req.user.data.idQLC
        let com_id = -1
        if (req.user.data.com_id) {
            com_id = req.user.data.com_id
        }
        let name_user = req.user.data.userName
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return res.status(404).json('bad request')
        } else {
            let maxID = await functions.getMaxID(DeXuat)
            let _id = 0
            if (maxID) {
                _id = Number(maxID)
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])
            let new_de_xuat = new DeXuat({
                _id: _id,
                name_dx: name_dx,
                type_dx: 22,
                noi_dung: {
                    nghi_phep_ra_ngoai: {
                        ly_do: ly_do,
                        loai_de_xuat: type_dx,
                        bd_nghi: bd_nghi,
                        kt_nghi: kt_nghi,
                        time_bd_nghi: time_bd_nghi,
                        time_kt_nghi: time_kt_nghi,
                        ca_nghi: ca_nghi,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                file_kem: link_download.map((file) => ({ file })),
                type_duyet: type_duyet,
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
            })

            let saveDX = await new_de_xuat.save()

            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${_id}`

            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = saveDX.id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Đề xuất đi muộn về sớm',
                link
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao
            let createDate = Math.floor(Date.now() / 1000)
            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: createDate,
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)

            res.status(200).json({ saveDX, saveCreateTb })
        }
    } catch (error) {
        console.error('Failed to add', error)
        res.status(500).json({ error: 'Failed to add' })
    }
}

//đề xuất nhập ngày nhận lương
exports.dxNhapNgayNhanLuong = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            phong_ban,
            ngay_nhan_luong,
            ly_do,
        } = req.body
        let id_user = req.user.data.idQLC
        let com_id = -1
        if (req.user.data.com_id) {
            com_id = req.user.data.com_id
        }
        let name_user = req.user.data.userName
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return res.status(404).json('bad request ')
        } else {
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
                //   console.log(de_xuat);
            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])

            //console.log("mx : " + maxID);
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 23,
                phong_ban: phong_ban,
                noi_dung: {
                    nhap_ngay_nhan_luong: {
                        ly_do: ly_do,
                        ngay_nhan_luong: ngay_nhan_luong,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                //file_kem: link_download,
                file_kem: link_download.map((file) => ({ file })),
                kieu_duyet: 0,
                //   type_duyet: 0,
                //  type_time: type_time,
                //time_start_out: " ",
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
                //  time_tiep_nhan: null,
                //  time_duyet: null,
                // active: 1,//1-bên 3 đã đồng ý , 2 - bên 3 không đồng ý
                // del_type: 1,//1-active , 2 --delete
            })
            let saveDX = await new_de_xuat.save()

            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }`

            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link,file_kem
            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Nhập ngày nhận lương',
                link
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: new Date(),
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return res.status(200).json({ saveDX, saveCreateTb })
        }
    } catch (error) {
        console.error('Failed to add', error)
        res.status(500).json({ error: 'Failed to add' + error })
    }
}

//đề xuất xin tải tài liệu
exports.dxXinTaiTaiLieu = async(req, res) => {
    try {
        let {
            name_dx,
            kieu_duyet, // 0-kiểm duyệt lần lượt hay đồng thời
            id_user_duyet,
            id_user_theo_doi,
            phong_ban,
            ten_tai_lieu,
            ly_do,
        } = req.body
        let id_user = req.user.data.idQLC
        let com_id = -1
        if (req.user.data.com_id) {
            com_id = req.user.data.com_id
        }
        let name_user = req.user.data.userName
        let link_download = []
        if (req.files.fileKem) {
            let file_kem = req.files.fileKem
            let listFile = []
            if (Array.isArray(file_kem)) {
                // Người dùng gửi nhiều file hoặc một file duy nhất
                file_kem.forEach((file) => {
                    functions.uploadFileVanThu(id_user, file)
                    listFile.push(file.name)
                })
            } else {
                // Người dùng chỉ gửi một file
                functions.uploadFileVanThu(id_user, file_kem)
                listFile.push(file_kem.name)
            }
            link_download = listFile
        }
        if (!name_dx ||
            !name_user ||
            !id_user ||
            !id_user_duyet ||
            !id_user_theo_doi
        ) {
            return res.status(404).json('bad request ')
        } else {
            let maxID = 0
            const de_xuat =
                (await De_Xuat.findOne({}, {}, { sort: { _id: -1 } }).lean()) || 0
                //   console.log(de_xuat);
            if (de_xuat) {
                maxID = de_xuat._id
            }
            const user = await User.aggregate([{
                    $match: {
                        idQLC: id_user,
                        'inForPerson.employee.com_id': com_id,
                        type: 2,
                    },
                },
                {
                    $lookup: {
                        from: 'QLC_OrganizeDetail',
                        localField: 'inForPerson.employee.organizeDetailId',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'organizeDetail',
                    },
                },
                {
                    $unwind: '$organizeDetail',
                },
                {
                    $project: {
                        organizeDetailName: '$organizeDetail.organizeDetailName',
                    },
                },
            ])

            //console.log("mx : " + maxID);
            const new_de_xuat = new De_Xuat({
                _id: maxID + 1,
                name_dx: name_dx,
                type_dx: 24,
                phong_ban: phong_ban,
                noi_dung: {
                    xin_tai_tai_lieu: {
                        ly_do: ly_do,
                        ten_tai_lieu: ten_tai_lieu,
                    },
                },
                name_user: name_user,
                id_user: id_user,
                com_id: com_id,
                kieu_duyet: kieu_duyet,
                id_user_duyet: id_user_duyet,
                id_user_theo_doi: id_user_theo_doi,
                //file_kem: link_download,
                file_kem: link_download.map((file) => ({ file })),
                kieu_duyet: 0,
                //   type_duyet: 0,
                //  type_time: type_time,
                //time_start_out: " ",
                time_create: Math.floor(Date.now() / 1000),
                organizeDetailName: user && user.length > 0 ? user[0].organizeDetailName : '',
                //  time_tiep_nhan: null,
                //  time_duyet: null,
                // active: 1,//1-bên 3 đã đồng ý , 2 - bên 3 không đồng ý
                // del_type: 1,//1-active , 2 --delete
            })
            let saveDX = await new_de_xuat.save()

            let link = `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${
        maxID + 1
      }`

            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link,file_kem
            let maxIDTB = await functions.getMaxID(ThongBao)
            let idTB = 0
            if (maxIDTB) {
                idTB = Number(maxIDTB)
            }
            const id_user_nhan_arr = id_user_duyet.split(',')
            id_user_theo_doi = id_user_theo_doi.split(',')
            functions.chat(
                id_user,
                id_user_nhan_arr,
                com_id,
                name_dx,
                id_user_theo_doi,
                'Xin tải tài liệu',
                link
            )

            let createTBs = [] // Mảng chứa các đối tượng ThongBao

            for (let i = 0; i < id_user_nhan_arr.length; i++) {
                const id_user_nhan = parseInt(id_user_nhan_arr[i])

                let createTB = new ThongBao({
                    _id: idTB + i, // Sử dụng idTB + i để tạo id duy nhất cho mỗi đối tượng ThongBao
                    id_user: id_user,
                    id_user_nhan: id_user_nhan, // Lưu giá trị từng phần tử của id_user_duyet dưới dạng số
                    id_van_ban: saveDX._id,
                    type: 2,
                    view: 0,
                    created_date: new Date(),
                })

                createTBs.push(createTB)
            }

            // Lưu tất cả các đối tượng ThongBao vào cơ sở dữ liệu
            let saveCreateTb = await ThongBao.insertMany(createTBs)
            return res.status(200).json({ saveDX, saveCreateTb })
        }
    } catch (error) {
        console.error('Failed to add', error)
        res.status(500).json({ error: 'Failed to add' })
    }
}

//fetch ra người duyệt và người theo dõi
exports.showadd = async(req, res) => {
    try {
        if (req.user.data.type !== 2) {
            return functions.setError(res, 'không có quyền truy cập', 400)
        }
        let com_id = req.user.data.com_id
        const user = await User.aggregate([{
                $match: {
                    idQLC: req.user.data.idQLC,
                    'inForPerson.employee.com_id': com_id,
                    type: 2,
                },
            },
            {
                $lookup: {
                    from: 'QLC_Positions',
                    localField: 'inForPerson.employee.position_id',
                    foreignField: 'id',
                    pipeline: [{
                        $match: {
                            comId: com_id,
                        },
                    }, ],
                    as: 'position',
                },
            },
            {
                $unwind: '$position',
            },
            {
                $project: {
                    idQLC: '$idQLC',
                    userName: '$userName',
                    position: '$position',
                    com_id: '$inForPerson.employee.com_id',
                    listOrganizeDetailId: '$inForPerson.employee.listOrganizeDetailId',
                },
            },
        ])
        let users
        if (user && user.length > 0) {
            if (user[0].listOrganizeDetailId) {
                users = await User.aggregate([{
                        $match: {
                            'inForPerson.employee.com_id': com_id,
                            'inForPerson.employee.ep_status': 'Active',
                            type: 2,
                        },
                    },
                    {
                        $sort: { userName: -1 },
                    },
                    {
                        $lookup: {
                            from: 'QLC_Positions',
                            localField: 'inForPerson.employee.position_id',
                            foreignField: 'id',
                            pipeline: [{
                                $match: {
                                    comId: com_id,
                                },
                            }, ],
                            as: 'position',
                        },
                    },
                    {
                        $unwind: '$position',
                    },
                    {
                        $match: {
                            $or: [{
                                    'position.isManager': 1,
                                    'position.level': {
                                        $lt: user[0].position.level,
                                    },
                                },
                                {
                                    'inForPerson.employee.listOrganizeDetailId': {
                                        $exists: true,
                                    },
                                    'inForPerson.employee.listOrganizeDetailId': { $ne: [] },
                                    'inForPerson.employee.listOrganizeDetailId': {
                                        $not: {
                                            $elemMatch: {
                                                $nin: user[0].listOrganizeDetailId.map((item) => ({
                                                    level: item.level,
                                                    organizeDetailId: item.organizeDetailId,
                                                })),
                                            },
                                        },
                                    },
                                    'position.level': {
                                        $lt: user[0].position.level,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $project: {
                            idQLC: '$idQLC',
                            userName: '$userName',
                            avatarUser: '$avatarUser',
                        },
                    },
                ])
            } else {
                users = await User.aggregate([{
                        $match: {
                            'inForPerson.employee.com_id': com_id,
                            'inForPerson.employee.ep_status': 'Active',
                            type: 2,
                        },
                    },
                    {
                        $sort: { userName: -1 },
                    },
                    {
                        $lookup: {
                            from: 'QLC_Positions',
                            localField: 'inForPerson.employee.position_id',
                            foreignField: 'id',
                            pipeline: [{
                                $match: {
                                    comId: com_id,
                                },
                            }, ],
                            as: 'position',
                        },
                    },
                    {
                        $unwind: '$position',
                    },
                    {
                        $match: {
                            $or: [{
                                    'position.isManager': 1,
                                    'position.level': {
                                        $lt: user[0].position.level,
                                    },
                                },
                                {
                                    'position.level': {
                                        $lt: user[0].position.level,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $project: {
                            idQLC: '$idQLC',
                            userName: '$userName',
                            avatarUser: '$avatarUser',
                        },
                    },
                ])
            }
        } else {
            users = await User.aggregate([{
                    $match: {
                        'inForPerson.employee.com_id': com_id,
                        'inForPerson.employee.ep_status': 'Active',
                        type: 2,
                    },
                },
                {
                    $sort: { userName: -1 },
                },
                {
                    $lookup: {
                        from: 'QLC_Positions',
                        localField: 'inForPerson.employee.position_id',
                        foreignField: 'id',
                        pipeline: [{
                            $match: {
                                comId: com_id,
                            },
                        }, ],
                        as: 'position',
                    },
                },
                {
                    $unwind: '$position',
                },
                {
                    $match: {
                        'position.isManager': 1,
                    },
                },
                {
                    $project: {
                        idQLC: '$idQLC',
                        userName: '$userName',
                        avatarUser: '$avatarUser',
                    },
                },
            ])
        }
        const data = []
        const ListTopManagers = []
        if (user && user.length > 0 && user[0].listOrganizeDetailId) {
            const UserlistOrganizeDetailId = user[0].listOrganizeDetailId

            while (UserlistOrganizeDetailId.length > 0) {
                const a = [...UserlistOrganizeDetailId]
                data.push(a)
                UserlistOrganizeDetailId.pop()
            }
            await Promise.all(
                data.map(async(value, index) => {
                    const manager = await Users.aggregate([{
                            $match: {
                                'inForPerson.employee.com_id': com_id,
                                'inForPerson.employee.listOrganizeDetailId': {
                                    $all: value,
                                },
                                'inForPerson.employee.ep_status': 'Active',
                            },
                        },
                        {
                            $lookup: {
                                from: 'QLC_Positions',
                                localField: 'inForPerson.employee.position_id',
                                foreignField: 'id',
                                pipeline: [{
                                    $match: {
                                        comId: com_id,
                                    },
                                }, ],
                                as: 'positions',
                            },
                        },
                        {
                            $unwind: '$positions',
                        },
                        {
                            $sort: {
                                'positions.level': 1,
                            },
                        },
                        {
                            $limit: 2,
                        },
                        {
                            $project: {
                                idQLC: '$idQLC',
                                userName: '$userName',
                                avatarUser: '$avatarUser',
                                position_id: '$inForPerson.employee.position_id',
                            },
                        },
                    ])
                    if (manager && Number(manager.length) === 2) {
                        if (
                            Number(manager[0].position_id) !== Number(manager[1].position_id)
                        ) {
                            ListTopManagers.push({
                                userName: manager[0].userName,
                                idQLC: manager[0].idQLC,
                                avatarUser: manager[0].avatarUser,
                            })
                        }
                    } else if (manager && Number(manager.length) === 1) {
                        ListTopManagers.push({
                            userName: manager[0].userName,
                            idQLC: manager[0].idQLC,
                            avatarUser: manager[0].avatarUser,
                        })
                    }
                })
            )
        }

        //Tìm ra những nhân viên có level cao hơn nhân viên cần duyệt
        ListTopManagers.map((l) => {
            if (!users.some((u) => u.idQLC === l.idQLC)) {
                users.push(l)
            }
        })
        let listUsersDuyet = users
        let listUsersTheoDoi = await User.find({
                'inForPerson.employee.com_id': com_id,
                'inForPerson.employee.ep_status': 'Active',
            })
            .select('idQLC userName avatarUser')
            .lean()

        for (let i = 0; i < listUsersDuyet.length; i++) {
            let userDuyet = listUsersDuyet[i]
            let avatar = fnc.createLinkFileEmpQLC(
                userDuyet.idQLC,
                userDuyet.avatarUser
            )
            if (avatar) {
                userDuyet.avatarUser = avatar
            }
        }
        for (let i = 0; i < listUsersTheoDoi.length; i++) {
            let userTheoDoi = listUsersTheoDoi[i]
            let avatar = fnc.createLinkFileEmpQLC(
                userTheoDoi.idQLC,
                userTheoDoi.avatarUser
            )
            if (avatar) {
                userTheoDoi.avatarUser = avatar
            }
        }
        return await functions.success(res, 'Lấy thành công', {
            listUsersDuyet,
            listUsersTheoDoi,
        })
    } catch (error) {
        console.error('Failed ', error)
        return functions.setError(res, error.message)
    }
}

//fetch ra danh sách mức doanh thu
exports.showMucDoanhThu = async(req, res) => {
    try {
        let com_id = req.user.data.com_id
        const danhthuList = await TinhluongThietLap.find({
            tl_id_com: com_id,
            tl_id_rose: 2,
        })
        return functions.success(res, 'Lấy thành công', { danhthuList })
    } catch (error) {
        return functions.setError(res, error.message)
    }
}
exports.handleOldRosePropose = async(req, res) => {
    try {
        const com_id = 3312
        const dxhh = await DeXuat.find({ com_id: com_id, type_dx: 20 })
        return res.status(200).json({ dxhh: dxhh })
    } catch (error) {
        res.status(500).json({ error: error })
    }
}

exports.emp_shift_in_day = async(req, res) => {
    try {
        const com_id = req.user.data.com_id
        const id_user = req.user.data.idQLC
        let { day } = req.body
        const trueDay = new Date(day)
        const emp_cycle = await EmployeCycle.aggregate([{
                $match: {
                    ep_id: id_user,
                },
            },
            {
                $lookup: {
                    from: 'CC365_Cycle',
                    localField: 'cy_id',
                    foreignField: 'cy_id',
                    pipeline: [{
                        $match: {
                            com_id: com_id,
                            apply_month: {
                                $gt: new Date(trueDay.getFullYear(), trueDay.getMonth(), 0),
                                $lt: new Date(
                                    trueDay.getFullYear(),
                                    trueDay.getMonth() + 1,
                                    0
                                ),
                            },
                        },
                    }, ],
                    as: 'Cycle',
                },
            },
            {
                $unwind: '$Cycle',
            },
            {
                $project: {
                    cycle: '$Cycle.cy_detail',
                    update_time: '$update_time',
                },
            },
        ])
        let dayCycleDetail = []
        for (let i = 0; i < emp_cycle.length; i++) {
            const detail = JSON.parse(emp_cycle[i].cycle)
            for (let j = 0; j < detail.length; j++) {
                dayCycleDetail.push({
                    date: detail[j].date,
                    shift_id: detail[j].shift_id,
                    update_time: new Date(emp_cycle[i].update_time).getTime(),
                })
            }
        }
        const choosenDayCycleDetail = dayCycleDetail.filter((d) => d.date === day)
        const latestChosenDayCycleDetail = choosenDayCycleDetail.reduce(
            (max, current) => {
                if (current.update_time > max.update_time) {
                    return current
                } else {
                    return max
                }
            },
            choosenDayCycleDetail[0]
        )
        let list = []
        if (latestChosenDayCycleDetail) {
            const shiftIds = latestChosenDayCycleDetail.shift_id
                .split(',')
                .map(Number)
            if (shiftIds.length > 0) {
                list = await Shifts.aggregate([{
                        $match: {
                            com_id: Number(com_id),
                            shift_id: {
                                $in: shiftIds,
                            },
                        },
                    },
                    {
                        $sort: { _id: -1 },
                    },
                ])
            }
        }
        return res.status(200).json({ list })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: error })
    }
}
exports.meetingRooms = async(req, res) => {
    try {
        let { time_start, time_end } = req.body
        const com_id = req.user.data.com_id
        const meetingRooms = await MeetingRoom.find({
            com_id: com_id,
            trangthai: 1,
        }).lean()
        let meetingRoomWitStatus = []
        if (meetingRooms && meetingRooms.length > 0) {
            for (let i = 0; i < meetingRooms.length; i++) {
                const meetingsRaw = await Meeting.find({
                    com_id: com_id,
                    address_links: meetingRooms[i].id.toString(),
                }).lean()
                if (meetingsRaw && meetingsRaw.length > 0) {
                    const meetings = meetingsRaw.map((m) => {
                        const startDate = new Date(
                            `${m.date_start}T${m.time_start}`.replace(/\s/g, '')
                        ).getTime()
                        const endDate = startDate + m.time_estimated * 60 * 1000
                        return {
                            ...m,
                            startDateNumber: startDate / 1000,
                            endDateNumber: endDate / 1000,
                        }
                    })
                    if (
                        meetings.every(
                            (m) =>
                            time_end <= m.startDateNumber || time_start >= m.endDateNumber
                        )
                    ) {
                        meetingRoomWitStatus.push({
                            ...meetingRooms[i],
                            availableStatus: 0, //Có sẵn
                        })
                    } else if (
                        meetings.some(
                            (m) =>
                            (time_start <= m.startDateNumber &&
                                time_end >= m.startDateNumber &&
                                time_end <= m.endDateNumber) ||
                            (time_start <= m.endDateNumber &&
                                time_start >= m.startDateNumber &&
                                time_end >= m.endDateNumber)
                        )
                    ) {
                        meetingRoomWitStatus.push({
                            ...meetingRooms[i],
                            availableStatus: 1, //Có sẵn 1 nửa
                        })
                    } else if (
                        meetings.some(
                            (m) =>
                            (time_start <= m.startDateNumber &&
                                time_end >= m.endDateNumber) ||
                            (time_start >= m.startDateNumber && time_end <= m.endDateNumber)
                        )
                    ) {
                        meetingRoomWitStatus.push({
                            ...meetingRooms[i],
                            availableStatus: 2, //Không có sãn
                        })
                    }
                } else {
                    meetingRoomWitStatus.push({
                        ...meetingRooms[i],
                        availableStatus: 0, //Có sẵn
                    })
                }
            }
        }
        return res.status(200).json({ meetingRoomWitStatus })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error })
    }
}
exports.InitNewPostions = async(req, res) => {
    const { com_id } = req.body
    const pos = [
        { level: 21, value: '1', label: 'SINH VIÊN THỰC TẬP' },
        { level: 20, value: '9', label: 'NHÂN VIÊN PART TIME' },
        { level: 19, value: '2', label: 'NHÂN VIÊN THỬ VIỆC' },
        { level: 18, value: '3', label: 'NHÂN VIÊN CHÍNH THỨC' },
        { level: 17, value: '20', label: 'NHÓM PHÓ' },
        { level: 16, value: '4', label: 'TRƯỞNG NHÓM' },
        { level: 15, value: '12', label: 'PHÓ TỔ TRƯỞNG' },
        { level: 14, value: '13', label: 'TỔ TRƯỞNG' },
        { level: 13, value: '10', label: 'PHÓ BAN DỰ ÁN' },
        { level: 12, value: '11', label: 'TRƯỞNG BAN DỰ ÁN' },
        { level: 11, value: '5', label: 'PHÓ TRƯỞNG PHÒNG' },
        { level: 10, value: '6', label: 'TRƯỞNG PHÒNG' },
        { level: 9, value: '7', label: 'PHÓ GIÁM ĐỐC' },
        { level: 8, value: '8', label: 'GIÁM ĐỐC' },
        { level: 7, value: '14', label: 'PHÓ TỔNG GIÁM ĐỐC' },
        { level: 6, value: '16', label: 'TỔNG GIÁM ĐỐC' },
        { level: 5, value: '22', label: 'PHÓ TỔNG GIÁM ĐỐC TẬP ĐOÀN' },
        { level: 4, value: '21', label: 'TỔNG GIÁM ĐỐC TẬP ĐOÀN' },
        { level: 3, value: '17', label: 'THÀNH VIÊN HỘI ĐỒNG QUẢN TRỊ' },
        { level: 2, value: '18', label: 'PHÓ CHỦ TỊCH HỘI ĐỒNG QUẢN TRỊ' },
        { level: 1, value: '19', label: 'CHỦ TỊCH HỘI ĐỒNG QUẢN TRỊ' },
    ]
    const pos_in_com = pos.map((pos) => {
        let isManager = 0
        if (pos.level <= 9) {
            isManager = 1
        }
        if (pos.level > 9 && pos.level <= 17) {
            isManager = 2
        }
        return {
            id: Number(pos.value),
            comId: com_id,
            positionName: pos.label,
            level: pos.level,
            isManager: isManager,
            created_time: Math.round(new Date().getTime() / 1000),
        }
    })
    const update = await Positions.insertMany(pos_in_com)
    return res.status(200).json({ update })
}
exports.positions = async(req, res) => {
    try {
        const com_id = req.user.data.com_id
        const positions = await Positions.find({ comId: com_id })
        return res.status(200).json({ positions })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error })
    }
}
exports.settingConfirm = async(req, res) => {
    try {
        const idQLC = req.user.data.idQLC
        const com_id = req.user.data.com_id
        const settingConfirm = await SettingConfirm.findOne({
            ep_id: idQLC,
            comId: com_id,
        }).lean()
        return res.status(200).json({ settingConfirm })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error })
    }
}
exports.getUserWithOrganize = async(req, res) => {
    try {
        let { ep_id } = req.body
        const com_id = req.user.data.com_id
        const conditions = {
            'inForPerson.employee.com_id': com_id,
        }
        if (ep_id) {
            conditions['idQLC'] = Number(ep_id)
        }
        const user = await Users.aggregate([{
                $match: conditions,
            },
            {
                $sort: { userName: -1 },
            },
            {
                $lookup: {
                    from: 'QLC_OrganizeDetail',
                    localField: 'inForPerson.employee.organizeDetailId',
                    foreignField: 'id',
                    pipeline: [{
                        $match: {
                            comId: com_id,
                        },
                    }, ],
                    as: 'organizeDetail',
                },
            },
            {
                $lookup: {
                    from: 'QLC_Positions',
                    localField: 'inForPerson.employee.position_id',
                    foreignField: 'id',
                    pipeline: [{
                        $match: {
                            comId: com_id,
                        },
                    }, ],
                    as: 'position',
                },
            },
            {
                $unwind: {
                    path: '$organizeDetail',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: {
                    path: '$position',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    ep_id: '$idQLC',
                    ep_email: '$email',
                    ep_phone: '$phone',
                    ep_name: '$userName',
                    ep_image: '$avatarUser',
                    role_id: '$role',
                    position_id: '$inForPerson.employee.position_id',
                    positionName: '$position.positionName',
                    com_id: '$inForPerson.employee.com_id',
                    listOrganizeDetailId: '$inForPerson.employee.listOrganizeDetailId',
                    organizeDetailId: '$inForPerson.employee.organizeDetailId',
                    organizeDetailName: '$organizeDetail.organizeDetailName',
                },
            },
        ])
        return functions.success(res, 'Get user by organize success!', {
            user: user,
        })
    } catch (error) {
        return functions.setError(res, err.message)
    }
}
exports.topMangersInOrganize = async(req, res) => {
    try {
        const comId = req.body.comId
        const listOrganizeDetailId = JSON.parse(req.body.listOrganizeDetailId)
        const data = []
        const listUsers = []
        while (listOrganizeDetailId.length > 0) {
            const a = [...listOrganizeDetailId]
            data.push(a)
            listOrganizeDetailId.pop()
        }
        await Promise.all(
            data.map(async(value, index) => {
                const manager = await Users.aggregate([{
                        $match: {
                            'inForPerson.employee.com_id': Number(comId),
                            'inForPerson.employee.listOrganizeDetailId': {
                                $all: value,
                            },
                            'inForPerson.employee.ep_status': 'Active',
                        },
                    },
                    {
                        $lookup: {
                            from: 'QLC_Positions',
                            localField: 'inForPerson.employee.position_id',
                            foreignField: 'id',
                            pipeline: [{
                                $match: {
                                    comId: Number(comId),
                                },
                            }, ],
                            as: 'positions',
                        },
                    },
                    {
                        $unwind: '$positions',
                    },
                    {
                        $sort: {
                            'positions.level': 1,
                        },
                    },
                    {
                        $limit: 2,
                    },
                    {
                        $project: {
                            _id: 0,
                            userName: 1,
                            idQLC: 1,
                            position_id: '$inForPerson.employee.position_id',
                        },
                    },
                ])
                if (manager && Number(manager.length) === 2) {
                    if (
                        Number(manager[0].position_id) !== Number(manager[1].position_id)
                    ) {
                        listUsers.push({
                            userName: manager[0].userName,
                            idQLC: manager[0].idQLC,
                        })
                    }
                } else if (manager && Number(manager.length) === 1) {
                    listUsers.push({
                        userName: manager[0].userName,
                        idQLC: manager[0].idQLC,
                    })
                }
            })
        )
        return res.status(200).json({ listUsers })
    } catch (error) {
        console.log('error', error)
        return functions.setError(res, error.message)
    }
}
exports.listTaiSan = async(req, res) => {
    try {
        const com_id = req.user.data.com_id
        const taisan = await TaiSan.aggregate([{
                $match: {
                    id_cty: com_id,
                    ts_da_xoa: 0,
                },
            },
            {
                $sort: { ts_id: -1 },
            },
            {
                $project: {
                    ts_id: '$ts_id',
                    ts_ten: '$ts_ten',
                    so_luong_con_lai: '$ts_so_luong',
                },
            },
        ])
        return res.status(200).json({ data: taisan })
    } catch (error) {
        console.log('error', error)
        return functions.setError(res, error)
    }
}
exports.listProjects = async(req, res) => {
    try {
        const com_id = req.user.data.com_id
        const idQLC = req.user.data.idQLC
        const { type } = req.body
            //available projects
        if (type === 0) {
            const projects = await Project.find({
                com_id: com_id,
                type: 0,
                project_type: 0,
                open_or_close: 1,
                is_delete: 0,
                project_member: {
                    $not: {
                        $regex: idQLC.toString(),
                    },
                },
            }).lean()
            const projectWithEndTime = projects.map((pj) => {
                const date = pj.date_end.split('-')
                const formattedDateWithTime = `${date[2]}-${date[1]}-${date[0]}T${pj.time_out}`
                return {
                    ...pj,
                    endTime: formattedDateWithTime,
                }
            })
            const data = projectWithEndTime.filter(
                (pj) => new Date(pj.endTime) > new Date()
            )
            return res.status(200).json({ data })
        }
        //all projects
        else if (type === 1) {
            const data = await Project.find({
                com_id: com_id,
                project_type: 0,
            }).lean()
            return res.status(200).json({ data })
        }
    } catch (error) {
        console.log('error', error)
        return functions.setError(res, error)
    }
}

exports.settingPropose = async(req, res) => {
    try {
        const com_id = req.user.data.com_id
        const dexuat_id = Number(req.body.dexuat_id)
        const settingPropose = await SettingPropose.findOne({
            dexuat_id: dexuat_id,
            comId: com_id,
        }).lean()
        return res.status(200).json({ settingPropose })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error })
    }
}
exports.listTSdaCPchoNV = async(req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const idQLC = req.user.data.idQLC;
        const user = await Users.findOne({
            idQLC: idQLC,
            'inForPerson.employee.com_id': com_id,
            'inForPerson.employee.ep_status': 'Active',
            type: 2,
        })
        const data = await TaiSanDangSuDung.aggregate([{
                $match: {
                    com_id_sd: com_id,
                    id_nv_sd: user._id,
                    sl_dang_sd: { $gt: 0 },
                }
            },
            {
                $lookup: {
                    from: "QLTS_Tai_San",
                    localField: "id_ts_sd",
                    foreignField: "ts_id",
                    as: "infoTS"
                },
            },
            {
                $unwind: '$infoTS'
            },
            {
                $sort: { id_sd: -1 }
            },
            {
                $project: {
                    "capital_name": "$infoTS.ts_ten",
                    "sl_tai_san_con_lai": "$infoTS.ts_so_luong",
                    "id_vi_tri_tai_san": "$infoTS.ts_vi_tri",
                    "Ma_tai_san": "$infoTS.ts_id",
                    "idbb": "$id_sd",
                    com_id_sd: 1,
                    id_nv_sd: 1,
                    id_pb_sd: 1,
                    com_id_sd: 1,
                    sl_dang_sd: 1,
                    day_bd_sd: 1,
                    tinhtrang_ts: 1,
                }
            }
        ])
        return res.status(200).json({ data })
    } catch (error) {
        console.log("error", error)
        return functions.setError(res, error)
    }
}