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

const jwt = require('jsonwebtoken');
// giới hạn dung lượng video < 100MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
// danh sách các loại video cho phép
const allowedTypes = ['.mp4', '.mov', '.avi', '.wmv', '.flv'];
// giới hạn dung lượng ảnh < 2MB
const MAX_IMG_SIZE = 10 * 1024 * 1024;
// giới hạn dung lượng kho ảnh
exports.MAX_Kho_Anh = 300 * 1024 * 1024;

const functions = require('../functions');

// import model
const AdminUserRaoNhanh365 = require('../../models/Raonhanh365/Admin/AdminUser');
const AdminUserRight = require('../../models/Raonhanh365/Admin/AdminUserRight');
const Category = require('../../models/Raonhanh365/Category');
const CateDetail = require('../../models/Raonhanh365/CateDetail');
const Tags = require('../../models/Raonhanh365/Tags');
const CateVL = require('../../models/Raonhanh365/CateVl');
const User = require('../../models/Users');
const FormData = require('form-data');
const City = require("../../models/City");
const District = require("../../models/District");
const Keywords = require("../../models/Raonhanh365/Keywords");
const CateVl = require("../../models/Raonhanh365/CateVl");
dotenv.config();

const arrFolder = [
    'do_dien_tu',
    'dangtin_xeco',
    'dichvu_giaitri',
    'dangtin_bds',
    'thoi_trang',
    'dangtin_ship',
    'dangtin_suckhoesacdep',
    'noi_ngoai_that',
    'khuyen_mai',
    'dtin_thethao',
    'du_lich',
    'dangtin_dodung',
    'thuc_pham',
    'dangtin_thucung',
    'timviec',
    'thuc_pham',
]

// hàm tạo link title
exports.createLinkTilte = (input) => {
    input = input.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
    str = input.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.toLowerCase();
    str = str.replaceAll(' ', '-')
    return str
}
exports.deleteFileRaoNhanh = (id, file) => {
    let filePath = `../storage/base365/raonhanh365/pictures/avt_tindangmua/` + file;
    fs.unlink(filePath, (err) => {
        if (err) console.log(err);
    });
}
exports.checkNameCateRaoNhanh = async(data) => {
    switch (data) {
        case 'Đồ điện tử':
            return 'electroniceDevice'
        case 'Xe cộ':
            return 'vehicle'
        case 'Bất động sản':
            return 'realEstate'
        case 'Ship':
            return 'ship'
        case 'Thú cưng':
            return 'pet'
        case 'Việc làm':
            return 'Job'
        case 'Thực phẩm, Đồ uống':
            return 'food'
        case 'Đồ gia dụng':
            return 'wareHouse'
        case 'Sức khỏe - Sắc đẹp':
            return 'beautifull'
        case 'Thể thao':
            return 'Thể thao'
        case 'Du lịch':
            return 'Du lịch'
        case 'Đồ dùng văn phòng, công nông nghiệp':
            return 'Đồ dùng văn phòng, công nông nghiệp'
        case 'Nội thất - Ngoại thất':
            return 'noiThatNgoaiThat'
    }
}

// // hàm tạo link file rao nhanh 365
// exports.createLinkFileRaonhanh = (folder, id, name) => {
//     let link = process.env.DOMAIN_RAO_NHANH + '/base365/raonhanh365/pictures/' + folder + '/' + id + '/' + name;
//     return link;
// }


exports.uploadFileRaoNhanh = async(folder, id, file, allowedExtensions, time, type) => {
    let path1 = '';
    let filePath = '';
    if (type === 'comment') {
        path1 = `../storage/base365/raonhanh365/pictures/${folder}/${id}`;
        filePath = `../storage/base365/raonhanh365/pictures/${folder}/${id}/${time}_${file.name}`;
    } else {
        path1 = `../storage/base365/raonhanh365/pictures/${folder}/`;
        filePath = `../storage/base365/raonhanh365/pictures/${folder}/${time}_${file.name}`;
    }


    let fileCheck = path.extname(filePath);
    if (allowedExtensions.includes(fileCheck.toLocaleLowerCase()) === false) {
        return false
    }
    if (!fs.existsSync(path1)) {
        fs.mkdirSync(path1, { recursive: true });
    }
    fs.readFile(file.path, (err, data) => {
        if (err) {
            return false
        }
        fs.writeFile(filePath, data, (err) => {
            if (err) {
                return false
            }
        });
    });
    return file.name
}

exports.uploadFileRN2 = (folder, file, allowedExtensions) => {
    let path1 = `../storage/base365/raonhanh365/pictures/${folder}/`;
    let filePath = `../storage/base365/raonhanh365/pictures/${folder}/` + file.name;
    let fileCheck = path.extname(filePath);
    if (allowedExtensions.includes(fileCheck.toLocaleLowerCase()) === false) {
        return false;
    }
    if (!fs.existsSync(path1)) {
        fs.mkdirSync(path1, { recursive: true });
    }
    fs.readFile(file.path, (err, data) => {
        if (err) {
            return false
        }
        fs.writeFile(filePath, data, (err) => {
            if (err) {
                return false
            }
        });
    });
    return file.name
}
exports.uploadFileBase64RaoNhanh = async(folder, id, base64String, file) => {
    let path1 = `../storage/base365/raonhanh365/pictures/${folder}/${id}/`;
    // let filePath = `../storage/base365/raonhanh365/pictures/${folder}/${id}/` + file.name;
    if (!fs.existsSync(path1)) {
        fs.mkdirSync(path1, { recursive: true });
    }
    var matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches.length !== 3) {
        return false;
    }

    let type = matches[1];
    let data = Buffer.from(matches[2], 'base64');

    const imageName = `${Date.now()}.${type.split("/")[1]}`;
    fs.writeFile(path1 + imageName, data, (err) => {
        if (err) {
            console.log(err)
        }
    });
}

// ham check admin rao nhanh 365
exports.isAdminRN365 = async(req, res, next) => {
    let user = req.user.data;

    let admin = await functions.getDatafindOne(AdminUserRaoNhanh365, { _id: user._id, active: 1 });
    if (admin && admin.active == 1) {
        req.infoAdmin = admin;
        return next();
    }
    return res.status(403).json({ message: "is not admin RN365 or not active" });
}

exports.checkRight = (moduleId, perId) => {
    return async(req, res, next) => {
        try {
            if (!moduleId || !perId) {
                return functions.setError(res, "Missing input moduleId or perId", 505);
            }
            let infoAdmin = req.infoAdmin;
            if (infoAdmin.isAdmin) return next();
            let permission = await AdminUserRight.findOne({ adminId: infoAdmin._id, moduleId: moduleId }, { add: 1, edit: 1, delete: 1 });
            if (!permission) {
                return functions.setError(res, "No right", 403);
            }
            if (perId == 1) return next();
            if (perId == 2 && permission.add == 1) return next();
            if (perId == 3 && permission.edit == 1) return next();
            if (perId == 4 && permission.delete == 1) return next();
            return functions.setError(res, "No right", 403);
        } catch (e) {
            return res.status(505).json({ message: e });
        }

    };
};

exports.checkTokenUser = async(req, res, next) => {
    try {
        if (req.headers && req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];
            return jwt.decode(token).data.idRaoNhanh365
        } else {
            return null;
        }
    } catch (error) {
        return null
    }

}
exports.checkFolderCateRaoNhanh = async(data) => {
        switch (data) {
            case 'Đồ điện tử':
                return 'do_dien_tu'
            case 'Xe cộ':
                return 'dangtin_xeco'
            case 'Dịch vụ - Giải trí':
                return 'dichvu_giaitri'
            case 'Bất động sản':
                return 'dangtin_bds'
            case 'Thời trang':
                return 'thoi_trang'
            case 'Ship':
                return 'dangtin_ship'
            case 'Sức khỏe - Sắc đẹp':
                return 'dangtin_suckhoesacdep'
            case 'Nội thất - Ngoại thất':
                return 'noi_ngoai_that'
            case 'Khuyến mại - Giảm giá':
                return 'khuyen_mai'
            case 'Thể thao':
                return 'dtin_thethao'
            case 'Du lịch':
                return 'du_lich'
            case 'Đồ dùng văn phòng, công nông nghiệp':
                return 'dangtin_dodung'
            case 'Thực phẩm, Đồ uống':
                return 'thuc_pham'
            case 'Thú cưng':
                return 'dangtin_thucung'
            case 'Việc làm':
                return 'timviec'
            case 'Thực phẩm, Đồ uống':
                return 'thuc_pham'
            case 'Đồ gia dụng':
                return 'dangtin_dodung'
            case 'Mẹ và Bé':
                return 'dangtin_dodung'
            case 'Thủ công - Mỹ nghệ - Quà tặng':
                return 'dangtin_dodung'
        }
    }
    // lấy tên danh mục
