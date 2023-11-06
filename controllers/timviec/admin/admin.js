const md5 = require('md5');

const Users = require('../../../models/Users');
const AdminUser = require('../../../models/Timviec365/Admin/AdminUser');
const Modules = require('../../../models/Timviec365/Admin/Modules');
const functions = require('../../../services/functions');
const AdminUserRight = require('../../../models/Timviec365/Admin/AdminUserRight');
const AdminTranslate = require('../../../models/Timviec365/Admin/AdminTranslate');
const { recordCreditsHistory } = require("../credits");
const PointCompany = require("../../../models/Timviec365/UserOnSite/Company/ManagerPoint/PointCompany")
const service = require('../../../services/timviec365/candidate');
const Profile = require('../../../models/Timviec365/UserOnSite/Candicate/Profile');
const SaveCvCandi = require('../../../models/Timviec365/UserOnSite/Candicate/SaveCvCandi'); // Cv đã lưu
const Category = require('../../../models/Timviec365/CategoryJob');
const path = require('path');
const fs = require('fs');
const HoSoUV = require('../../../models/Timviec365/CV/ResumeUV'); // Sơ yếu lý lịch đã lưu
const LetterUV = require('../../../models/Timviec365/CV/LetterUV'); // Thư xin việc đã lưu


const getIP = (req) => {
    let forwardedIpsStr = req.header('x-forwarded-for');
    let ip = '';
    if (forwardedIpsStr) {
        ip = forwardedIpsStr.split(',')[0];
    } else {
        ip = req.socket.remoteAddress
    }
    return ip;
}

// Đăng nhập
// exports.login = async(req, res) => {
//     try {
//         if (req.body.adm_loginname && req.body.adm_password) {
//             const loginName = req.body.adm_loginname
//             const password = req.body.adm_password
//             let findUser = await functions.getDatafindOne(AdminUser, { loginName })
//             if (findUser) {
//                 let checkPassword = await functions.verifyPassword(password, findUser.password)
//                 if (checkPassword) {
//                     let updateUser = await functions.getDatafindOneAndUpdate(AdminUser, { loginName }, {
//                         date: new Date(Date.now())
//                     }, { new: true });
//                     const token = await functions.createToken(updateUser, "1d")
//                     return functions.success(res, 'Đăng nhập thành công', { token: token })
//                 }
//                 return functions.setError(res, "Mật khẩu sai", 406);
//             }
//             return functions.setError(res, "không tìm thấy tài khoản trong bảng admin user", 405)
//         }
//         return functions.setError(res, "Missing input value!", 404)
//     } catch (error) {
//         return functions.setError(res, error.message)
//     }

// }

exports.login = async (req, res) => {
    const { adm_loginname, adm_password } = req.body;
    const result = await AdminUser.findOne({
        adm_loginname: adm_loginname,
        adm_password: md5(adm_password)
    }).select('adm_id').lean();
    if (result) {
        result.timeLogin = functions.getTimeNow();
        const token = await functions.createToken(result, "1d");
        return functions.success(res, 'thành công', {
            adm_id: result.adm_id,
            token: token
        });
    }
    return functions.setError(res, 'vui lòng thử lại');
}

exports.translate = async (req, res) => {
    const list = await AdminTranslate.find();
    return functions.success(res, "", { data: list });
}

// hàm lấy dữ liệu modules
exports.getModules = async (req, res, next) => {
    try {
        const { isAdmin, user_id } = req.body;
        if (isAdmin == 1) {
            let modules = await Modules.find().sort({ mod_order: 1 }).lean();
            return functions.success(res, 'lấy dữ liệu thành công', {
                modules
            })
        } else {
            return functions.setError(res, '123');
        }


    } catch (error) {
        console.log(error)
        return functions.setError(res, error)
    }
};

exports.accessmodule = async (req, res) => {
    try {
        const { userlogin, password, module_id } = req.body;
        const check = await AdminUserRight.aggregate([{
            $lookup: {
                from: "AdminUser",
                localField: "adu_admin_id",
                foreignField: "adm_id",
                as: "admin"
            }
        }, {
            $unwind: "$admin"
        }, {
            $match: {
                "admin.adm_loginname": userlogin,
                "admin.adm_password": password,
                "admin.adm_active": 1,
                "admin.adm_delete": 0,
            }
        }, {
            $lookup: {
                from: "modules",
                localField: "adu_admin_module_id",
                foreignField: "mod_id",
                as: "modules",
            }
        }, {
            $unwind: "$modules"
        }, {
            $match: {
                "modules.mod_id": module_id
            }
        }, {
            $project: {
                module_id: "$modules.mod_id"
            }
        }]);
        return functions.success(res, "...", { check });
    } catch (error) {
        return functions.setError(res, error);
    }
}

