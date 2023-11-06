const functions = require('../../services/functions');
const hrService = require('../../services/hr/hrService');
const Users = require('../../models/Users');
const md5 = require("md5");

// lay ra danh sach cac vi tri cong viec trong cty
exports.getListEmployee= async(req, res, next) => {
    try {
        //check quyen
        let infoLogin = req.infoLogin;
        let comId = infoLogin.comId;
        let checkRole = await hrService.checkRole(infoLogin, 5, 2);
        if(!checkRole) {
            return functions.setError(res, "no right", 444);   
        }
        let companyName = infoLogin.name;
        if(infoLogin.type!=1){
          companyName = await Users.findOne({_id: comId}, {userName: 1});
        }
        let fields = {
          email: 1, phone: 1, userName: 1, address: 1, 
          'inForPerson.account':  {
            birthday: 1, gender: 1,married: 1,experience: 1,education: 1
          },
          'inForPerson.employee': {
            start_working_time: 1, dep_id: 1,position_id: 1
          }
        }

        //lay cac tham so truyen vao
        let {page, pageSize, depId, empId} = req.body;
        if(!page || !pageSize){
            return functions.setError(res, "Missing input page or pageSize", 401);
        }
        page = Number(req.body.page);
        pageSize = Number(req.body.pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        
        let listCondition = {"inForPerson.employee.com_id": comId, type: 2};
        // dua dieu kien vao ob listCondition
        if(empId) listCondition._id = empId;
        if(depId) listCondition["inForPerson.employee.dep_id"] = depId;
        var listEmployee = await functions.pageFindWithFields(Users, listCondition, fields, { _id: 1 }, skip, limit); 
        const totalCount = await functions.findCount(Users, listCondition);
        return functions.success(res, "Get list employee success", {totalCount: totalCount, companyName, listEmployee});
    } catch (e) {
        console.log("Err from server", e);
        return functions.setError(res, e.message);
    }
}

//them moi de test thoi
exports.createEmployee = async(req, res, next) => {
    try {
        let {userName, email, password, phone, address, comId, birthday, gender,married,experience,education,start_working_time, dep_id,position_id, role} = req.body;

        if(!userName || !email || !phone || !password) {
            return functions.setError(res, "Missing input value!", 404);
        }
        let infoLogin = req.infoLogin;
        if(!comId) {
          comId = infoLogin.comId;
        }
        //check quyen
        
        let checkRole = await hrService.checkRole(infoLogin, 5, 2);
        if(!checkRole) {
            return functions.setError(res, "no right", 444);   
        }
        const maxIdUser = await Users.findOne({}, { _id: 1 }).sort({ _id: -1 }).limit(1).lean();
        let newIdUser;
        if (maxIdUser) {
            newIdUser = Number(maxIdUser._id) + 1;
        } else newIdUser = 1;

        //tao quy trinh
        let user = new Users({
            _id: newIdUser,
            userName: userName,
            email: email,
            password: md5(password),
            phone: phone,
            address: address,
            type: 2,
            role: role,
            idQLC: newIdUser,
            inForPerson: {
              account: {
                birthday: birthday,
                gender: gender,
                married: married,
                experience: experience,
                education: education
              },
              employee: {
                com_id: comId,
                dep_id: dep_id,
                start_working_time: start_working_time,
                position_id: position_id
              }
            }
        });
        user = await user.save();
        return functions.success(res, 'Create employee success!');
    } catch (e) {
        console.log("Err from server!", e);
        return functions.setError(res, e.message);
    }
}

//chinh sua thong tin nhan vien
exports.updateEmployee = async(req, res, next) => {
    try {
        let {email, phone, userName, address, birthday, gender,married,experience,education,start_working_time, dep_id,position_id, empId} = req.body;
        if(!userName || !phone) {
            return functions.setError(res, "Missing input value!", 404);
        }
        //check quyen
        let infoLogin = req.infoLogin;
        let comId = infoLogin.comId;
        let checkRole = await hrService.checkRole(infoLogin, 5, 2);
        if(!checkRole) {
            return functions.setError(res, "no right", 444);   
        }

        //tao quy trinh
        let user = await Users.findOneAndUpdate({idQLC: empId},{
            userName: userName,
            phone: phone,
            address: address,
            inForPerson: {
              account: {
                birthday: birthday,
                gender: gender,
                married: married,
                experience: experience,
                education: education
              },
              employee: {
                com_id: comId,
                start_working_time: start_working_time,
                position_id: position_id
              }
            }
        });
        if(!user){
          return functions.setError(res, "Employee not found!", 504);
        }
        return functions.success(res, 'Update employee success!');
    } catch (e) {
        console.log("Err from server!", e);
        return functions.setError(res, e.message);
    }
}