exports.getNameCate = async(cateId, number) => {
        let danh_muc1 = null;
        let danh_muc2 = null;
        cate1 = await Category.findById(cateId).lean();
        if (!cate1) return null;
        if (cate1)
            danh_muc1 = cate1.name;
        if (cate1 && cate1.parentId !== 0) {
            cate2 = await Category.findById(cate1.parentId).lean();
            if (cate2)
                danh_muc2 = cate2.name;
        }
        let name = {};
        name.danh_muc1 = danh_muc1
        name.danh_muc2 = danh_muc2
        if (number === 2) {
            return name
        } else if (danh_muc2) {
            return danh_muc2
        } else if (danh_muc1) {
            return danh_muc1
        }
    }
    // lấy link file
    // exports.getLinkFile = async (userID, file, cateId, buySell) => {
    //     try {
    //         let nameCate = await this.getNameCate(cateId, 1);
    //         let folder = await this.checkFolderCateRaoNhanh(nameCate);
    //         if (cateId == 121) folder = 'timviec';
    //         if (cateId == 120) folder = 'ungvien';
    //         let domain = '';
    //         if (process.env.DOMAIN_RAO_NHANH) domain = process.env.DOMAIN_RAO_NHANH
    //         else domain = `http://210.245.108.202:3004`
    //         let link = `${domain}/pictures/${folder}/`;
    //         if (buySell == 1) link = `${domain}/pictures/avt_tindangmua/`;
    //         let res = '';
    //         let arr = [];
    //         for (let i = 0; i < file.length; i++) {
    //             if (file[i].nameImg) {
    //                 res = link + file[i].nameImg;
    //                 arr.push({ nameImg: res })
    //             }
    //         }
    //         return arr;
    //     } catch (err) {
    //         console.log(err)
    //         return
    //     }

// }

// lấy avatar user
exports.getLinkAvatarUser = async(id, name) => {
    let link = `${process.env.DOMAIN_RAO_NHANH}/pictures/avt_dangtin/${name}`;
    return link;
}

// hàm chứa item serch của chi tiết tin
exports.searchItem = async(type) => {
    if (type === 1) {
        return searchitem = {
            _id: 1,
            title: 1,
            money: 1,
            endvalue: 1,
            city: 1,
            userID: 1,
            img: 1,
            cateID: 1,
            updateTime: 1,
            type: 1,
            active: 1,
            until: 1,
            address: 1,
            ward: 1,
            detailCategory: 1,
            district: 1,
            viewCount: 1,
            apartmentNumber: 1,
            com_city: 1,
            com_district: 1,
            com_ward: 1,
            com_address_num: 1,
            bidding: 1,
            tgian_kt: 1,
            tgian_bd: 1,
            name: 1,
            phone: 1,
            buySell: 1,
            video: 1,
            brand: 1,
            kich_co: 1,
            cateID: 1,
            title: 1,
            name: 1,
            city: 1,
            district: 1,
            ward: 1,
            description: 1,
            status: 1,
            endvalue: 1,
            money: 1,
            until: 1,
            noidung_nhs: 1,
            com_city: 1,
            com_district: 1,
            com_ward: 1,
            com_address_num: 1,
            han_bat_dau: 1,
            han_su_dung: 1,
            tgian_bd: 1,
            tgian_kt: 1,
            donvi_thau: 1,
            phi_duthau: 1,
            phone: 1,
            email: 1,
            linkImage: 1,
            infoSell: 1,
            new_job_kind: 1,
            user: { _id: 1, idRaoNhanh365: 1, phone: 1, isOnline: 1, avatarUser: 1, inforRN365: 1, createdAt: 1, userName: 1, type: 1, chat365_secret: 1, email: 1, lastActivedAt: 1, time_login: 1 },
        };
    } else if (type === 2) {
        return searchitem = {
            _id: 1,
            title: 1,
            linkTitle: 1,
            free: 1,
            infoSell: 1,
            address: 1,
            money: 1,
            createTime: 1,
            cateID: 1,
            pinHome: 1,
            pinCate: 1,
            new_day_tin: 1,
            buySell: 1,
            email: 1,
            tgian_kt: 1,
            tgian_bd: 1,
            phone: 1,
            apartmentNumber: 1,
            the_tich: 1,
            userID: 1,
            img: 1,
            updateTime: 1,
            user: { _id: 1, idRaoNhanh365: 1, isOnline: 1, phone: 1, avatarUser: 1, inforRN365: 1, userName: 1, type: 1, chat365_secret: 1, email: 1, lastActivedAt: 1, time_login: 1 },
            district: 1,
            ward: 1,
            description: 1,
            city: 1,
            brand: 1,
            warranty: 1,
            islove: '1',
            mon_the_thao: 1,
            mau_sac: 1,
            until: 1,
            endvalue: 1,
            chat_lieu: 1,
            type: 1,
            detailCategory: 1,
            infoSell: 1,
            timePromotionStart: 1,
            timePromotionEnd: 1,
            quantitySold: 1,
            infoSell: 1,
            viewCount: 1,
            addressNumber: 1,
            han_su_dung: '$beautifull.han_su_dung',
            poster: 1,
            sold: 1,
            com_city: 1,
            'xuat_xu': '$vehicle.xuat_xu',
            video: 1,
            kich_co: 1,
            district: 1,
            ward: 1,
            status: 1,
            mau_sac: 1,
            com_address_num: 1,
            buySell: 1,
            totalSold: 1,
            quantityMin: 1,
            quantityMax: 1,
            productGroup: 1,
            productType: 1
        }
    }
}

// lấy tin tương tự cho chi tiết tin
exports.tinTuongTu = async(res, New, check, id_new, userId, LoveNews) => {
    try {
        let tintuongtu = await New.aggregate([
            { $match: { cateID: check.cateID, active: 1, sold: 0, _id: { $ne: id_new } } },
            { $sort: { createTime: -1 } },
            { $limit: 6 },
            {
                $lookup: {
                    from: 'Users',
                    foreignField: 'idRaoNhanh365',
                    localField: 'userID',
                    as: 'user'
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    linkTitle: 1,
                    free: 1,
                    address: 1,
                    money: 1,
                    createTime: 1,
                    cateID: 1,
                    pinHome: 1,
                    userID: 1,
                    img: 1,
                    updateTime: 1,
                    user: { _id: 1, avatarUser: 1, phone: 1, userName: 1, type: 1, chat365_secret: 1, 'inforRN365.xacThucLienket': 1, email: 1, 'inforRN365.store_name': 1, lastActivedAt: 1, time_login: 1 },
                    district: 1,
                    ward: 1,
                    city: 1,
                    dia_chi: 1,
                    islove: 1,
                    until: 1,
                    endvalue: 1,
                    active: 1,
                    type: 1,
                    sold: 1,
                    createTime: 1,
                    free: 1,
                    buySell: 1
                }
            }
        ]);
        if (tintuongtu.length !== 0) {
            for (let i = 0; i < tintuongtu.length; i++) {
                if (tintuongtu[i].user && tintuongtu[i].user.avatarUser) {
                    tintuongtu[i].user.avatarUser = await exports.getLinkAvatarUser(tintuongtu[i].user.idRaoNhanh365, tintuongtu[i].user.avatarUser);
                }
                if (tintuongtu[i].img) {
                    tintuongtu[i].img = await exports.getLinkFile(tintuongtu[i].img, tintuongtu[i].cateID, tintuongtu[i].buySell);
                    tintuongtu[i].soluonganh = tintuongtu[i].img.length;
                }
                tintuongtu[i].buySell == 1 ? tintuongtu[i].link = `https://raonhanh.vn/${tintuongtu[i].linkTitle}-ct${tintuongtu[i]._id}.html` : tintuongtu[i].link = `https://raonhanh.vn/${tintuongtu[i].linkTitle}-c${tintuongtu[i]._id}.html`
                if (userId) {
                    let dataLoveNew = await LoveNews.findOne({ id_user: userId, id_new: tintuongtu[i]._id });
                    if (dataLoveNew) tintuongtu[i].islove = 1;
                    else tintuongtu[i].islove = 0;
                } else {
                    tintuongtu[i].islove = 0;
                }
            }
        }
        return tintuongtu
    } catch (error) {
        return null
    }
}

// lấy like comment cho chi tiết tin
exports.getComment = async(res, Comments, LikeRN, url, sort, cm_start, cm_limit) => {
    try {
        let ListComment = [];
        if (sort == 1) {
            ListComment = await Comments.find({ url, parent_id: 0 }).sort({ _id: -1 }).skip(cm_start).limit(cm_limit).lean();
        } else {
            ListComment = await Comments.find({ url, parent_id: 0 }).sort({ _id: 1 }).skip(cm_start).limit(cm_limit).lean();
        }
        for (let i = 0; i < ListComment.length; i++) {

            if (ListComment[i].sender_idchat) {

                let checkuser = await User.findOne({ idRaoNhanh365: ListComment[i].sender_idchat }, { idRaoNhanh365: 1, avatarUser: 1, userName: 1 }).lean();

                if (checkuser) {
                    if (checkuser.avatarUser) {
                        let avatar = await this.getLinkAvatarUser(checkuser.idRaoNhanh365, checkuser.avatarUser)
                        ListComment[i].avatar = avatar;
                    }
                    ListComment[i].name = checkuser.userName;
                } else {
                    ListComment[i].avatar = null;
                    ListComment[i].name = null;
                }
            } else {
                ListComment[i].avatar = null;
                ListComment[i].name = null;
            }
        }
        // let NumberCommentChild = await Comments.countDocuments({ url, parent_id: { $ne: 0 } });
        let ListReplyComment = [];
        let ListLikeComment = [];
        let ListLikeCommentChild = [];
        if (ListComment.length !== 0) {
            for (let i = 0; i < ListComment.length; i++) {
                ListLikeComment = await LikeRN.find({ forUrlNew: url, type: { $lt: 8 }, commentId: ListComment[i]._id }, {}, { type: 1 })
                ListReplyComment = await Comments.find({ url, parent_id: ListComment[i]._id }, {}, { time: -1 }).limit(3).lean();
                let NumberCommentChild = await Comments.countDocuments({ url, parent_id: ListComment[i]._id });
                // lấy lượt like của từng trả lời
                if (ListReplyComment && ListReplyComment.length > 0) {
                    for (let j = 0; j < ListReplyComment.length; j++) {
                        ListLikeCommentChild = await LikeRN.find({ forUrlNew: url, type: { $lt: 8 }, commentId: ListReplyComment[j]._id }, {}, { type: 1 })
                        let checkuser = await User.findOne({ idRaoNhanh365: ListReplyComment[i].sender_idchat }, { idRaoNhanh365: 1, avatarUser: 1, userName: 1 }).lean();
                        if (checkuser && checkuser.avatarUser) {
                            let avatar = await this.getLinkAvatarUser(checkuser.idRaoNhanh365, checkuser.avatarUser)
                            ListReplyComment[i].avatar = avatar;
                            ListReplyComment[i].name = checkuser.userName;
                        }
                        ListReplyComment[j].ListLikeCommentChild = ListLikeCommentChild
                        if (ListReplyComment[j].img) {
                            ListReplyComment[j].img = process.env.DOMAIN_RAO_NHANH + '/' + ListReplyComment[j].img
                        }
                        ListReplyComment[j].NumberLikeCommentChild = ListLikeCommentChild.length
                    }
                }
                ListComment[i].ListLikeComment = ListLikeComment
                ListComment[i].ListReplyComment = ListReplyComment
                ListComment[i].NumberCommentChild = NumberCommentChild
                ListComment[i].NumberLikeComment = ListLikeComment.length
                if (ListComment[i].img) {
                    ListComment[i].img = process.env.DOMAIN_RAO_NHANH + '/' + ListComment[i].img
                }
            }
        }
        return ListComment
    } catch (error) {
        return null
    }
}

