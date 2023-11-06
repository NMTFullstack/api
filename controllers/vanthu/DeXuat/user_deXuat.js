const De_Xuat = require('../../../models/Vanthu/de_xuat');
const cate_de_xuat = require('../../../models/Vanthu/cate_de_xuat');
const setting_dx = require('../../../models/Vanthu/setting_dx');
const User = require('../../../models/Users');
const functions = require('../../../services/functions')
const HistoryHandling = require('../../../models/Vanthu/history_handling_dx');

// trang tôi gửi đi 
exports.deXuat_user_send = async(req, res) => {
    try {
        let { type, time_s, time_e, id_user_duyet, page } = req.body;
        if (!type) {
            type = 1
        }
        let id_user = 0;
        let com_id = 0;
        if (req.user.data.type == 2) {
            id_user = req.user.data.idQLC
            com_id = req.user.data.com_id;
        } else {
            return functions.setError(res, 'Bạn không có quyền truy cập.', 400)
        }
        const perPage = 10; // Giá trị mặc định nếu không được cung cấp
        const startIndex = (page - 1) * perPage;
        const sortOptions = { _id: -1 };
        if (typeof id_user === 'undefined') {
            return functions.setError(res, 'id_user không được bỏ trống.', 400)
        }
        if (!com_id) {
            return functions.setError(res, 'com_id không được bỏ trống.', 400)
        }
        if (!type) {
            return functions.setError(res, 'type không được bỏ trống.', 400)
        }
        let query = {
            id_user: id_user,
            com_id: com_id,
            del_type: 1
        };
        if (id_user_duyet) {
            query.id_user_duyet = { $in: [id_user_duyet] };
        }
        const startTime = new Date(time_s);
        const endTime = new Date(time_e);
        if (time_s && time_e) {
            query.time_create = { $gte: startTime / 1000, $lte: endTime / 1000 };
        } else if (time_s) {
            query.time_create = { $gte: startTime / 1000 };
        } else if (time_e) {
            query.time_create = { $lte: endTime / 1000 };
        }
        let totalPages
        if (type == 1) { // Hiển thị tất cả
            const datafull = await De_Xuat.find(query)
            const data = await De_Xuat.find(query)
                .sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        }

        if (type == 2) { // Hiển thị đang chờ duyệt
            query.active = { $in: [0, 1] };
            query.type_duyet = { $in: [0, 7, 10, 11] };
            const datafull = await De_Xuat.find(query)
            const data = await De_Xuat.find(query)
                .sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        }

        if (type == 4) { // Hiển thị đã phê duyệt
            query.type_duyet = 5;
            const datafull = await De_Xuat.find(query)
            const data = await De_Xuat.find(query)
                .sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);;
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        }

        if (type == 5) { // Hiển thị đã từ chối
            query.$or = [{ active: 2 }, { type_duyet: 3 }];
            const datafull = await De_Xuat.find(query)
            const data = await De_Xuat.find(query)
                .sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);;
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        } else {
            return functions.setError(res, 'type khong hop le', 400)
        }
    } catch (error) {
        console.error('Failed ', error);
        return functions.setError(res, error);
    }
};

