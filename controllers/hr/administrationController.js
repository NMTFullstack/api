const Users = require('../../models/Users');
const ProvisionOfCompanys = require('../../models/hr/ProvisionOfCompanys');
const functions = require('../../services/functions');
const HR = require('../../services/hr/hrService');
const Policys = require('../../models/hr/Policys');
const EmployeePolicys = require('../../models/hr/EmployeePolicys');
const PerUser = require('../../models/hr/PerUsers');
const EmployeePolicySpecifics = require('../../models/hr/EmployeePolicySpecifics');

// thêm nhóm quy định
exports.addProvision = async (req, res, next) => {
    try {
        let name = req.body.name;
        let description = req.body.description;
        let timeStart = req.body.time_start;
        let supervisorName = req.body.supervisor_name;
        let comId = req.infoLogin.comId;
        let createdAt = new Date();
        let File = req.files;
        let link = '';

        if (name && description && timeStart && supervisorName) {

            if (File.policy) {
                let checkUpload = await HR.HR_UploadFile('policy', comId, File.policy, ['.gif', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.ods', '.odt', '.odp', '.pdf', '.rtf', '.sxc', '.sxi', '.txt'])
                if (checkUpload === false) {
                    return functions.setError(res, 'upload failed', 404)
                }
                link = checkUpload
            } else {
                link = null;
            }
            let id = await HR.getMaxId(ProvisionOfCompanys)
            await ProvisionOfCompanys.create({ id, name, description, timeStart, supervisorName, comId, createdAt, isDelete: 0, file: link })
        } else {
            return functions.setError(res, 'missing data', 404)
        }
        return functions.success(res, 'add provision success')
    } catch (error) {

        return functions.setError(res, error)
    }
}

// thêm quy định
exports.addPolicy = async (req, res, next) => {
    try {
        let name = req.body.name;
        let provisionId = Number(req.body.provision_id);
        let timeStart = req.body.time_start;
        let supervisorName = req.body.supervisor_name;
        let applyFor = req.body.apply_for;
        let content = req.body.content;
        let createdBy = req.infoLogin.name;
        let comId = Number(req.infoLogin.comId);
        let createdAt = new Date();
        let File = req.files;
        let link = '';

        if (name && provisionId && timeStart && supervisorName && applyFor && content) {

            if (await functions.checkNumber(provisionId) === false) {
                return functions.setError(res, 'invalid number', 404)
            }
            if (File.policy) {
                let checkUpload = await HR.HR_UploadFile('policy', comId, File.policy, ['.gif', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.ods', '.odt', '.odp', '.pdf', '.rtf', '.sxc', '.sxi', '.txt'])
                if (checkUpload === false) {
                    return functions.setError(res, 'upload failed', 404)
                }
                link = checkUpload
            } else {
                link = null;
            }
            let checkProvisionId = await ProvisionOfCompanys.findOne({ id: provisionId, isDelete: 0 })
            if (!checkProvisionId) {
                return functions.setError(res, 'not found data provision', 404)
            }
            let id = await HR.getMaxId(Policys)
            await Policys.create({ id, name, provisionId, timeStart, supervisorName, createdBy, comId, applyFor, content, createdAt, file: link })
        } else {
            return functions.setError(res, 'missing data', 404)
        }
        return functions.success(res, 'add policy success')
    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
}

// chỉnh sửa quy định
exports.updatePolicy = async (req, res, next) => {
    try {
        let infoLogin = req.infoLogin;
        let id = Number(req.body.id);
        let name = req.body.name;
        let provisionId = Number(req.body.provision_id);
        let timeStart = req.body.time_start;
        let supervisorName = req.body.supervisor_name;
        let applyFor = req.body.apply_for;
        let content = req.body.content;
        let createdBy = 'công ty';
        if (infoLogin.type != 1) {
            createdBy = infoLogin.name;
        }
        let comId = infoLogin.comId;
        let File = req.files;
        let fileName = null;

        if (id && name && provisionId && timeStart && supervisorName && applyFor && content) {

            if (await functions.checkNumber(provisionId) === false) {
                return functions.setError(res, 'invalid number', 404)
            }
            let check = await Policys.findOne({ id: id, isDelete: 0 });
            if (!check) {
                return functions.setError(res, 'not found policy', 404)
            }
            if (File.policy) {
                let checkUpload = await HR.HR_UploadFile('policy', comId, File.policy, ['.gif', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.ods', '.odt', '.odp', '.pdf', '.rtf', '.sxc', '.sxi', '.txt'])
                if (checkUpload === false) {
                    return functions.setError(res, 'upload failed', 404)
                }
                link = checkUpload
                await Policys.findOneAndUpdate({ id: id }, { file: link })
            }
            await Policys.findOneAndUpdate({ id: id }, { name, provisionId, timeStart, supervisorName, createdBy, comId, applyFor, content });
            return functions.success(res, 'update policy success')
        } else {
            return functions.setError(res, 'missing data', 404)
        }

    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
}

// danh sách nhóm quy định 
exports.listProvision = async (req, res, next) => {
    try {
        let page = req.query.page || 1;
        let pageSize = req.query.pageSize || 10;
        let keyWords = req.query.keyWords || null;
        let comId = req.infoLogin.comId;
        let skip = (page - 1) * pageSize;
        let data = [];
        let totalProvisionOfCompanys = 0;
        if (!keyWords) {
            data = await ProvisionOfCompanys.find({ comId, isDelete: 0 }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalProvisionOfCompanys = await ProvisionOfCompanys.find({ comId, isDelete: 0 }).count();
        } else {
            data = await ProvisionOfCompanys.find({ name: { $regex: `.*${keyWords}.*` }, comId, isDelete: 0 }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalProvisionOfCompanys = await ProvisionOfCompanys.find({ name: { $regex: `.*${keyWords}.*` }, comId, isDelete: 0 }).count();
        }
        data = await HR.getLinkFile(data, 'policy', comId)


        for (let i = 0; i < data.length; i++) {
            let element = data[i];
            element.supervisor_name = element.supervisorName;
            element.created_at = await HR.getDate(element.createdAt);
            delete element.createdAt;
            delete element.supervisorName;
        }

        return HR.success(res, 'get data success', { total: totalProvisionOfCompanys, data })
    } catch (error) {
        console.error(error)
        return HR.setError(res, error)
    }
}

// chi tiết nhóm quy định
exports.detailProvision = async (req, res, next) => {
    try {
        let comId = req.infoLogin.comId;
        let id = Number(req.query.id);
        let data = await ProvisionOfCompanys.aggregate([
            { $match: { id, comId, isDelete: 0 } },
            {
                $project: {
                    "id": "$id",
                    "description": "$description",
                    "name": "$name",
                    "time_start": "$timeStart",
                    "supervisor_name": "$supervisorName",
                    "created_at": "$createdAt",
                    "file": "$file"
                }
            }
        ]);
        data = await HR.getLinkFile(data, 'policy', comId);
        for (let i = 0; i < data.length; i++) {
            let element = data[i];
            element.time_start = await HR.getDate(element.time_start);
            element.created_at = await HR.getDate(element.created_at);
        }
        data = data[0]
        return HR.success(res, 'get data success', { data })
    } catch (error) {
        console.error(error)
        return HR.setError(res, error)

    }
}

// sửa nhóm quy định
exports.updateProvision = async (req, res, next) => {
    try {
        let name = req.body.name;
        let description = req.body.description;
        let timeStart = req.body.time_start;
        let supervisorName = req.body.supervisor_name;
        let comId = req.infoLogin.comId;
        let createdAt = new Date();
        let File = req.files;
        let link = '';
        let id = Number(req.body.id);
        if (id && name && description && timeStart && supervisorName) {

            let check = await ProvisionOfCompanys.findOne({ id, comId, isDelete: 0 });
            if (!check) return functions.setError(res, 'data not found', 404)
            if (File.policy) {
                let checkUpload = await HR.HR_UploadFile('policy', comId, File.policy, ['.gif', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.ods', '.odt', '.odp', '.pdf', '.rtf', '.sxc', '.sxi', '.txt'])
                if (checkUpload === false) {
                    return functions.setError(res, 'upload faild', 404)
                }
                link = checkUpload
                await ProvisionOfCompanys.findOneAndUpdate({ id }, { name, description, timeStart, supervisorName, comId, file: link })
            } else {
                await ProvisionOfCompanys.findOneAndUpdate({ id }, { name, description, timeStart, supervisorName, comId })
            }

        } else {
            return functions.setError(res, 'missing data', 404)
        }
        return functions.success(res, 'update provision success')
    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
}

// xoá nhóm quy định
exports.deleteProvision = async (req, res, next) => {
    try {
        let id = Number(req.body.id);
        let comId = req.infoLogin.comId;
        let check = await ProvisionOfCompanys.findOne({ id, comId, isDelete: 0 });
        if (!check) {
            return functions.setError(res, 'not found provision', 404)
        }
        await ProvisionOfCompanys.findOneAndUpdate({ id, comId }, { isDelete: 1, deletedAt: new Date() })
        return functions.success(res, 'delete provision success')
    } catch (error) {
        return functions.setError(res, error)
    }
}

// danh sách quy định theo nhóm quy định
exports.listPolicy = async (req, res, next) => {
    try {
        let id = Number(req.query.id);
        let comId = req.infoLogin.comId;
        // let data = await Policys.find({ provisionId: id, isDelete: 0 }).sort({ id: -1 });
        let data = await Policys.aggregate([
            { $match: { provisionId: id, isDelete: 0 } },
            { $sort: { id: -1 } },
            {
                $project: {
                    "id": "$id",
                    "name": "$name",
                    "provision_id": "$provisionId",
                    "time_start": "$timeStart",
                    "supervisor_name": "$supervisorName",
                    "apply_for": "$applyFor",
                    "content": "$content",
                    "file": "$file",
                    "created_by": "$createdBy",
                    "created_at": "$createdAt"
                }
            }
        ]);
        for (let i = 0; i < data.length; i++) {
            data[i].created_at = await HR.getDate(data[i].created_at)
        }
        data = await HR.getLinkFile(data, 'policy', comId)
        return HR.success(res, 'get data provision success', { data })
    } catch (error) {
        console.error(error)
        return HR.setError(res, error)
    }
}

// chi tiết quy định
exports.detailPolicy = async (req, res, next) => {
    try {
        let id = Number(req.query.id);
        let comId = req.infoLogin.comId;
        let searchItem = {
            "id": "$id",
            "provision_id": "$provisionId",
            "time_start": "$timeStart",
            "supervisor_name": "$supervisorName",
            "apply_for": "$applyFor",
            "content": "$content",
            "created_by": "$createdBy",
            "is_delete": "$isDelete",
            "created_at": "$createdAt",
            "name": "$name",
            "file": "$file",
            "deleted_at": "$deletedAt",
            "qd_name": "$ProvisionOfCompanys.name"

        }
        let data = await Policys.aggregate([
            { $match: { id, isDelete: 0 } },
            {
                $lookup: {
                    from: "HR_ProvisionOfCompanys",
                    localField: 'provisionId',
                    foreignField: 'id',
                    as: "ProvisionOfCompanys"
                }
            },
            { $unwind: '$ProvisionOfCompanys' },
            { $project: searchItem }
        ]);
        for (let i = 0; i < data.length; i++) {
            let element = data[i];
            element.time_start = await HR.getDate(element.time_start);
            element.created_at = await HR.getDate(element.created_at);
        }
        data = await HR.getLinkFile(data, 'policy', comId)
        data = data[0];
        return HR.success(res, 'get data provision success', { data })
    } catch (error) {
        console.error(error)
        return HR.setError(res, error)
    }
}

// Xoá quy định
exports.deletePolicy = async (req, res, next) => {
    try {
        let id = Number(req.body.id);
        let check = await Policys.findOne({ id, isDelete: 0 });
        if (!check) {
            return functions.setError(res, 'not found provision', 404)
        }
        await Policys.findOneAndUpdate({ id }, { isDelete: 1, deletedAt: new Date() })
        return functions.success(res, 'delete provision success')
    } catch (error) {
        return functions.setError(res, error)
    }
}

// Thêm mới nhóm chính sách
exports.addEmployeePolicy = async (req, res, next) => {
    try {
        let name = req.body.name;
        let description = req.body.description;
        let timeStart = req.body.time_start;
        let supervisorName = req.body.supervisor_name;
        let comId = req.infoLogin.comId;
        let File = req.files;
        let link = '';
        let createdAt = new Date();
        if (name && description && timeStart && supervisorName) {

            if (File.policy) {
                let checkUpload = await HR.HR_UploadFile('policy', comId, File.policy, ['.gif', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.ods', '.odt', '.odp', '.pdf', '.rtf', '.sxc', '.sxi', '.txt'])
                if (checkUpload === false) {
                    return functions.setError(res, 'upload faild', 404)
                }
                link = checkUpload
            } else {
                link = null;
            }
            let id = await HR.getMaxId(EmployeePolicys)
            await EmployeePolicys.create({ id, name, description, timeStart, supervisorName, comId, createdAt, file: link })
        } else {
            return functions.setError(res, 'missing data', 400)
        }
        return functions.success(res, 'add success')
    } catch (error) {
        return functions.setError(res, error)
    }
}

// Sửa nhóm chính sách
exports.updateEmployeePolicy = async (req, res, next) => {
    try {
        let name = req.body.name;
        let description = req.body.description;
        let timeStart = req.body.time_start;
        let supervisorName = req.body.supervisor_name;
        let id = Number(req.body.id);
        let comId = req.infoLogin.comId;
        let createdAt = new Date();
        let File = req.files;
        if (name && description && timeStart && supervisorName && id) {

            let check = await EmployeePolicys.findOne({ id, isDelete: 0 });
            if (!check) return functions.setError(res, 'not found employee policy', 404)
            if (File.policy) {
                let checkUpload = await HR.HR_UploadFile('policy', comId, File.policy, ['.gif', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.ods', '.odt', '.odp', '.pdf', '.rtf', '.sxc', '.sxi', '.txt'])
                if (checkUpload === false) {
                    return functions.setError(res, 'upload faild', 404)
                }
                link = checkUpload
                await EmployeePolicys.findOneAndUpdate({ id }, { name, description, timeStart, supervisorName, comId, createdAt, file: link })
            } else {
                await EmployeePolicys.findOneAndUpdate({ id }, { name, description, timeStart, supervisorName, comId, createdAt })
            }

        } else {
            return functions.setError(res, 'missing data', 400)
        }
        return functions.success(res, 'update data success')
    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
}

// xoá nhóm chính sách
exports.deleteEmployeePolicy = async (req, res, next) => {
    try {
        let id = Number(req.body.id);
        let comId = req.infoLogin.comId;
        let check = await EmployeePolicys.findOne({ id, comId, isDelete: 0 });
        if (!check) {
            return functions.setError(res, 'not found provision', 404)
        }
        await EmployeePolicys.findOneAndUpdate({ id, comId }, { isDelete: 1, deletedAt: new Date() })
        return functions.success(res, 'delete provision success')
    } catch (error) {
        return functions.setError(res, error)
    }
}

// Thêm mới chính sách
exports.addEmpoyePolicySpecific = async (req, res, next) => {
    try {
        // await HR.checkPermissions(req, res, next,'read',2);

        let name = req.body.name;
        let employeePolicyId = req.body.employe_policy_id;
        let timeStart = req.body.time_start;
        let supervisorName = req.body.supervisor_name;
        let applyFor = req.body.apply_for;
        let content = req.body.content;
        let createdBy = req.infoLogin.name;
        let comId = req.infoLogin.comId;
        let File = req.files;
        let link = '';
        let createdAt = new Date();

        if (name && employeePolicyId && timeStart && supervisorName && applyFor && content) {

            if (File.policy) {
                checkUpload = await HR.HR_UploadFile('policy', comId, File.policy, ['.gif', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.ods', '.odt', '.odp', '.pdf', '.rtf', '.sxc', '.sxi', '.txt'])
                if (checkUpload === false) {
                    return functions.setError(res, 'upload faild', 404)
                }
                link = checkUpload
            } else {
                link = null;
            }
            let id = await HR.getMaxId(EmployeePolicySpecifics)
            await EmployeePolicySpecifics.create({ id, name, employeePolicyId, timeStart, supervisorName, comId, applyFor, content, createdAt, createdBy, file: link })
        } else {
            return functions.setError(res, 'missing data', 400)
        }
        return functions.success(res, 'add success')
    } catch (error) {
        return functions.setError(res, error)
    }
}
// danh sách nhóm chính sách
exports.listEmpoyePolicy = async (req, res, next) => {
    try {
        let page = req.query.page;
        let pageSize = req.query.pageSize;
        let keyWords = req.query.keyWords || null;
        let comId = req.infoLogin.comId;
        if (!page || !pageSize) {
            return functions.setError(res, 'missing data', 400)
        }
        if (await functions.checkNumber(page) === false || await functions.checkNumber(pageSize) === false) {
            return functions.setError(res, 'invalid Number', 400)
        }
        let skip = (page - 1) * pageSize;
        let data = [];
        let totalEmpoyePolicy = 0;
        if (!keyWords) {
            data = await EmployeePolicys.find({ comId, isDelete: 0 }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalEmpoyePolicy = await EmployeePolicys.find({ comId, isDelete: 0 }).count();
        } else {
            data = await EmployeePolicys.find({ name: { $regex: `.*${keyWords}.*` }, comId, isDelete: 0 }).sort({ id: -1 }).skip(skip).limit(pageSize).lean();
            totalEmpoyePolicy = await EmployeePolicys.find({ name: { $regex: `.*${keyWords}.*` }, comId, isDelete: 0 }).count();
        }
        for (let i = 0; i < data.length; i++) {
            let element = data[i];
            element.time_start = HR.getDate(element.timeStart);
            element.supervisor_name = element.supervisorName;
            element.is_delete = element.isDelete;
            element.created_at = await HR.getDate(element.createdAt);
            delete element.timeStart;
            delete element.supervisorName;
            delete element.isDelete;
            delete element.createdAt;

        };
        data = await HR.getLinkFile(data, 'policy', comId)
        return HR.success(res, 'get data success', { total: totalEmpoyePolicy, data })
    } catch (error) {
        console.error(error)
        return HR.setError(res, error)
    }
}

// chi tiết nhóm chính sách
exports.getDetailPolicy = async (req, res, next) => {
    try {
        let comId = req.infoLogin.comId;
        let id = Number(req.query.id);
        // let data = await EmployeePolicys.find({ id, comId, isDelete: 0 });
        let data = await EmployeePolicys.aggregate([
            { $match: { id, comId, isDelete: 0 } },
            {
                $project: {
                    "id": "$id",
                    "name": "$name",
                    "time_start": "$timeStart",
                    "supervisor_name": "$supervisorName",
                    "description": "$description",
                    "is_delete": "$isDelete",
                    "com_id": "$comId",
                    "file": "$file",
                    "created_at": "$createdAt",
                    "deleted_at": "$deletedAt"
                }
            }
        ]);
        data = await HR.getLinkFile(data, 'policy', comId);
        for (let i = 0; i < data.length; i++) {
            let element = data[i];
            element.time_start = await HR.getDate(element.time_start);
            element.created_at = await HR.getDate(element.created_at);
            element.deleted_at = await HR.getDate(element.deleted_at);
        }
        data = data[0];
        return HR.success(res, 'get data success', { data })
    } catch (error) {
        console.error(error)
        return HR.setError(res, error)
    }
}

// danh sách chính sách theo nhóm chính sách
exports.listEmployeePolicySpecific = async (req, res, next) => {
    try {
        let id = req.query.id;
        let comId = req.infoLogin.comId;
        // let data = await EmployeePolicySpecifics.find({ employeePolicyId: id, isDelete: 0 }).sort({ id: -1 });
        let data = await EmployeePolicySpecifics.aggregate([
            { $match: { employeePolicyId: Number(id), isDelete: 0 } },
            { $sort: { id: -1 } },
            {
                $project: {
                    "id": 1,
                    "name": 1,
                    "time_start": "$timeStart",
                    "employe_policy_id": "$employePolicyId",
                    "supervisor_name": "$supervisorName",
                    "description": "$description",
                    "apply_for": "$applyFor",
                    "content": "$content",
                    "file": "$file",
                    "created_by": "$createdBy",
                    "created_at": "$createdAt"
                }
            }
        ]);
        for (let i = 0; i < data.length; i++) {
            let element = data[i];
            element.time_start = await HR.getDate(element.time_start);
            element.created_at = await HR.getDate(element.created_at);
        }
        data = await HR.getLinkFile(data, 'policy', comId)
        return HR.success(res, 'get data  success', { data })
    } catch (error) {
        console.error(error)
        return HR.setError(res, error)
    }
}

// chi tiết chính sách
exports.detailEmployeePolicySpecific = async (req, res, next) => {
    try {
        let id = Number(req.query.id);
        let comId = req.infoLogin.comId;
        let data = await EmployeePolicySpecifics.aggregate([{
            $lookup: {
                from: 'HR_EmployeePolicys',
                localField: 'employeePolicyId',
                foreignField: 'id',
                as: "EmployeePolicys"
            }
        },
        { $unwind: { path: '$EmployeePolicys', preserveNullAndEmptyArrays: true } },
        { $match: { id, isDelete: 0 } },
        {
            $project: {
                "id": "$id",
                "name": "$name",
                "time_start": "$timeStart",
                "employe_policy_id": "$employeePolicyId",
                "supervisor_name": "$supervisorName",
                "description": "$description",
                "content": "$content",
                "apply_for": "$applyFor",
                "is_delete": "$isDelete",
                "created_by": "$createdBy",
                "file": "$file",
                "created_at": "$createdAt",
                "updated_at": "$updatedAt",
                "deleted_at": "$deletedAt",
                "qd_name": "$EmployeePolicys.name"
            }
        }]);
        for (let i = 0; i < data.length; i++) {
            let element = data[i];
            element.time_start = await HR.getDate(element.time_start);
            element.created_at = await HR.getDate(element.created_at);

            if (element.updated_at) element.updated_at = await HR.getDate(element.updated_at);

        }
        data = await HR.getLinkFile(data, 'policy', comId);
        data = data[0];
        return HR.success(res, 'get data  success', { data })
    } catch (error) {
        console.error(error)
        return HR.setError(res, error)
    }
}

// Xoá chính sách
exports.deleteEmployeePolicySpecific = async (req, res, next) => {
    try {
        let id = Number(req.body.id);
        let check = await EmployeePolicySpecifics.findOne({ id });
        if (!check) {
            return functions.setError(res, 'not found provision', 404)
        }
        await EmployeePolicySpecifics.findOneAndUpdate({ id }, { isDelete: 1, deletedAt: new Date() })
        return functions.success(res, 'delete provision success')
    } catch (error) {
        return functions.setError(res, error)
    }
}


// Sửa chính sách
exports.updateEmployeePolicySpecific = async (req, res, next) => {
    try {
        // await HR.checkPermissions(req, res, next,'read',2);
        let name = req.body.name;
        let employeePolicyId = Number(req.body.employe_policy_id);
        let timeStart = req.body.time_start;
        let supervisorName = req.body.supervisor_name;
        let applyFor = req.body.apply_for;
        let content = req.body.content;
        let createdBy = req.infoLogin.name;
        let comId = req.infoLogin.comId;
        let id = Number(req.body.id);
        let File = req.files;
        let link = '';
        let updateAt = new Date();

        if (name && employeePolicyId && timeStart && supervisorName && applyFor && content && id) {
            let check = await EmployeePolicySpecifics.findOne({ id, isDelete: 0 })
            if (!check) return functions.setError(res, 'not found', 404);

            if (File.policy) {
                let checkUpload = await HR.HR_UploadFile('policy', comId, File.policy, ['.gif', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.ods', '.odt', '.odp', '.pdf', '.rtf', '.sxc', '.sxi', '.txt'])
                if (checkUpload === false) {
                    return functions.setError(res, 'upload faild', 404)
                }
                link = checkUpload
                await EmployeePolicySpecifics.findOneAndUpdate({ id }, {
                    name,
                    employeePolicyId,
                    timeStart,
                    supervisorName,
                    comId,
                    applyFor,
                    content,
                    updateAt,
                    createdBy,
                    file: link
                })
            } else {
                await EmployeePolicySpecifics.findOneAndUpdate({ id }, {
                    name,
                    employeePolicyId,
                    timeStart,
                    supervisorName,
                    comId,
                    applyFor,
                    content,
                    updateAt,
                    createdBy
                })
            }
        } else {
            return functions.setError(res, 'missing data', 400)
        }
        return functions.success(res, 'add success')
    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
}