// lấy thông tin đấu thầu nếu là tin mua
exports.getDataBidding = async(res, Bidding, id_new, Evaluate, sort) => {
    try {
        let dataBidding = await Bidding.aggregate([
            { $match: { newId: id_new } },
            { $sort: { _id: sort } },
            {
                $lookup: {
                    from: "Users",
                    localField: 'userID',
                    foreignField: 'idRaoNhanh365',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    user: { _id: 1, idRaoNhanh365: 1, phone: 1, avatarUser: 1, 'inforRN365.xacThucLienket': 1, createdAt: 1, userName: 1, type: 1, chat365_secret: 1, email: 1 },
                    _id: 1,
                    userName: 1,
                    userIntro: 1,
                    userFile: 1,
                    userProfile: 1,
                    userProfileFile: 1,
                    productName: 1,
                    productDesc: 1,
                    productLink: 1,
                    price: 1,
                    priceUnit: 1,
                    promotion: 1,
                    promotionFile: 1,
                    status: 1,
                    createTime: 1,
                    note: 1,
                    updatedAt: 1,
                    status: 1
                }
            }
        ])
        if (dataBidding.length !== 0) {
            for (let i = 0; i < dataBidding.length; i++) {
                if (dataBidding[i].user && dataBidding[i].user.avatarUser) {
                    dataBidding[i].user.avatarUser = await exports.getLinkAvatarUser(dataBidding[i].user.idRaoNhanh365, dataBidding[i].user.avatarUser);
                }
                if (dataBidding[i].userFile) {
                    dataBidding[i].userFile = process.env.DOMAIN_RAO_NHANH + '/pictures/avt_tindangmua/' + dataBidding[i].userFile;
                }
                if (dataBidding[i].userProfileFile) {
                    dataBidding[i].userProfileFile = process.env.DOMAIN_RAO_NHANH + '/pictures/avt_tindangmua/' + dataBidding[i].userProfileFile;
                }
                if (dataBidding[i].promotionFile) {
                    dataBidding[i].promotionFile = process.env.DOMAIN_RAO_NHANH + '/pictures/avt_tindangmua/' + dataBidding[i].promotionFile;
                }
                dataBidding[i].user.thongTinSao = await this.getInfoEnvaluate(res, Evaluate, dataBidding[i].user.idRaoNhanh365)
            }
        }
        return dataBidding
    } catch (error) {
        return null
    }
}

// lấy thông tin sao của user
exports.getInfoEnvaluate = async(res, Evaluate, userID) => {
    try {
        let cousao = await Evaluate.find({ blUser: userID, parentId: 0, newId: 0, active: 1 }).count();
        let sumsao = await Evaluate.aggregate([
            { $match: { blUser: userID, parentId: 0, newId: 0, active: 1 } },
            {
                $group: {
                    _id: null,
                    count: { $sum: "$stars" }
                }
            }
        ]);
        let thongTinSao = {};
        if (sumsao && sumsao.length !== 0) {
            thongTinSao.cousao = cousao;
            thongTinSao.sumsao = sumsao[0].count;
        }
        return thongTinSao;
    } catch (error) {
        return null
    }
}
const jobKind = [
    { _id: 1, name: 'Toàn thời gian' },
    { _id: 2, name: 'Bán thời gian' },
    { _id: 3, name: 'Giờ hành chính' },
    { _id: 4, name: 'Ca sáng' },
    { _id: 5, name: 'Ca chiều' },
    { _id: 6, name: 'Ca đêm' },
];

const payBy = [
    { _id: 1, name: 'Theo giờ' },
    { _id: 2, name: 'Theo ngày' },
    { _id: 3, name: 'Theo tuần' },
    { _id: 4, name: 'Theo tháng' },
    { _id: 5, name: 'Theo năm' },
];

const degree = [
    { _id: 1, name: 'Đại học' },
    { _id: 2, name: 'Cao đẳng' },
    { _id: 3, name: 'Lao động phổ thông' },
];

const can_ban_mua = [
    { _id: 1, name: 'Cần bán' },
    { _id: 2, name: 'Cho thuê' },
    { _id: 3, name: 'Cần mua' },
    { _id: 4, name: 'Cần thuê' },
];

const giay_to_phap_ly = [
    { _id: 1, name: 'Đã có sổ' },
    { _id: 2, name: 'Đang chờ sổ' },
    { _id: 3, name: 'Giấy tờ khác' },
];

const tinh_trang_noi_that = [
    { _id: 1, name: 'Nội thất cao cấp' },
    { _id: 2, name: 'Nội thất đầy đủ' },
    { _id: 3, name: 'Hoàn thiện cơ bản' },
    { _id: 4, name: 'Bàn giao thô' },

];

const huong_chinh = [
    { _id: 1, name: 'Đông' },
    { _id: 2, name: 'Tây' },
    { _id: 3, name: 'Nam' },
    { _id: 4, name: 'Bắc' },
    { _id: 5, name: 'Đông bắc' },
    { _id: 6, name: 'Đông nam' },
    { _id: 7, name: 'Tây bắc' },
    { _id: 8, name: 'Tây nam' },
];

const huong_ban_cong = [
    { _id: 1, name: 'Đông' },
    { _id: 2, name: 'Tây' },
    { _id: 3, name: 'Nam' },
    { _id: 4, name: 'Bắc' },
    { _id: 5, name: 'Đông bắc' },
    { _id: 6, name: 'Đông nam' },
    { _id: 7, name: 'Tây bắc' },
    { _id: 8, name: 'Tây nam' },
];

const loai_hinh_dat = [
    { _id: 1, name: 'Đất thổ cư' },
    { _id: 2, name: 'Đất nền dự án' },
    { _id: 3, name: 'Đất công nghiệp' },
    { _id: 4, name: 'Đất nông nghiệp' },
];

const loaihinh_vp = [
    { _id: 1, name: 'Mặt bằng kinh doanh' },
    { _id: 2, name: 'Văn phòng' },
    { _id: 3, name: 'Shophouse' },
    { _id: 4, name: 'Officetel' },
];

const tinh_trang_bds = [
    { _id: 1, name: 'Đã bàn giao' },
    { _id: 2, name: 'Chưa bàn giao' },
];

const cangoc = [
    { _id: 1, name: 'Có' },
    { _id: 2, name: 'Không' },
];

const dac_diem = [
    { _id: 1, name: 'Hẻm xe hơi' },
    { _id: 2, name: 'Nở hậu' },
    { _id: 3, name: 'Mặt tiền' },
];

const hop_so = [
    { _id: 1, name: 'Tự động' },
    { _id: 2, name: 'Số sàn' },
    { _id: 3, name: 'Bán tự động' },
];

const loai_hinh_canho = [
    { _id: 1, name: 'Chung cư' },
    { _id: 2, name: 'Duplex' },
    { _id: 3, name: 'Penthouse' },
    { _id: 4, name: 'Căn hộ dịch vụ, mini' },
    { _id: 5, name: 'Tập thể, cư xá' },
    { _id: 6, name: 'Officetel' },
];

const nhien_lieu = [
    { _id: 1, name: 'xăng' },
    { _id: 2, name: 'dầu' },
    { _id: 3, name: 'Động cơ Hybird' },
    { _id: 4, name: 'điện' },
];

const loai_xe = [
    { _id: 2094, name: 'xe máy' },
    { _id: 2095, name: 'xe ba gác' },
    { _id: 2096, name: 'xe tải 500 kg' },
    { _id: 2097, name: 'xe tải 750kg' },
    { _id: 2098, name: 'xe tải 1.4 tấn' },
    { _id: 2099, name: 'xe tải 1.9 tấn' },
    { _id: 2100, name: 'xe tải 2.5 tấn' },
    { _id: 2101, name: 'Xe tải 7 - 15 tấn' },
    { _id: 2102, name: 'Xe tải 16 - 40 tấn' },
]

const checkGenderPet = [
        { _id: 38, name: 'Gà trống' },
        { _id: 39, name: 'Gà Mái' },
        { _id: 40, name: 'Chó đực' },
        { _id: 41, name: 'Chó cái' },
        { _id: 42, name: 'Mèo đực' },
        { _id: 43, name: 'Mèo cái' },
        { _id: 44, name: 'Chim trống' },
        { _id: 45, name: 'Chim mái' },
        { _id: 46, name: 'Khác (không xác định được)' },
        { _id: 47, name: 'Đực' },
        { _id: 48, name: 'Cái' },
    ]
    // hàm xửl lý tên mặt hàng cho danh mục
