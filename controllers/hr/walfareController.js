const Users = require('../../models/Users');
const AchievementFors = require('../../models/hr/AchievementFors');
const DepartmentDetails = require('../../models/qlc/Deparment');
const InfringesFors = require('../../models/hr/InfringesFors');
const thuongPhat = require('../../models/Tinhluong/Tinhluong365ThuongPhat');
const functions = require('../../services/functions');
const hr = require('../../services/hr/hrService');
// thêm khen thưởng cá nhân
exports.addAchievement = async (req, res, next) => {
    try {
        let comId = Number(req.infoLogin.comId);
        let achievementId = req.body.achievement_id;
        let content = req.body.content;
        let listUser = [];
        let type = 1;
        let price = req.body.price;
        let createdBy = req.body.created_by;
        let achievementType = req.body.achievement_type;
        let appellation = req.body.appellation;
        let achievementLevel = req.body.achievement_level;
        let createdAt = new Date();
        let list_user1 = req.body.list_user;
        let list_user_name1 = req.body.list_user_name;
        let resion = req.body.resion;
        // await Users.findByIdAndUpdate(19,{'inForPerson.employee.com_id':1761})

        if (Array.isArray(list_user1) && Array.isArray(list_user_name1)) {
            for (let j = 0; j < list_user1.length; j++) {
                let check_user = await Users.findOne({ 'inForPerson.employee.com_id': comId, idQLC: Number(list_user1[j]) }, { _id: 1 })
                if (check_user) {
                    listUser.push({ userId: list_user1[j], name: list_user_name1[j] });
                } else {
                    return functions.setError(res, 'not found user', 400)
                }
            }
            if (list_user1.length > 1) {
                type = 2;
            }
            let achievementAt = req.body.achievement_at;

            let maxId = await AchievementFors.findOne({}, {}, { sort: { id: -1 } }).lean() || 0;
            let id = Number(maxId.id) + 1;
            if (achievementId && content && createdBy && achievementAt && achievementType && appellation && achievementLevel) {
                await AchievementFors.create({
                    id,
                    comId, achievementId, content, createdBy, achievementType, appellation, achievementLevel, achievementAt
                    , createdAt, type, listUser
                })
            } else {
                return functions.setError(res, 'missing data', 400)
            }
            if (achievementType === 6) {
                if (!price || await functions.checkNumber(price) === false) {
                    return functions.setError(res, 'invalid price', 400)
                }
                for (let i = 0; i < listUser.length; i++) {
                    let maxIdThuongPhat = await functions.getMaxIdByField(thuongPhat, 'pay_id');

                    await thuongPhat.create({
                        pay_id: maxIdThuongPhat,
                        pay_id_user: listUser[i].userId,
                        pay_id_com: comId,
                        pay_price: price,
                        pay_status: 1,
                        pay_day: createdAt,
                        pay_month: createdAt.getMonth() + 1,
                        pay_year: createdAt.getFullYear(),
                        pay_case: resion
                    })
                }

            }
            return functions.success(res, 'Thành công')
        }
        return functions.setError(res, 'nhập đúng kiểu dữ liệu của id user hoặc tên', 400)
    } catch (error) {
        console.log("🚀 ~ file: walfareController.js:72 ~ exports.addAchievement= ~ error:", error)
        return functions.setError(res, error)
    }
}

