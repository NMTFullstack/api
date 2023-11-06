const TaiSan = require('../../models/QuanLyTaiSan/TaiSan')
const ViTri_ts = require('../../models/QuanLyTaiSan/ViTri_ts')
const LoaiTaiSan = require('../../models/QuanLyTaiSan/LoaiTaiSan')
const quanlytaisanService = require('../../services/QLTS/qltsService')
const NhomTs = require('../../models/QuanLyTaiSan/NhomTaiSan')
const TaiSanViTri = require('../../models/QuanLyTaiSan/TaiSanVitri')
const User = require('../../models/Users')
const functions = require('../../services/functions')
const serviceQLTS = require('../../services/QLTS/qltsService')
const KhauHao = require('../../models/QuanLyTaiSan/KhauHao')
const TepDinhKem = require('../../models/QuanLyTaiSan/TepDinhKem')
const SuaChua = require('../../models/QuanLyTaiSan/Sua_chua')
const BaoDuong = require('../../models/QuanLyTaiSan/BaoDuong')
const PhanBo = require('../../models/QuanLyTaiSan/PhanBo')
const QuaTrinhSuDung = require('../../models/QuanLyTaiSan/QuaTrinhSuDung')
const GhiTang = require('../../models/QuanLyTaiSan/GhiTang_TS')
const CapPhat = require('../../models/QuanLyTaiSan/CapPhat')
const ThuHoi = require('../../models/QuanLyTaiSan/ThuHoi')
const ThongBao = require('../../models/QuanLyTaiSan/ThongBao')
const DieuChuyen = require('../../models/QuanLyTaiSan/DieuChuyen')
const Mat = require('../../models/QuanLyTaiSan/Mat')
const Huy = require('../../models/QuanLyTaiSan/Huy')
const ThanhLy = require('../../models/QuanLyTaiSan/ThanhLy')
const TaiSanDangSuDung = require('../../models/QuanLyTaiSan/TaiSanDangSuDung')
const fs = require('fs')
const iconv = require('iconv-lite')
const OrganizeDetail = require('../../models/qlc/OrganizeDetail')