exports.getDataNewDetail = async(data_object, cate) => {
    try {
        let check = await CateDetail.findOne({ _id: cate }).lean();
        if (!check) check = {
            allType: [],
            brand: [],
            capacity: [],
            colors: [],
            origin: [],
            petInfo: [],
            petPurebred: [],
            processor: [],
            productGroup: [],
            productMaterial: [],
            productShape: [],
            screen: [],
            sport: [],
            storyAndRoom: [],
            warranty: [],
            yearManufacture: [],
        };
        let checkk = await CateDetail.findOne({ _id: 2 }).lean();
        // job và bất động sản
        if (data_object.Job && data_object.Job.jobKind != '0' && data_object.Job.jobKind != '') {
            let data = jobKind.find(item => item._id == data_object.Job.jobKind)
            data_object.Job.jobKind_id = data_object.Job.jobKind
            if (data) data_object.Job.jobKind = data.name.replace('\r', '')
        }

        if (data_object.Job && data_object.Job.payBy != '0' && data_object.Job.payBy != '') {
            let data = payBy.find(item => item._id == data_object.Job.payBy)
            data_object.Job.payBy_id = data_object.Job.payBy
            if (data) data_object.Job.payBy = data.name.replace('\r', '')
        }

        if (data_object.Job && data_object.Job.degree != '0' && data_object.Job.degree != '') {
            let data = degree.find(item => item._id == data_object.Job.degree)
            data_object.Job.degree_id = data_object.Job.degree
            if (data) data_object.Job.degree = data.name.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.can_ban_mua != '0' && data_object.realEstate.can_ban_mua != '') {
            let data = can_ban_mua.find(item => item._id == data_object.realEstate.can_ban_mua)
            data_object.realEstate.can_ban_mua_id = data_object.realEstate.can_ban_mua
            if (data) data_object.realEstate.can_ban_mua = data.name.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.giay_to_phap_ly != '0' && data_object.realEstate.giay_to_phap_ly != '') {
            let data = giay_to_phap_ly.find(item => item._id == data_object.realEstate.giay_to_phap_ly)
            data_object.realEstate.giay_to_phap_ly_id = data_object.realEstate.giay_to_phap_ly
            if (data) data_object.realEstate.giay_to_phap_ly = data.name.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.so_pngu != '0' && data_object.realEstate.so_pngu != '') {
            let checkTopCache = await CateDetail.findOne({ _id: 11 }).lean();
            let data = checkTopCache.storyAndRoom.find(item => item._id == data_object.realEstate.so_pngu)
            data_object.realEstate.so_pngu_id = data_object.realEstate.so_pngu
            if (data) data_object.realEstate.so_pngu = data.quantity.replace('\r', '')
        }
        if (data_object.realEstate && data_object.realEstate.so_pve_sinh != '0' && data_object.realEstate.so_pve_sinh != '') {
            let checkTopCache = await CateDetail.findOne({ _id: 11 }).lean();
            let data = checkTopCache.storyAndRoom.find(item => item._id == data_object.realEstate.so_pve_sinh)
            if (data) data_object.realEstate.so_pve_sinh = data.quantity.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.tinh_trang_noi_that != '0' && data_object.realEstate.tinh_trang_noi_that != '') {
            let data = tinh_trang_noi_that.find(item => item._id == data_object.realEstate.tinh_trang_noi_that)
            data_object.realEstate.tinh_trang_noi_that_id = data_object.realEstate.tinh_trang_noi_that
            if (data) data_object.realEstate.tinh_trang_noi_that = data.name.replace('\r', '')
        }

        if (data_object.beautifull && data_object.beautifull.loai_hinh_sp != '0' && data_object.beautifull.loai_hinh_sp != '') {
            let checkkk = await CateDetail.findOne({ _id: 22 }).lean();
            let data = checkkk.allType.find(item => item._id == data_object.beautifull.loai_hinh_sp)
            data_object.beautifull.loai_hinh_sp_id = data_object.beautifull.loai_hinh_sp
            if (data) data_object.beautifull.loai_hinh_sp = data.name.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.loai_hinh_canho != '0' && data_object.realEstate.loai_hinh_canho != '') {
            let data = loai_hinh_canho.find(item => item._id == data_object.realEstate.loai_hinh_canho)
            data_object.realEstate.loai_hinh_canho_id = data_object.realEstate.loai_hinh_canho
            if (data) data_object.realEstate.loai_hinh_canho = data.name.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.huong_chinh != '0' && data_object.realEstate.huong_chinh != '') {

            let data = huong_chinh.find(item => item._id == data_object.realEstate.huong_chinh)
            data_object.realEstate.huong_chinh_id = data_object.realEstate.huong_chinh
            if (data) data_object.realEstate.huong_chinh = data.name.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.huong_ban_cong != '0' && data_object.realEstate.huong_ban_cong != '') {
            let data = huong_ban_cong.find(item => item._id == data_object.realEstate.huong_ban_cong)
            data_object.realEstate.huong_ban_cong_id = data_object.realEstate.huong_ban_cong
            if (data) data_object.realEstate.huong_ban_cong = data.name.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.loai_hinh_dat != '0' && data_object.realEstate.loai_hinh_dat != '') {
            let data = loai_hinh_dat.find(item => item._id == data_object.realEstate.loai_hinh_dat)
            data_object.realEstate.loai_hinh_dat_id = data_object.realEstate.loai_hinh_dat
            if (data) data_object.realEstate.loai_hinh_dat = data.name.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.loaihinh_vp != '0' && data_object.realEstate.loaihinh_vp != '') {
            let data = loaihinh_vp.find(item => item._id == data_object.realEstate.loaihinh_vp)
            data_object.realEstate.loaihinh_vp_id = data_object.realEstate.loaihinh_vp
            if (data) data_object.realEstate.loaihinh_vp = data.name.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.tinh_trang_bds != '0' && data_object.realEstate.tinh_trang_bds != '') {
            let data = tinh_trang_bds.find(item => item._id == data_object.realEstate.tinh_trang_bds)
            data_object.realEstate.tinh_trang_bds_id = data_object.realEstate.tinh_trang_bds
            if (data) data_object.realEstate.tinh_trang_bds = data.name.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.cangoc != '0' && data_object.realEstate.cangoc != '') {
            let data = cangoc.find(item => item._id == data_object.realEstate.cangoc)
            data_object.realEstate.cango_id = data_object.realEstate.cangoc
            if (data) data_object.realEstate.cangoc = data.name.replace('\r', '')
        }

        if (data_object.realEstate && data_object.realEstate.dac_diem != '0' && data_object.realEstate.dac_diem != '') {
            let str = '';
            let arr = data_object.realEstate.dac_diem.split(',');
            data_object.realEstate.dac_diem_id = data_object.realEstate.dac_diem
            for (let i = 0; i < arr.length; i++) {
                let data = dac_diem.find(item => item._id == arr[i]);
                str += data.name + ', '
            }
            data_object.realEstate.dac_diem = str
        }

        if (data_object.brand != '0' && data_object.brand != '') {
            let data = check.brand.find(item => item._id == data_object.brand)
            data_object.brand_id = data_object.brand
            if (data) data_object.brand = data.name.replace('\r', '')
        }

        if (cate == 41 && data_object.brand != '0' && data_object.brand != '') {
            let check = await CateDetail.findOne({ _id: 40 }).lean();
            if (check) {
                let data = check.brand.find(item => item._id == data_object.brand)
                if (data) data_object.brand = data.name.replace('\r', '')
            }
            data_object.brand_id = data_object.brand
        }

        if (data_object.electroniceDevice && data_object.electroniceDevice.machineSeries != '0' && data_object.electroniceDevice.machineSeries != '') {
            let data = check.allType.find(item => item._id == data_object.electroniceDevice.machineSeries)
            data_object.electroniceDevice.machineSeries_id = data_object.electroniceDevice.machineSeries
            if (data) data_object.electroniceDevice.machineSeries = data.name.replace('\r', '')
        }

        if (cate == 99 && data_object.electroniceDevice && data_object.electroniceDevice.machineSeries != '0' && data_object.electroniceDevice.machineSeries != '') {
            let checkbrand = check.brand.find(item => item.name == data_object.brand)
            if (checkbrand) {
                let data = checkbrand.line.find(item => item._id == data_object.electroniceDevice.machineSeries)
                data_object.electroniceDevice.machineSeries_id = data_object.electroniceDevice.machineSeries
                if (data) data_object.electroniceDevice.machineSeries = data.name.replace('\r', '')
            }
        }

        if (data_object.vehicle && data_object.vehicle.dong_xe != '0' && data_object.vehicle.dong_xe != '') {
            let data = checkk.allType.find(item => item._id == data_object.vehicle.dong_xe)
            data_object.vehicle.dong_xe_id = data_object.vehicle.dong_xe
            if (data) data_object.vehicle.dong_xe = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.nam_san_xuat != '0' && data_object.vehicle.nam_san_xuat != '') {
            let data = checkk.yearManufacture.find(item => item._id == data_object.vehicle.nam_san_xuat)
            data_object.vehicle.nam_san_xuat_id = data_object.vehicle.nam_san_xuat
            if (data) data_object.vehicle.nam_san_xuat = data.year.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.dung_tich != '0' && data_object.vehicle.dung_tich != '') {
            let data = check.capacity.find(item => item._id == data_object.vehicle.dung_tich)
            data_object.vehicle.dung_tich_id = data_object.vehicle.dung_tich
            if (data) data_object.vehicle.dung_tich = data.name.replace('\r', '')
        }
        if (cate == 36 && data_object.xuat_xu != '0' && data_object.xuat_xu != '') {
            let data = check.origin.find(item => item._id == data_object.xuat_xu)
            data_object.xuat_xu_id = data_object.xuat_xu
            if (data) data_object.xuat_xu = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.kieu_dang != '0' && data_object.vehicle.kieu_dang != '') {
            let data = check.productShape.find(item => item._id == data_object.vehicle.kieu_dang)
            data_object.vehicle.kieu_dang_id = data_object.vehicle.kieu_dang
            if (data) data_object.vehicle.kieu_dang = data.name.replace('\r', '')
        }

        if (cate == 10 && data_object.vehicle && data_object.vehicle.kieu_dang != '0' && data_object.vehicle.kieu_dang != '') {
            let data = checkk.productShape.find(item => item._id == data_object.vehicle.kieu_dang)
            data_object.vehicle.kieu_dang_id = data_object.vehicle.kieu_dang
            if (data) data_object.vehicle.kieu_dang = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.trong_tai != '0' && data_object.vehicle.trong_tai != '') {
            let data = check.capacity.find(item => item._id == data_object.vehicle.trong_tai)
            data_object.vehicle.trong_tai_id = data_object.vehicle.trong_tai
            if (data) data_object.vehicle.trong_tai = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.loai_noithat != '0' && data_object.vehicle.loai_noithat != '') {
            let data = check.allType.find(item => item._id == data_object.vehicle.loai_noithat)
            data_object.vehicle.loai_noithat_id = data_object.vehicle.loai_noithat
            if (data) data_object.vehicle.loai_noithat = data.name.replace('\r', '')
        }

        if (cate == 42 && data_object.vehicle && data_object.vehicle.loai_noithat != '0' && data_object.vehicle.loai_noithat != '') {
            let data = checkk.allType.find(item => item._id == data_object.vehicle.loai_noithat)
            data_object.vehicle.loai_noithat_id = data_object.vehicle.loai_noithat
            if (data) data_object.vehicle.loai_noithat = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.dong_co != '0' && data_object.vehicle.dong_co != '') {
            let data = check.capacity.find(item => item._id == data_object.vehicle.dong_co)
            data_object.vehicle.dong_co_id = data_object.vehicle.dong_co
            if (data) data_object.vehicle.dong_co = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.mau_sac != '0' && data_object.vehicle.mau_sac != '') {
            let data = checkk.colors.find(item => item._id == data_object.vehicle.mau_sac)
            data_object.vehicle.mau_sac_id = data_object.vehicle.mau_sac
            if (data) data_object.vehicle.mau_sac = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.loai_xe != '0' && data_object.vehicle.loai_xe != '') {
            let data = checkk.allType.find(item => item._id == data_object.vehicle.loai_xe)
            data_object.vehicle.loai_xe_id = data_object.vehicle.loai_xe
            if (data) data_object.vehicle.loai_xe = data.name.replace('\r', '')
        }

        if (cate == 9 && data_object.vehicle && data_object.vehicle.loai_xe != '0' && data_object.vehicle.loai_xe != '') {
            let data = check.allType.find(item => item._id == data_object.vehicle.loai_xe)
            data_object.vehicle.loai_xe_id = data_object.vehicle.loai_xe
            if (data) data_object.vehicle.loai_xe = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.xuat_xu != '0' && data_object.vehicle.xuat_xu != '') {
            let data = checkk.origin.find(item => item._id == data_object.vehicle.xuat_xu)
            data_object.vehicle.xuat_xu_id = data_object.vehicle.xuat_xu
            if (data) data_object.vehicle.xuat_xu = data.name.replace('\r', '')
        }

        if (data_object.electroniceDevice && data_object.electroniceDevice.microprocessor != '0' && data_object.electroniceDevice.microprocessor != '') {
            let data = check.processor.find(item => item._id == data_object.electroniceDevice.microprocessor)
            data_object.electroniceDevice.microprocessor_id = data_object.electroniceDevice.microprocessor
            if (data) data_object.electroniceDevice.microprocessor = data.name.replace('\r', '')
        }

        if (data_object.electroniceDevice && data_object.electroniceDevice.ram != '0' && data_object.electroniceDevice.ram != '') {
            let data = check.capacity.find(item => item._id == data_object.electroniceDevice.ram)
            data_object.electroniceDevice.ram_id = data_object.electroniceDevice.ram
            if (data) data_object.electroniceDevice.ram = data.name.replace('\r', '')
        }

        if (data_object.electroniceDevice && data_object.electroniceDevice.capacity != '0' && data_object.electroniceDevice.capacity != '') {
            let data = check.capacity.find(item => item._id == data_object.electroniceDevice.capacity)
            data_object.electroniceDevice.capacity_id = data_object.electroniceDevice.capacity
            if (data) data_object.electroniceDevice.capacity = data.name.replace('\r', '')
        }

        if (data_object.electroniceDevice && data_object.electroniceDevice.hardDrive != '0' && data_object.electroniceDevice.hardDrive != '') {
            let data = check.capacity.find(item => item._id == data_object.electroniceDevice.hardDrive)
            data_object.electroniceDevice.hardDrive_id = data_object.electroniceDevice.hardDrive
            if (data) data_object.electroniceDevice.hardDrive = data.name.replace('\r', '')
        }

        if (data_object.electroniceDevice && data_object.electroniceDevice.screen != '0' && data_object.electroniceDevice.screen != '') {
            let data = check.screen.find(item => item._id == data_object.electroniceDevice.screen)
            data_object.electroniceDevice.screen_id = data_object.electroniceDevice.screen
            if (data) data_object.electroniceDevice.screen = data.name.replace('\r', '')
        }

        if (data_object.electroniceDevice && data_object.electroniceDevice.do_phan_giai != '0' && data_object.electroniceDevice.do_phan_giai != '') {
            let data = check.capacity.find(item => item._id == data_object.electroniceDevice.do_phan_giai)
            data_object.electroniceDevice.do_phan_giai_id = data_object.electroniceDevice.do_phan_giai
            if (data) data_object.electroniceDevice.do_phan_giai = data.name.replace('\r', '')
        }


        if (data_object.electroniceDevice && data_object.electroniceDevice.mau_sac != '0' && data_object.electroniceDevice.mau_sac != '') {
            let checkkmau = await CateDetail.findOne({ _id: 7 }).lean();
            let data = checkkmau.colors.find(item => item._id == data_object.electroniceDevice.mau_sac)
            data_object.electroniceDevice.mau_sac_id = data_object.electroniceDevice.mau_sac
            if (data) data_object.electroniceDevice.mau_sac = data.name.replace('\r', '')
        }

        if (data_object.electroniceDevice && data_object.electroniceDevice.size != '0' && data_object.electroniceDevice.size != '') {
            let data = check.screen.find(item => item._id == data_object.electroniceDevice.size)
            data_object.electroniceDevice.size_id = data_object.electroniceDevice.size
            if (data) data_object.electroniceDevice.size = data.name.replace('\r', '')
        }

        if (data_object.electroniceDevice && data_object.electroniceDevice.device != '0' && data_object.electroniceDevice.device != '') {
            let data = check.productMaterial.find(item => item._id == data_object.electroniceDevice.device)
            data_object.electroniceDevice.device_id = data_object.electroniceDevice.device
            if (data) data_object.electroniceDevice.device = data.name.replace('\r', '')
        }

        if (cate == 99 && data_object.electroniceDevice && data_object.electroniceDevice.device != '0' && data_object.electroniceDevice.device != '') {
            let data = check.allType.find(item => item._id == data_object.electroniceDevice.device)
            data_object.electroniceDevice.device_id = data_object.electroniceDevice.device
            if (data) data_object.electroniceDevice.device = data.name.replace('\r', '')
        }

        if (data_object.warranty != 0) {
            let cate1 = await Category.findById(cate).lean();
            let cate2 = null;
            let cate3;
            if (cate1) {
                if (cate1.parentId !== 0) { cate2 = await Category.findById({ _id: cate1.parentId }).lean(); }
                cate2 ? cate3 = cate2._id : cate3 = cate1._id;
                checkcate = await CateDetail.findOne({ _id: cate3 }).lean();
                if (checkcate) {
                    let data = checkcate.warranty.find(item => item._id == data_object.warranty)
                    data_object.warranty_id = data_object.warranty
                    if (data) data_object.warranty = data.warrantyTime.replace('\r', '')
                }
            }
        }

        if (cate == 56 && data_object.warranty != 0) {
            let checkkbaohanh = await CateDetail.findOne({ _id: 2 }).lean();
            data_object.warranty_id = data_object.warranty
            if (checkkbaohanh) {
                let data = checkkbaohanh.warranty.find(item => item._id == data_object.warranty)
                if (data) data_object.warranty = data.warrantyTime.replace('\r', '')

            }
        }

        if (cate == 6 && data_object.electroniceDevice && data_object.electroniceDevice.device != '0' && data_object.electroniceDevice.device != '') {
            let data = check.productGroup.find(item => item._id == data_object.electroniceDevice.device)
            data_object.electroniceDevice.device_id = data_object.electroniceDevice.device
            if (data) data_object.electroniceDevice.device = data.name.replace('\r', '')
        }

        if (cate == 36 && data_object.electroniceDevice && data_object.electroniceDevice.device != '0' && data_object.electroniceDevice.device != '') {
            let data = check.productGroup.find(item => item._id == data_object.electroniceDevice.device)
            data_object.electroniceDevice.device_id = data_object.electroniceDevice.device
            if (data) data_object.electroniceDevice.device = data.name.replace('\r', '')
        }

        if (data_object.productGroup != 0) {
            let data = check.productGroup.find(item => item._id == data_object.productGroup)
            data_object.productGroup_id = data_object.productGroup

            if (data) data_object.productGroup = data.name.replace('\r', '')
        }

        if (data_object.productType != 0) {
            let data = check.allType.find(item => item._id == data_object.productType)
            data_object.productType_id = data_object.productType
            if (data) data_object.productType = data.name.replace('\r', '')
        }

        if (data_object.ship && data_object.ship.vehicleType) {
            let data = loai_xe.find(item => item._id == data_object.ship.vehicleType)
            data_object.ship.vehicleType_id = data_object.ship.vehicleType
            if (data) data_object.ship.vehicleType = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.hop_so != '0' && data_object.vehicle.hop_so != '') {
            let data = hop_so.find(item => item._id == data_object.vehicle.hop_so)
            data_object.vehicle.hop_so_id = data_object.vehicle.hop_so
            if (data) data_object.vehicle.hop_so = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.kich_thuoc_khung != '0' && data_object.vehicle.kich_thuoc_khung != '') {
            let checkk = await CateDetail.findOne({ _id: 2 }).lean();
            let data = checkk.screen.find(item => item._id == data_object.vehicle.kich_thuoc_khung)
            data_object.vehicle.kich_thuoc_khung_id = data_object.vehicle.kich_thuoc_khung
            if (data) data_object.vehicle.kich_thuoc_khung = data.name.replace('\r', '')
        }

        if (cate == 8 && data_object.vehicle && data_object.vehicle.kich_thuoc_khung != '0' && data_object.vehicle.kich_thuoc_khung != '') {
            let data = check.screen.find(item => item._id == data_object.vehicle.kich_thuoc_khung)
            data_object.vehicle.kich_thuoc_khung_id = data_object.vehicle.kich_thuoc_khung
            if (data) data_object.vehicle.kich_thuoc_khung = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.nhien_lieu != '0' && data_object.vehicle.nhien_lieu != '') {
            let data = nhien_lieu.find(item => item._id == data_object.vehicle.nhien_lieu)
            data_object.vehicle.nhien_lieu_id = data_object.vehicle.nhien_lieu
            if (data) data_object.vehicle.nhien_lieu = data.name.replace('\r', '')
        }

        if (data_object.vehicle && data_object.vehicle.chat_lieu_khung != '0' && data_object.vehicle.chat_lieu_khung != '') {
            let data = check.productMaterial.find(item => item._id == data_object.vehicle.chat_lieu_khung)
            data_object.vehicle.chat_lieu_khung_id = data_object.vehicle.chat_lieu_khung
            if (data) data_object.vehicle.chat_lieu_khung = data.name.replace('\r', '')
        }

        if (data_object.chat_lieu && data_object.chat_lieu != '0' && data_object.chat_lieu != '') {
            let data = check.productMaterial.find(item => item._id == data_object.chat_lieu)
            data_object.chat_lieu_id = data_object.chat_lieu
            if (data) data_object.chat_lieu = data.name.replace('\r', '')
        }

        if (data_object.ship && data_object.ship.product) {
            let data = check.allType.find(item => item._id == data_object.ship.product)
            data_object.ship.product_id = data_object.ship.product
            if (data) data_object.ship.product = data.name.replace('\r', '')
        }

        if (data_object.mon_the_thao != '0' && data_object.mon_the_thao != '') {
            checkcate = await CateDetail.findOne({ _id: 74 }).lean();
            if (checkcate) {
                let data = checkcate.sport.find(item => item._id == data_object.mon_the_thao)
                data_object.mon_the_thao_id = data_object.mon_the_thao
                if (data) data_object.mon_the_thao = data.name.replace('\r', '')
            }
        }

        // if (data_object.detailCategory) {
        //     let data = await Tags.findOne({ _id: data_object.detailCategory }).lean();
        //     if (data) data_object.detailCategory = data.name.replace('\r', '')
        // }

        if (data_object.Job && data_object.Job.jobType != '0' && data_object.Job.jobType != '') {
            let data = await CateVL.findOne({ _id: data_object.Job.jobType }).lean();
            data_object.Job.jobType_id = data_object.Job.jobType
            if (data) data_object.Job.jobType = data.name.replace('\r', '')
        }

        if (data_object.wareHouse && data_object.wareHouse.loai_thiet_bi != '0' && data_object.wareHouse.loai_thiet_bi != '') {

            let data = check.allType.find(item => item._id == data_object.wareHouse.loai_thiet_bi)
            data_object.wareHouse.loai_thiet_bi_id = data_object.wareHouse.loai_thiet_bi
            if (data) data_object.wareHouse.loai_thiet_bi = data.name.replace('\r', '')
        }

        if (data_object.wareHouse && data_object.wareHouse.cong_suat != '0' && data_object.wareHouse.cong_suat != '') {
            let data = check.capacity.find(item => item._id == data_object.wareHouse.cong_suat)
            data_object.wareHouse.cong_suat_id = data_object.wareHouse.cong_suat
            if (data) data_object.wareHouse.cong_suat = data.name.replace('\r', '')
        }

        if (data_object.wareHouse && data_object.wareHouse.dung_tich != '0' && data_object.wareHouse.dung_tich != '') {
            let data = check.capacity.find(item => item._id == data_object.wareHouse.dung_tich)
            data_object.wareHouse.dung_tich_id = data_object.wareHouse.dung_tich
            if (data) data_object.wareHouse.dung_tich = data.name.replace('\r', '')
        }

        if (data_object.pet && data_object.pet.kindOfPet != '0' && data_object.pet.kindOfPet != '') {
            let data = check.petPurebred.find(item => item._id == data_object.pet.kindOfPet)
            data_object.pet.kindOfPet_id = data_object.pet.kindOfPet
            if (data) data_object.pet.kindOfPet = data.name.replace('\r', '')
        }



        if (data_object.pet && data_object.pet.age != '0' && data_object.pet.age != '') {
            let data = check.petInfo.find(item => item._id == data_object.pet.age)
            data_object.pet.age_id = data_object.pet.age
            if (data) data_object.pet.age = data.name.replace('\r', '')
        }
        if (data_object.pet && data_object.pet.gender != '0' && data_object.pet.gender != '') {
            data_object.pet.gender_id = data_object.pet.gender
            let checkPet = checkGenderPet.find(item => item._id == data_object.pet.gender)
            if (checkPet) data_object.pet.gender = checkPet.name.replace('\r', '')

        }

        if (data_object.pet && data_object.pet.weigth != '0' && data_object.pet.weigth != '') {
            let data = check.petInfo.find(item => item._id == data_object.pet.weigth)
            data_object.pet.weigth_id = data_object.pet.weigth
            if (data) data_object.pet.weigth = data.name.replace('\r', '')
        }

        if (data_object.electroniceDevice && data_object.electroniceDevice.cong_suat != '0' && data_object.electroniceDevice.cong_suat != '') {
            let data = check.capacity.find(item => item._id == data_object.electroniceDevice.cong_suat)
            data_object.electroniceDevice.cong_suat_id = data_object.electroniceDevice.cong_suat
            if (data) data_object.electroniceDevice.cong_suat = data.name.replace('\r', '')
        }

        if (data_object.wareHouse && data_object.wareHouse.khoiluong != '0' && data_object.wareHouse.khoiluong != '') {
            let data = check.capacity.find(item => item._id == data_object.wareHouse.khoiluong)
            data_object.wareHouse.khoiluong_id = data_object.wareHouse.khoiluong
            if (data) data_object.wareHouse.khoiluong = data.name.replace('\r', '')
        }

        if (cate == 61 && data_object.productType !== 0) {
            let checkkk = await CateDetail.findById(22).lean();
            if (checkkk) {
                let data = checkkk.allType.find(item => item._id == data_object.productType)
                data_object.productType_id = data_object.productType
                if (data) data_object.productType = data.name.replace('\r', '')
            }
        }

        if ([61, 63, 108].includes(cate) && data_object.beautifull && data_object.beautifull.loai_hinh_sp != '0' && data_object.beautifull.loai_hinh_sp != '') {
            let data = check.allType.find(item => item._id == data_object.beautifull.loai_hinh_sp)
            data_object.beautifull.loai_hinh_sp_id = data_object.beautifull.loai_hinh_sp
            if (data) data_object.beautifull.loai_hinh_sp = data.name.replace('\r', '')
        }

        if (data_object.kich_co != '0' && data_object.kich_co != '') {
            let data = check.allType.find(item => item._id == data_object.kich_co)
            data_object.kich_co_id = data_object.kich_co
            if (data) data_object.kich_co = data.name.replace('\r', '')
        }

        if (data_object.noiThatNgoaiThat && data_object.noiThatNgoaiThat.hinhdang != '0' && data_object.noiThatNgoaiThat.hinhdang != '') {
            let data = check.productShape.find(item => item._id == data_object.noiThatNgoaiThat.hinhdang)
            data_object.noiThatNgoaiThat.hinhdang_id = data_object.kich_co
            if (data) data_object.noiThatNgoaiThat.hinhdang = data.name.replace('\r', '')
        }

        if (data_object.Job && data_object.Job.jobDetail != '0' && data_object.Job.jobDetail != '') {
            let checkJob = await Keywords.findOne({ key_id: data_object.Job.jobDetail }).lean();
            data_object.Job.jobDetail_id = data_object.Job.jobDetail
            if (checkJob) data_object.Job.jobDetail = checkJob.key_name.replace('\r', '')
        }

        if (cate == 114 && data_object.pet && data_object.pet.kindOfPet != '0' && data_object.pet.kindOfPet != '') {
            let checkPetGa = await CateDetail.findOne({ "petPurebred._id": data_object.pet.kindOfPet }).lean();
            let data = checkPetGa.petPurebred.find(item => item._id == data_object.pet.kindOfPet)
            data_object.pet.kindOfPet_id = data_object.pet.kindOfPet
            if (data) data_object.pet.kindOfPet = data.name.replace('\r', '')
        }

        return data_object
    } catch (error) {
        console.log(error)
        return null
    }
}


