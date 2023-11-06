const Users = require('../../../models/Users');
const functions = require('../../../services/functions');
const NewTV365 = require('../../../models/Timviec365/UserOnSite/Company/New');

// Service
const service = require('../../../services/timviec365/new');
const serviceCompany = require('../../../services/timviec365/company');


// cập nhập tin tuyển dụng
exports.updateNewTv365 = async(req, res, next) => {
    try {
        let request = req.body,
            idCompany = request.usc_id,
            new_title = request.new_title,
            new_id = Number(request.new_id),
            new_cat_id = request.new_cat_id,
            new_so_luong = request.new_so_luong,
            new_cap_bac = request.new_cap_bac,
            new_hinh_thuc = request.new_hinh_thuc,
            new_city = request.new_city,
            new_qh = request.new_qh,
            new_addr = request.new_addr,
            new_money_unit = request.new_money_unit,
            new_hoahong = request.new_hoahong,
            new_money = request.new_money,
            new_tgtv = request.new_tgtv,
            new_money_type = request.new_money_type,
            new_money_max = request.new_money_max,
            new_money_min = request.new_money_min,
            new_mota = request.new_mota,
            new_yeucau = request.new_yeucau,
            new_exp = request.new_exp,
            new_bang_cap = request.new_bang_cap,
            new_gioi_tinh = request.new_gioi_tinh,
            new_quyenloi = request.new_quyenloi,
            new_ho_so = request.new_hoso,
            new_han_nop = request.new_han_nop,
            new_lv;

        if (new_title && new_cat_id && new_so_luong && new_cap_bac && new_hinh_thuc && new_city && new_qh && new_addr &&
            new_money_unit && new_mota && new_yeucau && new_exp && new_bang_cap && new_gioi_tinh && new_quyenloi && new_han_nop && new_money_type && new_id) {
            const new365 = await NewTV365.findOne({ new_id: new_id }).lean();
            if (new365) {
                if (!await service.checkExistTitle(idCompany, new_title, new_id)) {
                    return functions.setError(res, 'Tiêu đề đã tồn tại', 500);
                }

                if (await service.checkSpecalCharacter(new_title)) {
                    return functions.setError(res, 'Tiêu đề không cho phép chứa ký tự đặc biệt', 500);
                }

                if (!await service.foundKeywordHot(new_title)) {
                    return functions.setError(res, "Tiêu đề tin không dược chứa các từ Hot, tuyển gấp, cần gấp, lương cao", 500);
                }

                if (!await functions.checkTime(new_han_nop)) {
                    return functions.setError(res, 'thời gian hạn nộp phải lớn hơn thời gian hiện tại', 500);
                }

                // Xử lý giá trị của mức lương qua loại lương
                const getMoney = service.getMoney(new_money_type, new_money, new_money_min, new_money_max);
                new_money = getMoney.money;
                new_money_max = getMoney.maxValue;
                new_money_min = getMoney.minValue;

                // Lấy tag
                let takeData = await service.recognition_tag_tin(new_cat_id, new_title, new_mota, new_yeucau);
                new_lv = takeData.length > 0 ? takeData.id_tag : null;

                await NewTV365.updateOne({ new_id: new_id }, {
                    $set: {
                        new_title: new_title,
                        new_cat_id: new_cat_id.split().map(Number),
                        new_city: new_city.split().map(Number),
                        new_qh_id: new_qh.split().map(Number),
                        new_addr: new_addr,
                        new_money: new_money,
                        new_cap_bac: new_cap_bac,
                        new_exp: new_exp,
                        new_gioi_tinh: new_gioi_tinh,
                        new_bang_cap: new_bang_cap,
                        new_so_luong: new_so_luong,
                        new_hinh_thuc: new_hinh_thuc,
                        new_update_time: functions.getTimeNow(),
                        new_han_nop: new_han_nop,
                        new_mota: new_mota,
                        new_yeucau: new_yeucau,
                        new_quyenloi: new_quyenloi,
                        new_ho_so: new_ho_so,
                        new_hoahong: new_hoahong,
                        new_tgtv: new_tgtv,
                        new_lv: new_lv,
                        nm_type: new_money_type,
                        nm_min_value: new_money_min,
                        nm_max_value: new_money_max,
                        nm_unit: new_money_unit
                    }
                });

                const list_delele = req.body.list_delele;
                const arr_notify = req.body.arr_noti;
                service.update_notify(list_delele, arr_notify, idCompany, 0, 1, new_id);

                await Users.updateOne({ idTimViec365: idCompany, type: 1 }, {
                    $set: {
                        'inForCompany.timviec365.usc_update_new': functions.getTimeNow(),
                    }
                });

                return functions.success(res, "cập nhập bài tuyển dụng thành công", { new: await NewTV365.findOne({ new_id: new_id }).lean() });
            }
            return functions.setError(res, 'Tin không tồn tại', 404);
        }
        return functions.setError(res, 'thiếu dữ liệu');
    } catch (error) {
        return functions.setError(res, error)
    }
}


// ghim tin tuyển dụng
exports.updateNewTv365Hot = async(req, res, next) => {
    try {
        let request = req.body,
            new_id = Number(request.new_id),
            new_hot = request.new_hot,
            new_do = request.new_do,
            new_gap = request.new_gap,
            new_cao = request.new_cao,
            new_ghim = request.new_ghim,
            new_nganh = request.new_nganh,
            new_thuc = request.new_thuc,
            new_vip_time = request.new_vip_time,
            new_cate_time = request.new_cate_time;

        if (new_id) {
            const new365 = await NewTV365.findOne({ new_id: new_id }).lean();
            if (new365) {
                await NewTV365.updateOne({ new_id }, {
                    $set: {
                        new_hot: new_hot,
                        new_do: new_do,
                        new_gap: new_gap,
                        new_cao: new_cao,
                        new_ghim: new_ghim,
                        new_nganh: new_nganh,
                        new_thuc: new_thuc,
                        new_vip_time: new_vip_time,
                        new_cate_time: new_cate_time
                    }
                });
                return functions.success(res, "Ghim tuyển dụng thành công");
            }
            return functions.setError(res, 'Tin không tồn tại', 404);
        }
        return functions.setError(res, 'Thiếu dữ liệu');
    } catch (error) {

        return functions.setError(res, error)
    }
}

// ghim tin tuyển dụng
exports.deleteNewTV365 = async(req, res, next) => {
    try {
        let request = req.body,
            new_id = Number(request.new_id);

        if (new_id) {
            const new365 = await NewTV365.deleteOne({ new_id: new_id });
            return functions.setError(res, 'Xóa tin thành công', 404);
        }
        return functions.setError(res, 'Thiếu dữ liệu');
    } catch (error) {

        return functions.setError(res, error)
    }
}

// hàm làm mới tin
exports.refreshNew = async(req, res, next) => {
    try {
        let idNew = req.body.new_id;
        if (idNew) {
            await NewTV365.updateOne({ new_id: idNew }, {
                $set: { new_update_time: functions.getTimeNow() }
            });
            return functions.success(res, "làm mới bài tuyển dụng thành công")
        }
        return functions.setError(res, 'thiếu dữ liệu', 404)
    } catch (error) {

        return functions.setError(res, error)
    }
}