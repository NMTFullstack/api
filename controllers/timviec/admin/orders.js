const service = require("../../../services/timviec365/orders");
const Users = require("../../../models/Users");
const AdminUser = require('../../../models/Timviec365/Admin/AdminUser');
const PriceList = require("../../../models/Timviec365/PriceList/PriceList");
const Order = require("../../../models/Timviec365/Order");
const OrderDetails = require("../../../models/Timviec365/OrderDetails");
const SaveExchangePointOrder = require("../../../models/Timviec365/UserOnSite/ManageHistory/SaveExchangePointOrder");
const NewTV365 = require("../../../models/Timviec365/UserOnSite/Company/New");
const PointCompany = require("../../../models/Timviec365/UserOnSite/Company/ManagerPoint/PointCompany");
const PointUsed = require("../../../models/Timviec365/UserOnSite/Company/ManagerPoint/PointUsed");

// xử lý chuyên viên hủy đơn hàng
const handleSupporterCancelOrder = async (order_id)=>{
    try{
        let checkOrder = await Order.findOne({id: order_id});
        if(checkOrder){
            let info_admin = await AdminUser.findOne({adm_bophan: checkOrder.admin_id});
            let nameAdmin = '',
                sdtAdmin = '',
                zaloAdmin = '',
                emailAdmin = '';
            if(info_admin && info_admin.length){
                nameAdmin = info_admin.adm_name;
                sdtAdmin = info_admin.adm_phone;
                if (info_admin.adm_mobile != '' && info_admin.adm_mobile != null) {
                    zaloAdmin = info_admin.adm_mobile;
                }
                emailAdmin = info_admin.adm_email;
            }
            await Order.updateOne({id: order_id}, {
                $set: {
                    status: 4
                }
            })
            let message = `Thông báo \n Đơn hàng với mã ${checkOrder.code_order} đã bị hủy bởi chuyên viên chăm sóc `+nameAdmin;
            service.sendMessageToGroupOrder(message);
            if (checkOrder.type_user == 1) {
                let infoCus = await Users.findOne({idTimViec365: checkOrder.id_user});
                let messageKH = `Thông báo \n Đơn hàng với mã ${checkOrder.code_order} đã bị hủy bởi chuyên viên chăm sóc `+nameAdmin+` \n - Tên chuyên viên: ${nameAdmin} \n - Số điện thoại: ${sdtAdmin} \n - Zalo: ${zaloAdmin} \n - Email: ${emailAdmin} - Hotline: 1900633682 - Nhấn phím 1 \n Hãy liên hệ để được hỗ trợ.`;
                // hoàn lại điểm khi áp dụng điểm khuyến mại
                if (checkOrder.discount_fee > 0) {
                    let time = new Date().getTime()/1000;
                    let point_promotion = checkOrder.discount_fee/1000;
                    messageKH = `Thông báo \n Đơn hàng với mã ${checkOrder.code_order} đã bị hủy bởi chuyên viên chăm sóc `+nameAdmin+` \n Bạn được hoàn lại ${point_promotion} điểm khuyến mại vào điểm thưởng mua hàng \n - Tên chuyên viên: ${nameAdmin} \n - Số điện thoại: ${sdtAdmin} \n - Zalo: ${zaloAdmin} \n - Email: ${emailAdmin} - Hotline: 1900633682 - Nhấn phím 1 \n Hãy liên hệ để được hỗ trợ.`;
                    await (new SaveExchangePointOrder({
                        userId: checkOrder.id_user,
                        userType: checkOrder.type_user,
                        order_id: order_id,
                        point: point_promotion,
                        type_point: 1,
                        time: time,
                    })).save()
                }
                service.sendMessageToIdChat(messageKH, infoCus._id);
            }
            return true;
       } else{
           return false;
       }
    } catch(e){
        console.log('handleSupporterCancelOrder',e);
        return false;
    }
}