// copy folder image
exports.copyFolder = async(imgOld, folderNew) => {
    let fileOld = imgOld.replace(`${process.env.DOMAIN_RAO_NHANH}`, '')
    let folderOld = fileOld.split('/').reverse()[1]
    let fileNew = fileOld.replace(`${folderOld}`, folderNew)
    let path = `../storage/base365/raonhanh365/pictures/${folderNew}`;
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
    fs.copyFile(`../storage/base365/raonhanh365${fileOld}`, `../storage/base365/raonhanh365${fileNew}`, (err) => {
        if (err) {
            console.error(err)
            return false
        }
    });
    return true
}

// send chat
exports.sendChat = async(id_nguoigui, id_nguoinhan, noidung, Link, Type, Title) => {
    let data = new FormData();
    if (!Link) Link = "";
    if (!Type) Type = "text";
    if (!Title) Title = "";
    data.append('UserId', id_nguoinhan);
    data.append('SenderId', id_nguoigui);
    data.append('Message', noidung);
    data.append('Type', Type);
    data.append('Title', Title);
    data.append('Link', Link);

    let checksend = await axios({
        method: "post",
        url: `${process.env.API_SendChat}/api/V2/Notification/SendNewNotification_v2`,
        data
    });

    return true
}

// api check ảnh spam 
exports.checkImageSpam = async(New, userId, listImg, folder, newId) => {
    try {
        listImg = listImg.slice(0, -1);
        let str_new_img = '';
        listImg.split(',').map(item => {
            str_new_img += `${process.env.DOMAIN_RAO_NHANH}/pictures/${folder}/${item}` + ','
        })
        str_new_img = str_new_img.slice(0, -1);

        let dataaa = new FormData();
        dataaa.append('list_image', str_new_img);
        dataaa.append('new_id', newId);
        dataaa.append('site', 'raonhanh365');
        dataaa.append('user_id', userId);

        await axios({
            method: "post",
            maxBodyLength: Infinity,
            url: `${process.env.API_CHECK_ANH_SPAM_RAO_NHANH}/image_raonhanh`,
            headers: {
                ...dataaa.getHeaders()
            },
            data: dataaa
        });

        return true
    } catch (error) {
        return null
    }
}

