const fnc = require('../services/functions');
const functions = require('../services/functions');
const City = require('../models/City');
const District = require('../models/District');
const CategoryTv365 = require('../models/Timviec365/CategoryJob');
const TagTv365 = require('../models/Timviec365/UserOnSite/Company/Keywords');
const NewTV365 = require('../models/Timviec365/UserOnSite/Company/New');
const LangCv = require('../models/Timviec365/CV/CVLang');
const CVDesign = require('../models/Timviec365/CV/CVDesign');
const TblModules = require('../models/Timviec365/TblModules');
const Users = require('../models/Users');
const tags = require('../models/Timviec365/TblTags');
const axios = require('axios')
    // lấy danh sach thành phố
exports.getDataCity = async(req, res, next) => {
    try {
        const cit_id = req.body.cit_id;
        let condition = {};
        if (cit_id) {
            condition = { _id: cit_id };
        }
        let city = await fnc.getDatafind(City, condition),
            data = [];

        for (let index = 0; index < city.length; index++) {
            const element = city[index];
            data.push({
                "cit_id": element._id,
                "cit_name": element.name,
                "cit_order": element.order,
                "cit_type": element.type,
                "cit_count": element.count,
                "cit_count_vl": element.countVl,
                "cit_count_vlch": element.countVlch,
                "postcode": element.postCode
            });
        }
        return fnc.success(res, "Lấy dữ liệu thành công", { data })

    } catch (error) {
        console.log(error)
        return fnc.setError(res, error)
    }
}

// lấy danh sách quận huyện theo id thành phố
exports.getDataDistrict = async(req, res, next) => {
    try {
        let idCity = req.body.cit_id;
        let condition = {};
        if (idCity) {
            condition.parent = idCity;
        } else {
            condition.parent = { $ne: 0 };
        }
        const lists = await fnc.getDatafind(District, condition);
        let district = [];
        for (let i = 0; i < lists.length; i++) {
            let item = lists[i];
            district.push({
                'cit_id': item._id,
                'cit_name': item.name,
                'cit_order': item.order,
                'cit_type': item.type,
                'cit_count': item.count,
                'cit_parent': item.parent
            });

        }
        return fnc.success(res, "Lấy dữ liệu thành công", { data: district })
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error)
    }
}

// lấy danh sách ngành nghề timviec365
exports.getDataCategoryTv365 = async(req, res, next) => {
    try {
        const active = req.body.active;
        const cat_only = req.body.cat_only;
        const cat_id = req.body.cat_id;

        let condition = {};
        if (active) {
            condition.cat_active = active;
        }
        if (cat_only) {
            condition.cat_only = cat_only;
        }
        if (cat_id) {
            condition.cat_id = cat_id;
        }
        const category = await CategoryTv365.find(condition).sort({ cat_name: 1 });
        return fnc.success(res, "Lấy dữ liệu thành công", { data: category })
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error)
    }
}

// Lấy danh sách tag timviec365
exports.getDataTagTv365 = async(req, res, next) => {
    try {
        let type = req.body.type || "tagKey",
            cate_id = req.body.cate_id || null;
        let condition = {},
            data = [];

        if (type == 'tagKey') {
            condition.key_name = { $ne: "" };
            condition.key_cb_id = 0;
            condition.key_city_id = 0;
            condition.key_301 = "";
            condition.key_time = { $ne: 1604509200 };
        }
        if (cate_id != null) {
            condition.key_name = { $ne: "" };
            condition.key_cate_lq = cate_id;
            condition.key_cb_id = 0;
            condition.key_city_id = 0;
            condition.key_cate_id = 0;
            condition.key_err = 0;
            condition.key_301 = "";
        }

        const lists = await TagTv365.aggregate([
            { $match: condition },
            { $sort: { _id: -1 } },
            {
                $project: {
                    key_id: "$_id",
                    key_name: 1,
                    key_cate_lq: 1
                }
            }
        ]);

        return fnc.success(res, "Lấy dữ liệu thành công", { data: lists })
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error)
    }
}

// lấy danh sách ngôn ngữ cv
exports.getDataLangCV = async(req, res, next) => {
    try {
        lists = await LangCv.find({}, {
            id: 1,
            name: 1,
            alias: 1
        }).lean();

        for (let i = 0; i < lists.length; i++) {
            const element = lists[i];
            let nn;
            switch (element.id) {
                case 1:
                    nn = 0;
                    break;
                case 3:
                    nn = 1;
                    break;
                case 5:
                    nn = 2;
                    break;
                case 7:
                    nn = 3;
                    break;
                case 9:
                    nn = 4;
                    break;
                default:
                    break;
            }
            element.img = `https://timviec365.vn/images/nnn${nn}.png`;
        }

        return fnc.success(res, "Lấy dữ liệu thành công", { data: lists })
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error)
    }
}