// api chuyên viên hủy đơn hàng
exports.supporterCancelOrder = async (req, res, next) => {
    try{
        if(req.body.order_id){ 
            const order_id = Number(req.body.order_id);
            await handleSupporterCancelOrder(order_id);
            return functions.success(res, "Thành công", {data: {result: true}})
        } else {
            return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);
        }
    } catch(error) {
        return functions.setError(res, "Đã có lỗi xảy ra", 400);
    }
}

// xử lý chuyên viên duyệt đơn hàng
const handleSupporterAcceptOrder = async (order_id,money_received,money_bonus,money_real_received,name_bank,account_bank,account_holder,content_bank)=>{
    try{
        let checkOrder = await Order.findOne({id: order_id});
        if(checkOrder){
            let time = new Date().getTime()/1000;
            await Order.updateOne({id: order_id},{
                $set: {
                    admin_accept: 1,
                    status: 0,
                    accept_time_1: time,
                    money_received: money_received,
                    money_bonus: money_bonus,
                    money_real_received: money_real_received,
                    name_bank: name_bank,
                    account_bank: account_bank,
                    account_holder: account_holder,
                    content_bank: content_bank,
                }
            })
            let info_admin = await AdminUser.findOne({adm_bophan: checkOrder.admin_id});
            let nameAdmin = '',
                sdtAdmin = '',
                zaloAdmin = '',
                emailAdmin = '';
            if(info_admin && info_admin.length){
                nameAdmin = info_admin.adm_name;
                sdtAdmin = info_admin.adm_phone;
                if (info_admin.adm_mobile != '' && info_admin.adm_mobile != null) {
                    zaloAdmin = info_admin.adm_mobile;
                }
                emailAdmin = info_admin.adm_email;
            }
            let message = `Thông báo \n Đơn hàng với mã ${checkOrder.code_order} đã được duyệt bởi chuyên viên chăm sóc `+nameAdmin;
            service.sendMessageToGroupOrder(message);
            if (checkOrder.type_user == 1) {
                let messageKH = `Thông báo \n Đơn hàng với mã ${checkOrder.code_order} đã được duyệt bởi chuyên viên chăm sóc `+nameAdmin+` \n - Tên chuyên viên: ${nameAdmin} \n - Số điện thoại: ${sdtAdmin} \n - Zalo: ${zaloAdmin} \n - Email: ${emailAdmin} \n - Hotline: 1900633682 - Nhấn phím 1 \n Hãy chờ để được tổng đài hỗ trợ hoàn thành đơn hàng.`;
                let infoCus = await Users.findOne({idTimViec365: checkOrder.id_user});
                service.sendMessageToIdChat(messageKH, infoCus._id);
            }
            return true;
       } else {
           return false;
       }
    } catch(e){
        console.log('handleSupporterAcceptOrder',e);
        return false;
    }
}

// api chuyên viên duyệt đơn hàng = gửi đề xuất đơn hàng đến tổng đài
exports.supporterAcceptOrder = async (req, res, next) => {
    try{
        if(req.body.order_id){ 
            const order_id = Number(req.body.order_id); 
            const money_received = Number(req.body.money_received); 
            const money_bonus = Number(req.body.money_bonus); 
            const money_real_received = Number(req.body.money_real_received); 
            const name_bank = String(req.body.name_bank); // tên ngân hàng
            const account_bank = String(req.body.account_bank); // số tài khoản
            const account_holder = String(req.body.account_holder); // chủ tài khoản
            const content_bank = String(req.body.content_bank); // nội dung chuyển khoản
            await handleSupporterAcceptOrder(order_id,money_received,money_bonus,money_real_received,name_bank,account_bank,account_holder,content_bank);
            return functions.success(res, "Thành công", {data: {result: true}})
        } else {
            return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);
        }
    }
    catch(e){
        return functions.setError(res, "Đã có lỗi xảy ra", 400);
    }
}