// Lấy thông tin admin qua trường id bộ phận và không cần đăng nhập
exports.getInfoAdminUser = async (req, res) => {
    const adm_bophan = req.body.adm_bophan;
    if (adm_bophan) {
        const admin = await AdminUser.findOne({ adm_bophan: adm_bophan }).lean();
        return functions.success(res, "Thông tin KD", { admin });
    }
    return functions.setError(res, "Chưa truyền adm_bophan");
}

exports.infor = async (req, res) => {
    const { adm_id } = req.body;
    const admin = await AdminUser.findOne({ adm_id: adm_id }).lean();
    return functions.success(res, "Thông tin KD", { admin });
}

exports.inforBophan = async (req, res) => {
    const { adm_bophan } = req.body;
    const admin = await AdminUser.findOne({ adm_bophan: adm_bophan }).lean();
    return functions.success(res, "Thông tin KD", { admin });
}

exports.bophan_list = async (req, res) => {
    const list = await AdminUser.find({
        adm_bophan: { $ne: 0 }
    }).sort({
        adm_bophan: 1
    }).lean();
    return functions.success(res, "Thông tin KD", { data: list });
}


exports.listingCompany = async (req, res) => {
    let condition = {
        type: 1,
        "inForCompany.timviec365.usc_md5": ""
    };
    const list = await Users.find(condition).limit(30).lean();
    const count = await Users.countDocuments(condition);
    return functions.success(res, "Thông tin KD", {
        data: {
            list,
            count
        }
    });
}

// hàm lấy danh sách admin
exports.getListAdmin = async (req, res, next) => {
    try {
        let listADmin = await functions.getDatafind(AdminUser);
        return functions.success(res, 'lấy dữ liệu thành công', listADmin)

    } catch (error) {
        console.log(error)
        return functions.setError(res, error)
    }
}

// hàm xóa admin
exports.deleteAdmin = async (req, res, next) => {
    try {
        let id = req.user.data._id;
        if (id) {
            await AdminUser.deleteOne({ _id: id });
            let adminRight = await functions.getDatafind(AdminUserRight, { adminID: id })
            if (adminRight.length > 0) {
                await AdminUserRight.deleteMany({ adminID: id });
            }
            return functions.success(res, 'xóa thành công')
        }
    } catch (error) {
        console.log(error)
        return functions.setError(res, error)
    }
}

// hàm cập nhập active
exports.updateActive = async (req, res, next) => {
    try {
        let id = req.user.data._id;
        let active = req.body.active;
        if (id) {
            let admin = await functions.getDatafindOne(AdminUser, { _id: id })
            if (admin) {
                await AdminUser.updateOne({ _id: id }, {
                    $set: {
                        active: active,
                    }
                });
                return functions.success(res, 'cập nhập thành công')
            }
            return functions.setError(res, 'admin không tồn tại', 404)
        }
        return functions.setError(res, 'không đủ dữ liệu', 404)
    } catch (error) {
        console.log(error)
        return functions.setError(res, error)
    }
}

// hàm đổi mật khẩu 
exports.updatePassword = async (req, res, next) => {
    try {
        let id = req.user.data._id;
        let password = req.body.password;
        if (id) {
            let admin = await functions.getDatafindOne(AdminUser, { _id: id })
            if (admin) {
                await AdminUser.updateOne({ _id: id }, {
                    $set: {
                        password: md5(password),
                    }
                });
                return functions.success(res, 'cập nhập thành công')
            }
            return functions.setError(res, 'admin không tồn tại', 404)
        }
        return functions.setError(res, 'không đủ dữ liệu', 404)
    } catch (error) {
        console.log(error)
        return functions.setError(res, error)
    }
}

