const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// dành cho ca nhiều ngày, ca gãy
const ShiftsNewSchema = new Schema({
    //Id của ca làm việc
    shiftNew_id: {
        type: Number,
        unique: true
    },
    //Id của công ty
    com_id: {
        type: Number
    },
    //Tên ca làm việc
    shift_name: {
        type: String,
    },
    // 1-ca trong ngày ; 2-ca nhiều ngày; 3-ca gãy
    type_shift: {
        type: Number,
        default: 1
    },
    // giờ linh hoạt ()
    time_flex: {
        type: String,
        default: null
    },
    // ca trong ngày, nhiều ngày
    shift_day: {
        type: {
            //Giờ vào ca
            start_time: {
                type: String,
                default: null
            },
            //Giớ check in sớm nhất
            start_time_latest: {
                type: String,
                default: null
            },
            //Giờ hết ca
            end_time: {
                type: String,
                default: null
            },
            //Giớ check out muộn nhất
            end_time_earliest: {
                type: String,
                default: null
            },
            num_day: {
                type: Number,
                default: 1
            }
        },
        default: null
    },
    // ca gãy
    shift_broken: [
        {
            //Giờ vào ca
            start_time: {
                type: String,
                default: null
            },
            //Giớ check in sớm nhất
            start_time_latest: {
                type: String,
                default: null
            },
            //Giờ hết ca
            end_time: {
                type: String,
                default: null
            },
            //Giớ check out muộn nhất
            end_time_earliest: {
                type: String,
                default: null
            },
            _id: false
        }
    ],
    //Hình thức tính công
    // 1:tính công theo ca
    // 2 :tính công theo tiền
    // 3 :tính công theo số giờ
    type_timeSheet: {
        type: Number,
        default: 1
    },
    //Số công theo ca 
    num_to_calculate: {
        type: Number,
        default: 1
    },
    //Số tiền theo ca
    num_to_money: {
        type: Number,
        default: 0
    },
    // số giờ theo ca
    num_to_hours: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        default: 1
    },
    time_zone: {
        type: String,
        default: 'Asia/Ho_Chi_Minh'
    },
    created_time: {
        type: Date,
        default: 0
    },
    update_time: {
        type: Date,
        default: 0
    }
}, {
    collection: 'QLC_ShiftsNew',
    versionKey: false
})

module.exports = mongoose.model("QLC_ShiftsNew", ShiftsNewSchema);