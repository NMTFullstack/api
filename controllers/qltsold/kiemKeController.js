const functions = require('../../services/functions');
const KiemKe = require('../../models/QuanLyTaiSan/KiemKe');
const ThongBao = require('../../models/QuanLyTaiSan/ThongBao');
const TaiSan = require('../../models/QuanLyTaiSan/TaiSan');
const TaiSanDangSD = require('../../models/QuanLyTaiSan/TaiSanDangSuDung');
const QuaTrinhSuDung = require('../../models/QuanLyTaiSan/QuaTrinhSuDung');
const Users = require('../../models/Users');

exports.getAndCheckData = async (req, res, next) => {
  try {
    let { ky_1, ky_2, loai_kk, taisan_kk, ng_kk, vitrits, noidung, denngay, day_start, day_end } = req.body;
    //kiem tra dinh dang ngay
    if (!ky_1 || !ky_2 || !loai_kk || !taisan_kk || !denngay || !day_start || !day_end) {
      return functions.setError(res, "Missing input value!", 404);
    }
    if (!await functions.checkDate(denngay) || !await functions.checkDate(day_start) || !await functions.checkDate(day_end)) {
      return functions.setError(res, "Ngay khong dung dinh dang!", 405);
    }
    let comId = req.user.data.com_id;
    let id = req.user.data._id;
    let type = req.user.data.type;

    let ky_kk;
    if (ky_1 <= 12) ky_kk = `01-${ky_1}-${ky_2}`;
    else if (ky_1 == 13) ky_kk = `01-01-${ky_2}`;
    else if (ky_1 == 14) ky_kk = `01-04-${ky_2}`;
    else if (ky_1 == 15) ky_kk = `01-07-${ky_2}`;
    else if (ky_1 == 16) ky_kk = `01-10-${ky_2}`;

    let kk_date_create = functions.convertTimestamp(Date.now());
    ky_kk = functions.convertTimestamp(ky_kk);
    denngay = functions.convertTimestamp(denngay);
    day_start = functions.convertTimestamp(day_start);
    day_end = functions.convertTimestamp(day_end);
    let fieldsKK = {
      id_cty: comId,
      "id_ts.ds_ts": taisan_kk,
      id_ngtao_kk: id,
      id_ng_kiemke: ng_kk,
      kk_loai: loai_kk,
      kk_loai_time: ky_1,
      kk_noidung: noidung,
      kk_ky: ky_kk,
      kk_denngay: denngay,
      kk_donvi: comId,
      kk_batdau: day_start,
      kk_ketthuc: day_end,
      kk_trangthai: 0,
      kk_tiendo: 0,
      kk_type_quyen: type,
      xoa_kiem_ke: 0,
      kk_date_create: kk_date_create,
    }
    let fieldsTB = {
      id_cty: comId,
      id_ng_nhan: ng_kk,
      id_ng_tao: id,
      type_quyen: 2,
      type_quyen_tao: type,
      loai_tb: 12,
      add_or_duyet: 1,
      da_xem: 0,
      date_create: kk_date_create
    }
    req.fieldsKK = fieldsKK;
    req.fieldsTB = fieldsTB;
    return next();
  } catch (error) {
    return functions.setError(res, error.message, 500);
  }
}

exports.create = async (req, res, next) => {
  try {
    let fieldsKK = req.fieldsKK;
    let maxIdKK = await functions.getMaxIdByField(KiemKe, 'id_kiemke');
    fieldsKK.id_kiemke = maxIdKK;

    let kiemKe = new KiemKe(fieldsKK);
    kiemKe = await kiemKe.save();
    if (kiemKe) {
      let maxIdThongBao = await functions.getMaxIdByField(ThongBao, 'id_tb');
      let fieldsTB = req.fieldsTB;
      fieldsTB.id_tb = maxIdThongBao;
      fieldsTB.id_ts = maxIdKK;
      let thongBao = new ThongBao(fieldsTB);
      thongBao = await thongBao.save();
      if (thongBao) {
        return functions.success(res, "Create kiem ke success!");
      }
      return functions.setError(res, "Create thong bao fail!", 505);
    }
    return functions.setError(res, "Create kiem ke fail!", 505);
  } catch (error) {
    return functions.setError(res, error.message, 500);
  }
}

