const LoaiTaiSan = require('../../models/QuanLyTaiSan/LoaiTaiSan');
const NhomTaiSan = require('../../models/QuanLyTaiSan/NhomTaiSan');
const TaiSan = require('../../models/QuanLyTaiSan/TaiSan');
const quanlytaisanService = require('../../services/QLTS/qltsService');
const PhanQuyen = require('../../models/QuanLyTaiSan/PhanQuyen')
const functions = require('../../services/functions')
const ThongTinTuyChinh = require('../../models/QuanLyTaiSan/ThongTinTuyChinh');
const User = require('../../models/Users')

exports.addNhomTaiSan = async (req, res) => {
  try {
    let { ten_nhom } = req.body;
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'Không có quyền truy cập', 400);
    }
    let createDate = Math.floor(Date.now() / 1000);
    if (typeof ten_nhom === 'undefined') {
      return functions.setError(res, 'Tên nhóm không được bỏ trống', 400);
    } else {
      let checkNhom = await NhomTaiSan.find({ id_cty: com_id })
      if (checkNhom.some(nhom => nhom.ten_nhom === ten_nhom)) {
        return functions.setError(res, 'Tên nhóm đã được sử dụng', 400);
      }
      else {
        let maxID = await quanlytaisanService.getMaxIDnhom(NhomTaiSan)
        let id_nhom = 0;
        if (maxID) {
          id_nhom = Number(maxID) + 1;
        }
        let createNew = new NhomTaiSan({
          id_nhom: id_nhom,
          ten_nhom: ten_nhom,
          id_cty: com_id,
          nhom_date_create: createDate
        })
        let save = await createNew.save()
        return functions.success(res, 'save data success', { save })
      }
    }

  } catch (error) {
    console.log(error);
    return functions.setError(res, error)
  }

}

