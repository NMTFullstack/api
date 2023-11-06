

const functions = require('../../../services/functions');
const DGNL_TblYcCv = require('../../../models/DanhGiaNangLuc/TblYcCv');
const DGNL_TblChucVu = require('../../../models/DanhGiaNangLuc/TblChucVu');
const Users = require('../../../models/Users');




exports.getListChucVuChiTiet = async (req, res, next) => {
    try { 
        let {id_phongban} = req.body;

        console.log(id_phongban);
        const matchStage = id_phongban ? { id_phongban: parseInt(id_phongban) } : {};
        let data = await DGNL_TblChucVu.aggregate([
           
            {
                $match: matchStage,  
            },
            {
                $lookup: {
                    from: 'Users', 
                     
                    let: { id_phongban: "$id_phongban" , id_chucvu: "$id_chucvu"}, 
                    pipeline: [
                        {
                            $match: {
                              
                                $expr: {
                                    $and: [
                                        { $eq: ["$inForPerson.employee.dep_id", "$$id_phongban"] }, 
                                        { $eq: ["$inForPerson.employee.position_id", "$$id_chucvu"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'usersData' 
                }
            },
            {
                $lookup: {
                    from: 'DGNL_TblYcCv', 
                    let: { id_phongban: "$id_phongban", id_chucvu: "$id_chucvu" }, 
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$id_pb", "$$id_phongban"] }, 
                                        { $eq: ["$id_chucvu", "$$id_chucvu"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'yccvData'
                }
            },
            
            {
                $project: {
                    _id: 0,
                    id_chucvu: 1,
                    id_phongban: 1,
                    vitri_chucvu: 1,
                    ten_chucvu: 1,
            //users
                    "usersData.inForPerson.employee.com_id": 1,
                    'usersData.inForPerson.employee.dep_id': 1,
                    'usersData.inForPerson.employee.position_id': 1,
                    "usersData.inForPerson.employee.team_id": 1, 
                    'usersData.userName': 1,
                    'usersData.avatarUser': 1,
            //yccv
                    'yccvData.id_chucvu':1,
                    'yccvData.ten_yeucau':1,
                    'yccvData.mota_yeucau':1,
                }
            },
        ]);
        return functions.success(res, 'success', data);
    } catch (error) {
        return functions.setError(res, 'Error');
    }
};

// Thêm chức vụ 
exports.themchucvu = async (req, res, next) => {
    try {
        const type = req.user.data.type 
        const tokenData = { id_congty : 0 }
        if (type ===1 ) {
            tokenData.id_congty = req.user.data._id
        } else {
            tokenData.id_congty = req.user.data.com_id
        }
        console.log(req.user.data)
        const { id_chucvu, ten_chucvu, vitri_chucvu, id_phongban } = req.body;
        
        const lastChucVu = await DGNL_TblChucVu.findOne({}, {}, { sort: { 'id': -1 } });
        const newId = lastChucVu ? lastChucVu.id + 1 : 1;

        const newChucVu = new DGNL_TblChucVu({
            id: newId, 
            id_chucvu,
            ten_chucvu,
            vitri_chucvu,
            id_phongban,
            id_congty: tokenData.id_congty,
            creat_at: Date.now()
        });

        const savedChucVu = await newChucVu.save();

        return functions.success(res, 'Thêm thành công', savedChucVu);
    } catch (error) {
        console.error(error);
        return functions.setError(res, 'Lỗi khi thêm chức vụ');
    }
}

 //Xóa chức vụ
exports.deleteChucVu = async (req, res, next) => {
    try {
        const { id } = req.body;

        if (!id) {
            return functions.setError(res, 'Thiếu thông tin id');
        }

        const chucVu = await DGNL_TblChucVu.findOne({ id });

        if (!chucVu) {
            return functions.setError(res, 'Không tìm thấy chức vụ');
        }

        await DGNL_TblChucVu.deleteOne({ id });

        return functions.success(res, 'Xóa chức vụ thành công');
       
    } catch (error) {
        console.error(error);
        return functions.setError(res, 'Xóa không thành công');
    }
}

// Chỉnh sửa chức vụ 
exports.editViTriChucVu = async(req, res, next) => {
    try {
        const { id } = req.body;
        const { vitri_chucvu } = req.body; 

        if (!id || !vitri_chucvu) {
            return functions.setError(res, 'Thiếu thông tin id hoặc vitri_chucvu');
        }

        const chucVu = await DGNL_TblChucVu.findOne({ id });

        if (!chucVu) {
            return functions.setError(res, 'Không tìm thấy chức vụ');
        }

        chucVu.vitri_chucvu = vitri_chucvu;
        await chucVu.save();

        return functions.success(res, 'Chỉnh sửa vị trí chức vụ thành công' , chucVu);
    } catch (error) {
        console.error(error);
        return functions.setError(res, 'Lỗi khi chỉnh sửa vị trí chức vụ');
    }
}

// Thêm yêu cầu công việc
exports.themYccv = async (req, res, next) => {
    try {
        const type = req.user.data.type
        const tokenData = {id_congty: 0}
        if(type === 1){
            tokenData.id_congty = req.user.data._id
        } else {
            tokenData.id_congty = req.user.data.com_id
        }
        console.log(tokenData.id_congty)
        const { id_chucvu, ten_yeucau, vitri_yeucau, id_pb,mota_yeucau} = req.body;
        
        const lastChucVu = await DGNL_TblYcCv.findOne({}, {}, { sort: { 'id': -1 } });

        const newId = lastChucVu ? lastChucVu.id + 1 : 1;

        // Tạo một bản ghi chức vụ mới với giá trị 'id' tự động tăng
        const newChucVu = new DGNL_TblYcCv({
            id: newId, // Gán giá trị 'id' mới tính được
            id_chucvu,
            ten_yeucau,
            vitri_yeucau,
            id_pb,
            mota_yeucau,
            id_congty : tokenData.id_congty,
          
        });

        const savedYc = await newChucVu.save();

        // return res.status(201).json(savedChucVu);
        return functions.success(res, 'Thêm thành công', savedYc);
       
    } catch (error) {
        console.error(error);
        // return res.status(500).json({ error: 'Lỗi khi thêm chức vụ' });
        return functions.setError(res, 'Lỗi khi thêm chức vụ');
    }
}
// Chỉnh sửa Yccv
exports.editYccv = async(req, res, next) => {
    try {
        const { id } = req.body;
        const { ten_yeucau, mota_yeucau, vitri_yeucau  } = req.body; 

        if (!id || !mota_yeucau || !vitri_yeucau || !ten_yeucau) {
            return functions.setError(res, 'Thiếu thông tin');
        }

        // const Yc = await DGNL_TblYcCv.findOne({ id });
        const Yc = await DGNL_TblYcCv.findOneAndUpdate(
            { id : id},
            { mota_yeucau: mota_yeucau, vitri_yeucau: vitri_yeucau ,ten_yeucau: ten_yeucau},
            { new: true } // Đảm bảo trả về bản ghi sau khi cập nhật
          );
   
        if (!Yc) {
            return functions.setError(res, 'Không tìm thấy yccv');
        }
        return functions.success(res, 'Chỉnh sửa yêu cầu công việc thành công' , Yc);
    } catch (error) {
        console.error(error);
        return functions.setError(res, 'Lỗi khi chỉnh sửa yêu cầu công việc');
    }
}

//Xóa yccv
exports.deleteYccv = async (req, res, next) => {
    try {
        const { id } = req.body;

        if (!id) {
            return functions.setError(res, 'Thiếu thông tin id');
        }

        const chucVu = await DGNL_TblYcCv.findOne({ id });

        if (!chucVu) {
            return functions.setError(res, 'Không tìm thấy yccv');
        }

        await DGNL_TblYcCv.deleteOne({ id });

        return functions.success(res, 'Xóa yccv thành công');
       
    } catch (error) {
        console.error(error);
        return functions.setError(res, 'Xóa không thành công');
    }
}
