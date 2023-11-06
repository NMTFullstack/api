const functions = require('../../services/functions');
const AdminUser = require('../../models/Raonhanh365/Admin/AdminUser');
const Category = require('../../models/Raonhanh365/Category');
const News = require('../../models/Raonhanh365/New');
const PriceList = require('../../models/Raonhanh365/PriceList');
const Users = require('../../models/Users');
const History = require('../../models/Raonhanh365/History');
const Blog = require('../../models/Raonhanh365/Admin/Blog');
const NetworkOperator = require('../../models/Raonhanh365/NetworkOperator')
const AdminUserRight = require('../../models/Raonhanh365/Admin/AdminUserRight');

const serviceRN = require('../../services/raoNhanh365/service');
const folderImg = "img_blog";
const md5 = require('md5');
const Cart = require("../../models/Raonhanh365/Cart");
const RegisterFail = require('../../models/Raonhanh365/RegisterFail');
const New = require('../../models/Raonhanh365/New');
const Order = require('../../models/Raonhanh365/Order');
const Module = require('../../models/Raonhanh365/Admin/Module');
const AdminUserLanguagues = require('../../models/Raonhanh365/Admin/AdminUserLanguagues');
const Language = require('../../models/Raonhanh365/Language');
const TagIndex = require('../../models/Raonhanh365/RN365_TagIndex.js');
const raonhanh = require('../../services/raoNhanh365/service');
const BaoCao = require('../../models/Raonhanh365/BaoCao');
const ImageDeplicate = require('../../models/Raonhanh365/ImageDeplicate');
const dotenv = require("dotenv");
dotenv.config();

//đăng nhập admin
exports.loginAdminUser = async (req, res, next) => {
    try {
        if (req.body.loginName && req.body.password) {
            const loginName = req.body.loginName
            const password = req.body.password
            let findUser = await functions.getDatafindOne(AdminUser, { loginName })
            if (findUser) {
                if (findUser.active !== 0) {
                    let checkPassword = await functions.verifyPassword(password, findUser.password)
                    if (checkPassword) {
                        let updateUser = await functions.getDatafindOneAndUpdate(AdminUser, { loginName }, {
                            date: new Date(Date.now())
                        }, { new: true });
                        const token = await functions.createToken(updateUser, "1d")
                        return functions.success(res, 'Đăng nhập thành công', { token: token })
                    }
                    return functions.setError(res, "Mật khẩu sai", 406);
                }
                return functions.setError(res, "Admin không còn hoạt động", 400)
            }
            return functions.setError(res, "Không tìm thấy tài khoản trong bảng admin user", 405)
        }
        return functions.setError(res, "Missing input value!", 404)
    } catch (error) {
        return functions.setError(res, error.message)
    }
}

