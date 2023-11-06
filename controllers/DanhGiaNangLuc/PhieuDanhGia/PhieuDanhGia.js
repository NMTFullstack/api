const functions = require('../../../services/functions');
const DGNL_khDanhGia = require('../../../models/DanhGiaNangLuc/KhDanhGia');
const DGNL_PhieuDanhGia = require('../../../models/DanhGiaNangLuc/PhieuDanhGia');
const Users = require('../../../models/Users');

// tên kế hoạch
exports.allNguoiDanhGia = async(req, res, next) => {
    try {
        const type = req.user.data.type;
        const tockenData = { id_congty: 0 }
        if (type === 1) {
            tockenData.id_congty = req.user.data.idQLC;
        } else {
            tockenData.id_congty = req.user.data.com_id
        }

        const option = {
            _id: 0,
            kh_id: 1,
            kh_ten: 1,
        }
        const result = await DGNL_khDanhGia.find({ id_congty: tockenData.id_congty, trangthai_xoa: 1 }, option);
        return functions.success(res, "success", result);

    } catch (error) {
        return functions.setError(res, "error");
    }
}



// render dữ liệu trong bảng và phân trang
exports.getListBang = async(req, res, next) => {
    try {
        const type = req.user.data.type

        const tokenData = { id_congty: 0 }; // Define usc_id as needed
        if (type === 1) {
            tokenData.id_congty = req.user.data.idQLC
        } else {
            tokenData.id_congty = req.user.data.com_id
        }
        console.log(tokenData.id_congty)
        const { kh_id, is_duyet } = req.body;
        const pageSize = parseInt(req.body.pageSize);
        const skipValue = parseInt(req.body.skipValue);

        console.log(pageSize);
        console.log(kh_id);
        console.log(is_duyet);

        // const matchStage = id_congty ? { id_congty:  tokenData.id_congty } : {};
        const matchStage1 = kh_id ? { kh_id: parseInt(kh_id) } : {};



        const options = await DGNL_khDanhGia.aggregate([{
                $match: { id_congty: tokenData.id_congty }
            },
            {
                $match: matchStage1
            },
            {
                $match: {
                    //  1 là chưa xóa 2 là đã xóa
                    trangthai_xoa: 1
                }

            },
            {
                $skip: skipValue // Sử dụng $skip để bỏ qua số lượng bản ghi ban đầu
            },
            {
                $limit: pageSize
            },
            {
                $lookup: {
                    from: 'DGNL_PhieuDanhGia',
                    localField: 'kh_id',
                    foreignField: 'phieuct_id_kh',
                    as: 'phieu_danhgia'
                }
            },

            {
                $lookup: {
                    from: 'Users',
                    let: { nguoi_danhgia: { $split: ['$kh_user_dg', ','] } },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $in: [{ $toString: '$_id' }, '$$nguoi_danhgia']
                            }
                        }
                    }],
                    as: 'users'
                }
            },

            {
                $project: {
                    _id: 0,
                    id_congty: 1,
                    kh_id: 1,
                    khUserArray: 1,
                    ma_phieu: {
                        $concat: ["PDG", { $toString: "$kh_id" }]
                    },
                    tenkehoachdanhgia: "$kh_ten",
                    trang_thai: "$phieu_danhgia.is_duyet",
                    doi_tuong_pb: "$kh_user_pb",
                    // nguoi_danhgia : "$kh_user_dg",
                    // nguoi_danhgia:  { $split: ['$kh_user_dg', ','] },
                    doi_tuong_nv: { $size: { $ifNull: [{ $split: ["$kh_user_nv", ","] },
                                []
                            ] } },
                    thoi_gian_batdau: {
                        $concat: [
                            { $toString: "$kh_giobatdau" },
                            "-",
                            {
                                $dateToString: {
                                    // format: "%Y/%m/%d",
                                    format: "%d/%m/%Y",
                                    date: { $toDate: { $multiply: ["$kh_ngaybatdau", 1000] } } // Chuyển đổi Unix timestamp thành đối tượng ngày tháng
                                }
                            }
                        ]
                    },
                    thoi_gian_ketthuc: {
                        $concat: [
                            { $toString: "$kh_gioketthuc" },
                            "-",
                            {
                                $dateToString: {
                                    // format: "%Y/%m/%d",
                                    format: "%d/%m/%Y",
                                    date: { $toDate: { $multiply: ["$kh_ngayketthuc", 1000] } } // Chuyển đổi Unix timestamp thành đối tượng ngày tháng
                                }
                            }
                        ]
                    },
                    ghi_chu: "$kh_ghichu",
                    // test: "$phieu_danhgia.phieuct_id_kh",
                    trangthai_xoa: 1,
                    nguoi_danhgia: '$users._id',
                    anh_nguoi_danhgia: '$users.avatarUser'
                        // users: 1

                },

            },
        ]);


        return functions.success(res, "success", options);
    } catch (err) {
        console.log(err);
        return functions.setError(res, "error");
    }
};