// Lấy danh sách thiết kế cv
exports.getDataDesignCV = async(req, res, next) => {
    try {
        lists = await CVDesign.find({}, {
            name: 1,
            alias: 1
        }).lean();
        return fnc.success(res, "Lấy dữ liệu thành công", { data: lists })
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error)
    }
}

// Lấy nội dung bảng modules để seo
exports.modules = async(req, res) => {
    try {
        const { moduleRequets } = req.body;
        if (moduleRequets) {
            const seo = await TblModules.findOne({
                module: moduleRequets
            }).lean();
            seo.sapo = await fnc.renderCDNImage(seo.sapo)
            return fnc.success(res, "Thông tin module", {
                data: seo
            });
        }
        return fnc.setError(res, "Không có tham số tìm kiếm");
    } catch (error) {
        console.log(error)
        return fnc.setError(res, error)
    }

}

exports.getDistrictTag = async(req, res) => {
    const city = req.body.city;
    const list = await TagTv365.aggregate([{
            $match: {
                key_city_id: Number(city),
                key_index: 1,
                key_name: ''
            }
        }, {
            $lookup: {
                from: 'District',
                localField: 'key_qh_id',
                foreignField: '_id',
                as: 'city'
            }
        },

        {
            $project: {
                cit_id: '$city._id',
                cit_name: '$city.name',
                cit_parent: '$city.parent'
            }
        }
    ]);
    return fnc.success(res, "Thông tin quận huyện tag", {
        list
    });

}

exports.getUserOnline = async(req, res) => {
    try {
        const { list_id, city_id, type } = req.body;
        if (list_id) {

            let project, match, list;
            if (type == 1) {
                project = {
                    usc_logo: "$avatarUser",
                    usc_company: "$userName",
                    usc_id: "$idTimViec365",
                    usc_city: "$city",
                    usc_alias: "$alias",
                    chat365_id: "$_id",
                    usc_create_time: "$createdAt"
                };
                match = {
                    _id: { $in: list_id.split(',').map(Number) },
                    usc_redirect: "",
                    type: type
                };
                list = await Users.aggregate([{
                        $match: match
                    },
                    { $sort: { _id: -1 } },
                    { $project: project }
                ]);

                for (let i = 0; i < list.length; i++) {
                    const element = list[i];
                    element.usc_logo = functions.getUrlLogoCompany(element.usc_create_time, element.usc_logo);
                    const New = await NewTV365.findOne({
                        new_user_id: element.usc_id
                    }).sort({ new_id: -1 }).limit(1).lean();
                    element.new_title = New.new_title;
                }

                return fnc.success(res, 'Danh sách online', { data: list, total: list.length });
            } else if (type == 0) {
                project = {
                    use_logo: "$avatarUser",
                    use_first_name: "$userName",
                    use_id: "$idTimViec365",
                    cv_title: "$inForPerson.candidate.cv_title",
                    cv_city_id: "$alias",
                    chat365_id: "$_id",
                };
                match = {
                    _id: { $in: list_id.split(',') },
                    "inForPerson.candidate.use_show": 1
                };
                list = await Users.aggregate([{
                        $match: match
                    },
                    { $sort: { _id: -1 } },
                    { $project: project }
                ]);
                for (let i = 0; i < list.length; i++) {
                    const element = list[i];
                    element.usc_logo = functions.getUrlLogoCompany(element.usc_create_time, element.usc_logo);
                    const New = await NewTV365.findOne({
                        new_user_id: element.usc_id
                    }).sort({ new_id: -1 }).limit(1).lean();
                    element.new_title = New.new_title;
                }
                return fnc.success(res, 'Danh sách online', { data: list, total: list.length });
            }
            return functions.setError(res, "Data không hợp lệ")
        }
    } catch (error) {
        console.log(error)
        return functions.setError(res, error)
    }
}

