const functions = require('../../../services/functions');
const User = require('../../../models/Users');
const Order = require('../../../models/Raonhanh365/Order');
const New = require('../../../models/Raonhanh365/New');

exports.getListUserVerifyPayment = async (req, res, next) => {
    try {
        // await User.findByIdAndUpdate(16,{inforRN365:{xacThucLienket:3}})
        // return
        let count = await User.find({'inforRN365.xacThucLienket':{$in:[1,2]}}).count()
        let data  = await User.find({'inforRN365.xacThucLienket':{$in:[1,2]}})
        return functions.success(res, "get list user verify paymet success", { count, data });
    } catch (e) {
        console.log("Err from server", e);
        return functions.setError(res, "Err from server", 500);
    }
}

exports.adminVerifyPayment = async (req, res, next) => {
    try {
        let { userId, active } = req.body;
        if (!userId || !active) {
            return functions.setError(res, "Missing input value!", 404);
        }
        let user = await User.findOne({ _id: userId }, { userName: 1 });
        if (!user)
            return functions.setError(res, "User not fount!", 404);
        if (active == 2) {
            await User.findOneAndUpdate({ _id: userId }, {
                inforRN365: {
                    active: active
                }
            }, { new: true })
            return functions.success(res, 'admin verify payment success!');
        }
        await User.findOneAndUpdate({ _id: userId }, {
            inforRN365: {
                cccd: null,
                cccdFrontImg: null,
                cccdBackImg: null,
                bankName: null,
                stk: null,
                ownerName: null,
                time: null,
                active: 0
            }
        })
        return functions.success(res, 'admin delete verify payment success!');
    } catch (e) {
        console.log("Err from server!", e);
        return functions.setError(res, "Err from server!", 500);
    }
}


exports.getListOrderPayment = async (req, res, next) => {
    try {
            let page = req.body.page || 1;
            let pageSize = req.body.pageSize || 50;
            let skip = (page -  1)* pageSize ;
            let limit = pageSize ;
            let _id   = req.body.id;
            let thoiGianTu = req.body.thoiGianTu;
            let thoiGianDen = req.body.thoiGianDen;
            let conditions = {};
            if(_id) conditions._id = _id;
            if(thoiGianDen) conditions.thoiGianDen = {$lte:{thoiGianDen}};
            if(thoiGianTu) conditions.thoiGianTu = {$gte:{thoiGianTu}}
            let count = await Order.aggregate([
                {
                    $lookup:{
                        from:'Users',
                        localField:'buyerId',
                        foreignField:'idRaoNhanh365',
                        as:'user'
                    }
                },{
                    $lookup:{
                        from:'RN365_News',
                        localField:'newId',
                        foreignField:'_id',
                        as:'new'
                    }
                }
                ,
                {
                    $match:conditions
                },
                {
                    $count:"all"
                }
            ]);
            await Order.createIndexes({buyerId:1,newId:1})
           
            let data = await Order.aggregate([
                {
                    $lookup:{
                        from:'Users',
                        localField:'buyerId',
                        foreignField:'idRaoNhanh365',
                        as:'user'
                    }
                },{
                    $lookup:{
                        from:'RN365_News',
                        localField:'newId',
                        foreignField:'_id',
                        as:'new'
                    }
                },
                {
                    $match:conditions
                },
                
                {
                    $skip:skip
                },
                {
                    $limit:limit
                },
                {
                    $project:{_id:1,buyerId:1,sellerId:1,newId:1,
                        paymentType:1,buyTime:1,orderActive:1,amountPaid:1,
                        user:{userName:1},'new.until':1}
                },{
                    $sort:{_id:1}
                }
            ]);

            return functions.success(res, "get list user verify paymet success", {  count, data });
        
    } catch (e) {
        console.log("Err from server", e);
        return functions.setError(res, "Err from server", 500);
    }
}

exports.adminVerifyOrder = async (req, res, next) => {
    try {
        let { orderId, active } = req.body;
        if (!orderId || !active) {
            return functions.setError(res, "Missing input value!", 404);
        }
        let order = await Order.findOne({ _id: orderId });
        if (!order)
            return functions.setError(res, "Order not fount!", 404);
        await Order.findOneAndUpdate({ _id: orderId }, { orderActive: active })
        return functions.success(res, 'admin verify payment success!');
    } catch (e) {
        console.log("Err from server", e);
        return functions.setError(res, "Err from server", 500);
    }
}