// xử lý trực hủy đơn hàng
const handleAdminCancelOrder = async (order_id,admin_id)=>{
    try{
        let checkAdmin = await AdminUser.findOne({adm_id: admin_id});
        let checkOrder = await Order.findOne({id: order_id});
        if(checkAdmin && checkOrder){
            if (admin_id == 4 || admin_id == 32) {
                await Order.updateOne({id: order_id}, {
                    $set: {
                        status: 4,
                        admin_accept: 3
                    }
                })
                let message = `Thông báo \n Đơn hàng với mã ${checkOrder.code_order} đã bị từ chối bởi tổng đài hỗ trợ.`;
                service.sendMessageToGroupOrder(message);
                if (checkOrder.type_user == 1) {
                    let infoCus = await Users.findOne({idTimViec365: checkOrder.id_user});
                    let info_admin = await AdminUser.findOne({adm_bophan: checkOrder.admin_id});

                    let messageKH = `Thông báo \n 
                    Đơn hàng với mã ${checkOrder.code_order} đã bị từ chối bởi tổng đài hỗ trợ \n 
                    - Tên chuyên viên: ${info_admin.adm_name} \n 
                    - Số điện thoại: ${info_admin.adm_phone} \n 
                    - Zalo: ${info_admin.adm_mobile} \n 
                    - Email: ${info_admin.adm_email} \n 
                    - Hotline: 1900633682 - Nhấn phím 1 \n 
                    Hãy liên hệ để được hỗ trợ.`;

                    if (checkOrder.discount_fee > 0) {
                        let time = new Date().getTime()/1000;
                        let point_promotion = checkOrder.discount_fee/1000;

                        messageKH = `Thông báo \n 
                        Đơn hàng với mã ${checkOrder.code_order} đã bị từ chối bởi tổng đài hỗ trợ \n 
                        Bạn được hoàn lại ${point_promotion} điểm khuyến mại vào điểm thưởng mua hàng \n 
                        - Tên chuyên viên: ${info_admin.adm_name} \n 
                        - Số điện thoại: ${info_admin.adm_phone} \n 
                        - Zalo: ${info_admin.adm_mobile} \n 
                        - Email: ${info_admin.adm_email} \n 
                        - Hotline: 1900633682 
                        - Nhấn phím 1 \n 
                        Hãy liên hệ để được hỗ trợ.`;

                        await (new SaveExchangePointOrder({
                            userId: checkOrder.id_user,
                            userType: checkOrder.type_user,
                            order_id: order_id,
                            point: point_promotion,
                            type_point: 1,
                            time: time,
                        })).save()
                    }
                    service.sendMessageToIdChat(messageKH, infoCus._id);
                }
                let infoSupporter = await AdminUser.findOne({adm_bophan: checkOrder.admin_id});
                if (infoSupporter) {
                    service.sendMessageToIdQlc(message, infoSupporter.emp_id);
                }
            }
            return true;
        } else {
            return false;
        }
    } catch(e){
        console.log('handleAdminCancelOrder',e);
        return false;
    }
}

// api trực hủy đơn hàng
exports.adminCancelOrder = async (req, res, next) => {
    try{
        if(req.body.order_id && req.body.admin_id){ 
            const order_id = Number(req.body.order_id); 
            const admin_id = Number(req.body.admin_id); 

            await handleAdminCancelOrder(order_id,admin_id);
            return functions.success(res, "Thành công", {data: {result: true}})
        } else {
            return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);
        }
    }
    catch(e){
        return functions.setError(res, "Đã có lỗi xảy ra", 400);
    }
}

function uniqueArray(a, fn) {
    if (a.length === 0 || a.length === 1) {
        return a;
    }
    if (!fn) {
        return a;
    }
    for (let i = 0; i < a.length; i++) {
        for (let j = i + 1; j < a.length; j++) {
            if (fn(a[i], a[j])) {
                a.splice(i, 1);
            }
        }
    }
    return a;
}

