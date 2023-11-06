const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SettingWifiSchema = new mongoose.Schema(
  {
    id: {
      // id cài đặt ip
      type: Number,
      require: true,
    },
    id_com: {
      // id công ty
      type: Number,
    },
    ip_access: {
      //địa chỉ ip
      type: String,
    },
    name_wifi: {
      // họ và tên nguoi nhaps
      type: String,
    },
    id_loc: {
      // site cài IP
      type: Number,
    },
    created_time: {
      type: Number,
      default: 0,
    },
    update_time: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: 'QLC_SettingWifi',
    versionKey: false,
    timestamp: true,
  }
)
module.exports = mongoose.model('QLC_SettingWifi', SettingWifiSchema)