exports.update = async (req, res, next) => {
  try {
    let id_kk = req.body.id_kk;
    if (id_kk) {
      let fieldsKK = req.fieldsKK;
      const comId = req.user.data.com_id;
      let kiemKe = await KiemKe.findOneAndUpdate({ id_kiemke: id_kk, id_cty: comId }, fieldsKK, { new: true });
      if (kiemKe) {
        return functions.success(res, "Update kiem ke success!", { kiemKe: kiemKe });
      }
      return functions.setError(res, "Kiem ke not found!", 505);
    }
    return functions.setError(res, "Missing input id_kk!", 403);
  } catch (error) {
    return functions.setError(res, error.message, 500);
  }
}

exports.danhSachNgayKiemKe = async (req, res, next) => {
  try {
    const comId = req.user.data.com_id;
    let danhSachNgay = await KiemKe.aggregate([
      { $match: { id_cty: comId, xoa_kiem_ke: 0 } },
      { $group: { _id: "$kk_batdau" } },
      { $sort: { _id: -1 } }

    ]);
    return functions.success(res, "Get list date success", { danhSachNgay });
  } catch (error) {
    return functions.setError(res, error.message, 500);
  }
}

exports.danhSachKiemKe = async (req, res, next) => {
  try {
    let { page, pageSize, key, date } = req.body;
    if (!page) page = 1;
    if (!pageSize) pageSize = 20;
    page = Number(page);
    pageSize = Number(pageSize);
    const limit = pageSize;
    const skip = (page - 1) * limit;
    const comId = req.user.data.com_id;

    let condition = { id_cty: comId, xoa_kiem_ke: 0 };
    if (key) {
      if (!isNaN(parseFloat(key)) && isFinite(key)) condition.id_kiemke = key;
      else condition.kk_noidung = new RegExp(key, 'i');
    }
    if (date && functions.checkDate(date)) {
      condition.kk_batdau = functions.convertTimestamp(date);
    }

    // let danhSachKiemKe = await functions.pageFind(KiemKe, condition, {id_kiemke: -1}, skip, limit);
    let danhSachKiemKe = await KiemKe.aggregate([
      { $match: condition },
      { $sort: { id_kiemke: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "Users",
          localField: "id_cty",
          foreignField: "_id",
          // pipeline: [
          //     { $match: {$and : [
          //     { "type" : 1},
          //     {"idQLC":{$ne : 0}},
          //     {"idQLC":{$ne : 1}}] },
          //     }
          // ],
          as: "company"
        }
      },
      { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'Users',
          localField: 'id_ngtao_kk',
          foreignField: '_id',
          as: 'nguoi_tao',
        }
      },

      { $unwind: { path: '$nguoi_tao', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "Users",
          localField: "kk_donvi",
          foreignField: "_id",
          // pipeline: [
          //     { $match: {$and : [
          //     { "type" : 1},
          //     {"idQLC":{$ne : 0}},
          //     {"idQLC":{$ne : 1}}] },
          // }
          // ],
          as: "donvi"
        }
      },
      { $unwind: { path: '$donvi', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "Users",
          localField: "id_ng_kiemke",
          foreignField: "_id",
          // pipeline: [
          //     { $match: {$and : [
          //     { "type" : {$ne : 1 }},
          //     {"idQLC":{$ne : 0}},
          //     {"idQLC":{$ne : 1}}] },
          //     }
          // ],
          as: "ng_kiemke"
        }
      },
      { $unwind: { path: '$ng_kiemke', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          "id_kiemke": "$id_kiemke",
          "kk_trangthai": "$kk_trangthai",
          "kk_loai": "$kk_loai",
          "kk_date_create": "$kk_date_create",
          "id_ngtao_kk": "$id_ngtao_kk",
          "ngtao_kk": "$nguoi_tao.userName",
          "kk_noidung": "$kk_noidung",
          "kk_ky": "$kk_ky",
          "kk_denngay": "$kk_denngay",
          "kk_donvi": "$kk_donvi",
          "donvi": "$donvi.userName",
          "vitri": "$company.address",
          "id_ng_kiemke": "$id_ng_kiemke",
          "ng_kiemke": "$ng_kiemke.userName",
          "kk_batdau": "$kk_batdau",
          "kk_ketthuc": "$kk_ketthuc",
          "kk_tiendo": "$kk_tiendo",

        }
      },
    ]);
    let total = await functions.findCount(KiemKe, condition);
    return functions.success(res, "Danh sach kiem ke:", { total: total, danhSachKiemKe: danhSachKiemKe });
  } catch (error) {
    return functions.setError(res, error.message);
  }
}

