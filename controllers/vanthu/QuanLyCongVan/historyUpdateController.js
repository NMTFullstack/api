const functions = require('../../../services/functions')
const vanthu = require('../../../services/vanthu.js');
const tbl_qly_congvan = require('../../../models/Vanthu365/tbl_qly_congvan');
const tbl_qlcv_edit = require('../../../models/Vanthu365/tbl_qlcv_edit');

// lịch sử cập nhật
exports.getDataHistory = async (req, res, next) => {
    try {
        let comId = Number(req.comId);

        let data = {};

        let countTextUpdate = await tbl_qly_congvan.countDocuments({ cv_type_edit: 1, cv_type_xoa: 0, cv_type_hd: 0, cv_usc_id: comId })

        let countTextRecover = await tbl_qly_congvan.countDocuments({ cv_type_kp: 1, cv_type_xoa: 0, cv_type_hd: 0, cv_usc_id: comId })

        let countContractUpdate = await tbl_qly_congvan.countDocuments({ cv_type_edit: 1, cv_type_xoa: 0, cv_type_hd: 1, cv_usc_id: comId })

        let countContractRecover = await tbl_qly_congvan.countDocuments({ cv_type_kp: 1, cv_type_xoa: 0, cv_type_hd: 1, cv_usc_id: comId })

        let list = await tbl_qly_congvan.find({ $or: [{ cv_type_kp: 1 }, { cv_type_edit: 1 }], cv_type_xoa: 0, cv_usc_id: comId },
            {
                cv_id: 1, cv_so: 1, cv_name: 1, cv_type_edit: 1,
                cv_type_kp: 1, cv_type_user_kp: 1, cv_user_kp: 1,
                cv_type_user_kp: 1, cv_user_kp: 1, cv_time_edit: 1, cv_time_kp: 1
            }).limit(6)

        data.countTextUpdate = countTextUpdate;
        data.countTextRecover = countTextRecover;
        data.countContractUpdate = countContractUpdate;
        data.countContractRecover = countContractRecover;
        data.list = list;
        return functions.success(res, 'get data success', { data })
    } catch (error) {
        console.error(err);
        return functions.setError(res, error)
    }
}
// chi tiết lịch sử cập nhật
exports.getDetailHistoryUpdate = async (req, res, next) => {
    try {
        let comId = req.comId;
        let page = Number(req.body.page) || 1;
        let pageSize = Number(req.body.pageSize) || 10;
        let skip = (page - 1) * pageSize;
        let limit = pageSize;
        let type_vb = Number(req.body.type_vb);
        let name_vb = req.body.name_vb;
        let date_start = new Date(req.body.date_start).getTime() / 1000;
        let date_end = new Date(req.body.date_end).getTime() / 1000;
        let type_book = Number(req.body.type_book);
        let type = Number(req.body.type);
        if (!type) return functions.setError(res, 'missing type', 400)

        let conditions = {};
        switch (type_vb) {
            case 1:
                conditions.cv_type_loai = 1;
                conditions.cv_type_hd = 0;
                break;
            case 2:
                conditions.cv_type_loai = 2;
                conditions.cv_type_hd = 0;
                break;
            case 3:
                conditions.cv_type_loai = 1;
                conditions.cv_type_hd = 1;
                break;
            case 4:
                conditions.cv_type_loai = 2;
                conditions.cv_type_hd = 1;
                break;
            case 5:
                conditions.cv_type_hd = 1;
                break;
            default:
                conditions.cv_type_hd = 0;
        }
        if (type_book) conditions.cv_date_book = type_book;
        if (date_start) conditions.cv_date = { $gte: date_start }
        if (date_end) conditions.cv_date = { $lte: date_end }
        if (date_start && date_end) conditions.cv_date = { $gte: date_start, $lte: date_end }
        conditions.cv_usc_id = comId
        conditions.cv_type_xoa = 0
        if (type === 1) {
            conditions.cv_type_edit = 1
        } else if (type === 2) {
            conditions.cv_type_kp = 1
        }
        if (name_vb) {
            conditions.name_vb = new RegExp(name_vb, 'i')
        }

        let data = await tbl_qly_congvan.find(conditions).sort({ cv_time_edit: -1 }).skip(skip).limit(limit).lean();
        for (let i = 0; i < data.length; i++) {
            let lichsucapnhat = await tbl_qlcv_edit.findOne({ ed_cv_id: data[i]._id }).lean();
            console.log("🚀 ~ file: historyUpdateController.js:97 ~ exports.getDetailHistoryUpdate= ~ lichsucapnhat:", lichsucapnhat)
            if (lichsucapnhat) data[i].lichsucapnhat = lichsucapnhat.ed_nd
            else data[i].lichsucapnhat = ''
        }
        return functions.success(res, 'get data success', { data })
    } catch (error) {
        console.error(error);
        return functions.setError(res, error)
    }
}