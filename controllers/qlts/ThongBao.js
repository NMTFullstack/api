const quanlytaisanService = require('../../services/QLTS/qltsService');
const ThongBao = require('../../models/QuanLyTaiSan/ThongBao')
const functions = require('../../services/functions')


exports.sendNoti = async ( req, res) =>{
    try {
        const type = req.user.data.type 
        const com_id = req.user.data.com_id 
        if(type == 1) {
            const data = await ThongBao.find({
                id_cty : com_id,
                type_quyen : type,
                
            })
        }
    } catch (error) {
        console.log(error);
        return fnc.setError(res, error.message);
    }
}