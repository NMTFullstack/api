const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
const jwt = require('jsonwebtoken');
// const linktb = require('./raoNhanh365/raoNhanh')
const dotenv = require("dotenv");
dotenv.config();
const path = require('path');
const SettingDX = require('../models/Vanthu/setting_dx');
const functions = require('./functions')
const DeXuat = require('../models/Vanthu/de_xuat')
const QuitJob = require('../models/hr/personalChange/QuitJob');
const CalendarWorkEmployee = require('../models/qlc/CalendarWorkEmployee');
const Calendar = require('../models/qlc/Cycle')
const ThuongPhat = require('../../tinhluong/models/Tinhluong/Tinhluong365ThuongPhat');
const HoaHong = require('../models/Tinhluong/TinhluongRose')
const Cycle = require("../models/qlc/Cycle");
const EmployeCycle = require("../models/qlc/CalendarWorkEmployee");
const Shifts = require('../models/qlc/Shifts');
const TinhluongRose = require('../../tinhluong/models/Tinhluong/TinhluongRose');
const TinhluongRdtHistory = require('../../tinhluong/models/Tinhluong/TinhluongRdtHistory');
const BasicSalary = require('../../tinhluong/models/Tinhluong/Tinhluong365SalaryBasic');
const Pregnant = require('../../tinhluong/models/Tinhluong/TinhluongPregnant');
const TLQuitJob = require('../../tinhluong/models/Tinhluong/Tinhluong365QuitJob');
const User = require('../models/Users');
const MeetingRoom = require('../models/giaoviec365/qly_phonghop');
const Meeting = require('../models/giaoviec365/meetings');
const Positions = require('../models/qlc/Positions');
const time_setting_dx = require("../models/Vanthu/time_setting_dx");
const HistoryHandling = require('../models/Vanthu/history_handling_dx');
const OrganizeDetail = require('../models/qlc/OrganizeDetail');
const AdminUser = require('../models/Timviec365/Admin/AdminUser');
const Resign = require('../models/hr/personalChange/Resign');
const EmployeeHistory = require('../models/qlc/EmployeeHistory');
const Appoint = require('../models/hr/personalChange/Appoint');
const TaiSan = require('../models/QuanLyTaiSan/TaiSan');
const capPhat = require('../models/QuanLyTaiSan/CapPhat');
const thongBao = require('../models/QuanLyTaiSan/ThongBao');
const Project = require('../models/giaoviec365/projects');
const SettingConfirm = require('../models/qlc/SettingConfirm');
const SettingPropose = require('../models/qlc/SettingPropose');
const SuaChua = require("../models/QuanLyTaiSan/Sua_chua");
const TaiSanDangSuDung = require('../models/QuanLyTaiSan/TaiSanDangSuDung');
const QuaTrinhSuDung = require("../models/QuanLyTaiSan/QuaTrinhSuDung");

exports.covert = async(checkConvert) => {
    let date = '';
    let moth = '';
    if (checkConvert.getDate() < 10 || checkConvert.getMonth() < 10) {
        date = "0" + checkConvert.getDate()
        moth = "0" + checkConvert.getMonth()
    }
    let year = checkConvert.getFullYear()
    let newdate = year + "-" + moth + "-" + date
    return newdate
}
exports.formatDate = (dateString) => {
    // S? d?ng phuong th?c `replace()` d? thay th? d?u / b?ng d?u -
    return new Date(dateString).toISOString().slice(0, 10);;
}
exports.getDatesFromRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const stopDate = new Date(endDate);
    while (currentDate <= stopDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;

}

// h�m khi th�nh c�ng
exports.success = async(res, messsage = "", data = []) => {
    return res.status(200).json({ data: { result: true, message: messsage, ...data }, error: null, })
};
// h�m th?c thi khi th?t b?i
exports.setError = async(res, message, code = 500) => {
    return res.status(code).json({ code, message })
};
exports.uploadFileVanThu = (id, file) => {
    let path = `../storage/base365/vanthu/tailieu/${id}/`;
    let filePath = `../storage/base365/vanthu/tailieu/${id}/` + file.originalFilename;

    if (!fs.existsSync(path)) { // N?u thu m?c chua t?n t?i th� t?o m?i
        fs.mkdirSync(path, { recursive: true });
    }

    fs.readFile(file.path, (err, data) => {
        if (err) {
            console.log(err)
        }
        fs.writeFile(filePath, data, (err) => {
            if (err) { console.log(err) }
        });
    });
}
exports.createLinkFileVanthu = (id, file) => {
    let link = 'http://210.245.108.202:3001/base365' + `/vanthu/tailieu/${id}/` + file;
    return link;
}
exports.getMaxID = async(model) => {
    const maxUser = await model.findOne({}, {}, { sort: { _id: -1 } }).lean() || 0;
    return maxUser._id + 1;
};
exports.getMaxIDQJ = async(model) => {
    const maxUser = await model.findOne({}, {}, { sort: { id: -1 } }).lean() || 0;
    return maxUser.id + 1;
};
exports.getMaxIDrose = async(model) => {
    const maxUser = await model.findOne({}, {}, { sort: { ro_id: -1 } }).lean() || 0;
    return maxUser.ro_id + 1;
};
exports.getMaxIDtp = async(model) => {
    const maxUser = await model.findOne({}, {}, { sort: { pay_id: -1 } }).lean() || 0;
    return maxUser.pay_id + 1;
};
exports.chat = async(id_user, id_user_duyet, com_id, name_dx, id_user_theo_doi, status, link, file_kem) => {
    await axios.post('http://43.239.223.142:9000/api/V2/Notification/NotificationOfferReceive', {
            SenderId: id_user,
            ListReceive: id_user_duyet,
            CompanyId: com_id,
            Message: name_dx,
            ListFollower: id_user_theo_doi,
            Status: status,
            Link: link,
            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link
        }).then(function(response) {
            // console.log(response)
        })
        .catch(function(error) {
            console.log(error);
        });
    await axios.post('http://210.245.108.202:9000/api/V2/Notification/NotificationOfferReceive', {
            SenderId: id_user,
            ListReceive: id_user_duyet,
            CompanyId: com_id,
            Message: name_dx,
            ListFollower: id_user_theo_doi,
            Status: status,
            Link: link,
            // SenderID :nguoi gui , ListReceive: nguoi duyet , CompanyId, Message: ten de_xuat,ListFollower: nguoi thoe doi,Status,Link
        }).then(function(response) {
            // console.log(response)
        })
        .catch(function(error) {
            console.log(error);
        });
    return 1
};
exports.chatNotification = async(id_user, receiver_id, com_id, message, link) => {
    try {
        let sender;
        let receiver;
        const senderUser = await User.findOne({
            idQLC: id_user,
            'inForPerson.employee.com_id': com_id,
            type: 2,
        });
        if (senderUser) {
            sender = senderUser;
        } else {
            sender = await User.findOne({
                idQLC: id_user,
                type: 1,
            });
        }
        const receiverUser = await User.findOne({
            idQLC: receiver_id,
            'inForPerson.employee.com_id': com_id,
            type: 2,
        })
        if (receiverUser) {
            receiver = receiverUser
        } else {
            receiver = await User.findOne({
                idQLC: receiver_id,
                type: 1,
            });
        }
        await axios.post('http://210.245.108.202:9000/api/message/SendMessageIdChat', {
                SenderID: sender._id,
                UserID: receiver._id,
                MessageType: 'OfferReceive',
                Message: message,
                Link: link,
            }).then(function(response) {
                // console.log(response)
            })
            .catch(function(error) {
                console.log(error);
            });
    } catch (error) {
        console.log(error);
    }
};
exports.uploadFileNameRandom = async(folder, file_img) => {
    let filename = '';
    const time_created = Date.now();
    const date = new Date(time_created);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    const dir = `../storage/base365/vanthu/uploads/${folder}/${year}/${month}/${day}/`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    filename = `${file_img.originalFilename}`.replace(/,/g, '');
    const filePath = dir + filename;
    filename = filename + ',';

    fs.readFile(file_img.path, (err, data) => {
        if (err) {
            console.log(err)
        }
        fs.writeFile(filePath, data, (err) => {
            if (err) {
                console.log(err)
            }
        });
    });
    return filename;
}
exports.getLinkFile = (folder, time, fileName) => {
    let date = new Date(time * 1000);
    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    let link = process.env.DOMAIN_VAN_THU + `/base365/vanthu/uploads/${folder}/${y}/${m}/${d}/`;
    let res = '';

    let arrFile = fileName.split(',').slice(0, -1);
    for (let i = 0; i < arrFile.length; i++) {
        if (res == '') res = `${link}${arrFile[i]}`
        else res = `${res}, ${link}${arrFile[i]}`
    }
    return res;
}
exports.getMaxId = async(model) => {
    let maxId = await model.findOne({}, { _id: 1 }).sort({ _id: -1 }).limit(1).lean();
    if (maxId) {
        maxId = Number(maxId._id) + 1;
    } else maxId = 1;
    return maxId;
}
exports.sendChat = async(link, data) => {
    return await axios
        .post(link, data)
        .then(response => {
            // X? l� ph?n h?i t? server
        })
        .catch(error => {
            console.error(error);
            // X? l� l?i
        });
}
exports.checkToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Missing token" });
        }
        jwt.verify(token, process.env.NODE_SERCET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: "Invalid token" });
            }
            let infoUser = user.data;
            if (!infoUser || !infoUser.type || !infoUser.idQLC || !infoUser.userName || !infoUser.com_id) {
                return res.status(404).json({ message: "Token missing info!" });
            }
            req.id = infoUser.idQLC;
            req.comId = infoUser.com_id;
            req.userName = infoUser.userName;
            req.type = infoUser.type;
            next();
        });
    } catch (err) {
        console.log(err);
        return res.status(503).json({ message: "Error from server!" });
    }

}
exports.arrAPI = () => {
    return {
        'NotificationOfferReceive': "http://43.239.223.142:9000/api/V2/Notification/NotificationOfferReceive",
        'NotificationOfferSent': "http://43.239.223.142:9000/api/V2/Notification/NotificationOfferSent",
        "NotificationReport": "http://43.239.223.142:9000/api/V2/Notification/NotificationReport",
        "SendContractFile": "http://43.239.223.142:9000/api/V2/Notification/SendContractFile"
    }
}
exports.replaceTitle = (title) => {
    // H�m replaceTitle() l� h�m t�y ch?nh c?a b?n d? thay th? c�c k� t? kh�ng h?p l? trong ti�u d?
    // H�y thay th? n� b?ng c�ch x? l� ph� h?p v?i y�u c?u c?a b?n
    return title.replace(/[^a-zA-Z0-9]/g, '-');
};
exports.uploadfile = async(folder, file_img, time) => {
    let filename = '';
    const date = new Date(time);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const timestamp = Math.round(date.getTime() / 1000);

    const dir = `../storage/base365/vanthu/uploads/${folder}/${year}/${month}/${day}/`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    filename = `${timestamp}-tin-${file_img.originalFilename}`.replace(/,/g, '');
    const filePath = dir + filename;
    filename = filename + ',';
    fs.readFile(file_img.path, (err, data) => {
        if (err) {
            console.log(err)
        }
        fs.writeFile(filePath, data, (err) => {
            if (err) {
                console.log(err)
            }
        });
    });
    return filename;
}
exports.deleteFile = (file) => {
    let namefile = file.replace(`${process.env.DOMAIN_VAN_THU}/base365/vanthu/uploads/`, '');
    let filePath = '../storage/base365/vanthu/uploads/' + namefile;
    fs.unlink(filePath, (err) => {
        if (err) console.log(err);
    });
}
exports.convertTimestamp = (date) => {
    let time = new Date(date);
    return Math.round(time.getTime());
}
exports.convertDate = (timestamp) => {
    return new Date(timestamp * 1000);
}

