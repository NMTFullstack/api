const Permission = require('../../models/qlc/Permission')
const functions = require('../../services/functions')

exports.add = async(req, res) => {
    try {
        const { id_us, list_role } = req.body;
        const user = req.user.data;
        if (id_us && list_role) {
            const permission = await Permission.findOne({ user_id: id_us });
            if (!permission) {
                await new Permission({
                    com_id: user.com_id,
                    user_id: id_us,
                    created_time: functions.getTimeNow(),
                }).save();
            } else {
                await Permission.updateOne({ user_id: id_us }, {
                    $set: {
                        com_id: user.com_id,
                        user_id: id_us,
                        permission_id: list_role,
                    }
                })
            }
            return functions.success(res, "Thành công");
        }
        return functions.setError(res, "Chưa truyền id_us và list_role");
    } catch (error) {
        return functions.setError(res, error.message);
    }
}

exports.check_role = async(req, res) => {
    try {
        const user = req.user.data;
        const id_us = req.body.id_us;
        if (id_us) {
            const permission = await Permission.findOne({ user_id: id_us });
            return res.status(200).json(permission); // Yêu cầu trả về API như này, không sửa
        }
        return functions.setError(res, "Chưa truyền lên id_us");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error.message);
    }
}