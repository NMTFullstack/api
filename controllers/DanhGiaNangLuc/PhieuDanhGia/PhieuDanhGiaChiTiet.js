const functions = require('../../../services/functions');
const PhieuDanhGiaChiTiet = require('../../../models/DanhGiaNangLuc/PhieuDanhGiaChiTiet');
const DGNL_khDanhGia = require('../../../models/DanhGiaNangLuc/KhDanhGia');
const DGNL_TlbTieuChi = require('../../../models/DanhGiaNangLuc/TblTieuChi')

exports.getAllPhieuDanhGiaChiTiet = async(req, res, next) => {
    try {
        const type = req.user.data.type
        const tokenData = { id_congty: 0 }
        if (type === 1) {
            tokenData.id_congty = req.user.data.idQLC
        } else {
            tokenData.id_congty = req.user.data.com_id
        }
        const { kh_id, is_duyet } = req.body;
        const pageSize = parseInt(req.body.pageSize);
        const skipValue = parseInt(req.body.skipValue);

        console.log(pageSize);
        console.log(kh_id);
        console.log(is_duyet);

        // const matchStage = id_congty ? { id_congty: parseInt(id_congty) } : {};
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
            // {$unwind: '$users'},

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
                    trangthai_xoa: 1,
                    // nguoi_danhgia :'$users._id',
                    // anh: '$users.avatarUser',
                    // ten: '$users.userName',
                    'users._id': 1,
                    'users.userName': 1,
                    'users.avatarUser': 1,


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
        const tokenData = { id_congty: 0 }
        if (type === 1) {
            tokenData.id_congty = req.user.data.idQLC
        } else {
            tokenData.id_congty = req.user.data.com_id
        }
        const { kh_id } = req.body;


        console.log(kh_id);


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

// phieudanhgia 
exports.PhieuDanhGia = async(req, res, next) => {
    try {
        const { id_congty, kh_id } = req.body;



        console.log(id_congty);
        console.log(kh_id);

        const matchStage = id_congty ? { id_congty: parseInt(id_congty) } : {};
        const matchStage1 = kh_id ? { kh_id: parseInt(kh_id) } : {};



        const options = await DGNL_khDanhGia.aggregate([{
                $match: matchStage
            },
            {
                $match: matchStage1
            },
            {
                $lookup: {
                    from: 'DGNL_TlbTieuChi',
                    let: { kh_id_array: [{ $toString: '$kh_id' }] },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $in: ['$id', '$$kh_id_array']
                            }
                        }
                    }],
                    as: 'tieuchi'
                },
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
                    ten_tieuchi: '$tieuchi.tcd_ten',
                    loai_tieuchi: '$tieuchi.tcd_loai',
                    diem_tieuchi: '$tieuchi.tcd_thangdiem',


                },

            },
        ]);


        return functions.success(res, "success", options);
    } catch (err) {
        console.log(err);
        return functions.setError(res, "error");
    }
};