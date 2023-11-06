// Khai báo service
const functions = require('../functions');
const serviceNew365 = require('../../services/timviec365/new');
const sendMail = require('../../services/timviec365/sendMail');

// Khai báo models
const Candidate = require('../../models/Users');
const Evaluate = require('../../models/Timviec365/Evaluate');
const applyForJob = require('../../models/Timviec365/UserOnSite/Candicate/ApplyForJob');
const NewTV365 = require('../../models/Timviec365/UserOnSite/Company/New');
const Notification = require('../../models/Timviec365/Notification');
const pointUsed = require('../../models/Timviec365/UserOnSite/Company/ManagerPoint/PointUsed');
const SaveCvCandi = require('../../models/Timviec365/UserOnSite/Candicate/SaveCvCandi'); // Cv đã lưu
const Profile = require('../../models/Timviec365/UserOnSite/Candicate/Profile');
const ImagesUser = require('../../models/Timviec365/UserOnSite/Candicate/ImagesUser');
const fs = require('fs');
const path = require('path');

exports.evaluate = async (use_id, com_id, type, content) => {
    // Check xem đã đánh giá hay chưa
    const evaluate = await Evaluate.findOne({
        usc_id: com_id,
        use_id: use_id
    }).lean(),
        now = functions.getTimeNow();

    // Nếu chưa đánh giá thì lưu lại vào bảng
    if (!evaluate) {
        const getItemMax = await Evaluate.findOne({}, { id: 1 }).sort({ id: -1 }).limit(1).lean();
        let data = {
            id: getItemMax.id + 1,
            usc_id: com_id,
            use_id: use_id,
            time_create: now
        };
        if (type == 1) {
            data.bx_uv = content;
        } else {
            data.bx_ntd = content;
        }
        const item = new Evaluate(data);
        item.save();
    } else {
        let condition = {
            time_create: now
        };
        if (type == 1) {
            condition.bx_uv = content;
        } else {
            condition.bx_ntd = content;
        }
        await Evaluate.updateOne({
            id: evaluate.id
        }, {
            $set: condition
        });
    }
}

exports.applyJob = async (new_id, use_id) => {
    const now = functions.getTimeNow();

    // Check xem đã ứng tuyển tin hay chưa
    const checkApplyForJob = await applyForJob.findOne({
        nhs_new_id: new_id,
        nhs_use_id: use_id,
        nhs_kq: { $ne: 10 }
    });
    if (!checkApplyForJob) {
        /* So sánh địa điểm tuyển dụng với tỉnh thành làm việc, tỉnh thành nơi ứng viên sinh 
        sống của ứng viên xem ứng viên có ứng tuyển sai hay không? */

        let user = await Candidate.aggregate([{
            $match: { idTimViec365: use_id, type: { $ne: 1 } }
        }, {
            $project: {
                city: 1,
                cv_city_id: "$inForPerson.candidate.cv_city_id"
            }
        }]);
        user = user[0];

        const job = await NewTV365.findOne({ new_id: new_id }, {
            new_city: 1,
            new_user_id: 1
        }).lean();
        let nhs_xn_uts = 1;

        if (job.new_city && job.new_city.indexOf(0) < 0) {
            for (let i = 0; i < job.new_city.length; i++) {
                const new_city = job.new_city[i];
                /* Nếu như địa điểm làm việc đó nằm trong ds địa điểm mong muốn 
                và khác với tỉnh thành sinh sống thì xác nhận ứng tuyển đúng */
                // if (user.cv_city_id.indexOf(new_city) > -1 || new_city == user.city) {
                //     nhs_xn_uts = 0;
                //     break;
                // }
            }
        } else {
            nhs_xn_uts = 0;
        }

        const com_id = job.new_user_id;

        // Lưu vào bảng ứng tuyển
        const itemMax = await applyForJob.findOne({}, { nhs_id: 1 }).sort({ nhs_id: -1 }).limit(1).lean(),
            item = new applyForJob({
                nhs_id: Number(itemMax.nhs_id) + 1,
                nhs_use_id: use_id,
                nhs_new_id: new_id,
                nhs_com_id: com_id,
                nhs_time: now,
                check_ut: 14,
                nhs_xn_uts: nhs_xn_uts
            });
        await item.save();

        // Cập nhật thời gian làm mới cho ứng viên
        await Candidate.updateOne({ _id: use_id }, {
            $set: {
                updatedAt: now
            }
        });

        // +10 điểm cho tin tuyển dụng khi được ứng tuyển
        NewTV365.updateOne({ new_id: new_id }, { $inc: { new_point: 10 } });

        // Lưu vào lịch sử
        const point = 10,
            type = 1;
        await serviceNew365.logHistoryNewPoint(new_id, point, type);

        // Thêm vào thông báo tại quả chuông
        let not_id = 1;
        const itemMaxNoti = await Notification.findOne({}, { not_id: 1 }).sort({ not_id: -1 }).limit(1).lean();
        if (itemMaxNoti) {
            not_id = Number(itemMaxNoti.not_id) + 1
        }
        const itemNoti = new Notification({
            not_id: not_id,
            usc_id: com_id,
            not_time: now,
            new_id: new_id,
            not_active: 1,
        });
        await itemNoti.save();

        // Thêm vào bảng sử dụng điểm
        const itemPointUsed = new pointUsed({
            usc_id: com_id,
            use_id: use_id,
            point: 1,
            type: 1,
            used_day: now,
        });
        await itemPointUsed.save();

        return true;
    }
    return false;
}

exports.updateCandidate = async (use_id) => {
    await Candidate.updateOne({ _id: use_id }, {
        $set: {
            "inForPerson.candidate": {
                use_type: 0
            },
        }
    });
}