// luồng ứng viên
exports.candi_register = async (req, res) => {
    try {
        let condition = {
            fromDevice: { $nin: [4, 7] },
            type: 0,
            fromWeb: { $in: ["timviec365", "dev.timviec365"] }
        };
        const page = Number(req.body.page) || 1;
        const pageSize = Number(req.body.pageSize) || 30;

        const use_id = req.body.use_id;
        if (use_id != 0) {
            condition.idTimViec365 = Number(use_id);
        }
        const use_first_name = req.body.use_first_name;
        if (use_first_name != 0) {
            // condition.use_first_name = { $regex: use_first_name };
        }
        const list = await Users.aggregate([
            { $match: condition },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
                $project: {
                    use_id: "$idTimViec365",
                    use_logo: "$avatarUser",
                    use_create_time: "$createdAt",
                    use_first_name: "$userName",
                    use_gioi_tinh: "$inForPerson.account.gender" || null,
                    use_phone: "$phone",
                    use_email: "$email",
                    cv_title: "$inForPerson.candidate.cv_title",
                    use_address: "$address",
                    dk: "$fromDevice",
                    use_view: "$inForPerson.candidate.use_view",
                    use_phone_tk: "$phoneTK",
                    user_xac_thuc: "$otp" || null,
                    use_authentic: "$authentic",
                }
            }
        ]);
        const count = await Users.countDocuments(condition);
        return functions.success(res, "Danh sách", {
            data: {
                list,
                count
            }
        });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

exports.topupCredits = async (req, res) => {
    try {
        let {
            usc_id,
            amount,
            //0 là trừ tiền, 1 là nạp tiền
            type
        } = req.body;

        if (!type) type = 1;
        let idAdmin = req.user.data._id;
        let checkAdmin = await functions.getDatafindOne(AdminUser, { _id: idAdmin });
        if (checkAdmin) {
            if (usc_id && amount) {
                let company = await Users.findOne({ idTimViec365: usc_id, type: 1 });
                if (company) {
                    let doc = await PointCompany.findOne({ usc_id });
                    if (!doc) {
                        if (type === 1) {
                            doc = await (new PointCompany({
                                usc_id: usc_id,
                                money_usc: amount,
                            })).save();
                        } else if (type === 0) {
                            return functions.setError(res, "Trừ tiền không hợp lệ", 400);
                        } else {
                            return functions.setError(res, "Thao tác không hợp lệ", 400);
                        }
                    } else {
                        if (type === 1) {
                            doc = await PointCompany.findOneAndUpdate({ usc_id }, { $inc: { money_usc: amount } }, { new: true });
                        } else if (type === 0) {
                            doc = await PointCompany.findOneAndUpdate({ usc_id }, { $inc: { money_usc: -amount } }, { new: true });
                        } else {
                            return functions.setError(res, "Thao tác không hợp lệ", 400);
                        }
                    }

                    await recordCreditsHistory(
                        usc_id,
                        type === 1 ? 1 : 0,
                        amount,
                        checkAdmin.adm_id ? checkAdmin.adm_id : -1,
                        getIP(req),
                        `Ví 365`,
                        doc.money_usc,
                        0);
                    return functions.success(res, "Nạp tiền thành công!")
                } else {
                    return functions.setError(res, "Không tồn tại công ty có ID này", 400);
                }
            } else {
                return functions.setError(res, "Thiếu các trường cần thiết", 429);
            }
        } else {
            return functions.setError(res, 'Bạn không có quyền thực hiện hành động này!', 403)
        }
    } catch (error) {
        console.log(error);
        return functions.setError(res, error)
    }
}

exports.updateCandiDate = async (req, res) => {
    try {

        let idTimViec365 = req.body.idTimViec365
        let avatarUser = req.files.avatarUser
        let phoneTK = req.body.phoneTK
        let userName = req.body.userName
        let phone = req.body.phone
        let password = md5(req.body.password)
        let birthday = req.body.birthday
        let gender = req.body.gender
        let married = req.body.married
        let city = req.body.city
        let district = req.body.district
        let address = req.body.address
        let cv_city_id = req.body.cv_city_id
        let cv_title = req.body.cv_title
        let cv_cate_id = req.body.cv_cate_id
        let cv_capbac_id = req.body.cv_capbac_id
        let education = req.body.education
        let cv_money_id = req.body.cv_money_id
        let um_unit = req.body.um_unit
        let um_min_value = req.body.um_min_value
        let um_max_value = req.body.um_max_value
        let cv_loaihinh_id = req.body.cv_loaihinh_id
        let experience = req.body.experience
        let cv_muctieu = req.body.cv_muctieu
        let cv_kynang = req.body.cv_kynang
        let kn_mota = req.body.kn_mota
        let cv = req.files.cv
        let hs_lang_cv = req.body.hs_lang_cv
        let th_bc = req.body.th_bc //bằng cấp
        let th_name = req.body.th_name //trường học
        let th_one_time = req.body.th_one_time
        let th_two_time = req.body.th_two_time
        let th_cn = req.body.th_cn //chuyên ngành
        let th_xl = req.body.th_xl //xếp loại
        let th_bs = req.body.th_bs //bổ sung
        let kn_cv = req.body.kn_cv //chức danh vị trí
        let kn_name = req.body.kn_name //công ty
        let nn_cc = req.body.nn_cc //chứng chỉ
        let nn_sd = req.body.nn_sd //số điểm
        let um_type = req.body.um_type
        let use_lat = req.body.use_lat
        let use_long = req.body.use_long

        let findUser = await Users.findOne({ idTimViec365: idTimViec365, type: 0 })
        const now = functions.getTimeNow();

        if (findUser) {
            let condition = {
                updatedAt: functions.getTimeNow()
            };
            let conditionPush = {}
            if (use_lat) condition.latitude = use_lat
            if (use_long) condition.longitude = use_long
            if (um_type) {
                condition = { "inForPerson.candidate.um_type": um_type, ...condition };
            }
            if (avatarUser) {
                if (avatarUser.size > 0 && avatarUser.originalFilename != condition.avatarUser) {
                    const uploadLogo = functions.uploadImageUv(avatarUser, findUser.createdAt);
                    condition.avatarUser = uploadLogo.file_name;
                }
            }

            if (phoneTK) condition.phoneTK = phoneTK
            if (userName) condition.userName = userName
            if (phone) condition.phone = phone
            if (password) condition.password = password
            if (birthday) {
                condition = { "inForPerson.account.birthday": birthday, ...condition };
            }
            if (gender) {
                condition = { "inForPerson.account.gender": gender, ...condition };
            }
            if (married) {
                condition = { "inForPerson.account.married": married, ...condition };
            }
            if (city) condition.city = city
            if (district) condition.district = district
            if (address) condition.address = address
            if (cv_city_id) {
                condition = { "inForPerson.candidate.cv_city_id": cv_city_id, ...condition };
            }
            if (cv_title) {
                condition = { "inForPerson.candidate.cv_title": cv_title, ...condition };
            }
            if (cv_cate_id) {
                condition = { "inForPerson.candidate.cv_cate_id": cv_cate_id, ...condition };
            }
            if (cv_capbac_id) {
                condition = { "inForPerson.candidate.cv_capbac_id": cv_capbac_id, ...condition };
            }
            if (education) {
                condition = { "inForPerson.account.education": education, ...condition };
            }
            if (cv_money_id) {
                condition = { "inForPerson.candidate.cv_money_id": cv_money_id, ...condition };
            }
            if (um_unit) {
                condition = { "inForPerson.candidate.um_unit": um_unit, ...condition };
            }
            if (um_min_value) {
                condition = { "inForPerson.candidate.um_min_value": um_min_value, ...condition };
            }
            if (um_max_value) {
                condition = { "inForPerson.candidate.um_max_value": um_max_value, ...condition };
            }
            if (cv_loaihinh_id) {
                condition = { "inForPerson.candidate.cv_loaihinh_id": cv_loaihinh_id, ...condition };
            }
            if (experience) {
                condition = { "inForPerson.account.experience": experience, ...condition };
            }
            if (cv_muctieu) {
                condition = { "inForPerson.candidate.cv_muctieu": cv_muctieu, ...condition };
            }
            if (cv_kynang) {
                condition = { "inForPerson.candidate.cv_kynang": cv_kynang, ...condition };
            }
            if (cv && hs_lang_cv) {
                if (cv.size > 0) {
                    let uploadCv = await service.uploadProfile(cv, findUser.createdAt);
                    const now = functions.getTimeNow();

                    // Thêm mới
                    const getMaxIdProfile = await Profile.findOne({}, { hs_id: 1 }).sort({ hs_id: -1 }).limit(1).lean();
                    const dataUpload = {
                        hs_id: getMaxIdProfile.hs_id + 1,
                        hs_use_id: findUser.idTimViec365,
                        hs_name: req.files.cv.originalFilename,
                        hs_link: uploadCv.nameFile,
                        hs_create_time: now,
                        hs_active: 1
                    };
                    const profile = new Profile(dataUpload);
                    await profile.save();

                    if (Number(findUser.inForPerson.candidate.profileUpload.length) == 0) {
                        conditionPush = {
                            'inForPerson.candidate.profileUpload': {
                                hs_id: 1,
                                hs_name: req.files.cv.originalFilename,
                                hs_lang_cv: hs_lang_cv,
                                hs_link: uploadCv.nameFile,
                                hs_active: 1,
                                hs_update_time: Date.now()
                            },
                            ...conditionPush
                        }
                    } else {
                        conditionPush = {
                            'inForPerson.candidate.profileUpload': {
                                hs_id: Number(findUser.inForPerson.candidate.profileUpload.length) + 1,
                                hs_name: req.files.cv.originalFilename,
                                hs_lang_cv: hs_lang_cv,
                                hs_link: uploadCv.nameFile,
                                hs_active: 1,
                                hs_update_time: Date.now()
                            },
                            ...conditionPush
                        }
                        const profile = new Profile(dataUpload);
                        await profile.save();
                    }
                }
            }

            if (kn_mota && kn_name && kn_cv) {
                if (findUser.inForPerson.candidate.profileExperience.length == 0) {
                    conditionPush = {
                        'inForPerson.candidate.profileExperience': {
                            kn_id: 1,
                            kn_name: kn_name,
                            kn_cv: kn_cv,
                        },
                        ...conditionPush
                    }
                } else {
                    conditionPush = {
                        'inForPerson.candidate.profileExperience': {
                            kn_id: findUser.inForPerson.candidate.profileExperience.length + 1,
                            kn_name: kn_name,
                            kn_cv: kn_cv,
                        },
                        ...conditionPush
                    }
                }

            }

            if (th_bc && th_name && th_one_time && th_two_time && th_cn && th_xl && th_bs) {

                if (findUser.inForPerson.candidate.profileDegree.length == 0) {
                    conditionPush = {
                        'inForPerson.candidate.profileDegree': {
                            th_id: 1,
                            th_name: th_name,
                            th_one_time: th_one_time,
                            th_two_time: th_two_time,
                            th_cn: th_cn,
                            th_xl: th_xl,
                            th_bs: th_bs,
                            th_bc: th_bc
                        },
                        ...conditionPush
                    }
                } else {
                    conditionPush = {
                        'inForPerson.candidate.profileDegree': {
                            th_id: Number(findUser.inForPerson.candidate.profileDegree.length) + 1,
                            th_name: th_name,
                            th_one_time: th_one_time,
                            th_two_time: th_two_time,
                            th_cn: th_cn,
                            th_xl: th_xl,
                            th_bs: th_bs,
                            th_bc: th_bc
                        },
                        ...conditionPush
                    }
                }


            }

            if (nn_cc && nn_sd) {
                if (findUser.inForPerson.candidate.profileNgoaiNgu == 0) {
                    conditionPush = {
                        'inForPerson.candidate.profileNgoaiNgu': {
                            nn_id: 1,
                            nn_cc: nn_cc,
                            nn_sd: nn_sd,
                        },
                        ...conditionPush
                    }
                } else {
                    conditionPush = {
                        'inForPerson.candidate.profileNgoaiNgu': {
                            nn_id: findUser.inForPerson.candidate.profileNgoaiNgu.length + 1,
                            nn_cc: nn_cc,
                            nn_sd: nn_sd,
                        },
                        ...conditionPush
                    }
                }

            }

            condition = { $push: conditionPush, ...condition }
            await Users.findOneAndUpdate({ idTimViec365 }, condition)
        } else return functions.setError(res, "không tìm thấy user này");


        // let count = await Users.countDocuments(condition);
        return functions.success(res, "Cập nhật thông tin ứng viên thành công");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

exports.infoCandidate = async (req, res, next) => {
    try {
        if (req.body.iduser) {
            const userId = Number(req.body.iduser);
            const useraggre = await Users.aggregate([{
                $match: {
                    idTimViec365: userId,
                    type: { $ne: 1 }
                }
            }, {
                $project: {
                    _id: 0,
                    "use_id": "$idTimViec365",
                    "use_email": "$email",
                    "use_phone_tk": "$phoneTK",
                    "use_phone": "$phone",
                    "use_first_name": "$userName",
                    "use_update_time": "$updatedAt",
                    "use_create_time": "$createdAt",
                    "use_logo": "$avatarUser",
                    "use_email_lienhe": "$emailContact",
                    "use_gioi_tinh": "$inForPerson.account.gender",
                    "use_birth_day": "$inForPerson.account.birthday",
                    "use_city": "$city",
                    "use_quanhuyen": "$district",
                    "use_address": "$address",
                    "use_hon_nhan": "$inForPerson.account.married",
                    "use_view": "$inForPerson.candidate.use_view",
                    "use_authentic": "$authentic",
                    "cv_user_id": "$idTimViec365",
                    "cv_title": "$inForPerson.candidate.cv_title",
                    "cv_exp": "$inForPerson.account.experience",
                    "cv_muctieu": "$inForPerson.candidate.cv_muctieu",
                    "cv_cate_id": "$inForPerson.candidate.cv_cate_id",
                    "cv_city_id": "$inForPerson.candidate.cv_city_id",
                    "cv_capbac_id": "$inForPerson.candidate.cv_capbac_id",
                    "cv_money_id": "$inForPerson.candidate.cv_money_id",
                    "cv_loaihinh_id": "$inForPerson.candidate.cv_loaihinh_id",
                    "cv_kynang": "$inForPerson.candidate.cv_kynang",
                    "cv_tc_name": "$inForPerson.candidate.cv_tc_name",
                    "cv_tc_cv": "$inForPerson.candidate.cv_tc_cv",
                    "cv_tc_phone": "$inForPerson.candidate.cv_tc_phone",
                    "cv_tc_email": "$inForPerson.candidate.cv_tc_email",
                    "cv_tc_company": "$inForPerson.candidate.cv_tc_company",
                    "cv_video": "$inForPerson.candidate.cv_video",
                    "cv_video_type": "$inForPerson.candidate.cv_video_type",
                    "cv_hocvan": "$inForPerson.account.education",
                    "um_type": "$inForPerson.candidate.um_type",
                    "um_min_value": "$inForPerson.candidate.um_min_value",
                    "um_max_value": "$inForPerson.candidate.um_max_value",
                    "um_unit": "$inForPerson.candidate.um_unit",
                    "muc_luong": "$inForPerson.candidate.muc_luong",
                    "profileDegree": "$inForPerson.candidate.profileDegree",
                    "profileNgoaiNgu": "$inForPerson.candidate.profileNgoaiNgu",
                    "profileExperience": "$inForPerson.candidate.profileExperience",
                    "user_xac_thuc": "$otp",
                    "use_show": "$inForPerson.candidate.use_show",
                    "chat365_id": "$_id",
                    "candidate": "$inForPerson.candidate",
                    "id_qlc": "$idQLC"
                }
            }]);
            if (useraggre.length > 0) {
                let userInfo = useraggre[0],
                    // Thông tin bằng cấp
                    bang_cap = (userInfo.profileDegree) ? userInfo.profileDegree : [],
                    // Thông tin ngoại ngữ
                    ngoai_ngu = (userInfo.profileNgoaiNgu) ? userInfo.profileNgoaiNgu : [],
                    // Thông tin kinh nghiệm
                    kinh_nghiem = (userInfo.profileExperience) ? userInfo.profileExperience : [];

                // Cập nhật đường dẫn ảnh đại diện
                userInfo.use_logo = functions.getImageUv(userInfo.use_create_time, userInfo.use_logo);
                if (userInfo.cv_city_id) {
                    userInfo.cv_city_id = userInfo.cv_city_id.toString();
                }
                const cv_cate_id = userInfo.cv_cate_id;
                if (userInfo.cv_cate_id) {
                    userInfo.cv_cate_id = userInfo.cv_cate_id.toString();
                }
                const getCvInfor = await SaveCvCandi.findOne({
                    uid: userInfo.use_id
                }).sort({ _id: -1 }).limit(1);
                userInfo.name_img = getCvInfor ? functions.imageCv(userInfo.use_create_time, getCvInfor.name_img) : "";
                userInfo.name_img_hide = getCvInfor ? functions.imageCv(userInfo.use_create_time, getCvInfor.name_img_hide) : "";
                // Cập nhật đường dẫn video
                if (userInfo.cv_video && userInfo.cv_video_type == 1) {
                    userInfo.cv_video = service.getUrlVideo(userInfo.use_create_time, userInfo.cv_video)
                }
                const getFileUpLoad = await Profile.findOne({
                    hs_link: { $ne: '' },
                    hs_use_id: userInfo.use_id,
                }).sort({ hs_active: -1, hs_id: -1 }).limit(1);
                let fileUpLoad = "";
                if (getFileUpLoad) {
                    fileUpLoad = {
                        hs_link: getFileUpLoad.hs_link,
                        hs_link_hide: getFileUpLoad.hs_link_hide,
                        hs_link_full: service.getUrlProfile(userInfo.use_create_time, getFileUpLoad.hs_link)
                    };
                }
                userInfo.fileUpLoad = fileUpLoad;
                let don_xin_viec,
                    thu_xin_viec,
                    syll;
                don_xin_viec = await SaveCvCandi.findOne({ uid: userId }, { name_img: 1 }).sort({ id: -1 }).limit(1).lean();
                thu_xin_viec = await LetterUV.findOne({ uid: userId }, { name_img: 1 }).sort({ id: -1 }).limit(1).lean();
                syll = await HoSoUV.findOne({ uid: userId }, { name_img: 1 }).sort({ id: -1 }).limit(1).lean();
                return functions.success(res, "Hiển thị chi tiết ứng viên thành công", {
                    thong_tin: userInfo,
                    bang_cap,
                    ngoai_ngu,
                    kinh_nghiem,
                    don_xin_viec,
                    thu_xin_viec,
                    syll
                });
            }
            return functions.setError(res, "Không có thông tin user", 400);
        }
        return functions.setError(res, "thông tin truyền lên không đầy đủ", 400);

    } catch (e) {
        console.log(e);
        return functions.setError(res, "Đã có lỗi xảy ra");
    }
}



exports.insertCandiDate = async (req, res) => {
    try {
        let avatarUser = req.files.avatarUser
        let phoneTK = req.body.phoneTK
        let userName = req.body.userName
        let phone = req.body.phone
        let emailContact = req.body.emailContact
        let password = md5(req.body.password)
        let birthday = req.body.birthday
        let gender = req.body.gender
        let married = req.body.married
        let city = req.body.city
        let district = req.body.district
        let address = req.body.address
        let cv_city_id = req.body.cv_city_id
        let cv_title = req.body.cv_title
        let cv_cate_id = req.body.cv_cate_id
        let cv_capbac_id = req.body.cv_capbac_id
        let education = req.body.education
        let cv_money_id = req.body.cv_money_id
        let um_unit = req.body.um_unit
        let um_min_value = req.body.um_min_value
        let um_max_value = req.body.um_max_value
        let cv_loaihinh_id = req.body.cv_loaihinh_id
        let experience = req.body.experience
        let cv_muctieu = req.body.cv_muctieu
        let cv_kynang = req.body.cv_kynang
        let kn_mota = req.body.kn_mota
        let cv = req.files.cv
        let hs_lang_cv = req.body.hs_lang_cv
        let th_bc = req.body.th_bc //bằng cấp
        let th_name = req.body.th_name //trường học
        let th_one_time = req.body.th_one_time
        let th_two_time = req.body.th_two_time
        let th_cn = req.body.th_cn //chuyên ngành
        let th_xl = req.body.th_xl //xếp loại
        let th_bs = req.body.th_bs //bổ sung
        let kn_cv = req.body.kn_cv //chức danh vị trí
        let kn_name = req.body.kn_name //công ty
        let nn_cc = req.body.nn_cc //chứng chỉ
        let nn_sd = req.body.nn_sd //số điểm

        const getMaxIdTimViec = await Users.findOne({}, { idTimViec365: 1 }).sort({ idTimViec365: -1 }).limit(1).lean()
        const getMaxIdChat = await Users.findOne({}, { _id: 1 }).sort({ _id: -1 }).limit(1).lean()
        // console.log(req.files)

        let condition = {
            _id: getMaxIdChat._id + 1,
            idTimViec365: getMaxIdTimViec.idTimViec365 + 1,
            type: 0,
            updatedAt: functions.getTimeNow()
        };

        if (avatarUser) {
            condition.avatarUser = req.files.avatarUser[0].originalname
        }

        if (phoneTK) condition.phoneTK = phoneTK
        if (userName) condition.userName = userName
        if (phone) condition.phone = phone
        if (password) condition.password = password
        if (emailContact) condition.emailContact = emailContact
        if (birthday) {
            condition = { "inForPerson.account.birthday": birthday, ...condition };
        }
        if (gender) {
            condition = { "inForPerson.account.gender": gender, ...condition };
        }
        if (married) {
            condition = { "inForPerson.account.married": married, ...condition };
        }
        if (city) condition.city = city
        if (district) condition.district = district
        if (address) condition.address = address
        if (cv_city_id) {
            condition = { "inForPerson.candidate.cv_city_id": cv_city_id, ...condition };
        }
        if (cv_title) {
            condition = { "inForPerson.candidate.cv_title": cv_title, ...condition };
        }
        if (cv_cate_id) {
            condition = { "inForPerson.candidate.cv_cate_id": cv_cate_id, ...condition };
        }
        if (cv_capbac_id) {
            condition = { "inForPerson.candidate.cv_capbac_id": cv_capbac_id, ...condition };
        }
        if (education) {
            condition = { "inForPerson.account.education": education, ...condition };
        }
        if (cv_money_id) {
            condition = { "inForPerson.candidate.cv_money_id": cv_money_id, ...condition };
        }
        if (um_unit) {
            condition = { "inForPerson.candidate.um_unit": um_unit, ...condition };
        }
        if (um_min_value) {
            condition = { "inForPerson.candidate.um_min_value": um_min_value, ...condition };
        }
        if (um_max_value) {
            condition = { "inForPerson.candidate.um_max_value": um_max_value, ...condition };
        }
        if (cv_loaihinh_id) {
            condition = { "inForPerson.candidate.cv_loaihinh_id": cv_loaihinh_id, ...condition };
        }
        if (experience) {
            condition = { "inForPerson.account.experience": experience, ...condition };
        }
        if (cv_muctieu) {
            condition = { "inForPerson.candidate.cv_muctieu": cv_muctieu, ...condition };
        }
        if (cv_kynang) {
            condition = { "inForPerson.candidate.cv_kynang": cv_kynang, ...condition };
        }

        if (cv && hs_lang_cv) {
            const now = functions.getTimeNow();

            // Thêm mới
            const getMaxIdProfile = await Profile.findOne({}, { hs_id: 1 }).sort({ hs_id: -1 }).limit(1).lean();
            const dataUpload = {
                hs_id: getMaxIdProfile.hs_id + 1,
                hs_use_id: getMaxIdTimViec.idTimViec365 + 1,
                hs_name: req.files.cv[0].originalname,
                hs_create_time: now,
                hs_active: 1
            };
            const profile = new Profile(dataUpload);
            await profile.save();
            condition = {
                'inForPerson.candidate.profileUpload': {
                    hs_id: 1,
                    hs_name: req.files.cv[0].originalname,
                    hs_lang_cv: hs_lang_cv,
                    hs_link: req.files.cv[0].filename,
                    hs_active: 1,
                    hs_update_time: Date.now()
                },
                ...condition
            }
        }

        if (kn_mota && kn_name && kn_cv) {
            condition = {
                'inForPerson.candidate.profileExperience': {
                    kn_id: 1,
                    kn_name: kn_name,
                    kn_cv: kn_cv,
                },
                ...condition
            }

        }

        if (th_bc && th_name && th_one_time && th_two_time && th_cn && th_xl && th_bs) {
            condition = {
                'inForPerson.candidate.profileDegree': {
                    th_id: 1,
                    th_name: th_name,
                    th_one_time: th_one_time,
                    th_two_time: th_two_time,
                    th_cn: th_cn,
                    th_xl: th_xl,
                    th_bs: th_bs,
                    th_bc: th_bc
                },
                ...condition
            }
        }

        if (nn_cc && nn_sd) {
            condition = {
                'inForPerson.candidate.profileNgoaiNgu': {
                    nn_id: 1,
                    nn_cc: nn_cc,
                    nn_sd: nn_sd,
                },
                ...condition
            }

        }
        const newUser = new Users(condition);
        await newUser.save();

        // let count = await Users.countDocuments(condition);
        return functions.success(res, "Thêm mới ứng viên thành công");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}


//làm mới hồ sơ
exports.RefreshProfile = async (req, res, next) => {
    try {
        if (req.body.idTimViec365) {
            let idTimViec365 = req.body.idTimViec365

            await Users.updateOne({ idTimViec365: idTimViec365 }, {
                $set: {
                    updatedAt: functions.getTimeNow()
                }
            });

            return functions.success(res, "Làm mới hồ sơ thành công");
        } else {
            return functions.setError(res, "thông tin truyền lên không đầy đủ", 400);
        }
    } catch (e) {
        console.log("Đã có lỗi xảy ra khi cập nhật kỹ năng bản thân", e);
        return functions.setError(res, "Đã có lỗi xảy ra", 400);
    }
}

exports.topupCredits = async (req, res) => {
    try {
        let {
            usc_id,
            amount,
            //0 là trừ tiền, 1 là nạp tiền
            type
        } = req.body;
        if (!type) type = 1;
        let idAdmin = req.user.data._id;
        let checkAdmin = await functions.getDatafindOne(AdminUser, { _id: idAdmin });
        if (checkAdmin) {
            if (usc_id && amount) {
                let company = await Users.findOne({ idTimViec365: usc_id, type: 1 });
                if (company) {
                    let doc = await PointCompany.findOne({ usc_id });
                    if (!doc) {
                        if (type === 1) {
                            doc = await (new PointCompany({
                                usc_id: usc_id,
                                money_usc: amount,
                            })).save();
                        } else if (type === 0) {
                            return functions.setError(res, "Trừ tiền không hợp lệ", 400);
                        } else {
                            return functions.setError(res, "Thao tác không hợp lệ", 400);
                        }
                    } else {
                        if (type === 1) {
                            doc = await PointCompany.findOneAndUpdate({ usc_id }, { $inc: { money_usc: amount } }, { new: true });
                        } else if (type === 0) {
                            doc = await PointCompany.findOneAndUpdate({ usc_id }, { $inc: { money_usc: -amount } }, { new: true });
                        } else {
                            return functions.setError(res, "Thao tác không hợp lệ", 400);
                        }
                    }

                    await recordCreditsHistory(
                        usc_id,
                        type === 1 ? 1 : 0,
                        amount,
                        idAdmin,
                        getIP(req),
                        `Ví 365`,
                        doc.money_usc,
                        0);
                    return functions.success(res, "Nạp tiền thành công!")
                } else {
                    return functions.setError(res, "Không tồn tại công ty có ID này", 400);
                }
            } else {
                return functions.setError(res, "Thiếu các trường cần thiết", 429);
            }
        } else {
            return functions.setError(res, 'Bạn không có quyền thực hiện hành động này!', 403)
        }
    } catch (error) {
        console.log(error);
        return functions.setError(res, error)
    }
}