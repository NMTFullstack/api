
const functions = require('../../../services/functions');
const Users = require('../../../models/Users');
const DGNL_khDanhGia = require('../../../models/DanhGiaNangLuc/KhDanhGia');
const QLC_Deparments = require('../../../models/qlc/Deparment');
const DGNL_PhieuDanhGiaChiTiet = require('../../../models/DanhGiaNangLuc/PhieuDanhGiaChiTiet');
const DGNL_PhieuDanhGia = require('../../../models/DanhGiaNangLuc/PhieuDanhGia');

// all kế hoạch đánh giá
exports.allKHDG = async(req,res,next) => {
  try{
    const type = req.user.data.type

    const tokenData = {id_congty:0}; // Define usc_id as needed
    if(type === 1){
    tokenData.id_congty = req.user.data._id
    }
    else {
    tokenData.id_congty = req.user.data.com_id
    }
    console.log(tokenData.id_congty)
    const option ={
    _id: 0,
    kh_id:1,
    kh_ten:1
  }
  // trạng thái xóa 1 là dùng  2 là không dùng
  const allKHDG = await DGNL_khDanhGia.find({id_congty: tokenData.id_congty,trangthai_xoa:1},option)
  
    return functions.success(res,'successfully',{data: allKHDG})
  }
  catch(error){
    console.log(error)
    return functions.setError(res,'Internal Error',500)
  }
}

// all tìm kiếm phòng ban
exports.allPb = async(req,res,next) => {
  try{
    const type = req.user.data.type

    const tokenData = {id_congty:0}; // Define usc_id as needed
    if(type === 1){
        tokenData.id_congty = req.user.data._id
    }
    else {
        tokenData.id_congty = req.user.data.com_id
    }
    console.log(tokenData.id_congty)
    const option ={
        _id: 0,
        dep_id:1,
        dep_name:1
    }
    const allPb = await QLC_Deparments.find({com_id: tokenData.id_congty},option)
  
    return functions.success(res,'successfully',{data: allPb})
  }
  catch(error){
      console.log(error)
    return functions.setError(res,'Internal Error',500)
  }
}

// reder bảng và phân trang
  
exports.KetQuaPhongBan = async(req, res, next) => {
  try {
    let page = Number(req.body.page)|| 1;
    let pageSize = Number(req.body.pageSize) || 10;
    const skip = (page - 1) * pageSize;
    const limit = pageSize; 
    // const {com_id} =  req.body
    const type = req.user.data.type

    const tokenData = {id_congty:0}; // Define usc_id as needed
    if(type === 1){
        tokenData.id_congty = req.user.data._id
    }
    else {
        tokenData.id_congty = req.user.data.com_id
    }
    console.log(tokenData.id_congty)
  
    // console.log(com_id)
    const dep_id = Number(req.body.dep_id)
    const department = await QLC_Deparments.aggregate([
      {
        $match: {com_id: tokenData.id_congty}
      },
      {
        $match: {dep_id}
      },
      { $skip : skip}, 
      { $limit : limit},
 
      {
        $lookup: {
          from: 'Users',
          let: { dep_id: ['$dep_id'] },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$inForPerson.employee.dep_id", '$$dep_id']
                }
              }
            },
           
            {
              $lookup: {
                from: 'DGNL_khDanhGia',
                let: { id: { $toString: '$_id' }},
                pipeline: [
                  {
                    $match: {
                     
                      $expr: {
                          $regexMatch: {
                            input: {
                              $reduce: {
                                input: { $split: ['$kh_user_dg', ','] },
                                initialValue: '',
                                in: {
                                  $concat: ["$$value", "$$this"]
                                }
                              }
                            },
                            regex: "$$id",
                            options: "i"
                          }
                      }
                    }
                  },
                  {
                    $lookup: {
                      from: 'DGNL_PhieuDanhGiaChiTiet',
                      let: { kh_id: '$kh_id' },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $eq: ['$phieu_id', '$$kh_id']
                            }
                          }
                        }
                      ],
                      as: 'phieu'
                    }
                  },
                  {$unwind: '$phieu'}
                ],
                as: 'kh'
              }
             
            },
            
            {$unwind: '$kh'}
          ],
          as: 'users'
        }
      },
    
      {$unwind: '$users'},
     
      {
        $project: {
          _id: 0,
          dep_id: 1,
          dep_name: 1,
          'user_id': '$users._id',
          ke_hoach_danh_gia : '$users.kh.kh_ten',
          phieu : '$users.kh.kh_id',
          tong_diem: {
            $divide: [
              { $add: ['$users.kh.phieu.tongdiem', '$users.kh.phieu.tongdiem_kt'] },
              2 // Số 2 để chia đôi tổng
            ]
          }
        
          
        }
      }
    ])
      
    return functions.success(res, "success", department)
} catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
}
}

// exports.KetQuaPhongBan = async(req, res, next) => {
//   try {
//     let page = Number(req.body.page)|| 1;
//     let pageSize = Number(req.body.pageSize) || 10;
//     const skip = (page - 1) * pageSize;
//     const limit = pageSize; 
//     const com_id =  Number(req.body.com_id)
  
//     const dep_id = Number(req.body.dep_id)
//     const department = await QLC_Deparments.aggregate([
//       {
//         $match: {dep_id, com_id}
//       },
//       { $skip : skip}, 
//       { $limit : limit},
 
//       {
//         $lookup: {
//           from: 'Users',
//           let: { dep_id: ['$dep_id'] },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $in: ["$inForPerson.employee.dep_id", '$$dep_id']
//                 }
//               }
//             },
          
//             {
//               $lookup: {
//                 from: 'DGNL_khDanhGia',
//                 let: { id: { $toString: '$_id' }},
//                 pipeline: [
//                   {
//                     $match: {
//                       $expr: {
//                         $regexMatch: {
//                           input: "$kh_user_dg",
//                           regex: "$$id",
//                           options: "i"
//                         }
//                       }
//                     }
//                   },
                
//                 ],
//                 as: 'kh'
//               }
//             },
//             {$unwind: '$kh'}
//           ],
//           as: 'users'
//         }
//       },
    
//       {$unwind: '$users'},
//       // {
//       //   $unwind: '$users.kh' // Giải quyết mảng kh
//       // },
//       {
//         $project: {
//           _id: 0,
//           dep_id: 1,
//           dep_name: 1,
//           'user_id': '$users._id',
//           // test : '$users',
//           test2 : '$users.kh.kh_ten',
//           // test2a : '$kh'
//         }
//       }
//     ])
    
   
//     return functions.success(res, "success", department)
// } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Internal server error' });
// }
// }