// xử lý trực duyệt đơn hàng
const handleAdminAcceptOrder = async (order_id,admin_id)=>{
    try{
        let checkAdmin = await AdminUser.findOne({adm_id: admin_id});
        let checkOrder = await Order.findOne({id: order_id});
        if(checkAdmin && checkOrder){
            if (admin_id == 4 || admin_id == 32) {
                // gửi thông báo cho NTD, chuyên viên và nhóm đơn hàng
                let time = new Date().getTime()/1000;
                await Order.updateOne({id: order_id}, {
                    $set: {
                        status: 1,
                        admin_accept: 2,
                        accept_time_2: 2,
                    }
                })
                let message = `Thông báo \n Đơn hàng với mã ${checkOrder.code_order} đã được duyệt bởi tổng đài hỗ trợ, đơn hàng chuyển sang trạng thái đang hoạt động.`;
                service.sendMessageToGroupOrder(message);
                if (checkOrder.type_user == 1) {
                    let infoCus = await Users.findOne({idTimViec365: checkOrder.id_user});
                    let info_admin = await AdminUser.findOne({adm_bophan: checkOrder.admin_id});

                    let messageKH = `Thông báo \n 
                    Đơn hàng với mã ${checkOrder[0].code_order} đã được duyệt bởi tổng đài hỗ trợ \n 
                    - Tên chuyên viên: ${info_admin[0].adm_name} \n 
                    - Số điện thoại: ${info_admin[0].adm_phone} \n 
                    - Zalo: ${info_admin[0].adm_mobile} \n 
                    - Email: ${info_admin[0].adm_email} \n 
                    - Hotline: 1900633682 
                    - Nhấn phím 1 \n 
                    Hãy liên hệ để được hỗ trợ.`;

                    service.sendMessageToIdChat(messageKH, infoCus._id);
                }
                let infoSupporter = await AdminUser.findOne({adm_bophan: checkOrder.admin_id});
                if (infoSupporter) {
                    service.sendMessageToIdQlc(message, infoSupporter.emp_id);
                }
                // cộng điểm mua hàng
                let money_bonus_order = ((checkOrder[0].money_real_received*5)/100)/1000;

                await (new SaveExchangePointOrder({
                    userId: checkOrder.id_user,
                    userType: checkOrder.type_user,
                    order_id: order_id,
                    point: money_bonus_order,
                    unit_point: 0,
                    time: time,
                })).save();

                // KHI TRỰC DUYỆT SẼ TỰ ĐỘNG THỰC THI CÁC GÓI DỊCH VỤ MÀ NTD ĐÃ MUA
                let detail_order = await OrderDetails.aggregate([
                    {$match: {order_id: order_id, use_product: 0}},
                    {$lookup:{
                        from: "PriceList",
                        localField: "product_id",
                        foreignField: "bg_id",
                        as: "listing"
                    }},
                    {$unwind: "$listing"},
                    {$project: {
                        id: 1,
                        product_id: 1,
                        product_type: 1,
                        new_id: 1,
                        count_product: 1,
                        bg_time: "$listing.bg_time",
                        bg_hoso: "$listing.bg_hoso",
                        bg_gift_hoso: "$listing.bg_gift_hoso",
                        bg_time_gift_hoso: "$listing.bg_time_gift_hoso",
                    }}
                ])
                let arr_detail_service = [];
                if (detail_order && detail_order.length) {
                    for(let i = 0; i < detail_order.length; i++){
                        let new_id = detail_order[i].new_id,
                            product_type = detail_order[i].product_type,
                            arr_detail_service_item = [],
                            so_tuan = 0,
                            so_hoso = 0,
                            gift_hoso = 0,
                            time_gift_hoso = 0;
                        for(let j = 0; j < detail_order.length; j++){
                            let new_id_ = detail_order[j].new_id,
                                product_type_ = detail_order[j].product_type;

                            if (new_id == new_id_ && product_type == product_type_) {
                                so_tuan += parseInt(detail_order[j].bg_time)*parseInt(detail_order[j].count_product);
                                so_hoso += parseInt(detail_order[j].bg_hoso)*parseInt(detail_order[j].count_product);
                                gift_hoso += parseInt(detail_order[j].bg_gift_hoso)*parseInt(detail_order[j].count_product);
                                time_gift_hoso += parseInt(detail_order[j].bg_time_gift_hoso)*parseInt(detail_order[j].count_product);
                                arr_detail_service_item.push(detail_order[j]);
                            }
                        }
                        arr_detail_service.push({
                            product_type: product_type,
                            new_id: new_id,
                            so_tuan: so_tuan,
                            so_hoso: so_hoso,
                            gift_hoso: gift_hoso,
                            time_gift_hoso: time_gift_hoso
                        });
                    }
                }
                // lọc các tin và loại dịch vụ trùng nhau trong mảng
                let arr_service = uniqueArray(arr_detail_service, (a, b) => (a.product_type === b.product_type) & (a.new_id === b.new_id));
                // thực thi ghim tin và cộng điểm cho từng tin
                let total_hoso = 0,
                    tuan_hoso = 0,
                    total_gift_hoso = 0,
                    total_time_gift_hoso = 0;
                for(let s = 0; s < arr_service.length; s++){
                    let _service = arr_service[s];
                    let datetime = new Date();
                    let time_han = (datetime.setDate(datetime.getDate() + (parseInt(_service.so_tuan) * 7)))/1000;
                    // ghim trang chủ
                    if (parseInt(_service.so_tuan) > 0) {
                        if (_service.product_type == 1 || _service.product_type == 3 || _service.product_type == 4 || _service.product_type == 5) {
                            let data;
                            // box hấp dẫn
                            if (_service.product_type == 1 || _service.product_type == 3) {
                                data = {
                                    new_order: 1,
                                    new_hot: 1,
                                    new_gap: 0,
                                    new_cao: 0,
                                };
                            }
                            // box thương hiệu 
                            else if(_service.product_type == 4) {
                                data = {
                                    new_order: 1,
                                    new_hot: 0,
                                    new_gap: 1,
                                    new_cao: 0,
                                };
                            }
                            // box tuyển gấp
                            else if(_service.product_type == 5) {
                                data = {
                                    new_order: 1,
                                    new_hot: 0,
                                    new_gap: 0,
                                    new_cao: 1,
                                };
                            }
                            await NewTV365.updateOne({new_id: _service.new_id}, {
                                $set: {...data, new_vip_time: time_han}
                            })
                        }
                        // ghim trang ngành
                        if (_service.product_type == 6) {
                            await NewTV365.updateOne({new_id: _service.new_id}, {
                                $set: {new_nganh: 1, new_cate_time: time_han}
                            })
                        }
                    }
                    // cộng điểm lọc hồ sơ
                    if (parseInt(_service.so_hoso) > 0) {
                        if (_service.product_type == 2 || _service.product_type == 3) {
                            total_hoso += parseInt(_service.so_hoso);
                            tuan_hoso += _service.so_tuan;
                        }
                    }
                    // cộng điểm hồ sơ đc tặng kèm
                    if (parseInt(service.gift_hoso) > 0) {
                        total_gift_hoso += parseInt(service.gift_hoso);
                        total_time_gift_hoso += parseInt(service.time_gift_hoso);
                    }
                };
                total_hoso = total_hoso + total_gift_hoso;
                tuan_hoso = tuan_hoso + total_time_gift_hoso;
                if (total_hoso > 0) {
                    // check bản ghi điểm của NTD ở bảng tbl_point_company
                    let point_ntd = await PointCompany.findOne({usc_id: checkOrder.id_user})
                    let datetime = new Date();
                    let time_han_hoso = (datetime.setDate(datetime.getDate() + (parseInt(tuan_hoso) * 7)))/1000;
                    let point_chenh;
                    if (point_ntd) {
                        total_hoso = parseInt(point_ntd.point_usc) + total_hoso;
                        await PointCompany.updateOne({usc_id: checkOrder.id_user},{
                            $set: {
                                point_usc: total_hoso,
                                ngay_reset_diem_ve_0: time_han_hoso,
                            }
                        })
                        point_chenh = parseInt(total_hoso) - parseInt(point_ntd[0].point_usc);
                    } else {
                        await (new PointCompany({
                            usc_id: checkOrder.id_user,
                            point_usc: total_hoso,
                            ngay_reset_diem_ve_0: time_han_hoso
                        })).save()
                        point_chenh = parseInt(total_hoso);
                    }
                    await (new PointUsed({
                        usc_id: checkOrder.id_user,
                        point: point_chenh,
                        type: 1,
                        used_day: time,
                    })).save();
                }
            }
            return true;
        } else{
            return false;
        }
    } catch(e){
        console.log('handleAdminAcceptOrder',e);
        return false;
    }
}

