const Users = require('../../../models/Users');
const functions = require('../../../services/functions');
const City = require('../../../models/City');
const District = require('../../../models/District');
const TrangVangCategory = require('../../../models/Timviec365/UserOnSite/Company/TrangVangCategory');
const PointCompany = require('../../../models/Timviec365/UserOnSite/Company/ManagerPoint/PointCompany');

exports.listRegister = async(req, res) => {
    try {

    } catch (error) {
        console.log(error);
        return functions.setError(res, error);
    }
}


exports.createNTD = async(req, res) => {
    try {
        const data = req.body;
        const { email, name, phone, address, scale, operatingFields } = data
        const { website, city, district, zaloOrSkype, description } = data

        if
        ( 
            email == undefined   || name == undefined  || phone == undefined           || 
            email == ''          || name == ''         || phone == ''                  || 
            address == undefined || scale == undefined || operatingFields == undefined ||
            address == ''        || scale == ''        || operatingFields == ''        
        )
        {
            return functions.setError(res, 'Missing data', 400)      
        }

        const highestIdUser = await Users.findOne()
        .sort({ _id: -1 }) // Sắp xếp theo ID giảm dần
        .exec();

        let newUserId = highestIdUser?._id + 1;
        if(isNaN(newUserId))
        {
            return functions.setError(res, 'Missing database', 502)      
        }

        // const newEmployer = await Users.create({
        //     email           : email,
        //     phone           : phone,
        //     name            : name,
        //     address         : address,
        //     scale           : scale,
        //     operatingFields : operatingFields,
        //     avatarUser      : req.file.path
        //     district        : district    ? district    : "",
        //     website         : website     ? website     : "",
        //     city            : city        ? city        : "",
        //     zaloOrSkype     : zaloOrSkype ? zaloOrSkype : "",
        //     description     : description ? description : "",
        //     type            : 1,
        //     createdAt       : Date().now
        // })
        // .then(data=>{
        //     return data;
        // })

        // await Users.updateOne({
        //     _id: data._id
        // },{
        //     _id: newUserId
        // })
        return functions.success(res, 'Thêm mới thành công', { data: "" })      
    } catch (error) {
        return functions.setError(res, error.message)
    }
}

exports.getCity = async(req, res) => {
    try {
        const city = await City.aggregate([
            {
                $project: {
                    _id: 1,
                    name: 1
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]);
        return functions.success(res, 'Lấy tỉnh thành thành công', { data: city })      
    } catch (error) {
        return functions.setError(res, error.message)
    }
}

exports.getDistrict = async(req, res) => {
    try {
        const data = req.body;
        const parent = parseInt(data?.idCity);
        var district = [];
        const excludedTypes = [1, 2, 3, 4];
        if( isNaN(parent) || parent == undefined || parent == "" )
        {
            district = await District.aggregate([
                {
                    $match: {
                        type: { $nin: excludedTypes } 
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1
                    }
                }
            ]);
        } 
        else
        {
            district = await District.aggregate([
                {
                    $match: {
                        $and: [
                            { parent: parent },
                            { type: { $nin: excludedTypes } }
                        ]
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1
                    }
                }
            ]);
        }
        return functions.success(res, 'Lấy quận huyện thành công', { data: district })      
    } catch (error) {
        return functions.setError(res, error.message)
    }
}

exports.getOperatingField = async(req, res) => {
    try {
        const operatingFields = await TrangVangCategory.aggregate([
            {
                $project: {
                    id: 1,
                    name_cate: 1
                }
            }
        ]);
        return functions.success(res, 'Lấy lĩnh vực thành công', { data: operatingFields })      
    } catch (error) {
        return functions.setError(res, error.message)
    }
}

exports.getListNewRegistrationNTD = async(req, res) => {
    try {
        const data = req.body;
        var page = data?.page;
        var perPage = data?.perPage;
        page = parseInt(page);
        perPage = parseInt(perPage);

        // const total = await Users.aggregate([
        //     {
        //         $lookup: {
        //             from: "Users",
        //             localField: "_id",
        //             foreignField: "usc_id",
        //             as: "PointCompany"
        //         }
        //     },
        //     {
        //         $match: {
        //             type: 1 
        //         }
        //     },
        //     {
        //         $match: {
        //             "inForCompany.timviec365.usc_md5": ""
        //         }
        //     },
        //     {
        //         $addFields: {
        //             usc_md5: "$inForCompany.timviec365.usc_md5"
        //         }
        //     },
        //     {
        //         $count: "count"
        //     }
        // ]);
        var listNewRegistrationNTD = []
        if( page != undefined && perPage != undefined && !isNaN(page) && !isNaN(perPage))
        {
                listNewRegistrationNTD = await Users.aggregate([
                    {
                        $lookup: 
                        {
                            from: "PointCompany",
                            localField: "idTimViec365",
                            foreignField: "usc_id",
                            as: "userPoints"
                        }
                    },
                    {
                        $match: {
                            type: 1,
                            "inForCompany.timviec365.usc_md5": "",
                        }
                    },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    },
                    {
                        $skip: (page - 1) * perPage
                    },
                    {
                        $limit: perPage
                    },
                    {
                        $project: 
                        {
                            _id: 1,
                            logo: "$avatarUser",
                            createdAt: 1,
                            name: "$userName",
                            phone: 1,
                            email: "$emailContact",
                            website: "$inForCompany.timviec365.usc_website",
                            address: 1,
                            authentic: 1,
                            phoneTK: 1,
                            otp: 1,
                            emailTK: "$email",
                            skype: "$inForCompany.timviec365.usc_skype",
                            zalo: "$inForCompany.timviec365.usc_zalo",
                            registrationDate: "$createdAt",
                            checkVip: "$inForCompany.timviec365.usc_vip", 
                        }
                    }
                ])
        }
        else
        {
            listNewRegistrationNTD = await Users.aggregate([
                {
                    $lookup: 
                    {
                        from: "PointCompany",
                        localField: "idTimViec365",
                        foreignField: "usc_id",
                        as: "userPoints"
                    }
                },
                {
                    $match: {
                        type: 1,
                        "inForCompany.timviec365.usc_md5": "",
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $skip: 0
                },
                {
                    $limit: 20
                },
                {
                    $project: 
                    {
                        _id: 1,
                        logo: "$avatarUser",
                        createdAt: 1,
                        name: "$userName",
                        phone: 1,
                        email: "$emailContact",
                        website: "$inForCompany.timviec365.usc_website",
                        address: 1,
                        authentic: 1,
                        phoneTK: 1,
                        otp: 1,
                        emailTK: "$email",
                        skype: "$inForCompany.timviec365.usc_skype",
                        zalo: "$inForCompany.timviec365.usc_zalo",
                        registrationDate: "$createdAt",
                        checkVip: "$inForCompany.timviec365.usc_vip", 
                    }
                }
            ])
        }
        return functions.success(res, 'Lấy danh sách nhà tuyển dụng đăng kí mới thành công', { data: listNewRegistrationNTD })      
    } catch (error) {
        return functions.setError(res, error.message)
    }
}
