const functions = require('../../../services/functions');
const Users = require('../../../models/Users')
const QLC_Deparments = require('../../../models/qlc/Deparment')

// all user
exports.AllUsers = async(req, res, next) => {
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
        // const {com_id} = req.body
        const options = {
            userName: 1,

        }
        const result = await Users.find({'inForPerson.employee.com_id': tokenData.id_congty }, options);
        return functions.success(res, 'success', result)
    } catch (err) {
        return functions.setError(res, 'error', err)
    }
};

// all Phòng ban
exports.AllPb = async(req, res, next) => {
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
        const options = {
            dep_id: 1,
            dep_name: 1
        }
        const results = await QLC_Deparments.find({com_id:tokenData.id_congty}, options);
        return functions.success(res, 'success', results)
    } catch (err) {
        return functions.setError(res, 'error', err)
    }
};

// render dữ liệu và phân trang
exports.Table = async(req, res, next) => {
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
        const {  dep_id } = req.body;
        
         // pageSize nhận các giá trị  trên front 2, 5, 10, 50, 100, 500
        const pageSize = parseInt(req.body.pageSize);
        const skipValue = parseInt(req.body.skipValue);

        const ListThanhVien = await Users.aggregate([
           
            {
                $match: {
                    'inForPerson.employee.dep_id': dep_id ? parseInt(dep_id) : { $exists: true },
                    'inForPerson.employee.com_id':tokenData.id_congty
                }
            },
            {
                $limit: pageSize
            },
            {
                $skip: skipValue
            },
            {
                $lookup: {
                    from: 'DGNL_TblChucVu',
                    let: {
                        position_id: "$inForPerson.employee.position_id",
                        dep_id: "$inForPerson.employee.dep_id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$id_chucvu", "$$position_id"] },
                                        { $eq: ["$id_phongban", "$$dep_id"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'chucvu'
                }
            },
            {
                $lookup: {
                    from: 'QLC_Deparments',
                    localField: 'inForPerson.employee.dep_id',
                    foreignField: 'dep_id',
                    as: 'qlc'
                }
            },
            {
                $project: {
                    'MaNV': {
                        $concat: ['NV', {$toString: '$_id'}]
                    },
                    _id: 0,
                    'inForPerson.employee.dep_id': 1,
                    'inForPerson.employee.position_id': 1,
                    userName: 1,
                    avatarUser: 1,
                    'chucvu.ten_chucvu': 1,
                    'qlc.dep_name': 1,
                }
            }
        ]);

        return functions.success(res, 'success', ListThanhVien);
    } catch (error) {
        return functions.setError(res, 'Error');
    }
};
