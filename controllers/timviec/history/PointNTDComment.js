const functions = require("../../../services/functions");
const { saveHistory, userExists } = require("./utils");
const ManagePointHistory = require("../../../models/Timviec365/UserOnSite/ManageHistory/ManagerPointHistory");
const CommentPost = require("../../../models/Timviec365/UserOnSite/CommentPost")
const User = require("../../../models/Users");

// tính điểm khi NTD bình luận
const handleCalculatePointNTDComment = async(userId, userType) => {
    try {
        let user = await User.findOne({ idTimViec365: userId , type: userType});
        if (user && user._id != 0) {
            let commentsCount = await CommentPost.find({ cm_sender_idchat: user._id }).count();
            const POINT_LIMIT = 10;
            let point = commentsCount / 2;
            point = point > POINT_LIMIT ? POINT_LIMIT : point;
            let history = await ManagePointHistory.findOne({
                userId: userId,
                type: userType
            })
            if (history) {
                history.point_ntd_comment = point;
            } else {
                history = new ManagePointHistory({
                    userId: userId,
                    type: userType,
                    point_to_change: point,
                    point_ntd_comment: point,
                    sum: point
                });
            }
            await saveHistory(history);
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}
module.exports = async(req, res, next) => {
    try {
        let {
            userId,
            userType
        } = req.body;
        if (userId) {
            await handleCalculatePointNTDComment(userId, userType);
            return functions.success(res, "Thành công");
        } else {
            return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);
        }
    } catch (error) {
        return functions.setError(res, "Đã có lỗi xảy ra", 500);
    }
}