exports.changePasswordAdminLogin = async (req, res, next) => {
    try {
        let idAdmin = req.infoAdmin._id;
        let findUser = await AdminUser.findOne({ _id: idAdmin });
        if (findUser) {
            const oldPass = req.body.oldPass;
            const newPass = req.body.newPass;
            if (oldPass && newPass) {
                let checkPassword = await functions.verifyPassword(oldPass, findUser.password)
                if (checkPassword) {
                    let updatePassword = await AdminUser.findOneAndUpdate({ _id: idAdmin }, {
                        password: md5(newPass),
                    }, { new: true });
                    if (updatePassword) {
                        return functions.success(res, "Update password success!");
                    }
                    return functions.setError(res, "Update password fail!", 407);
                }
                return functions.setError(res, "Wrong password!", 406);
            }
            return functions.setError(res, "Missing input value!", 405);
        }
        return functions.setError(res, "Admin not found!", 404);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.changeInfoAdminLogin = async (req, res, next) => {
    try {
        let idAdmin = req.infoAdmin._id;
        let findUser = await AdminUser.findOne({ _id: idAdmin });
        if (findUser) {
            let email = req.body.email;
            if (email) {
                let updateInfo = await AdminUser.findOneAndUpdate({ _id: idAdmin }, {
                    email: email,
                }, { new: true });
                if (updateInfo) {
                    return functions.success(res, "Update info admin success!");
                }
                return functions.setError(res, "Update info admin fail!", 407);
            }
            return functions.setError(res, "Admin not found!", 405);
        }
        return functions.setError(res, "Admin not found!", 404);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.listModule = async (req, res, next) => {
    try {
        let listModule = await Module.find({}).sort({ order: -1 });
        return functions.success(res, "Get list module success", { data: listModule });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.getSideBar = async (req, res, next) => {
    try {
        let idAdmin = req.infoAdmin._id;
        let admin = await AdminUser.findOne({ _id: idAdmin }).lean();
        if (admin) {
            let adminRight;
            if (admin.isAdmin == 1 && admin.loginName != 'admin') {
                adminRight = await AdminUserRight.aggregate([
                    { $match: { adminId: Number(idAdmin) } },
                    {
                        $lookup: {
                            from: "RN365_Module",
                            localField: "moduleId",
                            foreignField: "_id",
                            as: "Module"
                        }
                    },
                    { $unwind: { path: "$Module", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            "moduleId": "$moduleId",
                            "add": "$add",
                            "edit": "$edit",
                            "delete": "$delete",
                            "name": "$Module.name",
                            "path": "$Module.path",
                            "listName": "$Module.listName",
                            "listFile": "$Module.listFile",
                            "langId": "$Module.langId",
                            "checkLoca": "$Module.checkLoca",
                        }
                    },
                    { $sort: { moduleId: 1 } }
                ]);
            } else {
                adminRight = await Module.find({}).sort({ order: 1 }).lean();
            };
            if (admin.loginName == 'admin') {
                adminRight = await Module.find({}).sort({ order: 1 }).lean();
                for (let i = 0; i < adminRight.length; i++) {
                    const element = adminRight[i];
                    element.add = 1;
                    element.edit = 1;
                    element.delete = 1;
                }
            }

            admin = { ...admin, adminRight };
            return functions.success(res, "Get list module success", { admin });
        }
        return functions.setError(res, "Admin not found!", 404);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.changePassword = async (req, res, next) => {
    try {
        let idAdmin = req.body.idAdmin;
        let password = req.body.password;
        if (idAdmin && password) {
            let updatePassword = await AdminUser.findOneAndUpdate({ _id: idAdmin }, { password: md5(password) }, { new: true });
            if (updatePassword) {
                return functions.success(res, "Update password success");
            }
            return functions.setError(res, "Change password fail", 405);
        }
        return functions.setError(res, "Missing input idAdmin", 404);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.activeAdmin = async (req, res, next) => {
    try {
        let id = Number(req.body.id);
        let type = Number(req.body.type);
        let check = await AdminUser.find({ _id: id });
        if (check) {
            await AdminUser.findByIdAndUpdate(id, { active: type })
            return functions.success(res, 'success')
        }
        return functions.setError(res, 'not found admin ', 404)
    } catch (err) {
        return functions.setError(res, err.message)
    }
}
//--------------------------quan ly tai khoan admin

exports.getListAdminUser = async (req, res, next) => {
    try {
        let { idAdmin, page, pageSize } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let condition = { delete: 0 };
        if (idAdmin) condition._id = Number(idAdmin);
        let listAdminUser = await functions.pageFind(AdminUser, condition, { loginName: 1, active: -1 }, skip, limit);

        // lap qua danh sach user
        for (let i = 0; i < listAdminUser.length; i++) {
            let adminUserRight = await AdminUserRight.find({ adminId: listAdminUser[i]._id });
            let arrIdModule = [],
                arrRightAdd = [],
                arrRightEdit = [],
                arrRightDelete = [];
            let arrNameModule = "";
            let arrAdminLanguage = [];

            for (let j = 0; j < adminUserRight.length; j++) {
                let nameModule = await Module.findOne({ _id: adminUserRight[j].moduleId }, { _id: 1, name: 1 });
                arrIdModule.push(adminUserRight[j].moduleId);
                if (nameModule) {
                    if (arrNameModule != "") {
                        arrNameModule = `${arrNameModule}, ${nameModule.name}`;
                    } else {
                        arrNameModule = nameModule.name;
                    }
                }
                arrRightAdd.push(adminUserRight[j].add);
                arrRightEdit.push(adminUserRight[j].edit);
                arrRightDelete.push(adminUserRight[j].delete);
            }
            let adminLanguage = await AdminUserLanguagues.find({ adminId: listAdminUser[i]._id });
            let nameLanguage = "";
            for (let j = 0; j < adminLanguage.length; j++) {
                let nameL = await Language.findOne({ _id: adminLanguage[j].langId });
                if (nameL) {
                    if (nameLanguage != "") nameLanguage = `${nameLanguage}, ${nameL.name}`;
                    else nameLanguage = nameL.name;
                }

            }
            let adminUser = listAdminUser[i];
            let tmpOb = { adminUser, arrIdModule, arrNameModule, arrRightAdd, arrRightEdit, arrRightDelete, adminLanguage, nameLanguage };
            listAdminUser[i] = tmpOb;

        }
        const totalCount = await functions.findCount(AdminUser, condition);
        return functions.success(res, "get list blog success", { totalCount: totalCount, data: listAdminUser });
    } catch (error) {
        return functions.setError(res, error.message)
    }
}

exports.createAdminUser = async (req, res, next) => {
    try {
        let { loginName, password, name, phone, email, editAll, allCategory, arrLangId, accessModule, arrIdModule, arrRightAdd, arrRightEdit, arrRightDelete } = req.body;
        if (loginName && password && phone && email) {
            let maxIdAdmin = await functions.getMaxIdByField(AdminUser, '_id');
            let adminId = req.infoAdmin._id;
            password = md5(password);
            let fields = {
                _id: maxIdAdmin,
                loginName,
                password,
                name,
                phone,
                email,
                editAll,
                allCategory,
                langId: 1,
                active: 1,
                adminId: adminId
            }
            let adminUser = new AdminUser(fields);
            adminUser = await adminUser.save();
            if (adminUser && arrIdModule) {
                arrIdModule = arrIdModule.split(",");
                arrRightAdd = arrRightAdd.split(",");
                arrRightEdit = arrRightEdit.split(",");
                arrRightDelete = arrRightDelete.split(",");
                for (let i = 0; i < arrIdModule.length; i++) {
                    //tao id cho bang phan quyen
                    let newIdAdminUserRight = await functions.getMaxIdByField(AdminUserRight, '_id');
                    let fieldsRight = {
                        _id: newIdAdminUserRight,
                        adminId: maxIdAdmin,
                        moduleId: arrIdModule[i],
                        add: arrRightAdd[i],
                        edit: arrRightEdit[i],
                        delete: arrRightDelete[i]
                    }
                    let adminUserRight = new AdminUserRight(fieldsRight);
                    await adminUserRight.save();
                }
                if (arrLangId) {
                    arrLangId = arrLangId.split(",");
                    for (let i = 0; i < arrLangId.length; i++) {
                        let newIdLang = await functions.getMaxIdByField(AdminUserLanguagues, '_id');
                        let languagueAdmin = new AdminUserLanguagues({
                            _id: newIdLang,
                            adminId: maxIdAdmin,
                            langId: arrLangId[i]
                        });
                        await languagueAdmin.save();
                    }
                }

                return functions.success(res, 'Create AdminUser and AdminUserRight RN365 success!');
            }
            return functions.setError(res, "Insert info adminUser fail!");
        }
        return functions.setError(res, "Missing input password!");
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.updateAdminUser = async (req, res, next) => {
    try {
        let { _id, name, phone, email, editAll, allCategory, arrLangId, accessModule, arrIdModule, arrRightAdd, arrRightEdit, arrRightDelete } = req.body;
        let adminId = req.infoAdmin._id;
        if (_id && name && phone && email) {
            let fields = {
                name,
                phone,
                email,
                editAll,
                allCategory,
                langId: 1,
                adminId: adminId
            }
            let adminUser = await AdminUser.findOneAndUpdate({ _id: _id }, fields, { new: true });
            if (adminUser) {
                await AdminUserRight.deleteMany({ adminId: _id });

                arrIdModule = arrIdModule.split(",");
                arrRightAdd = arrRightAdd.split(",");
                arrRightEdit = arrRightEdit.split(",");
                arrRightDelete = arrRightDelete.split(",");
                for (let i = 0; i < arrIdModule.length; i++) {
                    //tao id cho bang phan quyen
                    let newIdAdminUserRight = await functions.getMaxIdByField(AdminUserRight, '_id');
                    let fieldsRight = {
                        _id: newIdAdminUserRight,
                        adminId: _id,
                        moduleId: arrIdModule[i],
                        add: arrRightAdd[i],
                        edit: arrRightEdit[i],
                        delete: arrRightDelete[i]
                    }
                    let adminUserRight = new AdminUserRight(fieldsRight);
                    await adminUserRight.save();
                }
                //xoa du lieu hien tai
                await AdminUserLanguagues.deleteMany({ adminId: _id });

                //them moi
                arrLangId = arrLangId.split(",");
                for (let i = 0; i < arrLangId.length; i++) {
                    let newIdLang = await functions.getMaxIdByField(AdminUserLanguagues, '_id');
                    let languagueAdmin = new AdminUserLanguagues({
                        _id: newIdLang,
                        adminId: _id,
                        langId: arrLangId[i]
                    });
                    await languagueAdmin.save();
                }
                return functions.success(res, 'Update AdminUser and AdminUserRight RN365 success!');
            }
            return functions.setError(res, "Admin user not found!");
        }
        return functions.setError(res, "Missing input value!");
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.deleteAdminUser = async (req, res, next) => {
    try {
        let adminId = req.body.adminId;
        if (adminId) {
            adminId = Number(adminId);
            let user = await functions.getDataDeleteOne(AdminUser, { _id: adminId });
            if (user.deletedCount === 1) {
                return functions.success(res, `Delete user with _id=${adminId} success`);
            } else {
                return functions.success(res, "User not found");
            }
        }
        return functions.setError(res, "Missing input adminId", 500);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.updateActiveAdmin = async (req, res, next) => {
    try {
        let id = Number(req.body.id);
        let check = await AdminUser.findOne({ _id: id }).lean();
        if (check) {
            if (check.active == 1) {
                await AdminUser.findByIdAndUpdate(id, { active: 0 })
            } else {
                await AdminUser.findByIdAndUpdate(id, { active: 1 })
            }
            return functions.success(res, 'success')
        }
        return functions.setError(res, 'not found admin ', 404)
    } catch (error) {
        return functions.setError(res, error.message);
    }
}
//-----------------------------------------------------------controller quan ly danh muc----------------------------------------------------------------

// lay ra danh sach
exports.getListCategory = async (req, res, next) => {
    try {
        let { _id, name, parentId } = req.body;
        let condition = { parentId: { $eq: 0 } };
        let conditionChild = {};
        if (_id) {
            let category = await Category.findOne({ _id: Number(_id) });
            if (category) return functions.success(res, "Get category success", { data: category });
            return functions.setError(res, "category not found!", 404);
        }
        if (name) {
            condition.name = new RegExp(name, 'i');
            conditionChild.name = new RegExp(name, 'i');
        }
        if (parentId) condition.parentId = parentId;
        let listCategoryParent = [];
        if (parentId) {
            listCategoryParent = await Category.find(condition).sort({ order: 1, name: 1 }).lean();
        } else {
            listCategoryParent = await Category.find(condition).sort({ type: 1 }).lean();
        }
        //lay ra danh muc con
        for (let i = 0; i < listCategoryParent.length; i++) {
            listCategoryParent[i].linkPicture = process.env.DOMAIN_RAO_NHANH + `/pictures/category/${listCategoryParent[i].picture}`;

            let categoryChild = await Category.find({ ...conditionChild, parentId: listCategoryParent[i]._id }).sort({ order: 1, name: 1 }).lean();
            for (let j = 0; j < categoryChild.length; j++) {
                categoryChild[j].linkPicture = process.env.DOMAIN_RAO_NHANH + `/pictures/category/${categoryChild[j].picture}`;
            }
            listCategoryParent[i].categoryChild = categoryChild;
        }
        const totalCount = await functions.findCount(Category, condition);
        return functions.success(res, "get list category success", { totalCount: totalCount, data: listCategoryParent });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.getAndCheckDataCategory = async (req, res, next) => {
    try {
        let { parentId, name, order, description } = req.body;
        let adminId = req.infoAdmin._id;
        if (name && order) {
            let namePicture = "";
            //upload anh
            if (req.files && req.files.picture) {
                let picture = req.files.picture;
                namePicture = await serviceRN.uploadFileRN2("category", picture, [".jpg", ".gif", ".png", ".swf"]);
                if (!namePicture) {
                    return functions.setError(res, "update file fail!", 406);
                }
            }

            // them cac truong muon them hoac sua
            req.info = {
                parentId: parentId,
                adminId: adminId,
                name: name,
                active: 1,
                show: 1,
                order: order,
                description: description,
                picture: namePicture,
            }
            if (parentId > 0) {
                await Category.findOneAndUpdate({ _id: parentId }, { hasChild: 1 }, { new: true });
            }
            return next();
        }
        return functions.setError(res, "Missing input value", 404)
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.createCategory = async (req, res, next) => {
    try {
        let fields = req.info;
        let newIdCategory = await functions.getMaxIdByField(Category, '_id');
        fields._id = newIdCategory;
        let category = new Category(fields);
        await category.save();
        return functions.success(res, 'Create category RN365 success!');
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.updateCategory = async (req, res, next) => {
    try {
        let cateID = Number(req.body.cateID);
        if (cateID) {
            let fields = req.info;
            let existsCategory = await Category.findOne({ _id: cateID });
            if (existsCategory) {

                await Category.findOneAndUpdate({ _id: cateID }, fields);
                return functions.success(res, "Category edited successfully");
            }
            return functions.setError(res, "Category not found!", 505);
        }
        return functions.setError(res, "Missing input value id cate!", 404);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.activeAndShowCategory = async (req, res, next) => {
    try {
        let { cateID, active, show } = req.body;
        if (cateID) {
            let updateCategory = await Category.findOneAndUpdate({ _id: cateID }, { active: active, show: show }, { new: true });
            if (updateCategory) {
                return functions.success(res, "Active or show success!");
            }
            return functions.setError(res, "Category not found!", 405);
        }
        return functions.setError(res, "Missing input value id cate!", 404);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

//---------------------------------------------------------controller quan ly tin(tin rao vat, tin mua)-----------------------------------------------
//-------gom ca quan ly tin tuyen dung va tin tim viec lam -----> bang cach su dung truong cateID de phan biet

//api lay ra danh sach va tim kiem tin
// khi truyen cateID = 120, 121 se lay dc tin tuyen dung va tin tim viec lam
exports.getListNews = async (req, res, next) => {
    try {
        let { page, pageSize, _id, buySell, title, cateID, email, fromDate, toDate } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        //lay cac tham so dieu kien tim kiem tin

        let condition = {};
        if (buySell) condition.buySell = Number(buySell); // 1: tin mua, 2: tin ban
        if (_id) condition._id = Number(_id);
        if (title) condition.title = new RegExp(title, 'i');
        if (cateID) condition.cateID = Number(cateID); // cate
        if (email) condition.email = new RegExp(email, 'i');

        // tu ngay den ngay
        if (fromDate && !toDate) condition.createTime = { $gte: new Date(fromDate) };
        if (toDate && !fromDate) condition.createTime = { $lte: new Date(toDate) };
        if (toDate && fromDate) condition.createTime = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        let fields = { _id: 1, title: 1, linkTitle: 1, description: 1, img: 1, cateID: 1, buySell: 1, createTime: 1, active: 1, city: 1, userID: 1, email: 1, updateTime: 1 };
        let listNews = await News.aggregate([
            { $match: condition },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "Users",
                    localField: "userID",
                    foreignField: "idRaoNhanh365",
                    as: "User"
                }
            },
            { $project: fields },
        ]);
        for (let i = 0; i < listNews.length; i++) {
            listNews[i].img = await raonhanh.getLinkFile(listNews[i].userID, listNews[i].img, listNews[i].cateID, listNews[i].buySell)
        };

        const totalCount = await News.countDocuments(condition);
        return functions.success(res, 'Get list news success', { totalCount, listNews });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.getAndCheckDataNews = async (req, res, next) => {
    try {
        let { title, description, money } = req.body;
        if (title) {
            // them cac truong muon them hoac sua
            req.info = {
                title: title,
                description: description,
                money: money
            }
            return next();
        }
        return functions.setError(res, "Missing input value", 404)
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.createNews = async (req, res, next) => {
    try {
        let fields = req.info;
        let newIdNews = await functions.getMaxIdByField(News, '_id');

        fields._id = newIdNews;
        fields.createTime = Date(Date.now());
        let news = new News(fields);
        await news.save();
        return functions.success(res, 'Create news RN365 success!');
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.updateNews = async (req, res, next) => {
    try {
        let newsID = req.body.newsID;
        if (newsID) {
            let fields = req.info;
            fields.updateTime = Date(Date.now());
            let existsNews = await News.findOne({ _id: newsID });
            if (existsNews) {
                await News.findOneAndUpdate({ _id: newsID }, fields);
                return functions.success(res, "News edited successfully");
            }
            return functions.setError(res, "News not found!", 505);
        }
        return functions.setError(res, "Missing input value id news!", 404);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.deleteNews = async (req, res, next) => {
    try {
        let newsID = req.body.newsID;
        if (newsID) {
            newsID = Number(newsID);
            let news = await functions.getDataDeleteOne(News, { _id: newsID });
            if (news.deletedCount === 1) {
                return functions.success(res, `Delete news with _id=${newsID} success`);
            } else {
                return functions.success(res, "News not found");
            }
        }
        return functions.setError(res, "Missing input newsID", 500);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.pinNews = async (req, res, next) => {
    try {
        let id = Number(req.body.id);
        let type = Number(req.body.type);
        let ngay_kthuc = req.body.ngay_kthuc;
        if (id && type && ngay_kthuc) {
            let check = await New.findById(id).lean();
            if (check) {
                if (type === 1) {
                    await New.findByIdAndUpdate(id, {
                        pinHome: 1,
                        timeStartPinning: new Date().getTime() / 1000,
                        dayStartPinning: new Date().getTime() / 1000,
                        dayEndPinning: new Date(ngay_kthuc).getTime() / 1000,
                    })
                } else if (type === 2) {
                    await New.findByIdAndUpdate(id, {
                        pinCate: 1,
                        timeStartPinning: new Date().getTime() / 1000,
                        dayStartPinning: new Date().getTime() / 1000,
                        dayEndPinning: new Date(ngay_kthuc).getTime() / 1000,
                    })
                } else {
                    return functions.setError(res, 'Nhập type = 1 hoặc type = 2', 400)
                }
                return functions.success(res, 'Ghim tin thành công')
            }
            return functions.setError(res, 'Không tìm thấy tin', 404)
        }

        return functions.setError(res, 'Missing data', 400)

    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.pushNews = async (req, res, next) => {
    try {
        let id = Number(req.body.id);
        let tienThanhToan = Number(req.body.tienThanhToan);
        let gioDayTin = Number(req.body.gioDayTin);
        let gio_lonnhat = gioDayTin;
        let gio_nhonhat = gioDayTin - 1;
        let so_ngay = Number(req.body.so_ngay);
        let noi_dung = 'Đẩy tin đăng ';
        let thoi_gian = new Date();
        let ngay_bdau = new Date(thoi_gian.getFullYear(), thoi_gian.getMonth(), thoi_gian.getDate()).getTime() / 1000;
        if (id && so_ngay) {
            let gio_ss = gio_nhonhat * 3600 + ngay_bdau
            if (gio_ss > thoi_gian.getTime() / 1000) {
                var ngay_kthuc = (ngay_bdau + (86400 * so_ngay) + (gio_lonnhat * 3600)) - 86400;
            } else {
                var ngay_kthuc = ngay_bdau + (86400 * so_ngay) + (gio_lonnhat * 3600);
            }
            let check = await New.findById(id).lean();
            if (check) {
                await New.findByIdAndUpdate(id,
                    {
                        new_day_tin: gioDayTin,
                        numberDayPinning: so_ngay,
                        timeStartPinning: thoi_gian.getTime() / 1000,
                        dayStartPinning: ngay_bdau,
                        dayEndPinning: ngay_kthuc,
                        moneyPinning: tienThanhToan
                    });
                let hisID = await functions.getMaxID(History) + 1 || 1;
                await History.create({
                    _id: hisID,
                    userId: check.userID,
                    price: tienThanhToan,
                    priceSuccess: tienThanhToan,
                    time: new Date(),
                    type: check.type,
                    content: noi_dung,
                    distinguish: 2
                })
                return functions.success(res, 'Đẩy tin thành công')
            }
            return functions.setError(res, 'Tin không tồn tại', 404)
        }
        return functions.setError(res, "Missing data", 400)
    } catch (error) {
        return functions.setError(res, error.message);
    }
}
//---------------------------------------------------------controller quan ly bang gia-----------------------------------------------

//api lay ra danh sach va tim kiem tin
exports.getListPriceList = async (req, res, next) => {
    try {
        //lay cac tham so dieu kien tim kiem tin
        let { _id, time, type } = req.body;

        let condition = {};
        if (_id) condition._id = Number(_id);
        if (type) condition.type = Number(type);
        if (time) condition.time = new RegExp(time);
        let fields = { _id: 1, time: 1, unitPrice: 1, discount: 1, intoMoney: 1, vat: 1, intoMoneyVat: 1 };

        let listPriceList = await PriceList.find(condition, fields);
        return functions.success(res, 'Get list PriceList success', { data: listPriceList })
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.update = async (req, res, next) => {
    try {
        let newsID = req.body.newsID;
        if (newsID) {
            newsID = Number(newsID);
            let fields = req.info;
            fields.updateTime = Date(Date.now());
            let existsNews = await News.findOne({ _id: newsID });
            if (existsNews) {

                await News.findOneAndUpdate({ _id: newsID }, fields);
                return functions.success(res, "News edited successfully");
            }
            return functions.setError(res, "News not found!", 505);
        }
        return functions.setError(res, "Missing input value id news!", 404);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}


//-------------------------------------------------------controller quan ly tai khoan(da xac nhan opt va chua xac nhan)tk gian hang-------------------------

exports.getListUser = async (req, res, next) => {
    try {
        let { idRaoNhanh365, userName, email, phoneTK, fromDate, toDate, page, pageSize, type } = req.body;
        //authentic => phan biet tai khoan bt va tk gian hang(xac thuc va chua xac thuc)
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;

        //mac dinh lay ra tai khoan ca nhan
        let condition = { idRaoNhanh365: { $ne: 0 }, type: { $ne: 1 } };
        if (type) condition.type = Number(type);
        if (idRaoNhanh365) condition.idRaoNhanh365 = Number(idRaoNhanh365);
        if (userName) condition.userName = new RegExp(userName);
        if (email) condition.email = new RegExp(email);
        if (phoneTK) condition.phoneTK = new RegExp(phoneTK);

        if (fromDate && !toDate) condition.createdAt = { $gte: new Date(fromDate) };
        if (toDate && !fromDate) condition.createdAt = { $lte: new Date(toDate) };
        if (toDate && fromDate) condition.createdAt = { $gte: new Date(fromDate), $lte: new Date(toDate) };

        let fields = { avatarUser: 1, idRaoNhanh365: 1, userName: 1, authentic: 1, email: 1, phoneTK: 1, createdAt: 1, "inforRN365.money": 1 };

        let listUsers = await functions.pageFindWithFields(Users, condition, {
            "avatarUser": "$avatarUser",
            "idRaoNhanh365": "$idRaoNhanh365",
            "userName": "$userName",
            "type": "$type",
            "authentic": "$authentic",
            "email": "$email",
            "phoneTK": "$phoneTK",
            "phone": "$phone",
            "createdAt": "$createdAt",
            "money": "$inforRN365.money",
        }, { idRaoNhanh365: -1 }, skip, limit);

        for (let i = 0; i < listUsers.length; i++) {
            if (!listUsers[i].money) listUsers[i].money = 0;
            let linkAvatarUser = process.env.DOMAIN_RAO_NHANH + `/pictures/avt_dangtin/${listUsers[i].avatarUser}`;
            listUsers[i].linkAvatarUser = linkAvatarUser;
        }
        const totalCount = await Users.countDocuments(condition);
        return functions.success(res, 'Get list news success', { totalCount, listUsers })
    } catch (error) {
        return functions.setError(res, error.message)
    }
}


exports.updateUser = async (req, res, next) => {
    try {
        let { userName, email, phoneTK, phone, money, cong, tru, userID, type } = req.body;

        if (userID && type) {
            if (type == 1) {
                type = { $in: [0, 2] }
            } else {
                type = 1
            }
            if (!cong && cong != "") cong = 0
            if (!tru && tru != "") tru = 0
            if (phoneTK && phoneTK != 'null') {
                let checkPhone = await functions.checkPhoneNumber(phoneTK);
                userID = Number(userID)
                if (checkPhone) {
                    let checkPhoneTK = await Users.findOne({ phoneTK, idRaoNhanh365: { $nin: [userID, 0] }, type }).lean();
                    if (checkPhoneTK) return functions.setError(res, "Số điện thoại đã được sử dụng", 400);
                    let checkUser = await Users.findOne({ phoneTK, idRaoNhanh365: userID, type }).lean();
                    if (!checkUser) return functions.setError(res, "Không tìm thấy tài khoản", 400);
                    if (!phone) phone = 0
                    let fields = {
                        userName: userName,
                        phoneTK: phoneTK,
                        email: email,
                        phone: phone,
                        'inforRN365.money': Number(money) + Number(cong) - Number(tru)
                    }
                    if (!checkUser.inforRN365) {
                        delete fields['inforRN365.money'];
                        fields.inforRN365 = { money: Number(money) + Number(cong) - Number(tru) }
                    }
                    if (cong != 0 || tru != 0) {
                        let price = 0;
                        cong = Number(cong);
                        tru = Number(tru);
                        if (cong && !tru) price = cong;
                        if (tru && !cong) price = tru;
                        if (cong && tru) price = cong - tru;
                        let maxId = await functions.getMaxIdByField(History, '_id');
                        if (cong > tru) {
                            let history = new History({
                                _id: maxId,
                                userId: Number(userID),
                                price: price,
                                priceSuccess: price,
                                time: Date.now(),
                                content: 'Nạp tiền',
                            });
                            let check = await history.save();
                        }
                    }
                    fields.updateAt = Date(Date.now());
                    await Users.findOneAndUpdate({ idRaoNhanh365: userID, type }, fields);
                    return functions.success(res, "User edited successfully");
                }
                return functions.setError(res, "invalid phoneTK", 405);
            } else {
                let checkEmail = await Users.findOne({ email, idRaoNhanh365: { $nin: [userID, 0] }, type }).lean();
                if (checkEmail) return functions.setError(res, "Email đã được sử dụng", 400);
                let checkUser = await Users.findOne({ email, idRaoNhanh365: userID, type }).lean();
                if (!checkUser) {
                    return functions.setError(res, "Không tìm thấy tài khoản", 400);
                }
                if (!phoneTK) phoneTK = 0
                let fields = {
                    userName: userName,
                    phoneTK: phoneTK,
                    email: email,
                    phone: phone,
                    'inforRN365.money': Number(money) + Number(cong) - Number(tru)
                }
                if (!checkUser.inforRN365) {
                    delete fields['inforRN365.money'];
                    fields.inforRN365 = { money: Number(money) + Number(cong) - Number(tru) }
                }

                if (cong != 0 || tru != 0) {
                    let price = 0;
                    cong = Number(cong);
                    tru = Number(tru);
                    if (cong && !tru) price = cong;
                    if (tru && !cong) price = tru;
                    if (cong && tru) price = cong - tru;
                    if (cong > tru) {
                        let maxId = await functions.getMaxIdByField(History, '_id');
                        let history = new History({
                            _id: maxId,
                            userId: Number(userID),
                            price: price,
                            priceSuccess: price,
                            time: Date.now(),
                            content: 'Nạp tiền',
                        });
                        let check = await history.save();
                    }
                }
                fields.updateAt = Date(Date.now());
                await Users.findOneAndUpdate({ idRaoNhanh365: userID, type }, fields);
                return functions.success(res, "User edited successfully");
            }
        }
        return functions.setError(res, "Missing input value", 404)
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

//------------------tin spam
exports.getListNewsSpam = async (req, res, next) => {
    try {
        let { page, pageSize, fromDate, toDate, id, tin_trung } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 20;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        let condition = { duplicate: { $nin: ["", "0", null] } };
        if (fromDate && !toDate) condition.createTime = { $gte: new Date(fromDate) };
        if (!fromDate && toDate) condition.createTime = { $lte: new Date(toDate) };
        if (fromDate && toDate) condition.createTime = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        if (id) condition._id = Number(id);
        if (tin_trung) condition.title = new RegExp(tin_trung, 'i');
        let fields = { _id: 1, title: 1, linkTitle: 1, createTime: 1, img: 1, active: 1, duplicate: 1, userID: 1, cateID: 1 };
        let total = await functions.findCount(News, condition);
        let listNewsSpam = await functions.pageFindWithFields(News, condition, fields, { _id: -1 }, skip, pageSize);
        for (let i = 0; i < listNewsSpam.length; i++) {
            let arrIdNews = listNewsSpam[i].duplicate;
            arrIdNews = arrIdNews.split(",");
            let listDuplice = [];
            for (let j = 0; j < arrIdNews.length; j++) {
                let news = await News.findOne({ _id: arrIdNews[j] }, { _id: 1, title: 1, linkTitle: 1 }).lean();
                if (news) listDuplice.push(news);
            }
            listNewsSpam[i].listDuplice = listDuplice;
        }
        return functions.success(res, "Get list news spam success:", { total, data: listNewsSpam });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.activeNewsSpam = async (req, res, next) => {
    try {
        let newsId = req.body.newsId;
        if (newsId) {
            let news = await News.findOneAndUpdate({ _id: Number(newsId) }, { duplicate: "0" }, { new: true });
            if (news) {
                return functions.success(res, "active new success");
            }
            return functions.setError(res, "News not found!", 404);
        }
        return functions.setError(res, "Missing input newsId", 405);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

//-------------------------------------------------------controller lich su nap the -------------------------

exports.getListHistory = async (req, res, next) => {
    try {
        //lay cac tham so dieu kien tim kiem tin
        let { page, pageSize, _id, userName, userId, seri, fromDate, toDate } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        //lay cac tham so dieu kien tim kiem tin

        let condition = {};
        let condition2 = {};
        if (fromDate && !toDate) condition.time = { $gte: new Date(fromDate) };
        if (toDate && !fromDate) condition.time = { $lte: new Date(toDate) };
        if (toDate && fromDate) condition.time = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        if (_id) condition._id = Number(_id);
        if (userName) condition2["User.userName"] = new RegExp(userName, 'i');
        if (userId) condition.userId = Number(userId);
        if (seri) condition.seri = new RegExp(seri, 'i');
        let listHistory = await History.aggregate([
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $match: condition },
            {
                $lookup: {
                    from: "Users",
                    localField: "userId",
                    foreignField: "idRaoNhanh365",
                    as: "User"
                }
            },
            { $unwind: { path: "$User", preserveNullAndEmptyArrays: true } },
            { $match: condition2 },
            {
                $project: {
                    "_id": "$_id",
                    "userId": "$userId",
                    "seri": "$seri",
                    "price": "$price",
                    "priceSuccess": "$priceSuccess",
                    "time": "$time",
                    "userName": "$User.userName",
                }
            }
        ])
        for (let i = 0; i < listHistory.length; i++) {
            if (!listHistory[i].userName) listHistory[i].userName = "";
        }
        let total = await History.aggregate([
            { $match: condition },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'userId',
                    foreignField: 'idRaoNhanh365',
                    as: 'User'
                }
            },
            { $unwind: { path: "$User", preserveNullAndEmptyArrays: true } },
            { $match: condition2 },
            {
                $count: "count"
            }
        ]);
        total = total.length != 0 ? total[0].count : 0;
        return functions.success(res, 'Get list history success', { total, data: listHistory })
    } catch (error) {
        return functions.setError(res, error.message);
    }
}


//-------------------------------------------------------controller quan ly blog -------------------------

exports.getListBlog = async (req, res, next) => {
    try {
        let { page, pageSize, title, blogId } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let listCondition = {};

        // dua dieu kien vao ob listCondition
        if (title) listCondition.title = new RegExp(title, 'i');
        if (blogId) listCondition._id = Number(blogId);
  
        let fieldsGet = {
            adminId: 1,
            langId: 1,
            title: 1,
            url: 1,
            image: 1,
            keyword: 1,
            sapo: 1,
            des: 1,
            detailDes: 1,
            date: 1,
            adminEdit: 1,
            dateLastEdit: 1,
            order: 1,
            active: 1,
            new: 1,
            hot: 1,
            titleRelate: 1,
            contentRelate: 1
        }

        let listBlog = await functions.pageFind(Blog, listCondition, { hot: -1, _id: -1 }, skip, limit);
        for (let i = 0; i < listBlog.length; i++) {
            let linkImage = `https://raonhanh365.vn/pictures/news/${listBlog[i].image}`;
            listBlog[i].linkImage = linkImage;
        }
        const totalCount = await functions.findCount(Blog, listCondition);
        return functions.success(res, "get list blog success", { totalCount: totalCount, data: listBlog });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.getAndCheckDataBlog = async (req, res, next) => {
    try {
        let image;
        if (req.files) {
            image = req.files.image;
        }
        if (!image) return functions.setError(res, `Missing input image`, 405);
        let { title, url, des, keyword, sapo, active, hot, detailDes, titleRelate, contentRelate, newStatus, date, dateLastEdit } = req.body;
        let adminId = req.infoAdmin._id;
        // them cac truong muon them hoac sua
        req.info = {
            adminId: adminId,
            title: title,
            url: url,
            image: image,
            des: des,
            keyword: keyword,
            sapo: sapo,
            active: active,
            hot: hot,
            new: newStatus,
            detailDes: detailDes,
            titleRelate: titleRelate,
            contentRelate: contentRelate,
        }
        return next();
    } catch (error) {
        console.error(error)
        return functions.setError(res, error.message);
    }
}


//admin tạo 1 blog
exports.createBlog = async (req, res, next) => {
    try {
        let fields = req.info;
        let newIdBlog = await functions.getMaxIdByField(Blog, '_id');
        fields._id = newIdBlog;

        if (!fields.date) {
            fields.date = Date();
        }
        //luu anh
        let image = fields.image;
        if (!await functions.checkImage(image.path)) {
            return functions.setError(res, 'ảnh sai định dạng hoặc lớn hơn 2MB', 405);
        }
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let dateTime = Math.round(date.getTime() / 1000);
        let upload = await serviceRN.uploadFileRaoNhanh("news", `${year}/${month}/${day}`, image, ['.png', '.jpg', '.jpeg', '.gif', '.psd', '.pdf', '.jpg', '.docx', '.png'], dateTime, "comment");
        fields.image = `${year}/${month}/${day}/${dateTime}_${upload}`;
        fields.date = date
        fields.dateLastEdit = date
        let blog = new Blog(fields);
        await blog.save();
        return functions.success(res, 'Create blog RN365 success!');
    } catch (error) {
        console.error(error)
        return functions.setError(res, error.message);
    }
}

exports.updateBlog = async (req, res, next) => {
    try {
        let _id = req.body._id;
        if (!_id) return functions.setError(res, "Missing input value id blog!", 404);
        let fields = req.info;
        if (!fields.dateLastEdit) {
            fields.dateLastEdit = Date(Date.now());
        }
        let image = fields.image;
        if (!await functions.checkImage(image.path)) {
            return functions.setError(res, 'ảnh sai định dạng hoặc lớn hơn 2MB', 405);
        }

        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        let existsBlog = await Blog.findOne({ _id: _id });
        if (existsBlog) {
            fields.dateLastEdit = new Date();
            let dateTime = Math.round(date.getTime() / 1000);
            let upload = await serviceRN.uploadFileRaoNhanh("news", `${year}/${month}/${day}`, image, ['.png', '.jpg', '.jpeg', '.gif', '.psd', '.pdf', '.jpg', '.docx', '.png'], dateTime, "comment");
            fields.image = `${year}/${month}/${day}/${dateTime}_${upload}`;
            //cap nhat du lieu
            await Blog.findOneAndUpdate({ _id: _id }, fields);
            return functions.success(res, "Blog edited successfully");
        }

        return functions.setError(res, "Blog not found!", 505);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.activeBlog = async (req, res, next) => {
    try {
        let id = Number(req.body.id);
        let type = Number(req.body.type);
        let checkActiveBlog = await Blog.findById(id);
        if (checkActiveBlog) {
            let active = 0;
            let hot = 0;
            if (checkActiveBlog && checkActiveBlog.active == 0) {
                active = 1;
            }
            if (checkActiveBlog && checkActiveBlog.hot == 0) {
                hot = 1;
            }
            if (type == 1) {
                await Blog.findByIdAndUpdate(id, { active: active });
            } else {
                await Blog.findByIdAndUpdate(id, { hot: hot });
            }
            return functions.success(res, 'success')
        }
        return functions.setError(res, "Blog not found!", 505);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

//-------Anh trung
exports.danhSachAnhTrung = async (req, res, next) => {
    try {
        let { id, new_id, anh_trung, fromDate, toDate, page, pageSize } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 30;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        let condition = {};
        fromDate = functions.convertTimestamp(fromDate);
        toDate = functions.convertTimestamp(toDate);
        if (fromDate && !toDate) condition.create_time = { $gte: fromDate }
        if (!fromDate && toDate) condition.create_time = { $lte: toDate }
        if (fromDate && toDate) condition.create_time = { $gte: fromDate, $lte: toDate }
        let conditions = {};
        if (id) conditions['New._id'] = Number(id);
        if (anh_trung) conditions['New.title'] = new RegExp(anh_trung, 'i')

        let data = await ImageDeplicate.aggregate([
            { $match: condition },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: pageSize },
            {
                $lookup: {
                    from: 'RN365_News',
                    localField: 'new_id',
                    foreignField: '_id',
                    as: 'New'
                }
            },
            { $unwind: { path: "$New", preserveNullAndEmptyArrays: true } },
            { $match: conditions },
            {
                $project: {
                    "id": "$id",
                    "usc_id": "$usc_id",
                    "img_check": "$img_check",
                    "list_img_dep": "$list_img_dep",
                    "new_id": "$new_id",
                    "create_time": "$create_time",
                    "active": "$active",
                    "title_new": "$New.title"
                }
            }
        ]);
        let arr = [];
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            if (!element.title_new) element.title_new = "";
            if (element.list_img_dep) {
                arr = element.list_img_dep.split(',');
            };
            delete element.list_img_dep
            element.arr = arr;
        }
        let total = await functions.findCount(ImageDeplicate, condition);
        return functions.success(res, "Danh sach anh trung", { total, data });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.activeAnhTrung = async (req, res, next) => {
    try {
        let { id, active } = req.body;
        if (id) {
            if (!active) active = 0;
            let anhTrung = await ImageDeplicate.findOneAndUpdate({ id: id }, { active: active }, { new: true });
            if (anhTrung) {
                return functions.success(res, "Active anh trung thanh cong");
            }
            return functions.setError(res, "Anh trung not found!", 406);
        }
        return functions.setError(res, "Missing input id", 405);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

//--------Duyet tin
//lay ra danh sach
exports.danhSachTinCanDuyet = async (req, res, next) => {
    try {
        let { page, pageSize, _id, title, updateTime, fromDate, toDate } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 30;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let condition = { kiem_duyet: 0 };
        if (_id) condition._id = Number(_id);
        if (title) condition.title = new RegExp(title, 'i');
        if (updateTime) condition.createTime = new Date(updateTime);
        if (fromDate && !toDate) condition.createTime = { $gte: new Date(fromDate) };
        if (toDate && !fromDate) condition.createTime = { $lte: new Date(toDate) };
        if (toDate && fromDate) condition.createTime = { $gte: new Date(fromDate), $lte: new Date(toDate) };

        let fields = { _id: 1, title: 1, linkTitle: 1, kiem_duyet: 1, createTime: 1, updateTime: 1 };
        let total = await functions.findCount(News, { kiem_duyet: 0 });
        let listNews = await functions.pageFindWithFields(News, condition, fields, { _id: -1 }, skip, limit);
        return functions.success(res, "Get danh sach tin can duyet thanh cong", { total, data: listNews });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

//duyet tin
exports.duyetTin = async (req, res, next) => {
    try {
        let _id = req.body._id;
        if (_id) {
            let activeNews = await News.findOneAndUpdate({ _id: _id }, { kiem_duyet: 1 }, { new: true });
            if (activeNews) {
                return functions.success(res, "Duyet tin thanh cong!");
            }
            return functions.setError(res, "Tin khong ton tai!", 406);
        }
        return functions.setError(res, "Missing input _id!", 405);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}
//---------Bao cao tin

// api danh sách tìm kiếm tin báo cáo
exports.listReportNew = async (req, res, next) => {
    try {
        let condition = {};
        let condition2 = {};
        let { id_user, userName, problem, fromDate, toDate, page, pageSize } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 30;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        fromDate = functions.convertTimestamp(fromDate);
        toDate = functions.convertTimestamp(toDate);
        if (id_user) condition.user_baocao = Number(id_user);
        if (fromDate && !toDate) condition.tgian_baocao = { $gte: fromDate }
        if (!fromDate && toDate) condition.tgian_baocao = { $lte: toDate }
        if (fromDate && toDate) condition.tgian_baocao = { $gte: fromDate, $lte: toDate }
        if (userName) condition2['user.userName'] = new RegExp(userName, 'i');
        if (problem) condition.van_de = Number(problem);

        let data = await BaoCao.aggregate([
            { $match: condition },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'user_baocao',
                    foreignField: 'idRaoNhanh365',
                    as: 'user'
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            { $match: condition2 },
            {
                $project: {
                    "_id": "$_id",
                    "new_baocao": "$new_baocao",
                    "user_baocao": "$user_baocao",
                    "new_user": "$new_user",
                    "tgian_baocao": "$tgian_baocao",
                    "van_de": "$van_de",
                    "mo_ta": "$mo_ta",
                    "da_xuly": "$da_xuly",
                    "userName": "$user.userName",
                }
            }
        ]);
        for (let i = 0; i < data.length; i++) {
            if (!data[i].userName) data[i].userName = "";
        }
        let total = await BaoCao.aggregate([
            { $match: condition },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'user_baocao',
                    foreignField: 'idRaoNhanh365',
                    as: 'user'
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            { $match: condition2 },
            {
                $count: "count"
            }
        ]);
        total = total.length != 0 ? total[0].count : 0;
        return functions.success(res, "get list report success", { total, data });
    } catch (error) {
        return functions.setError(res, error.message)
    }
}
// api sửa tin báo cáo
exports.xuLyBaoCao = async (req, res, next) => {
    try {
        let { id, da_xuly } = req.body;
        if (id) {
            if (!da_xuly) da_xuly = 0;
            let baoCaoTin = await BaoCao.findOneAndUpdate({ _id: id }, { da_xuly: da_xuly }, { new: true });
            if (baoCaoTin) {
                return functions.success(res, "Fix report success", { data: baoCaoTin });
            }
            return functions.setError(res, "Bao cao tin not found!", 406);
        }
        return functions.setError(res, "Missing input id", 405);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}


//-------------------------------------------------------controller giá ghim/day tin đăng -------------------------
//api tạo mới ghim tin đăng
exports.createAndUpdatePriceListPin = async (req, res, next) => {
    try {
        let { _id, time, unitPrice, discount, intoMoney, vat, intoMoneyVat, type, cardGift } = req.body;
        if ([1, 5, 3, 4].includes(Number(type))) {
            let fields = {
                time: time,
                unitPrice: unitPrice,
                discount: discount,
                intoMoney: intoMoney,
                vat: vat,
                intoMoneyVat: intoMoneyVat,
                type: type,
                cardGift: cardGift
            }
            if (!_id) {
                _id = await functions.getMaxIdByField(PriceList, '_id');
                fields._id = _id;
            }
            let priceList = await PriceList.findOneAndUpdate({ _id: _id }, fields, { new: true, upsert: true }).lean();
            if (priceList) {
                return functions.success(res, "Create or Update success", { priceList });
            }
            return functions.setError(res, "Update fail!", 406);
        }
        return functions.setError(res, "Missing input or type invalid!", 405);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

//api tạo mới ghim day tin
exports.updatePriceListPush = async (req, res, next) => {
    try {
        let { _id, time, unitPrice, discount, intoMoney, vat, intoMoneyVat, cardGift } = req.body;
        if (_id && time && unitPrice && intoMoney && intoMoneyVat) {
            let fields = {
                time: time,
                unitPrice: unitPrice,
                discount: discount,
                intoMoney: intoMoney,
                vat: vat,
                intoMoneyVat: intoMoneyVat,
                cardGift: cardGift
            }
            let priceList = await PriceList.findOneAndUpdate({ _id: _id, type: 2 }, fields, { new: true });
            if (priceList) {
                return functions.success(res, "Update success", { priceList });
            }
            return functions.setError(res, "Price list not found!", 406);
        }
        return functions.setError(res, "Missing input value!", 405);
    } catch (error) {
        return functions.setError(res, error.message);
    }
};

// api danh sách và tìm kiếm đẩy/ghim tin đăng 
exports.getListPrice = async (req, res, next) => {
    try {
        let { page, pageSize, type, _id, time, ghimTinNoiBat } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 30;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;

        if (type == 1 || type == 2) {
            let condition = {};
            if (_id) condition._id = Number(_id);
            if (time) condition.time = new RegExp(time, 'i');

            //gia ghim tin
            if (type == 1) condition.type = { $in: [1, 3, 4, 5] };
            //gia day tin
            if (type == 2) condition.type = 2;
            //gia ghim gian hang
            if (ghimTinNoiBat) condition.type = 1;

            let total = await functions.findCount(PriceList, condition);
            let priceList = await functions.pageFind(PriceList, condition, { _id: 1 }, skip, limit);
            return functions.success(res, "Lay ra danh sach gia day va ghim tin thanh cong", { total, data: priceList });
        }
        return functions.setError(res, "Truyen type=1, 2", 405);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

//-------------------------------------------------------API chiet khau nap the-------------------------

// api tìm kiếm và danh sách chiết khấu
exports.getListDiscountCard = async (req, res, next) => {
    try {
        let { page, pageSize, _id, operator } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 30;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;

        let conditions = { active: 1 };
        if (_id) conditions._id = Number(_id);
        if (operator) conditions.operator = new RegExp(operator, 'i');

        let count = await functions.findCount(NetworkOperator, conditions);
        let data = await NetworkOperator.find(conditions).sort({ _id: 1 }).skip(skip).limit(limit);
        return functions.success(res, "Get List Discount Card Success", { count, data });
    } catch (error) {
        return functions.setError(res, error.message)
    }
}

//chinh sua chiet khau
exports.updateDiscountCard = async (req, res, next) => {
    try {
        let { _id, operator, operatorName, discount } = req.body;
        if (_id && operator && operatorName && discount) {
            let updateDiscount = await NetworkOperator.findOneAndUpdate({ _id: _id }, {
                operator: operator,
                operatorName: operatorName,
                discount: discount
            }, { new: true });
            if (updateDiscount) {
                return functions.success(res, "Update Discount Success", { data: updateDiscount });
            }
            return funcitons.setError(res, "NetworkOperator not found!", 406);
        }
        return functions.setError(res, "Missing input value!", 405);
    } catch (error) {
        return functions.setError(res, error.message)
    }
}

exports.failRegisterUser = async (req, res, next) => {
    try {
        let page = req.body.page;
        let pageSize = req.body.pageSize;
        let skip = (page - 1) * pageSize;
        let limit = pageSize;
        let id = req.body.id;
        let thoiGianTu = req.body.thoiGianTu;
        let thoiGianDen = req.body.thoiGianDen;
        let condition = {};
        if (id) condition._id = id;
        if (thoiGianTu) condition.time = { $gte: new Date(thoiGianTu) }
        if (thoiGianDen) condition.time = { $lte: new Date(thoiGianDen) }
        if (thoiGianTu && thoiGianDen) condition.time = { $gte: new Date(thoiGianTu), $lte: new Date(thoiGianDen) }
        let count = await RegisterFail.find(condition, {}).count();
        let data = await RegisterFail.find(condition, {}).skip(skip).limit(limit)
        return functions.success(res, "get data success", { count, data })
    } catch (error) {
        return functions.setError(res, error.message)
    }
}

exports.getInfoForEdit = async (req, res, next) => {
    try {
        let model = req.body.model;
        let _id = req.body._id;
        let data = {};
        switch (model) {
            case 'Users':
                data = await Users.findById({ _id })
                break;

            case 'New':
                data = await functions.getDatafind(New, { _id })
                break;
            case 'Order':
                data = await Order.findById({ _id });
        }
        return functions.success(res, 'get data success', { data })
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

//----------------------- xac thuc thanh toan

exports.getListUserVerifyPayment = async (req, res, next) => {
    try {
        let { page, pageSize, fromDate, toDate, cccd, userName } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 50;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        let condition = { idRaoNhanh365: { $nin: [0, null] }, inforRN365: { $ne: null }, 'inforRN365.xacThucLienket': { $in: [1, 2] } };
        if (fromDate && !toDate) condition["inforRN365.time"] = { $gte: new Date(fromDate) };
        if (toDate && !fromDate) condition["inforRN365.time"] = { $lte: new Date(toDate) };
        if (toDate && fromDate) condition["inforRN365.time"] = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        if (cccd) condition["inforRN365.cccd"] = cccd;
        if (userName) condition.userName = new RegExp(userName, "i");

        let total = await functions.findCount(Users, condition);
        let data = await functions.pageFindWithFields(Users, condition,
            {
                "userName": "$userName",
                "phone": "$phone",
                "phoneTK": "$phoneTK",
                "idRaoNhanh365": "$idRaoNhanh365",
                "cccd": "$inforRN365.cccd",
                "cccdFrontImg": "$inforRN365.cccdFrontImg",
                "cccdBackImg": "$inforRN365.cccdBackImg",
                "bankName": "$inforRN365.bankName",
                "stk": "$inforRN365.stk",
                "xacThucLienket": "$inforRN365.xacThucLienket",
                "store_name": "$inforRN365.store_name",
                "store_phone": "$inforRN365.store_phone",
                "ownerName": "$inforRN365.ownerName",
                "time": "$inforRN365.time",
                "active": "$inforRN365.active",
                "money": "$inforRN365.money",
                "usc_tax_code": "$inforRN365.usc_tax_code",
                "usc_des": "$inforRN365.usc_des",
            },
            { "inforRN365.time": -1 }, skip, pageSize
        );

        for (let i = 0; i < data.length; i++) {
            let linkCccdFrontImg = process.env.DOMAIN_RAO_NHANH + `/pictures/avt_dangtin/${data[i].cccdFrontImg}`;
            let linkCccdBackImg = process.env.DOMAIN_RAO_NHANH + `/pictures/avt_dangtin/${data[i].cccdBackImg}`;
            data[i].linkCccdFrontImg = linkCccdFrontImg;
            data[i].linkCccdBackImg = linkCccdBackImg;
        }
        return functions.success(res, "get list user verify paymet success", { total, data });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.adminVerifyPayment = async (req, res, next) => {
    try {
        // xacThucLienket: 1 => da xac thuc, 2: cho admin xac thuc
        let { userId, xacThucLienket } = req.body;
        if (userId) {
            if (!xacThucLienket) xacThucLienket = 0;
            let user = await Users.findOne({ idRaoNhanh365: userId }, { _id: 1, userName: 1 });
            if (user) {
                if (xacThucLienket == 2 || xacThucLienket == 1) {
                    if (!user.inforRN365) await Users.findOneAndUpdate({ idRaoNhanh365: userId }, { inforRN365: { xacThucLienket: 1 } })
                    await Users.findOneAndUpdate({ idRaoNhanh365: userId }, {
                        'inforRN365.xacThucLienket': 1
                    }, { new: true });
                } else {
                    await Users.findOneAndUpdate({ idRaoNhanh365: userId }, {
                        inforRN365: {
                            cccd: null,
                            cccdFrontImg: null,
                            cccdBackImg: null,
                            bankName: null,
                            stk: null,
                            ownerName: null,
                            time: null,
                            xacThucLienket: 0,
                            money: user.inforRN365.money
                        }
                    }, { new: true });
                }
                let noidung_gui = "";
                if (xacThucLienket == 1) {
                    noidung_gui = "Xác thực đăng ký thanh toán đảm bảo thành công";
                } else if (xacThucLienket == 2) {
                    noidung_gui = "Đang xác thực đăng ký thanh toán đảm bảo";
                } else {
                    noidung_gui = "Xác thực đăng ký thanh toán đảm bảo không thành công, vui lòng xác thực lại";
                }
                //send chat
                // id tổng đài hỗ trợ hhp
                let id_nguoigui = 56387;
                await serviceRN.sendChat(id_nguoigui, user._id, noidung_gui);
                return functions.success(res, noidung_gui);
            }
            return functions.setError(res, "Users not fount!", 404);
        }
        return functions.setError(res, "Missing input value!", 404);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

//-----------------------nguoi mua xac thuc thanh toan

exports.getListOrderPayment = async (req, res, next) => {
    try {
        let { page, pageSize, _id, buyerName, fromDate, toDate, id } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 30;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        let conditions = {};
        if (_id) conditions._id = Number(_id);
        if (fromDate && !toDate) conditions.buyTime = { $gte: new Date(fromDate) };
        if (!fromDate && toDate) conditions.buyTime = { $lte: new Date(toDate) };
        if (fromDate && toDate) conditions.buyTime = { $gte: new Date(fromDate), $lte: new Date(toDate) };
        let conditions2 = {};
        if (buyerName) conditions2['Buyer.userName'] = new RegExp(buyerName, 'i');
        if (id) conditions2['Buyer.idRaoNhanh365'] = id;
        let count = await Order.aggregate([
            { $match: conditions },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'buyerId',
                    foreignField: 'idRaoNhanh365',
                    as: 'Buyer'
                }
            },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'sellerId',
                    foreignField: 'idRaoNhanh365',
                    as: 'Seller'
                }
            },
            { $count: "all" }
        ]);
        count = count[0];
        await Order.createIndexes({ buyerId: 1, newId: 1 });

        let data = await Order.aggregate([
            {
                $match: conditions
            },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'buyerId',
                    foreignField: 'idRaoNhanh365',
                    as: 'Buyer'
                }
            },
            { $unwind: { path: "$Buyer", preserveNullAndEmptyArrays: true } },
            { $match: conditions2 },
            {
                $lookup: {
                    from: 'Users',
                    localField: 'sellerId',
                    foreignField: 'idRaoNhanh365',
                    as: 'Seller'
                }
            },
            { $unwind: { path: "$Seller", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    "_id": "$_id",
                    "buyerId": "$buyerId",
                    "sellerId": "$sellerId",
                    "newId": "$newId",
                    "paymentType": "$paymentType",
                    "buyTime": "$buyTime",
                    "orderActive": "$orderActive",
                    "amountPaid": "$amountPaid",
                    "buyerName": "$Buyer.userName",
                    "sellerName": "$Seller.userName",
                }
            },
        ]);
        for (let i = 0; i < data.length; i++) {
            if (!data[i].buyerName) data[i].buyerName = "";
            if (!data[i].sellerName) data[i].sellerName = "";
        }

        return functions.success(res, "get list user verify paymet success", { count, data });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.adminVerifyOrder = async (req, res, next) => {
    try {
        let { orderId, active } = req.body;
        if (orderId) {
            if (!active) active = 0;
            let order = await Order.findOneAndUpdate({ _id: orderId }, { orderActive: active }, { new: true });
            if (order) {
                //gui qua chat
                let id_nguoigui = 56387; //code php fix cung
                let id_buyer = order.buyerId;
                let id_seller = order.sellerId;
                let buyer = await Users.findOne({ idRaoNhanh365: id_buyer }, { _id: 1 }).lean();
                let seller = await Users.findOne({ idRaoNhanh365: id_seller }, { _id: 1 }).lean();
                if (buyer && seller) {
                    //gui thong bao cho nguoi mua
                    id_buyer = buyer._id;
                    id_seller = seller._id;
                    let noidung_gui = "Không xác nhận đơn hàng";
                    if (active != 0) {
                        noidung_gui = "Đơn hàng của bạn được xác nhận";
                    }
                    await serviceRN.sendChat(id_nguoigui, id_buyer, noidung_gui);

                    // gửi thông báo qua chat: người mua sản phẩm gửi cho người bán sản phẩm
                    let ten_spham = "";
                    let news = await News.findOne({ _id: newId }, { title: 1 });
                    if (news) ten_spham = news.title;
                    noidung_gui = 'Đặt hàng mua sản phẩm của bạn qua hình thức thanh toán đảm bảo: ' + ten_spham;
                    await serviceRN.sendChat(id_buyer, id_seller, noidung_gui);
                    return functions.success(res, 'admin verify payment success!');
                }
                return functions.setError(res, "Gui qua chat fail because buyer or seller not found!", 406);
            }
            return functions.setError(res, "Order not fount!", 404);
        }
        return functions.setError(res, "Missing input value!", 405);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.activeNews = async (req, res, next) => {
    try {
        let { newId, active } = req.body;
        if (newId) {
            if (!active) active = 0;
            let news = await News.findOneAndUpdate({ _id: Number(newId) }, {
                active: active
            }, { new: true });
            if (news) {
                return functions.success(res, 'active news success!');
            }
            return functions.setError(res, "News not fount!", 404);
        }
        return functions.setError(res, "Missing input newId!", 405);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

//tag index
exports.getListTagsIndex = async (req, res, next) => {
    try {
        let { page, pageSize, type, _id, fromDate, toDate } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 30;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;

        if (type == 1 || type == 2 || type == 3 || type == 4 || type == 5 || type == 6) {
            let listCondition = {};
            //danh sach danh muc va tag
            if (type == 1) listCondition.classify = { $in: [1, 2] };

            //danh sach dia diem
            if (type == 2) listCondition.classify = { $in: [3, 14] };

            //danh sach tag + dia diem
            if (type == 3) listCondition.classify = { $in: [4, 9, 15] };

            //danh sach nganh nghe + tag nganh nghe
            if (type == 4) listCondition.classify = { $in: [5, 6] };

            //danh sach viec lam + dia diem
            if (type == 5) listCondition.classify = { $in: [10, 11] };

            //danh sach nganh nghe + tag nganh nghe
            if (type == 6) listCondition.classify = { $in: [12, 13] };
            if (fromDate && !toDate && functions.checkDate(fromDate)) {
                listCondition.time = { $gte: functions.convertTimestamp(fromDate) };
            }
            if (!fromDate && toDate && functions.checkDate(toDate)) {
                listCondition.time = { $lte: functions.convertTimestamp(toDate) };
            }
            if (fromDate && toDate && functions.checkDate(fromDate) && functions.checkDate(toDate)) {
                listCondition.time = { $gte: functions.convertTimestamp(fromDate), $lte: functions.convertTimestamp(toDate) };
            }

            if (_id) listCondition._id = Number(_id);
            let fieldsGet = { _id: 1, link: 1, cateId: 1, tags: 1, time: 1 }
            // const listTagsIndex = await functions.pageFindWithFields(TagIndex, listCondition, fieldsGet, { _id: -1 }, skip, limit);
            // const totalCount = await functions.findCount(TagIndex, listCondition);
            let listTagsIndex = await TagIndex.find(listCondition, fieldsGet).sort({ _id: -1 }).skip(skip).limit(limit);
            let totalCount = await TagIndex.countDocuments(listCondition)
            return functions.success(res, "get list tags index success", { totalCount: totalCount, data: listTagsIndex });
        }
        return functions.setError(res, "Nhập type = 1, 2, 3, 4, 5, 6", 400);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.deleteManyByModule = async (req, res, next) => {
    try {
        let moduleId = req.body.moduleId;
        let arrId = req.body.arrId;
        if (moduleId && arrId && arrId.length > 0) {
            let arrIdDelete = arrId.map(idItem => parseInt(idItem));

            //danh muc san pham
            if (moduleId == 15) {
                await Category.deleteMany({ _id: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công danh muc san pham!');
            }
            //tag index
            if (moduleId == 36) {
                await TagIndex.deleteMany({ _id: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công!');
            }
            //chiet khau nap tien
            if (moduleId == 39) {
                await NetworkOperator.deleteMany({ _id: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công!');
            }
            //32,33: gia ghim/day tin/ 22=gia ghim gian hang
            if (moduleId == 22 || moduleId == 32 || moduleId == 33) {
                await PriceList.deleteMany({ _id: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công!');
            }
            //14=tin rao vat, 30=tin dang mua, 28,29: tin tim viec, tin tuyen dung, 43: tin can duyet
            if (moduleId == 14 || moduleId == 28 || moduleId == 29 || moduleId == 30 || moduleId == 43 || moduleId == 40) {
                await News.deleteMany({ _id: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công!');
            }
            //23 = danh sach tai khoan, 26=tai khaon gian hang
            if (moduleId == 26 || moduleId == 23) {
                await Users.deleteMany({ idRaoNhanh365: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công!');
            }
            //25 = tin tuc
            if (moduleId == 25 || moduleId == 37) {
                await Blog.deleteMany({ _id: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công!');
            }
            //24 = lich su nap the
            if (moduleId == 24) {
                await History.deleteMany({ _id: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công!');
            }
            //31 = bao cao tin
            if (moduleId == 31) {
                await BaoCao.deleteMany({ _id: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công!');
            }
            //35 = xac thuc thanh toan dam bao
            if (moduleId == 35) {
                await Users.updateMany({ idRaoNhanh365: { $in: arrIdDelete } }, {
                    inforRN365: {
                        cccd: null,
                        cccdFrontImg: null,
                        cccdBackImg: null,
                        bankName: null,
                        stk: null,
                        ownerName: null,
                        time: null,
                        active: 0,
                        xacThucLienket: 0
                    }
                })
                return functions.success(res, 'xóa thành công!');
            }
            //34 = nguoi mua xac thuc thanh toan
            if (moduleId == 34) {
                await Order.deleteMany({ _id: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công!');
            }
            //anh trung
            if (moduleId == 42) {
                await ImageDeplicate.deleteMany({ id: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công!');
            }
            //38 = loi dang ky
            if (moduleId == 38) {
                await RegisterFail.deleteMany({ _id: { $in: arrIdDelete } });
                return functions.success(res, 'xóa thành công!');
            }
            return functions.setError(res, "Truyen dung moduleId muon xoa", 406);
        }
        return functions.setError(res, "Truyen moduleId va arrId dang mang", 405);
    } catch (error) {
        return functions.setError(res, error.message);
    }
}


