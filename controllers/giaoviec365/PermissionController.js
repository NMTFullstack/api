const Role = require('../../models/giaoviec365/tbl_vaitro')
const Permission = require('../../models/giaoviec365/tbl_phanquyen_new')
const User = require('../../models/Users')
const functions = require('../../services/functions');
const gv = require('../../services/giaoviec365/gvService');
const Dep = require('../../models/qlc/Deparment')
class PermissionController 
{
    // [GET] /roles/quan-ly-vai-tro
    async VaiTro(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            const page = req.params.page
            const keywords = req.query.keywords
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            let role = []
            if(keywords){
                role = await gv.findByName(page, Role, 'name', keywords, {com_id})
            } else {
                role = await Role.find({
                    com_id,
                }).skip(10*page - 10).limit(10).lean()
            }
            return functions.success(res, 'Get role successfully', { listRole: req.listRole,data: {
                role
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Failed to get role', 500)
        }
    }

    // [POST] /roles/quan-ly-vai-tro/add
    async addVaiTro(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const id = await functions.getMaxIdByField(Role, 'id')
            if(!req.body.name)
            return functions.setError(res, 'Vui lòng nhập tên vai trò')
            const {
                name,
                mota,
                duan_dscv,
                duan_quytrinh,
                tailieucongviec,
                tailieucuatoi,
                diadiem,
                phonghop,
                cuochop,
                congvieccuatoi,
                baocao_quytrinh,
                baocao_duan,
                dulieudaxoa,
                phanquyen_vaitro,
                phanquyen_nguoidung,
                caidat,
            } = req.body

            const role = new Role({
                id,
                name,
                mota,
                duan_dscv,
                duan_quytrinh,
                tailieucongviec,
                tailieucuatoi,
                diadiem,
                phonghop,
                cuochop,
                congvieccuatoi,
                baocao_quytrinh,
                baocao_duan,
                dulieudaxoa,
                phanquyen_vaitro,
                phanquyen_nguoidung,
                caidat,
                com_id
            })
            await role.save()
            return functions.success(res, 'Add role successfully', { listRole: req.listRole,data: {
                role
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Failed to add role', 500)
        }
    }

    // [PUT] /roles/quan-ly-vai-tro/edit/:id
    async editVaiTro(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            if(!req.body.name)
            return functions.setError(res, 'Vui lòng nhập tên vai trò')
            const {
                name,
                mota,
                duan_dscv,
                duan_quytrinh,
                tailieucongviec,
                tailieucuatoi,
                diadiem,
                phonghop,
                cuochop,
                congvieccuatoi,
                baocao_quytrinh,
                baocao_duan,
                dulieudaxoa,
                phanquyen_vaitro,
                phanquyen_nguoidung,
                caidat,
            } = req.body

            await Role.updateOne(
                {id: req.params.id, com_id},
                {
                    name,
                    mota,
                    duan_dscv,
                    duan_quytrinh,
                    tailieucongviec,
                    tailieucuatoi,
                    diadiem,
                    phonghop,
                    cuochop,
                    congvieccuatoi,
                    baocao_quytrinh,
                    baocao_duan,
                    dulieudaxoa,
                    phanquyen_vaitro,
                    phanquyen_nguoidung,
                    caidat,
                }
            )

            return functions.success(res, 'Edit role successfully', { listRole: req.listRole,data: {
                newRole: await Role.findOne({id: req.params.id})
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Failed to edit role', 500)
        }
    }

    // [DELETE] /roles/quan-ly-vai-tro/delete/:id
    async deleteVaiTro(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            await Role.deleteOne({id: req.params.id, com_id})

            return functions.success(res, 'Delete role successfully', {listRole: req.listRole,})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Failed to delete role', 500)
        }
    }

    // [GET] /roles/quan-ly-nguoi-dung
    async userRole(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            const page = req.params.page
            const keywords = req.query.keywords
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            let user = []
            if(keywords){
                user = await gv.findByName(-1, User, 'userName', keywords, 
                    {
                        type: 2,
                        'inForPerson.employee.com_id': com_id
                    },
                    {
                        _id: 1,
                        userName: 1,
                        emailContact: 1,
                        phone: 1,
                        'inForPerson.employee.dep_id': 1,
                        'inForPerson.employee.position_id': 1,
                    }
                )
            } else {
                user = await User.find(
                    {
                        type: 2,
                        'inForPerson.employee.com_id': com_id
                    }, 
                    {
                        _id: 1,
                        userName: 1,
                        emailContact: 1,
                        phone: 1,
                        'inForPerson.employee.dep_id': 1,
                        'inForPerson.employee.position_id': 1,
                    }
                )
                // .skip(10*page - 10).limit(10)
                .lean()
            }
            const listDep = await Dep.find({com_id}).lean()
            if(user){
                const count = user.length
                for(let i = 0; i < count; i++){
                    let permission = {}
                    permission = await Permission.findOne({
                        id_user: user[i]._id,
                        com_id,
                    }, {
                        _id: 0,
                        id: 1,
                        id_user: 1,
                        vaitro_id: 1,
                    })
                    if(!permission){
                        const perId = await functions.getMaxIdByField(Permission, 'id')
                        await new Permission({
                            id_user: user[i]._id,
                            com_id,
                            vaitro_id: 0,
                            id: perId,
                        }).save()
                        permission = await Permission.findOne({
                            id_user: user[i]._id,
                            com_id,
                        }, {
                            _id: 0,
                            id: 1,
                            id_user: 1,
                            vaitro_id: 1,
                        })
                    }
                    let vaitro = 'Trống'
                    if(permission.vaitro_id !== 0){
                        const role = await Role.findOne({id: permission.vaitro_id}, {
                            _id: 0,
                            name: 1,
                        })
                        if(role){
                            vaitro = role.name
                        }
                    }
                    user[i].vaitro = vaitro
                }
            }

            return functions.success(res, 'Get role details successfully', { listRole: req.listRole,data: {
                user,
                listDep,
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Failed to get role details', 500)
        }
    }

    // [PUT] /roles/quan-ly-nguoi-dung/edit/:id
    async editRole(req, res, next) {
        try {
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const id = req.params.id
            const {vaitro_id} = req.body
            await Permission.updateOne(
                {id_user: id},
                {
                    vaitro_id,
                }
            )
            functions.success(res, 'Edit role successfully', {listRole: req.listRole,})
        }catch(e){
            console.log(e)
            functions.setError(res, 'Failed to edit role', 500)
        }
    }

    // [GET] /roles/chi-tiet-vai-tro/:id
    async detailsVaitro(req, res){
        try{
            if(!req.user|| !req.user.data || !req.user.data.idQLC || !req.user.data._id || !req.user.data.type)
                return functions.setError(res, 'Failed to get user data', 401)
            let com_id
            const type = req.user.data.type
            if(type === 1) com_id = req.user.data.idQLC
            if(type === 2) com_id = req.user.data.com_id
            const id = req.params.id
            const role = await Role.find({
                id,
                com_id,
            }).lean()
            return functions.success(res, 'Get role successfully', { listRole: req.listRole,data: {
                role
            }})
        }catch(e){
            console.log(e)
            return functions.setError(res, 'Failed to get role', 500)
        }
    }
}
module.exports = new PermissionController()