// check ảnh và video
const fs = require('fs');

// upload file
const multer = require('multer')

// gửi mail
const nodemailer = require("nodemailer");
// tạo biến môi trường
const dotenv = require("dotenv");
// mã hóa mật khẩu
const crypto = require('crypto');
// gọi api
const axios = require('axios')

// check video
const path = require('path');
//check ảnh
const { promisify } = require('util');

// tạo token
const jwt = require('jsonwebtoken');
const Users = require('../../models/Users');

// giới hạn dung lượng video < 100MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
// danh sách các loại video cho phép
const allowedTypes = ['.mp4', '.mov', '.avi', '.wmv', '.flv'];
// giới hạn dung lượng ảnh < 2MB
const MAX_IMG_SIZE = 2 * 1024 * 1024;
// giới hạn dung lượng kho ảnh
exports.MAX_Kho_Anh = 300 * 1024 * 1024;

//gioi han file
const MAX_FILE_SIZE = 20 * 1024 * 1024;

var CryptoJS = require("crypto-js");

dotenv.config();

const functions = require('../../services/functions');
const SettingConfirm = require('../../models/qlc/SettingConfirm');
const SettingIPApp = require('../../models/qlc/SettingIPApp')

//QLC
exports.uploadAvaComQLC = async(file, allowedExtensions) => {
    // const namefiles = req.files.name
    let date = new Date();
    let namefile = 'app' + Math.round(date.getTime() / 1000) + "_" + file.name;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let path1 = `../storage/base365/qlc/upload/company/logo/${year}/${month}/${day}/`;
    let filePath = `../storage/base365/qlc/upload/company/logo/${year}/${month}/${day}/` + namefile;
    let fileCheck = path.extname(filePath);
    if (allowedExtensions.includes(fileCheck.toLocaleLowerCase()) === false) {
        return false
    }
    if (!fs.existsSync(path1)) {
        fs.mkdirSync(path1, { recursive: true });
    }
    fs.readFile(file.path, (err, data) => {
        if (err) {
            console.log(err)
        }
        fs.writeFile(filePath, data, (err) => {
            if (err) {
                console.log(err)
            }
        });
    });
    return namefile
}
exports.uploadAvaEmpQLC = async(id, file, allowedExtensions) => {
    let namefile = "app_" + file.name;
    let path1 = `../storage/base365/qlc/upload/employee/ep${id}/`;
    let filePath = `../storage/base365/qlc/upload/employee/ep${id}/` + namefile;
    let fileCheck = path.extname(filePath);
    if (allowedExtensions.includes(fileCheck.toLocaleLowerCase()) === false) {
        return false
    }
    if (!fs.existsSync(path1)) {
        fs.mkdirSync(path1, { recursive: true });
    }
    fs.readFile(file.path, (err, data) => {
        if (err) {
            console.log(err)
        }

        fs.writeFile(filePath, data, (err) => {
            if (err) {
                console.log(err)
            }
        });
    });
    return namefile
}
exports.uploadErrQLC = async(token, id, file, allowedExtensions) => {
        const paths = (token !== 1 ? "ep_" + id : "com_" + id)
        let namefile = file.name;
        let path1 = `../storage/base365/qlc/upload/error/` + paths + '/';
        let filePath = `../storage/base365/qlc/upload/error/` + paths + '/' + namefile;
        let fileCheck = path.extname(filePath);
        if (allowedExtensions.includes(fileCheck.toLocaleLowerCase()) === false) {
            return false
        }
        if (!fs.existsSync(path1)) {
            fs.mkdirSync(path1, { recursive: true });
        }
        fs.readFile(file.path, (err, data) => {
            if (err) {
                console.log(err)
            }

            fs.writeFile(filePath, data, (err) => {
                if (err) {
                    console.log(err)
                }
            });
        });
        return namefile
    }
    // hàm tạo link file QLC
exports.createAvatarQLC = (namefiles) => {
    let link = namefiles;
    return link;
}
exports.createLinkFileErrQLC = (token, id, file) => {
    if (file != null && file != '') {
        const paths = (token !== 1 ? "ep_" + id : "com_" + id)
        let link = `${process.env.cdn}/upload/error/${paths}/${file}`;
        return link;
    }
    return "";

}
exports.createLinkFileComQLC = (createAt, file) => {
    if (file != null && file != '') {
        return `${process.env.cdn}/upload/company/logo/${functions.convertDate(createAt,true)}/${file}`;
    } else {
        return "";
    }
}
exports.createLinkFileEmpQLC = (id, file) => {
    if (file != null && file != '') {
        return `${process.env.cdn}/upload/employee/ep${id}/${file}`;
    } else {
        return "";
    }
}

exports.deleteFileQLC = (folder, timestamp, file) => {
    let filePath = `../storage/base365/QLC/upload/${folder}/${timestamp}/` + file;
    fs.unlink(filePath, (err) => {
        if (err) console.log(err);
    });
}
exports.settingConfirm = async(user) => {
    try {
        const maxId = await SettingConfirm.findOne({}, { id: 1 }, { sort: { id: -1 } }).lean() || 0;
        const id = Number(maxId.id) + 1 || 1;
        const newSettingConfirm = new SettingConfirm({
            id: id,
            comId: user.inForPerson.employee.com_id,
            ep_id: user.idQLC,
            confirm_level: 1,
            confirm_type: 3,
            created_time: functions.getTimeNow(),
            update_time: functions.getTimeNow()
        })
        await newSettingConfirm.save()
        console.log(3)
        return 1
    } catch (e) {
        console.log("lỗi cài setting đề xuất", e)
        return 1
    }
}



const JSEncrypt = require('node-jsencrypt');
exports.decrypt = (data) => {
        try {
            const SECRET_KEY = process.env.SECRET_KEY
            console.log('data')
            console.log(data)
            const jsEncrypt = new JSEncrypt();
            jsEncrypt.setPrivateKey(SECRET_KEY)
            const decrypted = jsEncrypt.decrypt(data)
            console.log('decrypted')
            console.log(decrypted)
            return JSON.parse(decrypted)
        } catch (error) {
            console.log(error)
            return null
        }
    }
    // cài đặt mặc định giới hạn IP, phần mềm cho nhân viên
exports.settingIPApp = async(user) => {
    try {
        const maxId = await SettingIPApp.findOne({}, { id: 1 }, { sort: { id: -1 } }).lean() || 0;
        const id = Number(maxId.id) + 1 || 1;
        const newSettingIPApp = new SettingIPApp({
            id: id,
            comId: user.inForPerson.employee.com_id,
            ep_id: user.idQLC,
            ip: [],
            app: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
            start_date: 0,
            end_date: 0,
            created_time: functions.getTimeNow(),
            update_time: functions.getTimeNow()
        })
        await newSettingIPApp.save()
        return 1
    } catch (e) {
        console.log("lỗi cài mặc định giới hạn ip, phần mềm", e)
        return 1
    }
}