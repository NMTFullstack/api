const functions = require('../../services/functions');
const hrService = require('../../services/hr/hrService');
const Permision = require('../../models/hr/Permision');
const PermisionUser = require('../../models/hr/PermisionUser');
const Users = require('../../models/Users');

// lay ra danh sach tat ca cac quy trinh tuyen dung cua cty
exports.getListPermisionUser = async(req, res, next) => {
    try {
        let userId = req.body.userId;
        let infoLogin = req.infoLogin;
        if (infoLogin.type != 1) {
            return functions.setError(res, "Not company!");
        }

        let infoRoleTD = await PermisionUser.find({ userId: userId, barId: 1 });
        let infoRoleTTNS = await PermisionUser.find({ userId: userId, barId: 2 });
        let infoRoleTTVP = await PermisionUser.find({ userId: userId, barId: 3 });
        let infoRoleHNNV = await PermisionUser.find({ userId: userId, barId: 4 });
        let infoRoleBCNS = await PermisionUser.find({ userId: userId, barId: 5 });
        let infoRoleDXGD = await PermisionUser.find({ userId: userId, barId: 6 });
        let infoRoleTGL = await PermisionUser.find({ userId: userId, barId: 7 });

        let winform = Number(req.body.winform);
        if (winform === 1) {
            let arrCopy = [...infoRoleTD, ...infoRoleTTNS, ...infoRoleTTVP, ...infoRoleHNNV, ...infoRoleBCNS, ...infoRoleDXGD, ...infoRoleTGL];
            let arr = [];
            for (let i = 0; i < arrCopy.length; i++) {
                let obj = {};
                const element = arrCopy[i];
                obj.id = element.id;
                obj.user_id = element.userId;
                obj.per_id = element.perId;
                obj.bar_id = element.barId;
                arr.push(obj);
            }
            return hrService.success(res, 'Check quyền nhân viên', { list_permision: arr });
        }

        return functions.success(res, `Get list role user with id=${userId}`, { infoRoleTD, infoRoleTTNS, infoRoleTTVP, infoRoleHNNV, infoRoleBCNS, infoRoleDXGD, infoRoleTGL });
    } catch (e) {
        return functions.setError(res, e.message);
    }
}

exports.getListPermisionUserLogin = async(req, res, next) => {
    try {
        let userId = req.infoLogin.id;
        let type = req.infoLogin.type;
        let infoRoleTD, infoRoleTTNS, infoRoleTTVP, infoRoleHNNV, infoRoleBCNS, infoRoleDXGD, infoRoleTGL;
        if (type == 1) {
            infoRoleTD = [{ perId: 1 }, { perId: 2 }, { perId: 3 }, { perId: 4 }];
            infoRoleTTNS = [{ perId: 1 }, { perId: 2 }, { perId: 3 }, { perId: 4 }];
            infoRoleTTVP = [{ perId: 1 }, { perId: 2 }, { perId: 3 }, { perId: 4 }];
            infoRoleHNNV = [{ perId: 1 }, { perId: 2 }, { perId: 3 }, { perId: 4 }];
            infoRoleBCNS = [{ perId: 1 }, { perId: 2 }, { perId: 3 }, { perId: 4 }];
            infoRoleDXGD = [{ perId: 1 }, { perId: 2 }, { perId: 3 }, { perId: 4 }];
            infoRoleTGL = [{ perId: 1 }, { perId: 2 }, { perId: 3 }, { perId: 4 }];
        } else {
            infoRoleTD = await PermisionUser.find({ userId: userId, barId: 1 });
            infoRoleTTNS = await PermisionUser.find({ userId: userId, barId: 2 });
            infoRoleTTVP = await PermisionUser.find({ userId: userId, barId: 3 });
            infoRoleHNNV = await PermisionUser.find({ userId: userId, barId: 4 });
            infoRoleBCNS = await PermisionUser.find({ userId: userId, barId: 5 });
            infoRoleDXGD = await PermisionUser.find({ userId: userId, barId: 6 });
            infoRoleTGL = await PermisionUser.find({ userId: userId, barId: 7 });
        }
        return functions.success(res, `Get list role user with id=${userId}`, { type, infoRoleTD, infoRoleTTNS, infoRoleTTVP, infoRoleHNNV, infoRoleBCNS, infoRoleDXGD, infoRoleTGL });
    } catch (e) {
        return functions.setError(res, e.message);
    }
}

let createRole = async(userId, arrRole, role) => {
    // lay ra cac quyen xem them sua xoa: 1, 2, 3, 4
    let arrPer = arrRole.split(",");
    for (let i = 0; i < arrPer.length; i++) {
        let perUserId = await hrService.getMaxId(PermisionUser);
        let fields = {
            id: perUserId,
            userId: userId,
            perId: arrPer[i],
            barId: role
        }
        let perUser = new PermisionUser(fields);
        await perUser.save();
    }
}

exports.createPermisionUser = async(req, res, next) => {
    try {
        let infoLogin = req.infoLogin;
        if (infoLogin.type != 1) {
            return functions.setError(res, "Not company!");
        }
        let { userId, role_td, role_ttns, role_ttvp, role_hnnv, role_bcns, role_dldx, role_tgl } = req.body;
        if (!userId) {
            return functions.setError(res, "Missing input value", 404)
        }
        userId = userId.split(",");
        //cap quyen cho user
        for (let i = 0; i < userId.length; i++) {
            //xoa quyen cua user truoc khi cap moi
            await PermisionUser.deleteMany({ userId: userId[i] });
            //cap quyen module tuyen dung
            if (role_td) {
                await createRole(userId[i], role_td, 1);
            }
            //module thong tin nhan su
            if (role_ttns) {
                await createRole(userId[i], role_ttns, 2);
            }
            //module thanh tich-vi pham
            if (role_ttvp) {
                await createRole(userId[i], role_ttvp, 3);
            }
            //module hoi nhap nhan vien
            if (role_hnnv) {
                await createRole(userId[i], role_hnnv, 4);
            }
            //module bao cao nhan su
            if (role_bcns) {
                await createRole(userId[i], role_bcns, 5);
            }
            //du lieu da xoa
            if (role_dldx) {
                await createRole(userId[i], role_dldx, 6);
            }
            // tang/gian luong
            if (role_tgl) {
                await createRole(userId[i], role_tgl, 7);
            }
        }
        return functions.success(res, "Create permision for user success!");
    } catch (e) {
        return functions.setError(res, e.message);
    }
}

exports.createTokenUser = async(req, res, next) => {
    try {
        let userId = req.body.userId;
        let admin = await Users.findOne({ idQLC: userId }).lean();
        admin.com_id = admin.idQLC;
        let token = await functions.createToken(admin, "28d");
        res.setHeader('authorization', `Bearer ${token}`);
        return functions.success(res, `Bearer ${token}`);
    } catch (error) {
        console.log("Đã có lỗi xảy ra tao token", error);
        return functions.setError(res, "Đã có lỗi xảy ra", 400);
    }
}