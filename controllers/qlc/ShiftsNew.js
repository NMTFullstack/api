const ShiftsNew = require('../../models/qlc/ShiftsNew');
const functions = require("../../services/functions");
const Users = require("../../models/Users");
//lấy danh sách ca làm việc
exports.list = async (req, res) => {
    try {
        console.log(req.user.data)
        const com_id = req.user.data.com_id;
        const shiftNew_id = Number(req.body.shiftNew_id)
        const conditions = {
            com_id: com_id
        }
        if (shiftNew_id) conditions.shiftNew_id = shiftNew_id
        const list = await ShiftsNew.find(conditions).sort({ shiftNew_id: -1 });
        return functions.success(res, 'Danh sách ca làm việc của công ty', { data: list });
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
};

// tạo mới ca làm việc
exports.create = async (req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type
        const isAdmin = req.user.data.isAdmin

        if (Number(type) === 1 || isAdmin) {
            const { shift_name, type_shift, time_flex, start_time, end_time, start_time_latest, end_time_earliest, type_timeSheet, num_to_calculate, num_to_money, num_day, time_zone, num_to_hours, shift_broken } = req.body;
            if (com_id && shift_name && type_shift && time_flex && start_time && end_time) {
                const foundGateway = await ShiftsNew.findOne({ com_id: com_id, shift_name: shift_name }, { shiftNew_id: 1 })
                if (foundGateway) return functions.setError(res, "Tên ca làm việc đã tồn tại")
                const maxId = await ShiftsNew.findOne({}, { shiftNew_id: 1 }, { sort: { shiftNew_id: -1 } }).lean() || 0;
                const shiftNew_id = Number(maxId.shiftNew_id) + 1 || 1;
                let shift_day
                if (Number(type_shift) === 1 || Number(type_shift) === 2) shift_day = {
                    start_time: start_time,
                    start_time_latest: start_time_latest,
                    end_time: end_time,
                    end_time_earliest: end_time_earliest,
                    num_day: num_day
                }

                const newShiftsNew = new ShiftsNew({
                    shiftNew_id: shiftNew_id,
                    com_id: com_id,
                    shift_name: shift_name,
                    type_shift: type_shift,
                    time_flex: time_flex,
                    shift_day: shift_day || null,
                    shift_broken: shift_broken || [],
                    type_timeSheet: type_timeSheet,
                    num_to_calculate: num_to_calculate || 0,
                    num_to_money: num_to_money || 0,
                    num_to_hours: num_to_hours || 0,
                    time_zone: time_zone || 'Asia/Ho_Chi_Minh'
                })
                await newShiftsNew.save()
                return functions.success(res, "Thêm thành công", { data: newShiftsNew });
            }
            return functions.setError(res, "Thiếu thông tin");
        }
        return functions.setError(res, "Tài khoản không có quyền");

    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
};

// sửa ca làm việc
exports.edit = async (req, res) => {
    try {
        const com_id = req.user.data.com_id;
        const type = req.user.data.type
        const isAdmin = req.user.data.isAdmin
        if (Number(type) === 1 || isAdmin) {
            const { shiftNew_id, shift_name, type_shift, time_flex, start_time, end_time, start_time_latest, end_time_earliest, num_day, type_timeSheet, num_to_calculate, num_to_money, time_zone, num_to_hours, shift_broken } = req.body;
            if (shiftNew_id) {
                const foundGateway = await ShiftsNew.findOne({ shiftNew_id: shiftNew_id, com_id: com_id }, { shiftNew_id: 1 })
                if (!foundGateway) return functions.setError(res, "Ca làm việc không tồn tại");
                const findShift = await ShiftsNew.findOne({
                    shift_name: shift_name || foundGateway.shift_name,
                    shiftNew_id: {
                        $ne: shiftNew_id
                    },
                    com_id: com_id
                })
                if (findShift) return functions.setError(res, "Tên ca làm việc đã tồn tại");
                let shift_day
                let shift_broken
                if (Number(type_shift) === 1 || Number(type_shift) === 2) shift_day = {
                    start_time: start_time,
                    start_time_latest: start_time_latest,
                    end_time: end_time,
                    end_time_earliest: end_time_earliest,
                    num_day: num_day
                }
                await ShiftsNew.updateOne(
                    {
                        shiftNew_id: shiftNew_id, com_id: com_id
                    },
                    {
                        $set: {

                            shift_name: shift_name || foundGateway.shift_name,
                            type_shift: type_shift || foundGateway.type_shift,
                            time_flex: time_flex || foundGateway.time_flex,
                            shift_day: shift_day || foundGateway.shift_day,
                            shift_broken: shift_broken || foundGateway.shift_broken,
                            type_timeSheet: type_timeSheet || foundGateway.type_timeSheet,
                            num_to_calculate: num_to_calculate || foundGateway.num_to_calculate,
                            num_to_money: num_to_money || foundGateway.num_to_money,
                            num_to_hours: num_to_hours || foundGateway.num_to_hours,
                            time_zone: time_zone || foundGateway.time_zone
                        }
                    }
                )
                return functions.success(res, "Cập nhật thành công");
            }
            return functions.setError(res, "Thiếu thông tin ID ca làm việc");
        }
        return functions.setError(res, "Tài khoản không có quyền");
    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}

// xóa ca làm việc
exports.delete = async (req, res) => {
    try {
        const com_id = req.user.data.com_id
        // let com_id = req.body.com_id
        const shiftNew_id = Number(req.body.shiftNew_id)
        if (shiftNew_id) {
            const foundGateway = await ShiftsNew.findOne({ com_id: com_id, shiftNew_id: shiftNew_id }, { shiftNew_id: 1 })
            if (!foundGateway) return functions.setError(res, "Ca làm việc không tồn tại");
            await ShiftsNew.deleteOne({ com_id: com_id, shiftNew_id: shiftNew_id })
            return functions.success(res, "xoá thành công")
        }
        return functions.setError(res, "Thiếu ID ca làm việc");
    } catch (e) {
        return functions.setError(res, e.message);
    }

}