exports.showNhomTs = async (req, res) => {
  try {
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }

    // Trích xuất id_nhom, page và perPage từ req.body
    let { id_nhom, page, perPage ,excel} = req.body;
    page = parseInt(page) || 1; // Trang hiện tại (mặc định là trang 1)
    perPage = parseInt(perPage) || 10; // Số lượng bản ghi trên mỗi trang (mặc định là 10)

    let matchQuery = {
      id_cty: com_id,
      nhom_da_xoa: 0
    };
    if (id_nhom) {
      const parsedIdNhom = parseInt(id_nhom);
      if (!isNaN(parsedIdNhom)) {
        matchQuery.id_nhom = parsedIdNhom;
      } else {
        return functions.setError(res, 'id_nhom không hợp lệ', 400);
      }
    }
    // Đếm số lượng ts_id dựa trên giá trị id_nhom_ts và gom nhóm theo id_nhom_ts
    let result = await NhomTaiSan.aggregate([
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: 'QLTS_Loai_Tai_San',
          localField: 'id_nhom',
          foreignField: 'id_nhom_ts',
          as: 'loai_tai_san',
        },
      },
      { $sort: { id_nhom: -1 } },
      {
        $lookup: {
          from: 'QLTS_Tai_San',
          localField: 'id_nhom',
          foreignField: 'id_nhom_ts',
          as: 'tai_san',
        },
      },
      {
        $project: {
          'id_nhom': '$id_nhom',
          'ten_nhom': '$ten_nhom',
          so_luong_loai_ts: { $size: '$loai_tai_san' },
          so_luong_tai_san: { $size: '$tai_san' },
        },
      },
      {
        $skip: (page - 1) * perPage,
      },
      {
        $limit: perPage,
      }
    ]);
    const totalItems = await NhomTaiSan.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalItems / perPage);

    return functions.success(res, 'get data success', { result, totalPages, totalItems });
  } catch (error) {
    console.log(error);
    return functions.setError(res, error.message);
  }
};
exports.ExportExcel = async (req, res, next) => {
  try {
    const com_id = Number(req.params._id)
    let result = await NhomTaiSan.aggregate([
      {
        $match: {
          id_cty: com_id,
          nhom_da_xoa: 0
        }
      },
      {
        $lookup: {
          from: 'QLTS_Loai_Tai_San',
          localField: 'id_nhom',
          foreignField: 'id_nhom_ts',
          as: 'loai_tai_san',
        },
      },
      { $sort: { id_nhom: -1 } },
      {
        $lookup: {
          from: 'QLTS_Tai_San',
          localField: 'id_nhom',
          foreignField: 'id_nhom_ts',
          as: 'tai_san',
        },
      },
      {
        $project: {
          'id_nhom': '$id_nhom',
          'ten_nhom': '$ten_nhom',
          so_luong_loai_ts: { $size: '$loai_tai_san' },
          so_luong_tai_san: { $size: '$tai_san' },
        },
      },
    ]);

    const NhomTS_xlsx = [
      ['STT', 'Mã nhóm tài sản', 'Tên nhóm tài sản', 'Số loại tài sản' , 'Số tài sản']
  ];
  for (let i = 0; i < result.length; i++) {
      const row = [
      i + 1,
      result[i].id_nhom,
      result[i].ten_nhom,
      result[i].so_luong_loai_ts,
      result[i].so_luong_tai_san,
      ];
      NhomTS_xlsx.push(row);
  }
  quanlytaisanService.excel(NhomTS_xlsx, "DanhSachNhomTS", res);
  } catch (error) {
    console.log(error);
    return functions.setError(res, error.message)
  }
}
exports.showCTNhomTs = async (req, res) => {
  try {
    let { id_nhom_ts, id_loai, page, perPage } = req.body;
    let com_id = '';
    page = parseInt(page) || 1; // Trang hiện tại (mặc định là trang 1)
    perPage = parseInt(perPage) || 10; // Số lượng bản ghi trên mỗi trang (mặc định là 10)
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    let chage = parseInt(id_nhom_ts)
    let matchQuery = {
      id_cty: com_id,// Lọc theo com_id
      id_nhom_ts: chage,
      loai_da_xoa: 0
    };
    if (id_loai) {
      const parsedIdloai = parseInt(id_loai);
      if (!isNaN(parsedIdloai)) {
        matchQuery.id_loai = parsedIdloai;
      } else {
        return functions.setError(res, 'id_loai không hợp lệ', 400);
      }
    }
    let listLoai = await LoaiTaiSan.aggregate([
      {
        $match: matchQuery
      },
      { $sort: { id_loai: -1 } },
      {
        $lookup: {
          from: 'QLTS_Tai_San',
          localField: 'id_loai',
          foreignField: 'id_loai_ts',
          as: 'tai_san',
        },
      },
      {
        $project: {
          'id_loai': '$id_loai',
          'ten_loai': '$ten_loai',
          tong_so_luong_chua_cp: {
            $reduce: {
              input: '$tai_san',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.ts_so_luong'] }
            }
          },
          so_tai_san: {
            $map: {
              input: '$tai_san',
              as: 'tai_san',
              in: {
                'id_tai_san': '$$tai_san.ts_id',
                'ten_tai_san': '$$tai_san.ts_ten',
                'so_luong_chua_cap_phat': '$$tai_san.ts_so_luong'
              }
            }
          }
        },
      },
      {
        $skip: (page - 1) * perPage,
      },
      {
        $limit: perPage,
      }
    ])
    const totalItems = await LoaiTaiSan.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalItems / perPage);
    return functions.success(res, 'get data success', { listLoai, totalItems, totalPages });
  } catch (error) {
    console.log(error);
    return functions.setError(res, error.message);
  }
};

exports.showdataCT = async (req, res) => {
  try {
    let { id_nhom } = req.body;
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    let checknhom = await NhomTaiSan.findOne({ id_nhom: id_nhom, id_cty: com_id, nhom_da_xoa: 0 }).select('id_nhom ten_nhom')
    if (!checknhom) {
      return functions.setError(res, 'không tìm thấy bản ghi phù hợp ', 400);
    }
    return functions.success(res, 'get data success', { checknhom });
  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message)
  }
}

exports.editNhom = async (req, res) => {
  try {
    let { ten_nhom, id_nhom } = req.body;
    let com_id = '';

    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    let chinhsuanhom = await NhomTaiSan.findOneAndUpdate(
      { id_nhom: id_nhom, id_cty: com_id, nhom_da_xoa: 0 },
      { $set: { ten_nhom: ten_nhom } },
      { new: true }
    );
    if (!chinhsuanhom) {
      return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để thay đổi', 400);
    }
    return functions.success(res, 'chỉnh sửa thành công', { chinhsuanhom });
  } catch (error) {
    console.log(error);
    return functions.setError(res, error);
  }
};