// api check tin spam
exports.checkNewSpam = async(id, New) => {
    try {
        let data = new FormData();
        data.append('new_id', id);
        let checkData = await axios({
            method: "post",
            url: `${process.env.API_CHECK_SPAM_RAO_NHANH}/check/spam`,
            data
        });

        if (checkData && checkData.data) {
            await New.findByIdAndUpdate(new_id, {
                duplicate: checkData.list_spam

            });
        }
        return true
    } catch (error) {
        return null
    }
}

// lấy link file tin đăng mua
exports.getLinkFileNewBuy = (item) => {
    return `${process.env.DOMAIN_RAO_NHANH}/pictures/avt_tindangmua/${item}`
}

exports.loopCallback = async() => {
        try {
            // await new Promise((resolve) => setTimeout(resolve, 1000));
            let checkData = await axios({
                method: "get",
                url: `https://socket.timviec365.vn/takelistuseronline`,
            });
            console.log("🚀 ~ file: service.js:1482 ~ exports.loopCallback= ~ checkData:", checkData)
            return checkData
        } catch (error) {
            console.log(error.message);
        }

    }
    // loopCallback();

//từ khoá liên quan
exports.keyWords = async(title, city, catId, tagid, tagvl, jobType, district) => {
    try {
        let arr = [];
        if (title) {
            arr = await Tags.find({ name: new RegExp(title, 'i') }).litmit(15).lean();
        } else if (city && !district) {
            arr = await District.find({ parent: city }).limit(15).lean();
        } else if (catId) {
            arr = await Tags.find({ cateId: catId }).litmit(15).lean();
        } else if (tagid) {
            let check = await Tags.findOne({ _id: tagid }).lean();
            if (check) {
                arr = Tags.find({ cateId: check.cateId, _id: { $ne: tagid } }).limit(15).lean();
            }
        } else if (tagvl) {
            arr = await Keywords.find({ key_id: { $ne: tagvl } }).limit(15).lean();
        } else if (jobType) {
            arr = await CateVl.find({ active: 1, _id: { $ne: jobType } }).limit(15).lean();
        } else if (city && district) {
            arr = await District.find({ parent: city, _id: { $ne: district } }).limit(15).lean();
        }
        return arr
    } catch (error) {
        return []
    }
}