// duyệt đề xuất
exports.browseProposals = async(res, His_Handle, De_Xuat, _id, check, id_user, com_id, idUserBanGiao, assetFixForm, _id_user) => {
    try {
        const listDxIdCtyDuyet = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 17, 18, 19, 20]
            //Khi cần công ty duyệt
        if (check.type_duyet === 11 && id_user === com_id) {
            //Lịch làm việc
            if (check.type_dx === 18) {
                try {
                    const ep_id = check.id_user;
                    const llv = check.noi_dung.lich_lam_viec ? check.noi_dung.lich_lam_viec.ngay_lam_viec : null;
                    const llvData = JSON.parse(llv)[0] ? JSON.parse(llv)[0].data : null;
                    const llvToPost = JSON.stringify(llvData);
                    const apply_month = check.noi_dung.lich_lam_viec ? check.noi_dung.lich_lam_viec.thang_ap_dung * 1000 : null;
                    const cy_name = `${check.name_user}-${check.id_user}`;
                    const dx_created_date = check.time_create * 1000;
                    //Lọc ra những llv cần cập nhật thực sự: từ ngày tạo trở đi
                    let true_llv_data;
                    if (llvData.length > 0) {
                        true_llv_data = llvData.filter(llv => Date.parse(llv.date) > dx_created_date)
                    }
                    //Nếu data không rỗng
                    if (llvToPost && apply_month && cy_name) {
                        //Tìm lịch làm việc của nhân viên
                        const emp_cycle = await EmployeCycle.find({ ep_id: ep_id }, { cy_id: 1, epcy_id: 1 });
                        let cycle_this_month;
                        if (emp_cycle && emp_cycle.length > 0) {
                            for (let i = 0; i < emp_cycle.length; i++) {
                                //Tìm ra llv cá nhân ứng với tháng tạo và công ty của người tạo
                                const cycle = await Cycle.findOne({ cy_id: emp_cycle[i] ? emp_cycle[i].cy_id : null, com_id: check.com_id, is_personal: 1 })
                                if (cycle) {
                                    //Lấy ra tháng và năm của lịch làm việc đó
                                    const cycle_apply_month = cycle.apply_month
                                    const cycle_apply_month_date = new Date(cycle_apply_month);
                                    const cycle_apply_month_date_year = cycle_apply_month_date.getFullYear();
                                    const cycle_apply_month_date_month = cycle_apply_month_date.getMonth() + 1;
                                    //Lấy ra tháng và năm của ngày áp dụng llv trên đề xuất
                                    const apply_month_date = new Date(apply_month);
                                    const apply_month_date_year = apply_month_date.getFullYear();
                                    const apply_month_date_month = apply_month_date.getMonth() + 1;
                                    //Nếu có lịch làm việc có trùng ngày và năm của nhân viên đó thì cho thêm vào llv đã tồn tại
                                    if (cycle_apply_month_date_year === apply_month_date_year &&
                                        cycle_apply_month_date_month === apply_month_date_month) {
                                        //Nếu tồn tại llv chung, xóa nó đi
                                        // if (cycle.is_personal === 0) {
                                        //     return res.status(200).json({ message: 'Nhân viên đã có tên trong một lịch làm việc chung của công ty'});
                                        //     let cy_detail_object = JSON.parse(cycle.cy_detail);
                                        //     if(cy_detail_object.length > 0){
                                        //         cy_detail_object = cy_detail_object.map(cdo => {
                                        //             const matchingDate = true_llv_data.find((tld) => tld.date === cdo.date);
                                        //             if (matchingDate) {
                                        //                 return { ...cdo, shift_id: matchingDate.shift_id };
                                        //             }
                                        //             return cdo;
                                        //         })
                                        //     }
                                        //     true_llv_data = cy_detail_object;
                                        //     await EmployeCycle.deleteOne({ epcy_id: emp_cycle[i] ? emp_cycle[i].epcy_id : null })
                                        // } else {
                                        //     cycle_this_month = cycle
                                        // }
                                        cycle_this_month = cycle
                                    }
                                }
                            }
                        }
                        //Nếu đã có sẵn llv cho tháng áp dụng: cập nhật llv đó
                        if (cycle_this_month) {
                            //Lấy ra chi tiết llv
                            const cy_detail = cycle_this_month.cy_detail;
                            if (cy_detail && true_llv_data) {
                                let cy_detail_object = JSON.parse(cy_detail)
                                if (cy_detail_object.length > 0) {
                                    //Tìm ra những ngày trùng lặp trong llv cũ và llv mới để thay thế shift_id từ llv mới sang llv cũ
                                    cy_detail_object = cy_detail_object.map(cdo => {
                                        const matchingDate = true_llv_data.find((tld) => tld.date === cdo.date);
                                        if (matchingDate) {
                                            return {...cdo, shift_id: matchingDate.shift_id };
                                        }
                                        //Nếu không thì giữ nguyên
                                        return cdo;
                                    })
                                }
                                //Thêm những ngày trong llv mới vào llv cũ mà llv cũ ko có
                                if (true_llv_data.length > 0) {
                                    true_llv_data.forEach((tld) => {
                                        const existingDate = cy_detail_object.find((cdo) => cdo.date === tld.date);
                                        if (!existingDate) {
                                            cy_detail_object.push({...tld });
                                        }
                                    });
                                }
                                //Sắp xếp lại ngày tháng trong llv cũ
                                cy_detail_object = cy_detail_object.sort((a, b) => {
                                    const dateA = new Date(a.date);
                                    const dateB = new Date(b.date);
                                    return dateA - dateB;
                                });
                                //Cập nhật llv
                                const updatedLlv = await Cycle.findOneAndUpdate({
                                    cy_id: cycle_this_month.cy_id
                                }, {
                                    $set: {
                                        cy_name: cy_name,
                                        cy_detail: JSON.stringify(cy_detail_object)
                                    }
                                }, {
                                    new: true
                                })
                                const updateEmpLlv = await EmployeCycle.findOneAndUpdate({
                                    ep_id: ep_id,
                                    cy_id: cycle_this_month.cy_id,
                                }, {
                                    $set: {
                                        update_time: Date.now(),
                                    }
                                }, {
                                    new: true
                                })
                                if (updatedLlv && updateEmpLlv) {
                                    let timeNow = new Date();
                                    const maxID = await this.getMaxID(His_Handle);
                                    let newID = 0;
                                    if (maxID) {
                                        newID = Number(maxID) + 1;
                                    }
                                    const createHis = new His_Handle({
                                        _id: newID,
                                        id_user: id_user,
                                        id_dx: check._id,
                                        type_handling: 2,
                                        time: timeNow
                                    });
                                    await createHis.save();
                                    await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                        $set: {
                                            type_duyet: 5,
                                            time_duyet: timeNow
                                        }
                                    }, { new: true });
                                    this.cron_lock_admin(_id, com_id, id_user);
                                    this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                                    return res.status(200).json({ message: 'Cập nhật lịch làm việc của nhân viên thành công', data: updatedLlv });
                                } else {
                                    return functions.setError(res, "Lỗi khi cập nhật lịch làm việc của nhân viên");
                                }
                            } else {
                                return functions.setError(res, "Lịch làm việc đã bị mất nội dung");
                            }
                        } //Nếu ko có sẵn llv cho tháng áp dụng: tạo mới llv
                        else {
                            // Tạo mới
                            const calendar_max = await Cycle.findOne({}, { cy_id: 1 }).sort({ cy_id: -1 }).lean();
                            // Create a JavaScript Date object
                            const inputDate = new Date(apply_month);
                            // Subtract one day
                            inputDate.setDate(inputDate.getDate() - 1);
                            // Set the time to 17:00:00
                            inputDate.setUTCHours(17, 0, 0, 0);
                            const calendar = new Cycle({
                                cy_id: Number(calendar_max.cy_id) + 1,
                                com_id: com_id,
                                cy_name: cy_name,
                                apply_month: inputDate,
                                cy_detail: llvToPost,
                                is_personal: 1,
                            })
                            await calendar.save();
                            //Tìm ra llv vừa tạo mới
                            const newCalender = await Cycle.findOne({ cy_id: Number(calendar_max.cy_id) + 1 })
                            const max = await EmployeCycle.findOne({}, { epcy_id: 1 }).sort({ epcy_id: -1 }).lean();
                            //Thêm nhân viên tạo đx vào llv mới
                            const item = new EmployeCycle({
                                epcy_id: Number(max.epcy_id) + 1,
                                ep_id: ep_id,
                                cy_id: newCalender.cy_id,
                                update_time: Date.now(),
                            });
                            await item.save();
                            if (item) {
                                let timeNow = new Date();
                                const maxID = await this.getMaxID(His_Handle);
                                let newID = 0;
                                if (maxID) {
                                    newID = Number(maxID) + 1;
                                }
                                const createHis = new His_Handle({
                                    _id: newID,
                                    id_user: id_user,
                                    id_dx: check._id,
                                    type_handling: 2,
                                    time: timeNow
                                });
                                await createHis.save();
                                await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                    $set: {
                                        type_duyet: 5,
                                        time_duyet: timeNow
                                    }
                                }, { new: true });
                                const data = {
                                    emp: item,
                                    com: calendar
                                }
                                this.cron_lock_admin(_id, com_id, id_user);
                                this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                                return res.status(200).json({ message: 'Thêm mới lịch làm việc của nhân viên thành công', data: data });
                            } else {
                                return functions.setError(res, "Lỗi khi tạo lịch làm việc nhân viên mới");
                            }
                        }
                    } else {
                        return functions.setError(res, "Thông tin truyền lên không đầy đủ");
                    }

                } catch (err) {
                    console.log(err);
                    return functions.setError(res, err);
                }
            }
            //Nghỉ việc
            if (check.type_dx === 5) {
                try {
                    const nd = check.noi_dung.thoi_viec
                    let employee = await User.findOne({ idQLC: check.id_user, type: { $ne: 1 } });
                    const updateUser = await User.findOneAndUpdate({
                        idQLC: check.id_user,
                        'inForPerson.employee.com_id': com_id,
                    }, {
                        $set: {
                            'inForPerson.employee.com_id': 0,
                            type: 0,
                            'inForPerson.employee.ep_status': 'Deny',
                            position_id: 0,
                            dep_id: 0,
                            'inForPerson.employee.organizeDetailId': 0,
                            'inForPerson.employee.listOrganizeDetailId': [],
                            'inForPerson.employee.time_quit_job': Math.round(new Date(nd.ngaybatdau_tv).getTime() / 1000)
                        }
                    }, { new: true })
                    let fieldsResign = {
                        ep_id: check.id_user,
                        com_id: com_id,
                        created_at: new Date(),
                        note: nd.ly_do,
                        shift_id: nd.ca_bdnghi,
                        type: 2
                    }
                    let resign = await Resign.findOne({ ep_id: check.id_user, com_id: com_id });
                    if (!resign) {
                        let maxIdResign = await functions.getMaxIdByField(Resign, 'id');
                        fieldsResign.id = maxIdResign;
                    }
                    resign = await Resign.findOneAndUpdate({ ep_id: check.id_user, com_id: com_id }, fieldsResign, { new: true, upsert: true });
                    let employee_hs
                    if (resign) {
                        employee_hs = await EmployeeHistory.findOne({ hs_ep_id: check.id_user, hs_com_id: com_id });
                        let hs_time_end = new Date();
                        let hs_time_start = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.start_working_time : 0;
                        let hs_organizeDetailId = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.organizeDetailId : 0;
                        let hs_listOrganizeDetailId = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.listOrganizeDetailId : [];
                        let hs_position_id = (employee.inForPerson && employee.inForPerson.employee) ? employee.inForPerson.employee.position_id : 0;
                        let resign = await Resign.findOne({ ep_id: check.id_user, com_id: com_id });
                        let hs_resign_id = 0;
                        if (resign) hs_resign_id = resign.id;
                        if (employee_hs) {
                            employee_hs = await EmployeeHistory.updateOne({ ep_id: check.id_user, com_id: com_id }, {
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
                                hs_ep_id: check.id_user,
                                hs_time_end,
                                hs_time_start,
                                hs_organizeDetailId,
                                hs_listOrganizeDetailId,
                                hs_position_id,
                                hs_resign_id
                            });
                            employee_hs = await employee_hs.save();
                        }
                    }
                    if (updateUser && resign && employee_hs) {
                        let timeNow = new Date();
                        const maxID = await this.getMaxID(His_Handle);
                        let newID = 0;
                        if (maxID) {
                            newID = Number(maxID) + 1;
                        }
                        const createHis = new His_Handle({
                            _id: newID,
                            id_user: id_user,
                            id_dx: check._id,
                            type_handling: 2,
                            time: timeNow
                        });
                        await createHis.save();
                        await De_Xuat.findOneAndUpdate({ _id: _id }, {
                            $set: {
                                type_duyet: 5,
                                time_duyet: timeNow
                            }
                        }, { new: true });
                        this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                        return res.status(200).json({ message: 'Duyệt đề xuất nghỉ việc thành công', data: { updateUser, resign, employee_hs } });
                    } else {
                        return functions.setError(res, "Thông tin truyền lên không đầy đủ");
                    }
                } catch (e) {
                    console.log(e);
                    return functions.setError(res, e);
                }
            }
            //Tăng ca
            else if (check.type_dx === 10) {
                try {
                    const nd = check.noi_dung.tang_ca;
                    const ep_id = Number(check.id_user);
                    const apply_day = nd.time_tc
                    const emp_cycle = await EmployeCycle.find({ ep_id: ep_id }, { cy_id: 1, epcy_id: 1 });

                    let cycle_this_month;
                    if (emp_cycle && emp_cycle.length > 0) {
                        for (let i = 0; i < emp_cycle.length; i++) {
                            const cycle = await Cycle.findOne({ cy_id: emp_cycle[i] ? emp_cycle[i].cy_id : null, com_id: check.com_id });
                            if (cycle) {
                                //Lấy ra tháng và năm của lịch làm việc đó
                                const cycle_apply_month = cycle.apply_month
                                const cycle_apply_month_date = new Date(cycle_apply_month);
                                const cycle_apply_month_date_year = cycle_apply_month_date.getFullYear();
                                const cycle_apply_month_date_month = cycle_apply_month_date.getMonth() + 1;
                                //Lấy ra tháng và năm của ngày áp dụng llv trên đề xuất
                                const apply_month_date = new Date(apply_day);
                                const apply_month_date_year = apply_month_date.getFullYear();
                                const apply_month_date_month = apply_month_date.getMonth() + 1;
                                if (cycle_apply_month_date_year === apply_month_date_year &&
                                    cycle_apply_month_date_month === apply_month_date_month) {
                                    cycle_this_month = cycle
                                }
                            }
                        }
                    } else {
                        return res.status(200).json({ message: "Nhân viên chưa có lịch làm việc nào" });

                    }
                    if (cycle_this_month) {
                        const cy_detail = cycle_this_month.cy_detail;
                        const isPersonal = cycle_this_month.is_personal
                        if (cy_detail) {
                            let cy_detail_object = JSON.parse(cy_detail)
                            const appyly_day_string = new Date(apply_day).toISOString().slice(0, 10);
                            cy_detail_object = cy_detail_object.map(cy => {
                                if (cy.date === appyly_day_string) {
                                    return {
                                        ...cy,
                                        shift_id: `${cy.shift_id},${nd.shift_id}`,
                                    }
                                }
                                return cy
                            })

                            //llv ca nhan
                            if (isPersonal === 1) {
                                const updatedLlv = await Cycle.findOneAndUpdate({
                                    cy_id: cycle_this_month.cy_id
                                }, {
                                    $set: {
                                        cy_detail: JSON.stringify(cy_detail_object)
                                    }
                                }, {
                                    new: true
                                })
                                if (updatedLlv) {
                                    let timeNow = new Date();
                                    const maxID = await this.getMaxID(His_Handle);
                                    let newID = 0;
                                    if (maxID) {
                                        newID = Number(maxID) + 1;
                                    }
                                    const createHis = new His_Handle({
                                        _id: newID,
                                        id_user: id_user,
                                        id_dx: check._id,
                                        type_handling: 2,
                                        time: timeNow
                                    });
                                    await createHis.save();
                                    await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                        $set: {
                                            type_duyet: 5,
                                            time_duyet: timeNow
                                        }
                                    }, { new: true });
                                    this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                                    return res.status(200).json({ message: 'Duyệt đề xuất tăng ca thành công', data: updatedLlv });
                                } else {
                                    return res.status(200).json({ message: "Lỗi khi duyệt đề xuất tăng ca" });
                                }
                            }
                            // nv làm full - tien long
                            else if (isPersonal === 0 || !isPersonal) {
                                // tao llv mới cho nv đó -> có thêm ca tăng
                                const maxid = await Cycle.aggregate([{
                                        $sort: {
                                            cy_id: -1
                                        }
                                    },
                                    {
                                        $limit: 1
                                    },
                                    {
                                        $project: {
                                            cy_id: 1
                                        }
                                    }
                                ])

                                const idLatest = Number(maxid[0].cy_id) + 1
                                const newCycle = new Cycle({
                                    cy_id: idLatest,
                                    cy_name: `${check.id_user} - ${check.name_user}`,
                                    is_personal: 1,
                                    com_id: Number(check.com_id),
                                    status: 1,
                                    apply_month: cycle_this_month.apply_month,
                                    cy_detail: JSON.stringify(cy_detail_object)
                                })

                                await newCycle.save()

                                // them epcy
                                const maxidEpcy = await EmployeCycle.aggregate([{
                                        $sort: {
                                            epcy_id: -1
                                        }
                                    },
                                    {
                                        $limit: 1
                                    },
                                    {
                                        $project: {
                                            epcy_id: 1
                                        }
                                    }
                                ])

                                let timeNow = new Date();
                                const newEpcy = new EmployeCycle({
                                    epcy_id: Number(maxidEpcy[0].epcy_id),
                                    ep_id: Number(check.id_user),
                                    cy_id: idLatest,
                                    update_time: timeNow
                                })

                                await newEpcy.save()

                                // Xóa nhân viên khỏi llv cũ
                                await EmployeCycle.findOneAndDelete({ epcy_id: emp_cycle[0].epcy_id })


                                // duyệt llv

                                const maxID = await this.getMaxID(His_Handle);
                                let newID = 0;
                                if (maxID) {
                                    newID = Number(maxID) + 1;
                                }
                                const createHis = new His_Handle({
                                    _id: newID,
                                    id_user: id_user,
                                    id_dx: check._id,
                                    type_handling: 2,
                                    time: timeNow
                                });
                                await createHis.save();
                                await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                    $set: {
                                        type_duyet: 5,
                                        time_duyet: timeNow
                                    }
                                }, { new: true });
                                this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                                return res.status(200).json({ message: 'Duyệt đề xuất tăng ca thành công', data: updatedLlv });
                            }
                        } else {
                            return functions.setError(res, "Lịch làm việc đã mất nội dung chi tiết");
                        }
                    } else {
                        return functions.setError(res, "Nhân viên không có lịch làm việc cá nhân trong tháng này");
                    }
                } catch (e) {
                    console.log(e);
                    return functions.setError(res, e.message);
                }
            }
            //Thưởng phạt
            else if (check.type_dx === 19) {
                try {
                    let id_eptp = '';
                    const ndtp = check.noi_dung.thuong_phat
                    if (ndtp.type == 1) {
                        id_eptp = check.id_user;
                    } else {
                        id_eptp = ndtp.nguoi_tp
                    }
                    let max = await ThuongPhat.findOne({}, {}, { sort: { pay_id: -1 } }).lean() || 0;
                    let max_id
                    if (!max) {
                        max_id = 0
                    } else {
                        max_id = max.pay_id;
                    }
                    const date_tp = new Date(ndtp.time_tp);
                    const createTP = new ThuongPhat({
                        pay_id: max_id + 1,
                        pay_id_user: check.id_user,
                        pay_id_com: check.com_id,
                        pay_price: ndtp.so_tien_tp,
                        pay_status: ndtp.type_tp,
                        pay_case: ndtp.ly_do,
                        pay_day: ndtp.time_tp,
                        pay_month: date_tp.getMonth() + 1,
                        pay_year: date_tp.getFullYear(),
                    });
                    await createTP.save();
                    if (createTP) {
                        let timeNow = new Date();
                        const maxID = await this.getMaxID(His_Handle);
                        let newID = 0;
                        if (maxID) {
                            newID = Number(maxID) + 1;
                        }
                        const createHis = new His_Handle({
                            _id: newID,
                            id_user: id_user,
                            id_dx: check._id,
                            type_handling: 2,
                            time: timeNow
                        });
                        await createHis.save();
                        await De_Xuat.findOneAndUpdate({ _id: _id }, {
                            $set: {
                                type_duyet: 5,
                                time_duyet: timeNow
                            }
                        }, { new: true });
                        this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                        return res.status(200).json({ message: 'Duyệt đề xuất thưởng phạt thành công', data: createTP });
                    } else {
                        return functions.setError(res, "Thông tin truyền lên không đầy đủ");
                    }
                } catch (err) {
                    console.log(err)
                    return functions.setError(res, err);
                }
            }
            //Hoa hồng
            else if (check.type_dx === 20) {
                try {
                    let id_ephh = check.id_user
                    const ndhh = check.noi_dung.hoa_hong;
                    let max_id;
                    let max = await TinhluongRose.findOne({}, {}, { sort: { ro_id: -1 } }).lean() || 0;
                    if (!max) {
                        max_id = 0
                    } else {
                        max_id = max.ro_id;
                    }
                    const ro_time = new Date(ndhh.chu_ky + '-01T00:00:00.000Z');
                    const createhh = new TinhluongRose({
                        ro_id: max_id + 1,
                        ro_id_user: id_ephh,
                        ro_id_com: check.com_id,
                        ro_id_lr: 2,
                        ro_id_tl: ndhh.name_dt,
                        ro_time: ro_time.toISOString(),
                        ro_note: ndhh.ly_do,
                        ro_price: ndhh.dt_money,
                    })
                    await createhh.save();

                    let dt_id = 0;
                    let maxId2 = await TinhluongRdtHistory.find({}, { dt_id: 1 }).sort({ dt_id: -1 }).limit(1);
                    if (maxId2 && maxId2.length) {
                        dt_id = maxId2[0].dt_id;
                    }
                    dt_id = dt_id + 1;
                    let dt_rose_id = max_id;
                    const dt_time = new Date(ndhh.item_mdt_date)
                    const createRdt = new TinhluongRdtHistory({
                        dt_id: dt_id,
                        dt_rose_id: dt_rose_id,
                        dt_money: ndhh.dt_money,
                        dt_time: dt_time / 1000,
                    })
                    await createRdt.save();

                    if (createhh && createRdt) {
                        let timeNow = new Date();
                        const maxID = await this.getMaxID(His_Handle);
                        let newID = 0;
                        if (maxID) {
                            newID = Number(maxID) + 1;
                        }
                        const createHis = new His_Handle({
                            _id: newID,
                            id_user: id_user,
                            id_dx: check._id,
                            type_handling: 2,
                            time: timeNow
                        });
                        await createHis.save();
                        await De_Xuat.findOneAndUpdate({ _id: _id }, {
                            $set: {
                                type_duyet: 5,
                                time_duyet: timeNow
                            }
                        }, { new: true });
                        this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                        res.status(200).json({ message: 'Duyệt đề xuất hoa hồng thành công', hh: createhh, dt: createRdt });
                    } else {
                        return functions.setError(res, "Thông tin truyền lên không đầy đủ");
                    }
                } catch (err) {
                    console.log(err);
                    return functions.setError(res, err);
                }
            }
            //Đề xuất bổ nhiệm
            else if (check.type_dx === 7) {
                const nd = check.noi_dung.bo_nhiem
                const idUserBoNhiem = nd.thanhviendc_bn;
                const cocau = await OrganizeDetail.findOne({
                    id: Number(nd.new_organizeDetailId),
                    comId: com_id,
                }).lean();
                if (cocau) {
                    const employee = await User.findOne({
                        idQLC: idUserBoNhiem,
                        'inForPerson.employee.com_id': com_id,
                        type: 2
                    })
                    const user = await User.findOneAndUpdate({
                        idQLC: idUserBoNhiem,
                        'inForPerson.employee.com_id': com_id,
                        type: 2
                    }, {
                        $set: {
                            'inForPerson.employee.listOrganizeDetailId': cocau.listOrganizeDetailId,
                            'inForPerson.employee.organizeDetailId': cocau.id,
                            'inForPerson.employee.position_id': Number(nd.chucvu_dx_bn),
                        }
                    }, { new: true })
                    let newData
                    if (user) {
                        let fields = {
                            ep_id: idUserBoNhiem,
                            com_id: com_id,
                            current_position_id: employee.inForPerson.employee.position_id,
                            current_organizeDetailId: employee.inForPerson.employee.organizeDetailId,
                            current_listOrganizeDetailId: employee.inForPerson.employee.listOrganizeDetailId,
                            created_at: new Date(),
                            note: nd.ly_do
                        }
                        let check = await Appoint.findOne({ ep_id: idUserBoNhiem, com_id: com_id });
                        if (!check) {
                            let newIdAppoint = await functions.getMaxIdByField(Appoint, 'id');
                            newData = new Appoint({
                                id: newIdAppoint,
                                ...fields
                            })
                            await newData.save()
                        } else {
                            newData = await Appoint.findOneAndUpdate({
                                ep_id: idUserBoNhiem,
                                com_id: com_id,
                            }, {
                                $set: fields
                            })
                        }
                    }
                    let timeNow = new Date();
                    const maxID = await this.getMaxID(His_Handle);
                    let newID = 0;
                    if (maxID) {
                        newID = Number(maxID) + 1;
                    }
                    const createHis = new His_Handle({
                        _id: newID,
                        id_user: id_user,
                        id_dx: check._id,
                        type_handling: 2,
                        time: timeNow
                    });
                    await createHis.save();
                    await De_Xuat.findOneAndUpdate({ _id: _id }, {
                        $set: {
                            type_duyet: 5,
                            time_duyet: timeNow
                        }
                    }, { new: true });
                    this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                    return res.status(200).json({ message: 'Duyệt đề xuất bổ nhiệm thành công', data: { user, newData } });
                } else {
                    return res.status(200).json({ message: 'Không tìm thấy cơ cấu' });
                }
            }
            //Đề xuất luân chuyển công tác
            else if (check.type_dx === 8) {
                const nd = check.noi_dung.luan_chuyen_cong_tac
                const idUserBoNhiem = check.id_user;
                const cocau = await OrganizeDetail.findOne({
                    id: Number(nd.noi_chuyen_den),
                    comId: com_id,
                }).lean();
                if (cocau) {
                    const employee = await User.findOne({
                        idQLC: idUserBoNhiem,
                        'inForPerson.employee.com_id': com_id,
                        type: 2
                    })
                    const user = await User.findOneAndUpdate({
                        idQLC: idUserBoNhiem,
                        'inForPerson.employee.com_id': com_id,
                        type: 2
                    }, {
                        $set: {
                            'inForPerson.employee.listOrganizeDetailId': cocau.listOrganizeDetailId,
                            'inForPerson.employee.organizeDetailId': cocau.id,
                        }
                    }, { new: true })
                    let newData
                    if (user) {
                        let fields = {
                            ep_id: idUserBoNhiem,
                            com_id: com_id,
                            current_position_id: employee.inForPerson.employee.position_id,
                            current_organizeDetailId: employee.inForPerson.employee.organizeDetailId,
                            current_listOrganizeDetailId: employee.inForPerson.employee.listOrganizeDetailId,
                            created_at: new Date(),
                            note: nd.ly_do
                        }
                        let check = await Appoint.findOne({ ep_id: idUserBoNhiem, com_id: com_id });
                        if (!check) {
                            let newIdAppoint = await functions.getMaxIdByField(Appoint, 'id');
                            newData = new Appoint({
                                id: newIdAppoint,
                                ...fields
                            })
                            await newData.save()
                        } else {
                            newData = await Appoint.findOneAndUpdate({
                                ep_id: idUserBoNhiem,
                                com_id: com_id,
                            }, {
                                $set: fields
                            })
                        }
                    }
                    let timeNow = new Date();
                    const maxID = await this.getMaxID(His_Handle);
                    let newID = 0;
                    if (maxID) {
                        newID = Number(maxID) + 1;
                    }
                    const createHis = new His_Handle({
                        _id: newID,
                        id_user: id_user,
                        id_dx: check._id,
                        type_handling: 2,
                        time: timeNow
                    });
                    await createHis.save();
                    await De_Xuat.findOneAndUpdate({ _id: _id }, {
                        $set: {
                            type_duyet: 5,
                            time_duyet: timeNow
                        }
                    }, { new: true });
                    this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                    return res.status(200).json({ message: 'Duyệt đề xuất luân chuyển công tác thành công', data: { user, newData } });
                } else {
                    return res.status(200).json({ message: 'Không tìm thấy cơ cấu' });
                }
            }
            //Đề xuất tạm ứng
            else if (check.type_dx === 3) {
                let timeNow = new Date();
                const maxID = await this.getMaxID(His_Handle);
                let newID = 0;
                if (maxID) {
                    newID = Number(maxID) + 1;
                }
                const createHis = new His_Handle({
                    _id: newID,
                    id_user: id_user,
                    id_dx: check._id,
                    type_handling: 2,
                    time: timeNow
                });
                await createHis.save();
                await De_Xuat.findOneAndUpdate({ _id: _id }, {
                    $set: {
                        type_duyet: 5,
                        time_duyet: timeNow,
                        tam_ung_status: 1, //Chờ nhân viên xác nhận
                    }
                }, { new: true });
                this.chatNotification(com_id, check.id_user, com_id, 'Bạn đã nhận được tiền tạm ứng \nXin hãy xác nhận', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                return res.status(200).json({ message: 'Duyệt đề xuất tạm ứng thành công. Chờ người nhận tiền xác nhận' });
            }
            //Đề xuất thanh toán
            else if (check.type_dx === 15) {
                let timeNow = new Date();
                const maxID = await this.getMaxID(His_Handle);
                let newID = 0;
                if (maxID) {
                    newID = Number(maxID) + 1;
                }
                const createHis = new His_Handle({
                    _id: newID,
                    id_user: id_user,
                    id_dx: check._id,
                    type_handling: 2,
                    time: timeNow
                });
                await createHis.save();
                await De_Xuat.findOneAndUpdate({ _id: _id }, {
                    $set: {
                        type_duyet: 5,
                        time_duyet: timeNow,
                        thanh_toan_status: 1, //Chờ nhân viên xác nhận
                    }
                }, { new: true });
                this.chatNotification(com_id, check.id_user, com_id, 'Bạn đã nhận được tiền thanh toán \nXin hãy xác nhận', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                return res.status(200).json({ message: 'Duyệt đề xuất thanh toán thành công. Chờ người nhận tiền xác nhận' });
            }
            //Đề xuất tăng lương
            else if (check.type_dx === 6) {
                const nd = check.noi_dung.tang_luong;
                const basic_salary = await BasicSalary.findOne({ sb_id_com: com_id, sb_id_user: check.id_user });
                const applyDate = new Date(nd.date_tang_luong * 1000).toISOString().slice(0, 10);
                let new_basic_salary;
                if (basic_salary) {
                    new_basic_salary = await BasicSalary.findOneAndUpdate({ sb_id: basic_salary.sb_id }, {
                        $set: {
                            sb_salary_basic: nd.mucluong_tang
                        }
                    }, { new: true })
                } else {
                    let max_id;
                    let max = await BasicSalary.findOne({}, {}, { sort: { sb_id: -1 } }).lean() || 0;
                    if (!max) {
                        max_id = 0
                    } else {
                        max_id = max.sb_id;
                    }
                    new_basic_salary = new BasicSalary({
                        sb_id: max_id + 1,
                        sb_id_user: check.id_user,
                        sb_id_com: com_id,
                        sb_salary_basic: nd.mucluong_tang,
                        sb_time_up: applyDate,
                        sb_first: 1,
                        sb_time_created: new Date().toISOString(),
                    })
                    await new_basic_salary.save();
                }
                let timeNow = new Date();
                const maxID = await this.getMaxID(His_Handle);
                let newID = 0;
                if (maxID) {
                    newID = Number(maxID) + 1;
                }
                const createHis = new His_Handle({
                    _id: newID,
                    id_user: id_user,
                    id_dx: check._id,
                    type_handling: 2,
                    time: timeNow
                });
                await createHis.save();
                await De_Xuat.findOneAndUpdate({ _id: _id }, {
                    $set: {
                        type_duyet: 5,
                        time_duyet: timeNow
                    }
                }, { new: true });
                this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                return res.status(200).json({ message: 'Duyệt đề xuất tăng lương thành công. Đã cập nhật lương cơ bản', new_basic_salary });
            }
            //Đề xuất nghỉ thai sản
            else if (check.type_dx === 11) {
                const nd = check.noi_dung.nghi_thai_san
                let max = await Pregnant.findOne({}, {}, { sort: { pay_id: -1 } }).lean() || 0;
                let max_id
                if (!max) {
                    max_id = 0
                } else {
                    max_id = max.pay_id;
                }
                const newPreg = new Pregnant({
                    pay_id: max_id,
                    pay_id_user: check.id_user,
                    pay_id_com: com_id,
                    start_date: nd.ngaybatdau_nghi_ts,
                    end_date: nd.ngayketthuc_nghi_ts
                })
                await newPreg.save()
                if (newPreg) {
                    let timeNow = new Date();
                    const maxID = await this.getMaxID(His_Handle);
                    let newID = 0;
                    if (maxID) {
                        newID = Number(maxID) + 1;
                    }
                    const createHis = new His_Handle({
                        _id: newID,
                        id_user: id_user,
                        id_dx: check._id,
                        type_handling: 2,
                        time: timeNow
                    });
                    await createHis.save();
                    await De_Xuat.findOneAndUpdate({ _id: _id }, {
                        $set: {
                            type_duyet: 5,
                            time_duyet: timeNow
                        }
                    }, { new: true });
                    this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                    return res.status(200).json({ message: 'Duyệt đề xuất nghỉ thai sản thành công', data: newPreg });
                } else {
                    return functions.setError(res, "Thông tin truyền lên không đầy đủ");
                }
            }
            //Đề xuất đổi ca
            else if (check.type_dx === 2) {
                const nd = check.noi_dung.doi_ca
                const dayCanDoi = new Date(nd.ngay_can_doi * 1000)
                const dayMuonDoi = new Date(nd.ngay_muon_doi * 1000)
                const llvCanDoi = await EmployeCycle.aggregate([{
                        $match: {
                            ep_id: check.id_user
                        }
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
                                        $gt: new Date(dayCanDoi.getFullYear(), dayCanDoi.getMonth(), 0),
                                        $lt: new Date(dayCanDoi.getFullYear(), dayCanDoi.getMonth() + 1, 0)
                                    },
                                    is_personal: 1,
                                }
                            }],
                            as: 'Cycle',
                        },
                    },
                    {
                        $unwind: '$Cycle'
                    },
                    {
                        $project: {
                            epcy_id: '$epcy_id',
                            cy_id: '$Cycle.cy_id',
                            cy_detail: '$Cycle.cy_detail',
                            update_time: '$update_time'
                        },
                    }
                ])
                const llvMuonDoi = await EmployeCycle.aggregate([{
                        $match: {
                            ep_id: check.id_user
                        }
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
                                        $gt: new Date(dayMuonDoi.getFullYear(), dayMuonDoi.getMonth(), 0),
                                        $lt: new Date(dayMuonDoi.getFullYear(), dayMuonDoi.getMonth() + 1, 0)
                                    },
                                    is_personal: 1,
                                }
                            }],
                            as: 'Cycle',
                        },
                    },
                    {
                        $unwind: '$Cycle'
                    },
                    {
                        $project: {
                            epcy_id: '$epcy_id',
                            cy_id: '$Cycle.cy_id',
                            cy_detail: '$Cycle.cy_detail',
                            update_time: '$update_time'
                        },
                    }
                ])
                if (llvCanDoi.length == 0) {
                    return res.status(200).json({ message: 'Không tìm thấy lịch làm việc cá nhân của nhân viên ở tháng cần đổi' });
                }
                if (llvMuonDoi.length == 0) {
                    return res.status(200).json({ message: 'Không tìm thấy lịch làm việc cá nhân của nhân viên ở tháng muốn đổi' });
                }
                const cycleCanDoi = JSON.parse(llvCanDoi[0].cy_detail)
                const cycleMuonDoi = JSON.parse(llvMuonDoi[0].cy_detail)
                const llvNgayCanDoi = cycleCanDoi.find(c => c.date == dayCanDoi.toISOString().split('T')[0])
                const llvNgayMuonDoi = cycleMuonDoi.find(c => c.date == dayMuonDoi.toISOString().split('T')[0])
                if (!llvNgayCanDoi) {
                    return res.status(200).json({ message: 'Không tìm thấy ngày cần đổi trong lịch làm việc' });
                }
                if (!llvNgayMuonDoi) {
                    return res.status(200).json({ message: 'Không tìm thấy ngày muốn đổi trong lịch làm việc' });
                }
                const shiftsInNgayCanDoi = llvNgayCanDoi.shift_id.split(',').map(Number);
                const shiftsInNgayMuonDoi = llvNgayMuonDoi.shift_id.split(',').map(Number);
                if (shiftsInNgayCanDoi.some(c => c == nd.ca_muon_doi)) {
                    return res.status(200).json({ message: 'Ca muốn đổi đã tồn tại trong ngày cần đổi' });
                }
                if (shiftsInNgayMuonDoi.some(c => c == nd.ca_can_doi)) {
                    return res.status(200).json({ message: 'Ca cần đổi đã tồn tại trong ngày muốn đổi' });
                }
                const newCycleCanDoi = cycleCanDoi.map(c => {
                    if (c.date === llvNgayCanDoi.date) {
                        const shifts = c.shift_id.split(',').filter(s => new Number(s) === nd.ca_can_doi)
                        shifts.push(nd.ca_muon_doi)
                        return {
                            ...c,
                            shift_id: shifts.join(','),
                        }
                    } else if (c.date === llvNgayMuonDoi.date) {
                        const shifts = c.shift_id.split(',').filter(s => new Number(s) === nd.ca_muon_doi)
                        shifts.push(nd.ca_can_doi)
                        return {
                            ...c,
                            shift_id: shifts.join(','),
                        }
                    } else {
                        return c
                    }
                })
                const newCycleMuonDoi = cycleCanDoi.map(c => {
                    if (c.date === llvNgayCanDoi.date) {
                        const shifts = c.shift_id.split(',').filter(s => new Number(s) === nd.ca_can_doi)
                        shifts.push(nd.ca_muon_doi)
                        return {
                            ...c,
                            shift_id: shifts.join(','),
                        }
                    } else if (c.date === llvNgayMuonDoi.date) {
                        const shifts = c.shift_id.split(',').filter(s => new Number(s) === nd.ca_muon_doi)
                        shifts.push(nd.ca_can_doi)
                        return {
                            ...c,
                            shift_id: shifts.join(','),
                        }
                    } else {
                        return c
                    }
                })
                const updatellvCanDoi = await Cycle.findOneAndUpdate({
                    cy_id: llvCanDoi[0].cy_id
                }, {
                    $set: {
                        cy_detail: JSON.stringify(newCycleCanDoi)
                    }
                }, {
                    new: true
                })
                const updateEmpLlvCanDoi = await EmployeCycle.findOneAndUpdate({
                    ep_id: check.id_user,
                    cy_id: llvCanDoi[0].cy_id,
                }, {
                    $set: {
                        update_time: Date.now(),
                    }
                }, {
                    new: true
                })
                const updatellvMuonDoi = await Cycle.findOneAndUpdate({
                    cy_id: llvMuonDoi[0].cy_id
                }, {
                    $set: {
                        cy_detail: JSON.stringify(newCycleMuonDoi)
                    }
                }, {
                    new: true
                })
                const updateEmpLlvMuonDoi = await EmployeCycle.findOneAndUpdate({
                    ep_id: check.id_user,
                    cy_id: llvMuonDoi[0].cy_id,
                }, {
                    $set: {
                        update_time: Date.now(),
                    }
                }, {
                    new: true
                })
                if (updatellvCanDoi && updateEmpLlvCanDoi && updatellvMuonDoi && updateEmpLlvMuonDoi) {
                    let timeNow = new Date();
                    const maxID = await this.getMaxID(His_Handle);
                    let newID = 0;
                    if (maxID) {
                        newID = Number(maxID) + 1;
                    }
                    const createHis = new His_Handle({
                        _id: newID,
                        id_user: id_user,
                        id_dx: check._id,
                        type_handling: 2,
                        time: timeNow
                    });
                    await createHis.save();
                    await De_Xuat.findOneAndUpdate({ _id: _id }, {
                        $set: {
                            type_duyet: 5,
                            time_duyet: timeNow
                        }
                    }, { new: true });
                    this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                    return res.status(200).json({ message: 'Duyệt đề xuất đổi ca thành công', updatellvCanDoi, updateEmpLlvCanDoi, updatellvMuonDoi, updateEmpLlvMuonDoi });
                } else {
                    return functions.setError(res, "Thông tin truyền lên không đầy đủ");
                }
            }
            //Đề xuất cấp phát tài sản
            else if (check.type_dx === 4) {
                const nd = check.noi_dung.cap_phat_tai_san;
                const ds_ts = JSON.parse(nd.cap_phat_taisan).ds_ts;
                const updated_ds_ts = ds_ts.map((item) => ({
                    ts_id: Number(item[0]),
                    sl_cp: Number(item[1]),
                }));
                const listTsName = []
                for (let i = 0; i < updated_ds_ts.length; i++) {
                    const ts = await TaiSan.findOne({
                        ts_id: updated_ds_ts[i].ts_id,
                        id_cty: com_id,
                        ts_da_xoa: 0
                    })
                    if (ts) {
                        if (ts.ts_so_luong < updated_ds_ts[i].sl_cp) {
                            return res.status(200).json({ message: 'Số lượng tài sản còn lại không đủ để cấp phát' })
                        } else {
                            listTsName.push(ts.ts_ten)
                        }
                    } else {
                        return res.status(200).json({ message: 'Không tìm thấy một trong các tài sản trong hệ thống' })
                    }
                }
                const _id_ngbangiao = await User.findOne({
                    idQLC: idUserBanGiao,
                    'inForPerson.employee.com_id': com_id,
                    type: 2
                })
                const _id_ngnhan = await User.findOne({
                    idQLC: check.id_user,
                    'inForPerson.employee.com_id': com_id,
                    type: 2,
                })
                const _id_ngtao = await User.findOne({
                    idQLC: com_id,
                    type: 1
                })
                let max = await capPhat.findOne({}, {}, { sort: { cp_id: -1 } }).lean() || 0;
                let maxThongBao = await thongBao.findOne({}, {}, { sort: { id_tb: -1 } }).lean() || 0;
                let CapPhatPB = new capPhat({
                    //tao cap phat neu la cap phat phong ban thi dien phong ban, neu la cap phat nhan vien thi khong dien id_pb
                    cp_id: Number(max.cp_id) + 1 || 1,
                    id_nhanvien: _id_ngnhan._id,
                    cap_phat_taisan: { ds_ts: updated_ds_ts },
                    cp_id_ng_tao: _id_ngtao._id,
                    id_cty: com_id,
                    cp_ngay: Math.round(new Date().getTime() / 1000),
                    cp_trangthai: 0,
                    ts_daidien_nhan: 0,
                    cp_date_create: Math.round(new Date().getTime() / 1000),
                    id_ng_thuchien: _id_ngbangiao._id,
                    cp_lydo: nd.ly_do,
                    cp_da_xoa: 0,
                })

                await CapPhatPB.save()
                let updateThongBao = new thongBao({
                    id_tb: Number(maxThongBao.id_tb) + 1 || 1,
                    id_ts: updated_ds_ts[0].ts_id,
                    id_cty: com_id,
                    id_ng_tao: _id_ngtao._id,
                    type_quyen: 1,
                    type_quyen_tao: 1,
                    loai_tb: 1,
                    da_xem: 0,
                    date_create: Math.round(new Date().getTime() / 1000),
                })
                await updateThongBao.save()
                if (CapPhatPB && updateThongBao) {
                    let timeNow = new Date();
                    const maxID = await this.getMaxID(His_Handle);
                    let newID = 0;
                    if (maxID) {
                        newID = Number(maxID) + 1;
                    }
                    const createHis = new His_Handle({
                        _id: newID,
                        id_user: id_user,
                        id_dx: check._id,
                        type_handling: 2,
                        time: timeNow
                    });
                    await createHis.save();
                    await De_Xuat.findOneAndUpdate({ _id: _id }, {
                        $set: {
                            type_duyet: 5,
                            time_duyet: timeNow
                        }
                    }, { new: true });
                    this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                    this.chatNotification(com_id, idUserBanGiao, com_id, `Bạn có tài sản cần bàn giao \nSố biên bản: ${CapPhatPB.cp_id} \nNgười cần bàn giao: ${check.name_user}\nTài sản bàn giao: ${listTsName.join(',')}`, `https://hungha365.com/quan-ly-tai-san/dieu-chuyen-ban-giao`)
                    return res.status(200).json({ message: 'Duyệt đề xuất cấp phát tài sản thành công', CapPhatPB, updateThongBao });
                }
            }
            //Đề xuất tham gia dự án
            else if (check.type_dx === 9) {
                const nd = check.noi_dung.tham_gia_du_an
                const project = await Project.findOne({
                    com_id: com_id,
                    project_id: nd.dx_da
                })
                if (project) {
                    if (!project.project_member.includes(check.id_user.toString())) {
                        const updatePJ = await Project.findOneAndUpdate({
                            com_id: com_id,
                            project_id: nd.dx_da,
                            type: 0,
                            project_type: 0,
                            open_or_close: 1,
                            is_delete: 0,
                        }, {
                            $set: {
                                project_member: `${project.project_member},${check.id_user.toString()}`
                            }
                        }, { new: true })
                        if (updatePJ) {
                            let timeNow = new Date();
                            const maxID = await this.getMaxID(His_Handle);
                            let newID = 0;
                            if (maxID) {
                                newID = Number(maxID) + 1;
                            }
                            const createHis = new His_Handle({
                                _id: newID,
                                id_user: id_user,
                                id_dx: check._id,
                                type_handling: 2,
                                time: timeNow
                            });
                            await createHis.save();
                            await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                $set: {
                                    type_duyet: 5,
                                    time_duyet: timeNow
                                }
                            }, { new: true });
                            this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                            return res.status(200).json({ message: 'Duyệt đề xuất tham gia dự án thành công', updatePJ });
                        } else {
                            return res.status(200).json({ message: 'Đã có lỗi xảy ra trong quá trình xử lý' });
                        }
                    } else {
                        return res.status(200).json({ message: 'Nhân viên đã là thành viên trong dự án này' });
                    }
                } else {
                    return res.status(200).json({ message: 'Dự án không có trong hệ thống hoặc đã đóng hoặc đã bị xóa' });
                }
            }
            //Đề xuất sửa chữa tài sản cấp phát
            else if (check.type_dx === 14) {
                const nd = check.noi_dung.sua_chua_co_so_vat_chat;
                const usersd = await User.findOne({
                    idQLC: check.id_user,
                    'inForPerson.employee.com_id': com_id,
                    'inForPerson.employee.ep_status': 'Active',
                    type: 2,
                })
                const userThucHien = ssetFixForm.ng_thuc_hien ? await User.findOne({
                    _id: assetFixForm.ng_thuc_hien
                }) : null;
                let ts_dx_sc = await TaiSanDangSuDung.findOne({ com_id_sd: com_id, id_nv_sd: usersd._id, id_ts_sd: nd.tai_san });
                if (ts_dx_sc) {
                    if (ts_dx_sc.sl_dang_sd >= nd.so_luong) {
                        let update_sl = ts_dx_sc.sl_dang_sd - Number(nd.so_luong);
                        let update_taisan = await TaiSanDangSuDung.findOneAndUpdate({
                            com_id_sd: com_id,
                            id_nv_sd: usersd._id,
                            id_ts_sd: nd.tai_san,
                        }, {
                            sl_dang_sd: update_sl
                        }, { new: true });
                        let max_qtsd = await QuaTrinhSuDung.findOne({}, {}, { sort: { quatrinh_id: -1 } }).lean() || 0;
                        let qr_qtr_sd = new QuaTrinhSuDung({
                            quatrinh_id: Number(max_qtsd.quatrinh_id) + 1 || 1,
                            id_ts: nd.tai_san,
                            id_bien_ban: 0,
                            so_lg: nd.so_luong,
                            id_cty: com_id,
                            id_ng_sudung: usersd._id,
                            qt_ngay_thuchien: nd.ngay_sc,
                            qt_nghiep_vu: 4,
                            ghi_chu: nd.ly_do,
                            time_created: Math.round(new Date().getTime() / 1000)
                        });
                        await qr_qtr_sd.save();
                        let max_sc = await SuaChua.findOne({}, {}, { sort: { sc_id: -1 } }).lean() || 0;
                        let new_SuaChua = new SuaChua({
                            sc_id: Number(max_sc.sc_id) + 1 || 1,
                            suachua_taisan: nd.tai_san,
                            sl_sc: nd.so_luong,
                            id_cty: com_id,
                            sc_ng_thuchien: assetFixForm.ng_thuc_hien,
                            sc_trangthai: 1,
                            sc_ngay_hong: nd.ngay_sc,
                            sc_ngay: nd.ngay_sc,
                            sc_dukien: assetFixForm.ngay_dukien,
                            sc_noidung: nd.ly_do,
                            sc_chiphi_dukien: nd.so_tien,
                            sc_chiphi_thucte: assetFixForm.chiphi_thucte,
                            sc_donvi: assetFixForm.dv_sc,
                            sc_loai_diadiem: assetFixForm.dia_diem_sc,
                            sc_diachi: assetFixForm.dia_chi_nha_cung_cap,
                            sc_ngay_nhapkho: 0,
                            sc_type_quyen: 1,
                            sc_id_ng_tao: _id_user,
                            sc_date_create: Math.round(new Date().getTime() / 1000)
                        });
                        await new_SuaChua.save();
                        if (update_taisan && qr_qtr_sd && new_SuaChua) {
                            let timeNow = new Date();
                            const maxID = await this.getMaxID(His_Handle);
                            let newID = 0;
                            if (maxID) {
                                newID = Number(maxID) + 1;
                            }
                            const createHis = new His_Handle({
                                _id: newID,
                                id_user: id_user,
                                id_dx: check._id,
                                type_handling: 2,
                                time: timeNow
                            });
                            await createHis.save();
                            await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                $set: {
                                    type_duyet: 5,
                                    time_duyet: timeNow
                                }
                            }, { new: true });
                            if (userThucHien) {
                                this.chatNotification(com_id, userThucHien.idQLC, com_id, 'Bạn có tài sản cần sửa chữa', ``)
                            }
                            this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                            return res.status(200).json({ message: 'Duyệt đề xuất sửa chữa tài sản thành công', update_taisan, qr_qtr_sd, new_SuaChua });
                        }
                    } else {
                        return res.status(200).json({ message: 'Số lượng sửa chữa lớn hơn số lượng đang sử dụng' })
                    }
                } else {
                    return res.status(200).json({ message: 'Không tìm thấy tài sản đề xuất' })
                }
                console.log(nd, assetFixForm, _id_user, ts_dx_sc.sl_dang_sd);

            }
            //Các loại đề xuất khác
            else {
                try {
                    let timeNow = new Date();
                    const maxID = await this.getMaxID(His_Handle);
                    let newID = 0;
                    if (maxID) {
                        newID = Number(maxID) + 1;
                    }
                    const createHis = new His_Handle({
                        _id: newID,
                        id_user: id_user,
                        id_dx: check._id,
                        type_handling: 2,
                        time: timeNow
                    });
                    await createHis.save();
                    await De_Xuat.findOneAndUpdate({ _id: _id }, {
                        $set: {
                            type_duyet: 5,
                            time_duyet: timeNow
                        }
                    }, { new: true });
                    this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                    return res.status(200).json({ message: 'Duyệt đề xuất thành công' });
                } catch (err) {
                    console.error(err);
                    return functions.setError(res, err);
                }
            }
        } else {
            //Kiểu duyệt đồng thời
            if (check.kieu_duyet == 0) {
                let timeNow = new Date();
                const maxID = await this.getMaxID(His_Handle);
                let newID = 0;
                if (maxID) {
                    newID = Number(maxID) + 1;
                }
                const createHis = new His_Handle({
                    _id: newID,
                    id_user: id_user,
                    id_dx: check._id,
                    type_handling: 2,
                    time: timeNow
                });
                await createHis.save();

                //Nếu là đơn nghỉ phép thì check khóa tài khoản CRM bên tv365
                if ([1, 18].indexOf(check.type_dx) > -1) {
                    this.cron_lock_admin(_id, com_id, id_user);
                }

                let id_user_duyet = [];
                let history = [];
                if (check.id_user_duyet) {
                    id_user_duyet = check.id_user_duyet.split(',').map(Number);
                    for (var i = 0; i < id_user_duyet.length; i++) {
                        id = id_user_duyet[i];
                        const his = await His_Handle.findOne({ id_user: id, id_dx: _id }).sort({ time: -1 })
                        history.push({ id: id, history: his ? his.type_handling : null });
                    }
                }
                //Chờ công ty duyệt
                if (history.length > 0) {
                    // Nếu tất cả người duyệt đều đã duyệt
                    if (history.every(his => his.history === 2)) {
                        //Đề xuất cần công ty duyệt
                        if (listDxIdCtyDuyet.some(x => x == check.type_dx)) {
                            await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                $set: {
                                    type_duyet: 11,
                                    time_duyet: timeNow,
                                    id_user_duyet: check.id_user_duyet += `,${com_id}`
                                }
                            }, { new: true });
                            return res.status(200).json({ message: 'Chờ công ty duyệt' });
                        }
                        //Đề xuất không cần công ty duyệt
                        else {
                            //Đề xuất phòng họp
                            if (check.type_dx === 12) {
                                const browse = await browseMeeting(His_Handle, De_Xuat, _id, check, id_user, com_id);
                                return res.status(200).json({ message: browse.message, meetings: browse.meetings });
                            } else {
                                await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                    $set: {
                                        type_duyet: 5,
                                        time_duyet: timeNow
                                    }
                                }, { new: true });
                                this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)

                                return res.status(200).json({ message: 'Đã duyệt đề xuất' });
                            }
                        }
                    }
                    // Nếu có bất cứ một người nào chưa duyệt
                    else {
                        await De_Xuat.findOneAndUpdate({ _id: _id }, {
                            $set: {
                                type_duyet: 10,
                                time_duyet: timeNow
                            }
                        }, { new: true });
                        return res.status(200).json({ message: 'Duyệt thành công. Chờ lãnh đạo còn lại duyệt' });
                    }
                }
            }
            //Kiểu duyệt lần lượt
            else if (check.kieu_duyet == 1) {
                const pos = await Positions.find({ comId: com_id }).lean();
                //Tìm ra thông tin người duyệt
                const userDuyet = await User.findOne({
                    'inForPerson.employee.com_id': com_id,
                    idQLC: id_user,
                }).select('idQLC userName inForPerson.employee.dep_id inForPerson.employee.position_id').lean();
                //Gắn thông tin người duyệt với level
                const userWithLevel_pos = pos.find(pos => pos.id == userDuyet.inForPerson.employee.position_id);
                let userWithLevel_level;
                if (userWithLevel_pos) {
                    userWithLevel_level = userWithLevel_pos.level;
                }
                const userDuyetWithLevel = {
                        ...userDuyet,
                        level: userWithLevel_level
                    }
                    //Tìm ra danh sách người duyệt
                const listIDUserDuyet = check.id_user_duyet.split(',').map(Number);
                const listUserDuyet = await User.find({
                    'inForPerson.employee.com_id': com_id,
                    idQLC: { $in: listIDUserDuyet },
                }).select('idQLC userName inForPerson.employee.dep_id inForPerson.employee.position_id').lean();
                //Gắn thông tin danh sách người duyệt với level
                const listUserDuyetWithLevel = listUserDuyet.map(emp => {
                    let level;
                    let isManager;
                    const empPos = pos.find(pos => pos.id == emp.inForPerson.employee.position_id)
                    if (empPos) {
                        level = empPos.level;
                        isManager = empPos.isManager;
                    }
                    return {
                        ...emp,
                        level: level,
                        isManager: isManager,
                    }
                });
                //Tìm ra những người dưới cấp
                const underLevelUserDuyetList = listUserDuyetWithLevel.filter(user => user.level > userDuyetWithLevel.level)
                const underLevelUserDuyetIDList = underLevelUserDuyetList.map(user => user.idQLC)
                let history = [];
                //Nếu danh sách > 0 tức là có tồn tại người dưới cấp so với người duyệt này => cần chờ những người cấp thấp hơn duyệt
                if (underLevelUserDuyetIDList.length > 0) {
                    //Lấy ra danh sách lịch sử duyệt của những người dưới cấp
                    for (var i = 0; i < underLevelUserDuyetIDList.length; i++) {
                        const id = underLevelUserDuyetIDList[i];
                        const his = await His_Handle.findOne({ id_user: id, id_dx: _id }).sort({ time: -1 })
                        history.push({ id: id, history: his ? his.type_handling : null });
                    }
                    if (history.length > 0) {
                        //Nếu những người dưới cấp đều đã duyệt thì người duyệt sẽ được duyệt
                        if (history.every(his => his.history === 2)) {
                            let timeNow = new Date();
                            const maxID = await this.getMaxID(His_Handle);
                            let newID = 0;
                            if (maxID) {
                                newID = Number(maxID) + 1;
                            }
                            const createHis = new His_Handle({
                                _id: newID,
                                id_user: id_user,
                                id_dx: check._id,
                                type_handling: 2,
                                time: timeNow
                            });
                            await createHis.save();

                            if ([1, 18].indexOf(check.type_dx) > -1) {
                                this.cron_lock_admin(_id, com_id, id_user);
                            }

                            let history = [];
                            if (check.id_user_duyet) {
                                for (var i = 0; i < listIDUserDuyet.length; i++) {
                                    const id = listIDUserDuyet[i];
                                    const his = await His_Handle.findOne({ id_user: id, id_dx: _id }).sort({ time: -1 })
                                    history.push({ id: id, history: his ? his.type_handling : null });
                                }
                            }
                            //Chờ công ty duyệt
                            if (history.length > 0) {
                                // Nếu tất cả người duyệt đều đã duyệt
                                if (history.every(his => his.history === 2)) {
                                    //Đề xuất cần công ty duyệt
                                    if (listDxIdCtyDuyet.some(x => x == check.type_dx)) {
                                        await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                            $set: {
                                                type_duyet: 11,
                                                time_duyet: timeNow,
                                                id_user_duyet: check.id_user_duyet += `,${com_id}`
                                            }
                                        }, { new: true });
                                        return res.status(200).json({ message: 'Chờ công ty duyệt' });
                                    }
                                    //Đề xuất không cần công ty duyệt
                                    else {
                                        if (check.type_dx === 12) {
                                            const browse = await browseMeeting(His_Handle, De_Xuat, _id, check, id_user, com_id);
                                            return res.status(200).json({ message: browse.message, meetings: browse.meetings });
                                        } else {
                                            await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                                $set: {
                                                    type_duyet: 5,
                                                    time_duyet: timeNow
                                                }
                                            }, { new: true });
                                            this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                                            return res.status(200).json({ message: 'Đã duyệt đề xuất' });
                                        }
                                    }
                                }
                                // Nếu có bất cứ một người nào chưa duyệt
                                else {
                                    await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                        $set: {
                                            type_duyet: 10,
                                            time_duyet: timeNow
                                        }
                                    }, { new: true });
                                    return res.status(200).json({ message: 'Duyệt thành công. Chờ lãnh đạo cấp cao hơn duyệt' });
                                }
                            }
                        }
                        //Nếu không sẽ phải chờ tất cả những người dưới cấp duyệt trước
                        else {
                            return res.status(200).json({ message: 'Cần chờ những lãnh đạo cấp dưới duyệt trước' });
                        }
                    }
                }
                //Nếu danh sách < 0 tức là người duyệt này có cấp thấp nhất => có thể duyệt luôn
                else {
                    let timeNow = new Date();
                    const maxID = await this.getMaxID(His_Handle);
                    let newID = 0;
                    if (maxID) {
                        newID = Number(maxID) + 1;
                    }
                    const createHis = new His_Handle({
                        _id: newID,
                        id_user: id_user,
                        id_dx: check._id,
                        type_handling: 2,
                        time: timeNow
                    });
                    await createHis.save();

                    if ([1, 18].indexOf(check.type_dx) > -1) {
                        this.cron_lock_admin(_id, com_id, id_user);
                    }

                    let history = [];
                    if (check.id_user_duyet) {
                        for (var i = 0; i < listIDUserDuyet.length; i++) {
                            const id = listIDUserDuyet[i];
                            const his = await His_Handle.findOne({ id_user: id, id_dx: _id }).sort({ time: -1 })
                            history.push({ id: id, history: his ? his.type_handling : null });
                        }
                    }
                    //Chờ công ty duyệt
                    if (history.length > 0) {
                        // Nếu tất cả người duyệt đều đã duyệt
                        if (history.every(his => his.history === 2)) {
                            //Đề xuất cần công ty duyệt
                            if (listDxIdCtyDuyet.some(x => x == check.type_dx)) {
                                await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                    $set: {
                                        type_duyet: 11,
                                        time_duyet: timeNow,
                                        id_user_duyet: check.id_user_duyet += `,${com_id}`
                                    }
                                }, { new: true });
                                return res.status(200).json({ message: 'Chờ công ty duyệt' });
                            }
                            //Đề xuất không cần công ty duyệt
                            else {
                                if (check.type_dx === 12) {
                                    const browse = await browseMeeting(His_Handle, De_Xuat, _id, check, id_user, com_id);
                                    return res.status(200).json({ message: browse.message, meetings: browse.meetings });
                                } else {
                                    await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                        $set: {
                                            type_duyet: 5,
                                            time_duyet: timeNow
                                        }
                                    }, { new: true });
                                    this.chatNotification(com_id, check.id_user, com_id, 'Đề xuất đã được duyệt', `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
                                    return res.status(200).json({ message: 'Đã duyệt đề xuất' });
                                }
                            }
                        }
                        // Nếu có bất cứ một người nào chưa duyệt
                        else {
                            await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                $set: {
                                    type_duyet: 10,
                                    time_duyet: timeNow
                                }
                            }, { new: true });
                            return res.status(200).json({ message: 'Duyệt thành công. Chờ lãnh đạo cấp cao hơn duyệt' });
                        }
                    }
                }

                return res.status(200).json({ underLevelUserDuyetList, usersDuyetWithLevel: userDuyetWithLevel, listUserDuyetWithLevel });
            }
        }
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}
const browseMeeting = async(His_Handle, De_Xuat, _id, check, id_user, com_id) => {
    try {
        let timeNow = new Date();
        const nd = check.noi_dung.su_dung_phong_hop;
        let time_start = nd.bd_hop;
        let time_end = nd.end_hop;
        const userHop = await User.findOne({
            idQLC: check.id_user,
            'inForPerson.employee.com_id': com_id,
        }).lean();
        const meetingRooms = await MeetingRoom.find({
            id: { $in: nd.phong_hop.split(',').map(Number) },
            com_id: com_id
        }).lean();
        let meetingRoomWitStatus = [];
        if (meetingRooms && meetingRooms.length > 0) {
            for (let i = 0; i < meetingRooms.length; i++) {
                const meetingsRaw = await Meeting.find({
                    com_id: com_id,
                    address_links: meetingRooms[i].id.toString(),
                }).lean();
                if (meetingsRaw && meetingsRaw.length > 0) {
                    const meetings = meetingsRaw.map(m => {
                        const startDate = new Date(`${m.date_start}T${m.time_start}`.replace(/\s/g, '')).getTime();
                        const endDate = startDate + m.time_estimated * 60 * 1000;
                        return {
                            ...m,
                            startDateNumber: startDate / 1000,
                            endDateNumber: endDate / 1000,
                        };
                    });
                    if (meetings.every(m => time_end <= m.startDateNumber || time_start >= m.endDateNumber)) {
                        meetingRoomWitStatus.push({
                            ...meetingRooms[i],
                            availableStatus: 0, //Có sẵn
                        })
                    } else if (meetings.some(m => (time_start <= m.startDateNumber && time_end >= m.startDateNumber && time_end <= m.endDateNumber) ||
                            (time_start <= m.endDateNumber && time_start >= m.startDateNumber && time_end >= m.endDateNumber))) {
                        meetingRoomWitStatus.push({
                            ...meetingRooms[i],
                            availableStatus: 1, //Có sẵn 1 nửa
                        })
                    } else if (meetings.some(m => (time_start <= m.startDateNumber && time_end >= m.endDateNumber) ||
                            (time_start >= m.startDateNumber && time_end <= m.endDateNumber))) {
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
        } else {
            return { message: 'Không tìm thấy phòng họp yêu cầu trong hệ thống' };
        }
        const startDateString = new Date(time_start * 1000)
        const start_hours = String(startDateString.getHours()).padStart(2, '0');
        const start_minutes = String(startDateString.getMinutes()).padStart(2, '0');
        const time_estimated = Math.round((time_end - time_start) / 60);
        let meetings = []
        if (meetingRoomWitStatus.length > 0) {
            if (meetingRoomWitStatus.every(m => m.availableStatus === 0)) {
                for (let i = 0; i < meetingRoomWitStatus.length; i++) {
                    let maxId = await Meeting.findOneWithDeleted({}, {
                        id: 1
                    }).sort({
                        id: -1
                    }).limit(1).lean();
                    if (maxId) {
                        maxId = Number(maxId.id) + 1;
                    } else maxId = 1;
                    const meeting = new Meeting({
                        id: maxId,
                        com_id: com_id,
                        name_meeting: userHop.userName,
                        date_start: startDateString.toISOString().slice(0, 10),
                        time_start: `${start_hours}:${start_minutes}`,
                        time_estimated: time_estimated,
                        department_id: userHop.inForPerson.employee.dep_id,
                        staff_owner: userHop._id,
                        staff_take_in: userHop._id,
                        address_links: meetingRoomWitStatus[i].id,
                        type: 1,
                        is_send_mail: 1,
                        created_at: new Date().getTime() / 1000,
                    })
                    await meeting.save();
                    meetings.push(meeting);
                }
            } else {
                let unavailableMeetingRoom = meetingRoomWitStatus.filter(m => m.availableStatus !== 0);
                return { message: `${unavailableMeetingRoom.map(m => m.name).join(', ')} đã có lịch họp` };
            }
        }
        await De_Xuat.findOneAndUpdate({ _id: _id }, {
            $set: {
                type_duyet: 5,
                time_duyet: timeNow
            }
        }, { new: true });
        return { message: 'Duyệt đề xuất đăng kí sử dụng phòng họp thành công. Đã lên lịch họp', meetings };
    } catch (error) {
        console.log(error);
    }
}

// t? ch?i d? xu?t
exports.refuseProposal = async(res, His_Handle, De_Xuat, _id, id_ep, check, id_user, refuse_reason) => {
    try {
        let timeNow = new Date()
        await De_Xuat.findOneAndUpdate({ _id: _id }, {
            $set: {
                type_duyet: 3,
                time_duyet: timeNow,
                active: 2,
                refuse_reason: refuse_reason,
            }
        }, { new: true });
        const createHis = new His_Handle({
            _id: await this.getMaxID(His_Handle) + 1,
            id_user: id_user,
            id_dx: check._id,
            type_handling: 3,
            time: timeNow
        });
        await createHis.save();
        this.chatNotification(id_user, check.id_user, id_user, `Đề xuất đã bị từ chối \nlý do: ${refuse_reason}`, `https://hungha365.com/van-thu-luu-tru/trang-quan-ly-de-xuat/${check._id}`)
        return res.status(200).json({ message: 'Từ chối đề xuất thành công' });
    } catch (error) {
        console.log(error);
        return this.setError(res, error);
    }
}

