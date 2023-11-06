const axios = require("axios");
const User = require("../../models/Users")
const AdminUser = require("../../models/Timviec365/Admin/AdminUser")

exports.random = (from, to) => {
    return Math.floor(Math.random()*(to-from)) + from;
}

// danh sách các loại chi tiết dịch vụ crm
const listServiceCRM = exports.listServiceCRM = (id)=>{
    let arr = [
        {
            time: 2, // thời lượng(1:tháng, 2: tuần)
            city: 0, // tỉnh thành(0: chính, 1: khác)
            cate: 0, // ngành nghề(0: chính, 1: khác)
            price: 5000000 // Đơn giá
        },
        {
            time: 1,
            city: 0,
            cate: 0,
            price: 15000000
        },
        {
            time: 2,
            city: 1,
            cate: 0,
            price: 2000000
        },
        {
            time: 1,
            city: 1,
            cate: 0,
            price: 6000000
        },
        {
            time: 2,
            city: 0,
            cate: 1,
            price: 3500000
        },
        {
            time: 1,
            city: 0,
            cate: 1,
            price: 10500000
        },
        {
            time: 2,
            city: 1,
            cate: 1,
            price: 1400000
        },
        {
            time: 1,
            city: 1,
            cate: 1,
            price: 4200000
        }
    ];
    if (id > 0 && id <= 8) {
        return arr[id-1];
    } else {
        return arr;
    }
}


// Gửi thông báo vào nhóm thanh toán đơn hàng
const sendMessageToGroupOrder = exports.sendMessageToGroupOrder = async (message, id_order = null) =>{
    try{
        let dataGroup;
        // if (id_order != null) {
        //     dataGroup = { 
        //         ConversationID: '806102', // id nhóm thanh toán đơn hàng
        //         SenderID: '1192',
        //         MessageType: 'OfferReceive',
        //         Message: message,
        //         Link: 'https://timviec365.vn/admin/modules/orders/detail_of_supporter.php?id='+id_order
        //     };
        // } else {
        //     dataGroup = { 
        //         ConversationID: '806102', // id nhóm thanh toán đơn hàng
        //         SenderID: '1192',
        //         MessageType: 'text',
        //         Message: message
        //     };
        // }
        if (id_order != null) {
            dataGroup = { 
                ContactId: '806102', // id nhóm thanh toán đơn hàng
                SenderID: '187413',
                MessageType: 'OfferReceive',
                Message: message,
                Link: 'https://timviec365.vn/admin/modules/orders/detail_of_supporter.php?id='+id_order
            };
        } else {
            dataGroup = { 
                ContactId: '806102', // id nhóm thanh toán đơn hàng
                SenderID: '187413',
                MessageType: 'text',
                Message: message
            };
        }
        const sendGroup = await axios.post('http://210.245.108.202:9000/api/message/SendMessage', dataGroup);
        return true;
    }
    catch(e){
       console.log('error SendMessageToGroupOrder', e);
       return false; 
    }
}   


// Gửi tin nhắn từ tài khoản công ty Hưng hà đến người nhận là id quản lý chung
const sendMessageToIdQlc = exports.sendMessageToIdQlc = async (message, ContactId, id_order = null) =>{
    try{
        let data;
        // if (id_order != null) {
        //     data = { 
        //         ContactId: ContactId,
        //         SenderID: '1192',
        //         MessageType: 'OfferReceive',
        //         Message: message,
        //         Link: 'https://timviec365.vn/admin/modules/orders/detail_of_supporter.php?id='+id_order
        //     };
        // } else {
        //     data = { 
        //         ContactId: ContactId,
        //         SenderID: '1192',
        //         MessageType: 'text',
        //         Message: message
        //     };
        // }
        if (id_order != null) {
            data = { 
                ContactId: '1396134',
                SenderID: '187413',
                MessageType: 'OfferReceive',
                Message: message,
                Link: 'https://timviec365.vn/admin/modules/orders/detail_of_supporter.php?id='+id_order
            };
        } else {
            data = { 
                ContactId: '1396134',
                SenderID: '187413',
                MessageType: 'text',
                Message: message
            };
        }
        const send = await axios.post('http://210.245.108.202:9000/api/message/SendMessage_v3', data);
        return true;
    }
    catch(e){
       console.log('error sendMessageToIdQlc', e);
       return false; 
    }
}

// gửi thông tin đơn hàng vào chat365 cho chuyên viên và nhóm thanh toán hóa đơn
exports.sendMessageToSupporter = async (adm_qlc, code_order, name, phone, adm_name, final_price, id_order) =>{
    try{
         let message = `Thông tin đơn hàng \n
             - Tên khách hàng: ${name} \n - Số điện thoại: ${phone} \n - Chuyên viên chăm sóc: ${adm_name} \n
             - Mã đơn hàng: ${code_order} \n - Tổng tiền thanh toán: ${final_price.toLocaleString('vi-VN')} vnđ`;
         sendMessageToIdQlc(message, adm_qlc, id_order);
         sendMessageToGroupOrder(message, id_order);
         return true;
    }
    catch(e){
        console.log('error sendMessageToSupporter');
        return false; 
    }
 }

 
// Gửi tin nhắn từ tài khoản công ty Hưng hà đến người nhận là idchat365
const sendMessageToIdChat = exports.sendMessageToIdChat = async (message, ContactId) =>{
    try{
        // let data = { 
        //     UserID: ContactId,
        //     SenderID: '1192',
        //     MessageType: 'text',
        //     Message: message
        // };
        let data = { 
            UserID: '187413',
            SenderID: '1396134',
            MessageType: 'text',
            Message: message
        };
        const send = await axios.post('http://210.245.108.202:9000/api/message/SendMessageIdChat', data);
        return true;
    }
    catch(e){
       console.log('error SendMessageToIdChat', e);
       return false; 
    }
}
 

exports.renderServiceDetailCRM = (id_service, type_service)=>{
    let info = listServiceCRM(id_service);
    let time_service_crm = '1 ' + ((info.time==1) ? 'THÁNG' : 'TUẦN');
    let name_service_crm = ((info.cate==0) ? 'NGÀNH NGHỀ CHÍNH' : 'NGÀNH NGHỀ KHÁC') + ' + ' + ((info.city==0) ? 'HÀ NỘI/HỒ CHÍ MINH' : 'TỈNH THÀNH KHÁC');
    let info_service_crm = {
        bg_id: id_service,
        bg_tuan: time_service_crm + ' - ' + name_service_crm,
        bg_gia: info.price,
        bg_chiet_khau: 0,
        bg_thanh_tien: info.price,
        bg_vat: info.price + ((info.price*10)/100),
        bg_type: type_service
    };
    return info_service_crm;
}

exports.userExists = async (usc_id, type)=>{
    try {
        let user = await User.findOne({idTimViec365: usc_id, type});
        if (!user) return false;
        return true;
    }
    catch (error) {
       return false;
    }
}

exports.adminExists = async (id)=>{
    try{
        let admin = await AdminUser.findOne({adm_bophan: id});
        if (admin) return true;
        return false;
    } catch(e){
        console.log("CheckExistAdmin",e)
        return false;
    }
}