const functions = require('../../../services/functions')
const vanthu = require('../../../services/vanthu.js');
const tbl_qly_congvan = require('../../../models/Vanthu365/tbl_qly_congvan');
const tbl_qlcv_edit = require('../../../models/Vanthu365/tbl_qlcv_edit');
const folder = 'file_van_ban';
// danh sách hợp đồng
exports.getListContract = async (req, res, next) => {
    try {
        let key = req.body.key;
        let page = Number(req.body.page);
        let pageSize = Number(req.body.pageSize);
        let book = req.body.book;
        let money_min = req.body.money_min;
        let money_max = req.body.money_max;

        let dayStart = req.body.dayStart;
        let dayEnd = req.body.dayEnd;
        let status = req.body.status;

        let comId = req.comId;
        let type = Number(req.body.type);
        //tạo phân trang
        let skip = (page - 1) * pageSize;
        let limit = pageSize;
        // khai báo điều kiện, đầu ra
        let data = {};
        let conditions = {};
        if (key) {
            conditions = {
                $or: [
                    { cv_name: new RegExp(key, 'i')  },
                    { cv_so: { $regex: key } }
                ]
            }
        }
        if (!type) return functions.setError(res, 'missing input value', 400)
        if (dayStart) conditions.cv_date = { $gte: new Date(dayStart).getTime() / 1000 }
        if (dayEnd) conditions.cv_date = { $lte: new Date(dayEnd).getTime() / 1000 }
        if (dayStart && dayEnd) conditions.cv_date = { $gte: new Date(dayStart).getTime() / 1000, $lte: new Date(dayEnd).getTime() / 1000 }
        if (book) conditions.cv_id_book = book
        if (status) conditions.cv_status_hd = status
        if (money_min) conditions.cv_money = { $gte: money_min }
        if (money_max) conditions.cv_money = { $lte: money_max }
        if (money_min && money_max) conditions.cv_money = { $gte: money_min, $lte: money_max }
        conditions.cv_type_hd = 1;
        conditions.cv_usc_id = comId;
        conditions.cv_type_xoa = 0;
        if (type === 1) {
            conditions.cv_type_loai = 1;
        } else if (type === 2) {
            conditions.cv_type_loai = 2;
        }
        let db_qr = await tbl_qly_congvan.find(conditions).sort({ cv_date: -1 }).skip(skip).limit(limit);
        let count = await tbl_qly_congvan.countDocuments(conditions)
        data.count = count;
        data.db_qr = db_qr;
        return functions.success(res, 'get data success', { data })
    } catch (error) {
        console.error(error);
        return functions.setError(res, error)
    }
};
// thêm mới hợp đồng đến
exports.createSendContract = async (req, res, next) => {
    try {
        let comId = req.comId ;
        let name_vbden = req.body.name_vbden;
        let so_vbden = req.body.so_vbden;
        let type_gui_vbden = Number(req.body.type_gui_vbden);
        let noi_gui_vbden = Number(req.body.noi_gui_vbden);
        let text_gui_vbden = req.body.text_gui_vbden;
        let user_gui_vbden = req.body.user_gui_vbden;
        let text_user_gui_vbden = req.body.text_user_gui_vbden;
        let date_nhan = req.body.date_nhan;
        let use_nhan_vbden = Number(req.body.use_nhan_vbden);
        let use_luu_vbden = Number(req.body.use_luu_vbden);
        let book_vb = Number(req.body.book_vb);
        let trich_yeu_vbden = req.body.trich_yeu_vbden;
        let ghi_chu_vbden = req.body.ghi_chu_vbden;
        let file = req.files.file;
        let user_ky = Number(req.body.user_ky);
        let money_hd = Number(req.body.money_hd);
        let cv_file = '';
        let cv_time_create = new Date();
        if (file && file.length > 0) {
            for (let i = 0; i < file.length; i++) {
                let fileName = await vanthu.uploadfile(folder, file[i],cv_time_create);
                if(fileName) {
                    cv_file += fileName;
                }
                
            }
        }

        if (await !functions.checkNumber(type_gui_vbden) || await !functions.checkNumber(noi_gui_vbden) ||
            await !functions.checkNumber(use_nhan_vbden) || await !functions.checkNumber(use_luu_vbden)
            || await !functions.checkNumber(book_vb)) {
            return functions.setError(res, 'invalid number', 400)
        }
        let _id = await vanthu.getMaxID(tbl_qly_congvan)
        if (name_vbden && so_vbden && type_gui_vbden && text_gui_vbden
            && date_nhan && text_user_gui_vbden && use_luu_vbden && use_nhan_vbden && trich_yeu_vbden && user_ky) {
            await tbl_qly_congvan.create({
                _id,
                cv_name: name_vbden,
                cv_so: so_vbden,
                cv_type_soan: type_gui_vbden,
                cv_soan_ngoai: text_gui_vbden,
                cv_phong_soan: noi_gui_vbden,
                cv_user_soan: user_gui_vbden,
                cv_name_soan: text_user_gui_vbden,
                cv_id_book: book_vb,
                cv_date: new Date(date_nhan).getTime() / 1000,
                cv_user_save: use_luu_vbden,
                cv_user_ky: user_ky,
                cv_type_chuyenden: 1,
                cv_chuyen_noibo: use_nhan_vbden,
                cv_file: cv_file,
                cv_trich_yeu: trich_yeu_vbden,
                cv_ghi_chu: ghi_chu_vbden,
                cv_type_loai: 1,
                cv_type_hd: 1,
                cv_status_hd: 1,
                cv_money: money_hd,
                cv_usc_id: comId,
                cv_time_created: Math.round(cv_time_create.getTime() / 1000)
            })
        } else {
            return functions.setError(res, 'missing data', 400)
        }
        return functions.success(res, 'add successfully')
    } catch (err) {
        console.error(err)
        return functions.setError(res, err)
    }
};
// sửa  hợp đồng đến
exports.updateSendContract = async (req, res, next) => {
    try {
        let comId = req.comId;
        let name_vbden = req.body.name_vbden;
        let so_vbden = req.body.so_vbden;
        let type_gui_vbden = Number(req.body.type_gui_vbden);
        let noi_gui_vbden = Number(req.body.noi_gui_vbden);
        let text_gui_vbden = req.body.text_gui_vbden;
        let user_gui_vbden = req.body.user_gui_vbden;
        let text_user_gui_vbden = req.body.text_user_gui_vbden;
        let date_nhan = new Date (req.body.date_nhan);
        let use_nhan_vbden = Number(req.body.use_nhan_vbden);
        let use_luu_vbden = Number(req.body.use_luu_vbden);
        let book_vb = Number(req.body.book_vb);
        let trich_yeu_vbden = req.body.trich_yeu_vbden;
        let ghi_chu_vbden = req.body.ghi_chu_vbden;
        let file = req.files.file;
        let user_ky = Number(req.body.user_ky);
        let money_hd = Number(req.body.money_hd);
        let cv_file = '';
        let id = req.body.id;
        let useId = req.body.useId;
        if (!id) return functions.setError(res, 'not found id', 404);
        let check = await tbl_qly_congvan.findById(id)
        if (!check) {
            return functions.setError(res, 'not found contract', 404);
        }
        if (file && file.length > 0) {
            for (let i = 0; i < file.length; i++) {
                
                let fileName = await vanthu.uploadfile(folder, file[i],new Date(check.cv_time_created * 1000));
                if(fileName) {
                    cv_file += fileName;
                }
            }
            await tbl_qly_congvan.findByIdAndUpdate(id,{cv_file})
        }

        if (await !functions.checkNumber(type_gui_vbden) || await !functions.checkNumber(noi_gui_vbden) ||
            await !functions.checkNumber(use_nhan_vbden) || await !functions.checkNumber(use_luu_vbden)
            || await !functions.checkNumber(book_vb)) {
            return functions.setError(res, 'invalid number', 400)
        }
        let cv_time_update = new Date().getTime() / 1000;
        let type_edit = 0;
        let noi_dung = '';
        if (name_vbden && so_vbden && type_gui_vbden && text_gui_vbden
            && date_nhan && text_user_gui_vbden && use_luu_vbden && use_nhan_vbden && trich_yeu_vbden && user_ky) {
            if (name_vbden != check.cv_name) noi_dung += 'Tên hợp đồng,'
            if (so_vbden != check.cv_so) noi_dung += 'Số hợp đồng,'
            if (type_gui_vbden != check.cv_type_soan) noi_dung += 'Chọn nơi gửi,'
            if (noi_gui_vbden != check.cv_phong_soan) noi_dung += 'Nơi gửi nội bộ,'
            if (text_gui_vbden != check.cv_soan_ngoai) noi_dung += 'Nơi gửi ngoài,'
            if (user_gui_vbden != check.cv_user_soan) noi_dung += 'Người gửi nội bộ,'
            if (text_user_gui_vbden != check.cv_name_soan) noi_dung += 'Người gửi ngoài,'
            if ( date_nhan.getTime() / 1000 != check.cv_date) noi_dung += 'Ngày nhận,'
            if (use_nhan_vbden != check.cv_chuyen_noibo) noi_dung += 'Người nhận hợp đồng,'
            if (use_luu_vbden != check.cv_user_save) noi_dung += 'Người lưu trữ,'
            if (trich_yeu_vbden != check.cv_trich_yeu) noi_dung += 'Trích yếu,'
            if (ghi_chu_vbden != check.cv_ghi_chu) noi_dung += 'Ghi chú,'
            if (book_vb != check.cv_id_book) noi_dung += 'Sổ văn bản,'
            if (file && file.file) noi_dung += 'File đính kèm,'
            if (user_ky != check.cv_user_ky) noi_dung += 'Người ký,'
            if (money_hd != check.cv_money) noi_dung += 'Tổng tiền hợp đồng,'

            let users = 0;
            if (noi_dung !== '') {
                type_edit = 1;
                if (useId == 0) {
                    type_user = 1;
                    users = comId;
                }
                else {
                    type_user = 2;
                    users = useId;
                }
                let _id = await vanthu.getMaxId(tbl_qlcv_edit)
                await tbl_qlcv_edit.create({
                    _id,
                    ed_cv_id: id,
                    ed_time: cv_time_update,
                    ed_type_user: type_user,
                    ed_user: users,
                    ed_nd: noi_dung,
                    ed_usc_id: comId
                })
            }
            await tbl_qly_congvan.findByIdAndUpdate(id, {
                cv_name: name_vbden,
                cv_id_book: book_vb,
                cv_so: so_vbden,
                cv_type_soan: type_gui_vbden,
                cv_soan_ngoai: text_gui_vbden,
                cv_phong_soan: noi_gui_vbden,
                cv_user_soan: user_gui_vbden,
                cv_name_soan: text_user_gui_vbden,
                cv_user_ky: user_ky,
                cv_date: date_nhan.getTime() / 1000,
                cv_money: money_hd,
                cv_user_save: use_luu_vbden,
                cv_type_chuyenden: 1,
                cv_chuyen_noibo: use_nhan_vbden,
                cv_trich_yeu: trich_yeu_vbden,
                cv_ghi_chu: ghi_chu_vbden,
                cv_type_edit: type_edit,
                cv_time_edit: cv_time_update
            })

        } else {
            return functions.setError(res, 'missing data', 400)
        }

        return functions.success(res, 'update successfully')
    } catch (err) {
        console.error(err)
        return functions.setError(res, err)
    }
};

