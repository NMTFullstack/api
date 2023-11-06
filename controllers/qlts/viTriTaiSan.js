const ViTriTs = require('../../models/QuanLyTaiSan/ViTri_ts');
const qltsService = require('../../services/QLTS/qltsService')
const Depament = require('../../models/qlc/Deparment')
const functions = require('../../services/functions')
const User = require('../../models/Users')

exports.addViTriTaiSan = async (req, res) => {
  try {
    let { ten_vitri, dv_quan_ly, ghi_chu_vitri, quyen_dv_qly } = req.body;
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    if (typeof ten_vitri === 'undefined') {
      return functions.setError(res, 'tên vị trí  không được bỏ trống', 400);
    } else {
      let maxID = await qltsService.getMaxIDVT(ViTriTs)
      let id_vitri = Number(maxID) + 1 || 1;
      let createNew = new ViTriTs({
        id_vitri: id_vitri,
        vi_tri: ten_vitri,
        id_cty: com_id,
        dv_quan_ly: dv_quan_ly,
        quyen_dv_qly: quyen_dv_qly,
        ghi_chu_vitri: ghi_chu_vitri
      })
      let save = await createNew.save()
      return functions.success(res, 'save data success', { save })
    }
  } catch (error) {
    console.log(error);
    return functions.setError(res, error.message)
  }

}

exports.showaddViTri = async (req, res) => {
  try {
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
      let showdp = await Depament.find({ com_id: com_id }).select('dep_id dep_name').lean()
      return functions.success(res, 'get data success', { showdp })
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
  } catch (error) {
    console.log(error);
    return functions.setError(res, error.message)
  }
}
exports.ExportExcel = async (req, res, next) => {
  try {
    const com_id = Number(req.params._id)
    let data = await ViTriTs.aggregate([
      {
        $match: {id_cty: com_id}, // Áp dụng các điều kiện lọc
      },
      {
        $lookup: {
        from: 'QLC_OrganizeDetail',
        localField: 'dv_quan_ly',
        foreignField: 'id',
        as: 'organizeDetail'
        }
      },
      {
        $group: {
          _id: '$id_vitri',
          vi_tri_ts: { $first: '$vi_tri' },
          don_vi_quan_ly: { $first: { $arrayElemAt: ["$organizeDetail.organizeDetailName", 0] } },
          id_don_vi_quan_li: { $first: '$dv_quan_ly' },
          ghi_chu: { $first: '$ghi_chu_vitri' },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ]);
    if (data) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].id_don_vi_quan_li) {
          //kiem tra don vi quan ly la cty khong
          if (data[i].id_don_vi_quan_li == com_id) {
            if (data[i].id_don_vi_quan_li != 0 && typeof data[i].id_don_vi_quan_li !== "string" ) {
              let com_id_sd = await User.findOne({ _id: data[i].id_don_vi_quan_li }, { userName: 1 })
              if (com_id_sd) data[i].don_vi_quan_ly= com_id_sd.userName
              else data[i].don_vi_quan_ly= "Chưa cập nhật"
              }
            }
          }
        }
      }

      const VitriTS_xlsx = [
            ['STT', 'Vị trí tài sản', 'Đơn vị quản lý', 'Ghi chú']
            ];
        for (let i = 0; i < data.length; i++) {
            const row = [
            i + 1,
            data[i].vi_tri_ts,
            data[i].don_vi_quan_ly,
            data[i].ghi_chu,
            ];
            VitriTS_xlsx.push(row);
        }
        qltsService.excel(VitriTS_xlsx, "ViTriTS", res);
  } catch (error) {
    console.log(error);
    return functions.setError(res, error.message)
  }
}