//trang gửi đến tôi 
exports.de_xuat_send_to_me = async(req, res) => {
    try {
        let {
            type,
            id_user,
            name_dx,
            type_dx,
            time_s,
            time_e,
            page
        } = req.body;
        let id_user_duyet = 0;
        let com_id = 0;
        if (req.user.data.type == 2) {
            id_user_duyet = req.user.data.idQLC
            com_id = req.user.data.com_id;
        } else {
            return functions.setError(res, 'Bạn không có quyền truy cập.', 400)
        }
        const perPage = 10; // Giá trị mặc định nếu không được cung cấp
        const startIndex = (page - 1) * perPage;
        const sortOptions = { _id: -1 };
        if (!type) {
            type = 1
        }
        let query = {
            id_user_duyet: { $regex: id_user_duyet, $options: "i" },
            com_id: com_id,
            del_type: 1
        };
        if (type_dx) {
            query.type_dx = type_dx;
        }
        if (name_dx) {
            query.name_dx = { $regex: name_dx, $options: "i" };
        }
        if (id_user) {
            query.id_user = id_user;
        }
        const startTime = new Date(time_s);
        const endTime = new Date(time_e);
        if (time_s && time_e) {
            query.time_create = { $gte: startTime / 1000, $lte: endTime / 1000 };
        } else if (time_s) {
            query.time_create = { $gte: startTime / 1000 };
        } else if (time_e) {
            query.time_create = { $lte: endTime / 1000 };
        }

        let totalPages;
        if (type == 1) { // Hiển thị tất cả
            let data = await De_Xuat.find(query)
                .lean()
                .sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);
            data = await Promise.all(
                data.map(async(value, index) => {
                    const history = await HistoryHandling
                        .findOne({ id_dx: value._id, id_user: id_user_duyet }, { type_handling: 1, time: 1 })
                        .sort({ time: -1 })
                        .lean();
                    let confirmed;
                    if (history && history.type_handling === 2) {
                        confirmed = true
                    } else {
                        confirmed = false;
                    }
                    return {
                        ...value,
                        confirmed: confirmed
                    }
                })
            )
            const datafull = await De_Xuat.find(query);
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        }
        if (type == 2) { // Hiển thị đang chờ duyệt
            query.active = { $in: [0, 1] };
            query.type_duyet = { $in: [0, 7, 10] };
            let data = await De_Xuat.find(query)
                .lean()
                .sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);

            data = await Promise.all(
                data.map(async(value, index) => {
                    const history = await HistoryHandling
                        .findOne({ id_dx: value._id, id_user: id_user_duyet }, { type_handling: 1, time: 1 })
                        .sort({ time: -1 })
                        .lean();
                    let confirmed;
                    if (history && history.type_handling === 2) {
                        confirmed = true
                    } else {
                        confirmed = false;
                    }
                    return {
                        ...value,
                        confirmed: confirmed
                    }
                })
            )
            const datafull = await De_Xuat.find(query);
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        }
        if (type == 4) { // Hiển thị đã phê duyệt
            query.type_duyet = 5;
            let data = await De_Xuat.find(query)
                .lean()
                .sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);

            data = await Promise.all(
                data.map(async(value, index) => {
                    const history = await HistoryHandling
                        .findOne({ id_dx: value._id, id_user: id_user_duyet }, { type_handling: 1, time: 1 })
                        .sort({ time: -1 })
                        .lean();
                    let confirmed;
                    if (history && history.type_handling === 2) {
                        confirmed = true
                    } else {
                        confirmed = false;
                    }
                    return {
                        ...value,
                        confirmed: confirmed
                    }
                })
            )
            const datafull = await De_Xuat.find(query);
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        }
        if (type == 5) { // Hiển thị đã từ chối
            query.$or = [{ active: 2 }, { type_duyet: 3 }];
            let data = await De_Xuat.find(query).sort(sortOptions)
                .lean()
                .skip(startIndex)
                .limit(perPage);

            data = await Promise.all(
                data.map(async(value, index) => {
                    const history = await HistoryHandling
                        .findOne({ id_dx: value._id, id_user: id_user_duyet }, { type_handling: 1, time: 1 })
                        .sort({ time: -1 })
                        .lean();
                    let confirmed;
                    if (history && history.type_handling === 2) {
                        confirmed = true
                    } else {
                        confirmed = false;
                    }
                    return {
                        ...value,
                        confirmed: confirmed
                    }
                })
            )
            const datafull = await De_Xuat.find(query);
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        } else {
            return functions.setError(res, 'type khong hop le', 400)
        }
    } catch (error) {
        console.error('Failed ', error);
        return functions.setError(res, error);
    }
}

