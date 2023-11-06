const DeDanhGia = require('../../../models/DanhGiaNangLuc/DeDanhGia');
const DeKiemTraCauHoi = require('../../../models/DanhGiaNangLuc/DeKiemTraCauHoi');
const KhDanhGia = require('../../../models/DanhGiaNangLuc/KhDanhGia');
const PhieuDanhGia = require('../../../models/DanhGiaNangLuc/PhieuDanhGia');
const tblChucvu = require('../../../models/DanhGiaNangLuc/TblChucVu');
const functions = require('../../../services/functions')
    // Import other models


exports.TrangChu = async(req, res) => {
    try {
        const type = req.user.data.type

        const ComId = {}; // Define usc_id as needed
        if (type === 1) {
            ComId.usc_id = req.user.data.idQLC
        } else ComId.usc_id = req.user.data.com_id
        const result = {}
        result.num_dedg = DeDanhGia.countDocuments({
            trangthai_xoa: 1,
            id_congty: ComId.usc_id,
        });
        result.num_dekt = DeKiemTraCauHoi.countDocuments({
            is_delete: 1,
            id_congty: ComId.usc_id,
        });
        result.num_kh = KhDanhGia.countDocuments({
            trangthai_xoa: 1,
            id_congty: ComId.usc_id,
        });
        result.num_phieu = PhieuDanhGia.countDocuments({
            trangthai_xoa: 1,
            id_congty: ComId.usc_id,
        });
        result.num_phieu_hth = PhieuDanhGia.countDocuments({
            phieuct_trangthai: 2,
            trangthai_xoa: 1,
            id_congty: ComId.usc_id,
        });
        result.lotrinhthangtien = tblChucvu.countDocuments({
            id_congty: ComId.usc_id,
        });
        let data = await Promise.all([
            result.num_dedg,
            result.num_dekt,
            result.num_kh,
            result.num_phieu,
            result.num_phieu_hth, result.lotrinhthangtien
        ])
        result.num_dedg = data[0];
        result.num_dekt = data[1];
        result.num_kh = data[2];
        result.num_phieu = data[3];
        result.num_phieu_hth = data[4];
        result.lotrinhthangtien = data[5]
            // Repeat this process for other queries and models

        return functions.success(res, 'successfully', { data: result })
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};