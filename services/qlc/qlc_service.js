const User = require('../../models/Users');
const CC365_Cycle = require('../../models/qlc/Cycle');
// const CC365_Resign = require('../../models/qlc/Resign');
const CC365_TimeSheet = require('../../models/qlc/TimeSheets');



exports.take_count_real_works = async(id_ep, id_com, start_date, end_date, time_check) => {
    try {
        let cycle;
        let status = 1;
        let temp_start = start_date;
        let temp_end = end_date;
        temp_start = new Date(temp_start.setSeconds(temp_start.getSeconds() - 1));
        temp_end = new Date(temp_end.setSeconds(temp_end.getSeconds() + 1));
        let new_start = new Date(temp_start.setMonth(temp_start.getMonth() - 1));
        let new_end = new Date(temp_end.setMonth(temp_end.getMonth() - 1));
        // kiểm tra nhân viên xem có tồn tại không
        let condition_take_detail = {
            "CC365_EmployeCycle.ep_id": id_ep,
            "apply_month": { "$gte": start_date },
            "apply_month": { "$lte": end_date },
        };
        if (id_com) {
            condition_take_detail = {
                "CC365_EmployeCycle.ep_id": id_ep,
                "apply_month": { "$gte": start_date },
                "apply_month": { "$lte": end_date },
                "com_id": id_com
            };
        }

        let user = await User.findOne({ idQLC: id_ep, type: { $ne: 1 } }, {
            idQLC: 1,
            email: 1,
            phoneTK: 1,
            userName: 1,
            "inForPerson.employee.ep_status": 1,
            "inForPerson.employee.time_quit_job": 1,
        }).lean();
        if (user) {
            let list_cycle_eachshift = []; //thông tin ca của từng ngày 
            // lịch làm việc 
            let list_cy_detail = await CC365_Cycle.aggregate([{
                    $match: {
                        $and: [
                            { "apply_month": { "$gte": new_start } },
                            { "apply_month": { "$lte": new_end } },
                            { "com_id": id_com }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'CC365_EmployeCycle',
                        localField: 'cy_id',
                        foreignField: 'cy_id',
                        as: 'CC365_EmployeCycle'
                    }
                },
                { $unwind: '$CC365_EmployeCycle' },
                {
                    $match: {
                        "CC365_EmployeCycle.ep_id": id_ep
                    }
                },
                {
                    $sort: {
                        "CC365_EmployeCycle.update_time": 1
                    }
                },
                {
                    $project: {
                        "cy_detail": 1,
                        "apply_month": 1,
                        "updateTime": "$CC365_EmployeCycle.update_time"
                    }
                }
            ]);
            let list_detail = []; //thông tin ca của từng ngày 
            for (let i = 0; i < list_cy_detail.length; i++) {
                let array = JSON.parse(list_cy_detail[i].cy_detail);
                let update_time = new Date(list_cy_detail[i].updateTime)
                let list_detail_small = []
                for (let j = 0; j < array.length; j++) {
                    if (array[j].shift_id) {
                        let date = new Date(
                            Number(array[j].date.split('-')[0]),
                            Number(array[j].date.split('-')[1]) - 1,
                            Number(array[j].date.split('-')[2]),
                            7
                        )
                        if (array[j].shift_id.includes(',')) {
                            let array_shift = array[j].shift_id.split(',');
                            for (let k = 0; k < array_shift.length; k++) {
                                list_detail_small.push({
                                    shift_id: Number(array_shift[k]),
                                    date
                                });
                            }
                        } else {
                            list_detail_small.push({
                                shift_id: Number(array[j].shift_id),
                                date
                            });
                        }
                    }
                };
                if (i == 0) {
                    for (let j = 0; j < list_detail_small.length; j++) {
                        list_detail.push(list_detail_small[j])
                    }
                } else {
                    list_detail_small = list_detail_small.filter((e) => e.date >= update_time);
                    list_detail = list_detail.filter((e) => e.date <= update_time);
                    for (let j = 0; j < list_detail_small.length; j++) {
                        list_detail.push(list_detail_small[j])
                    }
                }
            };
            list_cycle_eachshift = list_detail;
            // console.log('list_cycle_eachshift',list_cycle_eachshift)
            // let ep_resign;
            // if (user.email == '' && user.inForPerson.employee.ep_status == 'Deny' && user.phoneTK == '') {
            //     ep_resign = await CC365_Resign.find({ ep_id: id_ep }, { shift_id: 1 })
            // }

            // lịch sử chấm công gắn với từng ca. 
            // khôi phục lại thời gian => code đoạn này hơi ảo => log ra để hiểu 
            new_start = new Date(temp_start.setMonth(temp_start.getMonth() + 1));
            new_end = new Date(temp_end.setMonth(temp_end.getMonth() + 1));


            let listData = await CC365_TimeSheet.aggregate([{
                    $lookup: {
                        from: 'QLC_Shifts',
                        localField: 'shift_id',
                        foreignField: 'shift_id',
                        as: 'shift'
                    }
                },
                {
                    $match: {
                        "ep_id": id_ep,
                        $and: [{
                                "at_time": { "$gte": start_date }
                            },
                            {
                                "at_time": { "$lte": end_date }
                            }
                        ]
                    }
                },

                { $sort: { "at_time": -1 } },
                {
                    $project: {
                        "ep_id": 1,
                        "sheet_id": 1,
                        "shift_id": 1,
                        "at_time": 1,
                        "shift.start_time": 1,
                        "shift.end_time": 1,
                        "shift.start_time_latest": 1,
                        "shift.end_time_earliest": 1,
                        "shift.num_to_money": 1,
                        "shift.shift_type": 1,
                        "shift.num_to_calculate": 1,
                        "shift.is_overtime": 1,
                    }
                }
            ]);
            const day_of_month = Number(String((end_date - start_date) / (24 * 3600 * 1000)).split('.')[0]);
            let listDataFinal = [];
            // console.log('Lịch sử điểm danh',listData,day_of_month);
            for (let i = 1; i <= day_of_month; i++) {
                // lấy ra những lần chấm công trong ngày 
                let listTimeSheet = listData.filter(
                    (e) => e.at_time.getDate() == i);
                // console.log('Lịch sử chấm công trong ngày',i,listTimeSheet);
                if (listTimeSheet.length) {
                    let day_of_week = GetDayOfWeek(listTimeSheet[0].at_time);
                    let lst_time = [];
                    let total_time = 0;
                    let ep_id = id_ep;
                    let listShift = [];
                    let ep_name = user.userName;
                    let ts_date;
                    let late = 0;
                    let early = 0;
                    let num_to_calculate = 0;
                    let num_to_money = 0;
                    let num_overtime = 0;
                    // những ca ghi nhân chấm công trong ngày 
                    for (let j = 0; j < listTimeSheet.length; j++) {
                        if (!listShift.find((e) => e == listTimeSheet[j].shift_id)) {
                            listShift.push(listTimeSheet[j].shift_id);
                        }
                    };
                    let listShiftNotInCycle = [];

                    // quét trong danh sách ca ghi nhận chấm 
                    for (let j = 0; j < listShift.length; j++) {

                        let listTimeSheetOnShift = listTimeSheet.filter((e) => e.shift_id == listShift[j]);
                        // list_detail : lịch làm việc 
                        if (!list_cycle_eachshift.find((e) => (e.shift_id == listShift[j]) && (e.date.getDate() == i))) {
                            listShiftNotInCycle.push(listShift[j]);
                        } else {
                            if (listTimeSheetOnShift.length > 1) {
                                // tăng dần 
                                listTimeSheetOnShift = listTimeSheetOnShift.sort((a, b) => {
                                    return a.at_time - b.at_time;
                                });
                                let start_real = listTimeSheetOnShift[0].at_time;
                                if (listTimeSheetOnShift[0].shift.length) {
                                    let shift_data = listTimeSheetOnShift[0].shift[0];
                                    let start_time_shift_str = listTimeSheetOnShift[0].shift[0].start_time;
                                    let start_time = new Date(
                                        start_real.getFullYear(), start_real.getMonth(), start_real.getDate(),
                                        Number(start_time_shift_str.split(':')[0]) || '0',
                                        Number(start_time_shift_str.split(':')[1]) || '0',
                                        Number(start_time_shift_str.split(':')[2]) || '0',
                                    )

                                    let end_real = listTimeSheetOnShift[listTimeSheetOnShift.length - 1].at_time;
                                    let end_time_shift_str = listTimeSheetOnShift[0].shift[0].end_time;
                                    let end_time = new Date(
                                        end_real.getFullYear(), end_real.getMonth(), end_real.getDate(),
                                        Number(end_time_shift_str.split(':')[0]) || '0',
                                        Number(end_time_shift_str.split(':')[1]) || '0',
                                        Number(end_time_shift_str.split(':')[2]) || '0',
                                    );
                                    let end_time_max;
                                    if (shift_data.end_time_earliest) {
                                        let end_max_shift_str = shift_data.end_time_earliest;
                                        end_time_max = new Date(
                                            end_real.getFullYear(), end_real.getMonth(), end_real.getDate(),
                                            Number(end_max_shift_str.split(':')[0]) || '0',
                                            Number(end_max_shift_str.split(':')[1]) || '0',
                                            Number(end_max_shift_str.split(':')[2]) || '0',
                                        );
                                    } else {
                                        end_time_max = new Date(
                                            end_real.getFullYear() + 1, end_real.getMonth(), end_real.getDate()
                                        );
                                    }

                                    let start_time_min;
                                    if (shift_data.start_time_latest) {
                                        let start_min_shift_str = shift_data.start_time_latest;
                                        start_time_min = new Date(
                                            start_real.getFullYear(), start_real.getMonth(), start_real.getDate(),
                                            Number(start_min_shift_str.split(':')[0]) || '0',
                                            Number(start_min_shift_str.split(':')[1]) || '0',
                                            Number(start_min_shift_str.split(':')[2]) || '0',
                                        );
                                    } else {
                                        start_time_min = new Date(
                                            start_real.getFullYear() - 1, start_real.getMonth(), start_real.getDate()
                                        );
                                    }
                                    // tìm ra từ 2 lần chấm công nằm trong khoảng thời gian cho phép 
                                    let listTimeSheetRealOnShift = listTimeSheetOnShift.filter((e) =>
                                        (e.at_time < end_time_max) && (e.at_time > start_time_min)
                                    );

                                    if (listTimeSheetRealOnShift.length > 1) {
                                        let tempt = Math.round(Math.abs(start_real - end_real) / 3600 / 1000);
                                        total_time = total_time + tempt;

                                        if (listTimeSheetRealOnShift[0].at_time > start_time) {
                                            let tempt2 = Math.abs(listTimeSheetRealOnShift[0].at_time - start_time) / 60000;
                                            late = late + tempt2;
                                        }

                                        if (listTimeSheetRealOnShift[listTimeSheetRealOnShift.length - 1].at_time < end_time) {
                                            let tempt2 = Math.abs(listTimeSheetRealOnShift[listTimeSheetRealOnShift.length - 1].at_time - end_time / 60000);
                                            early = early + tempt2;
                                        }
                                        // if (listTimeSheetOnShift[0].at_time.getDate() == 16 && (listTimeSheetOnShift[0].shift_id == 4444)) {
                                        //     console.log(listTimeSheetOnShift, start_time, end_time, late, early);
                                        //     console.log(listTimeSheetRealOnShift[0].at_time > start_time);
                                        //     console.log(new Date(listTimeSheetRealOnShift[0].at_time) > start_time)
                                        // }
                                        if (Number(listTimeSheetOnShift[0].shift[0].num_to_money) > 0) {
                                            num_to_money = num_to_money + listTimeSheetOnShift[0].shift[0].num_to_money;
                                        } else {
                                            num_to_calculate = num_to_calculate + Number(listTimeSheetOnShift[0].shift[0].num_to_calculate);
                                        }
                                        if (listTimeSheetOnShift[0].shift[0].is_overtime) {
                                            num_overtime = num_overtime + listTimeSheetOnShift[0].shift[0].num_to_calculate;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    for (let j = 0; j < listTimeSheet.length; j++) {
                        if (!listShiftNotInCycle.find((e) => e == listTimeSheet[j].shift_id)) {
                            lst_time.push(listTimeSheet[j].at_time);
                        }
                    };
                    if (lst_time.length) {
                        ts_date = lst_time[0];
                        listDataFinal.push({
                            ep_id,
                            ep_name,
                            ts_date,
                            day_of_week,
                            total_time,
                            late,
                            early,
                            num_to_calculate,
                            num_to_money,
                            num_overtime,
                            lst_time,
                        })
                    }
                }
            };
            return listDataFinal;
        } else {
            console.log("User không tồn tại")
            return false;
        }
    } catch (error) {
        console.log('service/tinhluong/nhanvien.js take_count_real_works', error);
        return false;
    }
}