exports.getDataUserOnline = async(req, res) => {
    try {
        const { list_id } = req.body;
        if (list_id) {
            let listUserId = list_id.split(",");
            let listUserIdFinal = [];
            for (let i = 0; i < listUserId.length; i++) {
                if (listUserId[i] && (!isNaN(listUserId[i]))) {
                    listUserIdFinal.push(Number(listUserId[i]))
                }
            };
            let listNtd = [];
            let listUv = [];
            let listUser = await Users.find({ _id: { $in: listUserIdFinal }, idTimViec365: { $ne: 0 } }, {
                password: 0,
                configChat: 0,
                "inForPerson.employee.ep_featured_recognition": 0
            }).lean();

            listUv = listUser.filter((e => e.type != 1));
            listNtd = listUser.filter((e => e.type == 1));

            let listIdNtd = [];
            for (let i = 0; i < listNtd.length; i++) {
                listIdNtd.push(listNtd[i].idTimViec365);
            }
            let listNew = await NewTV365.find({
                new_user_id: { $in: listIdNtd }
            }, { new_title: 1 }).lean();

            let dataNtdFinal = [];
            let dataUvFinal = [];
            for (let i = 0; i < listNtd.length; i++) {
                let obj = listNtd[i];
                let flag = true;
                let new_title = "";
                let news = listNew.find((e) => e.new_user_id == obj.idTimViec365);
                if (news) {
                    new_title = news.new_title;
                };
                if (req.body.ntd_city) {
                    if (obj.city != req.body.ntd_city) {
                        flag = false;
                    }
                }
                if (flag) {
                    dataNtdFinal.push({
                        chat365_id: obj._id,
                        usc_logo: functions.getUrlLogoCompany(obj.createdAt, obj.avatarUser),
                        usc_company: obj.userName,
                        usc_alias: obj.alias,
                        new_title: new_title,
                        name: obj.userName,
                        usc_id: obj.idTimViec365,
                        usc_city: obj.city
                    });
                }
            }
            for (let i = 0; i < listUv.length; i++) {
                let obj = listUv[i];
                let new_title = "";
                let news = listNew.find((e) => e.new_user_id == listUv[i]);
                if (news) {
                    new_title = news.new_title;
                };
                let cv_city_id = [];
                let cv_title = "";
                if (obj.inForPerson && obj.inForPerson.candidate && obj.inForPerson.candidate.cv_city_id) {
                    cv_city_id = obj.inForPerson.candidate.cv_city_id;
                }
                let cv_cate_id = [];
                if (obj.inForPerson && obj.inForPerson.candidate && obj.inForPerson.candidate.cv_cate_id) {
                    cv_cate_id = obj.inForPerson.candidate.cv_cate_id;
                }
                let cv_exp = 0;
                if (obj.inForPerson && obj.inForPerson.account && obj.inForPerson.account.experience) {
                    cv_exp = obj.inForPerson.account.experience;
                };
                let flag = true;
                if (req.body.keyword) {
                    const keyword = String(req.body.keyword);
                    if (!cv_title.includes(keyword) && (!obj.userName.includes(keyword))) {
                        flag = false;
                    }
                };
                if (req.body.city_id) {
                    if (!cv_city_id.find((e) => e == Number(req.body.city_id))) {
                        flag = false;
                    }
                };
                if (req.body.cat_id) {
                    if (!cv_cate_id.find((e) => e == Number(req.body.cat_id))) {
                        flag = false;
                    }
                };
                if (flag) {
                    dataUvFinal.push({
                        chat365_id: obj._id,
                        use_id: obj.idTimViec365,
                        use_logo: functions.getUrlLogoCompany(obj.createdAt, obj.avatarUser),
                        cv_city_id: cv_city_id,
                        cv_title: cv_title,
                        name: obj.userName,
                        cv_cate_id: cv_cate_id,
                        cv_exp: cv_exp,
                        use_create_time: obj.createdAt,
                        use_city: obj.city,
                        use_quanhuyen: obj.district,
                        use_update_time: obj.updatedAt,
                    });
                }
            }
            return fnc.success(res, 'Danh sách online', { dataNtdFinal, dataUvFinal });
        }
    } catch (error) {
        console.log(error)
        return functions.setError(res, error)
    }
}

