const LoaiTaiSan = require('../../models/QuanLyTaiSan/LoaiTaiSan');
const quanlytaisanService = require('../../services/QLTS/qltsService');
const functions = require('../../services/functions')
const NhomTs = require('../../models/QuanLyTaiSan/NhomTaiSan');
const TaiSan = require('../../models/QuanLyTaiSan/TaiSan');
const User = require('../../models/Users')

exports.addLoaiTaiSan = async (req, res) => {
  try {
    let { ten_loai, id_nhom } = req.body;
    let com_id = '';
    let createDate = Math.floor(Date.now() / 1000);
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    if (typeof ten_loai === 'undefined') {
      return functions.setError(res, 'Tên loại không được bỏ trống', 400);
    }
    if (typeof id_nhom === 'undefined') {
      return functions.setError(res, 'id_nhom  không được bỏ trống', 400);
    }
    else {
      let checkLoai = await LoaiTaiSan.find({ id_cty: com_id })
      if (checkLoai.some(loai => loai.ten_loai === ten_loai)) {
        return functions.setError(res, 'Tên loại đã được sử dụng', 400);
      }
      else {
        let maxID = await quanlytaisanService.getMaxIDloai(LoaiTaiSan)
        let id_loai = Number(maxID) + 1 || 1;
        let createNew = new LoaiTaiSan({
          id_loai: id_loai,
          ten_loai: ten_loai,
          id_cty: com_id,
          id_nhom_ts: id_nhom,
          loai_date_create: createDate
        })
        let save = await createNew.save()
        return functions.success(res, 'save data success', { save })
      }
    }

  } catch (e) {
    console.log(e); 
    return functions.setError(res, e.message)
  }
}

exports.showLoaiTs = async (req, res) => {
  try {
    let { id_loai, page, perPage,excel } = req.body
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    page = parseInt(page) || 1; // Trang hiện tại (mặc định là trang 1)
    perPage = parseInt(perPage) || 10; // Số lượng bản ghi trên mỗi trang (mặc định là 10)
    let matchQuery = {
      id_cty: com_id,// Lọc theo com_id
      loai_da_xoa: 0
    };
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;
    if (id_loai) {
      matchQuery.id_loai = parseInt(id_loai);
    }
    let showLoaiTs = await LoaiTaiSan.aggregate([
      {
        $match: matchQuery, // Sửa thành $match ở đây
      },
      { $sort: { id_loai: -1 } },
      {
        $lookup: {
          from: 'QLTS_Nhom_Tai_San',
          localField: 'id_nhom_ts',
          foreignField: 'id_nhom',
          as: 'listNhom'
        }
      },
      {
        $lookup: {
          from: 'QLTS_Tai_San',
          localField: 'id_loai',
          foreignField: 'id_loai_ts',
          as: 'listTaiSan'
        }
      },
      {
        $unwind: {
          path: '$listNhom',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$listTaiSan',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$id_loai",
          id_loai: { $first: "$id_loai" },
          ten_loai: { $first: "$ten_loai" },

          tong_so_tai_san: {
            $sum: "$listTaiSan.sl_bandau"
          },
          so_ts_chua_phat: {
            $sum: "$listTaiSan.ts_so_luong"
          },
          ten_nhom: { $first: "$listNhom.ten_nhom" },
          id_nhom: { $first: "$listNhom.id_nhom" },
        }
      },
      {
        $sort: {
          id_loai: -1, // Sắp xếp theo id_loai lớn nhất đến nhỏ nhất (hoặc 1 nếu muốn ngược lại)
        },
      },
      {
        $skip: startIndex,
      },
      {
        $limit: perPage,
      }
    ])
    const totalTsCount = await LoaiTaiSan.countDocuments(matchQuery);

    // Tính toán số trang và kiểm tra xem còn trang kế tiếp hay không
    const totalPages = Math.ceil(totalTsCount / perPage);
    const hasNextPage = endIndex < totalTsCount;

    return functions.success(res, 'get data success', { showLoaiTs, totalTsCount, totalPages, hasNextPage });
  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message)
  }
}
exports.ExportExcel = async (req, res, next) => {
  try {
    const com_id = Number(req.params._id)
    let showLoaiTs = await LoaiTaiSan.aggregate([
      {
        $match: {
          id_cty: com_id,// Lọc theo com_id
          loai_da_xoa: 0
        }// Sửa thành $match ở đây
      },
      { $sort: { id_loai: -1 } },
      {
        $lookup: {
          from: 'QLTS_Nhom_Tai_San',
          localField: 'id_nhom_ts',
          foreignField: 'id_nhom',
          as: 'listNhom'
        }
      },
      {
        $lookup: {
          from: 'QLTS_Tai_San',
          localField: 'id_loai',
          foreignField: 'id_loai_ts',
          as: 'listTaiSan'
        }
      },
      {
        $unwind: {
          path: '$listNhom',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$listTaiSan',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$id_loai",
          id_loai: { $first: "$id_loai" },
          ten_loai: { $first: "$ten_loai" },

          tong_so_tai_san: {
            $sum: "$listTaiSan.sl_bandau"
          },
          so_ts_chua_phat: {
            $sum: "$listTaiSan.ts_so_luong"
          },
          ten_nhom: { $first: "$listNhom.ten_nhom" },
        }
      },
      {
        $sort: {
          id_loai: -1, // Sắp xếp theo id_loai lớn nhất đến nhỏ nhất (hoặc 1 nếu muốn ngược lại)
        },
      },
    ])

    const LoaiTS_xlsx = [
      ['STT', 'Mã loại tài sản', 'Tên loại tài sản', 'Tổng số tài sản' , 'Số tài sản còn chưa phát', 'Nhóm tài sản']
  ];
  for (let i = 0; i < showLoaiTs.length; i++) {
      const row = [
      i + 1,
      showLoaiTs[i].id_loai,
      showLoaiTs[i].ten_loai,
      showLoaiTs[i].tong_so_tai_san,
      showLoaiTs[i].so_ts_chua_phat,
      showLoaiTs[i].ten_nhom,
      ];
      LoaiTS_xlsx.push(row);
  }
  quanlytaisanService.excel(LoaiTS_xlsx, "DanhSachLoaiTS", res);
  } catch (error) {
    console.log(error);
    return functions.setError(res, error.message)
  }
}