exports.getUrlVideo = (createTime, video) => {
    return `${process.env.cdn}/pictures/cv/${functions.convertDate(createTime, true)}/${video}`;
}

exports.getUrlProfile = (createTime, profile) => {
    return `${process.env.cdn}/pictures/cv/${functions.convertDate(createTime, true)}/${profile}`;
}

exports.uploadProfile = async (file_cv, createdAt) => {
    const targetDirectory = `${process.env.storage_tv365}/pictures/cv/${functions.convertDate(createdAt, true)}`;
    const typeFile = functions.fileType(file_cv);
    // Đặt lại tên file
    const originalname = file_cv.originalFilename;
    const extension = originalname.split('.').pop();
    const uniqueSuffix = Date.now();
    const now = functions.getTimeNow();
    let nameFile = `cv_${uniqueSuffix}.${extension}`;
    if (typeFile == "mp4" || typeFile == "quicktime") {
        if (typeFile == "mp4") {
            nameFile = `video_uv_${now}.mp4`;
        } else {
            nameFile = `video_uv_${now}.mov`;
        }
    }

    if (!fs.existsSync(targetDirectory)) { // Nếu thư mục chưa tồn tại thì tạo mới
        fs.mkdirSync(targetDirectory, { recursive: true });
    }

    // Đường dẫn tới file cũ
    const oldFilePath = file_cv.path;

    // Đường dẫn tới file mới
    const newFilePath = path.join(targetDirectory, nameFile);

    // Di chuyển file và đổi tên file
    fs.rename(oldFilePath, newFilePath, async function (err) {
        if (err) {
            console.error(err);
            return false;
        }
    });
    return { typeFile, nameFile };
}

//Tính phần trăm hoàn thiện hồ sơ của UV
exports.percentHTHS = async (userID) => {
    let percent = 0;
    let user = await functions.getDatafindOne(Candidate, { idTimViec365: userID, type: 0 });
    if (user) {
        let checkCV = await functions.getDatafindOne(SaveCvCandi, { uid: userID });
        let checkImg = await functions.getDatafindOne(ImagesUser, { img_user_id: userID });
        let profile = await functions.getDatafindOne(Profile, { hs_use_id: userID });
        let userCV = user.inForPerson ? user.inForPerson.candidate : null;
        let userInfo = user.inForPerson ? user.inForPerson.account : null;
        let checkUserPercent = {
            userCity: user.city ? 0.5 : 0,
            userDistrict: user.district ? 0.5 : 0,
            userAddress: user.address ? 0.5 : 0,
            userCate: userCV && userCV.cv_cate_id.length ? 6 : 0,
            userPosition: userCV && userCV.cv_capbac_id ? 1 : 0,
            userCVCity: userCV && userCV.cv_city_id.length ? 6 : 0,
            userSharePermission: user.sharePermissionId.length ? 0.5 : 0,
            userBirthday: userInfo.birthday ? 4 : 0,
            userGender: userInfo.gender ? 5 : 0,
            userCareerGoal: userCV.cv_muctieu ? 6 : 0,
            userEducation: userCV.profileDegree.length ? 5 : 0,
            userSkill: userCV.cv_kynang ? 0.5 : 0,
            userExperience: userCV.profileExperience.length ? 8 : 0, //5% kinh nghiệm, 3% dự án tham gia
            userCertificate: userCV.profileNgoaiNgu.length ? 0.5 : 0,
            userPrize: userCV.cv_giai_thuong ? 0.5 : 0,
            userActivity: userCV.cv_hoat_dong ? 0.5 : 0,
            userProject: userCV.cv_duan ? 3 : 0,
            userInterest: userCV.cv_so_thich ? 0.5 : 0,
            userReference: userCV.cv_tc_phone ? 0.5 : 0,
            userImage: checkImg ? 1 : 0,
            userMoney: userCV.cv_money_id ? 1 : 0,
            userMarried: userInfo.married ? 1 : 0,
            userWay: userCV.cv_loaihinh_id ? 5 : 0,
            userReview: 0,
            userView: user.view ? 0.5 : 0,
            userCVShow: (profile && profile.hs_name) || checkCV || userCV.cv_video ? 45 : 0
        }

        Object.keys(checkUserPercent).forEach((key) => {
            percent += checkUserPercent[key];
        })
    }
    return percent;
}


exports.checkImageSize = async (idTimViec365) => {
    const user = await Candidate.findOne({ idTimViec365 }).lean();
    let fileSize = 0;
    if (user) {
        const d = new Date(user.createdAt * 1000),
            day = d.getDate() < 10 ? "0" + d.getDate() : d.getDate(),
            month = d.getMonth() < 10 ? "0" + Number(d.getMonth() + 1) : d.getMonth(),
            year = d.getFullYear();
        const dir = `${process.env.storage_tv365}/pictures/cv/${year}/${month}/${day}/`;
        //check file ảnh
        listFile = await ImagesUser.find({ img_user_id: idTimViec365 }).lean();
        if (listFile) {
            listFile.forEach((img, i) => {
                let filePath = dir + img.img;
                let stats = fs.statSync(filePath);
                if (stats) {
                    let fileSizeInBytes = stats.size;
                    let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
                    fileSize += fileSizeInMegabytes;
                }
            })
        }

        //check video
        if (user.inForPerson.candidate && user.inForPerson.candidate.cv_video_type == 1) {
            let filePath = dir + user.inForPerson.candidate.cv_video;
            let stats = fs.statSync(filePath);
            if (stats) {
                let fileSizeInBytes = stats.size;
                let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
                fileSize += fileSizeInMegabytes;
            }
        }
    }
    return fileSize;
}