//trang người theo dõi 
exports.de_xuat_theo_doi = async(req, res) => {
    try {
        let { type, page } = req.body;
        let id_user_theo_doi = 0;
        let com_id = 0;
        if (req.user.data.type == 2) {
            id_user_theo_doi = req.user.data.idQLC
            com_id = req.user.data.com_id;
        } else {
            return functions.setError(res, 'Bạn không có quyền truy cập.', 400)
        }
        if (!type) {
            type = 1
        }
        const perPage = 10; // Giá trị mặc định nếu không được cung cấp
        const startIndex = (page - 1) * perPage;
        const sortOptions = { _id: -1 };
        if (!type) {
            return res.status(400).json({ error: 'type không được bỏ trống.' });
        }
        let totalPages
        if (type == 1) {
            const data = await De_Xuat.find({
                    id_user_theo_doi: { $in: [id_user_theo_doi] },
                    com_id: com_id,
                    del_type: 1
                })
                .sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);
            const datafull = await De_Xuat.find({
                id_user_theo_doi: { $in: [id_user_theo_doi] },
                com_id: com_id,
                del_type: 1
            });
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        }
        if (type == 2) {
            const data = await De_Xuat.find({
                    id_user_theo_doi: { $in: [id_user_theo_doi] },
                    com_id: com_id,
                    del_type: 1,
                    type_duyet: { $in: [0, 7] },
                })
                .sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);
            const datafull = await De_Xuat.find({
                id_user_theo_doi: { $in: [id_user_theo_doi] },
                com_id: com_id,
                del_type: 1,
                type_duyet: { $in: [0, 7] },
            });
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        }
        if (type == 3) {
            const checkSetting = await setting_dx.findOne({ com_id: com_id })
            if (!checkSetting) {
                return res.status(400).json({ error: 'Công ty chưa cài đặt hạn duyệt.' });
            }
            let timeLimit = checkSetting.time_limit * 60 * 60 * 1000; // Chuyển time_limit thành mili giây
            const data = await De_Xuat.find({
                    id_user_theo_doi: { $in: [id_user_theo_doi] },
                    com_id: com_id,
                    del_type: 1,
                    $expr: { $gt: [{ $subtract: [new Date(), "$time_create"] }, timeLimit] }
                })
                .sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);;
            const datafull = await De_Xuat.find({
                id_user_theo_doi: { $in: [id_user_theo_doi] },
                com_id: com_id,
                del_type: 1,
                $expr: { $gt: [{ $subtract: [new Date(), "$time_create"] }, timeLimit] }
            });
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        }
        if (type == 4) {
            const data = await De_Xuat.find({
                    com_id: com_id,
                    id_user_theo_doi: { $in: [id_user_theo_doi] },
                    del_type: 1,
                    type_duyet: 5,
                }).sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);
            const datafull = await De_Xuat.find({
                com_id: com_id,
                id_user_theo_doi: { $in: [id_user_theo_doi] },
                del_type: 1,
                type_duyet: 5,
                active: 1
            });
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        }
        if (type == 5) {
            const data = await De_Xuat.find({
                    com_id: com_id,
                    id_user_theo_doi: { $in: [id_user_theo_doi] },
                    $or: [{ active: 2 }, { type_duyet: 3 }],
                })
                .sort(sortOptions)
                .skip(startIndex)
                .limit(perPage);
            const datafull = await De_Xuat.find({
                com_id: com_id,
                id_user_theo_doi: { $in: [id_user_theo_doi] },
                $or: [{ active: 2 }, { type_duyet: 3 }],
            });
            totalPages = Math.ceil(datafull.length / perPage);
            return functions.success(res, 'get data success', { data, totalPages })
        }
    } catch (error) {
        console.error('Failed ', error);
        return functions.setError(res, error);
    }
}

//danh sách đề xuất
exports.admin_danh_sach_de_xuat = async(req, res) => {
    try {
        let { phong_ban, id_user, type_dx, type_duyet, time_s, time_e, page, perPage } = req.body;

        let com_id = '';
        if (req.user.data.type == 1) {
            com_id = req.user.data.com_id
        } else {
            return functions.setError(res, 'Bạn không có quyền truy cập.', 400)
        }
        if (!perPage) {
            perPage = 10; // Giá trị mặc định nếu không được cung cấp
        }
        const startIndex = (page - 1) * perPage;
        // Tạo câu truy vấn dựa trên các điều kiện tìm kiếm
        let query = { com_id: com_id, del_type: 1 };

        if (phong_ban) {
            let checkUser = await User.find({
                'inForPerson.employee.dep_id': phong_ban
            }).select('idQLC');
            const userId = checkUser.map(item => item.idQLC);
            query.$or = [{ com_id: com_id }, { id_user: { $in: userId } }];
        }

        if (id_user) {
            query.id_user = id_user;
        }

        if (type_dx) {
            query.type_dx = type_dx;
        }

        if (type_duyet) {
            query.type_duyet = type_duyet;
        }
        const sortOptions = { _id: -1 };

        const startTime = new Date(time_s);
        const endTime = new Date(time_e);
        if (time_s && time_e) {
            query.time_create = { $gte: startTime / 1000, $lte: endTime / 1000 };
        } else if (time_s) {
            query.time_create = { $gte: startTime / 1000 };
        } else if (time_e) {
            query.time_create = { $lte: endTime / 1000 };
        }
        const showDeXuat = await De_Xuat.find(query)
            .select('name_user name_dx time_create type_duyet organizeDetailName')
            .sort(sortOptions)
            .skip(startIndex)
            .limit(perPage);

        const totalCount = await De_Xuat.countDocuments(query);
        const totalPages = Math.ceil(totalCount / perPage);
        return functions.success(res, 'get data success', { data: showDeXuat, totalPages })
    } catch (error) {
        console.error('Failed ', error);
        return functions.setError(res, error);
    }
};