// api trực duyệt đơn hàng
exports.adminAcceptOrder = async (req, res, next) => {
    try{
        if(req.body.order_id && req.body.admin_id){ 
            const order_id = Number(req.body.order_id); 
            const admin_id = Number(req.body.admin_id); 
            await handleAdminAcceptOrder(order_id,admin_id);
            return functions.success(res, "Thành công", {data: {result: true}})
        }
        return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);
    } catch(e) {
        return functions.setError(res, "Đã có lỗi xảy ra", 400);
    }
}

// hàm xử lý đổi điểm thưởng mua hàng. và khi dùng điểm đã đổi mua hàng
const handleExchangePointOrder = async (userId, userType, point) =>{
    try{
        let checkUser = await service.userExists(userId,userType);
        if(checkUser && point > 0){
            let time = new Date().getTime()/1000;
            let exchange_point = await SaveExchangePointOrder.find({
                userId: userId,
                userType: userType,
            }).sort({id: -1});
            if (exchange_point && exchange_point.length) {
                let point_plus_order = 0;
                let point_minus_order = 0;
                for(let i = 0; i < exchange_point.length; i++){
                    if (exchange_point[i].unit_point == 0) {
                        point_plus_order += exchange_point[i].point;
                    } else {
                        point_minus_order += exchange_point[i].point;
                    }
                }
                let total_point_order = point_plus_order - point_minus_order;
                if (total_point_order >= 100 && point <= total_point_order) {
                    await (new SaveExchangePointOrder({
                        userId: userId,
                        userType: userType,
                        order_id: 0,
                        point: point,
                        unit_point: 1,
                        is_used: 0,
                        time: time,
                    })).save();
                }
            }
        }
        return true;
    } catch(e){
        console.log(e);
        return false;
    }
}

