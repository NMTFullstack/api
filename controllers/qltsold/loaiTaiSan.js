const LoaiTaiSan = require('../../models/QuanLyTaiSan/LoaiTaiSan');
const quanlytaisanService = require('../../services/QLTS/qltsService');
const functions = require('../../services/functions')
const NhomTs = require('../../models/QuanLyTaiSan/NhomTaiSan');
const TaiSan = require('../../models/QuanLyTaiSan/TaiSan');

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
      return functions.setError(res, 'tên loại  không được bỏ trống', 400);
    }
    if (typeof id_nhom === 'undefined') {
      return functions.setError(res, 'id_nhom  không được bỏ trống', 400);
    }
    else {
      let checkLoai = await LoaiTaiSan.find({ id_cty: com_id })
      if (checkLoai.some(loai => loai.ten_loai === ten_loai)) {
        return functions.setError(res, 'tên loại  đã được sử dụng', 400);
      }
      else {
        let maxID = await quanlytaisanService.getMaxIDloai(LoaiTaiSan)
        let id_loai = 0;
        if (maxID) {
          id_loai = Number(maxID) + 1;
        }
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
    return fnc.setError(res, e.message)
  }
}

exports.showLoaiTs = async (req, res) => {
  try {
    let { id_loai, page, perPage } = req.body
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
    return fnc.setError(res, e.message)
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
    return fnc.setError(res, e.message)
  }
}




exports.detailsLoai = async (req, res) => {
  try {
    let { id_loai } = req.body
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    let showLoai = await LoaiTaiSan.findOne({ id_loai: id_loai, id_cty: com_id, loai_da_xoa: 0 })
      .select('id_loai id_nhom_ts ten_loai')
    if (!showLoai) {
      return functions.setError(res, 'không tìm thấy bản ghi phừ hợp', 400);
    }
    let showTS = await (await TaiSan.find({ id_cty: com_id, id_loai_ts: id_loai, ts_da_xoa: 0 }).select('ts_id ts_ten -_id'))
    if (!showTS) {
      showTS = [];
    }
    return functions.success(res, 'edit data success', { showLoai, showTS });
  } catch (e) {
    console.log(e);
    return fnc.setError(res, e.message)
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