exports.delete = async (req, res, next) => {
  try {
    const { id_kk, datatype } = req.body;
    const userId = req.user.data._id;
    const comId = req.user.data.com_id;
    const type = req.user.data.type;
    const time = functions.convertTimestamp(Date.now());

    if (!id_kk) {
      return functions.setError(res, "Missing input id_kk", 404);
    }
    if (datatype != 1 && datatype != 2 && datatype != 3) {
      return functions.setError(res, "Vui long truyen datatype = 1/2/3", 404);
    }
    //
    if (datatype == 1) {
      let kiemKe = await KiemKe.findOneAndUpdate({ id_kiemke: id_kk, id_cty: comId }, {
        xoa_kiem_ke: 1,
        kk_type_quyen: type,
        kk_id_ng_xoa: userId,
        kk_date_delete: time,
      }, { new: true });
      if (kiemKe) return functions.success(res, "Xoa tam thoi kiem ke thanh cong!");
    }
    else if (datatype == 2) {
      let kiemKe = await KiemKe.findOneAndUpdate({ id_kiemke: id_kk, id_cty: comId }, {
        xoa_kiem_ke: 0,
        kk_type_quyen: 0,
        kk_id_ng_xoa: 0,
        kk_date_delete: 0,
      }, { new: true });
      if (kiemKe) return functions.success(res, "Khoi phuc kiem ke thanh cong!");
    }
    else if (datatype == 3) {
      let kiemKe = await KiemKe.findOneAndDelete({ id_kiemke: id_kk, id_cty: comId });
      if (kiemKe) return functions.success(res, "Xoa vinh vien kiem ke thanh cong!");
    }
    return functions.setError(res, "Kiem ke not found!", 505);
  } catch (error) {
    return functions.setError(res, error.message, 500);
  }
}

exports.deleteMany = async (req, res, next) => {
  try {
    const { array_xoa, datatype } = req.body;
    const userId = req.user.data._id;
    const comId = req.user.data.com_id;
    const type = req.user.data.type;
    const time = functions.convertTimestamp(Date.now());

    if (!array_xoa) {
      return functions.setError(res, "Missing input array_xoa", 404);
    }
    if (datatype != 1 && datatype != 2 && datatype != 3) {
      return functions.setError(res, "Vui long truyen datatype = 1/2/3", 404);
    }
    //
    if (datatype == 1) {
      for (let i = 0; i < array_xoa.length; i++) {
        let kiemKe = await KiemKe.findOneAndUpdate({ id_kiemke: array_xoa[i], id_cty: comId }, {
          xoa_kiem_ke: 1,
          kk_type_quyen: type,
          kk_id_ng_xoa: userId,
          kk_date_delete: time,
        }, { new: true });
      }
      return functions.success(res, "Xoa tam thoi kiem ke thanh cong!");
    }
    else if (datatype == 2) {
      for (let i = 0; i < array_xoa.length; i++) {
        let kiemKe = await KiemKe.findOneAndUpdate({ id_kiemke: array_xoa[i], id_cty: comId }, {
          xoa_kiem_ke: 0,
          kk_type_quyen: 0,
          kk_id_ng_xoa: 0,
          kk_date_delete: 0,
        }, { new: true });
      }
      return functions.success(res, "Khoi phuc kiem ke thanh cong!");
    }
    else if (datatype == 3) {
      for (let i = 0; i < array_xoa.length; i++) {
        let kiemKe = await KiemKe.findOneAndDelete({ id_kiemke: array_xoa[i], id_cty: comId });
      }
      return functions.success(res, "Xoa vinh vien kiem ke thanh cong!");
    }
    return functions.setError(res, "Xoa nhieu that bai!", 505);
  } catch (error) {
    return functions.setError(res, error.message, 500);
  }
}