// api đổi điểm thưởng mua hàng. và khi dùng điểm đã đổi mua hàng
exports.exchangePointOrder = async (req, res, next) => {
    try{
        if(req.body.userId && req.body.point){
            const userId = Number(req.body.userId),
                  userType = Number(req.body.userType) || 0,
                  point = Number(req.body.point);

            await handleExchangePointOrder(userId, userType, point);
            return functions.success(res, "Thành công", {data: {result: true}})
        } else {
            return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);
        }
    } catch(e){
        return functions.setError(res, "Đã có lỗi xảy ra", 400);
    }
}


// hàm xử lý admin hủy duyệt giấy phép kinh doanh NTD
const handleAcceptCancelGiaykdNtd = async (usc_id, usc_active_license) =>{
    try{
        let checkUser = await service.userExists(usc_id,1);
        if(checkUser){
            await Users.updateOne({usc_id: usc_id}, {
                $set: {
                    usc_active_license: usc_active_license
                }
            })
        }
        return true;
    } catch(e){
        console.log(e);
        return false;
    }
}

// api admin hủy duyệt giấy phép kinh doanh NTD
exports.acceptCancelGiaykdNtd = async (req, res, next) => {
    try{
        if(req.body.usc_id && req.body.usc_active_license){
            const usc_id = Number(req.body.usc_id),
                  usc_active_license = Number(req.body.usc_active_license);

            await handleAcceptCancelGiaykdNtd(usc_id, usc_active_license);
            return functions.success(res, "Thành công", {data: {result: true}})
        } else {
            return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);
        }
    } catch(e) {
        return functions.setError(res, "Đã có lỗi xảy ra", 400);
    }
}