exports.xoaNhom = async (req, res) => {
  try {
    let { type, id_nhom } = req.body;
    let com_id = '';
    let nhom_id_ng_xoa = '';

    const deleteDate = Math.floor(Date.now() / 1000);
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
      nhom_id_ng_xoa = req.user.data._id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    if (!id_nhom.every(num => !isNaN(parseInt(num)))) {
      return functions.setError(res, 'id_nhom không hợp lệ', 400);
    }
    if (type == 1) {
      //Xóa vĩnh viễn
      let idArraya = id_nhom.map(idItem => parseInt(idItem));

      let result = await NhomTaiSan.deleteMany({ id_nhom: { $in: idArraya }, id_cty: com_id });
      if (result.deletedCount === 0) {
        return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để xóa', 400);
      }
      return functions.success(res, 'xóa thành công!');
    }
    if (type == 2) {
      // thay đổi trang thái thành 1
      let idArray = id_nhom.map(idItem => parseInt(idItem));
      let result = await NhomTaiSan.updateMany(
        { id_nhom: { $in: idArray }, nhom_da_xoa: 0, id_cty: com_id },
        {
          nhom_da_xoa: 1,
          nhom_id_ng_xoa: nhom_id_ng_xoa,
          nhom_date_delete: deleteDate,

        }
      );
      if (result.nModified === 0) {
        return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để thay đổi', 400);
      }
      return functions.success(res, 'Bạn đã xóa thành công , thêm vào danh sách dã xóa !');
    }
    if (type == 3) {
      //khôi phục
      let idArray = id_nhom.map(idItem => parseInt(idItem));
      let result = await NhomTaiSan.updateMany(
        {
          id_nhom: { $in: idArray },
          nhom_da_xoa: 1, id_cty: com_id
        },
        {
          nhom_da_xoa: 0,
          nhom_id_ng_xoa: 0,
          nhom_date_delete: 0,
        }
      );
      if (result.nModified === 0) {
        return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để thay đổi', 400);
      }
      return functions.success(res, 'Bạn đã khôi phục nhóm tài sản thành công!');
    } else {
      return functions.setError(res, 'không có quyền xóa', 400)
    }
  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message)
  }
}

exports.listTTPBnhom = async (req, res) => {
  try {
    let { id_nhom_ts, tt_ten_truong, page, perPage } = req.body;
    let com_id = '';
    let ng_tao = req.user.data._id;
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }

    if (typeof id_nhom_ts === 'undefined') {
      return functions.setError(res, 'id_nhom_ts tài sản không được bỏ trống', 400);
    }

    if (isNaN(Number(id_nhom_ts))) {
      return functions.setError(res, 'id_nhom_ts tài sản phải là một số', 400);
    }

    let query = {
      id_nhom_ts: id_nhom_ts,
      com_id_tt: com_id,
      tt_xoa: 0
    };

    if (tt_ten_truong) {
      query.tt_ten_truong = { $regex: tt_ten_truong, $options: 'i' };
    }

    const totalItems = await ThongTinTuyChinh.countDocuments(query);
    const totalPages = Math.ceil(totalItems / perPage);
    page = parseInt(page) || 1;
    perPage = parseInt(perPage) || 10;
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;

    let checkTTTC = await ThongTinTuyChinh.find(query)
      .skip(startIndex)
      .limit(perPage)
      .select('id_tt tt_ten_truong kieu_du_lieu noidung_mota ng_tao tt_date_create');

    const items = await Promise.all(checkTTTC.map(async (tt) => {
      let nguoi_tao = '';
      let checkUser = await User.findOne({ _id: tt.ng_tao, type: { $ne: 0 } }).select('userName');
      if (checkUser) {
        nguoi_tao = checkUser.userName;
      }

      return {
        id_tt: tt.id_tt,
        thong_tin_tuy_chinh: tt.tt_ten_truong,
        kieu_du_lieu: tt.kieu_du_lieu,
        noidung_mota: tt.noidung_mota,
        nguoi_tao: nguoi_tao,
        ngay_tao: tt.tt_date_create
      };
    }));

    return functions.success(res, 'get data success', { items, totalItems, totalPages });
  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message);
  }
};

exports.addTTPB = async (req, res) => {
  try {
    let { tt_ten_truong, id_nhom_ts, kieu_du_lieu, noidung_mota } = req.body
    let com_id = '';
    let ng_tao = '';
    let createDate = Math.floor(Date.now() / 1000);
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
      ng_tao = req.user.data._id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    if (typeof id_nhom_ts === 'undefined') {
      return functions.setError(res, 'id_nhom_ts  không được bỏ trống', 400);
    }

    if (isNaN(Number(id_nhom_ts))) {
      return functions.setError(res, 'id_nhom_ts  phải là một số', 400);
    }
    if (!tt_ten_truong || !kieu_du_lieu || !noidung_mota) {
      return functions.setError(res, 'thiếu thông tin truyền lên', 400);
    }
    let maxIdTTTC = await functions.getMaxIdByField(ThongTinTuyChinh, 'id_tt');
    let createNew = new ThongTinTuyChinh({
      id_tt: maxIdTTTC,
      com_id_tt: com_id,
      id_nhom_ts: id_nhom_ts,
      tt_ten_truong: tt_ten_truong,
      kieu_du_lieu: kieu_du_lieu,
      noidung_mota: noidung_mota,
      ng_tao: ng_tao,
      tt_date_create: createDate,
    })
    let save = await createNew.save();
    return functions.success(res, 'thêm thành công', { save });
  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message);
  }
}