exports.duyet = async (req, res, next) => {
  try {
    const id_kk = req.body.id_kk;
    const ng_duyet = req.user.data._id;
    const type = req.user.data.type;
    const comId = req.user.data.com_id;
    const time = functions.convertTimestamp(Date.now());
    let kiemKe = await KiemKe.findOneAndUpdate({ id_kiemke: id_kk, id_cty: comId }, {
      id_ngduyet_kk: ng_duyet,
      kk_ngayduyet: time,
      kk_type_quyen_duyet: type,
      kk_tiendo: 100,
      kk_trangthai: 3
    }, { new: true });
    if (kiemKe) return functions.success(res, "Duyet kiem ke thanh cong!");
    return functions.setError(res, "Kiem ke not found!", 504);
  } catch (error) {
    return functions.setError(res, error.message, 500);
  }
}

exports.chiTiet = async (req, res, next) => {
  try {
    let id_kk = req.body.id_kk;
    const com_id = req.user.data.com_id;
    if (!id_kk) return functions.setError(res, "Missing input id_kk!", 404);
    id_kk = Number(id_kk);
    let danhSachKiemKe = await KiemKe.aggregate([
      { $match: { id_kiemke: id_kk } },
      {
        $lookup: {
          from: 'Users',
          localField: 'id_cty',
          foreignField: '_id',
          as: 'company',
        }
      },
      { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'Users',
          localField: 'id_ngtao_kk',
          foreignField: '_id',
          as: 'nguoi_tao',
        }
      },
      { $unwind: { path: '$nguoi_tao', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'Users',
          localField: 'kk_donvi',
          foreignField: '_id',
          as: 'donvi',
        }
      },
      { $unwind: { path: '$donvi', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'Users',
          localField: 'id_ng_kiemke',
          foreignField: '_id',
          as: 'ng_kiemke',
        }
      },
      { $unwind: { path: '$ng_kiemke', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          "id_kiemke": "$id_kiemke",
          "kk_trangthai": "$kk_trangthai",
          "kk_loai": "$kk_loai",
          "kk_date_create": "$kk_date_create",
          "id_ngtao_kk": "$id_ngtao_kk",
          "ngtao_kk": "$nguoi_tao.userName",
          "kk_noidung": "$kk_noidung",
          "kk_ky": "$kk_ky",
          "kk_denngay": "$kk_denngay",
          "kk_donvi": "$kk_donvi",
          "donvi": "$donvi.userName",
          "vitri": "$company.address",
          "id_ng_kiemke": "$id_ng_kiemke",
          "ng_kiemke": "$ng_kiemke.userName",
          "kk_batdau": "$kk_batdau",
          "kk_ketthuc": "$kk_ketthuc",
          "kk_tiendo": "$kk_tiendo",
          "id_ts": "$id_ts",
        }
      },
    ]);
    // let kiemKe = await KiemKe.findOne({id_kiemke: id_kk}).lean();
    let danhSachTaiSan = [];

    if (danhSachKiemKe && danhSachKiemKe.length > 0) {
      let kiemKe = danhSachKiemKe[0];
      let quaTrinhSD = await QuaTrinhSuDung.find({ id_cty: com_id });
      let tsDangSD = await TaiSanDangSD.find({ com_id_sd: com_id });
      if (kiemKe.id_ts && kiemKe.id_ts.ds_ts) {
        let id_ts = kiemKe.id_ts.ds_ts;
        for (let i = 0; i < id_ts.length; i++) {
          let id_tai_san = Number(id_ts[i]);
          let ts_detail = {
            id_tai_san: id_tai_san,
            name_tai_san: "",
            vitri_ts: "",
            donvi_ql: "",
            ts_chua_sd: 0,
            ts_dang_sd: 0,
            ts_huy: 0,
            ts_tong: 0,
            ng_dai_dien: ""
          };

          //tong so luong
          let taiSan = await TaiSan.findOne({ ts_id: id_tai_san, id_cty: com_id });

          if (taiSan) {
            ts_detail["ts_chua_sd"] = taiSan.ts_so_luong;
            ts_detail.name_tai_san = taiSan.ts_ten;
            ts_detail.vitri_ts = taiSan.ts_vi_tri;
            ts_detail.donvi_ql = taiSan.id_dv_quanly;
            let ng_dai_dien = await Users.findOne({ _id: taiSan.id_ten_quanly });
            if (ng_dai_dien) {
              ts_detail.ng_dai_dien = ng_dai_dien.userName;
            }
          }

          // ts_detail.name_tai_san = taiSan.ts_ten;
          // ts_detail.name_tai_san = taiSan.ts_ten;

          //loc ra tai san dang su dung
          const sl_dang_sd = tsDangSD.reduce((sum, item) => {
            if (item.id_ts_sd === id_tai_san) {
              return sum + parseInt(item.sl_dang_sd);
            }
            return sum;
          }, 0);
          ts_detail["ts_dang_sd"] = sl_dang_sd;

          //so luong tai san hong
          const sl_huy = quaTrinhSD.reduce((sum, item) => {
            if (
              item.id_ts === id_tai_san &&
              item.qt_nghiep_vu === 7
            ) {
              return sum + parseInt(item.so_lg);
            }
            return sum;
          }, 0);
          ts_detail["ts_huy"] = sl_huy;

          //so luong tai san thanh ly
          const sl_thanhly = quaTrinhSD.reduce((sum, item) => {
            if (
              item.id_ts === id_tai_san &&
              item.qt_nghiep_vu === 8
            ) {
              return sum + parseInt(item.so_lg);
            }
            return sum;
          }, 0);
          ts_detail["ts_thanhly"] = sl_thanhly;

          //so luong tai san mat
          const sl_mat = quaTrinhSD.reduce((sum, item) => {
            if (
              item.id_ts === id_tai_san &&
              item.qt_nghiep_vu === 6
            ) {
              return sum + parseInt(item.so_lg);
            }
            return sum;
          }, 0);
          ts_detail["ts_mat"] = sl_mat;

          //so luong tai san sua chua
          const sl_suachua = quaTrinhSD.reduce((sum, item) => {
            if (
              item.id_ts === id_tai_san &&
              item.qt_nghiep_vu === 4
            ) {
              return sum + parseInt(item.so_lg);
            }
            return sum;
          }, 0);
          ts_detail["ts_suachua"] = sl_suachua;

          //
          ts_detail.ts_tong = ts_detail.ts_chua_sd + ts_detail.ts_dang_sd;
          danhSachTaiSan.push(ts_detail);
        }
        kiemKe.danhSachTaiSan = danhSachTaiSan;
      }

      return functions.success(res, "Lay thong tin chi tiet kiem ke thanh cong!", { kiemKe: kiemKe });
    }
    return functions.setError(res, "Kiem ke not found!", 404);
  } catch (error) {
    return functions.setError(res, error.message, 500);
  }
}