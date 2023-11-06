const Users = require('../../models/Users');
const AdminUser = require('../../models/Timviec365/Admin/AdminUser');
const CompanyStorage = require('../../models/Timviec365/UserOnSite/Company/Storage');

const multer = require('multer');
const fs = require('fs');
const functions = require('../functions');

const allowedTypes = ["image/png", "image/jpeg", "image/gif", "video/m4v", "video/mp4", "video/ogm", "video/wmv", "video/mpg", "video/ogv", "video/webm", "video/mov", "video/asx", "video/mpeg", "video/quicktime"];
const allowedTypeVideos = ["video/m4v", "video/mp4", "video/ogm", "video/wmv", "video/mpg", "video/ogv", "video/webm", "video/mov", "video/asx", "video/mpeg", "video/quicktime"];
const allowedTypeImages = ["image/png", "image/jpeg", "image/gif"];

const urlImage = "../storage/base365/timviec365/pictures";
const urlCdnImage = `${functions.hostCDN()}/pictures/videos`;
const urlVideo = "../storage/base365/timviec365/pictures/videos";
const urlCdnVideo = `${functions.hostCDN()}/pictures/videos`;

exports.geturlVideo = (time) => {
    const dateTime = functions.convertDate(time, true);
    path = `${urlVideo}/${dateTime}/`; // Tạo đường dẫn đến thư mục của người dùng

    if (!fs.existsSync(path)) { // Nếu thư mục chưa tồn tại thì tạo mới
        fs.mkdirSync(path, { recursive: true });
    }
    return path;
}

const geturlImage = (time) => {
    const dateTime = functions.convertDate(time, true);
    path = `${urlImage}/${dateTime}/`; // Tạo đường dẫn đến thư mục của người dùng

    if (!fs.existsSync(path)) { // Nếu thư mục chưa tồn tại thì tạo mới
        fs.mkdirSync(path, { recursive: true });
    }
    return path;
}

exports.shareCompanyToAdmin = async() => {
    const company = await Users.findOne({
            fromDevice: { $ne: 3 },
            type: 1,
            inForCompany: { $ne: null },
            "inForCompany.timviec365.usc_kd_first": { $ne: 0 }
        })
        .select("inForCompany.timviec365.usc_kd_first")
        .sort({ idTimViec365: -1 })
        .lean();
    let usc_kd = 0;
    if (company) {
        usc_kd = company.inForCompany.timviec365.usc_kd_first
    }


    // Lấy danh sách id kinh doanh
    let listKD = await AdminUser.find({
            adm_bophan: { $ne: 0 },
            adm_ntd: 1
        })
        .select("adm_bophan emp_id")
        .sort({ adm_bophan: 1 })
        .lean();

    const max_kd = listKD[listKD.length - 1].adm_bophan;

    // lấy vị trí của usc_kd trong danh sách adm_bophan
    const position_usc_kd = listKD.findIndex(item => item.adm_bophan === usc_kd);

    // Xử lý logic chia user cho KD
    let new_val, emp_id;
    if (usc_kd === max_kd || usc_kd == 0) {
        new_val = listKD[0].adm_bophan;
        emp_id = listKD[0].emp_id;
    } else {
        new_val = listKD[position_usc_kd + 1].adm_bophan;
        emp_id = listKD[position_usc_kd + 1].emp_id;
    }

    // if (use_test === 1) {
    //     new_val = 0;
    // }

    return {
        adm_bophan: new_val,
        emp_id: emp_id
    };
}

exports.recognition_tag_company = async(username, description) => {
    let lvID = "";
    try {
        let dataLV = await functions.getDataAxios(process.env.domain_ai_recommend + '/recognition_tag_company', {
            title_company: username,
            description_company: description,
            number: 1
        }, 5000);
        if (dataLV.data && dataLV.data.items.length > 0) {
            lvID = dataLV.data.items[0].id_tag;
        }
        return lvID;
    } catch (error) {
        return lvID;
    }

}

exports.checkItemStorage = (mimetype) => {
    if (!allowedTypes.includes(mimetype)) {
        return false;
    }
    return true;
}

exports.isImage = (mimetype) => {
    if (!allowedTypeImages.includes(mimetype)) {
        return false;
    }
    return true;
}

exports.uploadStorage = (user_id, file, type, time = null) => {
    var file_path = file.path;
    const path = this.geturlVideo(time);
    const now = functions.getTimeNow();
    let file_name;
    if (type == 'video') {
        const type_vd = file.type.replace('video/', '');
        file_name = `video_cpn_${user_id}_${now}.${type_vd}`;
    } else {
        file_name = now + "_" + file.name;
    }
    fs.rename(file_path, path + file_name, function(err) {
        if (err) throw err;
    });
    return { file_name };
};

exports.uploadLogo = (file, time = null) => {
    var file_path = file.path;
    const path = geturlImage(time),
        file_name = functions.getTimeNow() + "_" + file.name;

    fs.rename(file_path, path + file_name, function(err) {
        if (err) return false;
    });
    return { file_name };
}

exports.addStorage = async(usc_id, type, file_name) => {
    const now = functions.getTimeNow(),
        getItemMax = await CompanyStorage.findOne({}, { id_usc_img: 1 }).sort({ id_usc_img: -1 }).lean(),
        data = {
            id_usc_img: Number(getItemMax.id_usc_img) + 1,
            usc_id: usc_id,
            time_created: now,
            time_update: now
        };
    if (type == 'image') {
        data.image = file_name;
    } else {
        data.video = file_name;
    }
    const item = new CompanyStorage(data);
    await item.save();
}

exports.urlStorageImage = (time, image) => {
    let dateTime = functions.convertDate(time, true);
    url = `${urlCdnImage}/${dateTime}/${image}`;
    return url;
}

exports.urlStorageVideo = (time, video) => {
    let dateTime = functions.convertDate(time, true);
    url = `${urlCdnVideo}/${dateTime}/${video}`;
    return url;
}