// tạo hợp đồng đi
exports.createContract = async (req, res, next) => {
    try {
        let comId = req.comId;
        let name_vbdi = req.body.name_vbdi;
        let so_vbdi = req.body.so_vbdi;
        let dvst_vbdi = Number(req.body.dvst_vbdi);
        let nst_vbdi = Number(req.body.nst_vbdi);
        let date_guidi = req.body.date_guidi;
        let use_luu_vbdi = Number(req.body.use_luu_vbdi);
        let use_ky_vbdi = Number(req.body.use_ky_vbdi);
        let nhanvb_dep = req.body.nhanvb_dep;
        let nhan_noibo_vb_di = Number(req.body.nhan_noibo_vb_di);
        let nhan_ngoai_dep_vbdi = req.body.nhan_ngoai_dep_vbdi;
        let nhanvb_use = req.body.nhanvb_use;
        let nhan_use_vbdi = Number(req.body.nhan_use_vbdi);
        let nhan_ngoai_user_vbdi = req.body.nhan_ngoai_user_vbdi;
        let trich_yeu_vbdi = req.body.trich_yeu_vbdi;
        let ghi_chu_vbdi = req.body.ghi_chu_vbdi;
        let book_vb = Number(req.body.book_vb);
        let money_hd = Number(req.body.money_hd);
        let file = req.files.file;
        let cv_time_created = new Date();
        if (nhanvb_dep && nhanvb_dep.length !== 0) {
            nhanvb_dep = nhanvb_dep.join(" ")
        }
        if (nhanvb_use && nhanvb_use.length !== 0) {
            nhanvb_use = nhanvb_use.join(" ")
        }
        let cv_file = '';
        if (name_vbdi && so_vbdi && date_guidi && use_luu_vbdi && use_ky_vbdi && trich_yeu_vbdi) {
            if (await !functions.checkNumber(dvst_vbdi) || await !functions.checkNumber(nst_vbdi) ||
                await !functions.checkNumber(use_luu_vbdi) || await !functions.checkNumber(use_ky_vbdi)
                || await !functions.checkNumber(book_vb)) {
                return functions.setError(res, 'invalid number', 400)
            }
            if (file && file.length > 0) {
                for (let i = 0; i < file.length; i++) {
                    let fileName = await vanthu.uploadfile(folder, file[i],cv_time_created);
                    if(fileName) {
                        cv_file += fileName;
                    }
                }
            }
            let _id = await vanthu.getMaxID(tbl_qly_congvan)
            await tbl_qly_congvan.create({
                _id,
                cv_name: name_vbdi,
                cv_so: so_vbdi,
                cv_type_soan: 1,
                cv_phong_soan: dvst_vbdi,
                cv_user_soan: nst_vbdi,
                cv_id_book: book_vb,
                cv_file: cv_file,
                cv_money:money_hd,
                cv_status_hd:1,
                cv_type_hd:1,
                cv_date: new Date(date_guidi).getTime() / 1000,
                cv_user_save:use_luu_vbdi,
                cv_user_ky:use_ky_vbdi,
                cv_type_nhan:nhanvb_dep,
                cv_nhan_noibo:nhan_noibo_vb_di,
                cv_nhan_ngoai:nhan_ngoai_dep_vbdi,
                cv_type_chuyenden:nhanvb_use,
                cv_chuyen_noibo:nhan_use_vbdi,
                cv_chuyen_ngoai:nhan_ngoai_user_vbdi,
                cv_trich_yeu:trich_yeu_vbdi,
                cv_ghi_chu:ghi_chu_vbdi,
                cv_type_loai:2,
                cv_usc_id:comId,
                cv_time_created: Math.round(cv_time_created.getTime() / 1000),
            })
        } else {
            return functions.setError(res, 'missing data', 400)
        }
        return functions.success(res, 'add successfully')
    } catch (err) {
        console.error(err)
        return functions.setError(res, err)
    }
};

