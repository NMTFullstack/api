const priceList = require('../../models/Timviec365/PriceList/PriceList');
const functions = require('../../services/functions');

// danh mục bảng giá
exports.getPriceList = async(req, res, next) => {
    try {
        const data = await priceList.find().lean();

        if (data.length > 0) return await functions.success(res, 'Thành công', { data });

        return await functions.setError(res, 'Không có dữ liệu', 404);
    } catch (err) {
        return functions.setError(res, err.message)
    }
};

// chi tiết gói dich vụ
exports.viewDetail = async(req, res, next) => {
    try {
        const type = req.body.type;
        const data = await priceList.find({ bg_type: type }).lean();

        if (data) return await functions.success(res, 'Thành công', { data });

        return await functions.setError(res, 'Không có dữ liệu', 404);
    } catch (err) {
        return functions.setError(res, err.message)
    }
};