// api cập nhật trạng thái khi user login app chat và winform chat = đã tải app chat
exports.updateStatusDowloadChat365 = async (req, res, next) => {
    try{
        if(req.body.chat365_id){
            const chat365_id = Number(req.body.chat365_id),
                  status_dowload_appchat = Number(req.body.status_dowload_appchat) || 0,
                  status_dowload_wfchat = Number(req.body.status_dowload_wfchat) || 0;

            let info_user = await Users.findOne({_id: chat365_id});
            if (info_user) {
                let set = {};
                if (status_dowload_appchat > 0 && info_user.status_dowload_appchat <= 0) {
                    set = {"inForCompany.timviec365.status_dowload_appchat": 1};
                } 
                if (status_dowload_wfchat > 0 && info_user.status_dowload_wfchat <= 0) {
                    set = {"inForCompany.timviec365.status_dowload_wfchat": 1};
                }
                if (Object.keys(set).length != 0) {
                    await Users.updateOne({_id: info_user.usc_id}, {
                        $set: set
                    })
                }
                return functions.success(res, "Thành công", {data: {result: true}})
            } else {
                return functions.setError(res, "Không tìm thấy thông tin tài khoản", 400);
            }
        } else {
            return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);
        }
    } catch(e) {
        return functions.setError(res, "Đã có lỗi xảy ra", 400);
    }
}

