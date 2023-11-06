const functions = require('../../../services/functions');
const Users = require('../../../models/Users')
const QLC_Deparments = require('../../../models/qlc/Deparment')
const DGNL_TblPhanQuyen = require('../../../models/DanhGiaNangLuc/TblPhanQuyen')

// render
exports.PhanQuyenChiTiet = async(req, res, next) => {
    try {
        const type = req.user.data.type

        const tokenData = {id_congty:0}; // Define usc_id as needed
        if(type === 1){
            tokenData.id_congty = req.user.data._id
        }
        else {
            tokenData.id_congty = req.user.data.com_id
        }
        console.log(tokenData.id_congty)
        const { id_user} = req.body;
       
        const matchStage = id_user ? { id_user: id_user} : {};
        const result = await DGNL_TblPhanQuyen.aggregate([
            {
                $match: { id_cty: tokenData.id_congty.toString()},
            },
            {
                $match: matchStage
            },
            {
                $lookup: {
                    from: 'Users',
                    let: {
                        id_user: {$toInt: '$id_user'},
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$$id_user", ["$_id"]]
                                }
                            }
                        }
                    ],
                    as: 'user'
                }
            },
       
         
            {
                $project: {
                    _id: 0,
                    id_cty: 1,
                    id_user: {$toInt: '$id_user'},
                    tieuchi_dg: 1,
                    de_kiemtra: 1,
                    kehoach_dg: 1,
                    ketqua_dg: 1,
                    lotrinh_thangtien: 1,
                    phieu_dg: 1,
                    phanquyen: 1,
                    thangdiem: 1,
                    // 'user._id': 1,
                    "name": "$user.userName",
                    // "dep_id": "$user.inForPerson.employee.dep_id",
                    // "chuc_vu": '$user.inForPerson.employee.position_id'
                

                }
            }
        ]);
        return functions.success(res, 'success', result)
    } catch(err) {
        console.log(err)
        return functions.setError(res, 'error', err)
    }
}

// chỉnh sửa render 
exports.editPhanQuyen = async(req, res, next) => {
    try{
        // const id_cty = req.body.id_cty
        const type = req.user.data.type

        const tokenData = {id_congty:0}; // Define usc_id as needed
        if(type === 1){
            tokenData.id_congty = req.user.data._id
        }
        else {
            tokenData.id_congty = req.user.data.com_id
        }
        console.log(tokenData.id_congty)
        const id_user = req.body.id_user
       
        let {
            tieuchi_dg,
            de_kiemtra,
            kehoach_dg,
            ketqua_dg,
            lotrinh_thangtien,
            phieu_dg,
            phan_quyen,
            thangdiem} = req.body;
    
            let data = await DGNL_TblPhanQuyen.findOne({id_cty: tokenData.id_congty.toString(), id_user:id_user}).lean()
            if(!data) {
                let max = await DGNL_TblPhanQuyen.findOne({},{},{sort : {id_phanquyen : -1}}).lean() || 0;
                const phanQuyenTao = new DGNL_TblPhanQuyen({
                    id_phanquyen : Number(max.id_phanquyen) +1 || 1,
                    id_user : id_user,
                    id_cty : tokenData.id_congty.toString(),
                    tieuchi_dg : tieuchi_dg,
                    de_kiemtra : de_kiemtra,
                    kehoach_dg : kehoach_dg,
                    ketqua_dg : ketqua_dg,
                    lotrinh_thangtien : lotrinh_thangtien,
                    phieu_dg : phieu_dg,
                    phan_quyen : phan_quyen,
                    thangdiem : thangdiem
                })
                await phanQuyenTao.save()
                return functions.success(res,"Tạo thành công")
            }else{
                await DGNL_TblPhanQuyen.updateOne({id_cty:tokenData.id_congty.toString(), id_user:id_user},{
                    id_user : id_user,
                    id_cty : tokenData.id_congty.toString(),
                    tieuchi_dg : tieuchi_dg,
                    de_kiemtra : de_kiemtra,
                    kehoach_dg : kehoach_dg,
                    ketqua_dg : ketqua_dg,
                    lotrinh_thangtien : lotrinh_thangtien,
                    phieu_dg : phieu_dg,
                    phan_quyen : phan_quyen,
                    thangdiem : thangdiem
                })
                return functions.success(res,"Cập nhật thành công")
    
            }
    }catch(e){
      
         return functions.setError(res, e.message)
    }
}

