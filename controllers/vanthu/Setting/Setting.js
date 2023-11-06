const SettingDX = require('../../../models/Vanthu/setting_dx');
const functions = require("../../../services/functions");
const Group = require("../../../models/qlc/Group");
const vt_functions = require("../../../services/vanthu");
const cate_de_xuat = require("../../../models/Vanthu/cate_de_xuat");
const time_setting_dx = require("../../../models/Vanthu/time_setting_dx");

// hàm tạo mới và hiển thị cài đặt tài khoản côngty
exports.findOrCreateSettingDx = async(req, res) => {
    try {
        let { type_setting, type_browse, time_limit, shift_id, time_limit_l, list_user, list_user_2cap, list_user_3cap, time_tp, time_hh, kieu_duyet } = req.body;
        let createDate = new Date();
        let com_id = '';
        if (req.user.data.type == 1) {
            com_id = req.user.data.com_id
            if (!functions.checkNumber(com_id)) {
                return functions.setError(res, 'com_id phải là 1 số', 400);
            } else {
                let settingDx = await SettingDX.findOne({ com_id });
                if (!settingDx) {
                    let maxID = await functions.getMaxID(SettingDX);
                    if (!maxID) {
                        maxID = 0;
                    }
                    const _id = Number(maxID) + 1;
                    settingDx = new SettingDX({
                        _id: _id,
                        com_id: com_id,
                        type_setting: type_setting,
                        type_browse: type_browse,
                        time_limit: time_limit,
                        shift_id: shift_id,
                        time_limit_l: time_limit_l,
                        list_user: list_user,
                        list_user_2cap: list_user_2cap,
                        list_user_3cap: list_user_3cap,
                        time_tp: time_tp,
                        time_hh: time_hh,
                        kieu_duyet: kieu_duyet,
                        time_created: createDate
                    });

                    await settingDx.save();
                }

                return functions.success(res, 'get data success', { settingDx });
            }
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400);
        }

    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
};
exports.editSettingDx = async(req, res) => {
    try {
        let updateDate = new Date();
        let com_id = '';
        let { type_setting, type_browse, time_limit, shift_id, time_limit_l, list_user, list_user_2cap, list_user_3cap, time_tp, time_hh, time_created, kieu_duyet } = req.body;
        if (req.user.data.type == 1) {
            com_id = req.user.data.com_id
        } else {
            return functions.setError(res, 'không có quyền truy cập', 400);
        }
        const editSetting = await functions.getDatafindOne(SettingDX, { com_id: com_id });
        if (!editSetting) {
            return functions.setError(res, ' cài đặt không tồn tại', 400);
        } else {
            let chinhsuasetting = await SettingDX.findOneAndUpdate({ com_id: com_id }, {
                $set: {
                    com_id: com_id,
                    type_setting: type_setting,
                    type_browse: type_browse,
                    time_limit: time_limit,
                    shift_id: shift_id,
                    time_limit_l: time_limit_l,
                    list_user: list_user,
                    list_user_2cap: list_user_2cap,
                    list_user_3cap: list_user_3cap,
                    time_tp: time_tp,
                    time_hh: time_hh,
                    kieu_duyet: kieu_duyet,
                    update_time: updateDate,
                }
            }, { new: true });

            return functions.success(res, 'chỉnh sửa thành công', { chinhsuasetting });
        }
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
};
exports.fetchTimeSetting = async(req, res, next) => {
    try {
        const com_id = req.user.data.com_id;
        const time_dx = await time_setting_dx.find({ com_id: com_id });
        if (time_dx && time_dx.length > 0) {
            return res.status(200).json({ time_dx })
        } else {
            const cate_dx = await cate_de_xuat.find({}).select(
                '_id cate_dx name_cate_dx'
            )
            for (let i = 0; i < cate_dx.length; i++) {
                const max_id = await vt_functions.getMaxId(time_setting_dx);
                const new_time_dx = new time_setting_dx({
                    _id: max_id,
                    id_dx: cate_dx[i].cate_dx,
                    name_cate_dx: cate_dx[i].name_cate_dx,
                    time: 0,
                    com_id: com_id,
                    created_time: Math.round(new Date().getTime() / 1000),
                })
                await new_time_dx.save();
            }
            const time = await time_setting_dx.find({ com_id: com_id });
            return res.status(200).json({ time })
        }
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}
exports.updateTimeSetting = async(req, res) => {
    try {
        const {
            id_dx,
            time
        } = req.body;
        const com_id = req.user.data.com_id;
        const update = await time_setting_dx.findOneAndUpdate({
            id_dx: id_dx,
            com_id: com_id,
        }, {
            $set: {
                time: time,
            }
        }, {
            new: true
        })
        return res.status(200).json({ message: 'Cập nhật thời gian duyệt thành công', update })
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}
exports.resetTimeSetting = async(req, res) => {
    try {
        const {
            id_dx,
        } = req.body;
        const com_id = req.user.data.com_id;
        const update = await time_setting_dx.findOneAndUpdate({
            id_dx: id_dx,
            com_id: com_id,
        }, {
            $set: {
                time: 0,
            }
        }, {
            new: true
        })
        return res.status(200).json({ message: 'Làm mới thời gian duyệt thành công', update })
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}