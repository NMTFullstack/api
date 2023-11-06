const functions = require("../../services/functions");
const NotifyApp = require('../../models/qlc/NotifyApp');

exports.list = async(req, res) => {
    try {
        const user = req.user.data;
        const page = req.body.page || 1;
        const pageSize = req.body.pageSize || 20;
        const skip = (page - 1) * pageSize;
        const list = await NotifyApp.aggregate([{
                $match: {
                    user_id.user.idQLC,
                    user_type: 2
                }
            },
            { $sort: { not_id: -1 } },
            { $skip: skip },
            { $limit: pageSize },
            {
                $lookup: {
                    from: "Users",
                    localField: "affected_id",
                    foreignField: "idQLC",
                    as: "user",
                }
            }, {
                $match: {
                    "$user.type": { $ne: 1 }
                }
            }
        ]);
        return functions.success(res, "Danh sách thông báo", { items: list });
    } catch (error) {
        return functions.setError(res, error.message);
    }
}