// conditions tìm kiếm
exports.conditionsSearch = (conditions, items) => {
    try {
        if (items.microprocessor) conditions.bovi_xuly = Number(items.microprocessor)
        if (items.ram) conditions.ram = Number(items.ram)
        if (items.hardDrive) conditions.o_cung = Number(items.hardDrive)
        if (items.typeHardrive) conditions.loai_o_cung = Number(items.typeHardrive)
        if (items.screen) conditions.man_hinh = Number(items.screen)
        if (items.size) conditions.kich_co = Number(items.size)
        if (items.warranty) conditions.new_baohanh = Number(items.warranty)
        if (items.status) conditions.new_tinhtrang = Number(items.status)
        if (items.machineSeries) conditions.dong_may = Number(items.machineSeries)
        if (items.device) conditions.thiet_bi = Number(items.device)
        if (items.capacity) conditions.dung_luong = Number(items.capacity)
        if (items.sdung_sim) conditions.sdung_sim = Number(items.sdung_sim)
        if (items.phien_ban) conditions.phien_ban = Number(items.phien_ban)
        if (items.knoi_internet) conditions.knoi_internet = Number(items.knoi_internet)
        if (items.do_phan_giai) conditions.do_phan_giai = Number(items.do_phan_giai)
        if (items.cong_suat) conditions.cong_suat = Number(items.cong_suat)
        if (items.mau_sac) conditions.mau_sac = Number(items.mau_sac)
        if (items.loai_xe) conditions.loai_xe = Number(items.loai_xe)
        if (items.xuat_xu) conditions.xuat_xu = Number(items.xuat_xu)
        if (items.kich_thuoc_khung) conditions.kich_thuoc_khung = Number(items.kich_thuoc_khung)
        if (items.chat_lieu_khung) conditions.chat_lieu_khung = Number(items.chat_lieu_khung)
        if (items.dong_xe) conditions.dong_xe = Number(items.dong_xe)
        if (items.nam_san_xuat) conditions.nam_san_xuat = Number(items.nam_san_xuat)
        if (items.dung_tich) conditions.dung_tich = Number(items.dung_tich)
        if (items.td_bien_soxe) conditions.td_bien_soxe = Number(items.td_bien_soxe)
        if (items.phien_ban) conditions.phien_ban = Number(items.phien_ban)
        if (items.hop_so) conditions.hop_so = Number(items.hop_so)
        if (items.nhien_lieu) conditions.nhien_lieu = Number(items.nhien_lieu)
        if (items.kieu_dang) conditions.kieu_dang = Number(items.kieu_dang)
        if (items.trong_tai) conditions.trong_tai = Number(items.trong_tai)
        if (items.loai_linhphu_kien) conditions.loai_linhphu_kien = Number(items.loai_linhphu_kien)
        if (items.so_km_da_di) conditions.so_km_da_di = Number(items.so_km_da_di)
        if (items.loai_noithat) conditions.loai_noithat = Number(items.loai_noithat)
        if (items.dong_co) conditions.dong_co = Number(items.dong_co)
        if (items.brand) conditions.hang = Number(items.brand)
        if (items.ten_toa_nha) conditions.ten_toa_nha = Number(items.ten_toa_nha)
        if (items.tong_so_tang) conditions.tong_so_tang = Number(items.tong_so_tang)
        if (items.so_pngu) conditions.so_pngu = Number(items.so_pngu)
        if (items.so_pve_sinh) conditions.so_pve_sinh = Number(items.so_pve_sinh)
        if (items.giay_to_phap_ly) conditions.giay_to_phap_ly = Number(items.giay_to_phap_ly)
        if (items.tinh_trang_noi_that) conditions.tinh_trang_noi_that = Number(items.tinh_trang_noi_that)
        if (items.dien_tich) conditions.dien_tich = items.dien_tich
        if (items.huong_chinh) conditions.huong_chinh = Number(items.huong_chinh)
        if (items.loai_hinh_dat) conditions.loai_hinh_dat = Number(items.loai_hinh_dat)
        if (items.loai_hinh_canho) conditions.loai_hinh_canho = Number(items.loai_hinh_canho)
        if (items.loaihinh_vp) conditions.loaihinh_vp = Number(items.loaihinh_vp)
        if (items.kindOfPet) conditions.giong_thu_cung = Number(items.kindOfPet)
        if (items.gender) conditions.gioi_tinh = Number(items.gender)
        if (items.age) conditions.do_tuoi = Number(items.age)
        if (items.mon_the_thao) conditions.mon_the_thao = Number(items.mon_the_thao)
        if (items.jobType) conditions.new_job_type = Number(items.brand)
        if (items.jobKind) conditions.new_job_kind = Number(items.jobKind)
        if (items.level) conditions.new_level = Number(items.level)
        if (items.exp) conditions.new_exp = Number(items.exp)
        if (items.skill) conditions.new_skill = Number(items.skill)
        if (items.han_su_dung) conditions.han_su_dung = Number(items.han_su_dung)
        if (items.payBy) conditions.new_pay_by = Number(items.payBy)
        if (items.quantity) conditions.new_quantity = Number(items.quantity)
    } catch (error) {
        return null
    }
}