// thêm khen thưởng tập thể
exports.addAchievementGroup = async (req, res, next) => {
    try {
        let comId = Number(req.infoLogin.comId);
        let achievementId = req.body.achievement_id;
        let content = req.body.content;
        let type = 2;
        let createdBy = req.body.created_by;
        let achievementAt = req.body.achievement_at;
        let depId = Number(req.body.depId);
        let depName = req.body.depName;
        let checkDep = await DepartmentDetails.findOne({ dep_id: depId, com_id: comId });
        let price = req.body.price;
        let resion = req.body.resion;
        if (!checkDep) {
            return functions.setError(res, 'Không tìm thấy phòng ban', 404)
        }

        let achievementType = req.body.achievement_type;
        let appellation = req.body.appellation;
        let achievementLevel = req.body.achievement_level;
        let createdAt = new Date();
        if (achievementId && content && depId && createdBy && achievementAt && achievementType && appellation && achievementLevel) {
            id = await hr.getMaxId(AchievementFors)
            await AchievementFors.create({
                id, comId, achievementId, content, createdBy,
                achievementType, appellation, achievementLevel
                , createdAt, type, depId, depName, achievementAt
            })
        } else {
            return functions.setError(res, 'missing data', 400)
        }
        if (achievementType == 6) {
            if (!price || await functions.checkNumber(price) === false) {
                return functions.setError(res, 'invalid price', 400)
            }
            let listEmployee = await Users.find({ 'inForPerson.employee.com_id': comId, 'inForPerson.employee.dep_id': depId }, { idQLC: 1 })
            if (listEmployee.length === 0) {
                return functions.setError(res, 'Không tìm thấy nhân viên', 400)
            }
            for (let i = 0; i < listEmployee.length; i++) {
                let maxIdThuongPhat = await functions.getMaxIdByField(thuongPhat, 'pay_id');
                await thuongPhat.create({
                    pay_id: maxIdThuongPhat,
                    pay_id_user: listEmployee[i].idQLC,
                    pay_id_com: comId,
                    pay_price: price,
                    pay_status: 1,
                    pay_day: createdAt,
                    pay_month: createdAt.getMonth() + 1,
                    pay_year: createdAt.getFullYear(),

                })
            }

        }
        return functions.success(res, 'success')
    } catch (error) {
        console.log("🚀 ~ file: walfareController.js:57 ~ exports.addAchievementGroup= ~ error:", error)
        return functions.setError(res, error, 400)
    }
}

// Sửa khen thưởng 
exports.updateAchievement = async (req, res, next) => {
    try {
        let comId = Number(req.infoLogin.comId);
        let achievementId = req.body.achievement_id;
        let content = req.body.content;
        let id = Number(req.body.id);
        let listUser = [];
        let listUpdate = [];
        if (!id) return functions.setError(res, 'Invalid id', 400)
        let list_user = req.body.list_user;
        let list_user_name = req.body.list_user_name;
        let createdBy = req.body.created_by;
        let achievementAt = req.body.achievement_at;
        let achievementType = req.body.achievement_type;
        let appellation = req.body.appellation;
        let achievementLevel = req.body.achievement_level;
        let depId = Number(req.body.depId);
        let depName = req.body.depName;

        let updatedAt = new Date();
        let check = await AchievementFors.findOne({ id, comId });
        if (!check) {
            return functions.setError(res, 'không tìm thấy khen thưởng', 404)
        }
        if (depId) {
            let checkDep = await DepartmentDetails.findOne({ dep_id: depId, com_id: comId });
            if (!checkDep) {
                return functions.setError(res, 'Không tìm thấy phòng ban', 404)
            }
            listUpdate = {
                achievementId, content, createdBy, achievementType, appellation, achievementLevel, achievementAt
                , updatedAt, depId, depName, listUser: []
            }
            if (achievementId && content && createdBy && achievementAt && achievementType && appellation && achievementLevel) {
                await AchievementFors.findOneAndUpdate({ id: id }, listUpdate)
                return functions.success(res, 'success')
            }
            return functions.setError(res, 'missing data', 400)

        }
        if (Array.isArray(list_user) && Array.isArray(list_user_name)) {

            for (let j = 0; j < list_user.length; j++) {
                let check_user = await Users.findOne({ 'inForPerson.employee.com_id': comId, idQLC: Number(list_user[j]) }, { _id: 1 })
                if (check_user) {
                    listUser.push({ userId: list_user[j], name: list_user_name[j] });
                } else {
                    return functions.setError(res, 'not found user', 400)
                }
            }
            let listUpdate = {
                achievementId, content, createdBy, achievementType, appellation, achievementLevel, achievementAt
                , updatedAt, listUser
            }
            if (achievementId && content && createdBy && achievementAt && achievementType && appellation && achievementLevel) {
                await AchievementFors.findOneAndUpdate({ id: id }, listUpdate)
                return functions.success(res, 'Sửa lương thưởng thành công')
            }
            return functions.setError(res, 'missing data', 400)
        }
        return functions.setError(res, 'nhập đúng kiểu dữ liệu của id user hoặc tên', 400)
    } catch (error) {
        return functions.setError(res, error)
    }
}