// list người đánh giá
exports.ListUsers = async(req, res, next) => {
    try {

        const type = req.user.data.type

        const tokenData = { id_congty: 0 }; // Define usc_id as needed
        if (type === 1) {
            tokenData.id_congty = req.user.data.idQLC
        } else {
            tokenData.id_congty = req.user.data.com_id
        }
        console.log(tokenData.id_congty)
        const { kh_id } = req.body;




        console.log(kh_id);

        // const matchStage = id_congty ? { id_congty: parseInt(id_congty) } : {};
        const matchStage1 = kh_id ? { kh_id: parseInt(kh_id) } : {};



        const options = await DGNL_khDanhGia.aggregate([{
                $match: { id_congty: tokenData.id_congty }
            },
            {
                $match: matchStage1
            },

            {
                $lookup: {
                    from: 'Users',
                    let: { nguoi_danhgia: { $split: ['$kh_user_dg', ','] } },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $in: [{ $toString: '$_id' }, '$$nguoi_danhgia']
                            }
                        }
                    }],
                    as: 'users'
                },
            },
            { $unwind: '$users' },

            {
                $project: {
                    _id: 0,
                    kh_id: 1,
                    nguoi_danhgia: '$users._id',
                    ten: '$users.userName',
                    anh: '$users.avatarUser',
                    phong_ban: '$users.inForPerson.employee.dep_id',
                    chuc_vu: '$users.inForPerson.employee.position_id',


                },

            },
        ]);


        return functions.success(res, "success", options);
    } catch (err) {
        console.log(err);
        return functions.setError(res, "error");
    }
};


// xóa KHDG
exports.deleteKHDG = async(req, res, next) => {
    try {
        const type = req.user.data.type;
        const tockenData = { id_congty: 0 }
        if (type === 1) {
            tockenData.id_congty = req.user.data.idQLC;
        } else {
            tockenData.id_congty = req.user.data.com_id
        }
        const { kh_id } = req.body;

        // if (!kh_id || !id_congty) {
        //   return functions.setError(res, 'Không có kh_id hoặc id_congty được cung cấp');
        // }

        // Cập nhật trạng thái trangthai_xoa từ 1 thành 2 trong model DGNL_khDanhGia
        const updatedKHDG = await DGNL_khDanhGia.findOneAndUpdate({ kh_id, id_congty: tockenData.id_congty }, { trangthai_xoa: 2 }, { new: true } // Đảm bảo trả về bản ghi sau khi cập nhật
        );

        if (!updatedKHDG) {
            return functions.setError(res, 'Không tìm thấy KHDG để cập nhật');
        }

        // Tìm tất cả các bản ghi trong DGNL_PhieuDanhGia có phieuct_id_kh tương ứng với kh_id đã cập nhật
        const phieuDanhGiaToUpdate = await DGNL_PhieuDanhGia.find({ phieuct_id_kh: updatedKHDG.kh_id });

        // Cập nhật trạng thái trangthai_xoa từ 1 thành 2 trong tất cả các bản ghi tìm thấy
        await DGNL_PhieuDanhGia.updateMany({ phieuct_id_kh: updatedKHDG.kh_id }, { trangthai_xoa: 2 });

        return functions.success(res, 'Cập nhật trạng thái thành công', updatedKHDG);
    } catch (error) {
        console.error(error);
        return functions.setError(res, 'Cập nhật trạng thái không thành công');
    }
};