exports.editLoaiTs = async (req, res) => {
  try {
    let { ten_loai, id_nhom, id_loai } = req.body;
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    let chinhsualoai = await LoaiTaiSan.findOneAndUpdate(
      { id_loai: id_loai, id_cty: com_id },
      {
        $set: {
          id_nhom_ts: id_nhom,
          ten_loai: ten_loai
        }
      },
      { new: true }
    );
    if (!chinhsualoai) {
      return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để thay đổi', 400);
    }
    return functions.success(res, 'edit data success', { chinhsualoai });

  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message)
  }
}




exports.detailsLoai = async (req, res) => {
  try {
    let id_loai = req.body.id_loai
    let page = Number(req.body.page) || 1;
    let pageSize = Number(req.body.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const limit = pageSize;
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    let cond = {}
    cond.id_loai = Number(id_loai)
    if(id_loai){
      let showLoai =  await LoaiTaiSan.aggregate([
        {
          $match: cond, // Sửa thành $match ở đây
        },
        {
          $lookup: {
            from: 'QLTS_Nhom_Tai_San',
            localField: 'id_nhom_ts',
            foreignField: 'id_nhom',
            as: 'listNhom'
          }
        },
        {
          $lookup: {
            from: 'QLTS_Tai_San',
            localField: 'id_loai',
            foreignField: 'id_loai_ts',
            as: 'listTaiSan'
          }
        },
        {
          $unwind: {
            path: '$listNhom',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$listTaiSan',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id_loai: "$id_loai" ,
            ten_loai: "$ten_loai" ,
            ts_id: "$listTaiSan.ts_id" ,
            ts_ten: "$listTaiSan.ts_ten" ,
            IDNguoiCam:  "$listTaiSan.id_dv_quanly" ,
            IDDVQL: "$listTaiSan.id_ten_quanly" ,
            ts_gia_tri: "$listTaiSan.ts_gia_tri" ,
            so_luong_chua_CP:  "$listTaiSan.ts_so_luong",
            so_ts_banDau:  "$listTaiSan.sl_bandau",
            ten_nhom: "$listNhom.ten_nhom" ,
            id_nhom: "$listNhom.id_nhom" ,
          }
        },
        {$sort : {"listTaiSan.ts_id" : -1}},
        {
        $facet: {
          paginatedResults: [{ $skip: skip }, { $limit: limit }],
          totalCount: [
            {
              $count: 'count'
            }
          ]
        }
      }
      ])
      let result = {}
      let totalCount = 0
      if(showLoai[0].totalCount.length > 0){
        result = showLoai[0].paginatedResults;
        
        totalCount = showLoai[0].totalCount[0].count;
        for (let i = 0; i < result.length; i++) {
        // xử lí tên người cầm
        if (result[i].IDNguoiCam != 0 && typeof result[i].IDNguoiCam !== "string" ) {
          let IDNguoiCam = await User.findOne({ _id: result[i].IDNguoiCam }, { userName: 1 })
          if (IDNguoiCam) {
            result[i].ten_ng_cam = IDNguoiCam.userName
            if (IDNguoiCam && IDNguoiCam.inForPerson && IDNguoiCam.inForPerson.employee) {
              //xử lí phòng ban neu la NV
              let dep = await OrganizeDetail.findOne({ id: IDNguoiCam.inForPerson.employee.organizeDetailId }, { organizeDetailName: 1 })
              if(dep) result[i].phongban_nguoiCam = dep.organizeDetailName
              else result[i].phongban_nguoiCam = "Không tồn tại"
            }else{
              //xử lí phòng ban neu la cty
              result[i].phongban_nguoiCam = IDNguoiCam.userName
            }
          } else {
            result[i].ten_ng_cam = "Chưa cập nhật"
          }
        }
        // xử lý tên người quản lí
        if (result[i].IDDVQL != 0 && typeof result[i].IDDVQL !== "string" ) {
          let IDDVQL = await User.findOne({ _id: result[i].IDDVQL }, { userName: 1 })
          if (IDDVQL) result[i].ten_dvql = IDDVQL.userName
          else result[i].ten_dvql = null
        }
        //xử lí số lượng
        result[i].sl_da_phat = Number(result[i].so_ts_banDau) - Number(result[i].so_luong_chua_CP)

      }
      }
      return functions.success(res, 'lấy thành công', { result,  totalCount});
    }
    return functions.setError(res, "thiếu id loại tài sản")
  
  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message)
  }
}