exports.show = async (req, res) => {
  try {
    let { id_vitri, page, perPage } = req.body;
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    page = parseInt(page) || 1; // Trang hiện tại (mặc định là trang 1)
    perPage = parseInt(perPage) || 10; // Số lượng bản ghi trên mỗi trang (mặc định là 10)
    let matchQuery = {
      id_cty: com_id, // Lọc theo com_id
    };
    if (id_vitri) {
      matchQuery.id_vitri = parseInt(id_vitri); // Lọc theo id_vitri nếu có
    }

    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;

    let data = await ViTriTs.aggregate([
      {
        $match: matchQuery, // Áp dụng các điều kiện lọc
      },
      {
        $lookup: {
        from: 'QLC_OrganizeDetail',
        localField: 'dv_quan_ly',
        foreignField: 'id',
        as: 'organizeDetail'
        }
      },
      {
        $group: {
          _id: '$id_vitri',
          vi_tri_ts: { $first: '$vi_tri' },
          don_vi_quan_ly: { $first: { $arrayElemAt: ["$organizeDetail.organizeDetailName", 0] } },
          id_don_vi_quan_li: { $first: '$dv_quan_ly' },
          ghi_chu: { $first: '$ghi_chu_vitri' },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $skip: startIndex, // Bỏ qua các bản ghi từ startIndex
      },
      {
        $limit: perPage, // Giới hạn số lượng bản ghi trả về là perPage
      },
    ]);
    if (data) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].id_don_vi_quan_li) {
          //kiem tra don vi quan ly la cty khong
          if (data[i].id_don_vi_quan_li == com_id) {
            if (data[i].id_don_vi_quan_li != 0 && typeof data[i].id_don_vi_quan_li !== "string" ) {
              let com_id_sd = await User.findOne({ idQLC: data[i].id_don_vi_quan_li ,type : 1 }, { userName: 1 })
              if (com_id_sd) data[i].don_vi_quan_ly= com_id_sd.userName
              else data[i].don_vi_quan_ly= "Chưa cập nhật"
          }

        }
      }
    }

    const totalItems = await ViTriTs.countDocuments(matchQuery); // Tổng số bản ghi

    const totalPages = Math.ceil(totalItems / perPage); // Tổng số trang

    const hasNextPage = endIndex < totalItems; // Kiểm tra xem còn trang kế tiếp hay không

    return functions.success(res, 'get data success', { data, totalItems, totalPages, hasNextPage });
    }
    return functions.setError(res, "have no data")
  } catch (error) {
    console.log(error);
    return functions.setError(res, error.message);
  }
};

exports.detailsVT = async (req, res) => {
  try {
    let { id_vitri } = req.body;
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    let details = await ViTriTs.findOne({ id_vitri: id_vitri, id_cty: com_id }).select('id_vitri vi_tri ghi_chu_vitri')
    if (!details) {
      return functions.setError(res, 'không tìm thấy bản ghi phù hợp ', 400);
    }
    let dp_list = await Depament.find({ com_id: com_id }).select('dep_id dep_name')
    if (!dp_list) {
      dp_list = '';
    }
    return functions.success(res, 'get data success', { details, dp_list })
  } catch (e) {
    console.log(e);
    return functions.setError(res, e.message)
  }
}

exports.deleteVT = async (req, res) => {
  try {
    let { id_vitri } = req.body;
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
      ts_id_ng_xoa = req.user.data.idQLC;

    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    let idArraya = id_vitri.map(idItem => parseInt(idItem));
    if (!idArraya.every(num => !isNaN(num))) {
      return functions.setError(res, 'id_vitri không hợp lệ', 400);
    }
    let result = await ViTriTs.deleteMany({ id_vitri: { $in: idArraya }, id_cty: com_id });
    if (result.deletedCount === 0) {
      return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để xóa', 400);
    }
    return functions.success(res, 'xóa thành công!');
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message);
  }
};

exports.editVT = async (req, res) => {
  try {
    let { id_vitri, vi_tri, dv_quan_ly, ghi_chu_vitri } = req.body;
    let com_id = '';
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id;
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400);
    }
    if (!id_vitri) {
      return functions.setError(res, 'id_vitri không được bỏ trống', 400);
    }
    if (!vi_tri) {
      return functions.setError(res, 'tên vị trí  không được bỏ trống', 400);
    }
    if (!dv_quan_ly) {
      return functions.setError(res, 'dv_quan_ly  không được bỏ trống', 400);
    }

    let chinhsuaVT = await ViTriTs.findOneAndUpdate(
      { id_vitri: id_vitri, id_cty: com_id },
      {
        $set: {
          vi_tri: vi_tri,
          dv_quan_ly: dv_quan_ly,
          ghi_chu_vitri: ghi_chu_vitri
        }
      },
      { new: true }
    );
    if (!chinhsuaVT) {
      return functions.setError(res, 'Không tìm thấy bản ghi phù hợp để thay đổi', 400);
    }
    return functions.success(res, 'edit data success', { chinhsuaVT });
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message);
  }
}