exports.getDataUserOnline2 = async(req, res) => {
    try {
        let t = new Date();
        let list_id = await axios.get('http://43.239.223.142:3000/takelistuseronline');
        let t2 = new Date();
        if (list_id && list_id.data && list_id.data.listOnline) {
            let listUserId = list_id.data.listOnline;
            let listUserIdFinal = [];
            for (let i = 0; i < listUserId.length; i++) {
                if (listUserId[i] && (!isNaN(listUserId[i]))) {
                    listUserIdFinal.push(Number(listUserId[i]))
                }
            };
            listUserIdFinal = [...new Set(listUserIdFinal)];
            let listNtd = [];
            let listUv = [];
            let condition = { _id: { $in: listUserIdFinal }, idTimViec365: { $ne: 0 }, type: 1 };
            if (req.body.type) {
                condition.type = { $ne: 1 };
            }
            let listUser = await Users.find(condition, {
                password: 0,
                configChat: 0,
                fromDevice: 0,
                lastActivedAt: 0,
                time_login: 0,
                role: 0,
                latitude: 0,
                longtitude: 0,
                idQLC: 0,
                chat365_secret: 0,
                scan_base365: 0,
                sharePermissionId: 0,
                inforRN365: 0,
                scan: 0,
                "inForPerson.employee": 0
            }).sort({ _id: -1 }).lean();

            listUv = listUser.filter((e => e.type != 1));
            listNtd = listUser.filter((e => e.type == 1));

            let listIdNtd = [];
            for (let i = 0; i < listNtd.length; i++) {
                listIdNtd.push(listNtd[i].idTimViec365);
            }
            let listNew = await NewTV365.find({
                new_user_id: { $in: listIdNtd }
            }, { new_title: 1 }).lean();

            let dataNtdFinal = [];
            let dataUvFinal = [];
            for (let i = 0; i < listNtd.length; i++) {
                let flag = true;
                let obj = listNtd[i];
                let new_title = "";
                let news = listNew.find((e) => e.new_user_id == obj.idTimViec365);
                if (news) {
                    new_title = news.new_title;
                };
                if (req.body.ntd_city && (!isNaN(Number(req.body.ntd_city)))) {
                    if (obj.city != req.body.ntd_city) {
                        flag = false;
                    }
                }
                if (flag) {
                    dataNtdFinal.push({
                        chat365_id: obj._id,
                        usc_logo: functions.getUrlLogoCompany(obj.createdAt, obj.avatarUser),
                        usc_company: obj.userName,
                        usc_alias: obj.alias,
                        new_title: new_title,
                        name: obj.userName,
                        usc_id: obj.idTimViec365,
                        usc_city: obj.city
                    });
                }
            }
            let flagNtd = true;
            for (let i = 0; i < listUv.length; i++) {
                let obj = listUv[i];
                let new_title = "";
                let news = listNew.find((e) => e.new_user_id == listUv[i]);
                if (news) {
                    new_title = news.new_title;
                };
                let cv_city_id = [];
                let cv_title = "";
                if (obj.inForPerson && obj.inForPerson.candidate && obj.inForPerson.candidate.cv_city_id) {
                    cv_city_id = obj.inForPerson.candidate.cv_city_id;
                }
                let cv_cate_id = [];
                if (obj.inForPerson && obj.inForPerson.candidate && obj.inForPerson.candidate.cv_cate_id) {
                    cv_cate_id = obj.inForPerson.candidate.cv_cate_id;
                }
                let cv_exp = 0;
                if (obj.inForPerson && obj.inForPerson.account && obj.inForPerson.account.experience) {
                    cv_exp = obj.inForPerson.account.experience;
                }
                let flag = true;
                if (req.body.keyword) {
                    const keyword = String(req.body.keyword);
                    flagNtd = false;
                    if (!cv_title.includes(keyword) && (!obj.userName.includes(keyword))) {
                        flag = false;
                    }
                };
                if (req.body.city_id) {
                    flagNtd = false;
                    if (!cv_city_id.find((e) => e == Number(req.body.city_id))) {
                        flag = false;
                    }
                };
                if (req.body.cat_id) {
                    flagNtd = false;
                    if (!cv_cate_id.find((e) => e == Number(req.body.cat_id))) {
                        flag = false;
                    }
                };
                if (flag) {
                    dataUvFinal.push({
                        chat365_id: obj._id,
                        use_id: obj.idTimViec365,
                        use_logo: functions.getUrlLogoCompany(obj.createdAt, obj.avatarUser),
                        cv_city_id: cv_city_id,
                        cv_title: cv_title,
                        name: obj.userName,
                        cv_cate_id: cv_cate_id,
                        cv_exp: cv_exp,
                        use_create_time: obj.createdAt,
                        use_city: obj.city,
                        use_quanhuyen: obj.district,
                        use_update_time: obj.updatedAt,
                    });
                }
            }
            if (flagNtd) {
                return fnc.success(res, 'Danh sách online', { dataNtdFinal, dataUvFinal, time: t2 - t });
            } else {
                return fnc.success(res, 'Danh sách online', { dataUvFinal, time: t2 - t });
            }
        } else {
            return functions.setError(res, "cannot take data")
        }
    } catch (error) {
        console.log(error)
        return functions.setError(res, error)
    }
}


exports.getTblTag = async(req, res) => {
    const list = await tags.find();
    return fnc.success(res, "danh sách tbl tag", {
        data: list
    });
}