exports.detailsTTTC = async (req, res) => {
  try {
    let { id_tt } = req.body;
    let com_id = '';

    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }

    if (typeof id_tt === 'undefined') {
      return functions.setError(res, 'id_tt thông tin tùy chỉnh  không được bỏ trống', 400);
    }

    if (isNaN(Number(id_tt))) {
      return functions.setError(res, 'id_tt thông tin tùy chỉnh  phải là một số', 400);
    }
    let checkTTTC = await ThongTinTuyChinh.findOne({ id_tt: id_tt, com_id_tt: com_id, tt_xoa: 0 })
      .select('tt_ten_truong kieu_du_lieu noidung_mota')
    if (!checkTTTC) {
      return functions.setError(res, 'không tìm thấy bản ghi phù hợp', 400);
    }
    return functions.success(res, 'thêm thành công', { checkTTTC });
  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message);
  }
}

exports.editTTTC = async (req, res) => {
  try {
    let { tt_ten_truong, id_tt, kieu_du_lieu, noidung_mota } = req.body

    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    if (typeof id_tt === 'undefined') {
      return functions.setError(res, 'id_tt thông tin tùy chỉnh  không được bỏ trống', 400);
    }

    if (isNaN(Number(id_tt))) {
      return functions.setError(res, 'id_tt thông tin tùy chỉnh  phải là một số', 400);
    }
    if (!tt_ten_truong || !kieu_du_lieu || !noidung_mota) {
      return functions.setError(res, 'thiếu thông tin truyền lên', 400);
    }
    let chinhsua = await ThongTinTuyChinh.findOneAndUpdate(
      { id_tt: id_tt, com_id_tt: com_id, tt_xoa: 0 },
      {
        $set: {
          tt_ten_truong: tt_ten_truong,
          kieu_du_lieu: kieu_du_lieu,
          noidung_mota: noidung_mota
        }
      },
      { new: true }
    );
    if (!chinhsua) {
      return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để thay đổi', 400);
    }
    return functions.success(res, 'chỉnh sửa thành công', { chinhsua });

  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message);
  }
}


exports.deleteTTTC = async (req, res) => {
  try {
    let { type, id_tt } = req.body;
    let com_id = '';
    let ng_xoa = '';

    const deleteDate = Math.floor(Date.now() / 1000);
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
      ng_xoa = req.user.data._id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    if (typeof id_tt === 'undefined') {
      return functions.setError(res, 'id_tt thông tin tùy chỉnh  không được bỏ trống', 400);
    }

    if (isNaN(Number(id_tt))) {
      return functions.setError(res, 'id_tt thông tin tùy chỉnh  phải là một số', 400);
    }
    if (type == 1) {
      //Xóa vĩnh viễn
      let result = await ThongTinTuyChinh.deleteOne({ id_tt: id_tt, com_id_tt: com_id });
      if (result.deletedCount === 0) {
        return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để xóa', 400);
      }
      return functions.success(res, 'xóa thành công!');
    }
    if (type == 2) {
      // thay đổi trang thái thành 1
      let result = await ThongTinTuyChinh.findOneAndUpdate(
        { id_tt: id_tt, tt_xoa: 0, com_id_tt: com_id },
        {
          tt_xoa: 1,
          ng_xoa: ng_xoa,
          ngay_xoa: deleteDate
        }
      );
      if (!result) {
        return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để thay đổi', 400);
      }
      return functions.success(res, 'Bạn đã xóa thành công , thêm vào danh sách dã xóa !');
    }
    if (type == 3) {
      //khôi phục

      let result = await ThongTinTuyChinh.findOneAndUpdate(
        {
          id_tt: id_tt,
          tt_xoa: 1, com_id_tt: com_id
        },
        {
          tt_xoa: 0,
          ng_xoa: 0,
          ngay_xoa: 0,
        }
      );
      if (!result) {
        return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để thay đổi', 400);
      }
      return functions.success(res, 'Bạn đã khôi phục thông tin phân bổ thành công!');
    } else {
      return functions.setError(res, 'type không hợp lệ', 400)
    }
  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message);
  }
}