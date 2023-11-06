const Shifts = require('../../models/qlc/Shifts');
const functions = require("../../services/functions");
const Users = require("../../models/Users");
//lấy danh sách ca làm việc
exports.getListShifts = async(req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const list = await Shifts.find({
            com_id: com_id
        }).sort({ _id: -1 });
        return functions.success(res, 'Danh sách ca làm việc của công ty', { list });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
};

//lấy danh sách ca làm việc theo id
exports.getShiftById = async(req, res) => {
    try {
        const { shift_id } = req.body;
        if (shift_id) {
            const shift = await Shifts.findOne({
                shift_id: shift_id
            }).lean();
            if (shift) {
                return functions.success(res, "Lấy thông tin thành công", { shift });
            }
            return functions.setError(res, "Không tồn tại ca làm việc", 404);
        }
        return functions.setError(res, "Bạn chưa truyền lên id ca làm việc");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
};


exports.createShift = async(req, res) => {
    try {
        const { shift_name, start_time, end_time, start_time_latest, end_time_earliest, shift_type, num_to_calculate, num_to_money } = req.body;
        if (req.user.data.type == 1) {
            const com_id = req.user.data.idQLC;
            if (shift_name && start_time && end_time && shift_type) {
                const check = await Shifts.findOne({ shift_name: shift_name, com_id: com_id }).lean();
                if (!check) {
                    const max = await Shifts.findOne({}, {}, { sort: { shift_id: -1 } }).lean() || 0;
                    const item = new Shifts({
                        shift_id: Number(max.shift_id) + 1 || 1,
                        com_id: com_id,
                        shift_name: shift_name,
                        start_time: start_time,
                        start_time_latest: start_time_latest,
                        end_time: end_time,
                        end_time_earliest: end_time_earliest,
                        shift_type: shift_type,
                        num_to_calculate: num_to_calculate,
                        num_to_money: num_to_money,
                    });
                    await item.save();
                    return functions.success(res, 'tạo ca làm việc thành công', {
                        data: {
                            shift_id: Number(max.shift_id) + 1 || 1,
                            com_id: com_id,
                            shift_name: shift_name,
                            start_time: start_time,
                            start_time_latest: start_time_latest,
                            end_time: end_time,
                            end_time_earliest: end_time_earliest,
                            shift_type: shift_type,
                            num_to_calculate: num_to_calculate,
                            num_to_money: num_to_money,
                        }
                    });
                }
                return functions.setError(res, "Ca làm việc này đã được tạo");
            }
            return functions.setError(res, "Thiếu dữ liệu truyền lên");
        }
        return functions.setError(res, "Tài khoản không thể thực hiện chức năng này");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
};

exports.editShift = async(req, res) => {
    try {
        if (req.user.data.type == 1) {
            const { shift_id, shift_name, start_time, end_time, start_time_latest, end_time_earliest, shift_type, num_to_calculate, num_to_money } = req.body;
            const com_id = req.user.data.idQLC;
            if (shift_id) {
                const shift = await functions.getDatafindOne(Shifts, { shift_id: shift_id });
                if (shift) {
                    await Shifts.updateOne({ shift_id: shift_id, com_id: com_id }, {
                        $set: {
                            shift_name: shift_name,
                            start_time: start_time,
                            end_time: end_time,
                            start_time_latest: start_time_latest,
                            end_time_earliest: end_time_earliest,
                            shift_type: shift_type,
                            num_to_calculate: num_to_calculate,
                            num_to_money: num_to_money,
                        }
                    });
                    return functions.success(res, "Cập nhật thành công");
                }
                return functions.setError(res, "Ca làm việc không tồn tại");
            }
            return functions.setError(res, "Chưa truyền id ca làm việc");
        }
        return functions.setError(res, "Tài khoản không thể thực hiện chức năng này");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}




exports.deleteShiftCompany = async(req, res) => {
    try {
        const com_id = req.user.data.com_id
            // let com_id = req.body.com_id
        let shift_id = req.body.shift_id
        const shifts = await functions.getDatafind(Shifts, { com_id: com_id, shift_id: shift_id });
        if (shifts) {
            await Shifts.deleteOne({ com_id: com_id, shift_id: shift_id })
            return functions.success(res, "xoá thành công", { shifts })
        }
        return functions.setError(res, "không tìm thấy ca làm việc của công ty");
    } catch (e) {
        return functions.setError(res, e.message);
    }

}