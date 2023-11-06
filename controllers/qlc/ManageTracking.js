const ManageTracking = require("../../models/Users")
const CompanyWifi = require("../../models/qlc/SettingWifi")
const Location = require("../../models/qlc/Location")
const functions = require("../../services/functions")
const Shifts = require('../../models/qlc/Shifts');

//tìm list cấu hình chấm công cty sử dụng 
exports.getlistTracking = async (req,res) =>{
    const  companyID = req.body.companyID
    const  type_timekeeping = req.body.type_timekeeping
// 1: là khuôn mặt, 2: là QR, 3: là chấm công công ty, 4: là chấm công web, 5: là PC365, 6: là giới hạn IP nhân viên, 7 là giới hạn IP công ty; 8: chấm công trên app chat365; 9: chấm công qr app chat
    if (!type_timekeeping) {
        functions.setError(res, "type_keeping not found ");
    } else {
        const list = await ManageTracking.find({companyID:companyID, type_timekeeping: type_timekeeping })
        if (!list) {
            functions.setError(res, "list of manage tracking cannot be found or does not exist");
        } else {
            functions.success(res, "Get list of manage tracking successfully", list);
        }
    }
};

exports.getTimekeepConfig = async (req, res) =>{
    try {
        const com_id = req.user.data.com_id;
        let [user, wifi, shifts] = await Promise.all([
            ManageTracking.findOne({idQLC: com_id, type: 1}),
            CompanyWifi.find({ id_com: com_id }).lean(),
            Shifts.find({ com_id: com_id }).sort({ _id: -1 })
        ])
        let locationIds = wifi.map(w => w.id_loc);
        let coordinates = await Location.find({cor_id: {$in: locationIds}});
        coordinates = coordinates.map(c => ({
            cor_id: c.cor_id.toString(),
            cor_location_name: c.cor_location_name.toString(),
            cor_lat: c.cor_lat.toString(),
            cor_long: c.cor_long.toString(),
            cor_radius: c.cor_radius.toString(),
            id_com: c.id_com.toString(),
        }));
        wifi = wifi.map(w => ({
            wifi_id: (w.id?w.id:"").toString(),
            com_id: w.id_com.toString(),
            name_wifi: w.name_wifi,
            mac_address: "",
            ip_address: w.ip_access,
            create_time: new Date(w.created_time*1000).toISOString(),
            is_default: "1",
            status: "1"
        }));
        if (!user) return functions.setError(res, "Công ty không hợp lệ!");
        const id_way = user.inForCompany ? user.inForCompany.cds.id_way_timekeeping: "";
        const type_timekeeping = user.inForCompany ? user.inForCompany.cds.type_timekeeping: "";
        const list_wifi = wifi;
        const list_coordinate = coordinates;
        const all_shift = shifts;
        const list_bluetooth = null;

        return functions.success(res, "Lấy thông tin cấu hình chấm công thành công", {config:{
            id_way,
            type_timekeeping,
            list_wifi,
            list_coordinate,
            all_shift,
            list_bluetooth,
        }});
    } catch (err) {
        console.log(err);
        return functions.setError(res, err.message)
    }
}

// exports.getToken = async (req, res) => {
//     try {
        
//     } catch (error) {
//         return functions.setError(res, err.message)
//     }
// }