exports.conditionsInsert = (conditions, items) => {
    try {
        if (items.electroniceDevice && items.electroniceDevice.microprocessor) conditions.bovi_xuly = Number(items.electroniceDevice.microprocessor)
        if (items.electroniceDevice && items.electroniceDevice.ram) conditions.ram = Number(items.electroniceDevice.ram)
        if (items.electroniceDevice && items.electroniceDevice.hardDrive) conditions.o_cung = Number(items.electroniceDevice.hardDrive)
        if (items.electroniceDevice && items.electroniceDevice.typeHardrive) conditions.loai_o_cung = Number(items.electroniceDevice.typeHardrive)
        if (items.electroniceDevice && items.electroniceDevice.screen) conditions.man_hinh = Number(items.electroniceDevice.screen)
        if (items.electroniceDevice && items.electroniceDevice.size) conditions.kich_co = Number(items.electroniceDevice.size)
        if (items.electroniceDevice && items.electroniceDevice.warranty) conditions.new_baohanh = Number(items.electroniceDevice.warranty)
        if (items.electroniceDevice && items.electroniceDevice.status) conditions.new_tinhtrang = Number(items.electroniceDevice.status)
        if (items.electroniceDevice && items.electroniceDevice.machineSeries) conditions.dong_may = Number(items.electroniceDevice.machineSeries)
        if (items.electroniceDevice && items.electroniceDevice.device) conditions.thiet_bi = Number(items.electroniceDevice.device)
        if (items.electroniceDevice && items.electroniceDevice.capacity) conditions.dung_luong = Number(items.electroniceDevice.capacity)
        if (items.electroniceDevice && items.electroniceDevice.sdung_sim) conditions.sdung_sim = Number(items.electroniceDevice.sdung_sim)
        if (items.electroniceDevice && items.electroniceDevice.phien_ban) conditions.phien_ban = Number(items.electroniceDevice.phien_ban)
        if (items.electroniceDevice && items.electroniceDevice.knoi_internet) conditions.knoi_internet = Number(items.electroniceDevice.knoi_internet)
        if (items.electroniceDevice && items.electroniceDevice.do_phan_giai) conditions.do_phan_giai = Number(items.electroniceDevice.do_phan_giai)
        if (items.electroniceDevice && items.electroniceDevice.cong_suat) conditions.cong_suat = Number(items.electroniceDevice.cong_suat)
        if (items.electroniceDevice && items.electroniceDevice.mau_sac) conditions.mau_sac = Number(items.electroniceDevice.mau_sac)
        if (items.vehicle && items.vehicle.loai_xe) conditions.loai_xe = Number(items.vehicle.loai_xe)
        if (items.vehicle && items.vehicle.xuat_xu) conditions.xuat_xu = Number(items.vehicle.xuat_xu)
        if (items.vehicle && items.vehicle.kich_thuoc_khung) conditions.kich_thuoc_khung = Number(items.vehicle.kich_thuoc_khung)
        if (items.vehicle && items.vehicle.chat_lieu_khung) conditions.chat_lieu_khung = Number(items.vehicle.chat_lieu_khung)
        if (items.vehicle && items.vehicle.dong_xe) conditions.dong_xe = Number(items.vehicle.dong_xe)
        if (items.vehicle && items.vehicle.nam_san_xuat) conditions.nam_san_xuat = Number(items.vehicle.nam_san_xuat)
        if (items.vehicle && items.vehicle.dung_tich) conditions.dung_tich = Number(items.vehicle.dung_tich)
        if (items.vehicle && items.vehicle.td_bien_soxe) conditions.td_bien_soxe = Number(items.vehicle.td_bien_soxe)
        if (items.vehicle && items.vehicle.phien_ban) conditions.phien_ban = Number(items.vehicle.phien_ban)
        if (items.vehicle && items.vehicle.hop_so) conditions.hop_so = Number(items.vehicle.hop_so)
        if (items.vehicle && items.vehicle.nhien_lieu) conditions.nhien_lieu = Number(items.vehicle.nhien_lieu)
        if (items.vehicle && items.vehicle.kieu_dang) conditions.kieu_dang = Number(items.vehicle.kieu_dang)
        if (items.vehicle && items.vehicle.trong_tai) conditions.trong_tai = Number(items.vehicle.trong_tai)
        if (items.vehicle && items.vehicle.loai_linhphu_kien) conditions.loai_linhphu_kien = Number(items.vehicle.loai_linhphu_kien)
        if (items.vehicle && items.vehicle.so_km_da_di) conditions.so_km_da_di = Number(items.vehicle.so_km_da_di)
        if (items.vehicle && items.vehicle.loai_noithat) conditions.loai_noithat = Number(items.vehicle.loai_noithat)
        if (items.vehicle && items.vehicle.dong_co) conditions.dong_co = Number(items.vehicle.dong_co)
        if (items.brand) conditions.hang = Number(items.brand)
        if (items.realEstate && items.realEstate.ten_toa_nha) conditions.ten_toa_nha = Number(items.realEstate.ten_toa_nha)
        if (items.realEstate && items.realEstate.tong_so_tang) conditions.tong_so_tang = Number(items.realEstate.tong_so_tang)
        if (items.realEstate && items.realEstate.so_pngu) conditions.so_pngu = Number(items.realEstate.so_pngu)
        if (items.realEstate && items.realEstate.so_pve_sinh) conditions.so_pve_sinh = Number(items.realEstate.so_pve_sinh)
        if (items.realEstate && items.realEstate.giay_to_phap_ly) conditions.giay_to_phap_ly = Number(items.realEstate.giay_to_phap_ly)
        if (items.realEstate && items.realEstate.tinh_trang_noi_that) conditions.tinh_trang_noi_that = Number(items.realEstate.tinh_trang_noi_that)
        if (items.realEstate && items.realEstate.dien_tich) conditions.dien_tich = items.realEstate.dien_tich
        if (items.realEstate && items.realEstate.huong_chinh) conditions.huong_chinh = Number(items.realEstate.huong_chinh)
        if (items.realEstate && items.realEstate.loai_hinh_dat) conditions.loai_hinh_dat = Number(items.realEstate.loai_hinh_dat)
        if (items.realEstate && items.realEstate.loai_hinh_canho) conditions.loai_hinh_canho = Number(items.realEstate.loai_hinh_canho)
        if (items.realEstate && items.realEstate.loaihinh_vp) conditions.loaihinh_vp = Number(items.realEstate.loaihinh_vp)
        if (items.pet && items.pet.kindOfPet) conditions.giong_thu_cung = Number(items.pet.kindOfPet)
        if (items.pet && items.pet.gender) conditions.gioi_tinh = Number(items.pet.gender)
        if (items.pet && items.pet.age) conditions.do_tuoi = Number(items.pet.age)
        if (items.Job && items.Job.mon_the_thao) conditions.mon_the_thao = Number(items.Job.mon_the_thao)
        if (items.Job && items.Job.jobType) conditions.new_job_type = Number(items.Job.brand)
        if (items.Job && items.Job.jobKind) conditions.new_job_kind = Number(items.Job.jobKind)
        if (items.Job && items.Job.level) conditions.new_level = Number(items.Job.level)
        if (items.Job && items.Job.exp) conditions.new_exp = Number(items.Job.exp)
        if (items.Job && items.Job.skill) conditions.new_skill = Number(items.Job.skill)
        if (items.Job && items.Job.han_su_dung) conditions.han_su_dung = Number(items.Job.han_su_dung)
        if (items.Job && items.Job.payBy) conditions.new_pay_by = Number(items.Job.payBy)
        if (items.Job && items.Job.quantity) conditions.new_quantity = Number(items.Job.quantity)
    } catch (error) {
        return null
    }
}

const findFolder = (folder, LinkImg) => {
    try {
        filePath = `../storage/base365/raonhanh365/pictures/${folder}/${LinkImg}`;
        const fs = require('fs');
        const path = filePath;
        if (fs.existsSync(path)) {
            return true
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

const loopFindFile = (LinkImg) => {
    try {
        for (let i = 0; i < arrFolder.length; i++) {
            const element = arrFolder[i];
            let check = findFolder(element, LinkImg);
            if (check) return element
        }
        return false
    } catch (error) {
        return null
    }
}

// lấy link file
exports.getLinkFile = async(userID, file, cateId, buySell) => {
    try {
        let nameCate = await this.getNameCate(cateId, 1);
        let folder = await this.checkFolderCateRaoNhanh(nameCate);
        if (cateId == 121) folder = 'timviec';
        if (cateId == 120) folder = 'ungvien';
        if (buySell == 1) folder = 'avt_tindangmua';
        let arr = [];
        for (let i = 0; i < file.length; i++) {
            const element = file[i];
            if (element.nameImg) {
                let checkFile = findFolder(folder, element.nameImg);
                if (checkFile) {
                    arr.push({ nameImg: `${process.env.DOMAIN_RAO_NHANH}/pictures/${folder}/${element.nameImg}` })
                } else {
                    let checkFolderLoop = loopFindFile(element.nameImg);
                    if (checkFolderLoop) {
                        arr.push({ nameImg: `${process.env.DOMAIN_RAO_NHANH}/pictures/${checkFolderLoop}/${element.nameImg}` })
                    }
                    arr.push({ nameImg: `${process.env.DOMAIN_RAO_NHANH}/pictures/${folder}/${element.nameImg}` })
                }
            }
        }
        return arr;
    } catch (err) {
        console.log(err)
        return
    }
}