exports.deleteLoaiTs = async (req, res) => {
  try {
    let { type, id_loai } = req.body;
    let com_id = '';
    let id_ng_xoa = '';

    const deleteDate = Math.floor(Date.now() / 1000);
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
      id_ng_xoa = req.user.data._id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    if (!id_loai.every(num => !isNaN(parseInt(num)))) {
      return functions.setError(res, 'id_loai không hợp lệ', 400);
    }
    if (type == 1) {
      //Xóa vĩnh viễn
      let idArraya = id_loai.map(idItem => parseInt(idItem));
      let result = await LoaiTaiSan.deleteMany({ id_loai: { $in: idArraya }, id_cty: com_id });
      if (result.deletedCount === 0) {
        return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để xóa', 400);
      }
      return functions.success(res, 'xóa thành công!');
    }
    if (type == 2) {
      // thay đổi trang thái thành 1
      let idArray = id_loai.map(idItem => parseInt(idItem));
      let result = await LoaiTaiSan.updateMany(
        { id_loai: { $in: idArray }, loai_da_xoa: 0, id_cty: com_id },
        {
          loai_da_xoa: 1,
          loai_id_ng_xoa: id_ng_xoa,
          loai_date_delete: deleteDate,

        }
      );
      if (result.nModified === 0) {
        return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để thay đổi', 400);
      }
      return functions.success(res, 'Bạn đã xóa thành công , thêm vào danh sách dã xóa !');
    }
    if (type == 3) {
      //khôi phục
      let idArray = id_loai.map(idItem => parseInt(idItem));
      let result = await LoaiTaiSan.updateMany(
        {
          id_loai: { $in: idArray },
          loai_da_xoa: 1,
          id_cty: com_id
        },
        {
          loai_id_ng_xoa: 0,
          loai_da_xoa: 0,
          loai_date_delete: 0,
        }
      );
      if (result.nModified === 0) {
        return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để thay đổi', 400);
      }
      return functions.success(res, 'Bạn đã khôi phục loại tài sản thành công!');
    } else {
      return functions.setError(res, 'không có quyền xóa', 400)
    }

  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message)
  }
}