// b?t bu?c di l�m
exports.compulsoryWork = async(res, His_Handle, De_Xuat, _id, check, id_user) => {
    try {
        let timeNow = new Date();
        await De_Xuat.findOneAndUpdate({ _id: _id }, {
            $set: {
                type_duyet: 6,
                time_duyet: timeNow,
                active: 2
            }
        }, { new: true });
        const createHis = new His_Handle({
            _id: await this.getMaxID(His_Handle) + 1,
            id_user: id_user,
            id_dx: check._id,
            type_handling: 6,
            time: timeNow
        });
        await createHis.save();
        return res.status(200).json({ message: 'Bắt buộc đi làm thành công!' });
    } catch (error) {
        return this.setError(res, error)
    }
}

// duy?t chuy?n ti?p
exports.forwardBrowsing = async(res, His_Handle, De_Xuat, _id, id_uct, check, id_user) => {
    try {
        let timeNow = new Date()
        let listIDtheodoi = check.id_user_theo_doi.split(',')
        let listIDduyet = check.id_user_duyet.split(',')
        if (id_uct && listIDtheodoi.length > 0) {
            listIDtheodoi = listIDtheodoi.filter(id => id != id_user)
            listIDtheodoi.push(id_user)
        } else {
            return res.status(200).json({ message: 'Thiếu trường người chuyển tiếp' })
        }
        listIDduyet = listIDduyet.filter(id => id != id_user);
        listIDduyet.push(id_uct)
        await De_Xuat.findOneAndUpdate({ _id: _id }, { id_user_duyet: listIDduyet.join(','), id_user_theo_doi: listIDtheodoi.join(',') }, { new: true });

        const createHis = new His_Handle({
            _id: await this.getMaxID(His_Handle) + 1,
            id_user: id_user,
            id_dx: check._id,
            type_handling: 2,
            time: timeNow
        });
        await createHis.save();

        return res.status(200).json({ message: 'Chuyển tiếp đề xuất thành công' });
    } catch (error) {
        return this.setError(res, error)
    }
}

