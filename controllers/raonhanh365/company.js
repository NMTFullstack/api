const fnc = require('../../services/functions');
const New = require('../../models/Raonhanh365/New');
const CompanyRN = require('../../models/Users');
const md5 = require('md5');
const raoNhanh = require('../../services/raoNhanh365/service');
// thông tin tài khoản
exports.comInfo = async(req, res, next) => {
    try {
        // chưa xong
        const user = req.user.data;
        const conditions = {
            $or: [
                { $and: [{ buySell: 1 }, { userID: user._id }] },
                { $and: [{ buySell: 2 }, { userID: user._id }] },
                { userID: user._id }
            ]
        };
        const data = await New.countDocuments(conditions);
        data.user = user;
        return await fnc.success(res, "Thành công", data);
    } catch (error) {
        return fnc.setError(res, error.message);
    }
};

exports.getAndCheckData = async(req, res, next) => {
    try {
        let request = req.body,
            email = request.email,
            phoneTK = request.phoneTK,
            userName = request.userName,
            password = request.password,
            city = request.city,
            district = request.district,
            address = request.address,
            mst = request.mst,
            website = request.website,
            linkVideo = request.linkVideo,
            description = request.des,
            fromDevice = request.fromDevice,
            fromWeb = request.fromWeb,
            avatarUser = req.files.logo,
            image = req.files.image,
            ipAddressRegister = request.ipAddressRegister,
            videoType = req.files.videoType,
            lv = request.lv,
            video = '',
            link = '',
            avatar = "",
            lvID = 0,
            listIDKD = [],
            idKD = 0,
            empID = 0,
            type = 1,// tai khoan cong ty
            arr_idchat = request.arr_idchat,
            arr_idNotificationy=request.arr_idNotification;
        let fields = [userName, phoneTK, password, address];
        for(let i=0; i<fields.length; i++){
            if(!fields[i])
                return fnc.setError(res, `Missing input value ${i+1}`, 404);
        }
        let avatarName;
        if(avatarUser){
            if(!await fnc.checkImage(avatarUser.path)){
                return fnc.setError(res, 'ảnh sai định dạng hoặc lớn hơn 2MB', 405);
            }
            raoNhanh.uploadFileRaoNhanh('avt_com',1,avatarUser);
            avatarName = fnc.createLinkFileRaonhanh('avt_com', 1, avatarUser.name);
        }
        let listImg=[];
        if (image) {
            if(!await fnc.checkImage(image.path)) {
                return fnc.setError(res, 'ảnh sai định dạng hoặc lớn hơn 2MB', 405)
            }
            raoNhanh.uploadFileRaoNhanh('avt_com',1,image);
            imageName = fnc.createLinkFileRaonhanh('avt_com', 1, image.name);
            listImg.push({_id: 1, name: imageName, size: image.size});
        }
        
        req.info = {
            phoneTK: phoneTK,
            userName: userName,
            phone: phoneTK,
            email: email,
            password: md5(password),
            address: address,
            avatarUser: avatarName,
            city: city,
            type: type,
            inForCompany: {
                website: website,
                description: description,
                mst: mst,
                comImages: listImg
            }
        }
        return next();
    } catch (err) {
        console.log("Err from server", err);
        return fnc.setError(res, "Err from server", 500);
    }
}

exports.createCompany = async(req, res, next)=>{
    try{
        let fields = req.info;
        const maxIdCompany = await CompanyRN.findOne({}, { _id: 1 }).sort({ _id: -1 }).limit(1).lean();
        let newIdCompany;
        if (maxIdCompany) {
            newIdCompany = Number(maxIdCompany._id) + 1;
        } else newIdCompany = 1;
        fields._id = newIdCompany;
        fields.createdAt = Date(Date.now());
        let company = new CompanyRN(fields);
        await company.save();
        return fnc.success(res, 'Create CompanyRN365 success!');
    }catch(err){
        console.log("Err from server", err);
        return fnc.setError(res, "Err from server", 500);
    }
}

exports.updateCompany = async(req, res, next) => {
    try{
        if(!req.body._id)
            return fnc.setError(res, "Missing input value id company!", 404);
        let _id = req.body._id;
        let fields = req.info;
        let existsCompany = await CompanyRN.findOne({_id: _id});
        if(fields.avatarUser && existsCompany.avatarUser) {
            let nameFile = existsCompany.avatarUser.split("/");
            let len = nameFile.length;
            await fnc.deleteImgRaoNhanh(1, 'avt_com', nameFile[len-1])
        }
        if (existsCompany) {
            await CompanyRN.findByIdAndUpdate(_id, fields);
            return fnc.success(res, "Company edited successfully");
        }
        return fnc.setError(res, "Company not found!", 505);
    }catch(err){
        console.log("Err from server!", err);
        return fnc.setError(res, "Err from server!", 500);
    }
}

exports.getCompanyById = async(req, res, next) => {
    try {
        let comId = req.query.comId;
        if(!comId) {
            return fnc.setError(res, "Missing input comId value", 403);
        }
        
        let fields = {phoneTK: 1, userName: 1,phone: 1, email: 1, address: 1, avatarUser: 1, city: 1,type: 1,
            inForCompany: {
                website: 1, description: 1, mst: 1, comImages: 1
            }
        }
        let company = await CompanyRN.findOne({_id: comId}, fields);
        if(!company){
            return fnc.setError(res, "Company not found", 503);
        }
        return fnc.success(res, "get company by id success", {data: company });
    } catch (e) {
        console.log("Err from server", e);
        return fnc.setError(res, "Err from server", 500);
    }
}


exports.saveImage = async(req, res, next)=>{
    try{
        if(!req.body._id)
            return fnc.setError(res, "Missing input value id company!", 404);
        let _id = req.body._id;
        let fields = req.info;
        let existsCompany = await CompanyRN.findOne({_id: _id});
        if (existsCompany) {
            await CompanyRN.findByIdAndUpdate(_id, fields);
            return fnc.success(res, "Company edited successfully");
        }
        return fnc.setError(res, "Company not found!", 505);
        
    }catch(err){
        console.log("Err from server!", err);
        return fnc.setError(res, "Err from server!", 500);
    }
}