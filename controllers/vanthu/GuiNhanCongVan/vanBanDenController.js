const functions = require("../../../services/functions");
const vanThuService = require("../../../services/vanthu");
const VanBan = require('../../../models/Vanthu365/van_ban');
const FeedBack = require('../../../models/Vanthu365/tbl_feedback');
const DeXuatXuLy = require('../../../models/Vanthu/de_xuat_xu_ly');

let listVanBan = async(condition, skip, limit) => {
    try {
        let listVB = await VanBan.aggregate([
            { $match: condition },
            {
                $lookup: {
                    from: "vanthu_group_van_bans",
                    localField: "nhom_vb",
                    foreignField: "id_group_vb",
                    as: "matchedDocuments"
                }
            },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);
        return listVB;
    } catch (err) {
        console.log(err);
    }
}

let totalVanBan = async(condition) => {
    try {
        let totalVB = await VanBan.aggregate([
            { $match: condition },
            {
                $lookup: {
                    from: "vanthu_group_van_bans",
                    localField: "nhom_vb",
                    foreignField: "id_group_vb",
                    as: "matchedDocuments"
                }
            },
            {
                $group: { _id: null, count: { $sum: 1 } }
            },
            {
                $project: { _id: 0, count: 1 }
            }
        ]);
        return totalVB;
    } catch (err) {
        console.log(err);
    }
}

//--------van ban moi
exports.getListVanBanMoi = async(req, res, next) => {
    try {
        let { ten_vb_search, trang_thai_search, time_start, time_end, page, pageSize } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        time_start = time_start ? vanThuService.convertTimestamp(time_start) : null;
        time_end = time_end ? vanThuService.convertTimestamp(time_end) : null;
        if (trang_thai_search == 1) trang_thai_search = 0;

        let id = req.user.data.idQLC;
        let com_id = req.user.data.com_id;
        let minTime = vanThuService.convertTimestamp(Date.now()) - 2592000;

        let condition = {
            $and: [{
                    $or: [
                        //
                        {
                            $and: [{
                                    $or: [
                                        { user_nhan: new RegExp(String(id)) },
                                        { user_nhan: "0", user_cty: com_id }
                                    ]
                                },
                                { duyet_vb: 1 }
                            ]
                        },
                        //
                        {
                            $and: [{
                                    $or: [
                                        { user_nhan: new RegExp(String(id)) },
                                        { user_nhan: "0", user_cty: com_id }
                                    ]
                                },
                                { duyet_vb: 2, type_duyet: 1 }
                            ]
                        },
                        //
                        {
                            $and: [
                                { nguoi_xet_duyet: new RegExp(String(id)) },
                                { type_duyet: 1 }
                            ]
                        },
                        //
                        {
                            user_forward: new RegExp(String(id))
                        },
                        {
                            nguoi_theo_doi: new RegExp(String(id))
                        },
                    ],
                },
                { created_date: { $gt: minTime } }
            ]
        };

        if (ten_vb_search) condition.title_vb = new RegExp(ten_vb_search, 'i');
        if (trang_thai_search) condition.trang_thai_vb = Number(trang_thai_search);
        if (time_start && !time_end) condition.created_date = { $gte: time_start };
        if (time_end && !time_start) condition.created_date = { $lte: time_end };
        if (time_start && time_end) condition.created_date = { $gte: time_start, $lte: time_end }

        let listVanBanMoi = await listVanBan(condition, skip, limit);
        let totalCount = await totalVanBan(condition);
        totalCount = totalCount.length > 0 ? totalCount[0].count : 0;
        return functions.success(res, "Get list van ban moi success!", { totalCount, page, pageSize, listVanBanMoi });
    } catch (err) {
        return functions.setError(res, err.message);
    }
}

//--------van ban da xu ly
exports.getListVanBanDaXuLy = async(req, res, next) => {
    try {
        let { ten_vb_search, trang_thai_search, time_start, time_end, page, pageSize } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        time_start = time_start ? vanThuService.convertTimestamp(time_start) : null;
        time_end = time_end ? vanThuService.convertTimestamp(time_end) : null;
        if (trang_thai_search == 1) trang_thai_search = 0;

        let id = req.user.data.idQLC;
        let com_id = req.user.data.com_id;

        let condition = {
            $and: [{
                    $or: [
                        //
                        {
                            $and: [{
                                    $or: [
                                        { user_nhan: new RegExp(String(id)) },
                                        { user_nhan: "0", user_cty: com_id }
                                    ]
                                },
                                { duyet_vb: 1 }
                            ]
                        },
                        //
                        {
                            $and: [{
                                    $or: [
                                        { user_nhan: new RegExp(String(id)) },
                                        { user_nhan: "0", user_cty: com_id }
                                    ]
                                },
                                { duyet_vb: 2, type_duyet: 1 }
                            ]
                        },
                        //
                        {
                            $and: [
                                { nguoi_xet_duyet: new RegExp(String(id)) },
                                { type_duyet: 1 }
                            ]
                        },
                        //
                        {
                            user_forward: new RegExp(String(id))
                        },
                    ],
                },
                { $and: [{ trang_thai_vb: { $nin: [3] } }, { trang_thai_vb: { $gt: 0 } }] }
            ]
        };

        if (ten_vb_search) condition.title_vb = new RegExp(ten_vb_search, 'i');
        if (trang_thai_search) condition.trang_thai_vb = Number(trang_thai_search);
        if (time_start && !time_end) condition.created_date = { $gte: time_start };
        if (time_end && !time_start) condition.created_date = { $lte: time_end };
        if (time_start && time_end) condition.created_date = { $gte: time_start, $lte: time_end }

        let listVanBanDaXuLy = await listVanBan(condition, skip, limit);
        let totalCount = await totalVanBan(condition);
        totalCount = totalCount.length > 0 ? totalCount[0].count : 0;
        return functions.success(res, "Get list van ban den da xu ly success!", { totalCount, page, pageSize, listVanBanDaXuLy });
    } catch (err) {
        return functions.setError(res, err.message);
    }
}

//--------van ban can duyet
exports.getListVanBanCanDuyet = async(req, res, next) => {
    try {
        let { ten_vb_search, time_start, time_end, page, pageSize } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        time_start = time_start ? vanThuService.convertTimestamp(time_start) : null;
        time_end = time_end ? vanThuService.convertTimestamp(time_end) : null;

        let id = req.user.data.idQLC;
        let com_id = req.user.data.com_id;


        let condition = { type_duyet: 0, trang_thai_vb: 0 };
        condition.user_nhan = new RegExp(String(id));
        if (ten_vb_search) condition.title_vb = new RegExp(ten_vb_search, 'i');
        if (time_start && !time_end) condition.created_date = { $gte: time_start };
        if (time_end && !time_start) condition.created_date = { $lte: time_end };
        if (time_start && time_end) condition.created_date = { $gte: time_start, $lte: time_end }

        let listVanBanDenCanDuyet = await listVanBan(condition, skip, limit);
        let totalCount = await totalVanBan(condition);
        totalCount = totalCount.length > 0 ? totalCount[0].count : 0;
        return functions.success(res, "Get list van ban den can duyet success!", { totalCount, page, pageSize, listVanBanDenCanDuyet });
    } catch (err) {
        return functions.setError(res, err.message);
    }
}

//---van ban thu hoi
exports.getListVanBanThuHoi = async(req, res, next) => {
    try {
        let { ten_vb_search, time_start, time_end, page, pageSize } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        time_start = time_start ? vanThuService.convertTimestamp(time_start) : null;
        time_end = time_end ? vanThuService.convertTimestamp(time_end) : null;
        let trang_thai_vb = 3;

        let id = req.user.data.idQLC;
        let com_id = req.user.data.com_id;

        let condition = {
            $and: [{
                    $or: [
                        //
                        {
                            $or: [
                                { user_nhan: new RegExp(String(id)) },
                                { user_nhan: "0", user_cty: com_id }
                            ]
                        },
                        //
                        {
                            $and: [{
                                    $or: [
                                        { user_nhan: new RegExp(String(id)) },
                                        { user_nhan: "0", user_cty: com_id }
                                    ]
                                },
                                { duyet_vb: 2 }
                            ]
                        },
                        //
                        { nguoi_xet_duyet: new RegExp(String(id)) },
                        //
                        {
                            user_forward: new RegExp(String(id))
                        },
                    ],
                },
                { trang_thai_vb: trang_thai_vb }
            ]
        };

        if (ten_vb_search) condition.title_vb = new RegExp(ten_vb_search, 'i');
        if (time_start && !time_end) condition.created_date = { $gte: time_start };
        if (time_end && !time_start) condition.created_date = { $lte: time_end };
        if (time_start && time_end) condition.created_date = { $gte: time_start, $lte: time_end }

        let listVanBanDaThuHoi = await listVanBan(condition, skip, limit);
        let totalCount = await totalVanBan(condition);
        totalCount = totalCount.length > 0 ? totalCount[0].count : 0;
        return functions.success(res, "Get list van ban den da xu ly success!", { totalCount, page, pageSize, listVanBanDaThuHoi });
    } catch (err) {
        return functions.setError(res, err.message);
    }
}

//van ban cap nhat
exports.getListVanBanCapNhat = async(req, res, next) => {
    try {
        let { type_thay_the, type_thu_hoi, ten_vb_search, time_start, time_end, page, pageSize } = req.body;
        if (!page) page = 1;
        if (!pageSize) pageSize = 10;
        page = Number(page);
        pageSize = Number(pageSize);
        const skip = (page - 1) * pageSize;
        const limit = pageSize;
        time_start = time_start ? vanThuService.convertTimestamp(time_start) : null;
        time_end = time_end ? vanThuService.convertTimestamp(time_end) : null;
        let id = req.user.data.idQLC;
        let com_id = req.user.data.com_id;

        let condition = {
            $or: [
                //
                {
                    $and: [{
                            $or: [
                                { user_nhan: new RegExp(String(id)) },
                                { user_nhan: "0", user_cty: com_id }
                            ]
                        },
                        { duyet_vb: 1 }
                    ]
                },
                //
                {
                    $and: [{
                            $or: [
                                { user_nhan: new RegExp(String(id)) },
                                { user_nhan: "0", user_cty: com_id }
                            ]
                        },
                        { duyet_vb: 2, type_duyet: 1 }
                    ]
                },
                //
                {
                    $and: [
                        { nguoi_xet_duyet: new RegExp(String(id)) },
                        { type_duyet: 1 }
                    ]
                },
                //
                {
                    user_forward: new RegExp(String(id))
                },
            ],
        };
        if (!type_thu_hoi && !type_thay_the) {
            return functions.setError(res, "Missing input type_thu_hoi or type_thay_the");
        }
        //lay ra van ban thu hoi
        if (type_thu_hoi) condition.type_thu_hoi = 1;

        //lay ra van ban thay the
        if (type_thay_the) condition.type_thay_the = 1;

        if (ten_vb_search) condition.title_vb = new RegExp(ten_vb_search, 'i');
        if (time_start && !time_end) condition.created_date = { $gte: time_start };
        if (time_end && !time_start) condition.created_date = { $lte: time_end };
        if (time_start && time_end) condition.created_date = { $gte: time_start, $lte: time_end }

        let listVanBanCapNhat = await listVanBan(condition, skip, limit);
        let totalCount = await totalVanBan(condition);
        totalCount = totalCount.length > 0 ? totalCount[0].count : 0;
        return functions.success(res, "Get list van ban den da xu ly success!", { totalCount, page, pageSize, listVanBanCapNhat });
    } catch (err) {
        return functions.setError(res, err.message);
    }
}

//----------------------khac---------------------

//gui feedback (tra loi)
exports.sendFeedback = async(req, res, next) => {
    try {
        let { id_vb, feedback } = req.body;
        let id_user = req.user.data.idQLC;
        let name_user = req.user.data.userName;
        if (!id_vb || !feedback) {
            return functions.setError(res, "Missing input value!", 404);
        }
        let idMax = await vanThuService.getMaxId(FeedBack);
        let timestamp = vanThuService.convertTimestamp(Date.now());

        let feedBack = new FeedBack({
            _id: idMax,
            userFb: id_user,
            vb_fb: id_vb,
            nameUser: name_user,
            ndFeedback: feedback,
            createTime: timestamp
        })
        feedBack = await feedBack.save();
        if (!feedBack) {
            return functions.setError(res, "Tao feed back that bai!", 405);
        }
        return functions.success(res, "Tao feed back thanh cong!");
    } catch (err) {
        return functions.setError(res, err.message);
    }
}

//
exports.sendLeader = async(req, res, next) => {
    try {
        let { id_leader, y_kien, ghi_chu, id_vb } = req.body;
        if (!id_leader || !y_kien || !ghi_chu || !id_vb) {
            return functions.setError(res, "Missing input value!", 404);
        }
        let idMax = await vanThuService.getMaxId(DeXuatXuLy);
        let deXuatXuLy = new DeXuatXuLy({
            _id: idMax,
            id_vb: id_vb,
            user_xu_ly: id_leader,
            y_kien_xu_ly: y_kien,
            ghi_chu: ghi_chu
        })
        deXuatXuLy = await deXuatXuLy.save();
        if (!deXuatXuLy) {
            return functions.setError(res, "Gui cho leader that bai!", 505);
        }
        let vanBan = await VanBan.findOne({ _id: id_vb }, { _id: 1, user_forward: 1 });
        let ct_ld = id_leader;
        if (vanBan.user_forward != "") {
            ct_ld = `${vanBan.user_forward},${id_leader}`;
        }
        let timestamp = vanThuService.convertTimestamp(Date.now());
        vanBan = await VanBan.findOneAndUpdate({ _id: id_vb }, { user_forward: ct_ld, update_time: timestamp });
        if (!vanBan) {
            return functions.setError(res, "update van ban that bai!", 506);
        }
        return functions.success(res, "Gui cho leader thanh cong!");
    } catch (err) {
        return functions.setError(res, err.message);
    }
}