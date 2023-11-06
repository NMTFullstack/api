const De_Xuat = require("../../../models/Vanthu/de_xuat");
const functions = require('../../../services/vanthu');

exports.thong_ke_nghi_phep = async (req, res) => {
    try {
        let {
            phong_ban,
            id_nhan_vien,
            nghi_nhieu_nhat //3-nghỉ nhiều nhất 2- nghỉ đột xuất nhiều nhất 1- nghỉ có kế hoạch nhiều nhất 
        } = req.body;
        let time_seach_from = req.body.time_seach_from ? req.body.time_seach_from : new Date("1970-01-01").getTime();
        let time_seach_to = req.body.time_seach_to ? req.body.time_seach_to : new Date().getTime();
        let filter = {};
        if (nghi_nhieu_nhat == 2) { filter.type_time = 2 };
        if (nghi_nhieu_nhat == 1) { filter.type_time = 1 };
        if (phong_ban) { filter.phong_ban = phong_ban };
        if (id_nhan_vien) { filter.id_user = id_nhan_vien };
        filter.type_dx = 1;
        filter.active = 1;
        let de_xuat = await De_Xuat.find(filter);
        let danh_sach_nv_nghi = [];
        let list_nv = [];
        for (let i = 0; i < de_xuat.length; i++) {
            list_nv.push(de_xuat[i].name_user);
        }
        list_nv = [...new Set(list_nv)];

        if (list_nv) {
            for (let j = 0; j < list_nv.length; j++) {

                let so_ngay_nghi = 0;
                for (let i = 0; i < de_xuat.length; i++) {
                    if (de_xuat[i].name_user == list_nv[j] && de_xuat[i].noi_dung.nghi_phep.kt_nghi.getTime() >= time_seach_from && de_xuat[i].noi_dung.nghi_phep.bd_nghi.getTime() <= time_seach_to) {
                        so_ngay_nghi += Math.ceil((de_xuat[i].noi_dung.nghi_phep.kt_nghi.getTime() - de_xuat[i].noi_dung.nghi_phep.bd_nghi.getTime()) / 86400000);
                    }
                }
                let info_nguoi_nghi = {
                    name: list_nv[j],
                    tong_ngay_nghi: so_ngay_nghi,

                }
                danh_sach_nv_nghi.push(info_nguoi_nghi);
            }

            if (nghi_nhieu_nhat) {//nghỉ nhiều nhất 

                let danh_sach_nghi_nhieu_nhat = [];
                let nguoi_nghi_nhieu_nhat = danh_sach_nv_nghi[0] || 0;
                for (let i = 0; i < danh_sach_nv_nghi.length; i++) {

                    if (danh_sach_nv_nghi[i].tong_ngay_nghi > nguoi_nghi_nhieu_nhat.tong_ngay_nghi) {
                        nguoi_nghi_nhieu_nhat = danh_sach_nv_nghi[i];

                    }
                }
                for (let i = 0; i < danh_sach_nv_nghi.length; i++) {

                    if (danh_sach_nv_nghi[i].tong_ngay_nghi == nguoi_nghi_nhieu_nhat.tong_ngay_nghi) {
                        danh_sach_nghi_nhieu_nhat.push(danh_sach_nv_nghi[i]);
                    }
                }
                danh_sach_nv_nghi = danh_sach_nghi_nhieu_nhat;
            }

            return functions.success(res, 'thanh cong', { danh_sach_nv_nghi });
        } else {
            return functions.success(res, 'khong co de xuat nao', { danh_sach_nv_nghi });
            
        }
    } catch (error) {
        console.error('Failed ', error);
        return functions.setError(res, error);
    }
}