// thực thi gói dịch vụ đã mua
const handlePostNewHandleService = async (newId, orderDetail) =>{
    try{
        let time = new Date().getTime()/1000;
        let info_new = await NewTV365.findOne({new_id: newId});
        if (info_new) {
            let detail_order = await OrderDetails.aggregate([
                {$match: {order_id: orderDetail, use_product: 0}},
                {$lookup:{
                    from: "PriceList",
                    localField: "product_id",
                    foreignField: "bg_id",
                    as: "listing"
                }},
                {$unwind: "$listing"},
                {$project: {
                    id: 1,
                    product_id: 1,
                    product_type: 1,
                    new_id: 1,
                    count_product: 1,
                    bg_time: "$listing.bg_time",
                    bg_hoso: "$listing.bg_hoso",
                    bg_gift_hoso: "$listing.bg_gift_hoso",
                    bg_time_gift_hoso: "$listing.bg_time_gift_hoso",
                }}
            ])
            if (detail_order) {
                let so_tuan = parseInt(detail_order.bg_time)*parseInt(detail_order.count_product);
                let datetime = new Date();
                let time_han = (datetime.setDate(datetime.getDate() + (so_tuan * 7)))/1000;
                if (so_tuan > 0) {
                    if (detail_order.product_type == 1 || detail_order.product_type == 3 || detail_order.product_type == 4 || detail_order.product_type == 5) {
                        let data;
                        // box hấp dẫn
                        if (detail_order.product_type == 1 || detail_order.product_type == 3) {
                            data = {
                                new_order: 1,
                                new_hot: 1,
                                new_gap: 0,
                                new_cao: 0,
                            };
                        }
                        // box thương hiệu 
                        else if(detail_order.product_type == 4) {
                            data = {
                                new_order: 1,
                                new_hot: 0,
                                new_gap: 1,
                                new_cao: 0,
                            };
                        }
                        // box tuyển gấp
                        else if(detail_order.product_type == 5) {
                            data = {
                                new_order: 1,
                                new_hot: 0,
                                new_gap: 0,
                                new_cao: 1,
                            };
                        }
                        await NewTV365.updateOne({new_id: _service.new_id}, {
                                    $set: {...data, new_vip_time: time_han}
                        })
                    }
                    // ghim trang ngành
                    if (detail_order.product_type == 6) {
                        await NewTV365.updateOne({new_id: _service.new_id}, {
                                $set: {new_nganh: 1, new_cate_time: time_han}
                        })
                    }
                }
                let total_hoso = 0,
                    tuan_hoso = 0;
                if (detail_order.product_type == 2 || detail_order.product_type == 3) {
                    total_hoso += parseInt(detail_order.bg_hoso)*parseInt(detail_order.count_product);
                    tuan_hoso += so_tuan;
                }
                let total_gift_hoso = parseInt(detail_order.bg_gift_hoso)*parseInt(detail_order.count_product);
                let total_time_gift_hoso = parseInt(detail_order.bg_time_gift_hoso)*parseInt(detail_order.count_product);
                total_hoso = total_hoso + total_gift_hoso;
                tuan_hoso = tuan_hoso + total_time_gift_hoso;

                if (total_hoso > 0) {
                    // check bản ghi điểm của NTD ở bảng tbl_point_company
                    let point_ntd = await PointCompany.findOne({usc_id: checkOrder.id_user})
                    let datetime = new Date();
                    let time_han_hoso = (datetime.setDate(datetime.getDate() + (parseInt(tuan_hoso) * 7)))/1000;
                    let point_chenh;
                    if (point_ntd) {
                        total_hoso = parseInt(point_ntd.point_usc) + total_hoso;
                        await PointCompany.updateOne({usc_id: checkOrder.id_user},{
                            $set: {
                                point_usc: total_hoso,
                                ngay_reset_diem_ve_0: time_han_hoso,
                            }
                        })
                        point_chenh = parseInt(total_hoso) - parseInt(point_ntd[0].point_usc);
                    } else {
                        await (new PointCompany({
                            usc_id: checkOrder.id_user,
                            point_usc: total_hoso,
                            ngay_reset_diem_ve_0: time_han_hoso
                        })).save()
                        point_chenh = parseInt(total_hoso);
                    }
                    await (new PointUsed({
                        usc_id: checkOrder.id_user,
                        point: point_chenh,
                        type: 1,
                        used_day: time,
                    })).save();
                }
                await OrderDetails.updateOne({id: orderDetail}, {
                    $set: {
                        use_product: 0,
                        new_id: newId
                    }
                })
                let count_order_detail = await OrderDetails.find({
                    order_id: detail_order.order_id,
                    use_product: 1
                }).count();
                if (count_order_detail == 0) {
                    await Order.updateOne({id: detail_order.order_id}, {
                        $set: {
                            use_order: 0
                        }
                    })
                }
                return true;
            } else {
                console.log("Không tìm thấy gói dịch vụ đã mua");
                return false;
            }
        } else {
            console.log("Không tìm thấy tin tuyển dụng");
            return false;
        }
    } catch(e){
        console.log(e);
        return false;
    }
}
exports.postNewHandleService = async (req, res) =>{
    try{
        if(req.body.newId && req.body.orderDetail){
            const newId = Number(req.body.newId);
            const orderDetail = Number(req.body.orderDetail);

            await handlePostNewHandleService(newId, orderDetail);
                return functions.success(res, "Thành công", {data: {result: true}})
        } else {
            return functions.setError(res, "Không tìm thấy thông tin tài khoản", 400);
        }
   } catch(e) {
        console.log('error PostNewHandleService', e);
        return functions.setError(res, "Thông tin truyền lên không đầy đủ", 400);
   }
}