// sửa hợp đồng đi
exports.updateContract =  async (req, res, next) => {
    try {
        let comId = req.comId;
        let name_vbdi = req.body.name_vbdi;
        let so_vbdi = req.body.so_vbdi;
        let dvst_vbdi = Number(req.body.dvst_vbdi);
        let nst_vbdi = Number(req.body.nst_vbdi);
        let date_guidi = new Date(req.body.date_guidi);
        let use_luu_vbdi = Number(req.body.use_luu_vbdi);
        let use_ky_vbdi = Number(req.body.use_ky_vbdi);
        let nhanvb_dep = req.body.nhanvb_dep;
        let nhan_noibo_vb_di = Number(req.body.nhan_noibo_vb_di);
        let nhan_ngoai_dep_vbdi = req.body.nhan_ngoai_dep_vbdi;
        let nhanvb_use = req.body.nhanvb_use;
        let nhan_use_vbdi = Number(req.body.nhan_use_vbdi);
        let nhan_ngoai_user_vbdi = req.body.nhan_ngoai_user_vbdi;
        let trich_yeu_vbdi = req.body.trich_yeu_vbdi;
        let ghi_chu_vbdi = req.body.ghi_chu_vbdi;
        let book_vb = Number(req.body.book_vb);
        let file = req.files.file;
        let id = Number(req.body.id);
        let useId = Number(req.useId);
        let noidung = '';
        let type_edit = 0;
        let cv_time_update = new Date().getTime() / 1000;
        let money_hd = Number(req.body.money_hd);
        if(!id) return functions.setError(res,'missing id',400);
        if (nhanvb_dep && nhanvb_dep.length !== 0) {
            nhanvb_dep = nhanvb_dep.join(" ")
        }
        if (nhanvb_use && nhanvb_use.length !== 0) {
            nhanvb_use = nhanvb_use.join(" ")
        }
        let cv_file = '';
        if (name_vbdi && so_vbdi && date_guidi && use_luu_vbdi && use_ky_vbdi && trich_yeu_vbdi) {
            if (await !functions.checkNumber(dvst_vbdi) || await !functions.checkNumber(nst_vbdi) ||
                await !functions.checkNumber(use_luu_vbdi) || await !functions.checkNumber(use_ky_vbdi)
                || await !functions.checkNumber(book_vb)) {
                return functions.setError(res, 'invalid number', 400)
            }
            let check = await tbl_qly_congvan.findById(id);
            if (!check) return functions.setError(res, 'not found sendtext', 404)
            if (file && file.length > 0) {
                for (let i = 0; i < file.length; i++) {
                    let checkFile = await functions.checkFile(file[i].path);
                    let fileNameOrigin = file[i].name;

                    if(!checkFile){
                        return functions.setError(res, `File ${fileNameOrigin} khong dung dinh dang hoac qua kich cho phep!`, 405);
                    }
                    let fileName = await vanthu.uploadfile(folder, file[i],new Date(check.cv_time_created * 1000));
                    if(fileName) {
                        cv_file += fileName;
                    }
                }
                await tbl_qly_congvan.findByIdAndUpdate(id,{cv_file})
            }
            if (name_vbdi != check.cv_name) noidung += 'Tên văn bản,';

            if (so_vbdi != check.cv_so) noidung += 'Số văn bản,';
            if (dvst_vbdi != check.cv_phong_soan) noidung += 'Đơn vị soạn thảo,';
            if (nst_vbdi != check.cv_user_soan) noidung += 'Người soạn thảo,';
            if (date_guidi.getTime() /1000 != check.cv_date) noidung += 'Ngày gửi,';
            if (use_luu_vbdi != check.cv_user_save) noidung += 'Người lưu trữ,';
            if (use_ky_vbdi != check.cv_user_ky) noidung += 'Người ký,';
            if (nhanvb_dep != check.cv_type_nhan) noidung += 'Loại nơi nhận,';
            if (nhan_noibo_vb_di != check.cv_nhan_noibo) noidung += 'Nơi nhận nội bộ,';
            if (nhan_ngoai_dep_vbdi != check.cv_nhan_ngoai) noidung += 'Nơi nhận ngoài,';
            if (nhanvb_use != check.cv_type_chuyenden) noidung += 'Loại chuyển đến,';
            if (nhan_use_vbdi != check.cv_chuyen_noibo) noidung += 'Chuyển đến nội bộ,';
            if (nhan_ngoai_user_vbdi != check.cv_chuyen_ngoai) noidung += 'Chuyển đến ngoài,';
            if (trich_yeu_vbdi != check.cv_trich_yeu) noidung += 'Trích yếu,';
            if (ghi_chu_vbdi != check.cv_ghi_chu) noidung += 'Ghi chú,';
            if (book_vb != check.cv_id_book) noidung += 'Sổ văn bản,';
            if (file && file.file) noidung += 'File đính kèm,'
            if (money_hd != check.cv_money) noidung += 'Tổng tiền hợp đồng,'

            if (noidung !== '') {
                type_edit = 1;
                if (useId == 0) {
                    type_user = 1;
                    users = comId;
                }
                else {
                    type_user = 2;
                    users = useId;
                }
                let _id = await vanthu.getMaxId(tbl_qlcv_edit)
                await tbl_qlcv_edit.create({
                    _id,
                    ed_cv_id: id,
                    ed_time: cv_time_update,
                    ed_type_user: type_user,
                    ed_user: users,
                    ed_nd: noidung,
                    ed_usc_id: comId
                })
            }

            await tbl_qly_congvan.findByIdAndUpdate(id, {
                cv_name: name_vbdi,
                cv_id_book: book_vb,
                cv_so: so_vbdi,
                cv_type_soan: 1,
                cv_phong_soan: dvst_vbdi,
                cv_user_soan: nst_vbdi,
                cv_date:date_guidi.getTime() /1000,
                cv_user_save: use_luu_vbdi,
                cv_money:money_hd,
                cv_user_ky: use_ky_vbdi,
                cv_type_nhan: nhanvb_dep,
                cv_nhan_noibo: nhan_noibo_vb_di,
                cv_nhan_ngoai: nhan_ngoai_dep_vbdi,
                cv_type_chuyenden: nhanvb_use,
                cv_chuyen_noibo: nhan_use_vbdi,
                cv_chuyen_ngoai: nhan_ngoai_user_vbdi,
                cv_trich_yeu: trich_yeu_vbdi,
                cv_ghi_chu: ghi_chu_vbdi,
                cv_type_edit: type_edit,
                cv_time_edit: cv_time_update,
            })
        } else {
            return functions.setError(res, 'missing data', 400)
        }
        return functions.success(res, 'update successfully')
    } catch (err) {
        console.error(err)
        return functions.setError(res, err)
    }
};