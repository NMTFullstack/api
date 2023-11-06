const De_Xuat = require('../../../models/Vanthu/de_xuat');
const His_Handle = require('../../../models/Vanthu/history_handling_dx');
const setting_dx = require('../../../models/Vanthu/setting_dx');
const User = require('../../../models/Users');
const functions = require('../../../services/vanthu')
const axios = require('axios');
const vanthu = require('../../../services/vanthu')
const TamUng = require('../../../../tinhluong/models/Tinhluong/TinhluongTamUng');
const ThanhToan = require('../../../../tinhluong/models/Tinhluong/TinhluongThanhToan');
//ham duyet
exports.edit_active = async(req, res) => {
    try {
        const { _id, type, id_ep, shift_id, id_uct, idUserBanGiao, refuse_reason, assetFixForm } = req.body;
        const timeNow = new Date();
        const com_id = req.user.data.com_id
        const id_user = req.user.data.idQLC
        const _id_user = req.user.data._id
        const check = await De_Xuat.findOne({ _id: _id })
        const userDuyet = check.id_user_duyet
        if (check) {
            // Duyệt đề xuất
            if (type == 1) {
                return vanthu.browseProposals(res, His_Handle, De_Xuat, _id, check, id_user, com_id, idUserBanGiao, assetFixForm, _id_user);
            }
            // Từ chối đề xuất 
            if (type == 2) {
                return vanthu.refuseProposal(res, His_Handle, De_Xuat, _id, id_ep, check, id_user, refuse_reason)
            }
            // Bắt buộc đi làm
            if (type == 3) {
                return vanthu.compulsoryWork(res, His_Handle, De_Xuat, _id, check, id_user);
            }
            // Duyệt chuyển tiếp
            if (type == 4) {
                return vanthu.forwardBrowsing(res, His_Handle, De_Xuat, _id, id_uct, check, id_user)
            }
            // Tiếp nhận
            if (type == 6) {
                let id_user_duyet = [];
                let history = [];
                if (userDuyet) {
                    id_user_duyet = userDuyet.split(',').map(Number);
                    for (var i = 0; i < id_user_duyet.length; i++) {
                        id = id_user_duyet[i];
                        const his = await His_Handle.findOne({ id_user: id, id_dx: _id }).sort({ time: -1 })
                        history.push({ id: id, history: his ? his.type_handling : null });
                    }
                }
                if (check.kieu_duyet == 0 || check.kieu_duyet == 1) {
                    // Nếu là công ty 
                    if (com_id === id_user) {
                        await De_Xuat.findOneAndUpdate({ _id: _id }, {
                            $set: {
                                type_duyet: 11,
                                time_tiep_nhan: timeNow,
                                active: 1
                            }
                        }, { new: true });
                        const createHis = new His_Handle({
                            _id: await functions.getMaxID(His_Handle) + 1,
                            id_user: id_user,
                            id_dx: check._id,
                            type_handling: 1,
                            time: timeNow
                        });
                        await createHis.save();
                        return functions.success(res, 'Hủy duyệt thành công');
                    }
                    // Nếu không phải là công ty
                    else {
                        if (history.length > 0) {
                            // Nếu có bất cứ một người duyệt nào khác người duyệt hiện tại đã duyệt
                            if (history.filter(his => his.id !== id_user).some(his => his.history === 2)) {
                                await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                    $set: {
                                        type_duyet: 10,
                                        time_tiep_nhan: timeNow,
                                        active: 1
                                    }
                                }, { new: true });
                                const createHis = new His_Handle({
                                    _id: await functions.getMaxID(His_Handle) + 1,
                                    id_user: id_user,
                                    id_dx: check._id,
                                    type_handling: 1,
                                    time: timeNow
                                });
                                await createHis.save();
                                return functions.success(res, 'Chờ lãnh đạo còn lại duyệt');
                            }
                            // Nếu chưa có một người duyệt nào đã duyệt
                            else {
                                await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                    $set: {
                                        type_duyet: 7,
                                        time_tiep_nhan: timeNow,
                                        active: 1
                                    }
                                }, { new: true });
                                const createHis = new His_Handle({
                                    _id: await functions.getMaxID(His_Handle) + 1,
                                    id_user: id_user,
                                    id_dx: check._id,
                                    type_handling: 1,
                                    time: timeNow
                                });
                                await createHis.save();
                                return functions.success(res, 'Đã tiếp nhận đề xuất');
                            }
                        }
                    }
                }
            }
        } else {
            return functions.setError(res, 'Không tìm thấy đề xuất', 400);
        }
    } catch (error) {
        console.error('Failed ', error);
        return functions.setError(res, error);
    }
};
exports.xac_nhan_tam_ung = async(req, res) => {
    try {
        let {
            _id,
            type_xac_nhan,
        } = req.body;
        const com_id = req.user.data.com_id;
        const id_user = req.user.data.idQLC;
        const dx = await De_Xuat.findOne({
            _id: _id,
            com_id: com_id,
            id_user: id_user,
        })
        if (dx) {
            if (dx.type_duyet === 5) {
                if (type_xac_nhan === '0') {
                    const nd = dx.noi_dung.tam_ung;
                    let max_id;
                    let max = await TamUng.findOne({}, {}, { sort: { pay_id: -1 } }).lean() || 0;
                    if (!max) {
                        max_id = 0
                    } else {
                        max_id = max.pay_id;
                    }
                    const date_tu = new Date(nd.ngay_tam_ung * 1000);
                    const createTU = new TamUng({
                        pay_id: max_id + 1,
                        pay_id_user: dx.id_user,
                        pay_id_com: dx.com_id,
                        pay_price: nd.sotien_tam_ung,
                        pay_status: 2,
                        pay_case: nd.ly_do,
                        pay_day: date_tu.toISOString(),
                        pay_month: date_tu.getMonth() + 1,
                        pay_year: date_tu.getFullYear(),
                    });
                    await createTU.save();
                    if (createTU) {
                        await De_Xuat.findOneAndUpdate({ _id: _id }, {
                            $set: {
                                tam_ung_status: 2,
                            }
                        }, { new: true });
                        return res.status(200).json({ message: 'Xác nhận nhận tiền tạm ứng thành công', dataTU: createTU });
                    } else {
                        return functions.setError(res, "Thông tin truyền lên không đầy đủ");
                    }
                } else {
                    await De_Xuat.findOneAndUpdate({ _id: _id }, {
                        $set: {
                            tam_ung_status: 3,
                        }
                    }, { new: true });
                    return res.status(200).json({ message: 'Xác nhận không nhận tiền tạm ứng thành công' });
                }
            } else {
                return res.status(200).json({ message: 'Đề xuất chưa được duyệt' });
            }
        } else {
            return res.status(200).json({ message: 'Đề xuất không tồn tại trong hệ thống' });
        }
    } catch (error) {
        console.error('Failed ', error);
        return functions.setError(res, error);
    }
}
exports.xac_nhan_thanh_toan = async(req, res) => {
        try {
            let {
                _id,
                type_xac_nhan,
            } = req.body;
            const com_id = req.user.data.com_id;
            const id_user = req.user.data.idQLC;
            const dx = await De_Xuat.findOne({
                _id: _id,
                com_id: com_id,
                id_user: id_user,
            })
            if (dx) {
                if (dx.type_duyet === 5) {
                    if (type_xac_nhan === '0') {
                        const nd = dx.noi_dung.thanh_toan;
                        let max_id;
                        let max = await ThanhToan.findOne({}, {}, { sort: { pay_id: -1 } }).lean() || 0;
                        if (!max) {
                            max_id = 0
                        } else {
                            max_id = max.pay_id;
                        }
                        const createDate = new Date(dx.time_create * 1000);
                        const createTT = new ThanhToan({
                            pay_id: max_id + 1,
                            pay_id_user: dx.id_user,
                            pay_id_com: dx.com_id,
                            pay_price: nd.so_tien_tt,
                            pay_status: 2,
                            pay_case: nd.ly_do,
                            pay_day: createDate.toISOString(),
                            pay_month: createDate.getMonth() + 1,
                            pay_year: createDate.getFullYear(),
                        });
                        await createTT.save();
                        if (createTT) {
                            await De_Xuat.findOneAndUpdate({ _id: _id }, {
                                $set: {
                                    thanh_toan_status: 2,
                                }
                            }, { new: true });
                            return res.status(200).json({ message: 'Xác nhận nhận tiền thanh toán thành công', dataTT: createTT });
                        } else {
                            return functions.setError(res, "Thông tin truyền lên không đầy đủ");
                        }
                    } else {
                        await De_Xuat.findOneAndUpdate({ _id: _id }, {
                            $set: {
                                thanh_toan_status: 3,
                            }
                        }, { new: true });
                        return res.status(200).json({ message: 'Xác nhận không nhận tiền thanh toán thành công' });
                    }
                } else {
                    return res.status(200).json({ message: 'Đề xuất chưa được duyệt' });
                }
            } else {
                return res.status(200).json({ message: 'Đề xuất không tồn tại trong hệ thống' });
            }
        } catch (error) {
            console.error('Failed ', error);
            return functions.setError(res, error);
        }
    }
    // duyet de xuat tam ung 
exports.duyet_de_xuat_tam_ung = async(req, res) => {
    try {
        const { _id, id_user_duyet, id_user_theo_doi } = req.body;
        const timeNow = new Date().getTime() / 1000;
        // thêm đoạn check phân quyền. 
        const idQLC = req.user.data.idQLC;
        if (idQLC == id_user_duyet) {
            const check = await De_Xuat.findOne({ _id: _id }).lean();
            if (check) {
                // set type_duyet = 5
                await De_Xuat.updateOne({ _id: _id }, {
                    $set: {
                        type_duyet: 5,
                        id_user_duyet: id_user_duyet,
                        id_user_theo_doi: id_user_theo_doi,
                        time_duyet: timeNow
                    }
                });
                return res.status(200).json({
                    message: 'Đã duyệt đề xuất',
                    data: await De_Xuat.findOne({ _id: _id }).lean()
                });
            } else {
                return functions.setError(res, 'Không tìm thấy đề xuất', 400);
            }
        } else {
            return functions.setError(res, 'Người dùng không hợp lệ', 400);
        }
    } catch (error) {
        console.error('Failed ', error);
        return functions.setError(res, error);
    }
};