// danh sách khen thưởng
exports.listAchievement = async (req, res, next) => {
    try {
        let page = Number(req.query.page) || 1;
        let pageSize = Number(req.query.pageSize) || 10;
        let keyWords = req.query.keyWords || null;
        let type = Number(req.query.type);
        let comId = req.infoLogin.comId;
        if (await functions.checkNumber(page) === false || await functions.checkNumber(pageSize) === false) {
            return functions.setError(res, 'invalid Number', 400)
        }
        let skip = (page - 1) * pageSize;
        let data = [];
        let totalAchievementFors = 0;
        if (keyWords && type === 1) {
            data = await AchievementFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, type: 1, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalAchievementFors = await AchievementFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, type: 1, comId }).count();
            if (!data || data.length === 0) {
                data = await AchievementFors.find({ content: { $regex: `.*${keyWords}.*` }, type: 1, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
                totalAchievementFors = await AchievementFors.find({ content: { $regex: `.*${keyWords}.*` }, type: 1, comId }).count();
            }
        }
        else if (keyWords && type === 2) {
            data = await AchievementFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, type: 2, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalAchievementFors = await AchievementFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, type: 2, comId }).count();
            if (!data || data.length === 0) {
                data = await AchievementFors.find({ content: { $regex: `.*${keyWords}.*` }, comId, type: 2 }).sort({ id: -1 }).skip(skip).limit(pageSize);
                totalAchievementFors = await AchievementFors.find({ content: { $regex: `.*${keyWords}.*` }, type: 2, comId }).count();
            }
        } else if (keyWords && type === 3) {
            data = await AchievementFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalAchievementFors = await AchievementFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, comId }).count();
            if (!data || data.length === 0) {
                data = await AchievementFors.find({ content: { $regex: `.*${keyWords}.*` }, comId }).sort({ id: -1 }).skip(skip).limit(pageSize);
                totalAchievementFors = await AchievementFors.find({ content: { $regex: `.*${keyWords}.*` }, comId }).count();
            }
        }
        else if (!keyWords && type === 1) {
            data = await AchievementFors.find({ type: 1, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalAchievementFors = await AchievementFors.find({ type: 1, comId }).count();
        } else if (!keyWords && type === 2) {
            data = await AchievementFors.find({ type: 2, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalAchievementFors = await AchievementFors.find({ type: 2, comId }).count();
        } else {
            data = await AchievementFors.find({ comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalAchievementFors = await AchievementFors.find({ comId }).count();
        }


        let arr = [];
        for (let i = 0; i < data.length; i++) {
            let textName = '';
            let textId = '';
            if (data[i].listUser && data[i].listUser.length > 0) {
                data[i].listUser.map(item => {
                    textName += item.name + ',';
                    textId += item.userId + ',';
                })
            }
            textName = textName.slice(0, -1)
            textId = textId.slice(0, -1)
            let obj = {};
            let element = data[i];
           
            
            if(element.achievementAt){
                var dateAchive = await hr.getDate(element.achievementAt)
                
            } 
            let dateCreated_at = await hr.getTime(element.createdAt)
            obj.id = element.id;
            obj.achievement_id = element.achievementId;

            obj.list_user = textId;
            obj.list_user_name = textName;
            obj.content = element.content;
            obj.created_by = element.createdBy;
            obj.achievement_at = dateAchive;
            obj.achievement_type = element.achievementType;
            obj.appellation = element.appellation;
            obj.achievement_level = element.achievementLevel;
            obj.type = element.type;
            obj.com_id = element.comId;
            obj.created_at = dateCreated_at;
            obj.dep_name = element.depName;
            obj.dep_id = element.depId;
            arr.push(obj);
        }

        return hr.success(res, 'get data success', {total:totalAchievementFors, data:arr })

    } catch (error) {
        console.log("🚀 ~ file: walfareController.js:168 ~ exports.listAchievement= ~ error:", error)
        return hr.setError(res, error)
    }
}

// thêm mới kỉ luật cá nhân
exports.addInfinges = async (req, res, next) => {
    try {
        let comId = Number(req.infoLogin.comId);
        let regulatoryBasis = req.body.regulatory_basis;
        let infringeName = req.body.infringe_name;
        let listUser = [];
        let createdBy = req.body.created_by;
        let infringeAt = req.body.infringe_at;

        let infringeType = req.body.infringe_type;
        let numberViolation = req.body.number_violation;
        let createdAt = new Date();
        let type = 1;
        let list_user = req.body.list_user;
        let list_user_name = req.body.list_user_name;
        let price = req.body.price;
        let resion = req.body.resion;
        if (Array.isArray(list_user) && Array.isArray(list_user_name)) {
            if (list_user.length > 1) type = 2;
            for (let j = 0; j < list_user.length; j++) {
                let check_user = await Users.findOne({ 'inForPerson.employee.com_id': comId, idQLC: Number(list_user[j]) }, { _id: 1 })
                if (check_user) {
                    listUser.push({ userId: list_user[j], name: list_user_name[j] });
                } else {
                    return functions.setError(res, 'Không tìm thấy nhân viên', 400)
                }
            }
            let id = await hr.getMaxId(InfringesFors)
            if (regulatoryBasis && infringeName && createdBy && infringeAt && infringeType && numberViolation && price) {
                await InfringesFors.create({
                    id,
                    comId, regulatoryBasis, infringeName, createdBy, infringeAt, infringeType, numberViolation
                    , createdAt, type, listUser
                })
                for (let i = 0; i < list_user.length; i++) {
                    let maxIdThuongPhat = await functions.getMaxIdByField(thuongPhat, 'pay_id');
                    await thuongPhat.create({
                        pay_id: maxIdThuongPhat,
                        pay_id_user: list_user[i],
                        pay_id_com: comId,
                        pay_price: price,
                        pay_status: 2,
                        pay_day: createdAt,
                        pay_month: createdAt.getMonth() + 1,
                        pay_year: createdAt.getFullYear(),
                        pay_case: resion
                    })
                }
                return functions.success(res, 'add data success')
            }
        }

        return functions.setError(res, 'Nhập đúng kiểu dữ liệu', 400)
    } catch (error) {
        console.log("🚀 ~ file: walfareController.js:168 ~ exports.listAchievement= ~ error:", error)
        return functions.setError(res, error)
    }
}

// thêm mới kỉ luật tập thể
exports.addInfingesGroup = async (req, res, next) => {
    try {
        let comId = req.infoLogin.comId;
        let regulatoryBasis = req.body.regulatory_basis;
        let infringeName = req.body.infringe_name;
        let createdBy = req.body.created_by;
        let infringeAt = req.body.infringe_at;
        let infringeType = req.body.infringe_type;
        let numberViolation = req.body.number_violation;
        let createdAt = new Date();
        let type = 2;
        let depId = Number(req.body.dep_id);
        let depName = req.body.dep_name;
        let price = req.body.price;
        let resion = req.body.resion;
        let checkDep = await DepartmentDetails.findOne({ dep_id: depId, com_id: comId });
        if (!checkDep) {
            return functions.setError(res, 'Không tìm thấy phòng ban', 404)
        }

        if (regulatoryBasis && infringeName && infringeAt && infringeType && numberViolation) {
            let listEmployee = await Users.find({ 'inForPerson.employee.com_id': comId, 'inForPerson.employee.dep_id': depId }, { idQLC: 1 })
            if (listEmployee && listEmployee.length === 0) {
                return functions.setError(res, 'không tìm thấy nhân viên trong phòng ban', 404)
            }
            let id = await hr.getMaxId(InfringesFors)
            await InfringesFors.create({
                id,
                comId, regulatoryBasis, infringeName, createdBy, infringeAt, infringeType, numberViolation
                , createdAt, type, depName, depId
            })
            for (let i = 0; i < listEmployee.length; i++) {
                let maxIdThuongPhat = await functions.getMaxIdByField(thuongPhat, 'pay_id');
                await thuongPhat.create({
                    pay_id: maxIdThuongPhat,
                    pay_id_user: listEmployee[i].idQLC,
                    pay_id_com: comId,
                    pay_price: price,
                    pay_status: 2,
                    pay_day: createdAt,
                    pay_month: createdAt.getMonth() + 1,
                    pay_year: createdAt.getFullYear(),
                    pay_case: resion
                })
            }
        } else {
            return functions.setError(res, 'missing data', 400)
        }
        return functions.success(res, 'add data success')
    } catch (error) {
        console.log("🚀 ~ file: walfareController.js:168 ~ exports.listAchievement= ~ error:", error)
        return functions.setError(res, error)
    }
}

// sửa kỉ luật
exports.updateInfinges = async (req, res, next) => {
    try {
        let comId = Number(req.infoLogin.comId);

        let regulatoryBasis = req.body.regulatory_basis;
        let listUser = [];
        let id = Number(req.body.id);
        let infringeType = req.body.infringe_type;
        let numberViolation = req.body.number_violation;
        let list_user = req.body.list_user;
        let list_user_name = req.body.list_user_name;
        let infringeAt = req.body.infringe_at;
        let infringeName = req.body.infringe_name;
        let createdBy = req.body.created_by;
        let check = await InfringesFors.findOne({ id, comId });
        let listUpdate = [];

        let depId = Number(req.body.depId);
        let depName = req.body.depName;


        let updatedAt = new Date();
        if (!check) {
            return functions.setError(res, 'không tìm thấy data', 404)
        }
        if (depId) {
            let checkDep = await DepartmentDetails.findOne({ dep_id: depId, com_id: comId });
            if (!checkDep) {
                return functions.setError(res, 'Không tìm thấy phòng ban', 404)
            }
            listUpdate = {
                comId, regulatoryBasis, infringeName, infringeAt, createdBy, infringeType, numberViolation
                , updatedAt, depId, depName, listUser: []
            }
            if (regulatoryBasis && createdBy && createdBy && infringeType && numberViolation) {
                await InfringesFors.findOneAndUpdate({ id: id }, listUpdate)
                return functions.success(res, 'success')
            }
            return functions.setError(res, 'missing data', 400)
        }
        if (Array.isArray(list_user) && Array.isArray(list_user_name)) {
            for (let j = 0; j < list_user.length; j++) {
                let check_user = await Users.find({ idQLC: Number(list_user[j]) })
                if (check_user && check_user.length > 0) {
                    listUser.push({ userId: list_user[j], name: list_user_name[j] });
                } else {
                    return functions.setError(res, 'not found user', 400)
                }
            }
            listUpdate = {
                comId, regulatoryBasis, infringeName, infringeAt, createdBy, infringeType, numberViolation
                , updatedAt, listUser
            }
            if (regulatoryBasis && createdBy && createdBy && infringeType && numberViolation) {
                await InfringesFors.findOneAndUpdate({ id: id }, listUpdate)
                return functions.success(res, 'success')
            }
            return functions.setError(res, 'missing data', 400)
        }
        return functions.setError(res, 'Nhập đúng kiểu dữ liệu', 400)
    } catch (error) {
        console.log("🚀 ~ file: walfareController.js:42 ~ exports.addAchievement= ~ error:", error)
        return functions.setError(res, error)
    }
}

// danh sách kỉ luật
exports.listInfinges = async (req, res, next) => {
    try {
        let page = Number(req.query.page);
        let pageSize = Number(req.query.pageSize);
        let keyWords = req.query.keyWords || null;
        let type = Number(req.query.type);
        let comId = req.infoLogin.comId;
        if (await functions.checkNumber(page) === false || await functions.checkNumber(pageSize) === false) {
            return functions.setError(res, 'invalid Number', 400)
        }
        let skip = (page - 1) * pageSize;
        let data = [];
        let totalInfinges = 0;
        if (keyWords && type === 1) {
            data = await InfringesFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, type: 1, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalInfinges = await InfringesFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, type: 1, comId }).count();
            if (!data || data.length === 0) {
                data = await InfringesFors.find({ infringeName: { $regex: `.*${keyWords}.*` }, type: 1, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
                totalInfinges = await InfringesFors.find({ infringeName: { $regex: `.*${keyWords}.*` }, type: 1, comId }).count();
            }
        }
        else if (keyWords && type === 2) {
            data = await InfringesFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, type: 2, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalInfinges = await InfringesFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, type: 2, comId }).count();
            if (!data || data.length === 0) {
                data = await InfringesFors.find({ infringeName: { $regex: `.*${keyWords}.*` }, comId, type: 2 }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
                totalInfinges = await InfringesFors.find({ infringeName: { $regex: `.*${keyWords}.*` }, type: 2, comId }).count();
            }
        } else if (keyWords && type === 3) {
            data = await InfringesFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalInfinges = await InfringesFors.find({ "listUser.name": { $regex: `.*${keyWords}.*` }, comId }).count();
            if (!data || data.length === 0) {
                data = await InfringesFors.find({ infringeName: { $regex: `.*${keyWords}.*` }, comId, }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
                totalInfinges = await InfringesFors.find({ infringeName: { $regex: `.*${keyWords}.*` }, comId }).count();
            }
        }
        else if (!keyWords && type === 1) {
            data = await InfringesFors.find({ type: 1, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalInfinges = await InfringesFors.find({ type: 1, comId }).count();
        } else if (!keyWords && type === 2) {
            data = await InfringesFors.find({ type: 2, comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalInfinges = await InfringesFors.find({ type: 2, comId }).count();
        } else {
            data = await InfringesFors.find({ comId }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalInfinges = await InfringesFors.find({ comId }).count();
        }
        let arr = [];
        for (let i = 0; i < data.length; i++) {
            let textName = '';
            let textId = '';
            if (data[i].listUser && data[i].listUser.length > 0) {
                data[i].listUser.map(item => {
                    textName += item.name + ',';
                    textId += item.userId + ',';
                })
            }

            textName = textName.slice(0, -1)
            textId = textId.slice(0, -1)
            let obj = {};
            let element = data[i];
           
            
            if(element.infringeAt){
                var dateAchive = await hr.getDate(element.infringeAt)
                var dateCreated_at = await hr.getTime(element.createdAt)
                
            } 

            obj.id = element.id;
            obj.infringe_name = element.infringeName;

            obj.list_user = textId;
            obj.list_user_name = textName;
            obj.regulatory_basis = element.regulatoryBasis;
            obj.number_violation = element.numberViolation;
            obj.created_by = element.createdBy;
            obj.infringe_at = dateAchive;
            obj.infringe_type = element.infringeType;
            obj.type = element.type;
            obj.com_id = element.comId;
            obj.dep_id = element.depId;
            obj.dep_name = element.depName;
            obj.created_at = dateCreated_at;
            obj.updated_at = null;
            arr.push(obj);
        }
        return hr.success(res, 'get data success', {total:totalInfinges, data:arr })
    } catch (error) {
        console.log("🚀 ~ file: walfareController.js:168 ~ exports.listAchievement= ~ error:", error)
        return hr.setError(res, error)
    }
}

// lấy danh sách  
exports.layDanhSachSua = async (req, res, next) => {
    try {
        let id = req.body.id;
        let model = req.body.model;
        let data = {};
        if (model === 'InfringesFors') {
            data = await InfringesFors.findById(id);
        } else if (model === 'AchievementFors') {
            data = await AchievementFors.findById(id);
        }
        return functions.success(res, 'get data success', { data })
    } catch (error) {
        return functions.setError(res, error)
    }
}


