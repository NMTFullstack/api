const Users = require("../../models/Users")
const functions = require("../../services/functions")
const Location = require('../../models/qlc/Location')


exports.getList = async(req, res) => {
    try {
        const com_id = req.user.data.com_id
        const type = req.user.data.type

        if (type == 1) {

            const list = await Location.aggregate([{
                $match: {
                    id_com: Number(com_id)
                }
            }, {
                $project: {
                    _id: 0
                }
            }])

            const count = await Location.countDocuments({ id_com: Number(com_id) })

            return functions.success(res, 'Lấy thành công', {
                list: list,
                total: count
            })
        }

        return functions.setError(res, 'Tài khoản không phải tài khoản công ty', 500)


    } catch (error) {
        console.log(error)

        return functions.setError(res, error.message, 500)
    }
}

exports.add = async(req, res) => {
    try {
        const com_id = req.user.data.com_id
        const type = req.user.data.type

        if (type == 1) {
            const {
                cor_location_name,
                cor_lat,
                cor_long,
                cor_radius
            } = req.body

            if (cor_location_name && cor_lat && cor_long && cor_radius) {
                // lay id location
                const maxId = await Location.aggregate([{
                    $sort: {
                        cor_id: -1
                    }
                }, { $limit: 1 }, { $project: { cor_id: 1 } }])

                const curId = maxId.length >= 1 ? maxId[0].cor_id + 1 : 1

                const obj = {
                    cor_id: curId,
                    cor_location_name: cor_location_name,
                    cor_lat: cor_lat,
                    cor_long: cor_long,
                    cor_radius: cor_radius,
                    id_com: com_id
                }

                const location = new Location(obj)

                await location.save()

                return functions.success(res, 'Thêm thành công', {
                    data: obj
                })
            }

            return functions.setError(res, 'Thiếu trường', 500)

        }

        return functions.setError(res, 'Tài khoản không phải tài khoản công ty', 500)


    } catch (error) {
        console.log(error)

        return functions.setError(res, error.message, 500)
    }
}

exports.update = async(req, res) => {
    try {
        const com_id = req.user.data.com_id
        const type = req.user.data.type

        if (type == 1) {
            const {
                cor_id,
                cor_location_name,
                cor_lat,
                cor_long,
                cor_radius
            } = req.body

            if (cor_id) {
                const location = await Location.aggregate([{
                    $match: {
                        id_com: Number(com_id),
                        cor_id: Number(cor_id)
                    }
                }, {
                    $project: {
                        _id: 0
                    }
                }])
                if (location.length >= 1) {
                    const data = location[0]
                    const obj = {
                        cor_id: cor_id,
                        cor_location_name: cor_location_name ? cor_location_name : data.cor_location_name,
                        cor_lat: cor_lat ? cor_lat : data.cor_lat,
                        cor_long: cor_long ? cor_long : data.cor_long,
                        cor_radius: cor_radius ? cor_radius : data.cor_radius,
                        id_com: com_id
                    }

                    const resUpdate = await Location.findOneAndUpdate({
                        id_com: Number(com_id),
                        cor_id: Number(cor_id)
                    }, {
                        $set: obj
                    })


                    return functions.success(res, 'Sửa thành công', {
                        data: obj
                    })
                }

                return functions.setError(res, `Không tìm thấy địa điểm với id: ${cor_id}`, 500)
            }

            return functions.setError(res, 'Thiếu trường id', 500)

        }

        return functions.setError(res, 'Tài khoản không phải tài khoản công ty', 500)


    } catch (error) {
        console.log(error)

        return functions.setError(res, error.message, 500)
    }
}

exports.delete = async(req, res) => {
    try {
        const com_id = req.user.data.com_id
        const type = req.user.data.type

        if (type == 1) {
            const {
                cor_id,
            } = req.body

            if (cor_id) {
                const location = await Location.aggregate([{
                    $match: {
                        id_com: Number(com_id),
                        cor_id: Number(cor_id)
                    }
                }, {
                    $project: {
                        _id: 0
                    }
                }])
                if (location.length >= 1) {
                    const resDel = await Location.findOneAndDelete({
                        id_com: Number(com_id),
                        cor_id: Number(cor_id)
                    })


                    return functions.success(res, 'Xóa thành công')
                }

                return functions.setError(res, `Không tìm thấy địa điểm với id: ${cor_id}`, 500)
            }

            return functions.setError(res, 'Thiếu trường id', 500)

        }

        return functions.setError(res, 'Tài khoản không phải tài khoản công ty', 500)


    } catch (error) {
        console.log(error)

        return functions.setError(res, error.message, 500)
    }
}