// Ki?m tra th?i gian qu� h?n
exports.expired = async(id_dx, id_com) => {
    const dexuat = await DeXuat.findOne({ _id: id_dx, com_id: id_com }).lean();
    const date_now = Date.parse(new Date()) / 1000;
    const hour_diff = (date_now - dexuat.time_create) / 3600;
    const privateSetting = await SettingConfirm.findOne({
        comId: id_com,
        ep_id: dexuat.id_user
    }).lean();
    const generalSetting = await SettingPropose.findOne({
        comId: id_com,
        dexuat_id: dexuat.type_dx
    }).lean();
    let ischoosePriveSetting = false
    if (dexuat.noi_dung.nghi_phep.loai_np !== 2) {
        ischoosePriveSetting = true
    } else {
        const firstDayNd = dexuat.noi_dung.nghi_phep.nd[0];
        const firstDayDate = firstDayNd.bd_nghi;
        const firstDayShift = firstDayNd.ca_nghi;
        let trueTime
        if (firstDayShift) {
            const shift = await Shifts.findOne({
                com_id: id_com,
                shift_id: Number(firstDayShift)
            }).lean();
            trueTime = new Date(`${firstDayDate}T${shift.start_time}`).getTime() / 1000;
        } else {
            trueTime = new Date(`${firstDayDate}T08:00`).getTime() / 1000;
        }
        if (date_now > trueTime) {
            return true
        } else {
            ischoosePriveSetting = true
        }
    }
    if (ischoosePriveSetting) {
        if (privateSetting) {
            const listTimeSetting = privateSetting.listPrivateTime;
            if (listTimeSetting) {
                const dxTime = listTimeSetting.find(t => t.dexuat_id === dexuat.type_dx)
                if (dxTime) {
                    const confirm_time = dxTime.confirm_time;
                    if (hour_diff > confirm_time) {
                        return true
                    } else {
                        return false
                    }
                }
            }
        }
    }
    if (generalSetting) {
        const generalExpiredTime = generalSetting.confirm_time;
        if (generalExpiredTime === 0) {
            return false
        } else if (hour_diff > generalExpiredTime) {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}
exports.confirmed = async(id_dx, id_user) => {
    try {
        const history = await HistoryHandling
            .findOne({ id_dx: id_dx, id_user: id_user }, { type_handling: 1, time: 1 })
            .sort({ time: -1 })
            .lean();
        if (history && history.type_handling === 2) {
            return true
        } else {
            return false;
        }
    } catch (error) {
        return this.setError(res, error)
    }
}


const FormData = require('form-data');
exports.cron_lock_admin = async(_id, com_id, emp_id) => {
    try {
        console.log(com_id, emp_id)
        if (com_id == 10003087 && emp_id == 10000895) {

            // Kiểm tra xem có phải đề xuất nghỉ phép hay không (type_dx = 1)
            const dx = await DeXuat.findOne({ _id, type_dx: { $in: [1, 18] } }).select("id_user type_dx noi_dung.nghi_phep noi_dung.lich_lam_viec");
            if (dx) {
                const loai_de_xuat = dx.type_dx;
                const id_user = dx.id_user;
                const admin = await AdminUser.findOne({ emp_id: id_user });

                if (admin) {
                    // Đơn xin nghỉ phép
                    if (loai_de_xuat == 1) {
                        const loai_np = dx.noi_dung.nghi_phep.loai_np;
                        const array = dx.noi_dung.nghi_phep.nd;

                        for (let i = 0; i < array.length; i++) {
                            const chi_tiet_noi_dung = array[i];
                            // Lấy thời gian nghỉ phép của KD
                            let bd_nghi = `${chi_tiet_noi_dung.bd_nghi} 00:00:00`,
                                kt_nghi = `${chi_tiet_noi_dung.kt_nghi} 23:59:59`;
                            let nghi_ca_ngay = 1;

                            // Lấy ca nghỉ
                            const ca_nghi = chi_tiet_noi_dung.ca_nghi;
                            if (ca_nghi) {
                                const ca_lam_viec = await Shifts.findOne({ shift_id: ca_nghi }, {
                                    start_time: 1,
                                    end_time: 1,
                                });

                                bd_nghi = `${chi_tiet_noi_dung.bd_nghi} ${ca_lam_viec.start_time}`;
                                kt_nghi = `${chi_tiet_noi_dung.kt_nghi} ${ca_lam_viec.end_time}`;
                                nghi_ca_ngay = 0;
                            }
                            let data = new FormData();
                            data.append('id_qlc', admin.adm_id);
                            data.append('time_start', bd_nghi);
                            data.append('time_end', kt_nghi);
                            data.append('type_shift', nghi_ca_ngay);

                            let config = {
                                method: 'post',
                                maxBodyLength: Infinity,
                                url: 'https://timviec365.vn/api/cron_lock_admin.php',
                                data: data
                            };
                            await axios.request(config);
                        }
                    }

                    // Lịch làm việc
                    else if (loai_de_xuat == 18) {
                        const lich_lam_viec = dx.noi_dung.lich_lam_viec;
                        const ngay_lam_viec = JSON.parse(lich_lam_viec.ngay_lam_viec);

                        // Lấy ra danh sách ngày nghỉ trong llv
                        const ds_ngay_nghi = ngay_lam_viec[0].data.filter((item) => {
                            return item.shift_id == "" || item.shift_id.split(',').length == 1;
                        });
                        for (let j = 0; j < ds_ngay_nghi.length; j++) {
                            const element = ds_ngay_nghi[j];
                            let bd_nghi = `${element.date} 00:00:00`,
                                kt_nghi = `${element.date} 23:59:59`;
                            let nghi_ca_ngay = 1;

                            // Lấy ca nghỉ
                            const shift_id = element.shift_id;
                            if (shift_id != '') {
                                const ca_lam_viec = await Shifts.findOne({ shift_id }, {
                                    start_time: 1,
                                    end_time: 1,
                                });

                                bd_nghi = `${element.date} ${ca_lam_viec.start_time}`;
                                kt_nghi = `${element.date} ${ca_lam_viec.end_time}`;
                                nghi_ca_ngay = 0;
                            }


                            let data = new FormData();
                            data.append('id_qlc', admin.adm_id);
                            data.append('time_start', bd_nghi);
                            data.append('time_end', kt_nghi);
                            data.append('type_shift', nghi_ca_ngay);
                            data.append('resoure', 2);

                            let config = {
                                method: 'post',
                                maxBodyLength: Infinity,
                                url: 'https://timviec365.vn/api/cron_lock_admin.php',
                                data: data
                            };
                            await axios.request(config);
                        }
                    }
                }

            }
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}