exports.showAll = async (req, res) => {
  try {
    let {
      page,
      perPage,
      ts_ten,
      id_loai_ts,
      ts_vi_tri,
      ts_id,
      id_ten_quanly,
      ts_trangthai,
      com_id,
      excel,
    } = req.body
    let cid = ''
    if (com_id) {
      cid = req.body.com_id
    } else {
      cid = req.user.data.com_id
    }
    page = parseInt(page) || 1 // Trang hiện tại (mặc định là trang 1)
    perPage = parseInt(perPage) || 10 // Số lượng bản ghi trên mỗi trang (mặc định là 10)

    // Tính toán startIndex và endIndex
    const startIndex = (page - 1) * perPage
    const endIndex = page * perPage

    let matchQuery = {
      id_cty: Number(cid), // Lọc theo com_id
      ts_da_xoa: 0,
    }
    if (ts_ten) {
      matchQuery.ts_ten = { $regex: ts_ten, $options: 'i' }
    }
    if (ts_id) {
      matchQuery.ts_id = Number(ts_id)
    }
    if (id_loai_ts) {
      matchQuery.id_loai_ts = parseInt(id_loai_ts)
    }
    if (ts_vi_tri) {
      matchQuery.ts_vi_tri = parseInt(ts_vi_tri)
    }
    if (id_ten_quanly) {
      matchQuery.id_dv_quanly = parseInt(id_ten_quanly)
    }
    if (ts_trangthai == 0) {
      //chua su dung
      matchQuery.ts_trangthai = 0
    }
    if (ts_trangthai == 1) {
      // dang su dung
      matchQuery.ts_trangthai = 1
    }
    let cond = {} // danh sach thu hoi
    if (ts_trangthai == 2) {
      cond.ts_trangthai = 1
      cond['thuhoi.thuhoi_ngay'] = { $exists: true }
    }
    let searchTs = await TaiSan.aggregate([
      {
        $match: matchQuery,
      },
      { $sort: { ts_id: -1 } },
      {
        $lookup: {
          from: 'QLTS_Loai_Tai_San',
          localField: 'id_loai_ts',
          foreignField: 'id_loai',
          as: 'name_loai',
        },
      },
      {
        $lookup: {
          from: 'QLTS_ViTri_ts',
          localField: 'ts_vi_tri',
          foreignField: 'id_vitri',
          as: 'name_vitri',
        },
      },
      {
        $lookup: {
          from: 'QLTS_ThuHoi',
          localField: 'ts_id',
          foreignField: 'thuhoi_taisan.ds_thuhoi.ts_id',
          as: 'thuhoi',
        },
      },

      {
        $unwind: {
          path: '$thuhoi',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: cond,
      },
      {
        $lookup: {
          from: 'QLTS_Cap_Phat',
          localField: 'ts_id',
          foreignField: 'cap_phat_taisan.ds_ts.ts_id',
          as: 'cap_phat',
        },
      },
      {
        $unwind: {
          path: '$cap_phat',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Users',
          localField: 'id_ten_quanly',
          foreignField: '_id',
          as: 'name_User',
        },
      },
      // {
      //   $unwind: {
      //     path: '$name_User',
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $lookup: {
          from: 'Users',
          localField: 'id_dv_quanly',
          foreignField: '_id',
          as: 'name_dvql',
        },
      },
      {
        $unwind: {
          path: '$name_dvql',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: '$ts_id',
          ts_id: { $first: '$ts_id' },
          ts_ten: { $first: '$ts_ten' },
          id_nguoi_cam: { $first: '$id_ten_quanly' },
          ten_nguoi_cam: {
            $first: { $arrayElemAt: ['$name_User.userName', 0] },
          },
          tong_so_luong: { $first: '$sl_bandau' },
          so_luong_cap_phat: { $first: '$soluong_cp_bb' },
          // {
          //   $sum: {
          //     $cond: [{ $eq: ['$cap_phat.cp_da_xoa', 0] }, { $size: '$cap_phat.cap_phat_taisan.ds_ts.ts_id' }, 0],
          //   },
          // },
          so_luong_thu_hoi: { $first: '$soluong_th_bb' },
          // {
          //   $sum: {
          //     $cond: [{ $eq: ['$thuhoi.xoa_thuhoi', 0] }, { $size: '$thuhoi.thuhoi_taisan.ds_thuhoi.ts_id' }, 0],
          //   },
          // },
          don_vi_cung_cap: { $first: '$ts_don_vi' },
          so_luong_con_lai: { $first: '$ts_so_luong' },
          loai_ts: { $first: { $arrayElemAt: ['$name_loai.ten_loai', 0] } },
          gia_tri: { $first: '$ts_gia_tri' },
          tinh_trang_su_dung: { $first: '$ts_trangthai' },
          don_vi_tinh: { $first: '$don_vi_tinh' },
          ghi_chu: { $first: '$ghi_chu' },
          id_loai_ts: { $first: '$id_loai_ts' },
          id_ng_quan_ly: { $last: '$id_dv_quanly' },
          ten_ng_quan_ly: { $first: '$name_dvql.userName' },
          id_ng_thuhoi: { $first: '$thuhoi.id_ng_thuhoi' },
          thuhoi_ngay: { $first: '$thuhoi.thuhoi_ngay' },
          trang_thai_thu_hoi: { $first: '$thuhoi.thuhoi_trangthai' },
          vi_tri_tai_san: {
            $first: { $arrayElemAt: ['$name_vitri.vi_tri', 0] },
          },
          id_vi_tri: { $first: { $arrayElemAt: ['$name_vitri.id_vitri', 0] } },
        },
      },
      {
        $sort: {
          ts_id: -1,
        },
      },
      {
        $skip: startIndex,
      },
      {
        $limit: perPage,
      },
    ])
    if (searchTs) {
      for (let i = 0; i < searchTs.length; i++) {
        if (
          searchTs[i].id_ng_quan_ly != 0 &&
          typeof searchTs[i].id_ng_quan_ly !== 'string'
        ) {
          let id_ng_quan_ly = await User.findOne(
            { _id: searchTs[i].id_ng_quan_ly },
            { userName: 1 }
          )
          if (id_ng_quan_ly) searchTs[i].ten_ng_quan_ly = id_ng_quan_ly.userName
          else searchTs[i].ten_ng_quan_ly = null
        }
        if (
          searchTs[i].id_ng_thuhoi != 0 &&
          typeof searchTs[i].id_ng_thuhoi !== 'string'
        ) {
          let id_ng_quan_ly = await User.findOne(
            { _id: searchTs[i].id_ng_thuhoi },
            { userName: 1 }
          )
          if (id_ng_quan_ly) searchTs[i].ten_ng_thuHoi = id_ng_quan_ly.userName
          else searchTs[i].ten_ng_thuHoi = null
        }
        if (searchTs[i].thuhoi_ngay != 0)
          searchTs[i].thuhoi_ngay = new Date(searchTs[i].thuhoi_ngay * 1000)
      }
      // Lấy tổng số lượng tài sản
      const totalTsCount = await TaiSan.countDocuments(matchQuery)

      // Tính toán số trang và kiểm tra xem còn trang kế tiếp hay không
      const totalPages = Math.ceil(totalTsCount / perPage)
      const hasNextPage = endIndex < totalTsCount

      return functions.success(res, 'get data success', {
        searchTs,
        totalPages,
        totalTsCount,
        hasNextPage,
      })
    }
    return functions.setError(res, 'khong co du lieu')
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}
exports.ExportExcel = async (req, res, next) => {
  try {
    const com_id = Number(req.params._id)
    let searchTs = await TaiSan.aggregate([
      {
        $match: {
          id_cty: com_id, // Lọc theo com_id
          ts_da_xoa: 0,
        },
      },
      { $sort: { ts_id: -1 } },
      {
        $lookup: {
          from: 'QLTS_Loai_Tai_San',
          localField: 'id_loai_ts',
          foreignField: 'id_loai',
          as: 'name_loai',
        },
      },
      {
        $lookup: {
          from: 'QLTS_ViTri_ts',
          localField: 'ts_vi_tri',
          foreignField: 'id_vitri',
          as: 'name_vitri',
        },
      },
      {
        $lookup: {
          from: 'QLTS_ThuHoi',
          localField: 'ts_id',
          foreignField: 'thuhoi_taisan.ds_thuhoi.ts_id',
          as: 'thuhoi',
        },
      },

      {
        $unwind: {
          path: '$thuhoi',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'QLTS_Cap_Phat',
          localField: 'ts_id',
          foreignField: 'cap_phat_taisan.ds_ts.ts_id',
          as: 'cap_phat',
        },
      },
      {
        $unwind: {
          path: '$cap_phat',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Users',
          localField: 'id_ten_quanly',
          foreignField: '_id',
          as: 'name_User',
        },
      },
      // {
      //   $unwind: {
      //     path: '$name_User',
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $lookup: {
          from: 'Users',
          localField: 'id_dv_quanly',
          foreignField: '_id',
          as: 'name_dvql',
        },
      },
      {
        $unwind: {
          path: '$name_dvql',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: '$ts_id',
          ts_id: { $first: '$ts_id' },
          ts_ten: { $first: '$ts_ten' },
          id_nguoi_cam: { $first: '$id_ten_quanly' },
          ten_nguoi_cam: {
            $first: { $arrayElemAt: ['$name_User.userName', 0] },
          },
          tong_so_luong: { $first: '$sl_bandau' },
          so_luong_cap_phat: { $first: '$soluong_cp_bb' },
          // {
          //   $sum: {
          //     $cond: [{ $eq: ['$cap_phat.cp_da_xoa', 0] }, { $size: '$cap_phat.cap_phat_taisan.ds_ts.ts_id' }, 0],
          //   },
          // },
          so_luong_thu_hoi: { $first: '$soluong_th_bb' },
          // {
          //   $sum: {
          //     $cond: [{ $eq: ['$thuhoi.xoa_thuhoi', 0] }, { $size: '$thuhoi.thuhoi_taisan.ds_thuhoi.ts_id' }, 0],
          //   },
          // },
          don_vi_cung_cap: { $first: '$ts_don_vi' },
          so_luong_con_lai: { $first: '$ts_so_luong' },
          loai_ts: { $first: { $arrayElemAt: ['$name_loai.ten_loai', 0] } },
          gia_tri: { $first: '$ts_gia_tri' },
          tinh_trang_su_dung: { $first: '$ts_trangthai' },
          don_vi_tinh: { $first: '$don_vi_tinh' },
          ghi_chu: { $first: '$ghi_chu' },
          id_loai_ts: { $first: '$id_loai_ts' },
          id_ng_quan_ly: { $last: '$id_dv_quanly' },
          ten_ng_quan_ly: { $first: '$name_dvql.userName' },
          id_ng_thuhoi: { $first: '$thuhoi.id_ng_thuhoi' },
          thuhoi_ngay: { $first: '$thuhoi.thuhoi_ngay' },
          trang_thai_thu_hoi: { $first: '$thuhoi.thuhoi_trangthai' },
          vi_tri_tai_san: {
            $first: { $arrayElemAt: ['$name_vitri.vi_tri', 0] },
          },
          id_vi_tri: { $first: { $arrayElemAt: ['$name_vitri.id_vitri', 0] } },
        },
      },
      {
        $sort: {
          ts_id: -1,
        },
      },
    ])
    if (searchTs) {
      for (let i = 0; i < searchTs.length; i++) {
        if (
          searchTs[i].id_ng_quan_ly != 0 &&
          typeof searchTs[i].id_ng_quan_ly !== 'string'
        ) {
          let id_ng_quan_ly = await User.findOne(
            { _id: searchTs[i].id_ng_quan_ly },
            { userName: 1 }
          )
          if (id_ng_quan_ly) searchTs[i].ten_ng_quan_ly = id_ng_quan_ly.userName
          else searchTs[i].ten_ng_quan_ly = null
        }
        if (
          searchTs[i].id_ng_thuhoi != 0 &&
          typeof searchTs[i].id_ng_thuhoi !== 'string'
        ) {
          let id_ng_quan_ly = await User.findOne(
            { _id: searchTs[i].id_ng_thuhoi },
            { userName: 1 }
          )
          if (id_ng_quan_ly) searchTs[i].ten_ng_thuHoi = id_ng_quan_ly.userName
          else searchTs[i].ten_ng_thuHoi = null
        }
        if (searchTs[i].thuhoi_ngay != 0)
          searchTs[i].thuhoi_ngay = new Date(searchTs[i].thuhoi_ngay * 1000)
      }

      let trangThai = 'Chưa sử dụng'
      if (searchTs.tinh_trang_su_dng == 1) trangThai = 'đang sử dụng'
      const TaiSan_xlsx = [
        [
          'STT',
          'Mã tài sản',
          'Tên tài sản',
          'Người cầm',
          'Tổng số lượng',
          'Số lượng cấp phát',
          'Số lượng thu hồi',
          'Số lượng còn lại',
          'Loại tài sản',
          'Giá trị',
          'Tình trạng',
          'Đơn vị quản lý',
          'Vị trí tài sản',
        ],
      ]
      for (let i = 0; i < searchTs.length; i++) {
        const row = [
          i + 1,
          searchTs[i].ts_id,
          searchTs[i].ts_ten,
          searchTs[i].ten_ng_quan_ly,
          searchTs[i].tong_so_luong,
          searchTs[i].so_luong_cap_phat,
          searchTs[i].so_luong_thu_hoi,
          searchTs[i].so_luong_con_lai,
          searchTs[i].loai_ts,
          searchTs[i].gia_tri,
          trangThai,
          searchTs[i].ten_ng_quan_ly,
          searchTs[i].vi_tri_tai_san,
        ]
        TaiSan_xlsx.push(row)
      }
      quanlytaisanService.excel(TaiSan_xlsx, 'DanhSachTaiSan', res)
    }
  } catch (error) {
    console.log(error)
    return functions.setError(res, error.message)
  }
}
exports.showDataSearch = async (req, res) => {
  try {
    let com_id = ''
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    let checktaisan = await TaiSan.distinct('id_ten_quanly', { id_cty: com_id })
    let listTaiSan = await TaiSan.find({ id_cty: com_id, ts_da_xoa: 0 }).select(
      'ts_id ts_ten'
    )
    let listUser = await User.find({
      'inForPerson.employee.com_id': com_id,
      _id: { $in: checktaisan },
    }).select('_id userName')
    let listVitri = await ViTri_ts.find({ id_cty: com_id }).select(
      'id_vitri vi_tri'
    )
    let listloaiTaiSan = await LoaiTaiSan.find({
      id_cty: com_id,
      loai_da_xoa: 0,
    }).select('id_loai ten_loai')
    let listNhom = await NhomTs.find({ id_cty: com_id, nhom_da_xoa: 0 }).select(
      'id_nhom ten_nhom'
    )
    let item = {
      totalTaiSan: listTaiSan.length,
      totalVitri: listVitri.length,
      totalloaiTaiSan: listloaiTaiSan.length,
      totalNhom: listNhom.length,
      listNhom,
      listUser,
      listVitri,
      listloaiTaiSan,
      listTaiSan,
    }
    return functions.success(res, 'get data success', { item })
  } catch (e) {
    return functions.setError(res, e.message)
  }
}
//danh sach tai san dang su dung
exports.showDataCapitalUsed = async (req, res) => {
  try {
    const com_id = req.user.data.com_id
    let page = Number(req.body.page) || 1
    let pageSize = Number(req.body.pageSize) || 10
    let id_ts = req.body.id_ts
    let id_nv_sd = req.body.id_nv_sd
    let id_pb_sd = req.body.id_pb_sd
    let ts_ten = req.body.ts_ten
    const skip = (page - 1) * pageSize
    const limit = pageSize
    let cond = {}
    cond.com_id_sd = com_id
    cond.sl_dang_sd = { $gt: 0 }
    if (id_ts) cond.id_ts_sd = Number(id_ts)
    if (id_nv_sd) cond.id_nv_sd = Number(id_nv_sd)
    if (id_pb_sd) cond.id_pb_sd = Number(id_pb_sd)
    let cond1 = {}
    if (ts_ten) {
      cond1.capital_name = { $regex: ts_ten, $options: 'i' }
    }
    let data = await TaiSanDangSuDung.aggregate([
      { $match: cond },
      { $sort: { id_sd: -1 } },
      {
        $lookup: {
          from: 'QLTS_Tai_San',
          localField: 'id_ts_sd',
          foreignField: 'ts_id',
          as: 'infoTS',
        },
      },
      { $unwind: { path: '$infoTS', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'Users',
          localField: 'id_nv_sd',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'QLC_OrganizeDetail',
          localField: 'id_pb_sd',
          foreignField: 'id',
          as: 'dep',
        },
      },
      { $unwind: { path: '$dep', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          idQLC_emp: '$user.idQLC',
          emp_name: '$user.userName',
          dep_name: '$dep.organizeDetailName',
          id_QLC: '$user.idQLC',
          capital_name: '$infoTS.ts_ten',
          sl_tai_san_con_lai: '$infoTS.ts_so_luong',
          id_vi_tri_tai_san: '$infoTS.ts_vi_tri',
          Ma_tai_san: '$infoTS.ts_id',
          idbb: '$id_sd',
          com_id_sd: 1,
          id_nv_sd: 1,
          id_pb_sd: 1,
          com_id_sd: 1,
          sl_dang_sd: 1,
          day_bd_sd: 1,
          tinhtrang_ts: 1,
        },
      },
      { $match: cond1 },
      {
        $facet: {
          paginatedResults: [{ $skip: skip }, { $limit: limit }],
          totalCount: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ])
    let result = {}
    let totalCount = 0
    if (data[0].totalCount.length > 0) {
      result = data[0].paginatedResults
      totalCount = data[0].totalCount[0].count
      for (let i = 0; i < result.length; i++) {
        result[i].cp_ngay = new Date(result[i].day_bd_sd * 1000)
        let com_id_sd = await User.findOne(
          { idQLC: result[i].com_id_sd, type: 1 },
          { userName: 1 }
        )
        if (com_id_sd) result[i].name_com_sd = com_id_sd.userName
        else result[i].name_com_sd = null
        if (
          result[i].id_vi_tri_tai_san != 0 &&
          typeof result[i].id_vi_tri_tai_san == 'number'
        ) {
          let listVitri = await ViTri_ts.findOne({
            id_vitri: result[i].id_vi_tri_tai_san,
          }).select('id_vitri vi_tri')
          if (listVitri) result[i].ten_vitri_tai_san = listVitri.vi_tri
          else result[i].ten_vitri_tai_san = null
        }
      }
    }
    return functions.success(res, ' lấy thành công ', { result, totalCount })
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}

// Đổ dữ liệu thêm mới tài sản
exports.showadd = async (req, res) => {
  try {
    let com_id = ''
    if ((req.user.data.type = 1 || req.user.data.type == 2)) {
      com_id = req.user.data.com_id
      let checktaisan = await TaiSan.distinct('id_ten_quanly', {
        id_cty: com_id,
      })
      let listUser = await User.find({
        $or: [{ 'inForPerson.employee.com_id': com_id }, { idQLC: com_id }],
      }).select('_id userName')
      let listVitri = await ViTri_ts.find({ id_cty: com_id }).select(
        'id_vitri vi_tri'
      )
      let listloaiTaiSan = await LoaiTaiSan.find({ id_cty: com_id }).select(
        'id_loai ten_loai'
      )
      let item = {
        listUser,
        listVitri,
        listloaiTaiSan,
      }
      return functions.success(res, 'get data success', { item })
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

exports.addTaiSan = async (req, res) => {
  try {
    let {
      id_loai_ts,
      id_dv_quanly,
      ts_ten,
      ts_so_luong,
      soluong_cp_bb,
      ts_gia_tri,
      ts_don_vi,
      ts_vi_tri,
      ts_trangthai,
      ts_da_xoa,
      don_vi_tinh,
      ghi_chu,
    } = req.body
    let createDate = Math.floor(Date.now() / 1000)
    let com_id = ''
    let id_ten_quanly = ''
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
      id_ten_quanly = req.user.data._id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }

    const validationResult = quanlytaisanService.validateTaiSanInput(
      ts_ten,
      id_dv_quanly,
      id_ten_quanly,
      id_loai_ts
    )

    const checkidNhom = await LoaiTaiSan.findOne({
      id_loai: id_loai_ts,
      loai_da_xoa: 0,
      id_cty: com_id,
    }).select('id_nhom_ts')
    if (!checkidNhom) {
      // Xử lý lỗi hoặc thông báo không tìm thấy nhóm tài sản tương ứng
      return functions.setError(
        res,
        'Không tìm thấy nhóm tài sản tương ứng với id_loai_ts để thêm mới',
        400
      )
    }
    // let checkidVitri = await ViTri_ts.findOne({ id_vitri: ts_vi_tri, id_cty: com_id }).select('id_vitri')
    // if (!checkidVitri) {
    //   return functions.setError(res, 'Không tìm thấy vị trí tài sản tương ứng để thêm mới ', 400);
    // }
    if (validationResult === true) {
      let maxID = await quanlytaisanService.getMaxID(TaiSan)
      let ts_id = Number(maxID) + 1
      let createNew = new TaiSan({
        ts_id: ts_id,
        id_cty: com_id,
        id_loai_ts: id_loai_ts,
        id_nhom_ts: checkidNhom.id_nhom_ts,
        id_dv_quanly: id_dv_quanly,
        id_ten_quanly: id_ten_quanly,
        ts_ten: ts_ten,
        sl_bandau: ts_so_luong,
        ts_so_luong: ts_so_luong,
        soluong_cp_bb: soluong_cp_bb,
        ts_gia_tri: ts_gia_tri,
        ts_don_vi: ts_don_vi,
        ts_vi_tri: ts_vi_tri,
        ts_trangthai: ts_trangthai,
        ts_da_xoa: ts_da_xoa,
        ts_date_create: createDate,
        don_vi_tinh: don_vi_tinh,
        ghi_chu: ghi_chu,
      })
      let save = await createNew.save()
      let maxIDTSVT = await quanlytaisanService.getMaxIDTSVT(TaiSanViTri)
      let tsvt_id = Number(maxIDTSVT) + 1 || 1
      let createNewTSVT = new TaiSanViTri({
        tsvt_id: tsvt_id,
        tsvt_cty: save.id_cty,
        tsvt_taisan: save.ts_id,
        tsvt_vitri: save.ts_vi_tri,
        tsvt_soluong: ts_so_luong,
      })
      let saveTSVT = await createNewTSVT.save()
      return functions.success(res, 'save data success', { save, saveTSVT })
    }
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}

exports.showCTts = async (req, res) => {
  try {
    let { ts_id } = req.body
    let com_id = ''
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    if (typeof ts_id === 'undefined') {
      return functions.setError(res, 'id tài sản không được bỏ trống', 400)
    }
    if (isNaN(Number(ts_id))) {
      return functions.setError(res, 'id tài phải là một số', 400)
    }

    let checkts = await TaiSan.findOne({ ts_id: ts_id, id_cty: com_id })
    if (!checkts) {
      return functions.setError(res, 'Không tìm thấy tài sản', 404)
    }
    //xu li ten donvi quan li
    let nameDVQL = null
    let id_ng_quan_ly = await User.findOne(
      { _id: checkts.id_dv_quanly },
      { userName: 1 }
    )
    if (id_ng_quan_ly) nameDVQL = id_ng_quan_ly.userName

    let checkloaiTaiSan = await LoaiTaiSan.findOne({
      id_loai: checkts.id_loai_ts,
      id_cty: com_id,
    })
    if (!checkloaiTaiSan) {
      checkloaiTaiSan = ''
    }
    let chekNhom = await NhomTs.findOne({
      id_nhom: checkloaiTaiSan.id_nhom_ts,
      id_cty: com_id,
    })

    if (!chekNhom) {
      chekNhom = ''
    }
    let chekVitri = await ViTri_ts.findOne({
      id_vitri: checkts.ts_vi_tri,
      id_cty: com_id,
    }).select('vi_tri ')
    if (!chekVitri) {
      chekVitri = ''
    }
    let checkUser = await User.findOne({
      _id: checkts.id_ten_quanly,
      $or: [{ 'inForPerson.employee.com_id': com_id }, { idQLC: com_id }],
    }).select('userName')
    if (!checkUser) {
      checkUser = ''
    }
    let checkGhiTang = await GhiTang.findOne({ id_ts: checkts.ts_id }).select(
      'sl_tang -_id'
    )
    let checkCapPhat = await CapPhat.findOne({
      'cap_phat_taisan.ds_ts': { $elemMatch: { ts_id: checkts.ts_id } },
      id_cty: com_id,
      cp_da_xoa: 0,
    }).select('cap_phat_taisan')
    if (!checkCapPhat) {
      checkCapPhat = { cap_phat_taisan: { ds_ts: [] } }
    }
    let checkThuHoi = await ThuHoi.findOne({
      'thuhoi_taisan.ds_thuhoi': { $elemMatch: { ts_id: checkts.ts_id } },
      id_cty: com_id,
      xoa_thuhoi: 0,
    }).select('thuhoi_taisan')
    if (!checkThuHoi) {
      checkThuHoi = { thuhoi_taisan: { ds_thuhoi: [] } }
    }
    let items = [
      {
        ma_tai_san: checkts.ts_id,
        id_loai_ts: checkts.id_loai_ts,
        id_vi_tri_ts: checkts.ts_vi_tri,
        don_vi_tinh: checkts.don_vi_tinh,
        ten_tai_san: checkts.ts_ten,
        so_luong: checkts.sl_bandau,
        so_luong_da_ghi_tang: checkGhiTang
          ? checkGhiTang.sl_tang
          : 0 + ' ' + checkts.don_vi_tinh,
        gia_tri: checkts.ts_gia_tri + ' ' + 'VNĐ',
        so_luong_cap_phat: checkts.soluong_cp_bb + ' ' + checkts.don_vi_tinh,
        // so_luong_cap_phat: checkCapPhat.cap_phat_taisan.ds_ts.length + ' ' + checkts.don_vi_tinh,
        so_luong_thu_hoi: checkts.soluong_th_bb + ' ' + checkts.don_vi_tinh,
        // so_luong_thu_hoi: checkThuHoi.thuhoi_taisan.ds_thuhoi.length + ' ' + checkts.don_vi_tinh,
        so_luong_con_lai: checkts.ts_so_luong + ' ' + checkts.don_vi_tinh,
        don_vi_cung_cap: checkts.ts_don_vi,
        loai_tai_san: checkloaiTaiSan.ten_loai,
        nhom_tai_san: chekNhom.ten_nhom,
        tinh_trang: checkts.ts_trangthai,
        ten_don_vi_quan_ly: nameDVQL,
        id_don_vi_quan_ly: checkts.id_dv_quanly,
        nguoi_quan_ly: checkUser,
        vi_tri_tai_san: chekVitri.vi_tri,
        ghi_chu: checkts.ghi_chu,
      },
    ]

    return functions.success(res, 'Lấy dữ liệu thành công', { items })
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}

exports.deleteTs = async (req, res) => {
  try {
    let { type, ts_id } = req.body
    let com_id = ''
    let ts_id_ng_xoa = ''
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
      ts_id_ng_xoa = req.user.data._id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    const deleteDate = Math.floor(Date.now() / 1000)
    if (!ts_id.every((num) => !isNaN(parseInt(num)))) {
      return functions.setError(res, 'ts_id không hợp lệ', 400)
    }
    if (type == 1) {
      // xóa vĩnh viễn
      let idArraya = ts_id.map((idItem) => parseInt(idItem))
      let result = await TaiSan.deleteMany({
        ts_id: { $in: idArraya },
        id_cty: com_id,
      })
      if (result.deletedCount === 0) {
        return functions.setError(
          res,
          'Không tìm thấy bản ghi phù hợp để xóa',
          400
        )
      }
      return functions.success(res, 'xóa thành công!')
    } else if (type == 0) {
      // thay đổi trạng thái là 1
      let idArray = ts_id.map((idItem) => parseInt(idItem))
      let result = await TaiSan.updateMany(
        { ts_id: { $in: idArray }, ts_da_xoa: 0, id_cty: com_id },
        {
          ts_da_xoa: 1,
          ts_id_ng_xoa: ts_id_ng_xoa,
          ts_date_delete: deleteDate,
        }
      )
      if (result.nModified === 0) {
        return functions.setError(
          res,
          'Không tìm thấy bản ghi phù hợp để thay đổi',
          400
        )
      }
      return functions.success(
        res,
        'Bạn đã xóa thành công , hiện vào danh sách dã xóa !'
      )
    } else if (type == 2) {
      // Khôi phục tài sản
      let idArray = ts_id.map((idItem) => parseInt(idItem))
      let result = await TaiSan.updateMany(
        {
          ts_id: { $in: idArray },
          ts_da_xoa: 1,
          id_cty: com_id,
        },
        {
          ts_da_xoa: 0,
          ts_id_ng_xoa: 0,
          ts_date_delete: 0,
        }
      )
      if (result.nModified === 0) {
        return functions.setError(
          res,
          'Không tìm thấy bản ghi phù hợp để thay đổi',
          400
        )
      }
      return functions.success(res, 'Bạn đã khôi phục tài sản thành công!')
    } else {
      return functions.setError(res, 'không thể thực thi!', 400)
    }
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

exports.editTS = async (req, res) => {
  try {
    let {
      ts_vi_tri,
      ts_ten,
      ts_don_vi,
      ts_id,
      id_loai_ts,
      ts_so_luong,
      id_dv_quanly,
      ts_gia_tri,
      ts_trangthai,
      ghi_chu,
      don_vi_tinh,
    } = req.body

    let com_id = ''
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    const validationResult = quanlytaisanService.validateinputEdit(
      ts_ten,
      id_dv_quanly,
      id_loai_ts,
      ts_so_luong,
      ts_gia_tri,
      ts_trangthai
    )
    if (validationResult == true) {
      let check = await TaiSan.findOne({
        ts_id: Number(ts_id),
        id_cty: com_id,
      })
      if (check) {
        let checkSLBD = 0
        let checkSLCL = 0
        let num = Number(check.sl_bandau) - Number(check.ts_so_luong)
        if ((num = 0)) {
          checkSLBD = Number(ts_so_luong)
          checkSLCL = Number(ts_so_luong)
        } else {
          checkSLBD = Number(ts_so_luong)
          if (Number(ts_so_luong) > num) {
            checkSLCL = Number(ts_so_luong) - num
          } else {
            checkSLCL = 0
          }
        }
        await TaiSan.findOneAndUpdate(
          { ts_id: ts_id, id_cty: com_id, ts_da_xoa: 0 },
          {
            $set: {
              ts_ten: ts_ten,
              ts_don_vi: ts_don_vi,
              id_dv_quanly: id_dv_quanly,
              id_loai_ts: id_loai_ts,
              ts_vi_tri: ts_vi_tri,
              ts_so_luong: checkSLCL,
              don_vi_tinh: don_vi_tinh,
              sl_bandau: checkSLBD,
              ts_gia_tri: ts_gia_tri,
              ts_trangthai: ts_trangthai,
              ghi_chu: ghi_chu,
            },
          },
          { new: true }
        )
        return functions.success(res, 'sua thanh cong')
      }
      return functions.setError(res, 'khong tim thay tai san')
    }
  } catch (e) {
    return functions.setError(res, e.message)
  }
}

//hiển thị ghi tang
exports.showGhiTang = async (req, res) => {
  try {
    let { ts_id } = req.body
    let com_id = ''
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    if (typeof ts_id === 'undefined') {
      return functions.setError(res, 'id tài sản không được bỏ trống', 400)
    }
    if (isNaN(Number(ts_id))) {
      return functions.setError(res, 'id tài sản phải là một số', 400)
    }
    let checkGhiTang = await GhiTang.findOne({
      id_ts: ts_id,
      com_id: com_id,
    })
    if (!checkGhiTang) {
      return functions.setError(res, 'Biên bản ghi tăng không tồn tại', 400)
    }
    let checkNguoiTao = await User.findOne({
      _id: checkGhiTang.id_ng_tao,
      $or: [{ 'inForPerson.employee.com_id': com_id }, { idQLC: com_id }],
    }).select('userName')
    if (!checkNguoiTao) {
      checkNguoiTao = ''
    }
    let checkNguoiDuyet = await User.findOne({
      _id: checkGhiTang.id_ng_duyet,
      $or: [{ 'inForPerson.employee.com_id': com_id }, { idQLC: com_id }],
    }).select('userName')
    if (!checkNguoiDuyet) {
      checkNguoiDuyet = ''
    }
    let checkTaiSan = await TaiSan.findOne({
      ts_id: ts_id,
      id_cty: com_id,
    }).select('ts_ten')
    if (!checkTaiSan) {
      checkTaiSan = 0
    }
    let items = [
      {
        so_bien_ban: checkGhiTang.id_ghitang,
        nguoi_tao: checkNguoiTao,
        ngay_tao: checkGhiTang.day_tao,
        nguoi_duyet: checkNguoiDuyet,
        trang_thai: checkGhiTang.trang_thai_ghi_tang,
        ngay_duyet: checkGhiTang.day_duyet,
        ma_tai_san: ts_id,
        ten_tai_san: checkTaiSan,
        so_luong_tang: checkGhiTang.sl_tang,
        ghi_chu: checkGhiTang.gt_ghi_chu,
      },
    ]

    return functions.success(res, 'get data success', { items })
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}
// duyệt ghi tăng
exports.duyetHuyGhiTang = async (req, res) => {
  try {
    let { id_ghitang, type, lydo_tu_choi } = req.body
    let com_id = ''
    let id_nguoi_duyet = ''
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
      id_nguoi_duyet = req.user.data._id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    const createDate = Math.floor(Date.now() / 1000)
    let maxIdThongBao = await functions.getMaxIdByField(ThongBao, 'id_tb')
    let checkGhiTang = await GhiTang.findOne({
      id_ghitang: id_ghitang,
      com_id: com_id,
      xoa_ghi_tang: 0,
    })
    if (typeof id_ghitang === 'undefined') {
      return functions.setError(res, 'id ghi tăng không được bỏ trống', 400)
    }
    if (isNaN(Number(id_ghitang))) {
      return functions.setError(res, 'id ghi tăng phải là một số', 400)
    }
    if (type == 1) {
      //Duyệt ghi tăng
      let duyetGhiTang = await GhiTang.findOneAndUpdate(
        { id_ghitang: id_ghitang, com_id: com_id, xoa_ghi_tang: 0 },
        {
          $set: {
            id_ng_duyet: id_nguoi_duyet,
            trang_thai_ghi_tang: 3,
            day_duyet: createDate,
          },
        },
        { new: true }
      )
      if (!duyetGhiTang) {
        return functions.setError(res, 'Không tìm thấy bản ghi để duyệt', 400)
      }
      let createThongBao = new ThongBao({
        id_tb: maxIdThongBao,
        id_cty: com_id,
        id_ng_nhan: checkGhiTang.id_ng_tao,
        id_ng_tao: id_nguoi_duyet,
        loai_tb: 2,
        date_create: createDate,
      })
      let saveTSVT = await createThongBao.save()
      let checkTaiSan = await TaiSan.findOne({
        ts_id: checkGhiTang.id_ts,
        id_cty: com_id,
      }).select('ts_so_luong')
      let soluongmoi = checkTaiSan.ts_so_luong + checkGhiTang.sl_tang
      let updateTaiSan = await TaiSan.findOneAndUpdate(
        {
          ts_id: checkGhiTang.id_ts,
          id_cty: com_id,
        },
        {
          $set: {
            ts_so_luong: soluongmoi,
          },
        },
        { new: true }
      )
      if (!updateTaiSan) {
        return functions.setError(
          res,
          'Không tìm thấy bản ghi tài sản để cộng số lương',
          400
        )
      }

      return functions.success(res, 'duyệt thành công ', {
        duyetGhiTang,
        saveTSVT,
      })
    } else if (type == 2) {
      //từ chối ghi tăng
      let tuchoiGhiTang = await GhiTang.findOneAndUpdate(
        { id_ghitang: id_ghitang, com_id: com_id, xoa_ghi_tang: 0 },
        {
          $set: {
            id_ng_duyet: id_nguoi_duyet,
            trang_thai_ghi_tang: 2,
            lydo_tu_choi: lydo_tu_choi,
            day_duyet: createDate,
          },
        },
        { new: true }
      )
      if (!tuchoiGhiTang) {
        return functions.setError(res, 'Không tìm thấy bản ghi để từ chối', 400)
      }
      return functions.success(res, 'từ chối  thành công ', { tuchoiGhiTang })
    } else {
      return functions.setError(res, 'type xử lý không hợp lệ', 400)
    }
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}
// xóa ghi tăng
exports.XoaGhiTang = async (req, res) => {
  try {
    let { type, id_ghitang } = req.body
    let com_id = ''
    let id_ng_xoa = ''
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
      id_ghitang = req.user.data._id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    const deleteDate = Math.floor(Date.now() / 1000)
    if (!id_ghitang.every((num) => !isNaN(parseInt(num)))) {
      return functions.setError(res, 'id_ghitang không hợp lệ', 400)
    }
    if (type == 1) {
      // xóa vĩnh viễn
      let idArraya = id_ghitang.map((idItem) => parseInt(idItem))
      let result = await GhiTang.deleteMany({
        id_ghitang: { $in: idArraya },
        com_id: com_id,
      })
      if (result.deletedCount === 0) {
        return functions.setError(
          res,
          'Không tìm thấy bản ghi phù hợp để xóa',
          400
        )
      }
      return functions.success(res, 'xóa thành công!')
    } else if (type == 0) {
      // thay đổi trạng thái là 1
      let idArray = id_ghitang.map((idItem) => parseInt(idItem))
      let result = await GhiTang.updateMany(
        { id_ghitang: { $in: idArray }, xoa_ghi_tang: 0, com_id: com_id },
        {
          xoa_ghi_tang: 1,
          id_ng_xoa: id_ng_xoa,
          day_xoa: deleteDate,
        }
      )
      if (result.nModified === 0) {
        return functions.setError(
          res,
          'Không tìm thấy bản ghi phù hợp để thay đổi',
          400
        )
      }
      return functions.success(
        res,
        'Bạn đã xóa thành công , hiện vào danh sách dã xóa !'
      )
    } else if (type == 2) {
      // Khôi phục ghi tăng
      let idArray = id_ghitang.map((idItem) => parseInt(idItem))
      let result = await GhiTang.updateMany(
        {
          id_ghitang: { $in: idArray },
          xoa_ghi_tang: 1,
          com_id: com_id,
        },
        {
          xoa_ghi_tang: 0,
          id_ng_xoa: 0,
          day_xoa: 0,
        }
      )
      if (result.nModified === 0) {
        return functions.setError(
          res,
          'Không tìm thấy bản ghi phù hợp để thay đổi',
          400
        )
      }
      return functions.success(res, 'Bạn đã khôi phục ghi tăng thành công!')
    } else {
      return functions.setError(res, 'không thể thực thi!', 400)
    }
  } catch (e) {
    return functions.setError(res, e.message)
  }
}
// thêm ghi tăng
exports.addGhiTang = async (req, res) => {
  try {
    let { ts_id, sl_tang, ghi_chu } = req.body
    let com_id = ''
    let id_nguoi_tao = ''
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
      id_nguoi_tao = req.user.data._id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    const createDate = Math.floor(Date.now() / 1000)
    if (!ts_id) {
      return functions.setError(res, 'id tài sản không được bỏ trống', 400)
    }
    if (isNaN(Number(ts_id))) {
      return functions.setError(res, 'id tài sản phải là một số', 400)
    }
    if (!sl_tang) {
      return functions.setError(res, 'số lương tăng không được bỏ trống', 400)
    }
    if (isNaN(Number(sl_tang))) {
      return functions.setError(res, 'số lượng tăng phải là một số', 400)
    }
    let maxIdGhiTang = await functions.getMaxIdByField(GhiTang, 'id_ghitang')
    let maxIdThongBao = await functions.getMaxIdByField(ThongBao, 'id_tb')
    let maxIdQTSD = await functions.getMaxIdByField(
      QuaTrinhSuDung,
      'quatrinh_id'
    )
    let check = await TaiSan.findOne({ ts_id: ts_id })
    if (check) {
      await TaiSan.updateOne(
        {
          ts_id: ts_id,
        },
        {
          ts_so_luong: Number(check.ts_so_luong) + Number(sl_tang),
          sl_bandau: Number(check.sl_bandau) + Number(sl_tang),
        }
      )
    }
    let checkGT = await GhiTang.findOne({ id_ts: ts_id })
    if (checkGT) {
      await GhiTang.updateOne(
        {
          id_ts: ts_id,
        },
        {
          sl_tang: Number(checkGT.sl_tang) + Number(sl_tang),
        }
      )
      return functions.success(res, 'cap nhat sl ghi tang thành công ')
    } else {
      let createGt = new GhiTang({
        id_ghitang: maxIdGhiTang,
        id_ts: ts_id,
        sl_tang: sl_tang,
        id_ng_tao: id_nguoi_tao,
        ghi_chu: ghi_chu,
        day_tao: createDate,
      })
      let saveGT = await createGt.save()
      let createQTSD = new QuaTrinhSuDung({
        quatrinh_id: maxIdQTSD,
        id_bien_ban: saveGT.id_ghitang,
        so_lg: saveGT.sl_tang,
        id_cty: com_id,
        id_cty_sudung: com_id,
        qt_ngay_thuchien: saveGT.day_tao,
        qt_nghiep_vu: 9,
        ghi_chu: ghi_chu,
        time_created: createDate,
      })
      let saveQTSD = await createQTSD.save()
      let createThongBao = new ThongBao({
        id_tb: maxIdThongBao,
        id_cty: com_id,
        id_ng_nhan: id_nguoi_tao,
        id_ng_tao: com_id,
        loai_tb: 2,
        date_create: createDate,
      })
      let saveTSVT = await createThongBao.save()
      return functions.success(res, 'ghi tang thành công ', {
        saveGT,
        saveQTSD,
        saveTSVT,
      })
    }
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}
//sửa ghi tăng
exports.chinhSuaGhitang = async (req, res) => {
  try {
    let { id_ghitang, sl_tang, gt_ghi_chu } = req.body
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
      id_nguoi_duyet = req.user.data._id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    if (typeof id_ghitang === 'undefined') {
      return functions.setError(res, 'id ghi tăng không được bỏ trống', 400)
    }
    if (isNaN(Number(id_ghitang))) {
      return functions.setError(res, 'id ghi tăng phải là một số', 400)
    }
    if (typeof sl_tang === 'undefined') {
      return functions.setError(res, 'số lương tăng không được bỏ trống', 400)
    }
    if (isNaN(Number(sl_tang))) {
      return functions.setError(res, 'số lượng tăng phải là một số', 400)
    }
    let chinhsuaGhiTang = await GhiTang.findOneAndUpdate(
      { id_ghitang: id_ghitang, com_id: com_id, xoa_ghi_tang: 0 },
      {
        $set: {
          sl_tang: sl_tang,
          gt_ghi_chu: gt_ghi_chu,
        },
      },
      { new: true }
    )
    if (!chinhsuaGhiTang) {
      return functions.setError(res, 'Không tìm thấy bản ghi để chỉnh sửa', 400)
    }
    return functions.success(res, 'chỉnh sửa thành công ', { chinhsuaGhiTang })
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}

exports.quatrinhsd = async (req, res) => {
  try {
    let { ts_id, page, perPage, qt_nghiep_vu } = req.body

    page = parseInt(page) || 1
    perPage = parseInt(perPage) || 10
    let com_id = ''
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }

    const startIndex = (page - 1) * perPage
    const endIndex = page * perPage

    let matchQuery = {}
    if (qt_nghiep_vu) {
      const parsedNghiepVu = parseInt(qt_nghiep_vu)
      if (!isNaN(parsedNghiepVu)) {
        matchQuery.qt_nghiep_vu = parsedNghiepVu
      } else {
        return functions.setError(
          res,
          'qt_nghiep_vu phải là một số hợp lệ',
          400
        )
      }
    }
    matchQuery.id_cty = com_id // Lọc theo com_id
    if (ts_id) matchQuery.id_ts = Number(ts_id)
    let lookupTableName = ''
    let localField = ''
    let foreignField = ''
    let asField = ''
    let tinh_trang_sd = ''
    let checkTs = await QuaTrinhSuDung.find(matchQuery).lean()
    let listQuaTrinh = ''
    if (checkTs.length > 0) {
      for (let i = 0; i < checkTs.length; i++) {
        if (checkTs[i].qt_nghiep_vu == 1) {
          lookupTableName = 'QLTS_Cap_Phat'
          localField = 'id_bien_ban'
          foreignField = 'cp_id'
          asField = 'cap_phat'
          unwind = '$cap_phat'
          tinh_trang_sd = '$cap_phat.cp_trangthai'
        } else if (checkTs[i].qt_nghiep_vu == 2) {
          lookupTableName = 'QLTS_ThuHoi'
          localField = 'id_bien_ban'
          foreignField = 'thuhoi_id'
          asField = 'thu_hoi'
          unwind = '$thu_hoi'
          tinh_trang_sd = '$thu_hoi.thuhoi_trangthai'
        } else if (checkTs[i].qt_nghiep_vu == 3) {
          lookupTableName = 'QLTS_Dieu_Chuyen'
          localField = 'id_bien_ban'
          foreignField = 'dc_id'
          asField = 'dieu_chuyen'
          unwind = '$dieu_chuyen'
          tinh_trang_sd = '$dieu_chuyen.dc_trangthai'
        } else if (checkTs[i].qt_nghiep_vu == 4) {
          lookupTableName = 'QLTS_Sua_chua'
          localField = 'id_bien_ban'
          foreignField = 'sc_id'
          asField = 'sua_chua'
          tinh_trang_sd = '$sua_chua.sc_trangthai'
          unwind = '$sua_chua'
        } else if (checkTs[i].qt_nghiep_vu == 5) {
          lookupTableName = 'QLTS_Bao_Duong'
          localField = 'id_bien_ban'
          foreignField = 'id_bd'
          asField = 'bao_duong'
          tinh_trang_sd = '$bao_duong.bd_trang_thai'
          unwind = '$bao_duong'
        } else if (checkTs[i].qt_nghiep_vu == 6) {
          lookupTableName = 'QLTS_Mat'
          localField = 'id_bien_ban'
          foreignField = 'mat_id'
          asField = 'mat'
          tinh_trang_sd = '$mat.mat_trangthai'
          unwind = '$mat'
        } else if (checkTs[i].qt_nghiep_vu == 7) {
          lookupTableName = 'QLTS_Huy'
          localField = 'id_bien_ban'
          foreignField = 'huy_id'
          asField = 'huy'
          tinh_trang_sd = '$huy.huy_trangthai'
          unwind = '$huy'
        } else if (checkTs[i].qt_nghiep_vu == 8) {
          lookupTableName = 'QLTS_ThanhLy'
          localField = 'id_bien_ban'
          foreignField = 'tl_id'
          asField = 'thanh_ly'
          tinh_trang_sd = '$thanh_ly.tl_trangthai'
          unwind = '$thanh_ly'
        } else if (checkTs[i].qt_nghiep_vu == 9) {
          lookupTableName = 'QLTS_Ghi_Tang_TS'
          localField = 'id_ts'
          foreignField = 'id_ts'
          asField = 'ghi_tang'
          tinh_trang_sd = '$ghi_tang.trang_thai_ghi_tang'
          unwind = '$ghi_tang'
        }
        listQuaTrinh = await QuaTrinhSuDung.aggregate([
          {
            $match: matchQuery,
          },
          { $sort: { time_created: -1 } },
          {
            $skip: startIndex,
          },
          {
            $limit: perPage,
          },
          {
            $lookup: {
              from: lookupTableName,
              localField: localField,
              foreignField: foreignField,
              as: asField,
            },
          },
          {
            $unwind: {
              path: unwind + asField,
              preserveNullAndEmptyArrays: true,
            },
          },
          // {
          //   $addFields: {
          //     [asField]: {
          //       $cond: {
          //         if: { $eq: ["$" + asField, null] },
          //         then: { field_default: "default_value" }, // Giá trị mặc định nếu không tìm thấy kết quả
          //         else: "$" + asField, // Giữ nguyên kết quả lookup nếu tìm thấy
          //       },
          //     },
          //   },
          // },
          {
            $group: {
              _id: '$id_ts',
              so_bien_ban: { $first: '$quatrinh_id' },
              ngay_thuc_hien: { $first: '$qt_ngay_thuchien' },
              nghiep_vu: { $first: '$qt_nghiep_vu' },
              tinh_trang: { $first: { $arrayElemAt: [tinh_trang_sd, 0] } },
              vitri_taisan: { $first: '$vitri_ts' },
              id_ng_sudung: { $first: '$id_ng_sudung' },
              id_phong_su_dung: { $first: '$id_phong_sudung' },
              ghi_chu: { $first: '$ghi_chu' },
            },
          },
        ])
        for (let i = 0; i < listQuaTrinh.length; i++) {
          if (
            listQuaTrinh[i].id_ng_sudung != 0 &&
            typeof listQuaTrinh[i].id_ng_sudung !== 'string'
          ) {
            let com_id_sd = await User.findOne(
              { _id: listQuaTrinh[i].id_ng_sudung },
              { userName: 1 }
            )
            if (com_id_sd) listQuaTrinh[i].ten_nv_sd = com_id_sd.userName
            else listQuaTrinh[i].ten_nv_sd = 'Chưa cập nhật'
          } else {
            listQuaTrinh[i].ten_nv_sd = 'Chưa cập nhật'
          }
          if (
            listQuaTrinh[i].id_phong_su_dung != 0 &&
            typeof listQuaTrinh[i].id_phong_su_dung !== 'string'
          ) {
            let id_phongban = await OrganizeDetail.findOne(
              { id: listQuaTrinh[i].id_phong_su_dung },
              { organizeDetailName: 1 }
            )
            if (id_phongban)
              listQuaTrinh[i].ten_pb_sd = id_phongban.organizeDetailName
            else listQuaTrinh[i].ten_pb_sd = 'Chưa cập nhật'
          } else {
            listQuaTrinh[i].ten_pb_sd = 'Chưa cập nhật'
          }
        }
      }
      const totalTsCount = await QuaTrinhSuDung.countDocuments(matchQuery)
      // Tính toán số trang và kiểm tra xem còn trang kế tiếp hay không
      const totalPages = Math.ceil(totalTsCount / perPage)
      const hasNextPage = endIndex < totalTsCount
      return functions.success(res, 'get data success', {
        listQuaTrinh,
        totalPages,
        hasNextPage,
      })
    }
    return functions.setError(res, 'Không tìm thấy quá trình sử dụng tài sản')
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}

//Phần Khấu hao
exports.khauhaoCTTS = async (req, res) => {
  try {
    let { ts_id } = req.body
    let com_id = ''

    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }

    let checkKhauHao = await KhauHao.findOne({
      $and: [{ kh_id_cty: com_id }, { kh_id_ts: ts_id }],
    }).lean()
    let type_kh = ''

    if (checkKhauHao) {
      if (checkKhauHao.kh_type_ky == 0) {
        type_kh = 'Ngày'
      } else if (checkKhauHao.kh_type_ky == 1) {
        type_kh = 'Tháng'
      } else if (checkKhauHao.kh_type_ky == 2) {
        type_kh = 'Năm'
      }
      let gt_kh = checkKhauHao.kh_gt + ' ' + 'VNĐ'
      let kh_so_ky = checkKhauHao.kh_so_ky + ' ' + type_kh
      let kh_day_start = checkKhauHao.kh_day_start
      let kh_so_ky_con_lai = checkKhauHao.kh_so_ky_con_lai + ' ' + type_kh
      let kh_gt_da_kh = checkKhauHao.kh_gt_da_kh + ' ' + 'VNĐ'
      let kh_gt_cho_kh = checkKhauHao.kh_gt_cho_kh + ' ' + 'VNĐ'

      let khauHao = {
        gt_kh,
        kh_so_ky,
        kh_day_start,
        kh_so_ky_con_lai,
        kh_gt_da_kh,
        kh_gt_cho_kh,
      }

      return functions.success(res, 'get data success', { khauHao })
    } else {
      let khauHao = {
        gt_kh: 'Chưa cập nhật',
        kh_so_ky: 'Chưa cập nhật',
        kh_day_start: 'Chưa cập nhật',
        kh_so_ky_con_lai: 'Chưa cập nhật',
        kh_gt_da_kh: 'Chưa cập nhật',
        kh_gt_cho_kh: 'Chưa cập nhật',
      }

      return functions.success(res, 'get data success', { khauHao })
    }
  } catch (error) {
    console.error('Failed ', error)
    return functions.setError(res, error)
  }
}
//thêm khấu hao
exports.addKhauHao = async (req, res) => {
  try {
    let {
      ts_id,
      kh_gt,
      kh_so_ky,
      kh_so_ky_con_lai,
      kh_gt_da_kh,
      kh_day_start,
      kh_gt_cho_kh,
      kh_type_ky,
    } = req.body
    let com_id = ''
    let id_ng_tao = ''
    const createDate = Math.floor(Date.now() / 1000)

    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
      id_ng_tao = req.user.data._id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }

    if (
      !kh_gt ||
      !kh_so_ky ||
      !kh_so_ky_con_lai ||
      !kh_day_start ||
      !kh_gt_cho_kh ||
      !kh_gt_da_kh ||
      !kh_type_ky
    ) {
      return functions.setError(res, 'thiếu thông tin truyền lên', 400)
    }

    let checkts = await TaiSan.findOne({ ts_id: ts_id, id_cty: com_id }).select(
      'ts_date_create'
    )
    if (checkts.ts_date_create > kh_day_start) {
      return functions.setError(
        res,
        'Ngày bắt đầu khấu hao không thể trước ngày thêm tài sản!',
        400
      )
    } else {
      let checkkh = await KhauHao.findOne({
        kh_id_ts: ts_id,
        kh_id_cty: com_id,
      })

      if (checkkh) {
        let chinhsua = await KhauHao.findOneAndUpdate(
          { kh_id_ts: ts_id, kh_id_cty: com_id },
          {
            $set: {
              kh_gt: kh_gt,
              kh_so_ky: kh_so_ky,
              kh_type_ky: kh_type_ky,
              kh_so_ky_con_lai: kh_so_ky_con_lai,
              kh_gt_da_kh: kh_gt_da_kh,
              kh_gt_cho_kh: kh_gt_cho_kh,
              kh_day_start: kh_day_start,
              kh_ng_tao: id_ng_tao,
              kh_day_create: createDate,
            },
          },
          { new: true }
        )

        if (!chinhsua) {
          return functions.setError(
            res,
            'Không tìm thấy bản ghi phù hợp để thay đổi',
            400
          )
        }

        return functions.success(res, 'chỉnh sửa thành công', { chinhsua })
      } else {
        // Nếu không tìm thấy bản ghi khấu hao, thêm mới
        let maxIdKhauhao = await functions.getMaxIdByField(
          KhauHao,
          'id_khau_hao'
        )
        let newKh = new KhauHao({
          id_khau_hao: maxIdKhauhao,
          kh_id_cty: com_id,
          kh_id_ts: ts_id,
          kh_gt: kh_gt,
          kh_so_ky: kh_so_ky,
          kh_type_ky: kh_type_ky,
          kh_so_ky_con_lai: kh_so_ky_con_lai,
          kh_gt_da_kh: kh_gt_da_kh,
          kh_gt_cho_kh: kh_gt_cho_kh,
          kh_day_start: kh_day_start,
          kh_ng_tao: id_ng_tao,
          kh_day_create: createDate,
        })

        let save = await newKh.save()
        return functions.success(res, 'thêm thành khấu hao ', { save })
      }
    }
  } catch (e) {
    console.log(e)
    return functions.setError(res, e.message)
  }
}

// Phần tài liệu đính kèm
exports.addFile = async (req, res) => {
  try {
    let { ts_id } = req.body
    let com_id = ''
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    let createDate = Math.floor(Date.now() / 1000)
    let tep_kem = req.files.tep_ten
    let fileName = ''
    if (tep_kem) {
      await quanlytaisanService.uploadFileNameRandom(ts_id, tep_kem)
      fileName = tep_kem.name
    }
    let maxIdTep = await functions.getMaxIdByField(TepDinhKem, 'tep_id')
    let createNew = new TepDinhKem({
      tep_id: maxIdTep,
      id_cty: com_id,
      id_ts: ts_id,
      tep_ten: fileName,
      tep_ngay_upload: createDate,
    })
    let save = await createNew.save()
    return functions.success(res, 'thêm thành công tệp', { save })
  } catch (error) {
    console.error('Failed ', error)
    return functions.setError(res, error)
  }
}

exports.showFile = async (req, res) => {
  try {
    let { ts_id, page, perPage } = req.body
    let com_id = ''
    page = page || 1
    perPage = perPage || 10
    const startIndex = (page - 1) * perPage
    const endIndex = page * perPage
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    if (typeof ts_id === 'undefined') {
      return functions.setError(res, 'id tài sản không được bỏ trống', 400)
    }
    if (isNaN(Number(ts_id))) {
      return functions.setError(res, 'id tài sản phải là một số', 400)
    }
    let showtep = await TepDinhKem.find({ id_ts: ts_id, id_cty: com_id })
      .sort({ tep_id: -1 })
      .skip(startIndex)
      .limit(perPage)
    let fileX = ''
    for (let i = 0; i < showtep.length; i++) {
      fileX = await quanlytaisanService.createLinkFileQLTS(
        showtep[i].id_ts,
        showtep[i].tep_ten
      )
    }
    const totalTsCount = await TepDinhKem.countDocuments({
      id_cty: com_id,
      id_ts: ts_id,
    })

    const totalPages = Math.ceil(totalTsCount / perPage)
    const hasNextPage = endIndex < totalTsCount
    return functions.success(res, 'get data success', {
      showtep,
      totalPages,
      hasNextPage,
    })
  } catch (error) {
    console.error('Failed ', error)
    return functions.setError(res, error)
  }
}

exports.deleteFile = async (req, res) => {
  try {
    let { tep_id } = req.body
    if (typeof tep_id === 'undefined') {
      return functions.setError(res, 'id tệp đính kèm không được bỏ trống', 400)
    }
    if (isNaN(Number(tep_id))) {
      return functions.setError(res, 'id tệp phải là một số', 400)
    }
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    await TepDinhKem.deleteOne({ tep_id: tep_id, id_cty: com_id })
    return functions.success(res, 'xóa tiệp thành công')
  } catch (error) {
    console.error('Failed ', error)
    return functions.setError(res, error)
  }
}

// Phần  Sửa chữa theo id tài sản

exports.showScCT = async (req, res) => {
  try {
    let { ts_id, page, perPage } = req.body
    let com_id = ''
    page = page || 1
    perPage = perPage || 10
    const startIndex = (page - 1) * perPage
    const endIndex = page * perPage
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    if (typeof ts_id === 'undefined') {
      return functions.setError(res, 'id tài sản không được bỏ trống', 400)
    }
    if (isNaN(Number(ts_id))) {
      return functions.setError(res, 'id tài sản phải là một số', 400)
    }
    let listSCCT = await SuaChua.find({
      suachua_taisan: ts_id,
      id_cty: com_id,
      sc_da_xoa: 0,
    })
      .select(
        'sc_id sc_trangthai sc_ngay sc_dukien sc_hoanthanh sc_noidung sc_chiphi_dukien sc_chiphi_thucte sc_nguoi_thuchien sc_donvi'
      )
      .sort({ sc_id: -1 })
      .skip(startIndex)
      .limit(perPage)
    const totalTsCount = await SuaChua.countDocuments({
      id_cty: com_id,
      suachua_taisan: ts_id,
      sc_da_xoa: 0,
    })

    // Tính toán số trang và kiểm tra xem còn trang kế tiếp hay không
    const totalPages = Math.ceil(totalTsCount / perPage)
    const hasNextPage = endIndex < totalTsCount
    return functions.success(res, 'get data success', {
      listSCCT,
      totalTsCount,
      totalPages,
      hasNextPage,
    })
  } catch (error) {
    console.error('Failed ', error)
    return functions.setError(res, error)
  }
}

//Phần Bảo dưỡng theo id tài sản
exports.showBDCT = async (req, res) => {
  try {
    let { ts_id, page, perPage } = req.body
    let com_id = ''
    page = page || 1
    perPage = perPage || 10
    const startIndex = (page - 1) * perPage
    const endIndex = page * perPage
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    if (typeof ts_id === 'undefined') {
      return functions.setError(res, 'id tài sản không được bỏ trống', 400)
    }
    if (isNaN(Number(ts_id))) {
      return functions.setError(res, 'id tài sản phải là một số', 400)
    }
    let listBDCT = await BaoDuong.find({
      baoduong_taisan: ts_id,
      id_cty: com_id,
      xoa_bd: 0,
    })
      .select(
        'id_bd bd_trang_thai bd_ngay_batdau bd_dukien_ht bd_noi_dung bd_ngay_ht bd_chiphi_dukien bd_chiphi_thucte bd_nguoi_thuchien donvi_bd'
      )
      .sort({ id_bd: -1 })
      .skip(startIndex)
      .limit(perPage)
    const totalTsCount = await BaoDuong.countDocuments({
      id_cty: com_id,
      baoduong_taisan: ts_id,
      xoa_bd: 0,
    })
    // Tính toán số trang và kiểm tra xem còn trang kế tiếp hay không
    const totalPages = Math.ceil(totalTsCount / perPage)
    const hasNextPage = endIndex < totalTsCount
    return functions.success(res, 'get data success', {
      listBDCT,
      totalTsCount,
      totalPages,
      hasNextPage,
    })
  } catch (error) {
    console.error('Failed ', error)
    return functions.setError(res, error)
  }
}

//Phần thông tin phân bổ
exports.showTTPB = async (req, res) => {
  try {
    let { ts_id, type } = req.body
    if (req.user.data.type == 1 || req.user.data.type == 2) {
      com_id = req.user.data.com_id
    } else {
      return functions.setError(res, 'không có quyền truy cập', 400)
    }
    if (typeof ts_id === 'undefined') {
      return functions.setError(res, 'id tài sản không được bỏ trống', 400)
    }
    if (isNaN(Number(ts_id))) {
      return functions.setError(res, 'id tài sản phải là một số', 400)
    }
    let showPb = await PhanBo.findOne({ id_ts: ts_id, id_cty: com_id })
    return functions.success(res, 'get data success', { showPb })
  } catch (error) {
    console.error('Failed ', error)
    return functions.setError(res, error)
  }
}
