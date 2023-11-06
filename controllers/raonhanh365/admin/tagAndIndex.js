const functions = require('../../../services/functions');
const TagIndex = require('../../../models/Raonhanh365/RN365_TagIndex');

exports.getListTagsIndex = async(req, res, next) => {
    try {
        if (req.body) {
            if(!req.body.page){
                return functions.setError(res, "Missing input page", 401);
            }
            if(!req.body.pageSize){
                return functions.setError(res, "Missing input pageSize", 402);
            }
            let page = Number(req.body.page);
            let pageSize = Number(req.body.pageSize);
            const skip = (page - 1) * pageSize;
            const limit = pageSize;
            let phanloai = req.body.phanloai; 
            if(!phanloai) {
              return functions.setError(res, "Missing input value phanloai", 403);
            }
            let listCondition = {classify: phanloai}
            let fieldsGet = {_id: 1, link: 1, time: 1}
            const listTagsIndex = await functions.pageFindWithFields(TagIndex, listCondition, fieldsGet, { _id: 1 }, skip, limit); 
            const totalCount = await functions.findCount(TagIndex, listCondition);
            return functions.success(res, "get list tags index success", {totalCount: totalCount, data: listTagsIndex });
        } else {
            return functions.setError(res, "Missing input data", 400);
        }
    } catch (e) {
        console.log("Err from server", e);
        return functions.setError(res, "Err from server", 500);
    }
}