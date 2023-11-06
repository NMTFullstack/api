const functions = require("../../../services/functions");
const {saveHistory, getMaxID} = require("./utils");
const User = require("../../../models/Users");
const HistoryLogin = require("../../../models/Timviec365/UserOnSite/ManageHistory/HistoryLogin");
const ManagePointHistory = require("../../../models/Timviec365/UserOnSite/ManageHistory/ManagerPointHistory");
// api bài toán 1 
exports.calculateBaseTimeOnline = async (req, res) => {
    try{
        let {
            email,
            type,
            phoneTK,
        } = req.body;
        if (!email&&!phoneTK) return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);
        const user = await User.findOne({$or: [
            ...(email?[{email}]:[]),
            ...(phoneTK?[{phoneTK}]:[])
        ]}).lean();
        if (!user) return functions.setError(res, "Không tìm thấy tài khoản", 404);
        let point = 0;
        let startActive = 0;
        const lastActive =  new Date().getTime()/1000;
        const lastTimestamp = new Date().getTime()/1000 - 12*3600;
        let loginHistory = await HistoryLogin.findOne({userId: user.idTimViec365, userType: type});
        if (loginHistory) {
            startActive = loginHistory.timeLogin;
            point = (lastActive - startActive) /3600;
            await HistoryLogin.updateOne({id: loginHistory.id}, {
                $set: {
                    timeLogout: lastActive
                }
            })
        } else {
            startActive = user.updatedAt?user.updatedAt:user.time_login;
            point = (lastActive - startActive) / 3600;
            if (startActive !== 0 && startActive > lastTimestamp) {
                await (new HistoryLogin({
                    id: await getMaxID(HistoryLogin),
                    timeLogin: startActive,
                    timeLogout: lastActive,
                    type: type,
                    userId: user.idTimViec365,
                })).save();
               
            } else {
                // cập nhật lại thời gian hoạt động dưới base tìm việc cho đúng 
                let updatedTime = new Date().getTime()/1000 - 60;
                await User.updateOne({idTimViec365: user.idTimViec365},{
                    $set: {
                        updatedAt: updatedTime
                    }
                })
            }        
        }
        
        let POINT_LIMIT = 10;

        let history = await ManagePointHistory.findOne({userId: user.idTimViec365, type});
        if (history) {
            let oldPoints = history.point_time_active;
            history.point_time_active = oldPoints + point < POINT_LIMIT ? oldPoints + point : POINT_LIMIT;
        } else {
            point = point > POINT_LIMIT? POINT_LIMIT: point;
            history = new ManagePointHistory({
                userId: user.idTimViec365,
                type: user.type,
                point_to_change: point,
                point_time_active: point,
                sum: point
            });
        }
        await saveHistory(history);
        return functions.success(res, "Thành công");
    }
    catch (error) {
        console.log(error);
        return functions.setError(res, "Đã có lỗi xảy ra", 500);
    }
  }

exports.handleHistoryLogin = async (req, res) => {
    try {
        let {
            userType,
            userId,
        } = req.body;
        let latestHistoryLogin = await HistoryLogin.findOne({userId: userId, type: userType}).sort({id: -1});
        if (!latestHistoryLogin||(latestHistoryLogin&&latestHistoryLogin.timeLogout > 0)) {
            let now = functions.getTimeNow();
            setTimeout(()=>{
                getMaxID(HistoryLogin).then(id => {
                    new HistoryLogin({
                        id: id,
                        userId: userId, 
                        type: userType,
                        timeLogin: now,
                        timeLogout: 0
                    }).save().then(()=>{
                        const doSomething = () => {};
                        doSomething();
                    })
                })
            }, 2000)
        }
        return functions.success(res, "Thành công");
    } catch (error) {
        console.log(error);
        return functions.setError(res, "Đã có lỗi xảy ra", 500);
    }
}