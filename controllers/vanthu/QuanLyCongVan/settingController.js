const functions = require('../../../services/functions');
const Users = require('../../../models/Users');
const tbl_qlcv_role = require('../../../models/Vanthu365/tbl_qlcv_role');
const vanthu = require('../../../services/vanthu');
// danh sách phân quyền người dùng
exports.getdecentralization = async (req, res, next) => {
    try {
        let comId = req.comId;
        let emId = Number(req.body.emId);
        if (!emId) return functions.setError(res, 'missing id employee', 400);
        let data = await tbl_qlcv_role.find({ ro_user_id: emId, ro_usc_id: comId })
        return functions.success(res, 'get data success', { data })
    } catch (error) {
        return functions.setError(res, error)
    }
}

exports.decentralization = async (req, res, next) => {
    try {
        let emId = Number(req.body.emId);
        let comId = req.comId;
        let quyen1 = req.body.quyen1;
        let quyen2 = req.body.quyen2;
        let quyen3 = req.body.quyen3;
        let quyen4 = req.body.quyen4;
        let quyen5 = req.body.quyen5;
        let quyen6 = req.body.quyen6;
        if (!emId) return functions.setError(res, 'missing id employee', 400);
        let checkUser = await Users.findOne({ 'inForPerson.employee.com_id': comId, idQLC: emId })
        if (!checkUser) return functions.setError(res, 'not found employee', 400);
        let check = await tbl_qlcv_role.findOne({ ro_user_id: emId, ro_usc_id: comId });
        if (check) {
            await tbl_qlcv_role.findOneAndUpdate({ ro_user_id: emId, ro_usc_id: comId }, {
                ro_list_vb: quyen1,
                ro_list_hd: quyen2,
                ro_search_vb: quyen3,
                ro_lsu_vb: quyen4,
                ro_thongke_vb: quyen5,
                ro_dele_vb: quyen6,
            })
        } else {
            let _id = await vanthu.getMaxID(tbl_qlcv_role)
            await tbl_qlcv_role.create({
                _id,
                ro_user_id: emId,
                ro_usc_id: comId,
                ro_list_vb: quyen1,
                ro_list_hd: quyen2,
                ro_search_vb: quyen3,
                ro_lsu_vb: quyen4,
                ro_thongke_vb: quyen5,
                ro_dele_vb: quyen6,
            })
        }


        return functions.success(res, 'Phân quyền cho người dùng thành công!')
    } catch (error) {
        console.error(error)
        return functions.setError(res, error)
    }
}

exports.checkPermission = (bar, per) => {
    return async (req, res, next) => {
        let user = req.user.data;
        if (user.type === 1) {
            req.comId = user.idQLC;
            req.useId = 0;

            return next();
        } else if (user.type === 2) {
            let emId = user.idQLC;
            if (user.inForPerson && user.inForPerson.employee && user.inForPerson.employee.com_id) {
                let comId = user.inForPerson.employee.com_id;
                let check = await tbl_qlcv_role.findOne({ ro_user_id: emId, ro_usc_id: comId });
                if (!check) return functions.setError(res, 'Forbidden ', 403)
                if (bar === 'list_vb') {
                    let permission = check.ro_list_vb.trim().split(" ");
                    if (permission.includes(`${per}`)) {
                        req.comId = user.inForPerson.employee.com_id;
                        req.useId = user.idQLC;
                        return next()
                    } else {
                        return functions.setError(res, 'Forbidden ', 403)

                    }
                } else if (bar === 'seach_vb') {
                    let permission = check.ro_seach_vb.trim().split(" ");
                    if (permission.includes(`${per}`)) {
                        req.comId = user.inForPerson.employee.com_id;
                        req.useId = user.idQLC;
                        return next()
                    } else {
                        return functions.setError(res, 'Forbidden ', 403)

                    }
                } else if (bar === 'lsu_vb') {
                    let permission = check.ro_lsu_vb.trim().split(" ");
                    if (permission.includes(`${per}`)) {
                        req.comId = user.inForPerson.employee.com_id;
                        req.useId = user.idQLC;
                        return next()
                    } else {
                        return functions.setError(res, 'Forbidden ', 403)

                    }
                } else if (bar === 'thongke_vb') {
                    let permission = check.ro_thongke_vb.trim().split(" ");
                    if (permission.includes(`${per}`)) {
                        req.comId = user.inForPerson.employee.com_id;
                        req.useId = user.idQLC;
                        return next()
                    } else {
                        return functions.setError(res, 'Forbidden ', 403)

                    }
                } else if (bar === 'dele_vb') {
                    let permission = check.ro_dele_vb.trim().split(" ");
                    if (permission.includes(`${per}`)) {
                        req.comId = user.inForPerson.employee.com_id;
                        req.useId = user.idQLC;
                        return next()
                    } else {
                        return functions.setError(res, 'Forbidden ', 403)

                    }
                } else if (bar === 'list_hd') {
                    let permission = check.ro_list_hd.trim().split(" ");
                    if (permission.includes(`${per}`)) {
                        req.comId = user.inForPerson.employee.com_id;
                        req.useId = user.idQLC;
                        return next()
                    } else {
                        return functions.setError(res, 'Forbidden ', 403)
                    }
                } else if (bar === 'none') {
                    req.comId = user.inForPerson.employee.com_id;
                    req.useId = user.idQLC;
                    return next()
                }
            } else {
                return functions.setError(res, 'Không tìm thấy công ty ', 403)
            }
        } else {
            return functions.setError(res, 'Forbidden ', 403)
        }
    }
}